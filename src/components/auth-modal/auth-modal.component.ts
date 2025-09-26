import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { PasswordResetModalComponent } from '../password-reset-modal/password-reset-modal.component';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordResetModalComponent],
  template: `
    <div class="modal-backdrop dark:bg-black dark:bg-opacity-60" (click)="onBackdropClick($event)">
      <div class="modal-content dark:bg-gray-800">
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-4xl md:text-3xl font-black text-gray-900 dark:text-white mobile-auth-title">
              {{ mode() === 'login' ? translate('auth.signIn') : translate('auth.createAccount') }}
            </h2>
            <button 
              (click)="close.emit()"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 transform p-1">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Social Login Buttons -->
          <div class="space-y-4 mb-6">
            <button
              (click)="loginWithGoogle()"
              [disabled]="isLoading"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button">
              <svg class="w-8 h-8 mr-6 mobile-social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {{ translate('auth.continueWithGoogle') }}
            </button>

            <button
              (click)="loginWithMeta()"
              [disabled]="isLoading"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button">
              <svg class="w-8 h-8 mr-6 mobile-social-icon" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {{ translate('auth.continueWithMeta') }}
            </button>

            <button
              (click)="loginWithApple()"
              [disabled]="isLoading"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button">
              <svg class="w-8 h-8 mr-6 mobile-social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {{ translate('auth.continueWithApple') }}
            </button>
          </div>

          <!-- Divider -->
          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
                <div class="relative flex justify-center text-base">
                  <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">{{ translate('auth.or') }}</span>
                </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            @if (mode() === 'register') {
              <div>
                <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.fullName') }}</label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="name"
                  name="name"
                  required
                  class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 mobile-auth-input">
              </div>
            }
            
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.email') }}</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                required
                class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400">
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.password') }}</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400">
            </div>

            @if (mode() === 'login') {
              <div class="text-right">
                <button
                  type="button"
                  (click)="showPasswordReset()"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200">
                  {{ translate('auth.forgotPassword') }}
                </button>
              </div>
            }

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn-primary text-lg py-4 disabled:bg-blue-400 disabled:transform-none disabled:shadow-none mobile-auth-button">
              @if (isLoading) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ translate('auth.processing') }}
                </span>
              } @else {
                {{ mode() === 'login' ? translate('auth.signIn') : translate('auth.createAccount') }}
              }
            </button>
          </form>

          <div class="mt-8 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ mode() === 'login' ? translate('auth.dontHaveAccount') : translate('auth.alreadyHaveAccount') }}
              <button
                type="button"
                (click)="handleSignUpClick()"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold ml-1 transition-colors duration-200">
                {{ mode() === 'login' ? translate('auth.signUp') : translate('auth.signIn') }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    @if (showPasswordResetModal) {
      <app-password-reset-modal 
        (close)="hidePasswordReset()"
        (backToLogin)="hidePasswordReset()">
      </app-password-reset-modal>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    @media (max-width: 767px) {
      .modal-content {
        margin: 1rem !important;
        max-width: calc(100vw - 2rem) !important;
        max-height: calc(100vh - 2rem) !important;
        overflow-y: auto !important;
      }
      
      .mobile-auth-title {
        font-size: 3rem !important;
        line-height: 1.3 !important;
      }
      
      .mobile-auth-button {
        font-size: 1.75rem !important;
        padding: 1.5rem 2rem !important;
        min-height: 80px !important;
      }
      
      .mobile-auth-input {
        font-size: 1.5rem !important;
        padding: 1.5rem !important;
        min-height: 80px !important;
      }
      
      .mobile-auth-label {
        font-size: 1.25rem !important;
        margin-bottom: 1rem !important;
      }
      
      .mobile-social-button {
        font-size: 1.75rem !important;
        padding: 1.5rem 2rem !important;
        min-height: 80px !important;
      }
      
      .mobile-social-icon {
        width: 2.5rem !important;
        height: 2.5rem !important;
        margin-right: 1.5rem !important;
      }
    }
  `]
})
export class AuthModalComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  mode = input.required<'login' | 'register'>();
  close = output<void>();
  success = output<void>();

  name = '';
  email = '';
  password = '';
  isLoading = false;
  showPasswordResetModal = false;

  async onSubmit() {
    this.isLoading = true;
    
    try {
      let result: boolean;
      
      if (this.mode() === 'login') {
        result = await this.authService.login(this.email, this.password);
      } else {
        result = await this.authService.register(this.name, this.email, this.password);
      }
      
      if (result) {
        this.success.emit();
        this.resetForm();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleSignUpClick() {
    if (this.mode() === 'login') {
      // Navigate to registration page
      this.router.navigate(['/register']);
      this.close.emit();
      this.scrollToTop();
    } else {
      // Toggle to login mode
      this.toggleMode();
    }
  }

  toggleMode() {
    this.resetForm();
    // Emit event to parent to toggle mode
    const newMode = this.mode() === 'login' ? 'register' : 'login';
    this.modeChange.emit(newMode);
  }

  modeChange = output<'login' | 'register'>();

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  private resetForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.isLoading = false;
  }

  // Social Login Methods
  async loginWithGoogle() {
    this.isLoading = true;
    try {
      const result = await this.authService.loginWithGoogle();
      if (result) {
        this.success.emit();
        this.resetForm();
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithMeta() {
    this.isLoading = true;
    try {
      const result = await this.authService.loginWithMeta();
      if (result) {
        this.success.emit();
        this.resetForm();
      }
    } catch (error) {
      console.error('Meta login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithApple() {
    this.isLoading = true;
    try {
      const result = await this.authService.loginWithApple();
      if (result) {
        this.success.emit();
        this.resetForm();
      }
    } catch (error) {
      console.error('Apple login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Password Reset Methods
  showPasswordReset() {
    this.showPasswordResetModal = true;
  }

  hidePasswordReset() {
    this.showPasswordResetModal = false;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}