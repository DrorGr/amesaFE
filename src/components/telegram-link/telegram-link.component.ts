import { Component, OnInit, OnDestroy, inject, signal, effect, EffectRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TelegramLinkService } from '../../services/telegram-link.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-telegram-link',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="embedded ? 'w-full' : 'max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg'">
      <!-- Header (only shown when not embedded) -->
      @if (!embedded) {
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('notifications.telegram.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ translate('notifications.telegram.subtitle') }}
          </p>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Linked State -->
      @if (!isLoading() && linkStatus()?.verified) {
        <div class="space-y-6">
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-lg font-medium text-green-800 dark:text-green-200">
                  {{ translate('notifications.telegram.linked') }}
                </h3>
                <p class="mt-2 text-sm text-green-700 dark:text-green-300">
                  @if (linkStatus()!.telegramUsername) {
                    {{ translate('notifications.telegram.linkedTo') }}: <strong>@{{ linkStatus()!.telegramUsername }}</strong>
                  } @else {
                    {{ translate('notifications.telegram.linkedTo') }}: <strong>{{ translate('notifications.telegram.userId') }} {{ linkStatus()!.telegramUserId }}</strong>
                  }
                </p>
              </div>
            </div>
          </div>

          <button
            (click)="unlinkAccount()"
            [disabled]="isUnlinking()"
            class="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            [attr.aria-label]="translate('notifications.telegram.unlink')">
            @if (isUnlinking()) {
              <i class="fas fa-spinner fa-spin mr-2"></i>
            } @else {
              <i class="fas fa-unlink mr-2"></i>
            }
            {{ translate('notifications.telegram.unlink') }}
          </button>
        </div>
      }

      <!-- Not Linked / Verification State -->
      @if (!isLoading() && (!linkStatus() || !linkStatus()!.verified)) {
        <div class="space-y-6">
          <!-- Instructions -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 class="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
              {{ translate('notifications.telegram.instructions') }}
            </h3>
            <ol class="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>{{ translate('notifications.telegram.step1') }}</li>
              <li>{{ translate('notifications.telegram.step2') }}</li>
              <li>{{ translate('notifications.telegram.step3') }}</li>
              <li>{{ translate('notifications.telegram.step4') }}</li>
            </ol>
          </div>

          <!-- Verification Code Display -->
          @if (verificationCode()) {
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('notifications.telegram.verificationCode') }}
              </label>
              <div class="flex items-center space-x-4">
                <div class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-4">
                  <code class="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                    {{ verificationCode() }}
                  </code>
                </div>
                <button
                  (click)="copyCode()"
                  class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  [attr.aria-label]="translate('notifications.telegram.copyCode')">
                  <i class="fas fa-copy mr-2"></i>
                  {{ translate('notifications.telegram.copy') }}
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {{ translate('notifications.telegram.codeHint') }}
              </p>
            </div>
          }

          <!-- Verification Form -->
          @if (verificationCode()) {
            <form (ngSubmit)="verifyLink()" class="space-y-4">
              <div>
                <label for="verificationCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('notifications.telegram.enterCode') }}
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  [(ngModel)]="codeInput"
                  name="codeInput"
                  [placeholder]="translate('notifications.telegram.codePlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [attr.aria-label]="translate('notifications.telegram.enterCode')"
                  maxlength="10"
                  autocomplete="off">
              </div>

              <button
                type="submit"
                [disabled]="isVerifying() || !codeInput.trim()"
                class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                [attr.aria-label]="translate('notifications.telegram.verify')">
                @if (isVerifying()) {
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                } @else {
                  <i class="fas fa-check mr-2"></i>
                }
                {{ translate('notifications.telegram.verify') }}
              </button>
            </form>
          }

          <!-- Request Link Button -->
          @if (!verificationCode()) {
            <button
              (click)="requestLink()"
              [disabled]="isRequesting()"
              class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [attr.aria-label]="translate('notifications.telegram.requestLink')">
              @if (isRequesting()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              } @else {
                <i class="fab fa-telegram-plane mr-2"></i>
              }
              {{ translate('notifications.telegram.requestLink') }}
            </button>
          }
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
export class TelegramLinkComponent implements OnInit, OnDestroy {
  @Input() embedded: boolean = false;
  
  private telegramLinkService = inject(TelegramLinkService);
  private translationService = inject(TranslationService);
  private logger = inject(LoggingService);

  linkStatus = signal(this.telegramLinkService.getLinkStatus()());
  verificationCode = signal(this.telegramLinkService.getVerificationCode()());
  isLoading = signal<boolean>(true);
  isRequesting = signal<boolean>(false);
  isVerifying = signal<boolean>(false);
  isUnlinking = signal<boolean>(false);
  codeInput = '';
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private linkStatusEffect?: EffectRef;
  private verificationCodeEffect?: EffectRef;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    // Watch link status changes
    this.linkStatusEffect = effect(() => {
      const status = this.telegramLinkService.getLinkStatus()();
      this.linkStatus.set(status);
    });

    // Watch verification code changes
    this.verificationCodeEffect = effect(() => {
      const code = this.telegramLinkService.getVerificationCode()();
      this.verificationCode.set(code);
    });

    // Fetch initial status
    this.isLoading.set(true);
    const sub = this.telegramLinkService.fetchStatus().subscribe({
      next: (status) => {
        this.linkStatus.set(status);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching Telegram link status:', error);
        this.errorMessage.set(this.translate('notifications.telegram.error.loadFailed') || 'Failed to load Telegram link status');
        this.isLoading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Effects are automatically cleaned up by Angular
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  requestLink(): void {
    this.isRequesting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const sub = this.telegramLinkService.requestLink().subscribe({
      next: (link) => {
        this.linkStatus.set(link);
        this.isRequesting.set(false);
        if (this.verificationCode()) {
          this.successMessage.set(this.translate('notifications.telegram.codeGenerated'));
        }
      },
      error: (error) => {
        this.logger.error('Failed to request Telegram link', error);
        this.errorMessage.set(this.translate('notifications.telegram.requestError'));
        this.isRequesting.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  verifyLink(): void {
    if (!this.codeInput.trim()) {
      return;
    }

    this.isVerifying.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const sub = this.telegramLinkService.verifyLink(this.codeInput.trim()).subscribe({
      next: (link) => {
        this.linkStatus.set(link);
        this.codeInput = '';
        this.isVerifying.set(false);
        this.successMessage.set(this.translate('notifications.telegram.verifySuccess'));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (error) => {
        this.logger.error('Failed to verify Telegram link', error);
        this.errorMessage.set(this.translate('notifications.telegram.verifyError'));
        this.isVerifying.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  unlinkAccount(): void {
    if (!confirm(this.translate('notifications.telegram.unlinkConfirm'))) {
      return;
    }

    this.isUnlinking.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const sub = this.telegramLinkService.unlink().subscribe({
      next: (success) => {
        if (success) {
          this.linkStatus.set(null);
          this.verificationCode.set(null);
          this.isUnlinking.set(false);
          this.successMessage.set(this.translate('notifications.telegram.unlinkSuccess'));
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage.set(null);
          }, 3000);
        }
      },
      error: (error) => {
        this.logger.error('Failed to unlink Telegram account', error);
        this.errorMessage.set(this.translate('notifications.telegram.unlinkError'));
        this.isUnlinking.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  copyCode(): void {
    if (this.verificationCode()) {
      navigator.clipboard.writeText(this.verificationCode()!).then(() => {
        this.successMessage.set(this.translate('notifications.telegram.codeCopied'));
        setTimeout(() => {
          this.successMessage.set(null);
        }, 2000);
      }).catch((error) => {
        this.logger.error('Failed to copy code', error);
        this.errorMessage.set(this.translate('notifications.telegram.copyError'));
      });
    }
  }
}

