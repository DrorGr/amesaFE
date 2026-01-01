import { Component, inject, input, output, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { ToastService } from '../../services/toast.service';
import { PasswordResetModalComponent } from '../password-reset-modal/password-reset-modal.component';
import { FocusTrapService } from '../../services/focus-trap.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordResetModalComponent],
  template: `
    <!-- Screen reader announcement -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      @if (isLoading) {
        {{ translate('auth.processing') }}
      }
    </div>
    <div class="modal-backdrop dark:bg-black dark:bg-opacity-60" (click)="onBackdropClick($event)">
      <div 
        #modalContainer
        class="modal-content dark:bg-gray-800"
        role="dialog"
        [attr.aria-modal]="'true'"
        [attr.aria-labelledby]="'auth-modal-title'">
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 
              id="auth-modal-title"
              class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
              {{ mode() === 'login' ? translate('auth.signIn') : translate('auth.createAccount') }}
            </h2>
            <button 
              (click)="close.emit()"
              (keydown.enter)="close.emit()"
              (keydown.space)="close.emit(); $event.preventDefault()"
              (keydown.escape)="close.emit()"
              [attr.aria-label]="translate('auth.closeModal')"
              [attr.aria-describedby]="'auth-modal-title'"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 transform p-1 focus:outline-none rounded">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Social Login Buttons -->
          <div class="space-y-4 mb-6">
            <button
              type="button"
              (click)="loginWithGoogle()"
              [disabled]="isLoading"
              [attr.aria-label]="translate('auth.continueWithGoogle')"
              [attr.aria-describedby]="'google-login-help'"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button focus:outline-none">
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
              (keydown.enter)="loginWithMeta()"
              (keydown.space)="loginWithMeta(); $event.preventDefault()"
              [disabled]="isLoading"
              [attr.aria-label]="translate('auth.continueWithMeta')"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button focus:outline-none">
              <svg class="w-8 h-8 mr-6 mobile-social-icon" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {{ translate('auth.continueWithMeta') }}
            </button>

            <button
              (click)="loginWithApple()"
              (keydown.enter)="loginWithApple()"
              (keydown.space)="loginWithApple(); $event.preventDefault()"
              [disabled]="isLoading"
              [attr.aria-label]="translate('auth.continueWithApple')"
              class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] mobile-social-button focus:outline-none">
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

          <!-- Error Message Display -->
          @if (errorMessage) {
            <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-red-700 dark:text-red-300 text-sm font-medium">{{ errorMessage }}</p>
              </div>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            @if (mode() === 'register') {
              <div>
                <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.fullName') }}</label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="name"
                  name="name"
                  autocomplete="name"
                  required
                  (input)="onInputChange()"
                  class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white mobile-auth-input">
              </div>
            }
            
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.email') }}</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                [autocomplete]="mode() === 'login' ? 'email' : 'email'"
                required
                (input)="onInputChange()"
                class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile-auth-label">{{ translate('auth.password') }}</label>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
                  required
                  (input)="onInputChange()"
                  class="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12">
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  (keydown.enter)="showPassword = !showPassword; $event.preventDefault()"
                  (keydown.space)="showPassword = !showPassword; $event.preventDefault()"
                  [attr.aria-label]="showPassword ? translate('auth.hidePassword') : translate('auth.showPassword')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none p-1">
                  @if (showPassword) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  }
                </button>
              </div>
            </div>

            @if (mode() === 'login') {
              <div class="flex items-center justify-between">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    [(ngModel)]="rememberMe"
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ translate('auth.rememberMe') }}</span>
                </label>
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
              class="w-full btn-primary text-2xl py-4 disabled:bg-blue-400 disabled:transform-none disabled:shadow-none mobile-auth-button">
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
  `]
})
export class AuthModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLElement>;
  private focusTrapService = inject(FocusTrapService);

  ngAfterViewInit() {
    // Trap focus in modal
    if (this.modalContainer?.nativeElement) {
      this.focusTrapService.trapFocus(this.modalContainer.nativeElement);
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Close modal on Escape key
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }

  ngOnDestroy() {
    // Release focus when modal closes
    this.focusTrapService.releaseFocus();
  }

  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private mobileDetectionService = inject(MobileDetectionService);
  private toastService = inject(ToastService);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  mode = input.required<'login' | 'register'>();
  close = output<void>();
  success = output<void>();
  modeChange = output<'login' | 'register'>();

  name = '';
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isLoading = false;
  showPasswordResetModal = false;
  errorMessage = '';

  async onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      let result: boolean;
      
      if (this.mode() === 'login') {
        result = await firstValueFrom(this.authService.login(this.email, this.password, this.rememberMe)) || false;
      } else {
        const registerData = { 
          username: this.name, 
          email: this.email, 
          password: this.password,
          firstName: this.name.split(' ')[0] || this.name,
          lastName: this.name.split(' ').slice(1).join(' ') || '',
          authProvider: 'local'
        };
        const registerResult = await firstValueFrom(this.authService.register(registerData));
        
        if (registerResult?.success) {
          if (registerResult.requiresEmailVerification) {
            // Redirect to email verification page
            this.toastService.success(this.translate('auth.registrationSuccessVerifyEmail'), 5000);
            this.close.emit();
            this.router.navigate(['/verify-email'], {
              queryParams: { email: this.email }
            });
            return;
          }
          result = true;
        } else {
          result = false;
        }
      }
      
      if (result) {
        // Fetch user profile to update auth state
        try {
          await firstValueFrom(this.authService.getCurrentUserProfile());
        } catch (err) {
          console.error('Error fetching user profile after login:', err);
        }
        
        // Show success toast
        if (this.mode() === 'login') {
          this.toastService.success(this.translate('auth.loginSuccess'), 3000);
        } else {
          this.toastService.success(this.translate('auth.registrationSuccess'), 3000);
        }
        
        // Small delay to show toast before closing modal
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.success.emit();
        this.resetForm();
      } else {
        if (this.mode() === 'login') {
          this.errorMessage = this.translate('auth.invalidCredentials');
        } else {
          this.errorMessage = this.translate('auth.registrationFailed');
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        // Check if user doesn't exist - redirect to signup
        if (error.error?.error?.code === 'USER_NOT_FOUND' || 
            error.error?.error?.message?.includes('USER_NOT_FOUND')) {
          // Show warning toast (yellow) and switch to register mode
          this.toastService.warning(this.translate('auth.accountNotFound'), 3000);
          this.modeChange.emit('register'); // Emit event to parent to switch to register mode
          this.errorMessage = this.translate('auth.createAccountToContinue');
          return;
        }
        
        this.errorMessage = this.translate('auth.invalidCredentials');
      } else if (error.status === 400) {
        const errorCode = error.error?.error?.code;
        
        if (this.mode() === 'register') {
          // Check if user already exists - redirect to login
          const errorMessage = error.error?.error?.message || '';
          if (errorMessage.toLowerCase().includes('already exists') || 
              errorMessage.toLowerCase().includes('email already') ||
              errorCode === 'VALIDATION_ERROR') {
            // Show warning toast and switch to login mode
            this.toastService.warning(this.translate('auth.emailAlreadyExists'), 3000);
            this.modeChange.emit('login'); // Switch to login mode
            this.errorMessage = this.translate('auth.emailAlreadyRegistered');
            return;
          }
          
          // Handle rate limiting
          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            this.errorMessage = this.translate('auth.tooManyRegistrationAttempts');
            return;
          }
          
          // Handle CAPTCHA failure
          if (errorCode === 'CAPTCHA_FAILED') {
            this.errorMessage = this.translate('auth.captchaFailed');
            return;
          }
          
          this.errorMessage = this.translate('auth.registrationFailedInvalid');
        } else {
          // Login errors
          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            this.errorMessage = this.translate('auth.tooManyLoginAttempts');
          } else {
            this.errorMessage = this.translate('auth.invalidRequest');
          }
        }
      } else if (error.status === 500) {
        this.errorMessage = this.translate('auth.serverError');
      } else if (error.message?.includes('Network')) {
        this.errorMessage = this.translate('auth.networkError');
      } else {
        this.errorMessage = this.translate('auth.unexpectedError');
      }
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
    this.errorMessage = '';
  }

  onInputChange() {
    // Clear error message when user starts typing
    if (this.errorMessage) {
      this.errorMessage = '';
    }
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