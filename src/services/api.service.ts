import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, switchMap, retryWhen, delay, take, concatMap } from 'rxjs/operators';
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
  private tokenRefreshCallback: (() => Observable<unknown>) | null = null;
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Check if we're in a test environment
    const isTestEnvironment = typeof window !== 'undefined' && 
                             ((window as any).__karma__ !== undefined ||
                              (window.location.hostname === 'localhost' && window.location.port === '9876'));
    
    // In test environment, use relative URLs so HttpClientTestingModule can intercept them
    if (isTestEnvironment) {
      this.baseUrl = '/api/v1';
    } else {
      // In development (localhost), use relative URLs so proxy can handle routing to ALB
      const isDevelopment = typeof window !== 'undefined' && 
                          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      if (isDevelopment) {
        // Use relative URL for proxy routing in development
        this.baseUrl = '/api/v1';
      } else if (!this.baseUrl.startsWith('http') && typeof window !== 'undefined' && window.location.hostname.includes('cloudfront.net')) {
        // Fix: If baseUrl is relative and we're on CloudFront (production), use absolute URL
        console.warn('[API Service] Relative baseUrl detected on CloudFront, using production URL');
        this.baseUrl = 'https://dpqbvdgnenckf.cloudfront.net/api/v1';
      }
      // If baseUrl already includes localhost in non-dev environment, that's an error
      else if (this.baseUrl.includes('localhost') && !isDevelopment) {
        console.error('[API Service] ERROR: Invalid baseUrl detected! Fixing...');
        this.baseUrl = 'https://dpqbvdgnenckf.cloudfront.net/api/v1';
        console.log('[API Service] Fixed baseUrl to:', this.baseUrl);
      }
    }
  }
  
  /**
   * Build URL from baseUrl and endpoint, handling leading slashes properly
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // If baseUrl is relative (starts with /), use it as-is
    if (this.baseUrl.startsWith('/')) {
      // For relative URLs, ensure no double slashes
      return `${this.baseUrl}/${cleanEndpoint}`;
    }
    
    // For absolute URLs, ensure baseUrl doesn't end with slash
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
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
    }

    return headers;
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
  }

  clearToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    this.tokenSubject.next(null);
  }

  /**
   * Set callback for token refresh (called by AuthService)
   */
  setTokenRefreshCallback(callback: () => Observable<unknown>): void {
    this.tokenRefreshCallback = callback;
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

    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleErrorWithRetry(error, () => 
        this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), {
          headers: this.getHeaders(),
          params: httpParams
        })
      ))
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const token = this.getStoredToken();
    
    // For null/undefined, determine if we should send no body or empty object
    // For favorites endpoint, backend accepts both, but let's try sending null (no body) for better compatibility
    const hasNoBody = data === null || data === undefined;
    const body = hasNoBody ? null : data;
    
    // Build headers - if no body, we can optionally omit Content-Type
    // But Angular HttpClient will add it anyway, so we'll keep it for consistency
    let headers = this.getHeaders();
    
    // Angular HttpClient will send null as empty body (no Content-Length header)
    // This is better than {} for endpoints that don't expect a body
    return this.http.post<ApiResponse<T>>(url, body, {
      headers: headers
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleErrorWithRetry(error, () => 
        this.http.post<ApiResponse<T>>(url, body, {
          headers: this.getHeaders()
        })
      ))
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), data, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleErrorWithRetry(error, () => 
        this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), data, {
          headers: this.getHeaders()
        })
      ))
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders();
    
    return this.http.delete<ApiResponse<T>>(url, {
      headers: headers
    }).pipe(
      catchError((error: HttpErrorResponse) => this.handleErrorWithRetry(error, () => 
        this.http.delete<ApiResponse<T>>(url, {
          headers: this.getHeaders()
        })
      ))
    );
  }

  /**
   * Handle error with automatic retry on 401 after token refresh
   */
  private handleErrorWithRetry = <T>(error: HttpErrorResponse, retryRequest: () => Observable<T>): Observable<T> => {
    // Don't log 200 status codes as errors (false positives from response format issues)
    if (error.status === 200) {
      // 200 responses shouldn't be logged as errors - likely response format mismatch
      // The calling code will handle this appropriately
      return throwError(() => error);
    }
    
    // #region agent log
    // Track 500 errors for identity/status endpoint debugging
    if (error.status === 500 && error.url?.includes('/identity/status')) {
      // Import environment at top of file if not already imported
      const isProduction = (window as any).location?.hostname?.includes('cloudfront.net') || 
                          (window as any).location?.hostname?.includes('amazonaws.com');
      if (typeof fetch !== 'undefined' && !isProduction) {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'api.service.ts:handleErrorWithRetry',
            message: '500 error on identity/status endpoint',
            data: {
              url: error.url,
              status: error.status,
              statusText: error.statusText,
              error: error.error,
              headers: error.headers?.keys()
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B'
          })
        }).catch(() => {});
      }
    }
    // #endregion
    
    // Suppress 500 errors FIRST - these are backend issues, not frontend bugs
    // Check for 500 status or identity/status endpoint (which returns 500)
    if (error.status === 500 || error.url?.includes('/identity/status')) {
      // Suppress 500 errors completely - these are backend issues, not frontend bugs
      // Logging them creates console noise without actionable information
      return throwError(() => error);
    }
    
    // Log 400 errors with full details for debugging
    // BUT: Suppress expected 400 errors for favorites endpoints (already in favorites / not in favorites)
    if (error.status === 400) {
      const errorMessage = error.error?.message || '';
      const isFavoritesEndpoint = error.url?.includes('/favorite');
      const isExpectedError = isFavoritesEndpoint && (
        errorMessage.includes('already be in favorites') ||
        errorMessage.includes('may not exist or already be in favorites') ||
        errorMessage.includes('may not be in favorites')
      );
      
      // Only log unexpected 400 errors
      if (!isExpectedError) {
        console.error('API 400 Error - Full Details:', {
          url: error.url,
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          errorMessage: error.error?.message || 'No error message',
          errorCode: error.error?.error?.code || error.error?.code || 'No error code',
          fullErrorResponse: error.error
        });
      }
    } else if (error.status === 401 || error.status === 403) {
      // Don't log auth errors - handled elsewhere
    } else {
      console.error('API Error:', error.status, error.statusText, error.url);
    }
    
    // Handle 401 errors with automatic token refresh and retry
    if (error.status === 401) {
      // Skip retry for auth endpoints (login, register, refresh) to avoid infinite loops
      const isAuthEndpoint = error.url?.includes('/auth/') || error.url?.includes('/oauth/');
      if (isAuthEndpoint) {
        this.clearToken();
        return throwError(() => error);
      }

      // Attempt token refresh and retry
      if (this.tokenRefreshCallback && !this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshSubject.next(true);

        return this.tokenRefreshCallback!().pipe(
          switchMap(() => {
            // Token refreshed successfully, retry original request
            this.isRefreshing = false;
            this.refreshSubject.next(false);
            return retryRequest();
          }),
          catchError((refreshError) => {
            // Token refresh failed, clear tokens and throw error
            this.isRefreshing = false;
            this.refreshSubject.next(false);
            this.clearToken();
            return throwError(() => refreshError);
          })
        );
      } else if (this.isRefreshing) {
        // Already refreshing, wait for refresh to complete then retry
        return this.refreshSubject.pipe(
          switchMap((refreshing) => {
            if (!refreshing) {
              // Refresh completed, retry request
              return retryRequest();
            }
            // Wait a bit and check again
            return of(null).pipe(
              delay(100),
              switchMap(() => this.refreshSubject.pipe(
                take(1),
                switchMap((stillRefreshing) => {
                  if (!stillRefreshing) {
                    return retryRequest();
                  }
                  // Give up after waiting
                  this.clearToken();
                  return throwError(() => error);
                })
              ))
            );
          }),
          catchError(() => {
            this.clearToken();
            return throwError(() => error);
          })
        );
      } else {
        // No refresh callback available, clear token and throw error
        this.clearToken();
        return throwError(() => error);
      }
    }

    return throwError(() => error);
  };

  private handleError = (error: any): Observable<never> => {
    // Legacy error handler for backward compatibility
    return this.handleErrorWithRetry(error, () => throwError(() => error));
  };
}
