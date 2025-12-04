import { Component, inject, signal, computed, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language, LanguageInfo } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { LoggingService } from '../../services/logging.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" #dropdownContainer>
      <!-- Language Selector Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        (keydown.enter)="toggleDropdown()"
        (keydown.space)="toggleDropdown(); $event.preventDefault()"
        [attr.aria-label]="translate('languageSelector.button')"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="true"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        [attr.aria-describedby]="'language-selector-description'">
        <!-- Current Language Flag -->
        <img 
          [src]="currentLanguageInfo()?.flagUrl" 
          [alt]="currentLanguageInfo()?.nativeName || currentLanguageInfo()?.name"
          class="w-5 h-5 rounded-sm"
          [attr.aria-hidden]="true">
        <!-- Current Language Code -->
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
          {{ currentLanguageInfo()?.code }}
        </span>
        <!-- Dropdown Icon -->
        <svg 
          class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
          [class.rotate-180]="isOpen()"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          [attr.aria-hidden]="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      <!-- Hidden description for screen readers -->
      <span id="language-selector-description" class="sr-only">
        {{ translate('languageSelector.description') }}
      </span>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div
          class="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 py-1"
          role="menu"
          [attr.aria-label]="translate('languageSelector.menu')"
          (click)="$event.stopPropagation()">
          @for (language of availableLanguages(); track language.code) {
            <button
              type="button"
              (click)="selectLanguageByCode(language.code)"
              (keydown.enter)="selectLanguageByCode(language.code)"
              (keydown.space)="selectLanguageByCode(language.code); $event.preventDefault()"
              [attr.aria-label]="translate('languageSelector.selectLanguage', { language: language.nativeName || language.name })"
              [attr.aria-selected]="isCurrentLanguage(language.code)"
              role="menuitem"
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              [class.bg-blue-50]="isCurrentLanguage(language.code)"
              [class.dark:bg-blue-900/20]="isCurrentLanguage(language.code)">
              <!-- Flag -->
              <img 
                [src]="language.flagUrl" 
                [alt]="language.nativeName || language.name"
                class="w-6 h-6 rounded-sm"
                [attr.aria-hidden]="true">
              <!-- Language Info -->
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ language.nativeName || language.name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ language.name }}
                </div>
              </div>
              <!-- Checkmark for current language -->
              @if (isCurrentLanguage(language.code)) {
                <svg 
                  class="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  [attr.aria-hidden]="true">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              }
            </button>
          }
        </div>
      }

      <!-- Loading Overlay (when switching languages) -->
      @if (isLoading()) {
        <div 
          class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center z-10"
          [attr.aria-live]="'polite'"
          [attr.aria-atomic]="true">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ translate('languageSelector.loading') }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class LanguageSelectorComponent implements OnDestroy {
  private translationService = inject(TranslationService);
  private localeService = inject(LocaleService);
  private logger = inject(LoggingService);

  // Cleanup subject for subscriptions
  private destroy$ = new Subject<void>();

  // State
  private _isOpen = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);
  private loadingSubscription: any = null;
  private announcementTimer: number | null = null;

  // Public signals
  isOpen = this._isOpen.asReadonly();
  isLoading = this._isLoading.asReadonly();

  // Available languages from TranslationService
  availableLanguages = computed(() => this.translationService.getAvailableLanguages());

  // Current language info
  currentLanguageInfo = computed(() => {
    const currentLang = this.translationService.getCurrentLanguage();
    return this.availableLanguages().find(lang => lang.code === currentLang);
  });

  constructor() {
    this.logger.debug('LanguageSelectorComponent initialized', undefined, 'LanguageSelectorComponent');
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown(): void {
    this._isOpen.update(open => !open);
    this.logger.debug('Language selector dropdown toggled', { isOpen: this._isOpen() }, 'LanguageSelectorComponent');
  }

  /**
   * Select a language by code (for template use)
   */
  selectLanguageByCode(code: string): void {
    const language = code as Language;
    this.selectLanguage(language);
  }

  /**
   * Select a language
   */
  selectLanguage(language: Language): void {
    if (this.translationService.getCurrentLanguage() === language) {
      // Already selected, just close dropdown
      this._isOpen.set(false);
      return;
    }

    this.logger.info('Language selection initiated', { language }, 'LanguageSelectorComponent');
    this._isLoading.set(true);
    this._isOpen.set(false);

    // Switch language
    this.translationService.setLanguage(language);

    // Unsubscribe from previous subscription if exists
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }

    // Wait for translation loading to complete (auto-cleanup on destroy)
    this.loadingSubscription = this.translationService.isLoading$
      .pipe(
        takeUntil(this.destroy$),
        filter(isLoading => !isLoading) // Only proceed when loading completes
      )
      .subscribe(isLoading => {
        this._isLoading.set(false);
        this.logger.info('Language switched successfully', { language }, 'LanguageSelectorComponent');
        
        // Announce to screen readers
        this.announceLanguageChange(language);
      });
  }

  /**
   * Check if language is currently selected
   */
  isCurrentLanguage(languageCode: string): boolean {
    return this.translationService.getCurrentLanguage() === languageCode;
  }

  /**
   * Translate a key
   */
  translate(key: string, params?: Record<string, string>): string {
    let translation = this.translationService.translate(key);
    
    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  }

  /**
   * Announce language change to screen readers
   */
  private announceLanguageChange(language: Language): void {
    const languageInfo = this.availableLanguages().find(lang => lang.code === language);
    const message = this.translate('languageSelector.switched', { 
      language: languageInfo?.nativeName || languageInfo?.name || language 
    });
    
    // Create temporary live region for announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement (track timer for cleanup)
    this.announcementTimer = window.setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
      this.announcementTimer = null;
    }, 1000);
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const container = document.querySelector('[data-language-selector-container]');
    
    if (container && !container.contains(target) && this._isOpen()) {
      this._isOpen.set(false);
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (this._isOpen()) {
      this._isOpen.set(false);
    }
  }

  /**
   * Handle arrow key navigation in dropdown
   */
  @HostListener('keydown.arrowdown', ['$event'])
  @HostListener('keydown.arrowup', ['$event'])
  onArrowKey(event: KeyboardEvent): void {
    if (!this._isOpen()) return;

    event.preventDefault();
    const languages = this.availableLanguages();
    const currentIndex = languages.findIndex(lang => 
      lang.code === this.translationService.getCurrentLanguage()
    );

    let nextIndex: number;
    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % languages.length;
    } else {
      nextIndex = (currentIndex - 1 + languages.length) % languages.length;
    }

    // Focus the next language button
    const buttons = document.querySelectorAll('[role="menuitem"]');
    if (buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLElement).focus();
    }
  }

  ngOnDestroy(): void {
    // Cleanup subscription
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
      this.loadingSubscription = null;
    }

    // Cleanup timer
    if (this.announcementTimer !== null) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }

    // Emit destroy signal for takeUntil
    this.destroy$.next();
    this.destroy$.complete();
  }
}


