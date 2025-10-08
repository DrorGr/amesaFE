import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app.component';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { RouteLoadingService } from './services/route-loading.service';
import { RoutePerformanceInterceptor } from './interceptors/route-performance.interceptor';
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
function initializeTranslations(translationService: TranslationService) {
  return () => {
    // Initialize with default language (English)
    translationService.setLanguage('en');
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    TranslationService,
    ThemeService,
    RouteLoadingService,
    MobileDetectionService,
    ErrorHandlingService,
    LoggingService,
    PerformanceService,
    SecurityService,
    ValidationService,
    AccessibilityService,
    { provide: ErrorHandler, useClass: ErrorHandlingService },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
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
    RoutePerformanceInterceptor
  ]
});