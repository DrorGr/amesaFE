import { Component, inject, ViewEncapsulation, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { ToastService } from '../../services/toast.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, ThemeToggleComponent, UserMenuComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Desktop Header -->
        @if (!isMobile()) {
          <div class="flex justify-between items-center h-20">
          <div class="flex items-center flex-shrink-0">
            <button (click)="navigateToHome()" class="focus:outline-none">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-16 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo">
            </button>
          </div>

          <div class="ml-10 flex items-center space-x-8">
            <button (click)="navigateToDashboard()" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
              {{ translate('nav.myLottery') }}
            </button>
            <button (click)="navigateToFavorites()" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
              {{ translate('nav.favorites') }}
            </button>
            <button (click)="navigateToSearch()" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button">
              {{ translate('nav.search') }}
            </button>
          </div>

          <div class="flex items-center space-x-3 mobile-controls">
            <app-theme-toggle></app-theme-toggle>
            <app-language-switcher></app-language-switcher>
            <app-user-menu></app-user-menu>
          </div>
        </div>
        }

        <!-- Mobile Header -->
        @if (isMobile()) {
          <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center">
              <button (click)="navigateToHome()" class="focus:outline-none">
                <img 
                  src="assets/AmesaNoBG.png" 
                  alt="Amesa" 
                  class="h-10 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo">
              </button>
            </div>

            <!-- Right side: User components + Hamburger -->
            <div class="flex items-center space-x-3 mobile-controls">
              <app-theme-toggle></app-theme-toggle>
              <app-language-switcher></app-language-switcher>
              <app-user-menu></app-user-menu>
              
              <!-- Hamburger Menu Button -->
              <button
                (click)="toggleMobileMenu()"
                class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 mobile-hamburger">
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
        }

        <!-- Mobile Menu -->
        @if (isMobile() && isMobileMenuOpen) {
          <div class="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4 animate-fadeIn shadow-lg z-50">
            <!-- Navigation Links -->
            <div class="space-y-2">
              <button (click)="navigateToDashboard()" class="block w-full text-left px-8 py-6 text-3xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button">
                {{ translate('nav.myLottery') }}
              </button>
              <button (click)="navigateToFavorites()" class="block w-full text-left px-8 py-6 text-3xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button">
                {{ translate('nav.favorites') }}
              </button>
              <button (click)="navigateToSearch()" class="block w-full text-left px-8 py-6 text-3xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 min-h-[72px] mobile-nav-button">
                {{ translate('nav.search') }}
              </button>
            </div>
          </div>
        }
      </div>
    </nav>

  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Mobile-specific styles */
    @media (max-width: 767px) {
      .mobile-nav-button {
        font-size: 1.75rem !important;
        padding: 1rem 1.5rem !important;
        min-height: 60px !important;
      }
      
      .mobile-signin-button {
        font-size: 1.5rem !important;
        padding: 1rem 2rem !important;
        min-height: 50px !important;
      }
      
      .mobile-logo {
        height: 2.5rem !important;
        width: auto !important;
      }
      
      .mobile-controls {
        transform: scale(1.5) !important;
      }
      
      .mobile-hamburger {
        padding: 1rem !important;
        min-height: 60px !important;
        min-width: 60px !important;
      }
      
      .mobile-hamburger svg {
        width: 2rem !important;
        height: 2rem !important;
      }
    }
  `]
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private mobileDetectionService = inject(MobileDetectionService);
  private toastService = inject(ToastService);
  
  isMobileMenuOpen = false;
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  currentUser = this.authService.getCurrentUser();
  

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Watch for mobile state changes to auto-close menu
  ngOnInit() {
    // Check mobile state on init
    const isMobile = this.mobileDetectionService.isMobile();
    if (!isMobile && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
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

  navigateToDashboard() {
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please log in first', 3000);
      return;
    }
    this.router.navigate(['/lottery/dashboard']);
    this.isMobileMenuOpen = false;
  }

  navigateToFavorites() {
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please log in first', 3000);
      return;
    }
    this.router.navigate(['/lottery/favorites']);
    this.isMobileMenuOpen = false;
  }

  navigateToSearch() {
    this.router.navigate(['/search']);
    this.isMobileMenuOpen = false;
  }


  navigateToLotteryResults() {
    // Legacy method - kept for compatibility
    this.router.navigate(['/lottery-results']);
    this.isMobileMenuOpen = false;
  }
}