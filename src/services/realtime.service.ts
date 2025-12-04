import { Injectable, signal, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType } from '@microsoft/signalr';
import { Subject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export interface LotteryUpdateEvent {
  houseId: string;
  houseTitle: string;
  ticketsSold: number;
  totalTickets: number;
  participationPercentage: number;
  timeRemaining: number;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  language?: string; // User's language preference for localized notifications
  locale?: string; // User's locale for date/number formatting
}

export interface UserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface FavoriteUpdateEvent {
  houseId: string;
  updateType: 'added' | 'removed';
  houseTitle?: string;
  timestamp: Date;
}

export interface EntryStatusChangeEvent {
  ticketId: string;
  newStatus: 'active' | 'winner' | 'refunded';
  houseId: string;
  houseTitle?: string;
  timestamp: Date;
}

export interface DrawReminderEvent {
  houseId: string;
  houseTitle: string;
  timeRemaining: number; // seconds
  timestamp: Date;
}

export interface RecommendationEvent {
  newHouseId: string;
  houseTitle: string;
  reason: string;
  timestamp: Date;
}

export interface InventoryUpdateEvent {
  houseId: string;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  isSoldOut: boolean;
  updatedAt: Date;
}

export interface CountdownUpdateEvent {
  houseId: string;
  timeRemaining: number; // milliseconds
  isEnded: boolean;
  lotteryEndDate: Date;
}

export interface ReservationStatusUpdateEvent {
  reservationId: string;
  status: string;
  errorMessage?: string;
  processedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private connection: HubConnection | null = null;
  private isConnected = signal<boolean>(false);
  private connectionState = signal<HubConnectionState>(HubConnectionState.Disconnected);
  
  // Event subjects
  private lotteryUpdateSubject = new Subject<LotteryUpdateEvent>();
  private notificationSubject = new Subject<NotificationEvent>();
  private userStatusSubject = new Subject<UserStatusEvent>();
  private generalEventSubject = new Subject<RealtimeEvent>();
  
  // Lottery Favorites & Entry Management events
  private favoriteUpdateSubject = new Subject<FavoriteUpdateEvent>();
  private entryStatusChangeSubject = new Subject<EntryStatusChangeEvent>();
  private drawReminderSubject = new Subject<DrawReminderEvent>();
  private recommendationSubject = new Subject<RecommendationEvent>();
  
  // Reservation system events
  private inventoryUpdateSubject = new Subject<InventoryUpdateEvent>();
  private countdownUpdateSubject = new Subject<CountdownUpdateEvent>();
  private reservationStatusUpdateSubject = new Subject<ReservationStatusUpdateEvent>();

  // Public observables
  public lotteryUpdates$ = this.lotteryUpdateSubject.asObservable();
  public notifications$ = this.notificationSubject.asObservable();
  public userStatusUpdates$ = this.userStatusSubject.asObservable();
  public generalEvents$ = this.generalEventSubject.asObservable();
  
  // Lottery Favorites & Entry Management observables
  public favoriteUpdates$ = this.favoriteUpdateSubject.asObservable();
  public entryStatusChanges$ = this.entryStatusChangeSubject.asObservable();
  public drawReminders$ = this.drawReminderSubject.asObservable();
  public recommendations$ = this.recommendationSubject.asObservable();
  
  // Reservation system observables
  public inventoryUpdates$ = this.inventoryUpdateSubject.asObservable();
  public countdownUpdates$ = this.countdownUpdateSubject.asObservable();
  public reservationStatusUpdates$ = this.reservationStatusUpdateSubject.asObservable();

  private authService = inject(AuthService);

  constructor(private apiService: ApiService) {}

  getConnectionState() {
    return this.connectionState.asReadonly();
  }

  getIsConnected() {
    return this.isConnected.asReadonly();
  }

  getConnection(): HubConnection | null {
    return this.connection;
  }

  onConnected(): Observable<void> {
    const subject = new Subject<void>();
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      subject.next();
      subject.complete();
    } else {
      let checkConnection: any = null;
      let timeoutId: any = null;
      
      // Set 10 second timeout to prevent infinite polling
      timeoutId = setTimeout(() => {
        if (checkConnection) {
          clearInterval(checkConnection);
          checkConnection = null;
        }
        subject.error(new Error('Connection timeout: SignalR connection did not establish within 10 seconds'));
      }, 10000);
      
      checkConnection = setInterval(() => {
        if (this.connection && this.connection.state === HubConnectionState.Connected) {
          // Clear both interval and timeout on success
          if (checkConnection) {
            clearInterval(checkConnection);
            checkConnection = null;
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          subject.next();
          subject.complete();
        }
      }, 100);
    }
    return subject.asObservable();
  }

  async startConnection(): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      // Get base URL and construct SignalR URL (remove /api/v1 for WebSocket endpoint)
      const baseUrl = this.apiService.getBaseUrl();
      let wsUrl = baseUrl.replace('/api/v1', '') + '/ws/lottery';

      // Get token from localStorage and append as query parameter
      // WebSocket connections don't support Authorization headers, so we must use query parameter
      const token = localStorage.getItem('access_token');
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}access_token=${encodeURIComponent(token)}`;
      }
      
      // Configure SignalR to use LongPolling (works through CloudFront)
      // CloudFront doesn't support WebSocket upgrades, so we skip WebSocket and use LongPolling
      // LongPolling provides real-time updates with 50-200ms latency (acceptable for production)
      this.connection = new HubConnectionBuilder()
        .withUrl(wsUrl, {
          transport: HttpTransportType.LongPolling, // Skip WebSocket, use LongPolling
          skipNegotiation: false, // Keep negotiation for compatibility
          accessTokenFactory: () => {
            return localStorage.getItem('access_token') || '';
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount < 3) {
              return 2000; // 2 seconds
            } else if (retryContext.previousRetryCount < 10) {
              return 10000; // 10 seconds
            } else {
              return 30000; // 30 seconds
            }
          }
        })
        .build();

      this.setupEventHandlers();
      
      await this.connection.start();
      this.connectionState.set(this.connection.state);
      this.isConnected.set(true);
      
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionState.set(HubConnectionState.Disconnected);
      this.isConnected.set(false);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.connectionState.set(HubConnectionState.Disconnected);
        this.isConnected.set(false);
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection state changes
    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionState.set(HubConnectionState.Disconnected);
      this.isConnected.set(false);
    });

    this.connection.onreconnecting(async (error) => {
      console.log('SignalR reconnecting:', error);
      this.connectionState.set(HubConnectionState.Reconnecting);
      this.isConnected.set(false);
      
      // Refresh token before reconnecting to ensure valid authentication
      try {
        await firstValueFrom(this.authService.refreshToken());
        console.log('Token refreshed successfully before SignalR reconnect');
      } catch (refreshError) {
        console.warn('Token refresh failed during SignalR reconnect:', refreshError);
        // Continue with reconnect anyway - accessTokenFactory will use current token
      }
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionState.set(HubConnectionState.Connected);
      this.isConnected.set(true);
    });

    // Lottery events
    this.connection.on('LotteryUpdate', (data: LotteryUpdateEvent) => {
      this.lotteryUpdateSubject.next(data);
    });

    this.connection.on('LotteryDrawStarted', (data: any) => {
      this.generalEventSubject.next({
        type: 'lottery_draw_started',
        data,
        timestamp: new Date()
      });
    });

    this.connection.on('LotteryDrawCompleted', (data: any) => {
      this.generalEventSubject.next({
        type: 'lottery_draw_completed',
        data,
        timestamp: new Date()
      });
    });

    this.connection.on('TicketPurchased', (data: any) => {
      this.generalEventSubject.next({
        type: 'ticket_purchased',
        data,
        timestamp: new Date()
      });
    });

    // Notification events
    this.connection.on('Notification', (data: NotificationEvent) => {
      this.notificationSubject.next(data);
    });

    this.connection.on('SystemAnnouncement', (data: any) => {
      this.generalEventSubject.next({
        type: 'system_announcement',
        data,
        timestamp: new Date()
      });
    });

    // User status events
    this.connection.on('UserStatusUpdate', (data: UserStatusEvent) => {
      this.userStatusSubject.next(data);
    });

    // General events
    this.connection.on('GeneralEvent', (data: RealtimeEvent) => {
      this.generalEventSubject.next(data);
    });

    // Lottery Favorites & Entry Management events (BE-2.3)
    this.connection.on('FavoriteUpdate', (data: FavoriteUpdateEvent) => {
      this.favoriteUpdateSubject.next({
        ...data,
        timestamp: new Date()
      });
    });

    this.connection.on('EntryStatusChange', (data: EntryStatusChangeEvent) => {
      this.entryStatusChangeSubject.next({
        ...data,
        timestamp: new Date()
      });
    });

    this.connection.on('DrawReminder', (data: DrawReminderEvent) => {
      this.drawReminderSubject.next({
        ...data,
        timestamp: new Date()
      });
    });

    this.connection.on('Recommendation', (data: RecommendationEvent) => {
      this.recommendationSubject.next({
        ...data,
        timestamp: new Date()
      });
    });

    // Reservation system events
    this.connection.on('InventoryUpdated', (data: InventoryUpdateEvent) => {
      this.inventoryUpdateSubject.next({
        ...data,
        updatedAt: new Date(data.updatedAt)
      });
    });

    this.connection.on('CountdownUpdated', (data: CountdownUpdateEvent) => {
      this.countdownUpdateSubject.next({
        ...data,
        lotteryEndDate: new Date(data.lotteryEndDate)
      });
    });

    this.connection.on('ReservationStatusChanged', (data: ReservationStatusUpdateEvent) => {
      this.reservationStatusUpdateSubject.next({
        ...data,
        processedAt: data.processedAt ? new Date(data.processedAt) : undefined
      });
    });
  }

  // Hub method calls
  async joinLotteryGroup(houseId: string): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinLotteryGroup', houseId);
        console.log(`Joined lottery group for house: ${houseId}`);
      } catch (error) {
        console.error('Error joining lottery group:', error);
      }
    }
  }

  async leaveLotteryGroup(houseId: string): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveLotteryGroup', houseId);
        console.log(`Left lottery group for house: ${houseId}`);
      } catch (error) {
        console.error('Error leaving lottery group:', error);
      }
    }
  }

  async joinUserGroup(userId: string): Promise<void> {
    // NOTE: User groups are automatically handled by the backend LotteryHub.OnConnectedAsync()
    // The backend adds users to user_{userId} group automatically when they connect
    // No explicit JoinUserGroup method exists or is needed
    console.log(`User group membership handled automatically by backend for user: ${userId}`);
  }

  async leaveUserGroup(userId: string): Promise<void> {
    // NOTE: User groups are automatically handled by the backend LotteryHub.OnDisconnectedAsync()
    // The backend removes users from user_{userId} group automatically when they disconnect
    // No explicit LeaveUserGroup method exists or is needed
    console.log(`User group membership handled automatically by backend for user: ${userId}`);
  }

  async sendMessage(groupName: string, message: string): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SendMessage', groupName, message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  // Utility methods
  isConnectionReady(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }

  // Auto-reconnect logic
  async ensureConnection(): Promise<void> {
    if (!this.isConnectionReady()) {
      await this.startConnection();
    }
  }

  // Cleanup
  ngOnDestroy(): void {
    this.stopConnection();
  }
}
