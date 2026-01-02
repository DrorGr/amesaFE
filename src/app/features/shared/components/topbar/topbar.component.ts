import { Component, inject, ViewEncapsulation, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { TranslationService } from '@core/services/translation.service';
import { MobileDetectionService } from '@core/services/mobile-detection.service';
import { ToastService } from '@core/services/toast.service';
import { UserMenuComponent } from '../../../user/components/user-menu/user-menu.component';
import { NotificationService } from '../../../notifications/services/notification.service';
import { NotificationSidebarComponent } from '../../../notifications/components/notification-sidebar/notification-sidebar.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, UserMenuComponent, NotificationSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[100] transition-colors duration-300" style="position: sticky; top: 0; z-index: 100;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Desktop Header -->
        @if (!isMobile()) {
          <div class="flex justify-between items-center h-20">
          <div class="flex items-center flex-shrink-0">
            <button 
              (click)="navigateToHome()"
              (keydown.enter)="navigateToHome()"
              (keydown.space)="navigateToHome(); $event.preventDefault()"
              [attr.aria-label]="translate('nav.goToHome')"
              class="focus:outline-none">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-16 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo">
            </button>
          </div>

          <div class="ml-10 flex items-center space-x-8">
            <button 
              (click)="navigateToDashboard()"
              (keydown.enter)="navigateToDashboard()"
              (keydown.space)="navigateToDashboard(); $event.preventDefault()"
              [attr.aria-label]="translate('nav.lotteries')"
              [class]="isOnDashboardPage() ? 'bg-[#2D3748] dark:bg-[#2D3748] text-white dark:text-white border border-[#374151] dark:border-[#374151] px-4 py-2 text-lg font-bold transition-all duration-200 rounded-lg mobile-nav-button focus:outline-none' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button focus:outline-none'">
              {{ translate('nav.lotteries') }}
            </button>
            
            @if (isOnFavoritesPage()) {
              <button 
                (click)="navigateToHome()"
                (keydown.enter)="navigateToHome()"
                (keydown.space)="navigateToHome(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.backHome')"
                class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button rounded-lg focus:outline-none">
                {{ translate('nav.backHome') || 'Back Home' }}
              </button>
            } @else {
              <button 
                (click)="navigateToFavorites()"
                (keydown.enter)="navigateToFavorites()"
                (keydown.space)="navigateToFavorites(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.favorites')"
                class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button focus:outline-none">
                {{ translate('nav.favorites') }}
              </button>
            }
            
            @if (isOnSearchPage()) {
              <button 
                (click)="navigateToHome()"
                (keydown.enter)="navigateToHome()"
                (keydown.space)="navigateToHome(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.backHome')"
                class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button rounded-lg focus:outline-none">
                {{ translate('nav.backHome') || 'Back Home' }}
              </button>
            } @else {
              <button 
                (click)="navigateToSearch()"
                (keydown.enter)="navigateToSearch()"
                (keydown.space)="navigateToSearch(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.search')"
                class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-lg font-bold transition-all duration-200 hover:-translate-y-0.5 transform mobile-nav-button focus:outline-none">
                {{ translate('nav.search') }}
              </button>
            }
          </div>

          <div class="flex items-center space-x-3 mobile-controls">
            <app-language-switcher></app-language-switcher>
            <app-user-menu></app-user-menu>
            
            <!-- Notification Bell (always visible) -->
            <button
              (click)="handleNotificationClick()"
              (keydown.enter)="handleNotificationClick()"
              (keydown.space)="handleNotificationClick(); $event.preventDefault()"
              [attr.aria-label]="translate('nav.notifications')"
              class="relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none">
              <!-- Bell Icon -->
              <svg 
                class="w-6 h-6 transition-transform duration-200"
                [class.animate-ring]="currentUser() && unreadCount() > 0"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              
              <!-- Red Dot Indicator (only when logged in and has unread) -->
              @if (currentUser() && unreadCount() > 0) {
                <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                <!-- Unread Count Badge -->
                @if (unreadCount() > 9) {
                  <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">9+</span>
                } @else if (unreadCount() > 0) {
                  <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ unreadCount() }}</span>
                }
              }
            </button>
          </div>
        </div>
        }

        <!-- Mobile Header -->
        @if (isMobile()) {
          <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center">
              <button 
                (click)="navigateToHome()" 
                [attr.aria-label]="translate('nav.goToHome')"
                class="focus:outline-none">
                <img 
                  src="assets/AmesaNoBG.png" 
                  alt="Amesa" 
                  class="h-10 w-auto hover:opacity-80 transition-opacity duration-200 mobile-logo">
              </button>
            </div>

            <!-- Right side: User components + Hamburger -->
            <div class="flex items-center space-x-2 sm:space-x-3 mobile-controls">
              <app-language-switcher></app-language-switcher>
              <app-user-menu></app-user-menu>
              
              <!-- Notification Bell (always visible) -->
              <button
                (click)="handleNotificationClick()"
                (keydown.enter)="handleNotificationClick()"
                (keydown.space)="handleNotificationClick(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.notifications')"
                class="relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none h-10 w-10 flex items-center justify-center">
                <!-- Bell Icon -->
                <svg 
                  class="w-6 h-6 transition-transform duration-200"
                  [class.animate-ring]="currentUser() && unreadCount() > 0"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                
                <!-- Red Dot Indicator (only when logged in and has unread) -->
                @if (currentUser() && unreadCount() > 0) {
                  <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                  <!-- Unread Count Badge -->
                  @if (unreadCount() > 9) {
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">9+</span>
                  } @else if (unreadCount() > 0) {
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{{ unreadCount() }}</span>
                  }
                }
              </button>
              
              <!-- Hamburger Menu Button -->
              <button
                (click)="toggleMobileMenu()"
                (keydown.enter)="toggleMobileMenu()"
                (keydown.space)="toggleMobileMenu(); $event.preventDefault()"
                [attr.aria-label]="isMobileMenuOpen ? translate('nav.closeMenu') : translate('nav.openMenu')"
                [attr.aria-expanded]="isMobileMenuOpen"
                class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 mobile-hamburger focus:outline-none h-10 w-10 flex items-center justify-center">
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
            <div class="space-y-2" role="menu">
              <button 
                (click)="navigateToDashboard()"
                (keydown.enter)="navigateToDashboard()"
                (keydown.space)="navigateToDashboard(); $event.preventDefault()"
                [attr.aria-label]="translate('nav.lotteries')"
                role="menuitem"
                [class]="isOnDashboardPage() ? 'block w-full text-left px-4 py-3 text-lg bg-[#2D3748] dark:bg-[#2D3748] text-white dark:text-white border border-[#374151] dark:border-[#374151] font-bold transition-colors duration-200 rounded-lg focus:outline-none' : 'block w-full text-left px-4 py-3 text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 focus:outline-none'">
                {{ translate('nav.lotteries') }}
              </button>
              
              @if (isOnFavoritesPage()) {
                <button 
                  (click)="navigateToHome()"
                  (keydown.enter)="navigateToHome()"
                  (keydown.space)="navigateToHome(); $event.preventDefault()"
                  [attr.aria-label]="translate('nav.backHome')"
                  role="menuitem"
                  class="block w-full text-left px-4 py-3 text-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 rounded-lg focus:outline-none">
                  {{ translate('nav.backHome') || 'Back Home' }}
                </button>
              } @else {
                <button 
                  (click)="navigateToFavorites()"
                  (keydown.enter)="navigateToFavorites()"
                  (keydown.space)="navigateToFavorites(); $event.preventDefault()"
                  [attr.aria-label]="translate('nav.favorites')"
                  role="menuitem"
                  class="block w-full text-left px-4 py-3 text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 focus:outline-none">
                  {{ translate('nav.favorites') }}
                </button>
              }
              
              @if (isOnSearchPage()) {
                <button 
                  (click)="navigateToHome()"
                  (keydown.enter)="navigateToHome()"
                  (keydown.space)="navigateToHome(); $event.preventDefault()"
                  [attr.aria-label]="translate('nav.backHome')"
                  role="menuitem"
                  class="block w-full text-left px-4 py-3 text-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 rounded-lg focus:outline-none">
                  {{ translate('nav.backHome') || 'Back Home' }}
                </button>
              } @else {
                <button 
                  (click)="navigateToSearch()"
                  (keydown.enter)="navigateToSearch()"
                  (keydown.space)="navigateToSearch(); $event.preventDefault()"
                  [attr.aria-label]="translate('nav.search')"
                  role="menuitem"
                  class="block w-full text-left px-4 py-3 text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors duration-200 focus:outline-none">
                  {{ translate('nav.search') }}
                </button>
              }
            </div>
          </div>
        }
      </div>
    </nav>

    <!-- Notification Sidebar -->
    <app-notification-sidebar 
      [isOpenInput]="isNotificationSidebarOpen()"
      (closeEvent)="closeNotificationSidebar()">
    </app-notification-sidebar>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Ringing bell animation */
    @keyframes ring {
      0%, 100% { 
        transform: rotate(0deg) scale(1); 
      }
      10%, 30% { 
        transform: rotate(-10deg) scale(1.05); 
      }
      20%, 40% { 
        transform: rotate(10deg) scale(1.05); 
      }
    }

    .animate-ring {
      animation: ring 0.5s ease-in-out infinite;
    }
    
    /* Glow pulse animation for favorites button (blue color like promotion badge) */
    @keyframes favoritesGlowPulse {
      0% {
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
        text-shadow: 0 0 0 rgba(249, 115, 22, 0);
        background: transparent;
      }
      50% {
        box-shadow: 0 0 30px 12px rgba(249, 115, 22, 0.8),
                    0 0 50px 20px rgba(249, 115, 22, 0.4),
                    0 0 70px 30px rgba(249, 115, 22, 0.2);
        text-shadow: 0 0 20px rgba(249, 115, 22, 0.9),
                     0 0 40px rgba(249, 115, 22, 0.6),
                     0 0 60px rgba(249, 115, 22, 0.3);
        background: radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, transparent 70%);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
        text-shadow: 0 0 0 rgba(249, 115, 22, 0);
        background: transparent;
      }
    }
    .favorites-glow-pulse {
      animation: favoritesGlowPulse 1.5s ease-in-out;
      position: relative;
      padding: 4px 12px;
      border-radius: 8px;
    }
  `]
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private mobileDetectionService = inject(MobileDetectionService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  
  isMobileMenuOpen = false;
  currentUrl = signal<string>('');
  isNotificationSidebarOpen = signal(false);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  // Get current user and unread count
  currentUser = this.authService.getCurrentUser();
  unreadCount = this.notificationService.getUnreadCount();
  
  // Computed signals for page detection
  isOnDashboardPage = computed(() => this.currentUrl().includes('/lottery/dashboard'));
  isOnFavoritesPage = computed(() => this.currentUrl().includes('/lottery/favorites'));
  isOnSearchPage = computed(() => this.currentUrl().includes('/search'));
  
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
    
    // Track current route
    this.currentUrl.set(this.router.url);
    
    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
      });

    // Defer notification loading to avoid blocking initial render
    // Load after 2 seconds to allow other critical data to load first
    const user = this.currentUser();
    if (user && user.isAuthenticated) {
      setTimeout(() => {
        this.notificationService.getUserNotifications().subscribe({
          next: () => {
            // Notifications loaded, unread count will update automatically
          },
          error: (error) => {
            // Silently fail - notifications will load when sidebar opens
            console.warn('Failed to load notifications on init:', error);
          }
        });
      }, 2000); // 2 second delay
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.isMobileMenuOpen = false;
  }

  navigateToDashboard() {
    this.router.navigate(['/lottery/dashboard']);
    this.isMobileMenuOpen = false;
  }

  navigateToFavorites() {
    this.router.navigate(['/lottery/favorites']);
    this.isMobileMenuOpen = false;
  }

  navigateToSearch() {
    this.router.navigate(['/search']);
    this.isMobileMenuOpen = false;
  }

  navigateToLotteryResults() {
    this.router.navigate(['/lottery-results']);
    this.isMobileMenuOpen = false;
  }

  handleNotificationClick(): void {
    const user = this.currentUser();
    if (!user || !user.isAuthenticated) {
      // Show toast using existing translation key
      this.toastService.error(this.translate('auth.loginRequired'), 4000);
      return;
    }
    
    // User is logged in - toggle sidebar
    this.toggleNotificationSidebar();
  }

  toggleNotificationSidebar(): void {
    this.isNotificationSidebarOpen.update(open => !open);
    if (this.isNotificationSidebarOpen()) {
      // Load notifications when opening
      // The sidebar component will handle loading
    }
  }

  closeNotificationSidebar(): void {
    this.isNotificationSidebarOpen.set(false);
  }
}