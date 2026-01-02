import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';
import { Subscription, interval } from 'rxjs';

interface AccountDeletionStatus {
  isPending: boolean;
  deletionRequestedAt?: Date;
  deletionScheduledAt?: Date;
  gracePeriodEndsAt?: Date;
  canCancel: boolean;
}

@Component({
  selector: 'app-account-deletion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translate('auth.account.delete.title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ translate('auth.account.delete.description') }}
        </p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Pending Deletion Status -->
      @if (!isLoading() && status()?.isPending) {
        <div class="space-y-6">
          <!-- Warning Banner -->
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div class="flex items-start">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div class="ml-3 flex-1">
                <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
                  {{ translate('auth.account.delete.pendingTitle') }}
                </h3>
                <p class="mt-2 text-sm text-red-700 dark:text-red-300">
                  {{ translate('auth.account.delete.pendingMessage') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Grace Period Countdown -->
          @if (status()?.gracePeriodEndsAt && timeRemaining()) {
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    {{ translate('auth.account.delete.gracePeriod') }}
                  </h4>
                  <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {{ formatTimeRemaining(timeRemaining()!) }}
                  </p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    {{ translate('auth.account.delete.gracePeriodMessage') }}
                  </p>
                </div>
                <div class="text-4xl">⏰</div>
              </div>
            </div>
          }

          <!-- Cancel Deletion Button -->
          @if (status()?.canCancel) {
            <button
              (click)="showCancelDialog = true"
              class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
              {{ translate('auth.account.delete.cancel') }}
            </button>
          } @else {
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                {{ translate('auth.account.delete.cannotCancel') }}
              </p>
            </div>
          }
        </div>
      }

      <!-- No Pending Deletion - Request Deletion -->
      @if (!isLoading() && !status()?.isPending) {
        <div class="space-y-6">
          <!-- Warning -->
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div class="flex items-start">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
                  {{ translate('auth.account.delete.warning') }}
                </h3>
                <ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  <li>{{ translate('auth.account.delete.warning1') }}</li>
                  <li>{{ translate('auth.account.delete.warning2') }}</li>
                  <li>{{ translate('auth.account.delete.warning3') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Request Deletion Button -->
          <button
            (click)="showConfirmDialog = true"
            class="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
                   transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
            {{ translate('auth.account.delete.requestDeletion') }}
          </button>
        </div>
      }

      <!-- Confirm Deletion Dialog -->
      @if (showConfirmDialog) {
        <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 flex items-center justify-center z-50"
             (click)="showConfirmDialog = false">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
               (click)="$event.stopPropagation()">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('auth.account.delete.confirm') }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {{ translate('auth.account.delete.confirmMessage') }}
            </p>

            <!-- Password Input -->
            <div class="mb-4">
              <label 
                for="deletionPassword" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('auth.account.delete.passwordRequired') }}
              </label>
              <input
                id="deletionPassword"
                type="password"
                [(ngModel)]="password"
                name="deletionPassword"
                [placeholder]="translate('auth.account.delete.passwordPlaceholder')"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-red-500"
                [attr.aria-label]="translate('auth.account.delete.passwordRequired')"
                autocomplete="current-password">
            </div>

            @if (error()) {
              <div class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p class="text-sm text-red-800 dark:text-red-200">
                  {{ error() }}
                </p>
              </div>
            }

            <div class="flex space-x-4">
              <button
                type="button"
                (click)="showConfirmDialog = false; error.set(null); password = ''"
                class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                       transition-colors duration-200">
                {{ translate('auth.account.delete.cancel') }}
              </button>
              <button
                type="button"
                (click)="requestDeletion()"
                [disabled]="isProcessing() || !password.trim()"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg 
                       hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors duration-200">
                @if (isProcessing()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                }
                {{ translate('auth.account.delete.confirmButton') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Deletion Dialog -->
      @if (showCancelDialog) {
        <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 flex items-center justify-center z-50"
             (click)="showCancelDialog = false">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
               (click)="$event.stopPropagation()">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('auth.account.delete.cancelDeletion') }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {{ translate('auth.account.delete.cancelDeletionMessage') }}
            </p>

            @if (error()) {
              <div class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p class="text-sm text-red-800 dark:text-red-200">
                  {{ error() }}
                </p>
              </div>
            }

            <div class="flex space-x-4">
              <button
                type="button"
                (click)="showCancelDialog = false; error.set(null)"
                class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                       transition-colors duration-200">
                {{ translate('auth.account.delete.keepDeletion') }}
              </button>
              <button
                type="button"
                (click)="cancelDeletion()"
                [disabled]="isProcessing()"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg 
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors duration-200">
                @if (isProcessing()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                }
                {{ translate('auth.account.delete.cancel') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && !status() && error()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p class="text-sm text-red-800 dark:text-red-200 mb-4">
            {{ error() }}
          </p>
          <button
            (click)="loadStatus()"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                   transition-colors duration-200">
            {{ translate('auth.account.delete.retry') }}
          </button>
        </div>
      }
    </div>
  `
})
export class AccountDeletionComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);

  isLoading = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  status = signal<AccountDeletionStatus | null>(null);
  error = signal<string | null>(null);
  timeRemaining = signal<number | null>(null);
  password = '';

  showConfirmDialog = false;
  showCancelDialog = false;

  private subscriptions = new Subscription();
  private countdownInterval?: Subscription;

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }
  }

  loadStatus(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sub = this.authService.getAccountDeletionStatus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as any;
          this.status.set({
            isPending: data.isPending || false,
            deletionRequestedAt: data.deletionRequestedAt ? new Date(data.deletionRequestedAt) : undefined,
            deletionScheduledAt: data.deletionScheduledAt ? new Date(data.deletionScheduledAt) : undefined,
            gracePeriodEndsAt: data.gracePeriodEndsAt ? new Date(data.gracePeriodEndsAt) : undefined,
            canCancel: data.canCancel !== false
          });

          // Start countdown if grace period exists
          if (this.status()?.gracePeriodEndsAt) {
            this.startCountdown();
          }
        } else {
          this.error.set(response.error?.message || this.translate('auth.account.delete.errors.loadFailed'));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading account deletion status:', err);
        this.error.set(this.getErrorMessage(err));
        this.isLoading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  requestDeletion(): void {
    if (!this.password?.trim()) {
      this.error.set(this.translate('auth.account.delete.errors.passwordRequired'));
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const sub = this.authService.requestAccountDeletion(this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.account.delete.requestSuccess'));
          this.showConfirmDialog = false;
          this.password = '';
          this.loadStatus();
        } else {
          this.error.set(response.error?.message || this.translate('auth.account.delete.errors.requestFailed'));
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error requesting account deletion:', err);
        this.error.set(this.getErrorMessage(err));
        this.isProcessing.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  cancelDeletion(): void {
    this.isProcessing.set(true);
    this.error.set(null);

    const sub = this.authService.cancelAccountDeletion().subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.account.delete.cancelSuccess'));
          this.showCancelDialog = false;
          this.loadStatus();
          if (this.countdownInterval) {
            this.countdownInterval.unsubscribe();
          }
        } else {
          this.error.set(response.error?.message || this.translate('auth.account.delete.errors.cancelFailed'));
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error canceling account deletion:', err);
        this.error.set(this.getErrorMessage(err));
        this.isProcessing.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  startCountdown(): void {
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }

    this.countdownInterval = interval(1000).subscribe(() => {
      const gracePeriodEndsAt = this.status()?.gracePeriodEndsAt;
      if (!gracePeriodEndsAt) {
        this.timeRemaining.set(null);
        if (this.countdownInterval) {
          this.countdownInterval.unsubscribe();
        }
        return;
      }

      const now = new Date().getTime();
      const endsAt = new Date(gracePeriodEndsAt).getTime();
      const remaining = endsAt - now;

      if (remaining <= 0) {
        this.timeRemaining.set(0);
        if (this.countdownInterval) {
          this.countdownInterval.unsubscribe();
        }
        // Reload status to check if deletion was completed
        this.loadStatus();
      } else {
        this.timeRemaining.set(remaining);
      }
    });
  }

  formatTimeRemaining(ms: number): string {
    if (ms <= 0) {
      return this.translate('auth.account.delete.gracePeriodExpired');
    }

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getErrorMessage(error: any): string {
    if (error?.error?.error?.code === 'GRACE_PERIOD_EXPIRED') {
      return this.translate('auth.account.delete.errors.graceExpired');
    }
    if (error?.error?.error?.code === 'INVALID_PASSWORD') {
      return this.translate('auth.account.delete.errors.invalidPassword');
    }
    return error?.error?.error?.message || this.translate('auth.account.delete.errors.networkError');
  }

  translate(key: string): string {
    return this.translationService.translate(key) || key;
  }
}

