import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  deviceInfo?: Record<string, any>;
  createdAt: Date;
}

export interface SubscribePushRequest {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class WebPushService {
  private subscription = signal<PushSubscription | null>(null);
  private permissionStatus = signal<NotificationPermission>('default');
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(private apiService: ApiService) {
    this.checkPermission();
    this.registerServiceWorker();
  }

  getSubscription() {
    return computed(() => this.subscription());
  }

  getPermissionStatus() {
    return computed(() => this.permissionStatus());
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const permission = Notification.permission;
    this.permissionStatus.set(permission);
    return permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      this.permissionStatus.set('granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.permissionStatus.set('denied');
      throw new Error('Notification permission has been denied');
    }

    const permission = await Notification.requestPermission();
    this.permissionStatus.set(permission);
    return permission;
  }

  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported');
      return;
    }

    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        this.serviceWorkerRegistration = existingRegistration;
        console.log('Service Worker already registered');
        return;
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      this.serviceWorkerRegistration = registration;
      console.log('Service Worker registered successfully');
    } catch (error: any) {
      // Only log error if it's not a 404 (file doesn't exist yet)
      if (error?.message && !error.message.includes('404')) {
        console.error('Service Worker registration failed:', error);
      } else {
        console.warn('Service Worker file not found. Web push will not work until sw.js is deployed.');
      }
    }
  }

  async subscribeToPush(): Promise<Observable<PushSubscription>> {
    try {
      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
        if (!this.serviceWorkerRegistration) {
          throw new Error('Service Worker registration failed');
        }
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const vapidKey = await this.getVapidPublicKey();
      if (!vapidKey) {
        throw new Error('VAPID public key not available');
      }
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource
      });

      const subscriptionData: SubscribePushRequest = {
        endpoint: subscription.endpoint,
        p256dhKey: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        authKey: this.arrayBufferToBase64(subscription.getKey('auth')!),
        userAgent: navigator.userAgent,
        deviceInfo: {
          platform: navigator.platform,
          language: navigator.language,
          userAgent: navigator.userAgent
        }
      };

      return this.apiService.post<PushSubscription>('notifications/web-push/subscribe', subscriptionData).pipe(
        tap(response => {
          if (response.success && response.data) {
            this.subscription.set(response.data);
          }
        }),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error('Failed to subscribe to push notifications');
        }),
        catchError(error => {
          console.error('Error subscribing to push notifications:', error);
          return throwError(() => error);
        })
      );
    } catch (error) {
      console.error('Error in subscribeToPush:', error);
      return throwError(() => error);
    }
  }

  async unsubscribeFromPush(): Promise<Observable<boolean>> {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not registered');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (!subscription) {
        throw new Error('No active push subscription');
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      return this.apiService.post<boolean>('notifications/web-push/unsubscribe', { endpoint }).pipe(
        tap(response => {
          if (response.success) {
            this.subscription.set(null);
          }
        }),
        map(response => response.success),
        catchError(error => {
          console.error('Error unsubscribing from push notifications:', error);
          return throwError(() => error);
        })
      );
    } catch (error) {
      console.error('Error in unsubscribeFromPush:', error);
      return throwError(() => error);
    }
  }

  getSubscriptions(): Observable<PushSubscription[]> {
    return this.apiService.get<PushSubscription[]>('notifications/web-push/subscriptions').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching push subscriptions:', error);
        return throwError(() => error);
      })
    );
  }

  async handleNotificationClick(notification: Notification): Promise<void> {
    notification.close();
    window.focus();
    
    // Navigate to relevant page based on notification data
    if (notification.data) {
      const data = notification.data as any;
      if (data.url) {
        window.location.href = data.url;
      } else if (data.route) {
        // Use Angular router if available (injected via service)
        // For now, use window.location for navigation
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}${data.route}`;
      }
    }
  }

  private async getVapidPublicKey(): Promise<string> {
    try {
      const response = await this.apiService.get<string>('notifications/web-push/vapid-key').toPromise();
      if (response?.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch VAPID public key');
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      throw new Error('VAPID public key not available. Web push notifications cannot be enabled.');
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

