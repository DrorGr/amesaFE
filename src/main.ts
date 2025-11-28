import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, APP_INITIALIZER } from '@angular/core';
import './console-override'; // Remove console logs in production
import { AppComponent } from './app.component';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { UserPreferencesService } from './services/user-preferences.service';
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

// Initialize translation service - MUST be first and blocking
function initializeTranslations(translationService: TranslationService) {
  return () => {
    // Initialize with default language (English) and wait for it to complete
    // This ensures translations are loaded before any other initialization
    return translationService.setLanguage('en');
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
    // Services with providedIn: 'root' are automatically provided - don't register them here
    // This prevents NG0200 circular dependency errors
    { provide: ErrorHandler, useClass: ErrorHandlingService },
    // CRITICAL: Translations must be loaded FIRST before any other initialization
    // This ensures the UI displays properly from the start
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
      multi: true
    },
    // Other services initialize after translations are loaded
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