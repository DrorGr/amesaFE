import { Component, OnInit, OnDestroy, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationPreferencesDto, UpdateNotificationPreferencesRequest } from '../../services/notification.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="embedded ? 'w-full' : 'max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg'">
      <!-- Header (only shown when not embedded) -->
      @if (!embedded) {
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('notifications.preferences.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ translate('notifications.preferences.subtitle') }}
          </p>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Preferences Form -->
      @if (!isLoading() && preferences()) {
        <form (ngSubmit)="savePreferences()" class="space-y-6">
          <!-- Channel Preferences -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {{ translate('notifications.preferences.channels') }}
            </h2>

            <!-- Email Notifications -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.email') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.emailDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.emailNotifications"
                    name="emailNotifications"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.email')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.emailNotifications"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.emailNotifications"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- SMS Notifications -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.sms') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.smsDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.smsNotifications"
                    name="smsNotifications"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.sms')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.smsNotifications"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.smsNotifications"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Push Notifications -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.push') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.pushDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.pushNotifications"
                    name="pushNotifications"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.push')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.pushNotifications"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.pushNotifications"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Notification Types -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {{ translate('notifications.preferences.types') }}
            </h2>

            <!-- Marketing Emails -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.marketing') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.marketingDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.marketingEmails"
                    name="marketingEmails"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.marketing')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.marketingEmails"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.marketingEmails"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Lottery Updates -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.lottery') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.lotteryDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.lotteryUpdates"
                    name="lotteryUpdates"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.lottery')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.lotteryUpdates"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.lotteryUpdates"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Payment Notifications -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.payment') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.paymentDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.paymentNotifications"
                    name="paymentNotifications"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.payment')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.paymentNotifications"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.paymentNotifications"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- System Announcements -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ translate('notifications.preferences.system') }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('notifications.preferences.systemDescription') }}
                  </p>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences()!.systemAnnouncements"
                    name="systemAnnouncements"
                    class="sr-only"
                    [attr.aria-label]="translate('notifications.preferences.system')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-blue-600]="preferences()!.systemAnnouncements"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences()!.systemAnnouncements"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-4 justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              [disabled]="isSaving()"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [attr.aria-label]="translate('notifications.preferences.save')">
              @if (isSaving()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              } @else {
                <i class="fas fa-save mr-2"></i>
              }
              {{ translate('notifications.preferences.save') }}
            </button>
          </div>
        </form>
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
  `,
  styles: [`
    /* Custom toggle switch styles */
    input[type="checkbox"]:checked + div > div:first-child {
      @apply bg-blue-600;
    }
    
    input[type="checkbox"]:checked + div > div:last-child {
      transform: translateX(1rem);
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  @Input() embedded: boolean = false;
  
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private logger = inject(LoggingService);
  
  preferences = signal<NotificationPreferencesDto | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  loadPreferences(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const sub = this.notificationService.getNotificationPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.logger.error('Failed to load notification preferences', error);
        
        // Handle 400/404 errors gracefully - endpoint might not exist yet
        if (error?.status === 400 || error?.status === 404) {
          // Set default preferences if endpoint doesn't exist
          this.preferences.set({
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: false,
            marketingEmails: false,
            lotteryUpdates: true,
            paymentNotifications: true,
            systemAnnouncements: true
          });
          this.isLoading.set(false);
          console.warn('Notification preferences endpoint not available, using defaults');
        } else {
          this.errorMessage.set(this.translate('notifications.preferences.loadError') || 'Failed to load preferences');
          this.isLoading.set(false);
        }
      }
    });
    
    this.subscriptions.add(sub);
  }

  savePreferences(): void {
    if (!this.preferences()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const updateRequest: UpdateNotificationPreferencesRequest = {
      emailNotifications: this.preferences()!.emailNotifications,
      smsNotifications: this.preferences()!.smsNotifications,
      pushNotifications: this.preferences()!.pushNotifications,
      marketingEmails: this.preferences()!.marketingEmails,
      lotteryUpdates: this.preferences()!.lotteryUpdates,
      paymentNotifications: this.preferences()!.paymentNotifications,
      systemAnnouncements: this.preferences()!.systemAnnouncements
    };

    const sub = this.notificationService.updateNotificationPreferences(updateRequest).subscribe({
      next: (updatedPrefs) => {
        this.preferences.set(updatedPrefs);
        this.isSaving.set(false);
        this.successMessage.set(this.translate('notifications.preferences.saveSuccess'));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (error) => {
        this.logger.error('Failed to save notification preferences', error);
        this.errorMessage.set(this.translate('notifications.preferences.saveError'));
        this.isSaving.set(false);
      }
    });

    this.subscriptions.add(sub);
  }
}

