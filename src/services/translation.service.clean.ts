import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, map, tap, timeout } from 'rxjs';
import { ApiService } from '../app/core/services/api.service';
import { LoggingService } from '../app/core/services/logging.service';

export type Language = 'en' | 'es' | 'fr' | 'pl';

export interface Translations {
  [key: string]: string;
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

  private logger = inject(LoggingService);

  constructor(private apiService: ApiService) {
    this.logger.debug('[Translation Service] Constructor called', );
    this.logger.debug('[Translation Service] Initial language:', this.currentLanguage());
    this.logger.debug('[Translation Service] API Service baseUrl:', this.apiService.getBaseUrl());
    // Load initial translations
    this.logger.debug('[Translation Service] Loading initial translations...', );
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
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      flagUrl: 'https://flagcdn.com/w40/il.png',
      isActive: true,
      isDefault: false,
      displayOrder: 2
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flagUrl: 'https://flagcdn.com/w40/sa.png',
      isActive: true,
      isDefault: false,
      displayOrder: 3
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flagUrl: 'https://flagcdn.com/w40/es.png',
      isActive: true,
      isDefault: false,
      displayOrder: 4
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flagUrl: 'https://flagcdn.com/w40/fr.png',
      isActive: true,
      isDefault: false,
      displayOrder: 5
    },
    {
      code: 'pl',
      name: 'Polish',
      nativeName: 'Polski',
      flagUrl: 'https://flagcdn.com/w40/pl.png',
      isActive: true,
      isDefault: false,
      displayOrder: 6
    }
  ];

  /**
   * Get translation for a key in the current language
   */
  translate(key: string): string {
    const translations = this.currentTranslations();
    const translation = translations[key];
    
    if (!translation) {
      console.warn(`[Translation Service] Missing translation for key: ${key} in language: ${this.currentLanguage()}`);
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

    console.log(`[Translation Service] Switching to language: ${language}`);
    this.currentLanguage.set(language);
    
    // Load translations if not in cache or cache is stale
    if (!this.translationsCache().has(language) || this.isCacheStale(language)) {
      this.loadTranslations(language);
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
      console.log(`[Translation Service] Already loading translations for ${language}, skipping...`);
      return; // Already loading
    }

    console.log(`[Translation Service] Loading translations for language: ${language}`);
    this.isLoading.next(true);
    this.error.next(null);
    this.loadingProgress.next(10);
    this.loadingMessage.next(`Loading ${language.toUpperCase()} translations...`);

    const url = `translations/${language}`;
    console.log(`[Translation Service] Making API request to: ${url}`);

    // Add timeout of 10 seconds
    const timeoutDuration = 10000;
    const timeoutTimer = setTimeout(() => {
      console.warn(`[Translation Service] API request timeout for ${language} after ${timeoutDuration}ms`);
      this.handleTranslationLoadError(language, new Error('Request timeout'));
    }, timeoutDuration);

    this.apiService.get<TranslationsResponse>(url)
      .pipe(
        tap(response => {
          clearTimeout(timeoutTimer);
          this.loadingProgress.next(50);
          this.loadingMessage.next('Processing translations...');
          console.log(`[Translation Service] API Response received:`, response);
        }),
        map((response: any) => {
          if (response.success && response.data) {
            console.log(`[Translation Service] Translations data:`, response.data);
            console.log(`[Translation Service] Translation count:`, Object.keys(response.data.translations || {}).length);
            return response.data;
          }
          console.error(`[Translation Service] Invalid response format:`, response);
          throw new Error('Invalid response format');
        }),
        tap((data: any) => {
          this.loadingProgress.next(80);
          this.loadingMessage.next('Caching translations...');
          console.log(`[Translation Service] Caching translations for ${language}`);
          const translationCount = Object.keys(data.translations || {}).length;
          console.log(`[Translation Service] Translation count: ${translationCount}`);
          
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
          
          console.log(`[Translation Service] Translations loaded successfully for ${language}`);
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
  private handleTranslationLoadError(language: Language, error: any): Observable<null> {
    console.error(`[Translation Service] Failed to load translations for ${language}:`, error);
    console.error(`[Translation Service] Error details:`, {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      url: error.url
    });
    
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
  getTranslationStats(): { [language: string]: number } {
    const stats: { [language: string]: number } = {};
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
    this.logger.debug('[Translation Service] Cache cleared', );
  }
}
