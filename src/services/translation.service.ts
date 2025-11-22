import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoggingService } from './logging.service';

export type Language = 'en' | 'es' | 'fr' | 'pl';

export interface Translations {
  readonly [key: string]: string;
}

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
   */
  translate(key: string): string {
    const translations = this.currentTranslations();
    const translation = translations[key];
    
    if (!translation) {
      this.logger.warn('Missing translation', { 
        key, 
        language: this.currentLanguage() 
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
    if (this.currentLanguage() === language) {
      return; // Already set to this language
    }

    this.logger.info('Switching language', { language }, 'TranslationService');
    
    // Always show loader when changing language for better UX
    this.isLoading.next(true);
    this.loadingProgress.next(10);
    this.loadingMessage.next(`Switching to ${language.toUpperCase()}...`);
    
    this.currentLanguage.set(language);
    
    // Load translations if not in cache or cache is stale
    if (!this.translationsCache().has(language) || this.isCacheStale(language)) {
      this.loadTranslations(language);
    } else {
      // Even if cached, show brief loading for smooth UX
      this.loadingProgress.next(100);
      this.loadingMessage.next('Language switched successfully!');
      
      setTimeout(() => {
        this.isLoading.next(false);
        this.loadingProgress.next(0);
        this.loadingMessage.next('Initializing...');
      }, 300); // Brief delay to show completion
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
   */
  private loadTranslations(language: Language): void {
    if (this.isLoading.value) {
      this.logger.debug('Already loading translations, skipping', { language }, 'TranslationService');
      return; // Already loading
    }

    this.logger.info('Loading translations', { language }, 'TranslationService');
    this.isLoading.next(true);
    this.error.next(null);
    this.loadingProgress.next(10);
    this.loadingMessage.next(`Loading ${language.toUpperCase()} translations...`);

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
          this.loadingProgress.next(50);
          this.loadingMessage.next('Processing translations...');
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
          this.loadingProgress.next(80);
          this.loadingMessage.next('Caching translations...');
          
          const translationCount = Object.keys(data.translations || {}).length;
          this.logger.debug('Caching translations', { language, translationCount }, 'TranslationService');
          
          const newCache = new Map(this.translationsCache());
          newCache.set(language, data.translations);
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date(data.lastUpdated));
          
          this.loadingProgress.next(100);
          this.loadingMessage.next('Translations loaded successfully!');
          
          // Small delay to show completion
          setTimeout(() => {
            this.isLoading.next(false);
            this.loadingProgress.next(0);
            this.loadingMessage.next('Initializing...');
          }, 500);
          
          this.logger.info('Translations loaded successfully', { language, translationCount }, 'TranslationService');
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
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any)?.status || 'Unknown',
      statusText: (error as any)?.statusText || 'Unknown',
      url: (error as any)?.url || 'Unknown',
      language
    };
    
    this.logger.error('Failed to load translations', errorDetails, 'TranslationService');
    
    const errorMessage = `Failed to load ${language.toUpperCase()} translations from server`;
    this.error.next(errorMessage);
    this.loadingProgress.next(100);
    this.loadingMessage.next('Translation loading failed');
    
    // Show error state for 2 seconds, then hide loader
    setTimeout(() => {
      this.isLoading.next(false);
      this.loadingProgress.next(0);
      this.loadingMessage.next('Initializing...');
    }, 2000);
    
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