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

// Initialize translation service - LOAD FIRST, before preferences
function initializeTranslations(translationService: TranslationService) {
  return () => {
    // Determine initial language with priority (NO network requests):
    // 1. localStorage (amesa_language key) - fastest, no network
    // 2. Browser/system language (navigator.language)
    // 3. Default to 'en' if none of the above are available
    // NOTE: UserPreferencesService is NOT checked here to avoid waiting for network requests

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
  themeService: ThemeService,
  accessibilityService: AccessibilityService,
  authService: AuthService
) {
  return () => {
    // Set up the theme service reference in user preferences to avoid circular dependency
    userPreferencesService.setThemeService(themeService);
    
    // Initialize theme from storage for faster loading
    themeService.initializeFromStorage();
    
    // Load user preferences if authenticated
    // Note: Preferences are loaded automatically by UserPreferencesService constructor
    // We just need to apply them to theme and accessibility services
    const prefs = userPreferencesService.getPreferences();
    
    // Initialize theme from user preferences
    if (prefs.appearance?.theme) {
      themeService.updateThemeFromPreferences(prefs.appearance.theme);
    }
    
    // Initialize accessibility from user preferences
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
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeServices,
      deps: [UserPreferencesService, ThemeService, AccessibilityService, AuthService],
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