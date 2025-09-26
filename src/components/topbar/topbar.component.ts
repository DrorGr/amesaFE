import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent, LanguageSwitcherComponent, ThemeToggleComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center h-20">
          <div class="flex items-center flex-shrink-0">
            <button (click)="navigateToHome()" class="focus:outline-none">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-16 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo">
            </button>
          </div>

          <div class="ml-10 flex items-center space-x-8">
            <button (click)="navigateToHome()" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
              {{ translate('nav.lotteries') }}
            </button>
                <button (click)="navigateToPromotions()" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
                  {{ translate('nav.promotions') }}
                </button>
            <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
              {{ translate('nav.winners') }}
            </a>
          </div>

          <div class="flex items-center space-x-3 mobile-controls">
            <app-theme-toggle></app-theme-toggle>
            <app-language-switcher></app-language-switcher>
                @if (currentUser(); as user) {
                  <div class="flex items-center space-x-3">
                    <span class="text-gray-700 dark:text-gray-300 text-sm font-medium">{{ translate('nav.welcome') }}, {{ user.name }}</span>
                    <button
                      (click)="navigateToMemberSettings()"
                      class="bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
                      {{ translate('nav.memberSettings') }}
                    </button>
                    <button
                      (click)="logout()"
                      class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
                      {{ translate('nav.logout') }}
                    </button>
                  </div>
                } @else {
                  <div class="flex items-center space-x-3">
                    <button
                      (click)="openAuthModal()"
                      class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-10 py-4 rounded-lg text-lg font-bold transition-all duration-200 hover:shadow-md min-h-[56px] mobile-signin-button">
                      {{ translate('nav.signIn') }}
                    </button>
                  </div>
                }
          </div>
        </div>

        <!-- Mobile Header -->
        <div class="md:hidden flex justify-between items-center h-16" style="min-height: 120px !important; font-size: 2rem !important;">
          <!-- Logo -->
          <div class="flex items-center">
            <button (click)="navigateToHome()" class="focus:outline-none">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-10 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo"
                style="height: 80px !important; width: auto !important;">
            </button>
          </div>

          <!-- Right side: Theme toggle + Hamburger -->
          <div class="flex items-center space-x-3 mobile-controls" style="transform: scale(2) !important;">
            <app-language-switcher></app-language-switcher>
            
            <app-theme-toggle></app-theme-toggle>
            
            <!-- Hamburger Menu Button -->
            <button
              (click)="toggleMobileMenu()"
              class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              style="padding: 2rem !important; min-height: 80px !important; min-width: 80px !important; font-size: 2rem !important;">
              @if (!isMobileMenuOpen) {
                <!-- Hamburger Icon -->
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 3rem !important; height: 3rem !important;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              } @else {
                <!-- Close Icon -->
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 3rem !important; height: 3rem !important;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              }
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        @if (isMobileMenuOpen) {
          <div class="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4 animate-fadeIn shadow-lg z-50" style="font-size: 2rem !important;">
            <!-- Navigation Links -->
            <div class="space-y-2 mb-6">
              <button (click)="navigateToHome()" class="block w-full text-left px-8 py-6 text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button"
                      style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                {{ translate('nav.lotteries') }}
              </button>
                  <button (click)="navigateToPromotions()" class="block w-full text-left px-8 py-6 text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button"
                          style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                    {{ translate('nav.promotions') }}
                  </button>
              <a href="#" class="block px-8 py-6 text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button"
                 style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                {{ translate('nav.winners') }}
              </a>
            </div>

            <!-- Language Switcher -->
            <div class="px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  @if (currentUser(); as user) {
                    <div class="space-y-3">
                      <div class="text-2xl text-gray-700 dark:text-gray-300 font-bold px-8 py-4" style="font-size: 2.5rem !important; padding: 2rem 4rem !important;">
                        {{ translate('nav.welcome') }}, {{ user.name }}
                      </div>
                      <button
                        (click)="navigateToMemberSettings(); toggleMobileMenu()"
                        class="w-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-8 py-6 rounded-lg text-2xl font-bold transition-colors duration-200 min-h-[80px]"
                        style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                        {{ translate('nav.memberSettings') }}
                      </button>
                      <button
                        (click)="logout(); toggleMobileMenu()"
                        class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-6 rounded-lg text-2xl font-bold transition-colors duration-200 min-h-[80px]"
                        style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                        {{ translate('nav.logout') }}
                      </button>
                    </div>
                  } @else {
                    <div class="space-y-3">
                      <button
                        (click)="openAuthModal(); toggleMobileMenu()"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg text-2xl font-bold transition-colors duration-200 min-h-[80px] mobile-signin-button"
                        style="font-size: 3rem !important; padding: 3rem 4rem !important; min-height: 120px !important;">
                        {{ translate('nav.signIn') }}
                      </button>
                    </div>
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
    
    @media (max-width: 767px) {
      /* Mobile navigation styling - REASONABLE SIZES */
      .mobile-nav-button {
        font-size: 1.5rem !important;
        padding: 1rem 1.5rem !important;
        min-height: 60px !important;
      }
      
      .mobile-signin-button {
        font-size: 1.25rem !important;
        padding: 1rem 2rem !important;
        min-height: 56px !important;
        white-space: nowrap !important;
      }
      
      .mobile-logo {
        height: 40px !important;
        width: auto !important;
      }
      
      .mobile-controls {
        transform: scale(1.2) !important;
      }
    }
  `]
})
export class TopbarComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
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

  navigateToHome() {
    this.router.navigate(['/']);
    this.isMobileMenuOpen = false;
  }

  navigateToMemberSettings() {
    this.router.navigate(['/member-settings']);
    this.isMobileMenuOpen = false;
  }

  navigateToPromotions() {
    this.router.navigate(['/promotions']);
    this.isMobileMenuOpen = false;
  }
}