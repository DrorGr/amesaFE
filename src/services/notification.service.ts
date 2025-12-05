import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Observable, throwError, Subject, forkJoin, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { RealtimeService } from './realtime.service';
import { Subscription } from 'rxjs';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
  readAt?: Date;
}

// Backend DTOs
interface ChannelPreferencesDto {
  id: string;
  userId: string;
  channel: string;
  enabled: boolean;
  notificationTypes?: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface UpdateChannelPreferencesRequest {
  channel: string;
  enabled?: boolean;
  notificationTypes?: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Frontend DTOs
export interface NotificationPreferencesDto {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  lotteryUpdates: boolean;
  paymentNotifications: boolean;
  systemAnnouncements: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  lotteryUpdates?: boolean;
  paymentNotifications?: boolean;
  systemAnnouncements?: boolean;
}

export interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notifications = signal<NotificationDto[]>([]);
  private unreadCount = signal<number>(0);
  private realtimeService = inject(RealtimeService);
  private subscription?: Subscription;

  constructor(private apiService: ApiService) {
    this.subscribeToNotifications();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromNotifications();
  }

  getNotifications() {
    return this.notifications.asReadonly();
  }

  getUnreadCount() {
    return this.unreadCount.asReadonly();
  }

  // Get user notifications
  getUserNotifications(): Observable<NotificationDto[]> {
    return this.apiService.get<NotificationDto[]>('notifications').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.notifications.set(response.data);
          this.updateUnreadCount();
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch notifications');
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return throwError(() => error);
      })
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<boolean> {
    return this.apiService.put(`notifications/${notificationId}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.updateNotificationReadStatus(notificationId, true);
          this.updateUnreadCount();
        }
      }),
      map(response => response.success),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return throwError(() => error);
      })
    );
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<boolean> {
    return this.apiService.put('notifications/read-all', {}).pipe(
      tap(response => {
        if (response.success) {
          this.markAllNotificationsAsRead();
          this.updateUnreadCount();
        }
      }),
      map(response => response.success),
      catchError(error => {
        console.error('Error marking all notifications as read:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<boolean> {
    return this.apiService.delete(`notifications/${notificationId}`).pipe(
      tap(response => {
        if (response.success) {
          this.removeNotification(notificationId);
          this.updateUnreadCount();
        }
      }),
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting notification:', error);
        return throwError(() => error);
      })
    );
  }

  // Get notification preferences
  getNotificationPreferences(): Observable<NotificationPreferencesDto> {
    return this.apiService.get<ChannelPreferencesDto[]>('notifications/preferences/channels').pipe(
      map(response => {
        if (response.success && response.data) {
          // Transform backend List<ChannelPreferencesDto> to frontend NotificationPreferencesDto
          const channels = response.data;
          const emailChannel = channels.find(c => c.channel.toLowerCase() === 'email');
          const smsChannel = channels.find(c => c.channel.toLowerCase() === 'sms');
          const pushChannel = channels.find(c => c.channel.toLowerCase() === 'push' || c.channel.toLowerCase() === 'webpush');
          
          // Extract notification types from channels
          const allNotificationTypes = new Set<string>();
          channels.forEach(c => {
            if (c.notificationTypes) {
              c.notificationTypes.forEach(t => allNotificationTypes.add(t.toLowerCase()));
            }
          });

          return {
            emailNotifications: emailChannel?.enabled ?? true,
            smsNotifications: smsChannel?.enabled ?? false,
            pushNotifications: pushChannel?.enabled ?? false,
            marketingEmails: allNotificationTypes.has('marketing'),
            lotteryUpdates: allNotificationTypes.has('lottery'),
            paymentNotifications: allNotificationTypes.has('payment'),
            systemAnnouncements: allNotificationTypes.has('system')
          };
        }
        throw new Error('Failed to fetch notification preferences');
      }),
      catchError(error => {
        console.error('Error fetching notification preferences:', error);
        return throwError(() => error);
      })
    );
  }

  // Update notification preferences
  updateNotificationPreferences(preferences: UpdateNotificationPreferencesRequest): Observable<NotificationPreferencesDto> {
    // Build notification types list
    const notificationTypes: string[] = [];
    if (preferences.marketingEmails) notificationTypes.push('Marketing');
    if (preferences.lotteryUpdates) notificationTypes.push('Lottery');
    if (preferences.paymentNotifications) notificationTypes.push('Payment');
    if (preferences.systemAnnouncements) notificationTypes.push('System');

    // Update each channel separately (backend requires one channel per request)
    const updates: Observable<any>[] = [];

    if (preferences.emailNotifications !== undefined) {
      updates.push(
        this.apiService.put<ChannelPreferencesDto>('notifications/preferences/channels', {
          channel: 'Email',
          enabled: preferences.emailNotifications,
          notificationTypes: preferences.emailNotifications ? notificationTypes : []
        } as UpdateChannelPreferencesRequest)
      );
    }

    if (preferences.smsNotifications !== undefined) {
      updates.push(
        this.apiService.put<ChannelPreferencesDto>('notifications/preferences/channels', {
          channel: 'SMS',
          enabled: preferences.smsNotifications,
          notificationTypes: preferences.smsNotifications ? notificationTypes : []
        } as UpdateChannelPreferencesRequest)
      );
    }

    if (preferences.pushNotifications !== undefined) {
      updates.push(
        this.apiService.put<ChannelPreferencesDto>('notifications/preferences/channels', {
          channel: 'WebPush',
          enabled: preferences.pushNotifications,
          notificationTypes: preferences.pushNotifications ? notificationTypes : []
        } as UpdateChannelPreferencesRequest)
      );
    }

    // If no channel updates, update notification types only
    if (updates.length === 0 && notificationTypes.length > 0) {
      // Update all enabled channels with new notification types
      updates.push(
        this.apiService.put<ChannelPreferencesDto>('notifications/preferences/channels', {
          channel: 'Email',
          notificationTypes: notificationTypes
        } as UpdateChannelPreferencesRequest)
      );
    }

    if (updates.length === 0) {
      // No updates to make, return current preferences
      return this.getNotificationPreferences();
    }

    // Execute all updates in parallel, then fetch updated preferences
    return forkJoin(updates).pipe(
      switchMap(() => this.getNotificationPreferences()),
      catchError(error => {
        console.error('Error updating notification preferences:', error);
        return throwError(() => error);
      })
    );
  }

  // Send notification (admin only)
  sendNotification(notificationData: SendNotificationRequest): Observable<boolean> {
    return this.apiService.post('notifications/send', notificationData).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error sending notification:', error);
        return throwError(() => error);
      })
    );
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(): void {
    if (this.subscription) {
      return; // Already subscribed
    }

    // Subscribe to notification events from RealtimeService
    this.subscription = this.realtimeService.notifications$.subscribe((event: any) => {
      const notification: NotificationDto = {
        id: event.id,
        type: event.type,
        title: event.title,
        message: event.message,
        data: event.data,
        isRead: false,
        createdAt: event.timestamp || new Date()
      };
      const current = this.notifications();
      this.notifications.set([notification, ...current]);
      this.updateUnreadCount();
    });

    console.log('Subscribed to real-time notifications via SignalR');
  }

  // Unsubscribe from real-time notifications
  unsubscribeFromNotifications(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
      console.log('Unsubscribed from real-time notifications');
    }
  }

  // Private helper methods
  private updateUnreadCount(): void {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  private updateNotificationReadStatus(notificationId: string, isRead: boolean): void {
    const notifications = this.notifications().map(notification => {
      if (notification.id === notificationId) {
        return {
          ...notification,
          isRead,
          readAt: isRead ? new Date() : undefined
        };
      }
      return notification;
    });
    this.notifications.set(notifications);
  }

  private markAllNotificationsAsRead(): void {
    const notifications = this.notifications().map(notification => ({
      ...notification,
      isRead: true,
      readAt: new Date()
    }));
    this.notifications.set(notifications);
  }

  private removeNotification(notificationId: string): void {
    const notifications = this.notifications().filter(n => n.id !== notificationId);
    this.notifications.set(notifications);
  }
}
