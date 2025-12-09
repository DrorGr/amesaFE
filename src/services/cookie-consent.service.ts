import { Injectable, signal, computed, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { CookieConsent, DEFAULT_COOKIE_CONSENT, PartialCookieConsent } from '../interfaces/cookie-consent.interface';
import { LoggingService } from './logging.service';
import { UserPreferencesService } from './user-preferences.service';

/**
 * Service for managing cookie consent preferences
 * Follows TranslationService/ToastService patterns with signals and localStorage persistence
 */
@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly STORAGE_KEY = 'amesa_cookie_consent';
  private readonly logger = inject(LoggingService);
  private userPreferencesService = inject(UserPreferencesService);
  
  // Reactive state with signals
  private consentSignal = signal<CookieConsent | null>(this.loadFromStorage());
  
  // Event emitter for opening preferences modal programmatically
  private openPreferencesSubject = new Subject<void>();
  public openPreferences$ = this.openPreferencesSubject.asObservable();
  
  // Public computed signals
  public consent = this.consentSignal.asReadonly();
  
  constructor() {
    this.logger.debug('CookieConsentService initialized', undefined, 'CookieConsentService');
    
    // Load from localStorage on init
    const stored = this.loadFromStorage();
    if (stored) {
      this.consentSignal.set(stored);
      this.syncWithUserPreferences(stored);
    }
  }

  /**
   * Check if user has given any consent
   * Returns true if consent exists (user has interacted with banner)
   */
  hasConsent(): boolean {
    return this.consentSignal() !== null;
  }

  /**
   * Get current consent preferences
   * Returns the current consent state or null if no consent given
   */
  getConsent(): CookieConsent | null {
    return this.consentSignal();
  }

  /**
   * Set consent preferences
   * Updates consent state and saves to localStorage
   */
  setConsent(categories: PartialCookieConsent): void {
    const current = this.consentSignal() || { ...DEFAULT_COOKIE_CONSENT };
    
    const updated: CookieConsent = {
      version: current.version || '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true, // Always true, cannot be changed
      analytics: categories.analytics ?? current.analytics ?? false,
      marketing: categories.marketing ?? current.marketing ?? false,
      functional: categories.functional ?? current.functional ?? false
    };

    this.logger.info('Setting cookie consent', updated, 'CookieConsentService');
    this.consentSignal.set(updated);
    this.saveToStorage(updated);
    this.syncWithUserPreferences(updated);
  }

  /**
   * Accept all cookies (enable all categories)
   */
  acceptAll(): void {
    this.logger.info('Accepting all cookies', undefined, 'CookieConsentService');
    this.setConsent({
      analytics: true,
      marketing: true,
      functional: true
    });
  }

  /**
   * Reject all non-essential cookies
   * Only essential cookies remain enabled
   */
  rejectAll(): void {
    this.logger.info('Rejecting all non-essential cookies', undefined, 'CookieConsentService');
    this.setConsent({
      analytics: false,
      marketing: false,
      functional: false
    });
  }

  /**
   * Revoke consent (clear all non-essential cookies)
   * Sets all non-essential categories to false
   */
  revokeConsent(): void {
    this.logger.info('Revoking cookie consent', undefined, 'CookieConsentService');
    this.setConsent({
      analytics: false,
      marketing: false,
      functional: false
    });
  }

  /**
   * Check if banner should be displayed
   * Returns true if no consent has been given yet
   */
  shouldShowBanner(): boolean {
    return this.consentSignal() === null;
  }

  /**
   * Programmatically open preferences modal
   * Emits event that component listens to
   */
  openPreferences(): void {
    this.logger.debug('Opening cookie preferences modal', undefined, 'CookieConsentService');
    this.openPreferencesSubject.next();
  }

  /**
   * Load consent from localStorage
   */
  private loadFromStorage(): CookieConsent | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as CookieConsent;
      
      // Validate structure
      if (!parsed.version || !parsed.timestamp) {
        this.logger.warn('Invalid cookie consent format in localStorage', parsed, 'CookieConsentService');
        return null;
      }

      // Ensure essential is always true
      parsed.essential = true;

      return parsed;
    } catch (error) {
      this.logger.error('Failed to load cookie consent from localStorage', { error }, 'CookieConsentService');
      return null;
    }
  }

  /**
   * Save consent to localStorage
   */
  private saveToStorage(consent: CookieConsent): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
      this.logger.debug('Cookie consent saved to localStorage', consent, 'CookieConsentService');
    } catch (error) {
      this.logger.error('Failed to save cookie consent to localStorage', { error }, 'CookieConsentService');
    }
  }

  /**
   * Sync consent with UserPreferencesService
   * Updates privacy.cookieConsent based on whether any non-essential cookies are enabled
   */
  private syncWithUserPreferences(consent: CookieConsent): void {
    try {
      const hasNonEssentialConsent = consent.analytics || consent.marketing || consent.functional;
      
      // Update user preferences if the value is different
      const currentPrefs = this.userPreferencesService.getPreferences();
      if (currentPrefs.privacy.cookieConsent !== hasNonEssentialConsent) {
        this.userPreferencesService.updatePrivacy({
          cookieConsent: hasNonEssentialConsent
        });
        this.logger.debug('Synced cookie consent with user preferences', {
          cookieConsent: hasNonEssentialConsent
        }, 'CookieConsentService');
      }
    } catch (error) {
      this.logger.error('Failed to sync cookie consent with user preferences', { error }, 'CookieConsentService');
    }
  }

  /**
   * Clear all consent data (for testing/debugging)
   */
  clearConsent(): void {
    this.logger.info('Clearing cookie consent', undefined, 'CookieConsentService');
    this.consentSignal.set(null);
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      this.logger.error('Failed to clear cookie consent from localStorage', { error }, 'CookieConsentService');
    }
  }
}






















