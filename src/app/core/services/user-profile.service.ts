import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

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
   * GET api/v1/auth/me — VerificationStatus aligns with LotteryService.CheckVerificationRequirementAsync.
   */
  getCurrentUser(): Observable<CurrentUserSnapshot> {
    return this.api.get<CurrentUserSnapshot>('auth/me').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to load user profile');
      })
    );
  }
}
