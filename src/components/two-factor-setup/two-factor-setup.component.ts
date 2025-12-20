import { Component, OnInit, OnDestroy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, TwoFactorSetupDto } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translate('auth.2fa.setup.title') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ translate('auth.2fa.setup.description') }}
        </p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Setup Content -->
      @if (!isLoading() && setupData()) {
        <div class="space-y-6">
          <!-- QR Code Display -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('auth.2fa.setup.qrCode') }}
            </h3>
            <div class="flex justify-center mb-4">
              <img 
                [src]="setupData()!.qrCodeUrl" 
                alt="2FA QR Code"
                class="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white p-2">
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
              {{ translate('auth.2fa.setup.scanQR') }}
            </p>
          </div>

          <!-- Manual Entry -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('auth.2fa.setup.manualEntry') }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('auth.2fa.setup.secretKey') }}
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="text"
                    [value]="setupData()!.manualEntryKey"
                    readonly
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                           font-mono text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    [attr.aria-label]="translate('auth.2fa.setup.secretKey')"
                    id="manual-entry-key">
                  <button
                    (click)="copySecretKey()"
                    class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 
                           transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    [attr.aria-label]="translate('auth.2fa.setup.copyKey')">
                    <i class="fas fa-copy mr-2"></i>
                    {{ translate('auth.2fa.setup.copy') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Verification Step -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('auth.2fa.setup.verificationCode') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ translate('auth.2fa.setup.enterCodeFromApp') }}
            </p>
            
            <form (ngSubmit)="verifySetup()" class="space-y-4">
              <div>
                <label 
                  for="verification-code" 
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('auth.2fa.setup.verificationCode') }}
                </label>
                <input
                  id="verification-code"
                  type="text"
                  [(ngModel)]="verificationCode"
                  name="verificationCode"
                  [placeholder]="translate('auth.2fa.setup.codePlaceholder')"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         text-center text-2xl font-mono tracking-widest
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [attr.aria-label]="translate('auth.2fa.setup.verificationCode')"
                  maxlength="6"
                  autocomplete="off"
                  (input)="onCodeInput($event)">
              </div>

              @if (error()) {
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {{ error() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <div class="flex space-x-4">
                <button
                  type="button"
                  (click)="cancel.emit()"
                  class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                         rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                  {{ translate('auth.2fa.setup.cancel') }}
                </button>
                <button
                  type="submit"
                  [disabled]="isVerifying() || !isCodeValid()"
                  class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  @if (isVerifying()) {
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                  }
                  {{ translate('auth.2fa.setup.verify') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && !setupData() && !isVerifying()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                {{ translate('auth.2fa.errors.setupFailed') }}
              </h3>
              <p class="mt-2 text-sm text-red-700 dark:text-red-300">
                {{ error() || translate('auth.2fa.errors.networkError') }}
              </p>
              <button
                (click)="loadSetup()"
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
                {{ translate('auth.2fa.setup.retry') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TwoFactorSetupComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  
  setupComplete = output<void>();
  cancel = output<void>();

  isLoading = signal<boolean>(false);
  isVerifying = signal<boolean>(false);
  setupData = signal<TwoFactorSetupDto | null>(null);
  verificationCode = signal<string>('');
  error = signal<string | null>(null);

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadSetup();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadSetup(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sub = this.authService.setupTwoFactor().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.setupData.set(response.data);
        } else {
          this.error.set(response.error?.message || this.translate('auth.2fa.errors.setupFailed'));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error setting up 2FA:', err);
        this.error.set(this.getErrorMessage(err));
        this.isLoading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  verifySetup(): void {
    const code = this.verificationCode().trim();
    if (!code || code.length !== 6) {
      this.error.set(this.translate('auth.2fa.errors.invalidCode'));
      return;
    }

    this.isVerifying.set(true);
    this.error.set(null);

    const sub = this.authService.verifyTwoFactorSetup(code).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.2fa.setup.success'));
          this.setupComplete.emit();
        } else {
          this.error.set(response.error?.message || this.translate('auth.2fa.errors.invalidCode'));
        }
        this.isVerifying.set(false);
      },
      error: (err) => {
        console.error('Error verifying 2FA setup:', err);
        this.error.set(this.getErrorMessage(err));
        this.isVerifying.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  copySecretKey(): void {
    if (this.setupData()?.manualEntryKey) {
      navigator.clipboard.writeText(this.setupData()!.manualEntryKey).then(() => {
        this.toastService.success(this.translate('auth.2fa.setup.keyCopied'));
      }).catch(() => {
        this.toastService.error(this.translate('auth.2fa.setup.copyFailed'));
      });
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only allow digits
    const value = input.value.replace(/\D/g, '');
    this.verificationCode.set(value);
    input.value = value;
    this.error.set(null);
  }

  isCodeValid(): boolean {
    return this.verificationCode().trim().length === 6;
  }

  getErrorMessage(error: any): string {
    if (error?.error?.error?.code === 'RATE_LIMIT_EXCEEDED') {
      return this.translate('auth.2fa.errors.rateLimit');
    }
    if (error?.error?.error?.code === 'ACCOUNT_LOCKED') {
      return this.translate('auth.2fa.errors.lockout');
    }
    if (error?.error?.error?.code === 'INVALID_CODE' || error?.error?.error?.code === 'EXPIRED_CODE') {
      return this.translate('auth.2fa.errors.invalidCode');
    }
    return error?.error?.error?.message || this.translate('auth.2fa.errors.networkError');
  }

  translate(key: string): string {
    return this.translationService.translate(key) || key;
  }
}




