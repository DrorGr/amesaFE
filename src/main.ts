import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, APP_INITIALIZER } from '@angular/core';
import './console-override'; // Remove console logs in production
import { AppComponent } from './app.component';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { UserPreferencesService } from './services/user-preferences.service';
import { AuthService } from './services/auth.service';
import { RouteLoadingService } from './services/route-loading.service';
import { RoutePerformanceService } from './services/route-performance.service';
import { MobileDetectionService } from './services/mobile-detection.service';
import { ErrorHandlingService } from './services/error-handling.service';
import { LoggingService } from './services/logging.service';
import { PerformanceService } from './services/performance.service';
import { SecurityService } from './services/security.service';
import { ValidationService } from './services/validation.service';
import { AccessibilityService } from './services/accessibility.service';
import { routes } from './app.routes';
import { provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { CustomPreloadingStrategy } from './app.preloading-strategy';
import { provideHttpClient } from '@angular/common/http';

// Initialize translation service
function initializeTranslations(
  translationService: TranslationService,
  userPreferencesService: UserPreferencesService,
  authService: any
) {
  return () => {
    // #region agent log
    const logData = {
      location: 'main.ts:initializeTranslations',
      message: 'Determining initial language',
      data: {
        hasNavigator: typeof navigator !== 'undefined',
        navigatorLanguage: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
        navigatorLanguages: typeof navigator !== 'undefined' ? navigator.languages : 'N/A',
        hasLocalStorage: typeof localStorage !== 'undefined',
        localStorageLanguage: typeof localStorage !== 'undefined' ? localStorage.getItem('amesa_language') : 'N/A',
        userPrefsLanguage: userPreferencesService.currentLanguage(),
        hasAuthService: !!authService,
        isAuthenticated: authService?.isAuthenticated?.() ?? false
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'F'
    };
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {});
    }
    // #endregion

    // Determine initial language with priority:
    // 1. User preferences (from UserPreferencesService - includes server sync if authenticated)
    // 2. localStorage (amesa_language key)
    // 3. Browser/system language (navigator.language)
    // 4. Default to 'en' if none of the above are available

    let initialLanguage: 'en' | 'es' | 'fr' | 'pl' = 'en';
    const supportedLanguages: ('en' | 'es' | 'fr' | 'pl')[] = ['en', 'es', 'fr', 'pl'];

    // Priority 1: Check UserPreferencesService (includes server-synced preferences if authenticated)
    const userPrefsLanguage = userPreferencesService.currentLanguage();
    if (userPrefsLanguage && supportedLanguages.includes(userPrefsLanguage)) {
      initialLanguage = userPrefsLanguage;
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.ts:initializeTranslations',
            message: 'Using language from UserPreferencesService',
            data: { language: initialLanguage, source: 'userPreferences' },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'F'
          })
        }).catch(() => {});
      }
      // #endregion
    } else if (typeof localStorage !== 'undefined') {
      // Priority 2: Check localStorage directly
      const storedLanguage = localStorage.getItem('amesa_language') as 'en' | 'es' | 'fr' | 'pl' | null;
      if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
        initialLanguage = storedLanguage;
        // #region agent log
        if (typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'main.ts:initializeTranslations',
              message: 'Using language from localStorage',
              data: { language: initialLanguage, source: 'localStorage' },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'F'
            })
          }).catch(() => {});
        }
        // #endregion
      } else if (typeof navigator !== 'undefined' && navigator.language) {
        // Priority 3: Check browser/system language
        const browserLang = navigator.language.toLowerCase().split('-')[0] as string;
        if (supportedLanguages.includes(browserLang as 'en' | 'es' | 'fr' | 'pl')) {
          initialLanguage = browserLang as 'en' | 'es' | 'fr' | 'pl';
          // #region agent log
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'main.ts:initializeTranslations',
                message: 'Using language from browser/system',
                data: { language: initialLanguage, source: 'navigator.language', original: navigator.language },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'F'
              })
            }).catch(() => {});
          }
          // #endregion
        }
      }
    }

    // Priority 4: Default to 'en' (already set)
    if (initialLanguage === 'en') {
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.ts:initializeTranslations',
            message: 'Using default language (en)',
            data: { language: initialLanguage, source: 'default' },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'F'
          })
        }).catch(() => {});
      }
      // #endregion
    }

    // Load translations and WAIT for them to complete before app starts
    // This ensures translations are available when the app initializes
    return translationService.loadTranslationsAsync(initialLanguage)
      .catch(error => {
        // Log error but don't block app startup
        // App will start with empty translations (fallback to keys)
        console.error('Failed to load initial translations:', error);
        return Promise.resolve();
      });
  };
}

// Initialize services with cross-dependencies
function initializeServices(
  userPreferencesService: UserPreferencesService,
  themeService: ThemeService
) {
  return () => {
    // Set up the theme service reference in user preferences to avoid circular dependency
    userPreferencesService.setThemeService(themeService);
    
    // Initialize theme from storage for faster loading
    themeService.initializeFromStorage();
    
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    TranslationService,
    ThemeService,
    UserPreferencesService,
    RouteLoadingService,
    MobileDetectionService,
    ErrorHandlingService,
    LoggingService,
    PerformanceService,
    SecurityService,
    ValidationService,
    AccessibilityService,
    RoutePerformanceService,
    { provide: ErrorHandler, useClass: ErrorHandlingService },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService, UserPreferencesService, AuthService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeServices,
      deps: [UserPreferencesService, ThemeService],
      multi: true
    },
    provideRouter(
      routes,
      withPreloading(CustomPreloadingStrategy),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient()
  ]
});