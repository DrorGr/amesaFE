import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { VerifyIdentityRequest, IdentityVerificationResult, IdentityVerificationStatus } from '../interfaces/identity-verification.interface';

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
    // Use ApiService's get method which handles authentication headers automatically
    return this.apiService.get<IdentityVerificationStatus>('auth/identity/status').pipe(
      map(response => response.data!)
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

