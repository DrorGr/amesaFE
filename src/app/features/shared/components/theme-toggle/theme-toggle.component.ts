import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { MobileDetectionService } from '@core/services/mobile-detection.service';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      (click)="toggleTheme()"
      (keydown.enter)="toggleTheme()"
      (keydown.space)="toggleTheme(); $event.preventDefault()"
      [attr.aria-label]="currentTheme() === 'light' ? translate('theme.switchToDark') : translate('theme.switchToLight')"
      [attr.aria-pressed]="currentTheme() === 'dark'"
      class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-110 transform focus:outline-none"
      [title]="currentTheme() === 'light' ? translate('theme.switchToDark') : translate('theme.switchToLight')">
      @if (currentTheme() === 'light') {
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
      } @else {
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      }
    </button>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  private mobileDetectionService = inject(MobileDetectionService);
  private translationService = inject(TranslationService);
  
  currentTheme = this.themeService.currentTheme;
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}