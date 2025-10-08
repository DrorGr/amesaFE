import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

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
export class NotificationService {
  private notifications = signal<NotificationDto[]>([]);
  private unreadCount = signal<number>(0);

  constructor(private apiService: ApiService) {}

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
    return this.apiService.get<NotificationPreferencesDto>('notifications/preferences').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
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
    return this.apiService.put<NotificationPreferencesDto>('notifications/preferences', preferences).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update notification preferences');
      }),
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
    // This would integrate with SignalR for real-time updates
    // For now, we'll implement polling or WebSocket connection
    console.log('Subscribing to real-time notifications...');
  }

  // Unsubscribe from real-time notifications
  unsubscribeFromNotifications(): void {
    console.log('Unsubscribing from real-time notifications...');
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
