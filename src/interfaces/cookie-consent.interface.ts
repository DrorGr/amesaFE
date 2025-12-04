/**
 * Cookie Consent Interface Definitions
 * Type definitions for cookie consent management
 */

/**
 * Cookie categories that can be consented to
 */
export type CookieCategory = 'essential' | 'analytics' | 'marketing' | 'functional';

/**
 * Cookie consent state interface
 * Tracks user's consent preferences for different cookie categories
 */
export interface CookieConsent {
  /**
   * Version of the consent format (for future migrations)
   */
  version: string;
  
  /**
   * ISO timestamp when consent was given/updated
   */
  timestamp: string;
  
  /**
   * Essential cookies - Always true, cannot be disabled
   * Required for basic website functionality
   */
  essential: boolean;
  
  /**
   * Analytics cookies - User behavior tracking
   * Google Analytics, performance monitoring, etc.
   */
  analytics: boolean;
  
  /**
   * Marketing cookies - Personalized ads and marketing
   * Third-party tracking, advertising networks, etc.
   */
  marketing: boolean;
  
  /**
   * Functional cookies - Enhanced features and preferences
   * User preferences, theme settings, language, etc.
   */
  functional: boolean;
}

/**
 * Default cookie consent state
 * All non-essential cookies are disabled by default
 */
export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  essential: true, // Always enabled
  analytics: false,
  marketing: false,
  functional: false
};

/**
 * Helper type for partial cookie consent updates
 */
export type PartialCookieConsent = Partial<Omit<CookieConsent, 'version' | 'timestamp' | 'essential'>>;


















