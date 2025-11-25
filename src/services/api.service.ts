import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { LoggingService } from './logging.service';

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
  private readonly DEBUG_LOG_KEY = 'oauth_debug_logs';
  private logger = inject(LoggingService);

  constructor(private http: HttpClient) {
    // Debug: Log the baseUrl being used
    this.debugLog('[API Service] Base URL:', this.baseUrl);
    this.debugLog('[API Service] Environment production:', environment.production);
    this.debugLog('[API Service] Environment backendUrl:', environment.backendUrl);
    
    // Fix: If localhost detected in production OR if baseUrl is relative and we're on CloudFront
    if (this.baseUrl.includes('localhost') || (!this.baseUrl.startsWith('http') && window.location.hostname.includes('cloudfront.net'))) {
      this.debugLog('[API Service] ERROR: Invalid baseUrl detected! Fixing...');
      // Force production URL
      this.baseUrl = 'https://dpqbvdgnenckf.cloudfront.net/api/v1';
      this.debugLog('[API Service] Fixed baseUrl to:', this.baseUrl);
    }
  }

  private debugLog(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data !== undefined ? JSON.stringify(data) : undefined
    };
    
    // Use LoggingService for console output (respects production mode)
    this.logger.debug(message, data, 'ApiService');
    
    // Persist to localStorage (survives navigation) - for OAuth debugging
    try {
      const existingLogs = JSON.parse(localStorage.getItem(this.DEBUG_LOG_KEY) || '[]');
      existingLogs.push(logEntry);
      // Keep only last 100 entries to avoid localStorage quota issues
      if (existingLogs.length > 100) {
        existingLogs.shift();
      }
      localStorage.setItem(this.DEBUG_LOG_KEY, JSON.stringify(existingLogs));
    } catch (e) {
      // If localStorage is full or unavailable, log warning
      this.logger.warn('Could not persist debug log to localStorage', { error: e }, 'ApiService');
    }
  }

  getDebugLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.DEBUG_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  clearDebugLogs(): void {
    localStorage.removeItem(this.DEBUG_LOG_KEY);
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
      this.debugLog('[API Service] Adding Authorization header', { tokenPreview: token.substring(0, 20) + '...' });
    } else {
      this.debugLog('[API Service] No token available for Authorization header');
    }

    return headers;
  }

  setToken(token: string): void {
    this.debugLog('[API Service] setToken called', {
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 30) + '...',
      hasTokenBefore: !!this.tokenSubject.value,
      storageBefore: !!localStorage.getItem('access_token')
    });
    
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
    
    // Verify immediately after setting
    const stored = localStorage.getItem('access_token');
    const inSubject = this.tokenSubject.value;
    this.debugLog('[API Service] setToken completed, verification', {
      inStorage: !!stored,
      inSubject: !!inSubject,
      matches: stored === token && inSubject === token
    });
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
      this.debugLog('[API Service] GET auth/me request', {
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
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = this.getHeaders();
    
    // Debug: Log OAuth exchange requests
    if (endpoint === 'oauth/exchange') {
      this.debugLog('[API Service] POST oauth/exchange request', {
        url,
        codeLength: data?.code?.length,
        codePreview: data?.code ? data.code.substring(0, 20) + '...' : 'none',
        hasAuthHeader: !!headers.get('Authorization'),
        // OAuth exchange shouldn't have auth header, but log it anyway
      });
    }
    
    return this.http.post<ApiResponse<T>>(url, data, {
      headers
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
    this.debugLog('[API Service] API Error', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      hasTokenBeforeClear: !!this.tokenSubject.value,
      tokenInStorageBeforeClear: !!localStorage.getItem('access_token')
    });
    
    if (error.status === 401) {
      // Only clear token if it's not an OAuth exchange endpoint
      // OAuth exchange failures shouldn't clear tokens (they don't have tokens yet)
      if (!error.url?.includes('/oauth/exchange')) {
        this.debugLog('[API Service] 401 error - clearing token (not OAuth exchange)');
        this.clearToken();
      } else {
        this.debugLog('[API Service] 401 error on OAuth exchange - NOT clearing token');
      }
    }

    throw error;
  };
}
