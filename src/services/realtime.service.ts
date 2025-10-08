import { Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../environments/environment';

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
}

export interface UserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
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

  // Public observables
  public lotteryUpdates$ = this.lotteryUpdateSubject.asObservable();
  public notifications$ = this.notificationSubject.asObservable();
  public userStatusUpdates$ = this.userStatusSubject.asObservable();
  public generalEvents$ = this.generalEventSubject.asObservable();

  constructor() {}

  getConnectionState() {
    return this.connectionState.asReadonly();
  }

  getIsConnected() {
    return this.isConnected.asReadonly();
  }

  async startConnection(): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${environment.backendUrl}/ws/lottery`, {
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

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.connectionState.set(HubConnectionState.Reconnecting);
      this.isConnected.set(false);
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
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinUserGroup', userId);
        console.log(`Joined user group for user: ${userId}`);
      } catch (error) {
        console.error('Error joining user group:', error);
      }
    }
  }

  async leaveUserGroup(userId: string): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveUserGroup', userId);
        console.log(`Left user group for user: ${userId}`);
      } catch (error) {
        console.error('Error leaving user group:', error);
      }
    }
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
