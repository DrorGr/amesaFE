import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-password-reset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop dark:bg-black dark:bg-opacity-60" (click)="onBackdropClick($event)">
      <div class="modal-content dark:bg-gray-800">
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">
              {{ translate('auth.resetPassword') }}
            </h2>
            <button 
              (click)="close.emit()"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 transform p-1">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          @if (!emailSent) {
            <div class="space-y-6">
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                </div>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ translate('auth.resetPasswordDescription') }}
                </p>
              </div>

              <form (ngSubmit)="onSubmit()" class="space-y-6">
                <div>
                  <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('auth.email') }}
                  </label>
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    placeholder="{{ translate('auth.enterEmail') }}">
                </div>

                <button
                  type="submit"
                  [disabled]="isLoading"
                  class="w-full btn-primary text-lg py-4 disabled:bg-blue-400 disabled:transform-none disabled:shadow-none">
                  @if (isLoading) {
                    <span class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ translate('auth.sending') }}
                    </span>
                  } @else {
                    {{ translate('auth.sendResetEmail') }}
                  }
                </button>
              </form>
            </div>
          } @else {
            <div class="text-center space-y-6">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ translate('auth.emailSent') }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  {{ translate('auth.checkEmailInstructions') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-500">
                  {{ translate('auth.emailSentTo') }}: <strong>{{ email }}</strong>
                </p>
              </div>

              <div class="space-y-3">
                <button
                  (click)="resendEmail()"
                  [disabled]="isResending"
                  class="w-full btn-outline text-lg py-3 disabled:opacity-50">
                  @if (isResending) {
                    <span class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ translate('auth.resending') }}
                    </span>
                  } @else {
                    {{ translate('auth.resendEmail') }}
                  }
                </button>
                
                <button
                  (click)="backToLogin.emit()"
                  class="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold py-2 transition-colors duration-200">
                  {{ translate('auth.backToLogin') }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PasswordResetModalComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  
  close = output<void>();
  backToLogin = output<void>();

  email = '';
  isLoading = false;
  isResending = false;
  emailSent = false;

  async onSubmit() {
    if (!this.email) return;
    
    this.isLoading = true;
    
    try {
      const result = await this.authService.requestPasswordReset(this.email);
      if (result) {
        this.emailSent = true;
      }
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async resendEmail() {
    if (!this.email) return;
    
    this.isResending = true;
    
    try {
      await this.authService.requestPasswordReset(this.email);
    } catch (error) {
      console.error('Resend email error:', error);
    } finally {
      this.isResending = false;
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
