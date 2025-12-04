import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { VerifyIdentityRequest, IdentityVerificationResult, IdentityVerificationStatus } from '../interfaces/identity-verification.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IdentityVerificationService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  /**
   * Verify identity with ID and selfie images
   */
  verifyIdentity(request: VerifyIdentityRequest): Observable<IdentityVerificationResult> {
    // Use ApiService's get method which handles authentication headers automatically
    return this.apiService.post<IdentityVerificationResult>('auth/identity/verify', request).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Get current verification status
   */
  getVerificationStatus(): Observable<IdentityVerificationStatus> {
    // #region agent log
    if (typeof fetch !== 'undefined' && !environment.production) {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'identity-verification.service.ts:getVerificationStatus',
          message: 'Calling getVerificationStatus - BEFORE request',
          data: { endpoint: 'auth/identity/status' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
    }
    // #endregion
    
    // Use ApiService's get method which handles authentication headers automatically
    return this.apiService.get<IdentityVerificationStatus>('auth/identity/status').pipe(
      map(response => {
        // #region agent log
        if (typeof fetch !== 'undefined' && !environment.production) {
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'identity-verification.service.ts:getVerificationStatus',
              message: 'getVerificationStatus - SUCCESS',
              data: { response: response, hasData: !!response.data },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'A'
            })
          }).catch(() => {});
        }
        // #endregion
        return response.data!;
      }),
      catchError((error: any) => {
        // #region agent log
        if (typeof fetch !== 'undefined' && !environment.production) {
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'identity-verification.service.ts:getVerificationStatus',
              message: 'getVerificationStatus - ERROR',
              data: {
                status: error?.status,
                statusText: error?.statusText,
                url: error?.url,
                error: error?.error
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'B'
            })
          }).catch(() => {});
        }
        // #endregion
        
        // Return default "not_started" status on 500 errors (backend issue)
        // This prevents the app from breaking when the backend endpoint fails
        if (error?.status === 500) {
          return of({
            verificationStatus: 'not_started',
            verificationAttempts: 0
          } as IdentityVerificationStatus);
        }
        
        // Re-throw other errors
        throw error;
      })
    );
  }

  /**
   * Retry verification after rejection
   */
  retryVerification(request: VerifyIdentityRequest): Observable<IdentityVerificationResult> {
    // Use ApiService's post method which handles authentication headers automatically
    return this.apiService.post<IdentityVerificationResult>('auth/identity/retry', request).pipe(
      map(response => response.data!)
    );
  }
}

