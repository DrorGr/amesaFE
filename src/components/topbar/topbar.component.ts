import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent, LanguageSwitcherComponent, ThemeToggleComponent],
  template: `
    <nav class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 md:h-18">
          <div class="flex items-center flex-shrink-0">
            <div class="flex-shrink-0">
              <img 
                src="/src/assets/AmesaDark.jpg" 
                alt="Amesa" 
                class="h-8 md:h-10 w-auto dark:hidden">
              <img 
                src="/src/assets/AmesaWhite.jpg" 
                alt="Amesa" 
                class="h-8 md:h-10 w-auto hidden dark:block">
            </div>
          </div>

          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-10">
              <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                {{ translate('nav.lotteries') }}
              </a>
              <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                {{ translate('nav.howItWorks') }}
              </a>
              <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                {{ translate('nav.winners') }}
              </a>
            </div>
          </div>

          <div class="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            <div class="flex items-center space-x-1 md:space-x-2">
              <app-theme-toggle></app-theme-toggle>
              <app-language-switcher></app-language-switcher>
            </div>
            @if (currentUser(); as user) {
              <div class="flex items-center space-x-2 md:space-x-4">
                <span class="hidden sm:inline text-gray-700 dark:text-gray-300 text-sm font-medium">{{ translate('nav.welcome') }}, {{ user.name }}</span>
                <span class="sm:hidden text-gray-700 dark:text-gray-300 text-sm font-medium">{{ user.name }}</span>
                <button
                  (click)="logout()"
                  class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 hover:shadow-md">
                  {{ translate('nav.logout') }}
                </button>
              </div>
            } @else {
              <div class="flex items-center space-x-2 md:space-x-3">
                <button
                  (click)="openAuthModal()"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                  {{ translate('nav.signIn') }}
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>

    @if (showAuthModal) {
      <app-auth-modal 
        [mode]="authMode" 
        (close)="closeAuthModal()"
        (success)="onAuthSuccess()"
        (modeChange)="onModeChange($event)">
      </app-auth-modal>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TopbarComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  
  showAuthModal = false;
  authMode: 'login' | 'register' = 'login';
  
  currentUser = this.authService.getCurrentUser();

  openAuthModal() {
    this.authMode = 'login';
    this.showAuthModal = true;
  }

  closeAuthModal() {
    this.showAuthModal = false;
  }

  onAuthSuccess() {
    this.showAuthModal = false;
  }

  onModeChange(mode: 'login' | 'register') {
    this.authMode = mode;
  }

  logout() {
    this.authService.logout();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}