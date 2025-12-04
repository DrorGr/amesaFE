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
    
    // Initial translations will be loaded by setLanguage('en') called from APP_INITIALIZER in main.ts
    // This prevents redundant API calls on startup
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
   * Get translation with parameter substitution
   * Replaces {paramName} placeholders in translation strings with actual values
   * @param key - Translation key
   * @param params - Object with parameter values to substitute
   * @returns Translated string with parameters replaced
   */
  translateWithParams(key: string, params: Record<string, any>): string {
    let translation = this.translate(key);
    
    // Replace {paramName} placeholders with actual values
    Object.keys(params).forEach(paramKey => {
      const placeholder = `{${paramKey}}`;
      const value = params[paramKey]?.toString() || '';
      translation = translation.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return translation;
  }

  /**
   * Set the current language and load translations if not cached
   */
  setLanguage(language: Language): void {
    // Check if translations are loaded for this language
    const isLanguageLoaded = this.translationsCache().has(language) && !this.isCacheStale(language);
    
    // If language is already set AND translations are loaded, skip
    if (this.currentLanguage() === language && isLanguageLoaded) {
      return; // Already set to this language with translations loaded
    }

    this.logger.info('Switching language', { language }, 'TranslationService');
    
    // Always show loader when changing language for better UX
    this.isLoading.next(true);
    this.loadingProgress.next(10);
    this.loadingMessage.next(`Switching to ${language.toUpperCase()}...`);
    this.error.next(null); // Clear any previous errors
    
    // Load translations if not in cache or cache is stale
    if (!this.translationsCache().has(language) || this.isCacheStale(language)) {
      // Load translations first, then switch language when ready
      this.loadTranslations(language, true); // true = switch language after loading
    } else {
      // Translations are cached, safe to switch immediately
      this.currentLanguage.set(language);
      
      // Show brief loading for smooth UX
      this.loadingProgress.next(50);
      this.loadingMessage.next('Loading cached translations...');
      
      setTimeout(() => {
        this.loadingProgress.next(100);
        this.loadingMessage.next('Language switched successfully!');
        
        setTimeout(() => {
          this.isLoading.next(false);
          this.loadingProgress.next(0);
          this.loadingMessage.next('Initializing...');
        }, 300);
      }, 200);
    }
  }


  /**
   * Get available languages
   */
  getAvailableLanguages(): LanguageInfo[] {
    return this.availableLanguages.filter(lang => lang.isActive);
  }

  /**
   * Track ongoing loading promises to prevent duplicate loads
   */
  private loadingPromise: Promise<void> | null = null;
  private loadingLanguage: Language | null = null;
  private loadingStarted = false; // Track if loading has actually started (prevents premature resolution)

  /**
   * Load translations asynchronously and return a Promise
   * Used by APP_INITIALIZER to wait for translations before app starts
   * Prevents duplicate loads of the same language
   */
  public loadTranslationsAsync(language: Language): Promise<void> {
    // If already loading the same language, return existing promise
    if (this.loadingPromise && this.loadingLanguage === language) {
      return this.loadingPromise;
    }
    
    // If already loaded and not stale, resolve immediately
    if (this.translationsCache().has(language) && !this.isCacheStale(language)) {
      this.currentLanguage.set(language);
      // CRITICAL: Ensure isLoading is false
      if (this.isLoading.value) {
        this.isLoading.next(false);
        this.loadingProgress.next(0);
      }
      return Promise.resolve();
    }
    
    // Create new promise
    this.loadingLanguage = language;
    this.loadingPromise = new Promise((resolve, reject) => {
      let resolved = false;
      let subscription: any = null;
      let timeoutId: any = null;
      
      const cleanup = () => {
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        this.loadingPromise = null;
        this.loadingLanguage = null;
      };
      
      // Subscribe to loading state to know when it's done
      // CRITICAL: Reset flag to prevent premature resolution from initial BehaviorSubject emission
      this.loadingStarted = false;
      subscription = this.isLoading$.subscribe(isLoading => {
        // CRITICAL: Only resolve if loading has started AND is now complete
        // This prevents premature resolution from the initial BehaviorSubject emission
        if (!isLoading && !resolved && this.loadingStarted) {
          resolved = true;
          const hasError = this.error.value;
          cleanup();
          if (hasError) {
            reject(new Error(hasError));
          } else {
            resolve();
          }
        }
        // If isLoading is false but we haven't started loading yet,
        // this is just the initial BehaviorSubject emission - ignore it
      });
      
      // Start loading (this will set isLoading = true)
      this.loadingStarted = true; // Mark that we've started loading
      this.loadTranslations(language, true);
      
      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Translation loading timeout after 15 seconds'));
        }
      }, 15000);
    });
    
    return this.loadingPromise;
  }

  /**
   * Load translations from backend API with timeout and proper error handling
   * @param language - Language to load translations for
   * @param switchAfterLoad - If true, switch current language after translations are loaded
   */
  private loadTranslations(language: Language, switchAfterLoad: boolean = false): void {
    // Only block if loading the SAME language (prevent duplicate requests)
    // Allow loading different languages (will handle via Observable unsubscribe if needed)
    if (this.isLoading.value && this.currentLanguage() === language) {
      this.logger.debug('Already loading same language, skipping', { language }, 'TranslationService');
      return; // Already loading same language
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
      // CRITICAL: Reset isLoading before calling handleTranslationLoadError (which also resets it, but this ensures it happens)
      this.isLoading.next(false);
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
          
          // Warn if translations are empty
          if (translationCount === 0) {
            this.logger.warn('No translations found for language', { language }, 'TranslationService');
            this.error.next(`No translations available for ${language.toUpperCase()}. Please ensure the database is seeded.`);
            this.loadingMessage.next(`Warning: No translations found for ${language.toUpperCase()}`);
          }
          
          const newCache = new Map(this.translationsCache());
          newCache.set(language, data.translations || {});
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date(data.lastUpdated));
          
          // Switch language AFTER translations are cached (if requested)
          if (switchAfterLoad) {
            this.currentLanguage.set(language);
            this.logger.info('Language switched after translations loaded', { language }, 'TranslationService');
          }
          
          this.loadingProgress.next(100);
          
          // CRITICAL: Set isLoading = false IMMEDIATELY after caching (don't block app startup)
          // This allows APP_INITIALIZER to resolve immediately, improving startup performance
          this.isLoading.next(false);
          this.loadingProgress.next(0);
          
          if (translationCount > 0) {
            this.loadingMessage.next('Translations loaded successfully!');
            this.error.next(null);
          } else {
            this.loadingMessage.next(`No translations available for ${language.toUpperCase()}`);
            setTimeout(() => {
              this.loadingMessage.next('Initializing...');
            }, 2000);
          }
          
          if (translationCount > 0) {
            this.logger.info('Translations loaded successfully', { language, translationCount, switched: switchAfterLoad }, 'TranslationService');
          } else {
            this.logger.warn('Translations loaded but empty', { language }, 'TranslationService');
          }
        }),
        catchError(error => {
          clearTimeout(timeoutTimer);
          return this.handleTranslationLoadError(language, error);
        })
      )
      .subscribe({
        next: () => {
          // Subscription completed successfully
        },
        error: (err) => {
          this.logger.error('Translation subscription error', { language, error: err }, 'TranslationService');
          // CRITICAL: Reset isLoading on subscription error
          this.isLoading.next(false);
          this.error.next(`Failed to load ${language.toUpperCase()} translations`);
          this.loadingProgress.next(0);
          this.loadingMessage.next('Initializing...');
        },
        complete: () => {
          // Subscription completed
        }
      });
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
    
    // CRITICAL: Always reset isLoading, even on error
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
    // Use loadTranslations with switchAfterLoad=false since language is already set
    this.loadTranslations(currentLang, false);
  }

  /**
   * Get all translations for a specific language (useful for debugging)
   * Returns Observable that waits for loading to complete
   */
  getTranslations(language: Language): Observable<Translations> {
    if (this.translationsCache().has(language) && !this.isCacheStale(language)) {
      return of(this.translationsCache().get(language)!);
    }
    
    // Return Observable that waits for loading to complete
    return new Observable<Translations>(observer => {
      let subscription: any = null;
      
      // Subscribe to loading state to know when it's done
      subscription = this.isLoading$.subscribe(isLoading => {
        if (!isLoading) {
          const translations = this.translationsCache().get(language) || {};
          observer.next(translations);
          observer.complete();
          if (subscription) {
            subscription.unsubscribe();
          }
        }
      });
      
      // Start loading
      this.loadTranslations(language);
      
      // Cleanup on unsubscribe
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
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