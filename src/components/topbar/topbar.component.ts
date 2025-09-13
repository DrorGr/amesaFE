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
        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center h-20">
          <div class="flex items-center flex-shrink-0">
            <img 
              src="assets/AmesaNoBG.png" 
              alt="Amesa" 
              class="h-16 w-auto">
          </div>

          <div class="ml-10 flex items-center space-x-8">
            <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
              {{ translate('nav.lotteries') }}
            </a>
            <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
              {{ translate('nav.promotions') }}
            </a>
            <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
              {{ translate('nav.howItWorks') }}
            </a>
            <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
              {{ translate('nav.winners') }}
            </a>
          </div>

          <div class="flex items-center space-x-3">
            <app-theme-toggle></app-theme-toggle>
            <app-language-switcher></app-language-switcher>
            @if (currentUser(); as user) {
              <div class="flex items-center space-x-3">
                <span class="text-gray-700 dark:text-gray-300 text-sm font-medium">{{ translate('nav.welcome') }}, {{ user.name }}</span>
                <button
                  (click)="logout()"
                  class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
                  {{ translate('nav.logout') }}
                </button>
              </div>
            } @else {
              <button
                (click)="openAuthModal()"
                class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
                {{ translate('nav.signIn') }}
              </button>
            }
          </div>
        </div>

        <!-- Mobile Header -->
        <div class="md:hidden flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <img 
              src="assets/AmesaNoBG.png" 
              alt="Amesa" 
              class="h-10 w-auto">
          </div>

          <!-- Right side: Theme toggle + Hamburger -->
          <div class="flex items-center space-x-3">
            <app-language-switcher></app-language-switcher>
            
            <app-theme-toggle></app-theme-toggle>
            
            <!-- Hamburger Menu Button -->
            <button
              (click)="toggleMobileMenu()"
              class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
              @if (!isMobileMenuOpen) {
                <!-- Hamburger Icon -->
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              } @else {
                <!-- Close Icon -->
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              }
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        @if (isMobileMenuOpen) {
          <div class="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4 animate-fadeIn">
            <!-- Navigation Links -->
            <div class="space-y-2 mb-6">
              <a href="#" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                {{ translate('nav.lotteries') }}
              </a>
              <a href="#" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                {{ translate('nav.promotions') }}
              </a>
              <a href="#" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                {{ translate('nav.howItWorks') }}
              </a>
              <a href="#" class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                {{ translate('nav.winners') }}
              </a>
            </div>

            <!-- Language Switcher -->
            <div class="px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              @if (currentUser(); as user) {
                <div class="space-y-3">
                  <div class="text-gray-700 dark:text-gray-300 font-medium">
                    {{ translate('nav.welcome') }}, {{ user.name }}
                  </div>
                  <button
                    (click)="logout(); toggleMobileMenu()"
                    class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium transition-colors duration-200">
                    {{ translate('nav.logout') }}
                  </button>
                </div>
              } @else {
                <button
                  (click)="openAuthModal(); toggleMobileMenu()"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">
                  {{ translate('nav.signIn') }}
                </button>
              }
            </div>
          </div>
        }
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
  isMobileMenuOpen = false;
  
  currentUser = this.authService.getCurrentUser();

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

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