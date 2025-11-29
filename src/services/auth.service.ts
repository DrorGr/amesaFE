import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { 
  User, 
  UserDto, 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest,
  UpdateUserProfileRequest 
} from '../models/house.model';
import { UserLotteryData } from '../interfaces/lottery.interface';
import { LotteryService } from './lottery.service';
import { RealtimeService } from './realtime.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentUserDto = signal<UserDto | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Inject LotteryService for lottery data loading (circular dependency handled via inject())
  private lotteryService = inject(LotteryService, { optional: true });
  private realtimeService = inject(RealtimeService, { optional: true });
  
  private router = inject(Router, { optional: true });

  constructor(private apiService: ApiService) {
    // Check if user is already authenticated on service initialization
    this.checkAuthStatus();
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
      this.getCurrentUserProfile().subscribe({
        next: (user) => {
          this.setUser(user);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  login(email: string, password: string): Observable<boolean> {
    const loginRequest: LoginRequest = { email, password };
    
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
            this.setUser(response.data.user);
            this.isAuthenticatedSubject.next(true);
            
            // Load lottery data if available
            if (response.data.lotteryData && this.lotteryService) {
              this.lotteryService.initializeLotteryData(response.data.lotteryData);
            } else if (this.lotteryService) {
              // If lotteryData not in response, explicitly fetch favorites from backend
              // This ensures favorites are loaded even if backend doesn't include them in login response
              this.lotteryService.getFavoriteHouses().subscribe({
                next: () => {
                  // Favorites loaded successfully
                },
                error: (err) => {
                  console.warn('Failed to load favorites on login:', err);
                  // Non-critical error - continue with login
                }
              });
            }
            
            // Connect to SignalR for real-time updates (FE-2.6)
            if (this.realtimeService && response.data.user) {
              this.connectToSignalR(response.data.user.id);
            }
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
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      this.apiService.post('auth/logout', { refreshToken }).subscribe();
    }
    
    // Clear all tokens
    this.apiService.clearToken();
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    
    // Clear all user data
    this.currentUser.set(null);
    this.currentUserDto.set(null);
    this.isAuthenticatedSubject.next(false);
    
    // Clear lottery data on logout
    if (this.lotteryService) {
      this.lotteryService.clearLotteryData();
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
   */
  private async connectToSignalR(userId: string): Promise<void> {
    if (!this.realtimeService) {
      return;
    }

    try {
      await this.realtimeService.startConnection();
      await this.realtimeService.joinUserGroup(userId);
      console.log('Connected to SignalR and joined user group');
    } catch (error) {
      console.error('Error connecting to SignalR:', error);
    }
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
          
          // Load lottery data if available (BE-1.7 enhancement)
          if (response.data.lotteryData && this.lotteryService) {
            this.lotteryService.initializeLotteryData(response.data.lotteryData);
          } else if (this.lotteryService) {
            // If lotteryData not in response, explicitly fetch favorites from backend
            // This ensures favorites are loaded on page refresh or auth check
            this.lotteryService.getFavoriteHouses().subscribe({
              next: () => {
                // Favorites loaded successfully
              },
              error: (err) => {
                console.warn('Failed to load favorites on auth check:', err);
                // Non-critical error - continue
              }
            });
          }
          
          // Connect to SignalR for real-time updates (FE-2.6)
          if (this.realtimeService && userData) {
            this.connectToSignalR(userData.id);
          }
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
    // TODO: Implement Apple OAuth integration
    console.log('Apple login not yet implemented');
    return Promise.resolve(false);
  }

  async loginWithTwitter(): Promise<boolean> {
    // TODO: Implement Twitter OAuth integration
    console.log('Twitter login not yet implemented');
    return Promise.resolve(false);
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

}