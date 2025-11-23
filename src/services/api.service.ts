import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.backendUrl || '/api/v1';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Debug: Log the baseUrl being used
    console.log('[API Service] Base URL:', this.baseUrl);
    console.log('[API Service] Environment production:', environment.production);
    console.log('[API Service] Environment backendUrl:', environment.backendUrl);
    
    // Fix: If localhost detected in production OR if baseUrl is relative and we're on CloudFront
    if (this.baseUrl.includes('localhost') || (!this.baseUrl.startsWith('http') && window.location.hostname.includes('cloudfront.net'))) {
      console.error('[API Service] ERROR: Invalid baseUrl detected! Fixing...');
      // Force production URL
      this.baseUrl = 'https://dpqbvdgnenckf.cloudfront.net/api/v1';
      console.log('[API Service] Fixed baseUrl to:', this.baseUrl);
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      // Debug: Log token presence (first 20 chars only for security)
      console.log('[API Service] Adding Authorization header, token preview:', token.substring(0, 20) + '...');
    } else {
      console.warn('[API Service] No token available for Authorization header');
    }

    return headers;
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
  }

  clearToken(): void {
    localStorage.removeItem('access_token');
    this.tokenSubject.next(null);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const headers = this.getHeaders();
    const url = `${this.baseUrl}/${endpoint}`;
    
    // Debug: Log request details for auth/me endpoint
    if (endpoint === 'auth/me') {
      const authHeader = headers.get('Authorization');
      console.log('[API Service] GET auth/me request:', {
        url,
        hasAuthHeader: !!authHeader,
        authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'none',
        tokenInStorage: !!localStorage.getItem('access_token'),
        tokenSubjectValue: !!this.tokenSubject.value
      });
    }

    return this.http.get<ApiResponse<T>>(url, {
      headers,
      params: httpParams
    }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: any): Observable<never> => {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      // Token expired or invalid
      this.clearToken();
      // Redirect to login or emit event
    }

    throw error;
  };
}
