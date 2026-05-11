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
   * GET api/v1/Auth/me — matches AuthController route token `[controller]` → `Auth`.
   * VerificationStatus aligns with LotteryService.CheckVerificationRequirementAsync.
   * Falls back to `auth/me` if the gateway is case-sensitive and only routes lowercase paths.
   */
  getCurrentUser(): Observable<CurrentUserSnapshot> {
    const mapProfile = map((response: ApiResponse<Record<string, unknown>>) => {
      if (response.success && response.data) {
        const d = response.data;
        const vs = d['verificationStatus'] ?? d['VerificationStatus'];
        return {
          verificationStatus: typeof vs === 'string' ? vs.trim() : ''
        };
      }
      throw new Error(response.message || 'Failed to load user profile');
    });

    const primary = this.api.get<Record<string, unknown>>('Auth/me').pipe(timeout(15000), mapProfile);

    return primary.pipe(
      catchError(firstErr => {
        console.warn('[UserProfileService] Auth/me failed, retrying auth/me:', firstErr);
        return this.api.get<Record<string, unknown>>('auth/me').pipe(timeout(15000), mapProfile);
      }),
      catchError(err => {
        console.warn('[UserProfileService] getCurrentUser failed:', err);
        return throwError(() => err);
      })
    );
  }
}
