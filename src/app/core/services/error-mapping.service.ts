import { Injectable } from '@angular/core';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorMappingService {
  constructor(private translationService: TranslationService) {}

  getErrorMessage(error: any): string {
    const errorCode = error?.error?.error?.code || error?.error?.code || error?.code;
    const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message;

    // Map error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'RATE_LIMIT_EXCEEDED': 'auth.rateLimitExceeded',
      'CAPTCHA_FAILED': 'auth.captchaFailed',
      'EMAIL_NOT_VERIFIED': 'auth.emailNotVerified',
      'ACCOUNT_LOCKED': 'auth.accountLocked',
      'USER_NOT_FOUND': 'auth.userNotFound',
      'VALIDATION_ERROR': 'auth.validationError',
      'AUTHENTICATION_ERROR': 'auth.authenticationError',
      'INTERNAL_ERROR': 'auth.internalError',
      'PASSWORD_VALIDATION_FAILED': 'auth.passwordValidationFailed',
      'PASSWORD_IN_HISTORY': 'auth.passwordInHistory',
      'INVALID_TOKEN': 'auth.invalidToken',
      'TOKEN_EXPIRED': 'auth.tokenExpired',
      'SECURITY_VIOLATION': 'auth.securityViolation'
    };

    // Try to get translated message
    if (errorCode && errorMap[errorCode]) {
      const translated = this.translationService.translate(errorMap[errorCode]);
      if (translated !== errorMap[errorCode]) {
        return translated;
      }
    }

    // Fallback to error message or generic error
    return errorMessage || this.translationService.translate('auth.genericError');
  }

  getErrorCode(error: any): string | null {
    return error?.error?.error?.code || error?.error?.code || error?.code || null;
  }

  isRateLimitError(error: any): boolean {
    return this.getErrorCode(error) === 'RATE_LIMIT_EXCEEDED';
  }

  isEmailVerificationError(error: any): boolean {
    return this.getErrorCode(error) === 'EMAIL_NOT_VERIFIED';
  }

  isAccountLockedError(error: any): boolean {
    return this.getErrorCode(error) === 'ACCOUNT_LOCKED' || 
           error?.error?.error?.message?.includes('locked until');
  }

  getLockedUntilTime(error: any): string | null {
    const message = error?.error?.error?.message || error?.error?.message || '';
    const match = message.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    return match ? match[0] : null;
  }
}

