import { Injectable, signal, inject } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentUserDto = signal<UserDto | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Inject LotteryService for lottery data loading (circular dependency handled via inject())
  private lotteryService = inject(LotteryService, { optional: true });
  
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
          this.apiService.setToken(response.data.accessToken);
          this.setUser(response.data.user);
          this.isAuthenticatedSubject.next(true);
          
          // TODO: Load lottery data when BE-1.6 is complete
          // The AuthResponse will include lotteryData field
          // this.loadLotteryDataOnLogin(response.data);
        }
      }),
      map(response => response.success),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(registerData: RegisterRequest): Observable<boolean> {
    return this.apiService.post<AuthResponse>('auth/register', registerData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.apiService.setToken(response.data.accessToken);
          this.setUser(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      map(response => response.success),
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
    
    this.apiService.clearToken();
    this.currentUser.set(null);
    this.currentUserDto.set(null);
    this.isAuthenticatedSubject.next(false);
    
    // Clear lottery data on logout
    if (this.lotteryService) {
      this.lotteryService.clearLotteryData();
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUserProfile(): Observable<UserDto> {
    return this.apiService.get<UserDto>('auth/me').pipe(
      tap(response => {
        // Update auth state when fetching user profile
        if (response.success && response.data) {
          this.setUser(response.data);
          this.isAuthenticatedSubject.next(true);
          
          // TODO: Load lottery data when BE-1.7 is complete
          // The /auth/me endpoint will include lotteryData field
          // this.loadLotteryDataFromProfile(response);
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
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

  verifyPhone(phone: string, code: string): Observable<boolean> {
    return this.apiService.post('auth/verify-phone', { phone, code }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Phone verification error:', error);
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

  /**
   * Load lottery data on login
   * Called after successful login to initialize lottery state
   * TODO: Implement when BE-1.6 is complete (AuthService login enhancement)
   * The AuthResponse will include a lotteryData field of type UserLotteryData
   */
  private loadLotteryDataOnLogin(authResponse: AuthResponse): void {
    // TODO: Extract lotteryData from authResponse when BE-1.6 is complete
    // if (authResponse.lotteryData && this.lotteryService) {
    //   this.lotteryService.initializeLotteryData(authResponse.lotteryData);
    // }
    console.log('loadLotteryDataOnLogin: Waiting for BE-1.6 (AuthService login enhancement)');
  }

  /**
   * Load lottery data from user profile
   * Called when fetching user profile to initialize lottery state
   * TODO: Implement when BE-1.7 is complete (AuthController /me endpoint enhancement)
   * The /auth/me response will include a lotteryData field
   */
  private loadLotteryDataFromProfile(profileResponse: any): void {
    // TODO: Extract lotteryData from profileResponse when BE-1.7 is complete
    // if (profileResponse.data?.lotteryData && this.lotteryService) {
    //   this.lotteryService.initializeLotteryData(profileResponse.data.lotteryData);
    // }
    console.log('loadLotteryDataFromProfile: Waiting for BE-1.7 (AuthController /me enhancement)');
  }
}