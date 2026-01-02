import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { TranslationService, Language } from './translation.service';
import { UserPreferencesService } from '../../features/user/services/user-preferences.service';
import { LoggingService } from './logging.service';

/**
 * Locale Service
 * Provides locale-aware formatting for dates, numbers, currency, and time
 * Integrates with TranslationService and UserPreferencesService to respect user's language and locale preferences
 */
@Injectable({
  providedIn: 'root'
})
export class LocaleService {
  private translationService = inject(TranslationService);
  private userPreferencesService = inject(UserPreferencesService);
  private logger = inject(LoggingService);

  // Current locale signal (e.g., 'en-US', 'es-ES', 'fr-FR', 'pl-PL')
  private currentLocale = signal<string>('en-US');

  // Language to locale mapping
  private readonly languageToLocaleMap: Record<Language, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'pl': 'pl-PL'
  };

  // Currency codes for each language
  private readonly languageToCurrencyMap: Record<Language, string> = {
    'en': 'USD',
    'es': 'EUR',
    'fr': 'EUR',
    'pl': 'PLN'
  };

  constructor() {
    // Initialize locale from current language
    const currentLanguage = this.translationService.getCurrentLanguage();
    this.updateLocaleFromLanguage(currentLanguage);

    // Watch for language changes - use effect to react to signal changes
    effect(() => {
      const language = this.translationService.getCurrentLanguage();
      // Update locale when language changes
      this.updateLocaleFromLanguage(language);
    });

    // Watch for user preferences changes (for currency, date format, etc.)
    effect(() => {
      const localization = this.userPreferencesService.localization();
      // Update currency if changed
      // Locale is already updated from language, but we can respect other preferences
      this.logger.debug('Localization preferences updated', { localization }, 'LocaleService');
    });

    this.logger.info('LocaleService initialized', {
      currentLocale: this.currentLocale(),
      currentLanguage: currentLanguage
    }, 'LocaleService');
  }

  /**
   * Get current locale (e.g., 'en-US')
   */
  getLocale(): string {
    return this.currentLocale();
  }

  /**
   * Get current locale as readonly signal
   */
  getCurrentLocale() {
    return this.currentLocale.asReadonly();
  }

  /**
   * Set locale directly (use with caution - prefer using language)
   */
  setLocale(locale: string): void {
    this.currentLocale.set(locale);
    this.logger.debug('Locale set', { locale }, 'LocaleService');
  }

  /**
   * Get locale from language code
   * Maps language codes to locale codes (e.g., 'en' -> 'en-US')
   */
  getLocaleFromLanguage(language: Language): string {
    return this.languageToLocaleMap[language] || 'en-US';
  }

  /**
   * Get currency code for current language
   */
  getCurrencyCode(): string {
    const language = this.translationService.getCurrentLanguage();
    const userCurrency = this.userPreferencesService.localization().currency;
    
    // Use user preference if set, otherwise use language default
    if (userCurrency && userCurrency !== 'USD') {
      return userCurrency;
    }
    
    return this.languageToCurrencyMap[language as Language] || 'USD';
  }

  /**
   * Update locale from language
   */
  private updateLocaleFromLanguage(language: Language): void {
    const locale = this.getLocaleFromLanguage(language);
    this.currentLocale.set(locale);
    this.logger.debug('Locale updated from language', { language, locale }, 'LocaleService');
  }

  /**
   * Format date according to user's locale and preferences
   * @param date - Date object or date string
   * @param format - Optional format string ('short', 'medium', 'long', 'full') or custom format
   * @returns Formatted date string
   */
  formatDate(date: Date | string, format?: 'short' | 'medium' | 'long' | 'full' | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        this.logger.warn('Invalid date provided to formatDate', { date }, 'LocaleService');
        return String(date);
      }

      const locale = this.getLocale();
      const userDateFormat = this.userPreferencesService.localization().dateFormat;
      
      // If custom format string provided, use it
      if (format && !['short', 'medium', 'long', 'full'].includes(format)) {
        // Custom format - parse format string (e.g., 'MM/DD/YYYY')
        return this.formatDateCustom(dateObj, format, locale);
      }

      // Use Intl.DateTimeFormat with locale and format
      const formatType: 'full' | 'medium' | 'short' | 'long' = (format === 'full' || format === 'medium' || format === 'short' || format === 'long') 
        ? format 
        : 'medium';
      const dateFormatOptions: Intl.DateTimeFormatOptions = this.getDateFormatOptions(formatType, userDateFormat);
      
      return new Intl.DateTimeFormat(locale, dateFormatOptions).format(dateObj);
    } catch (error) {
      this.logger.error('Error formatting date', { date, format, error }, 'LocaleService');
      return String(date);
    }
  }

  /**
   * Format number according to user's locale and preferences
   * @param value - Number to format
   * @param options - Optional Intl.NumberFormatOptions
   * @returns Formatted number string
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      const locale = this.getLocale();
      const numberFormat = this.userPreferencesService.localization().numberFormat;
      
      // Merge user preferences with provided options
      const formatOptions: Intl.NumberFormatOptions = {
        ...this.getNumberFormatOptions(numberFormat),
        ...options
      };

      return new Intl.NumberFormat(locale, formatOptions).format(value);
    } catch (error) {
      this.logger.error('Error formatting number', { value, options, error }, 'LocaleService');
      return String(value);
    }
  }

  /**
   * Format currency according to user's locale and preferences
   * @param amount - Amount to format
   * @param currency - Optional currency code (defaults to user's preferred currency)
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currency?: string): string {
    try {
      const locale = this.getLocale();
      const currencyCode = currency || this.getCurrencyCode();
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      this.logger.error('Error formatting currency', { amount, currency, error }, 'LocaleService');
      return `${currency || this.getCurrencyCode()} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Format time according to user's locale and preferences
   * @param date - Date object or date string
   * @returns Formatted time string
   */
  formatTime(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        this.logger.warn('Invalid date provided to formatTime', { date }, 'LocaleService');
        return String(date);
      }

      const locale = this.getLocale();
      const timeFormat = this.userPreferencesService.localization().timeFormat;
      
      const timeFormatOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        second: timeFormat === '24h' ? 'numeric' : undefined,
        hour12: timeFormat === '12h'
      };

      return new Intl.DateTimeFormat(locale, timeFormatOptions).format(dateObj);
    } catch (error) {
      this.logger.error('Error formatting time', { date, error }, 'LocaleService');
      return String(date);
    }
  }

  /**
   * Get date format options based on format type and user preference
   */
  private getDateFormatOptions(
    format: 'short' | 'medium' | 'long' | 'full',
    userDateFormat?: string
  ): Intl.DateTimeFormatOptions {
    // If user has specific date format preference, try to respect it
    if (userDateFormat && userDateFormat !== 'MM/DD/YYYY') {
      // Map user format to Intl options
      return this.mapDateFormatToOptions(userDateFormat);
    }

    // Default format options
    switch (format) {
      case 'short':
        return { year: 'numeric', month: 'numeric', day: 'numeric' };
      case 'medium':
        return { year: 'numeric', month: 'short', day: 'numeric' };
      case 'long':
        return { year: 'numeric', month: 'long', day: 'numeric' };
      case 'full':
        return { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
      default:
        return { year: 'numeric', month: 'short', day: 'numeric' };
    }
  }

  /**
   * Map user date format preference to Intl.DateTimeFormatOptions
   */
  private mapDateFormatToOptions(userDateFormat: string): Intl.DateTimeFormatOptions {
    // Simple mapping - can be enhanced
    if (userDateFormat.includes('YYYY')) {
      return { year: 'numeric', month: 'numeric', day: 'numeric' };
    }
    return { year: 'numeric', month: 'short', day: 'numeric' };
  }

  /**
   * Format date with custom format string
   */
  private formatDateCustom(date: Date, format: string, locale: string): string {
    // Use Intl.DateTimeFormat with specific parts
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(date);
    const partsMap: Record<string, string> = {};
    
    parts.forEach(part => {
      partsMap[part.type] = part.value;
    });

    // Replace format placeholders
    return format
      .replace('YYYY', partsMap['year'] || '')
      .replace('MM', partsMap['month'] || '')
      .replace('DD', partsMap['day'] || '')
      .replace('MMM', new Intl.DateTimeFormat(locale, { month: 'short' }).format(date))
      .replace('MMMM', new Intl.DateTimeFormat(locale, { month: 'long' }).format(date));
  }

  /**
   * Get number format options based on user preference
   */
  private getNumberFormatOptions(numberFormat: string): Intl.NumberFormatOptions {
    // Map number format preference to Intl options
    switch (numberFormat) {
      case 'US':
        return { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 };
      case 'EU':
        return { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 };
      case 'UK':
        return { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 };
      case 'IN':
        return { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 };
      default:
        return { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 };
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   * @param date - Date to format
   * @returns Relative time string
   */
  formatRelativeTime(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      const locale = this.getLocale();
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (Math.abs(diffDays) >= 1) {
        return rtf.format(diffDays, 'day');
      } else if (Math.abs(diffHours) >= 1) {
        return rtf.format(diffHours, 'hour');
      } else if (Math.abs(diffMinutes) >= 1) {
        return rtf.format(diffMinutes, 'minute');
      } else {
        return rtf.format(diffSeconds, 'second');
      }
    } catch (error) {
      this.logger.error('Error formatting relative time', { date, error }, 'LocaleService');
      return this.formatDate(date, 'short');
    }
  }

  /**
   * Get locale summary for debugging
   */
  getLocaleSummary(): Record<string, any> {
    return {
      currentLocale: this.currentLocale(),
      currentLanguage: this.translationService.getCurrentLanguage(),
      currency: this.getCurrencyCode(),
      dateFormat: this.userPreferencesService.localization().dateFormat,
      timeFormat: this.userPreferencesService.localization().timeFormat,
      numberFormat: this.userPreferencesService.localization().numberFormat
    };
  }
}

