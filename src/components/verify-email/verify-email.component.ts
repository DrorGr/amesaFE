import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 flex items-center justify-center px-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <svg class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('auth.verifyEmail') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ translate('auth.verifyEmailDescription') }}
          </p>
        </div>

        @if (verificationStatus() === 'pending') {
          <!-- Manual Token Input -->
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('auth.verificationToken') }}
              </label>
              <input
                type="text"
                [(ngModel)]="verificationToken"
                [disabled]="isLoading()"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                [placeholder]="translate('auth.enterVerificationToken')">
            </div>

            <button
              (click)="verifyEmail()"
              [disabled]="!verificationToken || isLoading()"
              class="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isLoading()) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ translate('auth.verifying') }}
                </span>
              } @else {
                {{ translate('auth.verifyEmail') }}
              }
            </button>

            <div class="text-center">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ translate('auth.didntReceiveEmail') }}
              </p>
              <button
                (click)="resendVerificationEmail()"
                [disabled]="isResending() || resendCooldown() > 0"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                @if (resendCooldown() > 0) {
                  {{ getResendCooldownMessage() }}
                } @else {
                  {{ translate('auth.resendVerificationEmail') }}
                }
              </button>
            </div>
          </div>
        }

        @if (verificationStatus() === 'success') {
          <div class="text-center space-y-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
              <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ translate('auth.emailVerified') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('auth.emailVerifiedDescription') }}
            </p>
            <button
              (click)="goToLogin()"
              class="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg transition-all duration-200">
              {{ translate('auth.goToLogin') }}
            </button>
          </div>
        }

        @if (verificationStatus() === 'error') {
          <div class="text-center space-y-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
              <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ translate('auth.verificationFailed') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ errorMessage() }}
            </p>
            <div class="space-y-3">
              <button
                (click)="retryVerification()"
                class="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg transition-all duration-200">
                {{ translate('auth.tryAgain') }}
              </button>
              <button
                (click)="resendVerificationEmail()"
                [disabled]="isResending() || resendCooldown() > 0"
                class="w-full px-6 py-3 text-lg font-semibold text-blue-600 dark:text-blue-400 bg-transparent border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 disabled:opacity-50">
                @if (resendCooldown() > 0) {
                  {{ getResendCooldownMessage() }}
                } @else {
                  {{ translate('auth.resendVerificationEmail') }}
                }
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  verificationStatus = signal<'pending' | 'success' | 'error'>('pending');
  verificationToken = '';
  isLoading = signal(false);
  isResending = signal(false);
  resendCooldown = signal(0);
  errorMessage = signal('');

  ngOnInit() {
    // Check if token is in URL (from email link)
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.verificationToken = token;
      this.verifyEmail();
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getResendCooldownMessage(): string {
    const template = this.translate('auth.resendIn');
    return template.replace('{seconds}', this.resendCooldown().toString());
  }

  async verifyEmail() {
    if (!this.verificationToken) {
      this.errorMessage.set(this.translate('auth.verificationTokenRequired'));
      this.verificationStatus.set('error');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const success = await this.authService.verifyEmail(this.verificationToken).toPromise();
      if (success) {
        this.verificationStatus.set('success');
        this.toastService.success(this.translate('auth.emailVerifiedSuccess'), 3000);
      } else {
        this.errorMessage.set(this.translate('auth.invalidVerificationToken'));
        this.verificationStatus.set('error');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      const errorCode = error?.error?.error?.code || error?.error?.code;
      const errorMsg = error?.error?.error?.message || error?.error?.message || this.translate('auth.verificationFailed');
      
      if (errorCode === 'VALIDATION_ERROR') {
        this.errorMessage.set(this.translate('auth.invalidVerificationToken'));
      } else {
        this.errorMessage.set(errorMsg);
      }
      this.verificationStatus.set('error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendVerificationEmail() {
    const email = this.route.snapshot.queryParams['email'] || '';
    if (!email) {
      this.toastService.error(this.translate('auth.emailRequiredForResend'), 3000);
      return;
    }

    this.isResending.set(true);
    this.resendCooldown.set(60); // 60 second cooldown

    try {
      const success = await this.authService.resendVerificationEmail(email).toPromise();
      if (success) {
        this.toastService.success(this.translate('auth.verificationEmailSent'), 3000);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      const errorCode = error?.error?.error?.code || error?.error?.code;
      
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        this.toastService.error(this.translate('auth.tooManyResendRequests'), 3000);
      } else {
        this.toastService.error(this.translate('auth.failedToResendEmail'), 3000);
      }
    } finally {
      this.isResending.set(false);
      // Start cooldown timer
      const interval = setInterval(() => {
        this.resendCooldown.update(count => {
          if (count <= 1) {
            clearInterval(interval);
            return 0;
          }
          return count - 1;
        });
      }, 1000);
    }
  }

  retryVerification() {
    this.verificationStatus.set('pending');
    this.errorMessage.set('');
    this.verificationToken = '';
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}

