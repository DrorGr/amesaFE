import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, APP_INITIALIZER } from '@angular/core';
import './console-override'; // Remove console logs in production
import { AppComponent } from './app.component';
import { environment } from './environments/environment';
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

// CRITICAL: Initialize translations FIRST and BLOCK until loaded
// This ensures translations are available before any component renders
function initializeTranslations(translationService: TranslationService) {
  return () => {
    // Determine initial language with priority (NO network requests):
    // 1. localStorage (amesa_language key) - fastest, no network
    // 2. Browser/system language (navigator.language)
    // 3. Default to 'en' if none of the above are available

    let initialLanguage: 'en' | 'es' | 'fr' | 'pl' = 'en';
    const supportedLanguages: ('en' | 'es' | 'fr' | 'pl')[] = ['en', 'es', 'fr', 'pl'];

    // Priority 1: Check localStorage directly (fastest, no network)
    if (typeof localStorage !== 'undefined') {
      const storedLanguage = localStorage.getItem('amesa_language') as 'en' | 'es' | 'fr' | 'pl' | null;
      if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
        initialLanguage = storedLanguage;
      } else if (typeof navigator !== 'undefined' && navigator.language) {
        // Priority 2: Check browser/system language
        const browserLang = navigator.language.toLowerCase().split('-')[0] as string;
        if (supportedLanguages.includes(browserLang as 'en' | 'es' | 'fr' | 'pl')) {
          initialLanguage = browserLang as 'en' | 'es' | 'fr' | 'pl';
        }
      }
    }

    // CRITICAL: Wait for translations to load before app starts
    // This blocks app initialization until translations are ready
    return translationService.loadTranslationsAsync(initialLanguage)
      .catch(error => {
        // Log error but still allow app to start (fail-open design)
        console.error('Failed to load initial translations:', error);
        // Return resolved promise to allow app to continue
        return Promise.resolve();
      });
  };
}

// Initialize services with cross-dependencies - NON-BLOCKING
// This runs AFTER translations are loaded, but doesn't block app startup
function initializeServices(
  userPreferencesService: UserPreferencesService,
  themeService: ThemeService,
  accessibilityService: AccessibilityService
) {
  return () => {
    // Set up the theme service reference in user preferences to avoid circular dependency
    userPreferencesService.setThemeService(themeService);
    
    // Initialize theme from storage for faster loading (synchronous, no network)
    themeService.initializeFromStorage();
    
    // Load user preferences from localStorage (synchronous, no network)
    // Note: Server sync happens later via subscription, not during initialization
    const prefs = userPreferencesService.getPreferences();
    
    // Initialize theme from user preferences (synchronous)
    if (prefs.appearance?.theme) {
      themeService.updateThemeFromPreferences(prefs.appearance.theme);
    }
    
    // Initialize accessibility from user preferences (synchronous)
    if (prefs.accessibility) {
      // Apply accessibility settings
      if (prefs.accessibility.highContrast) {
        accessibilityService.toggleHighContrast();
      }
      if (prefs.appearance.fontSize) {
        // Map FontSize enum to service's accepted values (extra-large maps to large)
        const fontSizeMap: Record<string, 'small' | 'medium' | 'large'> = {
          'small': 'small',
          'medium': 'medium',
          'large': 'large',
          'extra-large': 'large'
        };
        const fontSize = fontSizeMap[prefs.appearance.fontSize] || 'medium';
        accessibilityService.setFontSize(fontSize);
      }
    }
    
    // Resolve immediately - all operations are synchronous
    // Network requests (like auth status check, house loading) happen later via service subscriptions
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    TranslationService,
    ThemeService,
    UserPreferencesService,
    AuthService,
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
      // CRITICAL: Translations load FIRST and BLOCK app startup
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
      multi: true
    },
    {
      // Services initialize AFTER translations, but don't block
      // Removed AuthService dependency to prevent blocking network requests
      provide: APP_INITIALIZER,
      useFactory: initializeServices,
      deps: [UserPreferencesService, ThemeService, AccessibilityService],
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