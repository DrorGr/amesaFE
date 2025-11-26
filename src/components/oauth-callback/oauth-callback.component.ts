import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { firstValueFrom } from 'rxjs';

// Helper function to persist logs to localStorage (survives navigation)
function debugLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data: data !== undefined ? JSON.stringify(data) : undefined
  };
  
  // Console log for immediate visibility
  if (data !== undefined) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
  
  // Persist to localStorage (survives navigation)
  try {
    const existingLogs = JSON.parse(localStorage.getItem('oauth_debug_logs') || '[]');
    existingLogs.push(logEntry);
    // Keep only last 100 entries
    if (existingLogs.length > 100) {
      existingLogs.shift();
    }
    localStorage.setItem('oauth_debug_logs', JSON.stringify(existingLogs));
  } catch (e) {
    console.warn('Could not persist debug log:', e);
  }
}

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
export class OAuthCallbackComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
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
      this.subscriptions.add(
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
            debugLog('[OAuth Callback] Exchanging code for tokens', { codeLength: code.length });
            const apiResponse = await firstValueFrom(
              this.apiService.post<{
                accessToken: string;
                refreshToken: string;
                expiresAt: string;
                isNewUser?: boolean;
                userAlreadyExists?: boolean;
              }>('oauth/exchange', { code })
            );
            
            debugLog('[OAuth Callback] Token exchange response', {
              success: apiResponse.success,
              hasData: !!apiResponse.data,
              hasAccessToken: !!(apiResponse.data as any)?.accessToken,
              hasAccessTokenPascal: !!(apiResponse.data as any)?.AccessToken,
              error: apiResponse.error,
              rawResponseKeys: Object.keys(apiResponse),
              dataKeys: apiResponse.data ? Object.keys(apiResponse.data as any) : []
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
              debugLog('[OAuth Callback] Extracted response (handling both formats)', {
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
              debugLog('[OAuth Callback] Extracted from direct response', {
                hasAccessToken: !!response.accessToken,
                accessTokenLength: response.accessToken?.length
              });
            } else {
              debugLog('[OAuth Callback] Could not extract token from response', {
                apiResponseKeys: Object.keys(apiResponse),
                hasSuccess: 'success' in apiResponse,
                hasData: 'data' in apiResponse,
                rawResponse: JSON.stringify(apiResponse).substring(0, 500)
              });
            }

            if (response && response.accessToken) {
              debugLog('[OAuth Callback] Storing tokens', {
                accessTokenLength: response.accessToken.length,
                refreshTokenLength: response.refreshToken?.length,
                expiresAt: response.expiresAt,
                tokenPreview: response.accessToken.substring(0, 30) + '...'
              });
              
              // Store tokens in localStorage
              localStorage.setItem('access_token', response.accessToken);
              localStorage.setItem('refresh_token', response.refreshToken);
              localStorage.setItem('token_expires_at', response.expiresAt);
              
              // Verify storage immediately
              const storedToken = localStorage.getItem('access_token');
              debugLog('[OAuth Callback] Token stored, verification', {
                stored: !!storedToken,
                length: storedToken?.length,
                matches: storedToken === response.accessToken
              });
              
              // IMPORTANT: Update ApiService's BehaviorSubject so Authorization header is sent
              this.apiService.setToken(response.accessToken);
              
              // Verify token is set in ApiService
              const tokenAfterSet = localStorage.getItem('access_token');
              debugLog('[OAuth Callback] Token set in ApiService, final verification', {
                inStorage: !!tokenAfterSet,
                inSubject: !!(this.apiService as any)['tokenSubject']?.value,
                tokenStillMatches: tokenAfterSet === response.accessToken
              });

              // NOTE: For "user doesn't exist" scenario during login, 
              // that's handled in the regular login flow (auth-modal.component.ts)
              // OAuth always creates the user if they don't exist, so we don't need that check here

              // Update auth state - fetch user profile (this will automatically update auth state via tap in getCurrentUserProfile)
              try {
                debugLog('[OAuth Callback] Fetching user profile');
                await this.authService.getCurrentUserProfile().toPromise();
                debugLog('[OAuth Callback] User profile fetched successfully');
              } catch (err: any) {
                // Check token BEFORE error handler potentially clears it
                const tokenBeforeError = localStorage.getItem('access_token');
                const tokenSubjectValue = (this.apiService as any)['tokenSubject']?.value;
                
                debugLog('[OAuth Callback] Error fetching user profile', {
                  status: err.status,
                  statusText: err.statusText,
                  message: err.message,
                  url: err.url,
                  hasTokenInStorage: !!tokenBeforeError,
                  hasTokenInSubject: !!tokenSubjectValue,
                  tokenPreview: tokenBeforeError ? tokenBeforeError.substring(0, 20) + '...' : 'none',
                  errorType: err.constructor?.name
                });
                
                // If token exists but request failed, it might be a validation issue
                if (tokenBeforeError && err.status === 401) {
                  debugLog('[OAuth Callback] Token exists but 401 - possible token validation issue', {
                    tokenPreview: tokenBeforeError.substring(0, 50),
                    tokenLength: tokenBeforeError.length
                  });
                }
                
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
              debugLog('[OAuth Callback] No access token in response', {
                apiResponseKeys: Object.keys(apiResponse),
                hasSuccess: 'success' in apiResponse,
                hasData: 'data' in apiResponse,
                responsePreview: JSON.stringify(apiResponse).substring(0, 500)
              });
              this.error = 'Authentication failed: No response from server';
              this.isLoading = false;
            }
          } catch (err: any) {
            debugLog('[OAuth Callback] Error exchanging OAuth code', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error,
              url: err.url,
              errorType: err.constructor?.name
            });
            this.error = err.error?.error || err.message || 'Failed to exchange authentication code';
            this.isLoading = false;
          }
        } else {
          this.error = 'Authentication failed: Missing authorization code';
          this.isLoading = false;
        }
      })
      );
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      this.error = 'An error occurred during authentication';
      this.isLoading = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  
  ngOnDestroy(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'oauth-callback.component.ts:ngOnDestroy',message:'Component destroyed',data:{componentName:'OAuthCallbackComponent',subscriptionCount:this.subscriptions.closed?0:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    this.subscriptions.unsubscribe();
  }
}

