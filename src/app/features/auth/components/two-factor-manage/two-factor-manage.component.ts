import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, TwoFactorStatusDto } from '@core/services/auth.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-two-factor-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translate('auth.2fa.manage.title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ translate('auth.2fa.manage.description') }}
        </p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Status Display -->
      @if (!isLoading() && status()) {
        <div class="space-y-6">
          <!-- Current Status -->
          <div [class]="status()!.isEnabled 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'
            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4'">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                @if (status()!.isEnabled) {
                  <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                } @else {
                  <svg class="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                }
                <div>
                  <p class="text-sm font-medium" 
                     [class.text-green-800]="status()!.isEnabled"
                     [class.dark:text-green-200]="status()!.isEnabled"
                     [class.text-gray-800]="!status()!.isEnabled"
                     [class.dark:text-gray-200]="!status()!.isEnabled">
                    {{ status()!.isEnabled 
                      ? translate('auth.2fa.manage.status.enabled') 
                      : translate('auth.2fa.manage.status.disabled') }}
                  </p>
                  @if (status()!.isEnabled && status()!.setupDate) {
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {{ translate('auth.2fa.manage.setupDate') }}: {{ status()!.setupDate ? formatDate(status()!.setupDate) : '' }}
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Enable 2FA (if disabled) -->
          @if (!status()!.isEnabled) {
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                (click)="showEnableDialog = true"
                class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {{ translate('auth.2fa.manage.enable') }}
              </button>
            </div>
          }

          <!-- Disable 2FA (if enabled) -->
          @if (status()!.isEnabled) {
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                (click)="showDisableDialog = true"
                class="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
                {{ translate('auth.2fa.manage.disable') }}
              </button>
            </div>
          }

          <!-- Enable Dialog -->
          @if (showEnableDialog) {
            <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 flex items-center justify-center z-50"
                 (click)="showEnableDialog = false">
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
                   (click)="$event.stopPropagation()">
                <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {{ translate('auth.2fa.manage.enable') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {{ translate('auth.2fa.manage.enableDescription') }}
                </p>
                
                <form (ngSubmit)="enableTwoFactor()" class="space-y-4">
                  <div>
                    <label 
                      for="enable-code" 
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('auth.2fa.manage.codeRequired') }}
                    </label>
                    <input
                      id="enable-code"
                      type="text"
                      [(ngModel)]="enableCode"
                      name="enableCode"
                      [placeholder]="translate('auth.2fa.manage.codePlaceholder')"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                             text-center text-2xl font-mono tracking-widest
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxlength="6"
                      autocomplete="off"
                      (input)="onEnableCodeInput($event)">
                  </div>

                  @if (error()) {
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {{ error() }}
                      </p>
                    </div>
                  }

                  <div class="flex space-x-4">
                    <button
                      type="button"
                      (click)="showEnableDialog = false; enableCode = ''; error.set(null)"
                      class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                             rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                             transition-colors duration-200">
                      {{ translate('auth.2fa.manage.cancel') }}
                    </button>
                    <button
                      type="submit"
                      [disabled]="isProcessing() || !isCodeValid(enableCode)"
                      class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                             hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                             transition-colors duration-200">
                      @if (isProcessing()) {
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                      }
                      {{ translate('auth.2fa.manage.enable') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Disable Dialog -->
          @if (showDisableDialog) {
            <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 flex items-center justify-center z-50"
                 (click)="showDisableDialog = false">
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
                   (click)="$event.stopPropagation()">
                <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {{ translate('auth.2fa.manage.confirmDisable') }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {{ translate('auth.2fa.manage.disableWarning') }}
                </p>
                
                <form (ngSubmit)="disableTwoFactor()" class="space-y-4">
                  <div>
                    <label 
                      for="disable-code" 
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('auth.2fa.manage.codeRequired') }}
                    </label>
                    <input
                      id="disable-code"
                      type="text"
                      [(ngModel)]="disableCode"
                      name="disableCode"
                      [placeholder]="translate('auth.2fa.manage.codePlaceholder')"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                             text-center text-2xl font-mono tracking-widest
                             focus:outline-none focus:ring-2 focus:ring-red-500"
                      maxlength="6"
                      autocomplete="off"
                      (input)="onDisableCodeInput($event)">
                  </div>

                  @if (error()) {
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p class="text-sm text-red-800 dark:text-red-200">
                        {{ error() }}
                      </p>
                    </div>
                  }

                  <div class="flex space-x-4">
                    <button
                      type="button"
                      (click)="showDisableDialog = false; disableCode = ''; error.set(null)"
                      class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                             rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                             transition-colors duration-200">
                      {{ translate('auth.2fa.manage.cancel') }}
                    </button>
                    <button
                      type="submit"
                      [disabled]="isProcessing() || !isCodeValid(disableCode)"
                      class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg 
                             hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed 
                             transition-colors duration-200">
                      @if (isProcessing()) {
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                      }
                      {{ translate('auth.2fa.manage.disable') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && !status() && error()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ error() }}
          </p>
          <button
            (click)="loadStatus()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                   transition-colors duration-200">
            {{ translate('auth.2fa.manage.retry') }}
          </button>
        </div>
      }
    </div>
  `
})
export class TwoFactorManageComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  
  isLoading = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  status = signal<TwoFactorStatusDto | null>(null);
  error = signal<string | null>(null);
  
  showEnableDialog = false;
  showDisableDialog = false;
  enableCode = '';
  disableCode = '';

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadStatus(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sub = this.authService.getTwoFactorStatus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.status.set(response.data);
        } else {
          this.error.set(response.error?.message || this.translate('auth.2fa.errors.loadFailed'));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading 2FA status:', err);
        this.error.set(this.getErrorMessage(err));
        this.isLoading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  enableTwoFactor(): void {
    const code = this.enableCode.trim();
    if (!this.isCodeValid(code)) {
      this.error.set(this.translate('auth.2fa.errors.invalidCode'));
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const sub = this.authService.enableTwoFactor(code).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.2fa.manage.enableSuccess'));
          this.showEnableDialog = false;
          this.enableCode = '';
          this.loadStatus();
        } else {
          this.error.set(response.error?.message || this.translate('auth.2fa.errors.invalidCode'));
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error enabling 2FA:', err);
        this.error.set(this.getErrorMessage(err));
        this.isProcessing.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  disableTwoFactor(): void {
    const code = this.disableCode.trim();
    if (!this.isCodeValid(code)) {
      this.error.set(this.translate('auth.2fa.errors.invalidCode'));
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const sub = this.authService.disableTwoFactor(code).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.2fa.manage.disableSuccess'));
          this.showDisableDialog = false;
          this.disableCode = '';
          this.loadStatus();
        } else {
          this.error.set(response.error?.message || this.translate('auth.2fa.errors.invalidCode'));
        }
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error disabling 2FA:', err);
        this.error.set(this.getErrorMessage(err));
        this.isProcessing.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  onEnableCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.enableCode = value;
    input.value = value;
    this.error.set(null);
  }

  onDisableCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.disableCode = value;
    input.value = value;
    this.error.set(null);
  }

  isCodeValid(code: string): boolean {
    return code.trim().length === 6;
  }

  formatDate(date: Date | string | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(this.translationService.getCurrentLanguage() || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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




