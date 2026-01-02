import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, APP_INITIALIZER } from '@angular/core';
import './console-override'; // Remove console logs in production
import { AppComponent } from './app/core/app.component';
import { environment } from './environments/environment';
import { TranslationService } from './app/core/services/translation.service';
import { ThemeService } from './app/core/services/theme.service';
import { UserPreferencesService } from './app/features/user/services/user-preferences.service';
import { AuthService } from './app/core/services/auth.service';
import { RouteLoadingService } from './app/core/services/route-loading.service';
import { RoutePerformanceService } from './app/core/services/route-performance.service';
import { MobileDetectionService } from './app/core/services/mobile-detection.service';
import { ErrorHandlingService } from './app/core/services/error-handling.service';
import { LoggingService } from './app/core/services/logging.service';
import { PerformanceService } from './app/core/services/performance.service';
import { SecurityService } from './app/core/services/security.service';
import { ValidationService } from './app/core/services/validation.service';
import { AccessibilityService } from './app/core/services/accessibility.service';
import { routes } from './app/core/app.routes';
import { provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { CustomPreloadingStrategy } from './app/core/app.preloading-strategy';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// NON-BLOCKING: Initialize translations in background
// App starts immediately, translations load in background and update UI when ready
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

    // NON-BLOCKING: Start loading in background, don't wait
    // App will bootstrap immediately, translations will update UI when loaded
    translationService.loadTranslationsAsync(initialLanguage).catch(error => {
      // Log error but don't block app startup
      console.error('Failed to load initial translations:', error);
      // Non-critical error - app continues
    });
    
    // Resolve immediately to allow app to bootstrap
    return Promise.resolve();
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
      // NON-BLOCKING: Translations load in background, app starts immediately
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
    provideHttpClient(),
    provideAnimations() // Required for Angular animations to work
  ]
});