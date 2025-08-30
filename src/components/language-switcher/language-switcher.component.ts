import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
        <span>{{ getCurrentLanguageFlag() }}</span>
        <span class="hidden sm:inline">{{ getCurrentLanguageName() }}</span>
        <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="isDropdownOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      @if (isDropdownOpen) {
        <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          @for (language of availableLanguages; track language.code) {
            <button
              (click)="selectLanguage(language.code)"
              class="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              [class.bg-blue-50]="currentLanguage() === language.code"
              [class.dark:bg-blue-900]="currentLanguage() === language.code"
              [class.text-blue-600]="currentLanguage() === language.code"
              [class.dark:text-blue-400]="currentLanguage() === language.code">
              <span>{{ language.flag }}</span>
              <span>{{ language.name }}</span>
              @if (currentLanguage() === language.code) {
                <svg class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class LanguageSwitcherComponent {
  private translationService = inject(TranslationService);
  
  isDropdownOpen = false;
  currentLanguage = this.translationService.getCurrentLanguage();
  availableLanguages = this.translationService.getAvailableLanguages();

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectLanguage(language: Language) {
    this.translationService.setLanguage(language);
    this.isDropdownOpen = false;
  }

  getCurrentLanguageFlag(): string {
    const current = this.availableLanguages.find(lang => lang.code === this.currentLanguage());
    return current?.flag || '🇺🇸';
  }

  getCurrentLanguageName(): string {
    const current = this.availableLanguages.find(lang => lang.code === this.currentLanguage());
    return current?.name || 'English';
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('app-language-switcher')) {
      this.isDropdownOpen = false;
    }
  }
}