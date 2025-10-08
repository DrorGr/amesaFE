import { Injectable, signal } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentUserDto = signal<UserDto | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
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
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUserProfile(): Observable<UserDto> {
    return this.apiService.get<UserDto>('auth/me').pipe(
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

  // Social Login Methods (to be implemented with OAuth providers)
  async loginWithGoogle(): Promise<boolean> {
    // TODO: Implement Google OAuth integration
    console.log('Google login not yet implemented');
    return Promise.resolve(false);
  }

  async loginWithMeta(): Promise<boolean> {
    // TODO: Implement Meta/Facebook OAuth integration
    console.log('Meta login not yet implemented');
    return Promise.resolve(false);
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