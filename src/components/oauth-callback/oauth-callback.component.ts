import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div *ngIf="isLoading" class="space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p class="text-gray-600 dark:text-gray-400">Completing authentication...</p>
        </div>
        <div *ngIf="error" class="space-y-4">
          <div class="text-red-600 dark:text-red-400">
            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="font-semibold">{{ error }}</p>
          </div>
          <button 
            (click)="goHome()"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Home
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

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      this.route.queryParams.subscribe(async (params) => {
        const code = params['code'];
        const error = params['error'];

        if (error) {
          this.error = decodeURIComponent(error);
          this.isLoading = false;
          return;
        }

        if (code) {
          // Exchange temporary code for JWT tokens
          // Note: OAuth exchange doesn't require authentication, but we use ApiService for consistency
          try {
            console.log('[OAuth Callback] Exchanging code for tokens, code length:', code.length);
            const apiResponse = await firstValueFrom(
              this.apiService.post<{
                accessToken: string;
                refreshToken: string;
                expiresAt: string;
                isNewUser?: boolean;
                userAlreadyExists?: boolean;
              }>('oauth/exchange', { code })
            );
            
            console.log('[OAuth Callback] Token exchange response:', {
              success: apiResponse.success,
              hasData: !!apiResponse.data,
              hasAccessToken: !!(apiResponse.data as any)?.accessToken,
              error: apiResponse.error,
              rawResponse: apiResponse
            });
            
            // Extract data from ApiResponse wrapper (backend may return wrapped or direct)
            // Handle both camelCase (new) and PascalCase (old) formats
            let response: {
              accessToken: string;
              refreshToken: string;
              expiresAt: string;
              isNewUser?: boolean;
              userAlreadyExists?: boolean;
            } | null = null;
            
            if (apiResponse.success && apiResponse.data) {
              // Wrapped in ApiResponse - handle both camelCase and PascalCase
              const data = apiResponse.data as any;
              response = {
                accessToken: data.accessToken || data.AccessToken,
                refreshToken: data.refreshToken || data.RefreshToken,
                expiresAt: data.expiresAt || data.ExpiresAt,
                isNewUser: data.isNewUser || data.IsNewUser,
                userAlreadyExists: data.userAlreadyExists || data.UserAlreadyExists
              };
              console.log('[OAuth Callback] Extracted response (handling both formats):', {
                hasAccessToken: !!response.accessToken,
                accessTokenLength: response.accessToken?.length
              });
            } else if (apiResponse && ('accessToken' in apiResponse || 'AccessToken' in apiResponse)) {
              // Direct response (not wrapped) - handle both formats
              response = {
                accessToken: (apiResponse as any).accessToken || (apiResponse as any).AccessToken,
                refreshToken: (apiResponse as any).refreshToken || (apiResponse as any).RefreshToken,
                expiresAt: (apiResponse as any).expiresAt || (apiResponse as any).ExpiresAt,
                isNewUser: (apiResponse as any).isNewUser || (apiResponse as any).IsNewUser,
                userAlreadyExists: (apiResponse as any).userAlreadyExists || (apiResponse as any).UserAlreadyExists
              };
              console.log('[OAuth Callback] Extracted from direct response:', {
                hasAccessToken: !!response.accessToken,
                accessTokenLength: response.accessToken?.length
              });
            } else {
              console.error('[OAuth Callback] Could not extract token from response:', apiResponse);
            }

            if (response && response.accessToken) {
              console.log('[OAuth Callback] Storing tokens, accessToken length:', response.accessToken.length);
              // Store tokens in localStorage
              localStorage.setItem('access_token', response.accessToken);
              localStorage.setItem('refresh_token', response.refreshToken);
              localStorage.setItem('token_expires_at', response.expiresAt);
              
              // IMPORTANT: Update ApiService's BehaviorSubject so Authorization header is sent
              this.apiService.setToken(response.accessToken);
              console.log('[OAuth Callback] Token set in ApiService, verifying token in localStorage:', !!localStorage.getItem('access_token'));

              // NOTE: For "user doesn't exist" scenario during login, 
              // that's handled in the regular login flow (auth-modal.component.ts)
              // OAuth always creates the user if they don't exist, so we don't need that check here

              // Update auth state - fetch user profile (this will automatically update auth state via tap in getCurrentUserProfile)
              try {
                console.log('[OAuth Callback] Fetching user profile...');
                await this.authService.getCurrentUserProfile().toPromise();
                console.log('[OAuth Callback] User profile fetched successfully');
              } catch (err: any) {
                console.error('[OAuth Callback] Error fetching user profile:', {
                  status: err.status,
                  statusText: err.statusText,
                  message: err.message,
                  url: err.url,
                  hasToken: !!localStorage.getItem('access_token')
                });
                // Don't fail the entire flow - user can still navigate, but data won't be loaded
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
              console.error('[OAuth Callback] No access token in response:', apiResponse);
              this.error = 'Authentication failed: No response from server';
              this.isLoading = false;
            }
          } catch (err: any) {
            console.error('[OAuth Callback] Error exchanging OAuth code:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error,
              url: err.url
            });
            this.error = err.error?.error || err.message || 'Failed to exchange authentication code';
            this.isLoading = false;
          }
        } else {
          this.error = 'Authentication failed: Missing authorization code';
          this.isLoading = false;
        }
      });
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      this.error = 'An error occurred during authentication';
      this.isLoading = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

