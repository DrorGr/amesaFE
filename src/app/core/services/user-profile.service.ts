import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

/** Subset of backend UserDto used for lottery purchase eligibility (matches Users.VerificationStatus). */
export interface CurrentUserSnapshot {
  verificationStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private api = inject(ApiService);

  /**
   * GET api/v1/auth/me — lower-case path matches the route observed working behind CloudFront.
   * VerificationStatus aligns with LotteryService.CheckVerificationRequirementAsync.
   */
  getCurrentUser(): Observable<CurrentUserSnapshot> {
    return this.api.get<Record<string, unknown>>('auth/me').pipe(
      timeout(15000),
      map((response: ApiResponse<Record<string, unknown>>) => {
        if (response.success && response.data) {
          const d = response.data;
          const vs = d['verificationStatus'] ?? d['VerificationStatus'];
          return {
            verificationStatus: typeof vs === 'string' ? vs.trim() : ''
          };
        }
        throw new Error(response.message || 'Failed to load user profile');
      }),
      catchError(err => {
        console.warn('[UserProfileService] getCurrentUser failed:', err);
        return throwError(() => err);
      })
    );
  }
}
