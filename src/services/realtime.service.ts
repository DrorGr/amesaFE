import { Injectable, signal, inject, Injector } from '@angular/core';
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

export enum SignalRErrorType {
  NetworkError = 'network',
  AuthenticationError = 'authentication',
  ServerError = 'server',
  TimeoutError = 'timeout',
  UnknownError = 'unknown'
}

export interface SignalRError {
  type: SignalRErrorType;
  message: string;
  originalError?: any;
  timestamp: Date;
  retryable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private connection: HubConnection | null = null;
  private isConnected = signal<boolean>(false);
  private connectionState = signal<HubConnectionState>(HubConnectionState.Disconnected);
  
  // Connection locking (prevents duplicate simultaneous connection attempts)
  private connectionLock: Promise<void> = Promise.resolve();
  private isConnecting = false;
  private connectionLockResolve: (() => void) | null = null;
  
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

  // Use Injector for lazy injection to break circular dependency: AuthService -> RealtimeService -> AuthService
  private injector = inject(Injector);
  private get authService(): AuthService | null {
    try {
      return this.injector.get(AuthService, null);
    } catch {
      return null;
    }
  }

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

  /**
   * Acquire connection lock
   * Returns true if lock acquired, false if already connecting
   */
  private async acquireConnectionLock(): Promise<boolean> {
    if (this.isConnecting) {
      return false;
    }
    
    this.isConnecting = true;
    this.connectionLock = new Promise((resolve) => {
      // Store resolve function to release lock later
      this.connectionLockResolve = resolve;
    });
    
    return true;
  }

  /**
   * Release connection lock
   */
  private releaseConnectionLock(): void {
    this.isConnecting = false;
    if (this.connectionLockResolve) {
      this.connectionLockResolve();
      this.connectionLockResolve = null;
    }
    // Reset lock to resolved promise for next use
    this.connectionLock = Promise.resolve();
  }

  /**
   * Handle connection errors with categorization and user notification
   */
  private handleConnectionError(error: any, context: string): SignalRError {
    const errorType = this.categorizeError(error);
    const errorMessage = this.getErrorMessage(error, errorType);
    const retryable = this.isRetryableError(errorType);
    
    const signalRError: SignalRError = {
      type: errorType,
      message: errorMessage,
      originalError: error,
      timestamp: new Date(),
      retryable
    };
    
    // Log error with context
    console.error(`[SignalR] ${context} error:`, {
      type: errorType,
      message: errorMessage,
      retryable,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    
    // Notify user for critical errors (non-retryable or auth errors)
    if (!retryable || errorType === SignalRErrorType.AuthenticationError) {
      // TODO: Integrate with notification service when available
      console.warn(`[SignalR] User notification needed: ${errorMessage}`);
    }
    
    return signalRError;
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: any): SignalRErrorType {
    if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
      return SignalRErrorType.TimeoutError;
    }
    
    if (error?.status === 401 || error?.status === 403) {
      return SignalRErrorType.AuthenticationError;
    }
    
    if (error?.status >= 500) {
      return SignalRErrorType.ServerError;
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return SignalRErrorType.NetworkError;
    }
    
    return SignalRErrorType.UnknownError;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any, type: SignalRErrorType): string {
    switch (type) {
      case SignalRErrorType.AuthenticationError:
        return 'Authentication failed. Please log in again.';
      case SignalRErrorType.TimeoutError:
        return 'Connection timeout. Please check your internet connection.';
      case SignalRErrorType.NetworkError:
        return 'Network error. Please check your internet connection.';
      case SignalRErrorType.ServerError:
        return 'Server error. Please try again later.';
      default:
        return error?.message || 'Connection failed. Please try again.';
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(type: SignalRErrorType): boolean {
    switch (type) {
      case SignalRErrorType.AuthenticationError:
        return false; // Auth errors should not retry
      case SignalRErrorType.NetworkError:
      case SignalRErrorType.TimeoutError:
      case SignalRErrorType.ServerError:
        return true; // These can be retried
      default:
        return true; // Default to retryable
    }
  }

  /**
   * Validate token before connection attempt
   * Returns true if token is valid and not expiring soon
   * Automatically refreshes token if expiring within 2 minutes
   */
  private async validateTokenBeforeConnection(): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[SignalR] No access token available');
      return false;
    }

    // Basic token format validation (JWT should have 3 parts)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('[SignalR] Invalid token format');
      return false;
    }

    // Check token expiration
    const expiresAtStr = localStorage.getItem('token_expires_at');
    if (expiresAtStr) {
      try {
        const expiresAt = new Date(expiresAtStr);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // If token expires within 2 minutes, refresh it first
        if (timeUntilExpiry > 0 && timeUntilExpiry < 2 * 60 * 1000) {
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
          console.log(`[SignalR] Token expiring in ${minutesUntilExpiry} minutes, refreshing before connection...`);
          
          if (this.authService) {
            try {
              await firstValueFrom(this.authService.refreshToken());
              console.log('[SignalR] Token refreshed successfully before connection');
              
              // Verify new token expiration
              const newExpiresAtStr = localStorage.getItem('token_expires_at');
              if (newExpiresAtStr) {
                const newExpiresAt = new Date(newExpiresAtStr);
                const newTimeUntilExpiry = newExpiresAt.getTime() - new Date().getTime();
                const newMinutesUntilExpiry = Math.floor(newTimeUntilExpiry / 60000);
                console.log(`[SignalR] New token expires in ${newMinutesUntilExpiry} minutes`);
              }
              
              return true;
            } catch (refreshError) {
              console.error('[SignalR] Token refresh failed before connection:', refreshError);
              // Return false to abort connection
              return false;
            }
          } else {
            console.warn('[SignalR] AuthService not available for token refresh');
            // Continue with existing token (may still work)
            return true;
          }
        }
        
        // If token already expired, don't attempt connection
        if (timeUntilExpiry <= 0) {
          console.warn('[SignalR] Token already expired, cannot connect');
          return false;
        }
      } catch (error) {
        console.error('[SignalR] Error checking token expiration:', error);
        // Continue with connection attempt if expiration check fails
        // (may be missing expiration info, but token might still be valid)
      }
    }

    return true;
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
    // Check if already connected
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      console.log('[SignalR] Already connected, skipping start');
      return;
    }

    // Clean up any existing stale connection before starting new one
    const staleConnection = this.connection;
    if (staleConnection) {
      console.log('[SignalR] Cleaning up stale connection before starting new one');
      try {
        // Force stop with timeout to prevent hanging
        const stopPromise = staleConnection.stop();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Stop timeout')), 3000);
        });
        await Promise.race([stopPromise, timeoutPromise]);
      } catch (error) {
        console.warn('[SignalR] Error cleaning up stale connection (continuing anyway):', error);
      } finally {
        // Always nullify connection and reset state
        this.connection = null;
        this.connectionState.set(HubConnectionState.Disconnected);
        this.isConnected.set(false);
        // Release any stuck lock
        this.releaseConnectionLock();
      }
    }

    // Acquire connection lock (prevent concurrent connection attempts)
    const lockAcquired = await this.acquireConnectionLock();
    if (!lockAcquired) {
      console.log('[SignalR] Connection already in progress, waiting for existing attempt...');
      
      // Add timeout to lock wait to prevent indefinite hanging
      const lockWaitTimeout = 10000; // 10 seconds
      const lockWaitPromise = this.connectionLock;
      const timeoutPromise: Promise<never> = new Promise((_, reject) => {
        setTimeout(() => {
          console.warn('[SignalR] Lock wait timeout, forcing lock release');
          this.releaseConnectionLock(); // Force release stuck lock
          reject(new Error('Connection lock wait timeout'));
        }, lockWaitTimeout);
      });
      
      try {
        await Promise.race([lockWaitPromise, timeoutPromise]);
      } catch (error) {
        console.warn('[SignalR] Lock wait failed, proceeding with new connection attempt');
      }
      
      // Check if connection succeeded while we were waiting
      // (connection could have been established by concurrent attempt during lock wait)
      // Use type assertion to work around TypeScript control flow narrowing
      const concurrentConnection = this.connection as HubConnection | null;
      if (concurrentConnection && concurrentConnection.state === HubConnectionState.Connected) {
        console.log('[SignalR] Connection established by concurrent attempt');
        return;
      }
      
      // If connection failed, we can try again
      // (lock will be released by previous attempt or timeout)
      console.log('[SignalR] Previous connection attempt failed, retrying...');
    }

    try {
      // Validate token before connection attempt
      const isValidToken = await this.validateTokenBeforeConnection();
      if (!isValidToken) {
        console.warn('[SignalR] Token validation failed, aborting connection');
        this.connectionState.set(HubConnectionState.Disconnected);
        this.isConnected.set(false);
        this.releaseConnectionLock();
        return;
      }
      // Get base URL and construct SignalR URL properly
      const baseUrl = this.apiService.getBaseUrl();
      
      // More robust URL construction - handle both absolute and relative URLs
      let wsUrl: string;
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        // Absolute URL: https://domain.com/api/v1
        try {
          const url = new URL(baseUrl);
          wsUrl = `${url.protocol}//${url.host}/ws/lottery`;
        } catch (urlError) {
          // Fallback to string replacement if URL parsing fails
          wsUrl = baseUrl.replace('/api/v1', '') + '/ws/lottery';
        }
      } else {
        // Relative URL: /api/v1
        wsUrl = '/ws/lottery';
      }

      // Get token from localStorage and append as query parameter
      // WebSocket connections don't support Authorization headers, so we must use query parameter
      const token = localStorage.getItem('access_token');
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}access_token=${encodeURIComponent(token)}`;
      }
      
      // Log connection attempt (mask token in logs)
      const logUrl = wsUrl.replace(/access_token=[^&]*/, 'access_token=***');
      console.log('[SignalR] Starting connection to:', logUrl);
      console.log('[SignalR] Base URL:', baseUrl);
      console.log('[SignalR] Transport: LongPolling');
      
      // Configure SignalR to use LongPolling (works through CloudFront)
      // CloudFront doesn't support WebSocket upgrades, so we skip WebSocket and use LongPolling
      // LongPolling provides real-time updates with 50-200ms latency (acceptable for production)
      this.connection = new HubConnectionBuilder()
        .withUrl(wsUrl, {
          transport: HttpTransportType.LongPolling, // Skip WebSocket, use LongPolling
          skipNegotiation: false, // Keep negotiation for compatibility
          accessTokenFactory: () => {
            const currentToken = localStorage.getItem('access_token');
            console.log('[SignalR] Access token factory called, token present:', !!currentToken);
            return currentToken || '';
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            const delay = retryContext.previousRetryCount < 3 ? 2000 :
                         retryContext.previousRetryCount < 10 ? 10000 : 30000;
            console.log(`[SignalR] Reconnect attempt ${retryContext.previousRetryCount}, delay: ${delay}ms`);
            return delay;
          }
        })
        .build();

      this.setupEventHandlers();
      
      // Add timeout to prevent hanging connections (increased to 15 seconds for long polling)
      const connectionTimeout = 15000; // 15 seconds (long polling can take longer)
      console.log(`[SignalR] Connection timeout set to ${connectionTimeout}ms`);
      
      const startPromise = this.connection.start();
      const timeoutPromise: Promise<never> = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('[SignalR] Connection timeout after 15 seconds');
          reject(new Error('SignalR connection timeout: Connection did not establish within 15 seconds'));
        }, connectionTimeout);
      });
      
      try {
        await Promise.race([startPromise, timeoutPromise]);
        console.log('[SignalR] Connection established successfully');
        console.log('[SignalR] Connection state:', this.connection.state);
        console.log('[SignalR] Connection ID:', this.connection.connectionId);
        this.connectionState.set(this.connection.state);
        this.isConnected.set(true);
      } catch (error: any) {
        // Handle connection error with categorization
        const signalRError = this.handleConnectionError(error, 'Connection start');
        
        // Clean up connection
        if (this.connection) {
          try {
            await this.connection.stop();
          } catch (stopError) {
            console.error('[SignalR] Error stopping failed connection:', stopError);
          }
          this.connection = null;
        }
        
        this.connectionState.set(HubConnectionState.Disconnected);
        this.isConnected.set(false);
        // Release lock before returning
        this.releaseConnectionLock();
        // Don't throw - allow app to continue without SignalR
        // Connection will retry automatically via automaticReconnect if retryable
        return;
      }
    } catch (error) {
      // Outer catch for any errors during connection setup
      const signalRError = this.handleConnectionError(error, 'Connection setup');
      
      this.connectionState.set(HubConnectionState.Disconnected);
      this.isConnected.set(false);
      // Release lock before returning
      this.releaseConnectionLock();
      // Don't throw - allow app to continue without SignalR
      return;
    } finally {
      // Always release lock when done (success or failure)
      // Check if lock was actually acquired (isConnecting might be false if lock wasn't acquired)
      if (this.isConnecting) {
        this.releaseConnectionLock();
      }
    }
  }

  async stopConnection(): Promise<void> {
    // Release lock first to prevent hanging
    this.releaseConnectionLock();
    
    if (this.connection) {
      try {
        // Stop connection with timeout to prevent hanging
        const stopPromise = this.connection.stop();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Stop timeout')), 5000);
        });
        
        await Promise.race([stopPromise, timeoutPromise]);
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
        // Force cleanup even if stop fails
      } finally {
        // Always nullify connection and reset state
        this.connection = null;
        this.connectionState.set(HubConnectionState.Disconnected);
        this.isConnected.set(false);
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
      if (this.authService) {
        try {
          await firstValueFrom(this.authService.refreshToken());
          console.log('Token refreshed successfully before SignalR reconnect');
        } catch (refreshError) {
          console.warn('Token refresh failed during SignalR reconnect:', refreshError);
          // Continue with reconnect anyway - accessTokenFactory will use current token
        }
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
    // Clean up all subscriptions
    this.lotteryUpdateSubject.complete();
    this.notificationSubject.complete();
    this.userStatusSubject.complete();
    this.generalEventSubject.complete();
    this.favoriteUpdateSubject.complete();
    this.entryStatusChangeSubject.complete();
    this.drawReminderSubject.complete();
    this.recommendationSubject.complete();
    this.inventoryUpdateSubject.complete();
    this.countdownUpdateSubject.complete();
    this.reservationStatusUpdateSubject.complete();
    
    // Stop connection
    this.stopConnection();
  }
}
