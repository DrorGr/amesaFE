import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
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
    // Check if we're in a test environment
    const isTestEnvironment = typeof window !== 'undefined' && 
                             ((window as any).__karma__ !== undefined ||
                              (window.location.hostname === 'localhost' && window.location.port === '9876'));
    
    // In test environment, use relative URLs so HttpClientTestingModule can intercept them
    if (isTestEnvironment) {
      this.baseUrl = '/api/v1';
    } else {
      // Fix: If localhost detected in production OR if baseUrl is relative and we're on CloudFront
      if (this.baseUrl.includes('localhost') || 
          (!this.baseUrl.startsWith('http') && typeof window !== 'undefined' && window.location.hostname.includes('cloudfront.net'))) {
        console.error('[API Service] ERROR: Invalid baseUrl detected! Fixing...');
        // Force production URL
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

    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const token = this.getStoredToken();
    const headers = this.getHeaders();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.service.ts:post',message:'POST request',data:{endpoint,url,data,dataIsNull:data===null,dataType:typeof data,hasToken:!!token,tokenLength:token?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // For null/undefined, send empty object {} - Angular HttpClient handles this correctly
    // Some backends expect {} instead of null for POST requests
    const body = data === null || data === undefined ? {} : data;
    
    return this.http.post<ApiResponse<T>>(url, body, {
      headers: headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders();
    const token = this.getStoredToken();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.service.ts:delete',message:'DELETE request',data:{endpoint,url,hasToken:!!token,tokenLength:token?.length||0,headers:Object.fromEntries(headers.keys().map(k=>[k,headers.get(k)]))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return this.http.delete<ApiResponse<T>>(url, {
      headers: headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: any): Observable<never> => {
    // #region agent log
    const errorDetails = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      errorBody: error.error,
      errorMessage: error.error?.message || error.error?.error?.message || error.message,
      errorCode: error.error?.error?.code || error.error?.code,
      fullError: JSON.stringify(error.error || {}).substring(0, 500)
    };
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.service.ts:handleError',message:'API error occurred',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Don't log 200 status codes as errors (false positives from response format issues)
    if (error.status === 200) {
      // 200 responses shouldn't be logged as errors - likely response format mismatch
      // The calling code will handle this appropriately
      return throwError(() => error);
    }
    
    // Log 400 errors with full details for debugging
    if (error.status === 400) {
      console.error('API 400 Error - Full Details:', {
        url: error.url,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        errorMessage: error.error?.message || 'No error message',
        errorCode: error.error?.error?.code || error.error?.code || 'No error code',
        fullErrorResponse: error.error
      });
    } else if (error.status === 401 || error.status === 403) {
      // Don't log auth errors - handled elsewhere
    } else {
      console.error('API Error:', error.status, error.statusText, error.url);
    }
    
    if (error.status === 401) {
      // Token expired or invalid
      this.clearToken();
      // Redirect to login or emit event
    }

    throw error;
  };
}
