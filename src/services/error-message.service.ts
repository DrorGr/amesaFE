import { Injectable, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {
  private translationService = inject(TranslationService);

  getErrorMessage(error: any): string {
    const code = error?.error?.code || error?.code;
    const message = error?.error?.message || error?.message;
    
    const errorMap: Record<string, string> = {
      'PARTICIPANT_CAP_REACHED': 'entry.capReached',
      'ID_VERIFICATION_REQUIRED': 'error.idVerificationRequired',
      'WATCHLIST_ITEM_EXISTS': 'watchlist.alreadyInWatchlist',
      'WATCHLIST_ITEM_NOT_FOUND': 'watchlist.notFound',
      'NETWORK_ERROR': 'error.networkError',
      'TIMEOUT': 'error.timeout',
      'UNAUTHORIZED': 'error.unauthorized',
      'NOT_FOUND': 'error.notFound',
      'INTERNAL_ERROR': 'error.internalError'
    };
    
    const translationKey = errorMap[code] || 'error.generic';
    const translatedMessage = this.translationService.translate(translationKey);
    
    // If translation key doesn't exist or returns the key itself, use a fallback
    if (translatedMessage === translationKey && message) {
      return message;
    }
    
    return translatedMessage;
  }
}















