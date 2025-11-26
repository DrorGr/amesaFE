import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoggingService } from './logging.service';

export type Language = 'en' | 'es' | 'fr' | 'pl';

export type Translations = Record<string, string>;

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName?: string;
  flagUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface TranslationsResponse {
  languageCode: string;
  translations: Translations;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('en');
  private translationsCache = signal<Map<Language, Translations>>(new Map());
  private lastUpdated = new Map<Language, Date>();
  private isLoading = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<string | null>(null);
  private loadingProgress = new BehaviorSubject<number>(0);
  private loadingMessage = new BehaviorSubject<string>('Initializing...');
  
  // No fallback translations - rely entirely on backend API
  private apiService = inject(ApiService);
  private logger = inject(LoggingService);

  constructor() {
    this.logger.debug('Constructor called', { 
      initialLanguage: this.currentLanguage(),
      baseUrl: this.apiService.getBaseUrl()
    }, 'TranslationService');
    
    // Load initial translations
    this.logger.debug('Loading initial translations...', undefined, 'TranslationService');
    this.loadTranslations(this.currentLanguage());
  }

  // Public observables
  getCurrentLanguage = this.currentLanguage.asReadonly();
  isLoading$ = this.isLoading.asObservable();
  error$ = this.error.asObservable();
  loadingProgress$ = this.loadingProgress.asObservable();
  loadingMessage$ = this.loadingMessage.asObservable();

  // Computed signal for current translations
  currentTranslations = computed(() => {
    const lang = this.currentLanguage();
    return this.translationsCache().get(lang) || {};
  });

  // Available languages with their info
  availableLanguages: LanguageInfo[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flagUrl: 'https://flagcdn.com/w40/us.png',
      isActive: true,
      isDefault: true,
      displayOrder: 1
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flagUrl: 'https://flagcdn.com/w40/es.png',
      isActive: true,
      isDefault: false,
      displayOrder: 2
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flagUrl: 'https://flagcdn.com/w40/fr.png',
      isActive: true,
      isDefault: false,
      displayOrder: 3
    },
    {
      code: 'pl',
      name: 'Polish',
      nativeName: 'Polski',
      flagUrl: 'https://flagcdn.com/w40/pl.png',
      isActive: true,
      isDefault: false,
      displayOrder: 4
    }
  ];

  /**
   * Get translation for a key in the current language
   * Returns a signal that updates reactively when language changes
   */
  translate(key: string): string {
    // Explicitly read both signals to ensure Angular tracks them
    const lang = this.currentLanguage();
    const translations = this.currentTranslations();
    const translation = translations[key];
    
    // #region agent log - throttled to prevent ERR_INSUFFICIENT_RESOURCES
    if (!translation && (!(window as any).__translationLogThrottle || Date.now() - (window as any).__translationLogThrottle > 1000)) {
      (window as any).__translationLogThrottle = Date.now();
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:translate',message:'Missing translation',data:{key,lang,translationCount:Object.keys(translations).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    
    if (!translation) {
      this.logger.warn('Missing translation', { 
        key, 
        language: lang 
      }, 'TranslationService');
      // Return the key itself as fallback, but log the missing translation
      return key;
    }
    
    return translation;
  }

  /**
   * Set the current language and load translations if not cached
   */
  setLanguage(language: Language): void {
    const currentLang = this.currentLanguage();
    if (currentLang === language) {
      this.logger.debug('Language already set', { language }, 'TranslationService');
      return; // Already set to this language
    }

    this.logger.info('Switching language', { from: currentLang, to: language }, 'TranslationService');
    
    // Show simple loader when changing language
    this.isLoading.next(true);
    this.error.next(null); // Clear any previous errors
    
    // Load translations if not in cache or cache is stale
    if (!this.translationsCache().has(language) || this.isCacheStale(language)) {
      // Load translations first, then switch language when ready
      this.loadTranslations(language, true); // true = switch language after loading
    } else {
      // Translations are cached, switch immediately and update cache signal
      const newCache = new Map(this.translationsCache());
      // Force cache update to trigger computed signal
      this.translationsCache.set(newCache);
      this.currentLanguage.set(language);
      
      // Hide loader quickly
      setTimeout(() => {
        this.isLoading.next(false);
      }, 100);
    }
  }


  /**
   * Get available languages
   */
  getAvailableLanguages(): LanguageInfo[] {
    return this.availableLanguages.filter(lang => lang.isActive);
  }

  /**
   * Load translations from backend API with timeout and proper error handling
   * @param language - Language to load translations for
   * @param switchAfterLoad - If true, switch current language after translations are loaded
   */
  private loadTranslations(language: Language, switchAfterLoad = false): void {
    this.logger.info('Loading translations', { language }, 'TranslationService');
    this.isLoading.next(true);
    this.error.next(null);

    const url = `translations/${language}`;
    this.logger.debug('Making API request', { url, language }, 'TranslationService');

    // Add timeout of 10 seconds
    const timeoutDuration = 10000;
    const timeoutTimer = setTimeout(() => {
      this.logger.warn('API request timeout', { language, timeoutDuration }, 'TranslationService');
      this.handleTranslationLoadError(language, new Error('Request timeout'));
    }, timeoutDuration);

    this.apiService.get<TranslationsResponse>(url)
      .pipe(
        tap(response => {
          clearTimeout(timeoutTimer);
          this.logger.debug('API Response received', { response }, 'TranslationService');
        }),
        map(response => {
          if (response.success && response.data) {
            const translationCount = Object.keys(response.data.translations || {}).length;
            this.logger.debug('Translations data received', { 
              translationCount,
              language: response.data.languageCode 
            }, 'TranslationService');
            return response.data;
          }
          this.logger.error('Invalid response format', { response }, 'TranslationService');
          throw new Error('Invalid response format');
        }),
        tap(data => {
          const translationCount = Object.keys(data.translations || {}).length;
          this.logger.debug('Caching translations', { language, translationCount }, 'TranslationService');
          
          // Warn if translations are empty
          if (translationCount === 0) {
            this.logger.warn('No translations found for language', { language }, 'TranslationService');
            this.error.next(`No translations available for ${language.toUpperCase()}. Please ensure the database is seeded.`);
          }
          
          // Update cache - create new Map to trigger signal update
          const newCache = new Map(this.translationsCache());
          newCache.set(language, data.translations || {});
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date(data.lastUpdated));
          
          // Switch language AFTER translations are cached (if requested)
          if (switchAfterLoad) {
            this.currentLanguage.set(language);
            this.logger.info('Language switched after translations loaded', { language }, 'TranslationService');
          }
          
          if (translationCount > 0) {
            this.error.next(null);
            this.logger.info('Translations loaded successfully', { language, translationCount, switched: switchAfterLoad }, 'TranslationService');
          } else {
            this.logger.warn('Translations loaded but empty', { language }, 'TranslationService');
          }
          
          // Hide loader quickly
          setTimeout(() => {
            this.isLoading.next(false);
          }, translationCount > 0 ? 200 : 1000);
        }),
        catchError(error => {
          clearTimeout(timeoutTimer);
          return this.handleTranslationLoadError(language, error);
        })
      )
      .subscribe();
  }

  /**
   * Handle translation loading errors - NO fallback, show error
   */
  private handleTranslationLoadError(language: Language, error: unknown): Observable<null> {
    const httpError = error as { status?: number | string; statusText?: string; url?: string };
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: httpError?.status || 'Unknown',
      statusText: httpError?.statusText || 'Unknown',
      url: httpError?.url || 'Unknown',
      language
    };
    
    this.logger.error('Failed to load translations', errorDetails, 'TranslationService');
    
    const errorMessage = `Failed to load ${language.toUpperCase()} translations from server`;
    this.error.next(errorMessage);
    
    // Hide loader quickly on error
    setTimeout(() => {
      this.isLoading.next(false);
    }, 1000);
    
    return of(null);
  }

  /**
   * Check if cache is stale (older than 1 hour)
   */
  private isCacheStale(language: Language): boolean {
    const lastUpdate = this.lastUpdated.get(language);
    if (!lastUpdate) {
      return true;
    }
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdate < oneHourAgo;
  }

  /**
   * Refresh translations for current language
   */
  refreshTranslations(): void {
    const currentLang = this.currentLanguage();
    const newCache = new Map(this.translationsCache());
    newCache.delete(currentLang);
    this.translationsCache.set(newCache);
    this.lastUpdated.delete(currentLang);
    this.loadTranslations(currentLang);
  }

  /**
   * Get all translations for a specific language (useful for debugging)
   */
  getTranslations(language: Language): Observable<Translations> {
    if (this.translationsCache().has(language) && !this.isCacheStale(language)) {
      return of(this.translationsCache().get(language)!);
    }
    
    // Load translations and return them
    this.loadTranslations(language);
    return this.translationsCache().get(language) ? of(this.translationsCache().get(language)!) : of({});
  }

  /**
   * Check if translations are loaded for a language
   */
  isLanguageLoaded(language: Language): boolean {
    return this.translationsCache().has(language) && !this.isCacheStale(language);
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.translationsCache().forEach((translations, language) => {
      stats[language] = Object.keys(translations).length;
    });
    return stats;
  }

  /**
   * Clear all cached translations
   */
  clearCache(): void {
    this.translationsCache.set(new Map());
    this.lastUpdated.clear();
    this.logger.info('Cache cleared', undefined, 'TranslationService');
  }
}