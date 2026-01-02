import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '@core/services/translation.service';
import { MobileDetectionService } from '@core/services/mobile-detection.service';
import { PromotionsSlidingMenuComponent } from '../../../promotions/components/promotions-sliding-menu/promotions-sliding-menu.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, PromotionsSlidingMenuComponent],
  template: `
    <section class="relative overflow-hidden pt-16 md:pt-20">
      <!-- Main Hero with Winner Celebration -->
      <div class="relative h-64 md:h-[500px]">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg" 
            alt="Winner celebration" 
            class="w-full h-full object-cover">
          <!-- Shaped blue overlay -->
          <div class="absolute inset-0">
            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75 clip-path-extended"></div>
          </div>
        </div>
        
        <!-- Content Overlay -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-6 lg:px-8 h-full flex items-center justify-between">
          <!-- Left side content -->
          <div class="text-white max-w-2xl">
            <h1 class="font-black mb-2 md:mb-6 leading-tight text-white text-2xl md:text-6xl" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
              {{ translate('hero.title') }}
            </h1>
            <p class="mb-3 md:mb-8 text-white text-sm md:text-2xl font-bold" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
              {{ translate('hero.subtitle') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 md:gap-6">
              <button 
                (click)="navigateToLotteries()"
                (keydown.enter)="navigateToLotteries()"
                (keydown.space)="navigateToLotteries(); $event.preventDefault()"
                [attr.aria-label]="translate('hero.browseLotteries')"
                class="px-6 py-2.5 md:px-12 md:py-6 text-base md:text-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 min-h-[44px] md:min-h-[88px] shadow-lg focus:outline-none">
                {{ translate('hero.browseLotteries') }}
              </button>
              <button 
                (click)="navigateToHowItWorks()"
                (keydown.enter)="navigateToHowItWorks()"
                (keydown.space)="navigateToHowItWorks(); $event.preventDefault()"
                [attr.aria-label]="translate('hero.howItWorks')"
                class="px-6 py-2.5 md:px-12 md:py-6 text-base md:text-2xl font-bold text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 min-h-[44px] md:min-h-[88px] shadow-lg focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">
                {{ translate('hero.howItWorks') }}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Floating Promotions Tab (Book Tab Style) - Left Side Center -->
    @if (isPromotionsMinimized()) {
      <!-- Small Round P Widget -->
      <button
        (click)="expandPromotionsTab()"
        (keydown.enter)="expandPromotionsTab()"
        (keydown.space)="expandPromotionsTab(); $event.preventDefault()"
        [class.z-[110]]="promotionsMenuOpen()"
        class="fixed left-0 md:left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:shadow-purple-500/50 flex items-center justify-center group promotions-p-widget border-2 border-white dark:border-gray-800 animate-widget-appear focus:outline-none"
        [attr.aria-label]="translate('nav.promotions')">
        <span class="font-black text-lg drop-shadow-lg">P</span>
      </button>
    } @else if (!promotionsMenuOpen()) {
      <!-- Expanded Tab (Not Open) - Vertical -->
      <div class="fixed left-0 md:left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-r-2xl shadow-2xl promotions-tab-expanded border-2 border-white dark:border-gray-800 animate-tab-appear w-12 md:w-auto">
        <div class="flex flex-col items-center gap-1.5 md:gap-2 px-2 md:px-4 py-3 md:py-6">
          <button
            (click)="minimizePromotionsTab()"
            class="text-white hover:text-gray-200 transition-colors p-2 md:p-1 rounded-full hover:bg-white hover:bg-opacity-30 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            [attr.aria-label]="translate('common.minimize')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <button
            (click)="togglePromotionsMenu()"
            class="flex flex-col items-center gap-2">
            <svg class="w-6 h-6 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-2 0h2m0 0v13m0-13l-3-3m3 3l3-3"></path>
            </svg>
            <span class="font-black text-xs writing-vertical-rl transform rotate-180 drop-shadow-lg">
              {{ translate('nav.promotions') }}
            </span>
          </button>
        </div>
      </div>
    } @else {
      <!-- Expanded Tab (Menu Open) - Vertical -->
      <div class="fixed left-0 md:left-0 top-1/2 -translate-y-1/2 z-[110] bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-r-2xl shadow-2xl promotions-tab-expanded border-2 border-white dark:border-gray-800 animate-tab-appear w-12 md:w-auto">
        <div class="flex flex-col items-center gap-1.5 md:gap-2 px-2 md:px-4 py-3 md:py-6">
          <button
            (click)="minimizePromotionsTab()"
            class="text-white hover:text-gray-200 transition-colors p-2 md:p-1 rounded-full hover:bg-white hover:bg-opacity-30 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            [attr.aria-label]="translate('common.minimize')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <div class="flex flex-col items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-2 0h2m0 0v13m0-13l-3-3m3 3l3-3"></path>
            </svg>
            <span class="font-black text-xs writing-vertical-rl transform rotate-180 drop-shadow-lg">
              {{ translate('nav.promotions') }}
            </span>
          </div>
        </div>
      </div>
    }

    <!-- Promotions Sliding Menu -->
    <app-promotions-sliding-menu [isOpen]="promotionsMenuOpen()" (close)="closePromotionsMenu()"></app-promotions-sliding-menu>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
    
    @keyframes scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .clip-path-extended {
      clip-path: polygon(0 0, 95% 0, 80% 100%, 0 100%);
      filter: blur(0.5px);
    }
    
    /* Writing mode for vertical text */
    .writing-vertical-rl {
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    /* Promotions Tab Animations */
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 30px rgba(251, 146, 60, 0.8), 0 0 60px rgba(251, 146, 60, 0.6), 0 0 90px rgba(251, 146, 60, 0.4), 0 0 0 4px rgba(251, 146, 60, 0.3);
      }
      50% {
        box-shadow: 0 0 50px rgba(251, 146, 60, 1), 0 0 100px rgba(251, 146, 60, 0.8), 0 0 150px rgba(251, 146, 60, 0.6), 0 0 0 8px rgba(251, 146, 60, 0.5);
      }
    }

    @keyframes pulse-vibrate {
      0%, 95%, 100% {
        transform: translateX(0) translateY(0);
      }
      96% {
        transform: translateX(3px) translateY(-2px);
      }
      97% {
        transform: translateX(-3px) translateY(2px);
      }
      98% {
        transform: translateX(2px) translateY(-3px);
      }
      99% {
        transform: translateX(-2px) translateY(3px);
      }
    }

    @keyframes color-shift {
      0%, 100% {
        filter: brightness(1) saturate(1);
      }
      50% {
        filter: brightness(1.2) saturate(1.3);
      }
    }

    .promotions-tab-widget {
      animation: pulse-glow 2s ease-in-out infinite, pulse-vibrate 4s ease-in-out infinite, color-shift 2.5s ease-in-out infinite;
    }

    .promotions-tab-expanded {
      animation: pulse-glow 2s ease-in-out infinite, color-shift 2.5s ease-in-out infinite;
    }

    .promotions-p-widget {
      animation: pulse-glow 2s ease-in-out infinite, pulse-vibrate 4s ease-in-out infinite, color-shift 2.5s ease-in-out infinite;
    }

    @keyframes widget-appear {
      0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
      }
      50% {
        transform: scale(1.2) rotate(180deg);
      }
      100% {
        transform: scale(1) rotate(360deg);
        opacity: 1;
      }
    }

    @keyframes tab-appear {
      0% {
        transform: scaleX(0) translateX(-100%);
        opacity: 0;
      }
      50% {
        transform: scaleX(1.1) translateX(0);
      }
      100% {
        transform: scaleX(1) translateX(0);
        opacity: 1;
      }
    }

    .animate-widget-appear {
      animation: widget-appear 0.5s ease-out, pulse-glow 2s ease-in-out 0.5s infinite, pulse-vibrate 4s ease-in-out 0.5s infinite, color-shift 2.5s ease-in-out 0.5s infinite;
    }

    .animate-tab-appear {
      animation: tab-appear 0.5s ease-out, pulse-glow 2s ease-in-out 0.5s infinite, color-shift 2.5s ease-in-out 0.5s infinite;
    }
  `]
})
export class HeroSectionComponent {
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private mobileDetectionService = inject(MobileDetectionService);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;

  promotionsMenuOpen = signal(false);
  isPromotionsMinimized = signal(false);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.scrollToTop();
  }

  navigateToLotteries() {
    this.router.navigate(['/lottery/dashboard']);
    this.scrollToTop();
  }

  navigateToHowItWorks() {
    this.router.navigate(['/how-it-works']);
    this.scrollToTop();
  }

  togglePromotionsMenu() {
    this.promotionsMenuOpen.set(!this.promotionsMenuOpen());
  }

  closePromotionsMenu() {
    this.promotionsMenuOpen.set(false);
  }

  minimizePromotionsTab() {
    this.isPromotionsMinimized.set(true);
    this.promotionsMenuOpen.set(false);
  }

  expandPromotionsTab() {
    this.isPromotionsMinimized.set(false);
    this.promotionsMenuOpen.set(true);
  }

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}