import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TranslationService } from '../../services/translation.service';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen" role="main" aria-live="polite">
      <div class="text-center">
        <div *ngIf="isLoading" class="space-y-4" aria-label="Loading authentication">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" aria-hidden="true"></div>
          <p class="text-gray-600 dark:text-gray-400">{{ translate('auth.completingAuthentication') }}</p>
        </div>
        <div *ngIf="error" class="space-y-4" role="alert" aria-live="assertive">
          <div class="text-red-600 dark:text-red-400">
            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="font-semibold">{{ error }}</p>
          </div>
          <button 
            (click)="goHome()"
            (keydown.enter)="goHome()"
            (keydown.space)="goHome(); $event.preventDefault()"
            [attr.aria-label]="translate('common.goToHome')"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">
            {{ translate('common.goToHome') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private translationService = inject(TranslationService);

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      // Fixed: Use firstValueFrom with take(1) to auto-cleanup subscription
      // OAuth callback only needs to process query params once
      const params = await firstValueFrom(
        this.route.queryParams.pipe(
          take(1) // Auto-unsubscribe after first emission to prevent memory leaks
        )
      );

      const code = params['code'];
      const error = params['error']; // Legacy error parameter
      const errorCode = params['error_code']; // New error code parameter
      const provider = params['provider']; // OAuth provider (Google, Meta)
      const detailsBase64 = params['details']; // Base64-encoded error details

      // Handle new error code format (preferred)
      if (errorCode) {
        this.error = this.getErrorMessage(errorCode, provider, detailsBase64);
        this.isLoading = false;
        return;
      }

      // Handle legacy error format (fallback)
      if (error) {
        this.error = decodeURIComponent(error);
        this.isLoading = false;
        return;
      }

      if (code) {
        // Exchange temporary code for JWT tokens
        // Note: OAuth exchange doesn't require authentication, but we use ApiService for consistency
        try {
          const apiResponse = await firstValueFrom(
            this.apiService.post<{
              accessToken: string;
              refreshToken: string;
              expiresAt: string;
              isNewUser?: boolean;
              userAlreadyExists?: boolean;
            }>('oauth/exchange', { code })
          );
          
          // Extract data from ApiResponse wrapper (backend may return wrapped or direct)
          let response: {
            accessToken: string;
            refreshToken: string;
            expiresAt: string;
            isNewUser?: boolean;
            userAlreadyExists?: boolean;
          } | null = null;
          
          if (apiResponse.success && apiResponse.data) {
            // Wrapped in ApiResponse
            response = apiResponse.data;
          } else if (apiResponse && 'accessToken' in apiResponse) {
            // Direct response (not wrapped)
            response = apiResponse as any;
          }

          if (response && response.accessToken) {
            // Store tokens in localStorage
            localStorage.setItem('access_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('token_expires_at', response.expiresAt);
            
            // IMPORTANT: Update ApiService's BehaviorSubject so Authorization header is sent
            this.apiService.setToken(response.accessToken);

            // NOTE: For "user doesn't exist" scenario during login, 
            // that's handled in the regular login flow (auth-modal.component.ts)
            // OAuth always creates the user if they don't exist, so we don't need that check here

            // Update auth state - fetch user profile (this will automatically update auth state via tap in getCurrentUserProfile)
            try {
              await firstValueFrom(this.authService.getCurrentUserProfile());
            } catch (err) {
              console.error('Error fetching user profile:', err);
            }

            // Store toast message in localStorage to show after navigation
            // This ensures the toast appears on the destination page
            const toastMessage = response.isNewUser 
              ? 'success:Welcome! Your account has been created successfully.'
              : 'success:Welcome back! You have been logged in successfully.';
            localStorage.setItem('oauth_toast', toastMessage);

            // Redirect to home or previous page
            // The app component will check for 'oauth_toast' in localStorage and show it
            const returnUrl = localStorage.getItem('returnUrl') || '/';
            localStorage.removeItem('returnUrl');
            this.router.navigate([returnUrl]);
          } else {
            this.error = this.translate('auth.oauthNoResponse');
            this.isLoading = false;
          }
        } catch (err: any) {
          console.error('Error exchanging OAuth code:', err);
          this.error = err.error?.error || this.translate('auth.oauthExchangeFailed');
          this.isLoading = false;
        }
      } else {
        this.error = this.translate('auth.oauthMissingCode');
        this.isLoading = false;
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      this.error = this.translate('auth.oauthError');
      this.isLoading = false;
    }
  }

  /**
   * Maps OAuth error codes to user-friendly messages
   */
  private getErrorMessage(errorCode: string, provider?: string, detailsBase64?: string): string {
    // Decode details if provided
    let details: any = null;
    if (detailsBase64) {
      try {
        // Base64Url decode: replace URL-safe characters back to standard Base64
        const base64 = detailsBase64.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const decoded = atob(padded);
        details = JSON.parse(decoded);
      } catch (e) {
        console.warn('Failed to decode error details:', e);
      }
    }

    const providerName = provider || 'OAuth';
    
    // Map error codes to user-friendly messages
    const errorMessages: { [key: string]: string } = {
      'OAUTH_NOT_CONFIGURED': this.translate('auth.oauthNotConfigured') || `${providerName} authentication is not configured.`,
      'OAUTH_INIT_FAILED': this.translate('auth.oauthInitFailed') || `Failed to initiate ${providerName} login. Please try again.`,
      'OAUTH_RATE_LIMIT_EXCEEDED': this.translate('auth.oauthRateLimitExceeded') || `Too many authentication attempts. Please try again later.`,
      'OAUTH_AUTHENTICATION_FAILED': this.translate('auth.oauthAuthenticationFailed') || `${providerName} authentication failed. Please try again.`,
      'OAUTH_MISSING_DATA': this.translate('auth.oauthMissingData') || `${providerName} authentication data is incomplete. Please try again.`,
      'OAUTH_PROCESSING_ERROR': this.translate('auth.oauthProcessingError') || `Error processing ${providerName} authentication. Please try again.`,
      'OAUTH_TOKEN_EXPIRED': this.translate('auth.oauthTokenExpired') || `Authentication token expired. Please try logging in again.`,
    };

    // Get message for error code, or use generic message
    let message = errorMessages[errorCode] || this.translate('auth.oauthError') || `Authentication error occurred. Please try again.`;

    // Add retry information if available
    if (details?.retry_after_minutes) {
      message += ` You can try again in ${details.retry_after_minutes} minutes.`;
    }

    return message;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

