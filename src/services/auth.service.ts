import { Injectable, signal, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, take, finalize } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { 
  User, 
  UserDto, 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest,
  UpdateUserProfileRequest 
} from '../models/house.model';

// Two-Factor Authentication DTOs
export interface TwoFactorStatusDto {
  isEnabled: boolean;
  isVerified: boolean;
  setupDate?: Date;
}

export interface TwoFactorSetupDto {
  qrCodeUrl: string;
  manualEntryKey: string;
  secret: string;
}
import { UserLotteryData } from '../interfaces/lottery.interface';
import { LotteryService } from './lottery.service';
import { RealtimeService } from './realtime.service';
import { UserPreferencesService } from './user-preferences.service';
import { PaymentMethodPreferenceService } from './payment-method-preference.service';
import { ThemeService } from './theme.service';
import { AccessibilityService } from './accessibility.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentUserDto = signal<UserDto | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Use Injector for lazy injection to break circular dependencies
  private injector = inject(Injector);
  
  // Lazy getters to break circular dependencies
  private get lotteryService(): LotteryService | null {
    try {
      return this.injector.get(LotteryService, null);
    } catch {
      return null;
    }
  }
  
  private get realtimeService(): RealtimeService | null {
    try {
      return this.injector.get(RealtimeService, null);
    } catch {
      return null;
    }
  }
  
  private get userPreferencesService(): UserPreferencesService | null {
    try {
      return this.injector.get(UserPreferencesService, null);
    } catch {
      return null;
    }
  }
  
  private get themeService(): ThemeService | null {
    try {
      return this.injector.get(ThemeService, null);
    } catch {
      return null;
    }
  }
  
  private get accessibilityService(): AccessibilityService | null {
    try {
      return this.injector.get(AccessibilityService, null);
    } catch {
      return null;
    }
  }
  
  private get translationService(): TranslationService | null {
    try {
      return this.injector.get(TranslationService, null);
    } catch {
      return null;
    }
  }
  
  private router = inject(Router, { optional: true });

  private tokenRefreshInterval: any = null;
  private readonly REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes before expiry
  private isLoggingOut = false; // Flag to prevent double logout

  constructor(private apiService: ApiService) {
    // CRITICAL: Defer auth status check to allow initial render (1000ms delay)
    // This ensures app UI is visible before auth check starts
    // Increased delay from 0ms to 1000ms to allow initial render
    setTimeout(() => {
      this.checkAuthStatus();
    }, 1000);
    
    // Start proactive token refresh monitoring (non-blocking)
    this.startTokenRefreshMonitoring();
    // Register token refresh callback for automatic retry on 401 errors
    this.apiService.setTokenRefreshCallback(() => this.refreshToken());
  }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  getCurrentUserDto() {
    return this.currentUserDto.asReadonly();
  }

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private checkAuthStatus(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Add timeout to prevent hanging on stale/invalid tokens
      // Reduced timeout to 5 seconds for faster failure
      const timeout = setTimeout(() => {
        console.warn('[Auth] Auth check timeout after 5 seconds, clearing potentially invalid token');
        this.logout();
      }, 5000); // Reduced from 10s to 5s
      
      // Fixed: Use take(1) for auto-cleanup to prevent memory leaks
      this.getCurrentUserProfile().pipe(
        take(1), // Auto-unsubscribe after first emission
        finalize(() => clearTimeout(timeout)) // Clear timeout on completion (success or error)
      ).subscribe({
        next: (user) => {
          clearTimeout(timeout);
          this.setUser(user);
          // Initialize preferences on auth status check
          this.initializeUserPreferences();
        },
        error: (err) => {
          clearTimeout(timeout);
          console.warn('[Auth] Auth check failed:', err);
          this.logout();
        }
      });
    }
  }
  
  /**
   * Initialize user preferences (theme, accessibility, language) from user preferences service
   * Called after successful login or auth status check
   */
  private initializeUserPreferences(): void {
    if (this.userPreferencesService) {
      const prefs = this.userPreferencesService.getPreferences();
      
      // Initialize theme from user preferences
      if (this.themeService && prefs.appearance?.theme) {
        this.themeService.updateThemeFromPreferences(prefs.appearance.theme);
      }
      
      // Initialize accessibility settings from user preferences
      if (this.accessibilityService && prefs.accessibility) {
        // Apply accessibility preferences
        if (prefs.accessibility.highContrast !== undefined) {
          if (prefs.accessibility.highContrast && !this.accessibilityService.getHighContrastMode()()) {
            this.accessibilityService.toggleHighContrast();
          }
        }
        if (prefs.appearance?.fontSize) {
          // Map 'extra-large' to 'large' since setFontSize only accepts 'small' | 'medium' | 'large'
          const fontSize = prefs.appearance.fontSize === 'extra-large' ? 'large' : prefs.appearance.fontSize;
          if (fontSize === 'small' || fontSize === 'medium' || fontSize === 'large') {
            this.accessibilityService.setFontSize(fontSize);
          }
        }
      }
      
      // Initialize language from user preferences
      if (this.translationService && prefs.localization?.language) {
        this.translationService.setLanguage(prefs.localization.language);
      }
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    const loginRequest: LoginRequest = { email, password, rememberMe };
    
    return this.apiService.post<AuthResponse>('auth/login', loginRequest).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Check if email verification is required
          if (response.data.requiresEmailVerification) {
            // Don't authenticate, user needs to verify email first
            return;
          }
          
          if (response.data.accessToken) {
            this.apiService.setToken(response.data.accessToken);
            if (response.data.refreshToken) {
              localStorage.setItem('refresh_token', response.data.refreshToken);
            }
            if (response.data.expiresAt) {
              // Store as ISO string for reliable parsing with error handling
              try {
                let expiresAt: string;
                if (response.data.expiresAt instanceof Date) {
                  expiresAt = response.data.expiresAt.toISOString();
                } else if (typeof response.data.expiresAt === 'string') {
                  // Validate date format before parsing
                  const parsedDate = new Date(response.data.expiresAt);
                  if (isNaN(parsedDate.getTime())) {
                    console.error('Invalid date format for expiresAt:', response.data.expiresAt);
                    // Don't store invalid date, but continue with authentication
                    // Token refresh will handle expiration check
                  } else {
                    expiresAt = parsedDate.toISOString();
                    localStorage.setItem('token_expires_at', expiresAt);
                  }
                } else {
                  console.error('Unexpected expiresAt type:', typeof response.data.expiresAt);
                  // Don't store invalid date
                }
              } catch (error) {
                console.error('Error parsing token expiration date:', error);
                // Clear any existing invalid expiration date
                localStorage.removeItem('token_expires_at');
                // Continue with authentication - token refresh will handle expiration
              }
            }
            this.setUser(response.data.user);
            this.isAuthenticatedSubject.next(true);
            
            // Initialize user preferences (theme, accessibility, language) from user preferences
            this.initializeUserPreferences();
            
            // Load lottery data if available
            if (response.data.lotteryData && this.lotteryService) {
              // Clear old user caches before initializing new data
              this.lotteryService.clearAllUserCaches();
              this.lotteryService.initializeLotteryData(response.data.lotteryData);
            } else if (this.lotteryService) {
              // If lotteryData not in response, clear caches and fetch fresh
              this.lotteryService.clearAllUserCaches();
              // Explicitly fetch favorites from backend
              // This ensures favorites are loaded even if backend doesn't include them in login response
              // Fixed: Use take(1) for auto-cleanup to prevent memory leaks
              // Use backward compatibility method to get all favorites
              this.lotteryService.getFavoriteHousesAll().pipe(
                take(1) // Auto-unsubscribe after first emission
              ).subscribe({
                next: () => {
                  // Favorites loaded successfully
                },
                error: (err) => {
                  console.warn('Failed to load favorites on login:', err);
                  // Non-critical error - continue with login
                }
              });
            }
            
            // SignalR connection removed from login flow to prevent blocking
            // Components will connect when needed via ensureConnection()
            // (e.g., notification sidebar, live inventory, reservation status)
          }
        }
      }),
      map(response => {
        if (response.success && response.data?.requiresEmailVerification) {
          // Throw error to indicate email verification needed
          throw { 
            status: 403, 
            error: { 
              code: 'EMAIL_NOT_VERIFIED', 
              message: 'Please verify your email before logging in' 
            } 
          };
        }
        return response.success;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  checkUsernameAvailability(username: string): Observable<{ available: boolean; suggestions?: string[] }> {
    return this.apiService.get<{ available: boolean; suggestions?: string[] }>(
      `/api/v1/auth/username-availability?username=${encodeURIComponent(username)}`
    ).pipe(
      map(response => response.data || { available: false }),
      catchError(error => {
        console.error('Error checking username availability:', error);
        // Return unavailable on error to be safe
        return throwError(() => error);
      })
    );
  }

  register(registerData: RegisterRequest): Observable<{ success: boolean; requiresEmailVerification?: boolean }> {
    return this.apiService.post<AuthResponse>('auth/register', registerData).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Only set tokens if email is verified (OAuth users)
          if (response.data.accessToken && !response.data.requiresEmailVerification) {
            this.apiService.setToken(response.data.accessToken);
            if (response.data.refreshToken) {
              localStorage.setItem('refresh_token', response.data.refreshToken);
            }
            if (response.data.expiresAt) {
              // Store as ISO string for reliable parsing with error handling
              try {
                let expiresAt: string;
                if (response.data.expiresAt instanceof Date) {
                  expiresAt = response.data.expiresAt.toISOString();
                } else if (typeof response.data.expiresAt === 'string') {
                  // Validate date format before parsing
                  const parsedDate = new Date(response.data.expiresAt);
                  if (isNaN(parsedDate.getTime())) {
                    console.error('Invalid date format for expiresAt:', response.data.expiresAt);
                    // Don't store invalid date, but continue with authentication
                    // Token refresh will handle expiration check
                  } else {
                    expiresAt = parsedDate.toISOString();
                    localStorage.setItem('token_expires_at', expiresAt);
                  }
                } else {
                  console.error('Unexpected expiresAt type:', typeof response.data.expiresAt);
                  // Don't store invalid date
                }
              } catch (error) {
                console.error('Error parsing token expiration date:', error);
                // Clear any existing invalid expiration date
                localStorage.removeItem('token_expires_at');
                // Continue with authentication - token refresh will handle expiration
              }
            }
            this.setUser(response.data.user);
            this.isAuthenticatedSubject.next(true);
          }
          // If email verification required, don't set tokens or authenticate
        }
      }),
      map(response => ({
        success: response.success,
        requiresEmailVerification: response.data?.requiresEmailVerification ?? false
      })),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Prevent double logout
    if (this.isLoggingOut) {
      return;
    }
    this.isLoggingOut = true;

    // Stop token refresh monitoring
    this.stopTokenRefreshMonitoring();

    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Fixed: Use take(1) for auto-cleanup to prevent memory leaks
      this.apiService.post('auth/logout', { refreshToken }).pipe(
        take(1) // Auto-unsubscribe after first emission
      ).subscribe();
    }
    
    // Clear all tokens
    this.apiService.clearToken();
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    
    // Clear all user data
    this.currentUser.set(null);
    this.currentUserDto.set(null);
    this.isAuthenticatedSubject.next(false);
    
    // Clear lottery data on logout
    if (this.lotteryService) {
      this.lotteryService.clearLotteryData();
    }
    
    // Clear payment method preference cache on logout
    try {
      const paymentMethodPreference = this.injector.get(PaymentMethodPreferenceService, null);
      if (paymentMethodPreference) {
        paymentMethodPreference.clearCache();
      }
    } catch (error) {
      // Service might not be available, ignore
    }
    
    // Clear user preferences on logout (localStorage will be cleared below)
    // Note: UserPreferencesService uses localStorage, which is cleared in the loop below
    
    // Disconnect from SignalR on logout
    if (this.realtimeService) {
      this.realtimeService.stopConnection();
    }
    
    // Clear any other user-related localStorage data
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('amesa_') || key.includes('user') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage on logout:', error);
    }
    
    // Reset logout flag after a short delay to allow navigation to complete
    setTimeout(() => {
      this.isLoggingOut = false;
    }, 100);
    
    // Redirect to homepage
    if (this.router) {
      this.router.navigate(['/']).catch(err => {
        console.error('Error navigating to homepage on logout:', err);
        // Fallback: use window.location if router fails
        window.location.href = '/';
      });
    } else {
      // Fallback: use window.location if router not available
      window.location.href = '/';
    }
  }
  
  /**
   * Connect to SignalR and subscribe to user groups for real-time updates
   * Non-blocking: Delays connection until after app is loaded to prevent hanging
   */
  private connectToSignalR(userId: string): void {
    if (!this.realtimeService) {
      return;
    }

    // Clean up any existing connection first to prevent stale state
    this.realtimeService.stopConnection().catch(() => {
      // Ignore errors during cleanup
    });

    // Delay SignalR connection to prevent blocking app startup
    // Connect after a short delay to allow app to render first
    setTimeout(async () => {
      try {
        await this.realtimeService!.startConnection();
        await this.realtimeService!.joinUserGroup(userId);
        console.log('Connected to SignalR and joined user group');
      } catch (error) {
        console.error('Error connecting to SignalR:', error);
        // Don't throw - allow app to continue without SignalR
      }
    }, 2000); // 2 second delay to allow app to load first
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUserProfile(): Observable<UserDto> {
    return this.apiService.get<any>('auth/me').pipe(
      tap(response => {
        // Update auth state when fetching user profile
        if (response.success && response.data) {
          // Handle both old format (UserDto) and new format ({user, lotteryData})
          const userData = response.data.user || response.data;
          this.setUser(userData);
          this.isAuthenticatedSubject.next(true);
          
          // Initialize user preferences (theme, accessibility, language) from user preferences
          this.initializeUserPreferences();
          
          // Load lottery data if available (BE-1.7 enhancement)
          if (response.data.lotteryData && this.lotteryService) {
            this.lotteryService.initializeLotteryData(response.data.lotteryData);
          } else if (this.lotteryService) {
            // If lotteryData not in response, explicitly fetch favorites from backend
            // This ensures favorites are loaded on page refresh or auth check
            // Fixed: Use take(1) for auto-cleanup to prevent memory leaks
            // Use backward compatibility method to get all favorites
            this.lotteryService.getFavoriteHousesAll().pipe(
              take(1) // Auto-unsubscribe after first emission
            ).subscribe({
              next: () => {
                // Favorites loaded successfully
              },
              error: (err) => {
                console.warn('Failed to load favorites on auth check:', err);
                // Non-critical error - continue
              }
            });
          }
          
          // SignalR connection removed from auth check to prevent blocking
          // Components will connect when needed via ensureConnection()
          // (e.g., notification sidebar, live inventory, reservation status)
        }
      }),
      map(response => {
        if (response.success && response.data) {
          // Return user data (handle both formats)
          return response.data.user || response.data;
        }
        throw new Error('Failed to get user profile');
      })
    );
  }

  updateUserProfile(updateData: UpdateUserProfileRequest): Observable<UserDto> {
    return this.apiService.put<UserDto>('auth/me', updateData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setUser(response.data);
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update user profile');
      })
    );
  }

  requestPasswordReset(email: string): Observable<boolean> {
    return this.apiService.post('auth/forgot-password', { email }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Password reset request error:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<boolean> {
    return this.apiService.post('auth/reset-password', { 
      token, 
      newPassword 
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Password reset error:', error);
        return throwError(() => error);
      })
    );
  }

  verifyEmail(token: string): Observable<boolean> {
    return this.apiService.post('auth/verify-email', { token }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Email verification error:', error);
        return throwError(() => error);
      })
    );
  }

  resendVerificationEmail(email: string): Observable<boolean> {
    return this.apiService.post('auth/resend-verification', { email }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Resend verification email error:', error);
        return throwError(() => error);
      })
    );
  }

  verifyPhone(phone: string, code: string): Observable<boolean> {
    return this.apiService.post('auth/verify-phone', { phone, code }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Phone verification error:', error);
        return throwError(() => error);
      })
    );
  }

  // ----- Two-Factor Authentication -----
  getTwoFactorStatus(): Observable<ApiResponse<TwoFactorStatusDto>> {
    return this.apiService.get<TwoFactorStatusDto>('auth/two-factor/status').pipe(
      catchError(error => {
        console.error('Error getting 2FA status:', error);
        return throwError(() => error);
      })
    );
  }

  setupTwoFactor(): Observable<ApiResponse<TwoFactorSetupDto>> {
    return this.apiService.post<TwoFactorSetupDto>('auth/two-factor/setup', {}).pipe(
      catchError(error => {
        console.error('Error setting up 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  verifyTwoFactorSetup(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/verify-setup', { code }).pipe(
      catchError(error => {
        console.error('Error verifying 2FA setup:', error);
        return throwError(() => error);
      })
    );
  }

  enableTwoFactor(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/enable', { code }).pipe(
      catchError(error => {
        console.error('Error enabling 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  disableTwoFactor(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/disable', { code }).pipe(
      catchError(error => {
        console.error('Error disabling 2FA:', error);
        return throwError(() => error);
      })
    );
  }

  verifyTwoFactor(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/verify', { code }).pipe(
      catchError(error => {
        console.error('Error verifying 2FA code:', error);
        return throwError(() => error);
      })
    );
  }

  // ----- Account Recovery (Security Questions) -----
  getSecurityQuestions(): Observable<ApiResponse<any>> {
    return this.apiService.get<any>('auth/recovery/security-questions');
  }

  setupSecurityQuestions(questions: Array<{ questionId: number; answer: string }>): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/recovery/security-questions', { questions }).pipe(
      catchError(error => {
        console.error('Error setting up security questions:', error);
        return throwError(() => error);
      })
    );
  }

  verifySecurityQuestion(answer: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/recovery/verify-question', { answer });
  }

  // ----- Account Deletion -----
  requestAccountDeletion(password: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/account/delete', { password }).pipe(
      catchError(error => {
        console.error('Error requesting account deletion:', error);
        return throwError(() => error);
      })
    );
  }

  cancelAccountDeletion(): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/account/cancel-deletion', {});
  }

  getAccountDeletionStatus(): Observable<ApiResponse<any>> {
    return this.apiService.get<any>('auth/account/deletion-status');
  }

  // ----- Identity Retry -----
  retryIdentityVerification(): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/identity/retry', {});
  }

  // Session Management Methods
  getActiveSessions(): Observable<any[]> {
    return this.apiService.get<any[]>('auth/sessions').pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Get active sessions error:', error);
        return throwError(() => error);
      })
    );
  }

  logoutFromDevice(sessionToken: string): Observable<boolean> {
    // Encode session token for URL
    const encodedToken = encodeURIComponent(sessionToken);
    return this.apiService.post(`auth/sessions/${encodedToken}/logout`, {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Logout from device error:', error);
        return throwError(() => error);
      })
    );
  }

  logoutAllDevices(): Observable<boolean> {
    return this.apiService.post('auth/sessions/logout-all', {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Logout all devices error:', error);
        return throwError(() => error);
      })
    );
  }

  // Social Login Methods
  async loginWithGoogle(): Promise<boolean> {
    try {
      // Get base URL which already includes /api/v1
      const baseUrl = this.apiService.getBaseUrl();
      // OAuth endpoints are at /api/v1/oauth/*, so baseUrl already has the correct path
      window.location.href = `${baseUrl}/oauth/google`;
      return true;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      return false;
    }
  }

  async loginWithMeta(): Promise<boolean> {
    try {
      // Get base URL which already includes /api/v1
      const baseUrl = this.apiService.getBaseUrl();
      // OAuth endpoints are at /api/v1/oauth/*, so baseUrl already has the correct path
      window.location.href = `${baseUrl}/oauth/meta`;
      return true;
    } catch (error) {
      console.error('Error initiating Meta login:', error);
      return false;
    }
  }

  async loginWithApple(): Promise<boolean> {
    try {
      // Get base URL which already includes /api/v1
      const baseUrl = this.apiService.getBaseUrl();
      // OAuth endpoints are at /api/v1/oauth/*, so baseUrl already has the correct path
      window.location.href = `${baseUrl}/oauth/apple`;
      return true;
    } catch (error) {
      console.error('Error initiating Apple login:', error);
      return false;
    }
  }

  async loginWithTwitter(): Promise<boolean> {
    try {
      // Get base URL which already includes /api/v1
      const baseUrl = this.apiService.getBaseUrl();
      // OAuth endpoints are at /api/v1/oauth/*, so baseUrl already has the correct path
      window.location.href = `${baseUrl}/oauth/twitter`;
      return true;
    } catch (error) {
      console.error('Error initiating Twitter login:', error);
      return false;
    }
  }

  private setUser(userDto: UserDto): void {
    this.currentUserDto.set(userDto);
    
    // Convert UserDto to User for backward compatibility
    const user: User = {
      id: userDto.id,
      name: `${userDto.firstName} ${userDto.lastName}`,
      email: userDto.email,
      isAuthenticated: true,
      provider: userDto.authProvider as any
    };
    
    this.currentUser.set(user);
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // Stop monitoring if no refresh token available
      this.stopTokenRefreshMonitoring();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.post<AuthResponse>('auth/refresh', { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update tokens in localStorage
          if (response.data.accessToken) {
            this.apiService.setToken(response.data.accessToken);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.refreshToken);
          }
          if (response.data.expiresAt) {
            // Store as ISO string for reliable parsing
            const expiresAt = response.data.expiresAt instanceof Date 
              ? response.data.expiresAt.toISOString() 
              : new Date(response.data.expiresAt).toISOString();
            localStorage.setItem('token_expires_at', expiresAt);
          }
          // Update user if provided
          if (response.data.user) {
            this.setUser(response.data.user);
          }
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Token refresh failed');
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // Stop monitoring before logout to prevent race conditions
        this.stopTokenRefreshMonitoring();
        // If refresh fails, clear tokens and logout
        // Use setTimeout to avoid calling logout during error handling
        setTimeout(() => {
          if (!localStorage.getItem('refresh_token') && !this.isLoggingOut) {
            // Only logout if refresh token is still missing and not already logging out
            this.logout();
          }
        }, 10); // Small delay to ensure other operations complete
        return throwError(() => error);
      })
    );
  }

  /**
   * Start proactive token refresh monitoring
   * Checks token expiration every 5 minutes and refreshes if expiring within 5 minutes
   */
  private startTokenRefreshMonitoring(): void {
    // Clear any existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Check token expiration periodically
    this.tokenRefreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.REFRESH_CHECK_INTERVAL);

    // Also check immediately on initialization
    this.checkAndRefreshToken();
  }

  /**
   * Check token expiration and refresh if needed
   */
  private checkAndRefreshToken(): void {
    // Check if refresh token exists before attempting refresh
    const refreshToken = localStorage.getItem('refresh_token');
    const accessToken = localStorage.getItem('access_token');
    
    if (!refreshToken) {
      // No refresh token available
      this.stopTokenRefreshMonitoring();
      if (accessToken) {
        // Have access token but no refresh token - session expired
        // Logout to clear stale auth state
        this.logout();
      }
      // If no tokens at all, user is not logged in - just stop monitoring (already done above)
      return;
    }

    const expiresAtStr = localStorage.getItem('token_expires_at');
    if (!expiresAtStr) {
      return; // No token expiration info
    }

    try {
      const expiresAt = new Date(expiresAtStr);
      
      // Validate parsed date
      if (isNaN(expiresAt.getTime())) {
        console.error('Invalid token expiration date format:', expiresAtStr);
        // Clear invalid date and logout user for security
        localStorage.removeItem('token_expires_at');
        this.handleTokenError('Invalid token expiration date. Please log in again.');
        return;
      }
      
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // If token expires within 5 minutes, refresh it
      if (timeUntilExpiry > 0 && timeUntilExpiry <= this.REFRESH_BEFORE_EXPIRY) {
        console.log('Token expiring soon, refreshing proactively...');
        // Fixed: Use take(1) for auto-cleanup to prevent memory leaks
        this.refreshToken().pipe(
          take(1) // Auto-unsubscribe after first emission
        ).subscribe({
          next: () => {
            console.log('Token refreshed successfully');
          },
          error: (err) => {
            console.warn('Proactive token refresh failed:', err);
            // If refresh fails (e.g., refresh token expired), logout will be called by refreshToken()
            // Stop monitoring to prevent repeated attempts
            this.stopTokenRefreshMonitoring();
          }
        });
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // Clear invalid date and logout user for security
      localStorage.removeItem('token_expires_at');
      this.handleTokenError('Error checking token expiration. Please log in again.');
    }
  }

  /**
   * Handle token errors by notifying user and logging out
   */
  private handleTokenError(message: string): void {
    console.error('Token error:', message);
    
    // Notify user if translation service is available
    if (this.translationService) {
      const userMessage = this.translationService.translate('auth.tokenError') || message;
      // Try to show toast notification if available
      // Note: ToastService would need to be injected if we want to use it here
      // For now, we'll log and logout
      console.warn('Token error - user will be logged out:', userMessage);
    }
    
    // Logout user for security
    // Use setTimeout to avoid calling logout during error handling
    setTimeout(() => {
      if (!this.isLoggingOut) {
        this.logout();
      }
    }, 100);
  }

  /**
   * Stop token refresh monitoring (called on logout)
   */
  private stopTokenRefreshMonitoring(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

}