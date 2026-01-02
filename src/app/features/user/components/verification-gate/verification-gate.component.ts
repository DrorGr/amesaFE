import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verification-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
    
    @if (isVerificationRequired() && !isVerified() && !isLoading()) {
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {{ translate('auth.verificationRequired') }}
            </h3>
            <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>{{ translate('auth.identity.retry.message') }}</p>
            </div>
            @if (retryError()) {
              <div class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ retryError() }}
              </div>
            }
            <div class="mt-4 flex space-x-3">
              <button
                type="button"
                (click)="retryVerification()"
                [disabled]="isRetrying()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                @if (isRetrying()) {
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                {{ translate('auth.identity.retry.button') }}
              </button>
              <button
                type="button"
                (click)="goToVerification()"
                class="inline-flex items-center px-4 py-2 border border-yellow-300 dark:border-yellow-600 text-sm font-medium rounded-md text-yellow-700 dark:text-yellow-300 bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200">
                {{ translate('auth.identity.retry.goToSettings') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class VerificationGateComponent implements OnInit {
  private verificationService = inject(IdentityVerificationService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Input: whether verification is required (from feature flag)
  isVerificationRequired = input<boolean>(false);
  
  // Output: emitted when user tries to perform action but is not verified
  blocked = output<void>();

  isVerified = signal(false);
  isLoading = signal(true);
  isRetrying = signal(false);
  retryError = signal<string | null>(null);

  ngOnInit() {
    this.checkVerificationStatus();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  async checkVerificationStatus() {
    if (!this.isVerificationRequired()) {
      this.isLoading.set(false);
      return;
    }

    // Only check verification status if user is authenticated
    const user = this.authService.getCurrentUser()();
    if (!user || !user.isAuthenticated) {
      this.isLoading.set(false);
      this.isVerified.set(false);
      return;
    }

    try {
      const status = await firstValueFrom(this.verificationService.getVerificationStatus());
      this.isVerified.set(status?.verificationStatus === 'verified');
    } catch (error: any) {
      // Only log non-500 errors (500 errors are backend issues, not frontend bugs)
      // Suppress 500 errors to reduce console noise
      if (error?.status !== 500 && error?.error?.statusCode !== 500) {
        console.warn('Error checking verification status:', error);
      }
      // Default to not verified on any error
      this.isVerified.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToVerification() {
    this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
  }

  goToSettings() {
    this.router.navigate(['/member-settings']);
  }

  /**
   * Check if action should be blocked
   */
  shouldBlock(): boolean {
    const user = this.authService.getCurrentUser()();
    if (!user || !user.isAuthenticated) {
      this.toastService.error(this.translate('auth.loginRequired'), 4000);
      this.blocked.emit();
      return true;
    }
    
    if (this.isVerificationRequired() && !this.isVerified()) {
      this.toastService.error(this.translate('auth.verificationRequired'), 4000);
      this.blocked.emit();
      return true;
    }
    
    return false;
  }

  async retryVerification(): Promise<void> {
    this.isRetrying.set(true);
    this.retryError.set(null);

    try {
      const response = await firstValueFrom(this.authService.retryIdentityVerification());
      if (response.success) {
        this.toastService.success(this.translate('auth.identity.retry.success'));
        // Recheck verification status after retry
        await this.checkVerificationStatus();
      } else {
        this.retryError.set(response.error?.message || this.translate('auth.identity.retry.errors.failed'));
      }
    } catch (error: any) {
      console.error('Error retrying identity verification:', error);
      if (error?.status === 429 || error?.error?.code === 'RATE_LIMIT_EXCEEDED') {
        this.retryError.set(this.translate('auth.identity.retry.errors.rateLimit'));
      } else if (error?.status === 400 || error?.error?.code === 'VALIDATION_ERROR') {
        this.retryError.set(this.translate('auth.identity.retry.errors.invalidRequest'));
      } else {
        this.retryError.set(this.translate('auth.identity.retry.errors.networkError'));
      }
    } finally {
      this.isRetrying.set(false);
    }
  }
}

