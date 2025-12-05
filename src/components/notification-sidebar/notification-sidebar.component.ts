import { Component, inject, signal, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationDto } from '../../services/notification.service';
import { TranslationService } from '../../services/translation.service';
import { RealtimeService } from '../../services/realtime.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-[110] transition-opacity duration-300 ease-in-out"
        (click)="close()"
        [attr.aria-label]="translate('notifications.sidebar.close')">
      </div>
    }
    
    <!-- Sidebar -->
    <div 
      class="fixed right-0 top-0 h-full w-80 md:w-96 bg-white dark:bg-gray-900 shadow-xl z-[110] transform transition-transform duration-300 ease-in-out"
      [class.translate-x-0]="isOpen()"
      [class.translate-x-full]="!isOpen()"
      role="dialog"
      [attr.aria-label]="translate('notifications.sidebar.title')"
      [attr.aria-modal]="isOpen()">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-500">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">
            {{ translate('notifications.sidebar.title') }}
          </h2>
          <button
            (click)="close()"
            (keydown.enter)="close()"
            (keydown.space)="close(); $event.preventDefault()"
            (keydown.escape)="close()"
            [attr.aria-label]="translate('notifications.sidebar.close')"
            class="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20 focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mark All as Read Button -->
      @if (notifications().length > 0 && unreadCount() > 0) {
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            (click)="markAllAsRead()"
            (keydown.enter)="markAllAsRead()"
            (keydown.space)="markAllAsRead(); $event.preventDefault()"
            [disabled]="isMarkingAllAsRead()"
            [attr.aria-label]="translate('notifications.sidebar.markAllRead')"
            class="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ translate('notifications.sidebar.markAllRead') }}
          </button>
        </div>
      }

      <!-- Content -->
      <div class="overflow-y-auto h-[calc(100vh-64px)] p-4">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && notifications().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 px-4">
            <svg class="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 text-center">
              {{ translate('notifications.sidebar.empty') }}
            </p>
          </div>
        }

        <!-- Notifications List -->
        @if (!isLoading() && notifications().length > 0) {
          <div class="space-y-4">
            @for (notification of notifications(); track notification.id) {
              <div 
                class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                [class.bg-blue-50]="!notification.isRead"
                [class.dark:bg-blue-900/20]="!notification.isRead"
                [class.border-l-4]="!notification.isRead"
                [class.border-blue-600]="!notification.isRead">
                
                <div class="p-4">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex-1 min-w-0">
                      <h3 
                        class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                        [class.font-bold]="!notification.isRead"
                        [class.text-gray-500]="notification.isRead"
                        [class.dark:text-gray-400]="notification.isRead">
                        {{ notification.title }}
                      </h3>
                      <p 
                        class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2"
                        [class.text-gray-500]="notification.isRead"
                        [class.dark:text-gray-400]="notification.isRead">
                        {{ notification.message }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(notification.createdAt) }}
                    </span>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      @if (!notification.isRead) {
                        <button
                          (click)="markAsRead(notification.id); $event.stopPropagation()"
                          (keydown.enter)="markAsRead(notification.id); $event.stopPropagation()"
                          (keydown.space)="markAsRead(notification.id); $event.preventDefault(); $event.stopPropagation()"
                          [attr.aria-label]="translate('notifications.sidebar.markAsRead')"
                          class="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </button>
                      }
                      <button
                        (click)="deleteNotification(notification.id); $event.stopPropagation()"
                        (keydown.enter)="deleteNotification(notification.id); $event.stopPropagation()"
                        (keydown.space)="deleteNotification(notification.id); $event.preventDefault(); $event.stopPropagation()"
                        [attr.aria-label]="translate('notifications.sidebar.delete')"
                        class="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationSidebarComponent implements OnInit, OnDestroy {
  isOpen = signal(false);
  
  @Input() 
  set isOpenInput(value: boolean) {
    this.isOpen.set(value);
  }
  
  @Output() closeEvent = new EventEmitter<void>();

  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private realtimeService = inject(RealtimeService);
  private toastService = inject(ToastService);

  notifications = signal<NotificationDto[]>([]);
  isLoading = signal(false);
  isMarkingAllAsRead = signal(false);
  unreadCount = this.notificationService.getUnreadCount();

  private subscriptions = new Subscription();

  constructor() {
    // Watch for isOpen changes using effect
    effect(() => {
      if (this.isOpen()) {
        this.loadNotifications();
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to real-time notifications
    this.subscriptions.add(
      this.realtimeService.notifications$.subscribe((event: any) => {
        if (this.isOpen()) {
          this.loadNotifications();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.closeEvent.emit();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    const sub = this.notificationService.getUserNotifications().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.toastService.error('Failed to load notifications', 3000);
        this.isLoading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  markAsRead(notificationId: string): void {
    const sub = this.notificationService.markAsRead(notificationId).subscribe({
      next: (success) => {
        if (success) {
          // Update local state
          const notifications = this.notifications().map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          );
          this.notifications.set(notifications);
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.toastService.error('Failed to mark notification as read', 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  markAllAsRead(): void {
    this.isMarkingAllAsRead.set(true);
    const sub = this.notificationService.markAllAsRead().subscribe({
      next: (success) => {
        if (success) {
          // Update local state
          const notifications = this.notifications().map(n => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date()
          }));
          this.notifications.set(notifications);
          this.toastService.success('All notifications marked as read', 2000);
        }
        this.isMarkingAllAsRead.set(false);
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
        this.toastService.error('Failed to mark all notifications as read', 3000);
        this.isMarkingAllAsRead.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  deleteNotification(notificationId: string): void {
    const sub = this.notificationService.deleteNotification(notificationId).subscribe({
      next: (success) => {
        if (success) {
          // Remove from local state
          const notifications = this.notifications().filter(n => n.id !== notificationId);
          this.notifications.set(notifications);
          this.toastService.success('Notification deleted', 2000);
        }
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.toastService.error('Failed to delete notification', 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

