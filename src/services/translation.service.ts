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
   * Set the current language and load translations if not cached
   */
  setLanguage(language: Language): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:129',message:'setLanguage called',data:{language,currentLanguage:this.currentLanguage(),hasCache:this.translationsCache().has(language),cacheStale:this.isCacheStale(language)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    // Check if translations are loaded for this language
    const isLanguageLoaded = this.translationsCache().has(language) && !this.isCacheStale(language);
    
    // If language is already set AND translations are loaded, skip
    if (this.currentLanguage() === language && isLanguageLoaded) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:136',message:'setLanguage skipped - already loaded',data:{language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:147',message:'Calling loadTranslations',data:{language,reason:'not in cache or stale'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
   * Load translations from backend API with timeout and proper error handling
   * @param language - Language to load translations for
   * @param switchAfterLoad - If true, switch current language after translations are loaded
   */
  private loadTranslations(language: Language, switchAfterLoad: boolean = false): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:193',message:'loadTranslations entry',data:{language,switchAfterLoad,isLoading:this.isLoading.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (this.isLoading.value) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:196',message:'Early return - already loading',data:{language,isLoading:this.isLoading.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:196',message:'Starting API request',data:{url,language,baseUrl:this.apiService.getBaseUrl(),fullUrl:`${this.apiService.getBaseUrl()}/${url}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:208',message:'API Response received',data:{hasSuccess:response.hasOwnProperty('success'),hasData:response.hasOwnProperty('data'),successValue:response.success,dataValue:response.data,responseKeys:Object.keys(response),responseStr:JSON.stringify(response).substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          this.logger.debug('API Response received', { response }, 'TranslationService');
        }),
        map(response => {
          // #region agent log
          const hasSuccess = response.hasOwnProperty('success');
          const hasData = response.hasOwnProperty('data');
          const successValue = (response as any).success;
          const dataValue = (response as any).data;
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:214',message:'Checking response properties',data:{hasSuccess,hasData,successValue,dataValue,responseType:typeof response,allKeys:Object.keys(response),responseStr:JSON.stringify(response).substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          if (response.success && response.data) {
            const translationCount = Object.keys(response.data.translations || {}).length;
            this.logger.debug('Translations data received', { 
              translationCount,
              language: response.data.languageCode 
            }, 'TranslationService');
            return response.data;
          }
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:223',message:'Invalid response format detected',data:{hasSuccess,hasData,successValue,dataValue,responseStr:JSON.stringify(response).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
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
          
          if (translationCount > 0) {
            this.loadingMessage.next('Translations loaded successfully!');
            this.error.next(null);
          } else {
            this.loadingMessage.next(`No translations available for ${language.toUpperCase()}`);
          }
          
          // Delay to show completion or warning
          setTimeout(() => {
            this.isLoading.next(false);
            this.loadingProgress.next(0);
            this.loadingMessage.next('Initializing...');
          }, translationCount > 0 ? 500 : 2000); // Show warning longer if no translations
          
          if (translationCount > 0) {
            this.logger.info('Translations loaded successfully', { language, translationCount, switched: switchAfterLoad }, 'TranslationService');
          } else {
            this.logger.warn('Translations loaded but empty', { language }, 'TranslationService');
          }
        }),
        catchError(error => {
          clearTimeout(timeoutTimer);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:304',message:'Translation load error caught',data:{language,errorDetails:error instanceof Error ? error.message : String(error),errorType:typeof error,errorKeys:error && typeof error === 'object' ? Object.keys(error) : []},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          return this.handleTranslationLoadError(language, error);
        })
      )
      .subscribe({
        next: () => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:312',message:'Observable subscription completed successfully',data:{language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
        },
        error: (err) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:318',message:'Observable subscription error',data:{language,errorDetails:err instanceof Error ? err.message : String(err),errorType:typeof err},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          this.logger.error('Translation subscription error', { language, error: err }, 'TranslationService');
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translation.service.ts:300',message:'Translation load error',data:{...errorDetails,errorType:error?.constructor?.name,errorStr:JSON.stringify(error).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
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