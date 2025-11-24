import { Component, inject, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { CookieConsent } from '../../interfaces/cookie-consent.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Cookie Consent Banner (Banner Mode) -->
    @if (isVisible() && !isPreferencesOpen()) {
      <div 
        class="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl animate-slide-up backdrop-blur-sm"
        [class.max-w-4xl]="!isMobile()"
        [class.mx-auto]="!isMobile()">
        <div class="p-4 md:p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Content -->
            <div class="flex-1">
              <h3 class="text-xl md:text-lg font-bold text-gray-900 dark:text-white mb-2">
                {{ translate('cookieConsent.banner.title') }}
              </h3>
              <p class="text-base md:text-sm text-gray-600 dark:text-gray-400 mb-3 md:mb-0">
                {{ translate('cookieConsent.banner.description') }}
                <button 
                  (click)="openPreferences()"
                  class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  {{ translate('cookieConsent.learnMore') }}
                </button>
              </p>
            </div>
            
            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 md:gap-2">
              <button
                (click)="rejectAll()"
                class="px-6 py-3 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                {{ translate('cookieConsent.banner.rejectAll') }}
              </button>
              <button
                (click)="customize()"
                class="px-6 py-3 md:px-4 md:py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                {{ translate('cookieConsent.banner.customize') }}
              </button>
              <button
                (click)="acceptAll()"
                class="px-6 py-3 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {{ translate('cookieConsent.banner.acceptAll') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Cookie Preferences Modal (Preferences Mode) -->
    @if (isPreferencesOpen()) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center"
        [class]="isMobile() ? 'bg-white dark:bg-gray-900' : 'modal-backdrop dark:bg-black dark:bg-opacity-60'"
        (click)="onBackdropClick($event)"
        role="dialog"
        [attr.aria-label]="translate('cookieConsent.preferences.title')"
        [attr.aria-modal]="true">
        <div 
          class="w-full h-full md:w-auto md:h-auto bg-white dark:bg-gray-800 md:rounded-xl md:shadow-2xl flex flex-col"
          [class]="isMobile() ? '' : 'modal-content max-w-2xl'"
          (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="text-2xl md:text-xl font-bold text-gray-900 dark:text-white">
              {{ translate('cookieConsent.preferences.title') }}
            </h2>
            <button
              (click)="closePreferences()"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              [attr.aria-label]="translate('cookieConsent.preferences.cancel')">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
            <p class="text-base md:text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ translate('cookieConsent.preferences.description') }}
            </p>
            
            <!-- Essential Cookies -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ translate('cookieConsent.essential.title') }}
                  </h3>
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {{ translate('cookieConsent.essential.required') }}
                  </span>
                </div>
                <div class="relative ml-4">
                  <div class="w-10 h-6 bg-blue-600 dark:bg-blue-700 rounded-full shadow-inner"></div>
                  <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 translate-x-4"></div>
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ translate('cookieConsent.essential.description') }}
              </p>
            </div>
            
            <!-- Analytics Cookies -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ translate('cookieConsent.analytics.title') }}
                  </h3>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences.analytics"
                    class="sr-only"
                    [attr.aria-label]="translate('cookieConsent.analytics.title')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-purple-600]="preferences.analytics"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences.analytics"></div>
                  </div>
                </label>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ translate('cookieConsent.analytics.description') }}
              </p>
            </div>
            
            <!-- Marketing Cookies -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ translate('cookieConsent.marketing.title') }}
                  </h3>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences.marketing"
                    class="sr-only"
                    [attr.aria-label]="translate('cookieConsent.marketing.title')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-purple-600]="preferences.marketing"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences.marketing"></div>
                  </div>
                </label>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ translate('cookieConsent.marketing.description') }}
              </p>
            </div>
            
            <!-- Functional Cookies -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ translate('cookieConsent.functional.title') }}
                  </h3>
                </div>
                <label class="relative ml-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="preferences.functional"
                    class="sr-only"
                    [attr.aria-label]="translate('cookieConsent.functional.title')">
                  <div class="relative">
                    <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                         [class.bg-purple-600]="preferences.functional"></div>
                    <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                         [class.translate-x-4]="preferences.functional"></div>
                  </div>
                </label>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ translate('cookieConsent.functional.description') }}
              </p>
            </div>
          </div>
          
          <!-- Footer Actions -->
          <div class="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 md:gap-2 bg-white dark:bg-gray-800">
            <button
              (click)="rejectAll()"
              class="flex-1 px-4 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
              {{ translate('cookieConsent.preferences.rejectAll') }}
            </button>
            <button
              (click)="acceptAll()"
              class="flex-1 px-4 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
              {{ translate('cookieConsent.preferences.acceptAll') }}
            </button>
            <button
              (click)="savePreferences()"
              class="flex-1 px-4 py-3 md:py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-lg md:text-base min-h-[60px] md:min-h-[44px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {{ translate('cookieConsent.preferences.save') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
    
    /* Custom scrollbar for preferences modal */
    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.5);
      border-radius: 2px;
    }
    
    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.5);
    }
    
    /* Keyboard focus styles */
    button:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    
    /* Prevent body scroll when modal is open */
    :host {
      display: block;
    }
  `]
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  private cookieConsentService = inject(CookieConsentService);
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  
  // Reactive state
  isVisible = signal(false);
  isPreferencesOpen = signal(false);
  
  // Current preferences state (for form binding)
  preferences: { analytics: boolean; marketing: boolean; functional: boolean } = {
    analytics: false,
    marketing: false,
    functional: false
  };
  
  // Mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  private subscriptions: Subscription[] = [];
  
  constructor() {
    // Watch for consent changes to update visibility
    effect(() => {
      const consent = this.cookieConsentService.consent();
      this.isVisible.set(this.cookieConsentService.shouldShowBanner());
      
      // If preferences are open and consent exists, load current preferences
      if (consent && this.isPreferencesOpen()) {
        this.loadPreferences(consent);
      }
    });
    
    // Watch for preferences modal state changes to lock/unlock body scroll
    effect(() => {
      if (typeof document !== 'undefined') {
        if (this.isPreferencesOpen()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
    
    // Listen for programmatic open preferences requests
    this.subscriptions.push(
      this.cookieConsentService.openPreferences$.subscribe(() => {
        this.openPreferences();
      })
    );
  }
  
  ngOnInit(): void {
    // Check if banner should be visible
    this.isVisible.set(this.cookieConsentService.shouldShowBanner());
    
    // Load current preferences if consent exists
    const currentConsent = this.cookieConsentService.getConsent();
    if (currentConsent) {
      this.loadPreferences(currentConsent);
    }
    
    // Handle Escape key to close preferences modal
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleEscapeKey);
    }
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Remove Escape key listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleEscapeKey);
    }
    
    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  
  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  acceptAll(): void {
    this.cookieConsentService.acceptAll();
    this.isPreferencesOpen.set(false);
    this.isVisible.set(false);
  }
  
  rejectAll(): void {
    this.cookieConsentService.rejectAll();
    this.isPreferencesOpen.set(false);
    this.isVisible.set(false);
  }
  
  customize(): void {
    const currentConsent = this.cookieConsentService.getConsent();
    this.loadPreferences(currentConsent || {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    });
    this.isPreferencesOpen.set(true);
  }
  
  openPreferences(): void {
    const currentConsent = this.cookieConsentService.getConsent();
    this.loadPreferences(currentConsent || {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    });
    this.isPreferencesOpen.set(true);
  }
  
  closePreferences(): void {
    this.isPreferencesOpen.set(false);
  }
  
  savePreferences(): void {
    this.cookieConsentService.setConsent({
      analytics: this.preferences.analytics,
      marketing: this.preferences.marketing,
      functional: this.preferences.functional
    });
    this.isPreferencesOpen.set(false);
    this.isVisible.set(false);
  }
  
  private loadPreferences(consent: CookieConsent): void {
    this.preferences = {
      analytics: consent.analytics,
      marketing: consent.marketing,
      functional: consent.functional
    };
  }
  
  onBackdropClick(event: Event): void {
    // Only close if clicking the backdrop itself, not the modal content
    if (event.target === event.currentTarget) {
      this.closePreferences();
    }
  }
  
  private handleEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isPreferencesOpen()) {
      this.closePreferences();
    }
  };
}

