import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../environments/environment';
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

  // Social Login Methods - OAuth Integration
  async loginWithGoogle(): Promise<boolean> {
    try {
      const googleAuthUrl = `${environment.backendUrl}/auth/google`;
      const popup = this.openOAuthPopup(googleAuthUrl, 'Google Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        this.apiService.setToken(result.token);
        this.setUser(result.user);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Google OAuth error:', error);
      return false;
    }
  }

  async loginWithMeta(): Promise<boolean> {
    try {
      const facebookAuthUrl = `${environment.backendUrl}/auth/facebook`;
      const popup = this.openOAuthPopup(facebookAuthUrl, 'Facebook Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        this.apiService.setToken(result.token);
        this.setUser(result.user);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return false;
    }
  }

  async loginWithApple(): Promise<boolean> {
    try {
      const appleAuthUrl = `${environment.backendUrl}/auth/apple`;
      const popup = this.openOAuthPopup(appleAuthUrl, 'Apple Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        this.apiService.setToken(result.token);
        this.setUser(result.user);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return false;
    }
  }

  async loginWithTwitter(): Promise<boolean> {
    // TODO: Implement Twitter OAuth integration
    console.log('Twitter login not yet implemented');
    return Promise.resolve(false);
  }

  // OAuth Helper Methods
  private openOAuthPopup(url: string, title: string): Window | null {
    const width = 600;
    const height = 700;
    const left = Math.max(0, (screen.width - width) / 2);
    const top = Math.max(0, (screen.height - height) / 2);
    
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'toolbar=no',
      'menubar=no',
      'scrollbars=yes',
      'resizable=yes',
      'status=no',
      'location=yes'
    ].join(',');
    
    try {
      const popup = window.open(url, title, features);
      
      if (popup) {
        popup.focus();
      }
      
      return popup;
    } catch (error) {
      console.error('Failed to open popup:', error);
      return null;
    }
  }

  private waitForOAuthCallback(popup: Window | null): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!popup) {
        reject(new Error('No popup window available'));
        return;
      }

      const timeout = setTimeout(() => {
        popup?.close();
        reject(new Error('OAuth authentication timed out. Please try again.'));
      }, 300000); // 5 minutes

      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          clearTimeout(timeout);
          reject(new Error('Authentication cancelled'));
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          console.warn('Received message from unauthorized origin:', event.origin);
          return;
        }

        if (event.data.type === 'oauth-success') {
          clearTimeout(timeout);
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          
          popup?.close();
          resolve(event.data);
        }
        else if (event.data.type === 'oauth-error') {
          clearTimeout(timeout);
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          
          popup?.close();
          reject(new Error(event.data.message || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);
    });
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