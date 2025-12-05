import { Component, OnInit, OnDestroy, inject, signal, effect, EffectRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebPushService, PushSubscription } from '../../services/web-push.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-web-push-permission',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="embedded ? 'w-full' : 'max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg'">
      <!-- Header (only shown when not embedded) -->
      @if (!embedded) {
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('notifications.webPush.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ translate('notifications.webPush.subtitle') }}
          </p>
        </div>
      }

      <!-- Browser Support Check -->
      @if (!isBrowserSupported()) {
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                {{ translate('notifications.webPush.notSupported') }}
              </h3>
              <p class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                {{ translate('notifications.webPush.notSupportedDescription') }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Permission Status -->
      @if (isBrowserSupported()) {
        <div class="space-y-6">
          <!-- Permission Status Card -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('notifications.webPush.status') }}
            </h3>
            
            <div class="space-y-3">
              <!-- Permission Status -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ translate('notifications.webPush.permission') }}
                </span>
                <span class="px-3 py-1 rounded-full text-sm font-medium"
                      [class.bg-green-100]="permissionStatus() === 'granted'"
                      [class.text-green-800]="permissionStatus() === 'granted'"
                      [class.dark:bg-green-900/30]="permissionStatus() === 'granted'"
                      [class.dark:text-green-300]="permissionStatus() === 'granted'"
                      [class.bg-yellow-100]="permissionStatus() === 'default'"
                      [class.text-yellow-800]="permissionStatus() === 'default'"
                      [class.dark:bg-yellow-900/30]="permissionStatus() === 'default'"
                      [class.dark:text-yellow-300]="permissionStatus() === 'default'"
                      [class.bg-red-100]="permissionStatus() === 'denied'"
                      [class.text-red-800]="permissionStatus() === 'denied'"
                      [class.dark:bg-red-900/30]="permissionStatus() === 'denied'"
                      [class.dark:text-red-300]="permissionStatus() === 'denied'">
                  @switch (permissionStatus()) {
                    @case ('granted') {
                      {{ translate('notifications.webPush.granted') }}
                    }
                    @case ('denied') {
                      {{ translate('notifications.webPush.denied') }}
                    }
                    @default {
                      {{ translate('notifications.webPush.notRequested') }}
                    }
                  }
                </span>
              </div>

              <!-- Subscription Status -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ translate('notifications.webPush.subscription') }}
                </span>
                <span class="px-3 py-1 rounded-full text-sm font-medium"
                      [class.bg-green-100]="subscription() !== null"
                      [class.text-green-800]="subscription() !== null"
                      [class.dark:bg-green-900/30]="subscription() !== null"
                      [class.dark:text-green-300]="subscription() !== null"
                      [class.bg-gray-100]="subscription() === null"
                      [class.text-gray-800]="subscription() === null"
                      [class.dark:bg-gray-800]="subscription() === null"
                      [class.dark:text-gray-300]="subscription() === null">
                  @if (subscription()) {
                    {{ translate('notifications.webPush.active') }}
                  } @else {
                    {{ translate('notifications.webPush.inactive') }}
                  }
                </span>
              </div>
            </div>
          </div>

          <!-- Subscription Info -->
          @if (subscription(); as sub) {
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 class="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
                {{ translate('notifications.webPush.subscriptionInfo') }}
              </h3>
              <div class="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <p>
                  <strong>{{ translate('notifications.webPush.endpoint') }}:</strong>
                  <span class="font-mono text-xs break-all">{{ sub.endpoint }}</span>
                </p>
                @if (sub.deviceInfo && sub.deviceInfo['platform']) {
                  <p>
                    <strong>{{ translate('notifications.webPush.device') }}:</strong>
                    {{ sub.deviceInfo['platform'] }}
                  </p>
                }
                <p>
                  <strong>{{ translate('notifications.webPush.created') }}:</strong>
                  {{ formatDate(sub.createdAt) }}
                </p>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="space-y-4">
            <!-- Request Permission / Subscribe -->
            @if (permissionStatus() !== 'granted') {
              <button
                (click)="requestPermission()"
                [disabled]="isRequesting() || permissionStatus() === 'denied'"
                class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                [attr.aria-label]="translate('notifications.webPush.requestPermission')">
                @if (isRequesting()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                } @else {
                  <i class="fas fa-bell mr-2"></i>
                }
                @if (permissionStatus() === 'denied') {
                  {{ translate('notifications.webPush.permissionDenied') }}
                } @else {
                  {{ translate('notifications.webPush.requestPermission') }}
                }
              </button>
              
              @if (permissionStatus() === 'denied') {
                <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {{ translate('notifications.webPush.deniedHint') }}
                </p>
              }
            }

            <!-- Subscribe Button (if permission granted but not subscribed) -->
            @if (permissionStatus() === 'granted' && !subscription()) {
              <button
                (click)="subscribe()"
                [disabled]="isSubscribing()"
                class="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                [attr.aria-label]="translate('notifications.webPush.subscribe')">
                @if (isSubscribing()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                } @else {
                  <i class="fas fa-check-circle mr-2"></i>
                }
                {{ translate('notifications.webPush.subscribe') }}
              </button>
            }

            <!-- Unsubscribe Button (if subscribed) -->
            @if (subscription()) {
              <button
                (click)="unsubscribe()"
                [disabled]="isUnsubscribing()"
                class="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                [attr.aria-label]="translate('notifications.webPush.unsubscribe')">
                @if (isUnsubscribing()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                } @else {
                  <i class="fas fa-times-circle mr-2"></i>
                }
                {{ translate('notifications.webPush.unsubscribe') }}
              </button>
            }
          </div>

          <!-- Instructions -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('notifications.webPush.howItWorks') }}
            </h3>
            <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>{{ translate('notifications.webPush.step1') }}</li>
              <li>{{ translate('notifications.webPush.step2') }}</li>
              <li>{{ translate('notifications.webPush.step3') }}</li>
            </ol>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ errorMessage() }}
          </p>
        </div>
      }

      <!-- Success Message -->
      @if (successMessage()) {
        <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p class="text-sm text-green-800 dark:text-green-200">
            {{ successMessage() }}
          </p>
        </div>
      }
    </div>
  `
})
export class WebPushPermissionComponent implements OnInit, OnDestroy {
  @Input() embedded: boolean = false;
  
  private webPushService = inject(WebPushService);
  private translationService = inject(TranslationService);
  private logger = inject(LoggingService);

  subscription = signal<PushSubscription | null>(null);
  permissionStatus = signal<NotificationPermission>('default');
  isLoading = signal<boolean>(true);
  isRequesting = signal<boolean>(false);
  isSubscribing = signal<boolean>(false);
  isUnsubscribing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private subscriptionEffect?: EffectRef;
  private permissionEffect?: EffectRef;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadStatus();
    
    // Watch subscription changes
    this.subscriptionEffect = effect(() => {
      const sub = this.webPushService.getSubscription()();
      this.subscription.set(sub);
    });

    // Watch permission status changes
    this.permissionEffect = effect(() => {
      const status = this.webPushService.getPermissionStatus()();
      this.permissionStatus.set(status);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Effects are automatically cleaned up by Angular
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  isBrowserSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  async loadStatus(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // Check permission
      await this.webPushService.checkPermission();
      
      // Load subscriptions
      const sub = this.webPushService.getSubscriptions().subscribe({
        next: (subscriptions) => {
          if (subscriptions.length > 0) {
            this.subscription.set(subscriptions[0]);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.logger.error('Failed to load web push subscriptions', error);
          this.isLoading.set(false);
        }
      });
      this.subscriptions.add(sub);
    } catch (error) {
      this.logger.error('Failed to load web push status', error);
      this.isLoading.set(false);
    }
  }

  async requestPermission(): Promise<void> {
    this.isRequesting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const permission = await this.webPushService.requestPermission();
      this.permissionStatus.set(permission);
      
      if (permission === 'granted') {
        this.successMessage.set(this.translate('notifications.webPush.permissionGranted'));
        // Auto-subscribe after permission is granted
        setTimeout(() => {
          this.subscribe();
        }, 500);
      } else {
        this.errorMessage.set(this.translate('notifications.webPush.permissionDenied'));
      }
    } catch (error: any) {
      this.logger.error('Failed to request permission', error);
      this.errorMessage.set(error.message || this.translate('notifications.webPush.requestError'));
    } finally {
      this.isRequesting.set(false);
    }
  }

  async subscribe(): Promise<void> {
    this.isSubscribing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const subscriptionObs = await this.webPushService.subscribeToPush();
      subscriptionObs.subscribe({
        next: (subscription) => {
          this.subscription.set(subscription);
          this.isSubscribing.set(false);
          this.successMessage.set(this.translate('notifications.webPush.subscribeSuccess'));
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage.set(null);
          }, 3000);
        },
        error: (error: any) => {
          this.logger.error('Failed to subscribe to web push', error);
          this.errorMessage.set(error.message || this.translate('notifications.webPush.subscribeError'));
          this.isSubscribing.set(false);
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to subscribe to web push', error);
      this.errorMessage.set(error.message || this.translate('notifications.webPush.subscribeError'));
      this.isSubscribing.set(false);
    }
  }

  async unsubscribe(): Promise<void> {
    if (!confirm(this.translate('notifications.webPush.unsubscribeConfirm'))) {
      return;
    }

    this.isUnsubscribing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const unsubscribeObs = await this.webPushService.unsubscribeFromPush();
      unsubscribeObs.subscribe({
        next: (success) => {
          if (success) {
            this.subscription.set(null);
            this.isUnsubscribing.set(false);
            this.successMessage.set(this.translate('notifications.webPush.unsubscribeSuccess'));
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              this.successMessage.set(null);
            }, 3000);
          }
        },
        error: (error: any) => {
          this.logger.error('Failed to unsubscribe from web push', error);
          this.errorMessage.set(error.message || this.translate('notifications.webPush.unsubscribeError'));
          this.isUnsubscribing.set(false);
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to unsubscribe from web push', error);
      this.errorMessage.set(error.message || this.translate('notifications.webPush.unsubscribeError'));
      this.isUnsubscribing.set(false);
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }
}

