import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

// Two-Factor Authentication DTOs
export interface TwoFactorStatusDto {
  isEnabled: boolean;
  isVerified: boolean;
  setupDate?: Date;
}

export interface TwoFactorSetupDto {
  qrCodeUrl: string;
  manualEntryKey: string;
  secret: string;
}

export interface TwoFactorBackupCodesDto {
  backupCodes: string[];
  message?: string;
}

export interface VerifyTwoFactorRequest {
  code: string;
}

export interface VerifyTwoFactorSetupRequest {
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {
  private apiService = inject(ApiService);

  /**
   * Gets the 2FA status for the current user
   * GET /api/v1/auth/two-factor/status
   */
  getStatus(): Observable<ApiResponse<TwoFactorStatusDto>> {
    return this.apiService.get<TwoFactorStatusDto>('auth/two-factor/status').pipe(
      catchError(error => {
        console.error('Error getting 2FA status:', error);
        throw error;
      })
    );
  }

  /**
   * Generates 2FA setup information (QR code and secret)
   * POST /api/v1/auth/two-factor/setup
   */
  setup(): Observable<ApiResponse<TwoFactorSetupDto>> {
    return this.apiService.post<TwoFactorSetupDto>('auth/two-factor/setup', {}).pipe(
      catchError(error => {
        console.error('Error setting up 2FA:', error);
        throw error;
      })
    );
  }

  /**
   * Verifies the 2FA setup code
   * POST /api/v1/auth/two-factor/verify-setup
   */
  verifySetup(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/verify-setup', { code }).pipe(
      catchError(error => {
        console.error('Error verifying 2FA setup:', error);
        throw error;
      })
    );
  }

  /**
   * Enables 2FA for the current user (after successful setup verification)
   * POST /api/v1/auth/two-factor/enable
   */
  enable(code: string): Observable<ApiResponse<TwoFactorBackupCodesDto>> {
    return this.apiService.post<TwoFactorBackupCodesDto>('auth/two-factor/enable', { code }).pipe(
      catchError(error => {
        console.error('Error enabling 2FA:', error);
        throw error;
      })
    );
  }

  /**
   * Verifies a 2FA code during login
   * POST /api/v1/auth/two-factor/verify
   */
  verify(code: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/verify', { code }).pipe(
      catchError(error => {
        console.error('Error verifying 2FA code:', error);
        throw error;
      })
    );
  }

  /**
   * Verifies a backup code during login
   * POST /api/v1/auth/two-factor/verify
   * Note: Uses same endpoint as verify() but with backup code instead of TOTP code
   */
  verifyBackupCode(backupCode: string): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/verify', { code: backupCode }).pipe(
      catchError(error => {
        console.error('Error verifying backup code:', error);
        throw error;
      })
    );
  }

  /**
   * Generates new backup codes (invalidates old ones)
   * POST /api/v1/auth/two-factor/backup-codes
   */
  generateBackupCodes(): Observable<ApiResponse<TwoFactorBackupCodesDto>> {
    return this.apiService.post<TwoFactorBackupCodesDto>('auth/two-factor/backup-codes', {}).pipe(
      catchError(error => {
        console.error('Error generating backup codes:', error);
        throw error;
      })
    );
  }

  /**
   * Disables 2FA for the current user
   * POST /api/v1/auth/two-factor/disable
   */
  disable(): Observable<ApiResponse<any>> {
    return this.apiService.post<any>('auth/two-factor/disable', {}).pipe(
      catchError(error => {
        console.error('Error disabling 2FA:', error);
        throw error;
      })
    );
  }
}




