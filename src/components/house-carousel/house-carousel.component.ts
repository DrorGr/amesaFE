import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { LotteryService } from '../../services/lottery.service';
import { LocaleService } from '../../services/locale.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { VerificationGateComponent } from '../verification-gate/verification-gate.component';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule, VerificationGateComponent],
  template: `
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-4 md:py-4 transition-colors duration-300 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div class="overflow-hidden">
          <div class="flex transition-transform duration-500 ease-in-out" 
               [style.transform]="'translateX(' + (-currentSlide * 100) + '%)'">
            @for (house of houses(); track house.id; let houseIndex = $index) {
              <div class="w-full flex-shrink-0 flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 relative px-2 md:px-0 mobile-carousel-container">
                <!-- Main House Image -->
                <div class="flex-1 max-w-5xl flex flex-col mb-4">
                  <div class="relative overflow-hidden rounded-xl shadow-lg group">
                    @if (isImageLoaded(getCurrentMainImage(house, houseIndex).url)) {
                        <img
                          [src]="getCurrentMainImage(house, houseIndex).url" 
                          [alt]="getCurrentMainImage(house, houseIndex).alt"
                          [loading]="houseIndex === 0 && currentSlide === 0 ? 'eager' : 'lazy'"
                          decoding="async"
                          fetchpriority="high"
                          (error)="onImageError($event)"
                          class="w-full h-64 md:h-96 object-cover object-center opacity-100 transition-opacity duration-300 mobile-carousel-image"
                          (load)="onImageLoad($event)"
                          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+'">
                    } @else {
                      <div class="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div class="animate-pulse flex flex-col items-center space-y-2">
                          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div class="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
                        </div>
                      </div>
                      <img
                        [attr.data-src]="getCurrentMainImage(house, houseIndex).url" 
                        [alt]="getCurrentMainImage(house, houseIndex).alt"
                        class="w-full h-64 md:h-96 object-cover object-center opacity-0 absolute inset-0 transition-opacity duration-300"
                        (load)="onImageLoad($event)"
                        (error)="onImageError($event)">
                    }
                    
                    <!-- Location Icon - Top Left, matching image ratio -->
                    <button 
                      (click)="openLocationMap(house)"
                      class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none"
                      [attr.aria-label]="'View ' + house.title + ' location on map'">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                    
                    <!-- Status Badge - Top Middle, pill shape, matching image -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <span 
                        [class]="getStatusClasses(house.status)"
                        [class.animate-seesaw]="house.status === 'active' && vibrationTrigger() > 0"
                        class="text-white px-6 py-3 rounded-[20px] text-base font-semibold shadow-lg whitespace-nowrap flex items-center h-12">
                        {{ getStatusText(house) }}
                      </span>
                    </div>
                    
                    <!-- Favorites Button - Top Right, same level as status badge, purple background -->
                    <button 
                      (click)="toggleFavorite(house.id, $event)"
                      (keydown.enter)="toggleFavorite(house.id, $event)"
                      (keydown.space)="toggleFavorite(house.id, $event); $event.preventDefault()"
                      [attr.aria-label]="isFavorite(house.id) ? 'Remove from favorites' : 'Add to favorites'"
                      [title]="isFavorite(house.id) ? (translate('lottery.favorites.removeFromFavorites') || 'Remove from favorites') : (translate('lottery.favorites.addToFavorites') || 'Add to favorites')"
                      class="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-20 cursor-pointer focus:outline-none"
                      [disabled]="isTogglingFavorite(house.id)">
                      <svg class="w-6 h-6 transition-all duration-300"
                           [class.text-red-500]="isFavorite(house.id)"
                           [class.text-white]="!isFavorite(house.id)"
                           [attr.fill]="isFavorite(house.id) ? 'currentColor' : 'none'"
                           [attr.stroke]="!isFavorite(house.id) ? 'currentColor' : 'none'"
                           stroke-width="2" 
                           viewBox="0 0 24 24"
                           aria-hidden="true">
                        <path 
                          fill-rule="evenodd"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          clip-rule="evenodd">
                        </path>
                      </svg>
                    </button>
                    
                    <!-- Currently Viewers Hover Overlay -->
                    <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl">
                      <div class="text-white text-center">
                        <div class="text-lg font-semibold">{{ translate('house.currentlyViewing') }}</div>
                        <div class="text-2xl font-bold">{{ getCurrentViewers() }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Image Navigation Below Main Image -->
                  <div class="flex flex-col items-center mt-4">
                    <!-- Mobile: Thumbnail images for house image selection -->
                    <div class="md:hidden relative w-full flex justify-center">
                      <!-- Mobile Thumbnail Images - centered (only secondary images) -->
                      <div class="flex space-x-2 mobile-carousel-thumbnails">
                        @for (image of getSecondaryImages(house.images); track $index) {
                          <button 
                            (click)="goToSecondaryImage($index)"
                            class="w-20 h-12 rounded overflow-hidden border-2 transition-all hover:scale-105 mobile-carousel-thumbnail"
                            style="width: 8rem !important; height: 5rem !important;"
                            [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                            [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
                            <img [src]="image.url" [alt]="image.alt" loading="lazy" decoding="async" class="w-full h-full object-cover mobile-thumbnail-image" (error)="onImageError($event)">
                          </button>
                        }
                      </div>
                    </div>
                    
                    <!-- Desktop: Thumbnail images for house image selection -->
                    <div class="hidden md:flex space-x-2">
                      <!-- Desktop Thumbnail Images (only secondary images) -->
                      @for (image of getSecondaryImages(house.images); track $index) {
                        <button 
                          (click)="goToSecondaryImage($index)"
                          class="w-30 h-19 rounded overflow-hidden border-2 transition-all hover:scale-105 mobile-carousel-thumbnail"
                          [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                          [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
                          <img [src]="image.url" [alt]="image.alt" loading="lazy" decoding="async" class="w-full h-full object-cover mobile-thumbnail-image" (error)="onImageError($event)">
                        </button>
                      }
                    </div>
                    
                    <!-- Image Navigation Dots - For switching between house images -->
                    <div class="flex space-x-1 mt-1">
                      @for (image of house.images; track $index) {
                        <button 
                          (click)="goToHouseImage($index)"
                          class="w-2 h-2 rounded-full transition-all hover:scale-125"
                          [class.bg-blue-500]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.bg-gray-300]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                          [class.dark:bg-blue-400]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.dark:bg-gray-600]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)">
                        </button>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Property Description and Lottery Info -->
                <div class="flex-1 max-w-2xl text-center lg:text-left flex flex-col justify-between h-auto md:h-120 mx-auto lg:mx-0 px-2 md:px-0 mobile-carousel-content">
                  <div>
                    <!-- House Title -->
                    <div class="mb-4 md:mb-4">
                      <h2 class="text-4xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mobile-carousel-title">
                        {{ house.title }}
                      </h2>
                    </div>
                    
                    <p class="text-gray-700 dark:text-gray-200 mb-6 md:mb-6 leading-relaxed text-xl md:text-2xl mobile-carousel-description">
                      {{ translate('house.propertyOfYourOwn') }}
                    </p>
                  </div>
                  
                  <!-- Lottery Information -->
                  <div class="space-y-2 md:space-y-2 flex-grow flex flex-col justify-center">
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('common.price') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xl md:text-3xl">{{ formatPrice(house.price) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('house.city') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xl md:text-3xl">{{ house.city || 'Manhattan' }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('house.address') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xl md:text-3xl">{{ house.address || '123 Park Ave' }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('house.ticketPrice') || translate('common.price') }}</span>
                      <span class="font-bold text-blue-600 dark:text-blue-400 text-xl md:text-3xl">{{ formatPrice(house.ticketPrice) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('house.odds') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xl md:text-3xl">{{ getOdds(house) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700 mobile-carousel-info">
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('house.lotteryCountdown') }}</span>
                      <span class="font-bold text-orange-600 dark:text-orange-400 text-xl md:text-3xl font-mono">{{ getLotteryCountdown(house) }}</span>
                    </div>
                  
                    <!-- Tickets Available -->
                    <div class="mt-4 md:mt-3">
                      <div class="text-center text-xl md:text-xl text-orange-600 dark:text-orange-400 font-semibold">
                        {{ getTicketsAvailableText(house) }}
                      </div>
                    </div>
                    
                    <!-- Buttons Section -->
                    @if (currentUser()?.isAuthenticated) {
                      <app-verification-gate [isVerificationRequired]="true">
                        <!-- Buy Ticket / Notify Me Button -->
                        @if (house.status === 'ended') {
                          <button 
                            disabled
                            class="w-full mt-6 md:mt-4 bg-gray-400 dark:bg-gray-600 text-white py-6 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 text-2xl md:text-2xl min-h-[72px] mobile-carousel-button cursor-not-allowed opacity-60">
                            {{ translate('carousel.buyTicket') }} - {{ formatPrice(house.ticketPrice) }}
                          </button>
                        } @else if (house.status === 'upcoming') {
                          <button class="w-full mt-6 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-6 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-2xl md:text-2xl min-h-[72px] mobile-carousel-button">
                            {{ translate('carousel.notifyMe') || 'Notify Me' }}
                          </button>
                        } @else {
                          <button class="w-full mt-6 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-6 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-2xl md:text-2xl min-h-[72px] mobile-carousel-button">
                            {{ translate('carousel.buyTicket') }} - {{ formatPrice(house.ticketPrice) }}
                          </button>
                        }
                      </app-verification-gate>
                    } @else {
                      <!-- Sign In Prompt -->
                      <div class="text-center mt-6 md:mt-4">
                        <p class="text-2xl md:text-xl text-gray-600 dark:text-gray-300 mb-4 md:mb-3">{{ translate('house.signInToParticipate') }}</p>
                        <div class="text-xl md:text-xl font-bold text-blue-600 dark:text-blue-400">{{ formatPrice(house.ticketPrice) }} {{ translate('house.perTicket') }}</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        
        <!-- Flying Heart Animation -->
        @if (flyingHeart(); as heart) {
          <div 
            class="fixed z-[9999] pointer-events-none"
            [style.left.px]="heart.startX + (heart.endX - heart.startX) * (heart.active ? 1 : 0)"
            [style.top.px]="heart.startY + (heart.endY - heart.startY) * (heart.active ? 1 : 0)"
            [style.transition]="heart.active ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.opacity]="heart.active ? '0' : '1'">
            <svg class="w-9 h-9 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </div>
        }
        
        <!-- Fixed Navigation Controls - Bottom of component -->
        <!-- Mobile Navigation - Bottom -->
        <div class="md:hidden">
          <div class="flex items-center justify-between px-6 py-6">
            <!-- Left Navigation Button -->
            <button 
              (click)="previousSlide()"
              class="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-4 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 min-h-[56px] min-w-[56px]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <!-- Container Dots -->
            <div class="flex space-x-2">
              @for (house of houses(); track house.id) {
                <button 
                  (click)="goToSlide($index)"
                  class="w-3 h-3 rounded-full transition-all"
                  [class.bg-blue-600]="currentSlide === $index"
                  [class.bg-gray-300]="currentSlide !== $index"
                  [class.dark:bg-blue-500]="currentSlide === $index"
                  [class.dark:bg-gray-600]="currentSlide !== $index">
                </button>
              }
            </div>
            
            <!-- Right Navigation Button -->
            <button 
              (click)="nextSlide()"
              class="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-4 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 min-h-[56px] min-w-[56px]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Desktop Navigation -->
        <!-- Desktop Navigation - Only visible on desktop -->
        <div class="hidden md:block">
          <!-- Desktop Container Dots - Bottom center -->
          <div class="flex justify-center space-x-3 py-4">
            @for (house of houses(); track house.id) {
              <button 
                (click)="goToSlide($index)"
                class="w-4 h-4 rounded-full transition-all hover:scale-125"
                [class.bg-blue-600]="currentSlide === $index"
                [class.bg-gray-300]="currentSlide !== $index"
                [class.dark:bg-blue-500]="currentSlide === $index"
                [class.dark:bg-gray-600]="currentSlide !== $index">
              </button>
            }
          </div>
        </div>
        
      </div>
      
      <!-- Desktop Side Navigation Buttons - Positioned relative to component -->
      <div class="hidden md:block">
        <button 
          (click)="previousSlide()"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-4 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 hover:scale-110 z-30">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button 
          (click)="nextSlide()"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-4 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 hover:scale-110 z-30">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </section>
  `,
  styles: [`
    /* Mobile-specific improvements for house carousel */
    @media (max-width: 990px) {
      .mobile-carousel-image {
        height: 20rem !important;
        object-fit: cover !important;
        object-position: center !important;
      }
      
      .mobile-carousel-container {
        padding: 0.5rem !important;
        gap: 1rem !important;
      }
      
      .mobile-carousel-content {
        padding: 0.5rem !important;
      }
      
      .mobile-carousel-title {
        font-size: 3rem !important;
        line-height: 1.2 !important;
        margin-bottom: 1rem !important;
      }
      
      .mobile-carousel-description {
        font-size: 1.5rem !important;
        line-height: 1.6 !important;
        margin-bottom: 1.5rem !important;
      }
      
      .mobile-carousel-info {
        font-size: 1.5rem !important;
        padding: 1rem 0 !important;
      }
      
      .mobile-carousel-info span {
        font-size: 1.5rem !important;
      }
      
      .mobile-carousel-button {
        font-size: 2rem !important;
        padding: 1.5rem 2rem !important;
        min-height: 80px !important;
      }
      
      .mobile-carousel-progress {
        height: 1.25rem !important;
        margin: 1rem 0 !important;
      }
      
      .mobile-carousel-thumbnails {
        gap: 0.75rem !important;
      }
      
      .mobile-carousel-thumbnail {
        width: 12rem !important;
        height: 7rem !important;

      }
      
      /* Override Tailwind classes directly */
      .mobile-carousel-content .text-4xl {
        font-size: 3rem !important;
      }
      
      .mobile-carousel-content .text-xl {
        font-size: 1.5rem !important;
      }
      
      .mobile-carousel-content .text-base {
        font-size: 1.5rem !important;
      }
      
      .mobile-carousel-content .text-2xl {
        font-size: 1.75rem !important;
      }
      
      .mobile-carousel-content .text-sm {
        font-size: 1.5rem !important;
      }
      
      /* Mobile bottom navigation dots - target the specific mobile navigation section */
      .flex.items-center.justify-between .flex.space-x-2 button {
        width: 1rem !important;
        height: 1rem !important;
        min-width: 1rem !important;
        min-height: 1rem !important;
      }
      
      /* Override Tailwind w-3 h-3 classes for mobile bottom dots */
      .flex.items-center.justify-between .flex.space-x-2 button.w-3 {
        width: 1rem !important;
      }
      
      .flex.items-center.justify-between .flex.space-x-2 button.h-3 {
        height: 1rem !important;
      }
      
      /* Mobile image navigation dots - under main image (always visible) */
      .flex.space-x-1.mt-1 button {
        width: 0.75rem !important;
        height: 0.75rem !important;
        min-width: 0.75rem !important;
        min-height: 0.75rem !important;
      }
      
      /* Override Tailwind w-2 h-2 classes for image dots */
      .flex.space-x-1.mt-1 button.w-2 {
        width: 0.75rem !important;
      }
      
      .flex.space-x-1.mt-1 button.h-2 {
        height: 0.75rem !important;
      }
      
      /* Mobile thumbnails - target the mobile thumbnail section */
      .mobile-carousel-thumbnails .mobile-carousel-thumbnail {
        width: 7.5rem !important;
        height: 4.5rem !important;
      }
      
      /* Override Tailwind thumbnail classes for mobile */
      .mobile-carousel-thumbnails .mobile-carousel-thumbnail.w-12 {
        width: 7.5rem !important;
      }
      
      .mobile-carousel-thumbnails .mobile-carousel-thumbnail.h-8 {
        height: 4.5rem !important;
      }
      
      /* Mobile thumbnail images - make them bigger and more visible */
      .mobile-thumbnail-image {
        width: 200% !important;
        height: 200% !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0.375rem !important;
        transform: scale(2) !important;
        transform-origin: center !important;
        position: relative !important;
        z-index: 10 !important;
      }
      
      /* Alternative targeting - direct img elements in mobile thumbnails */
      .mobile-carousel-thumbnails img {
        width: 200% !important;
        height: 200% !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0.375rem !important;
        transform: scale(2) !important;
        transform-origin: center !important;
        position: relative !important;

      }
      
      /* Even more specific targeting */
      .mobile-carousel-thumbnail img {
        width: 200% !important;
        height: 200% !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0.375rem !important;
        transform: scale(2) !important;
        transform-origin: center !important;
        position: relative !important;
        z-index: 10 !important;
      }
    }
    
    /* Seesaw animation for Active status - one side goes up, other goes down, middle as pivot */
    /* Animation: rotates like a seesaw board, one end up while other end down, then reverses */
    @keyframes seesaw {
      0%, 100% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(-4deg);
      }
      50% {
        transform: rotate(0deg);
      }
      75% {
        transform: rotate(4deg);
      }
    }
    
    .animate-seesaw {
      animation: seesaw 0.3s ease-in-out;
      animation-iteration-count: 2;
      transform-origin: center center;
    }
    
    /* Glow pulse animation for favorites button (warm orange-red glow matching topbar) */
    /* Note: This animation is applied to topbar element, so topbar's animation takes precedence */
    /* Keeping here for reference, but topbar's animation is what actually runs */
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
export class HouseCarouselComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  private lotteryService = inject(LotteryService);
  private localeService = inject(LocaleService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private togglingFavorites = signal<Set<string>>(new Set());
  private quickEntering = signal<Set<string>>(new Set());
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  // Expose authService for template
  get currentUser() {
    return this.authService.getCurrentUser();
  }
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  currentSlide = 0;
  currentHouseImageIndex = 0;
  currentSecondaryImageIndex = 0;
  isTransitioning = false;
  private autoSlideInterval: any;
  private countdownInterval?: number;
  private vibrationInterval?: any;
  private intersectionObserver: IntersectionObserver | null = null;
  loadedImages = new Set<string>();
  vibrationTrigger = signal<number>(0);
  flyingHeart = signal<{ active: boolean; startX: number; startY: number; endX: number; endY: number } | null>(null);
  
  // Use signals for values that change over time to avoid change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  currentTime = signal<number>(Date.now());

  // Use computed signal to get active houses from lottery service
  houses = computed(() => {
    const allHouses = this.lotteryService.getHouses()();
    return allHouses.filter(house => house.status === 'active');
  });
  
  // Computed signal for favorite house IDs
  favoriteHouseIds = computed(() => this.lotteryService.getFavoriteHouseIds());

  ngOnInit() {
    // Auto-rotation disabled - only manual navigation via arrows
    // this.startAutoSlide(); // Disabled - user controls navigation
    this.setupIntersectionObserver();
    // Load the first slide images immediately
    setTimeout(() => this.loadCurrentSlideImages(), 100);
    // Start countdown timer - update signal to trigger change detection properly
    this.countdownInterval = window.setInterval(() => {
      this.currentTime.set(Date.now());
      // Update viewers count occasionally (every 5 seconds) for realism
      if (Math.random() < 0.2) {
        this.currentViewers.set(Math.floor(Math.random() * 46) + 5);
      }
    }, 1000);
    
    // Start seesaw animation for active status badges (every 5 seconds)
    this.vibrationInterval = setInterval(() => {
      const currentHouse = this.getCurrentHouse();
      if (currentHouse && currentHouse.status === 'active') {
        // Trigger animation by updating signal
        this.vibrationTrigger.set(Date.now());
        // Remove animation class after animation completes (600ms - 2 iterations × 0.3s)
        setTimeout(() => {
          this.vibrationTrigger.set(0);
        }, 600);
      }
    }, 5000);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }


  private startAutoSlide() {
    // Clear any existing interval first
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    // Start auto-rotation every 8 seconds
    this.autoSlideInterval = setInterval(() => {
      if (this.houses().length > 1) {
        this.nextSlide();
      }
    }, 8000);
  }

  private stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  // Auto-rotation disabled - method kept for compatibility but does nothing
  private resetAutoSlide() {
    // Auto-rotation disabled - user controls navigation via arrows
    // this.stopAutoSlide();
    // this.startAutoSlide();
  }

  private setupIntersectionObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset['src'];
              if (src && !this.loadedImages.has(src)) {
                img.src = src;
                img.classList.remove('opacity-0');
                img.classList.add('opacity-100');
                this.loadedImages.add(src);
                this.intersectionObserver?.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );
    }
  }

  isImageLoaded(imageUrl: string): boolean {
    return this.loadedImages.has(imageUrl);
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Set fallback placeholder image
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.classList.add('opacity-100');
    // Don't log warnings for missing images - they're handled gracefully
  }

  private loadCurrentSlideImages() {
    const currentHouse = this.getCurrentHouse();
    if (currentHouse) {
      // Load the current image immediately
      const currentImageUrl = currentHouse.images[this.currentHouseImageIndex].url;
      if (!this.loadedImages.has(currentImageUrl)) {
        this.loadedImages.add(currentImageUrl);
      }
      
      // Preload adjacent images for smoother transitions
      const nextImageIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
      const prevImageIndex = this.currentHouseImageIndex === 0 
        ? currentHouse.images.length - 1 
        : this.currentHouseImageIndex - 1;
      
      [nextImageIndex, prevImageIndex].forEach(index => {
        const imageUrl = currentHouse.images[index].url;
        if (!this.loadedImages.has(imageUrl)) {
          const img = new Image();
          img.onload = () => {
            this.loadedImages.add(imageUrl);
          };
          img.src = imageUrl;
        }
      });
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  getCurrentHouse() {
    return this.houses()[this.currentSlide];
  }
  
  getCurrentHouseImage() {
    return this.getCurrentHouse().images[this.currentHouseImageIndex];
  }
  
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.houses().length;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses().length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  goToSlide(index: number) {
    if (index < 0 || index >= this.houses().length) return;
    this.currentSlide = index;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  nextHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
    // Auto-rotation disabled - no reset needed
  }
  
  previousHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = this.currentHouseImageIndex === 0 
      ? currentHouse.images.length - 1 
      : this.currentHouseImageIndex - 1;
    // Auto-rotation disabled - no reset needed
  }
  
  goToHouseImage(index: number) {
    this.currentHouseImageIndex = index;
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  formatPrice(price: number): string {
    // Use locale-aware currency formatting (removes hardcoded USD)
    return this.localeService.formatCurrency(price);
  }

  formatDate(date: Date): string {
    return this.localeService.formatDate(date, 'medium');
  }

  getTicketProgressForHouse(house: any): number {
    return Math.round((house.soldTickets / house.totalTickets) * 100);
  }
  
  getImageIndexForHouse(houseIndex: number): number {
    return houseIndex === this.currentSlide ? this.currentHouseImageIndex : 0;
  }

  getOdds(house: any): string {
    const totalTickets = house.totalTickets;
    return `1:${this.localeService.formatNumber(totalTickets)}`;
  }

  getRemainingTickets(house: any): number {
    return house.totalTickets - house.soldTickets;
  }

  getLotteryCountdown(house: any): string {
    const now = this.currentTime();
    const endTime = new Date(house.lotteryEndDate).getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      return '00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Show seconds only when less than 24 hours left
    if (days === 0 && hours < 24) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  getCurrentViewers(): number {
    // Return the signal value to avoid change detection errors
    return this.currentViewers();
  }

  getTicketsAvailableText(house: any): string {
    const remaining = this.getRemainingTickets(house);
    const template = this.translate('house.onlyTicketsAvailable');
    return template.replace('{count}', this.localeService.formatNumber(remaining));
  }

  getStatusText(house: any): string {
    switch (house.status) {
      case 'active':
        return this.translate('house.active');
      case 'ended':
        return this.translate('house.ended');
      case 'upcoming':
        return this.translate('house.upcoming');
      default:
        return this.translate('house.active');
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'ended':
        return 'bg-red-500';
      case 'upcoming':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  openLocationMap(house: any): void {
    const address = house.address || house.location || house.title;
    const city = house.city || 'New York';
    
    // Create a search query for Google Maps
    const searchQuery = encodeURIComponent(`${address}, ${city}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // Open in a new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    
    console.log(`Opening location map for: ${address}, ${city}`);
  }

  // Get only the secondary (non-primary) images for thumbnails
  getSecondaryImages(images: any[]): any[] {
    return images.filter(image => !image.isPrimary);
  }

  // Get the primary image for the main display
  getPrimaryImage(images: any[]): any {
    return images.find(image => image.isPrimary) || images[0];
  }

  // Navigate to a secondary image
  goToSecondaryImage(index: number) {
    this.currentSecondaryImageIndex = index;
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }

  // Get the current main image to display (primary by default, or selected secondary)
  getCurrentMainImage(house: any, houseIndex: number): any {
    if (houseIndex === this.currentSlide && this.currentSecondaryImageIndex >= 0) {
      const secondaryImages = this.getSecondaryImages(house.images);
      if (secondaryImages.length > 0 && this.currentSecondaryImageIndex < secondaryImages.length) {
        return secondaryImages[this.currentSecondaryImageIndex];
      }
    }
    return this.getPrimaryImage(house.images);
  }

  // Favorites methods
  isFavorite(houseId: string): boolean {
    const favoriteIds = this.favoriteHouseIds();
    return Array.isArray(favoriteIds) && favoriteIds.includes(houseId);
  }

  isTogglingFavorite(houseId: string): boolean {
    return this.togglingFavorites().has(houseId);
  }

  isQuickEntering(houseId: string): boolean {
    return this.quickEntering().has(houseId);
  }

  async toggleFavorite(houseId: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.authService.getCurrentUser()()?.isAuthenticated) {
      this.toastService.warning(
        this.translate('house.signInToParticipate') || 'Please sign in to add houses to favorites',
        3000
      );
      return;
    }

    if (this.isTogglingFavorite(houseId)) {
      return;
    }

    this.togglingFavorites.update(set => new Set(set).add(houseId));

    // Get the source button position for animation
    const sourceButton = (event.target as HTMLElement).closest('button');
    let sourceX = 0;
    let sourceY = 0;
    if (sourceButton) {
      const rect = sourceButton.getBoundingClientRect();
      sourceX = rect.left + rect.width / 2;
      sourceY = rect.top + rect.height / 2;
    }

    try {
      const result = await this.lotteryService.toggleFavorite(houseId).toPromise();
      if (result) {
        const message = result.added 
          ? (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.added) || 'Added to favorites')
          : (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.removed) || 'Removed from favorites');
        this.toastService.success(message, 2000);
        
        // Trigger animation only when adding to favorites
        if (result.added && sourceButton) {
          this.animateHeartToFavorites(sourceX, sourceY);
        }
      }
    } catch (error: any) {
      // Suppress errors for 200 status (response format issues, not actual errors)
      if (error?.status !== 200) {
        console.error('Error toggling favorite:', error);
      }
      this.toastService.error(
        this.translate('lottery.common.error') || 'Failed to update favorites',
        3000
      );
    } finally {
      this.togglingFavorites.update(set => {
        const newSet = new Set(set);
        newSet.delete(houseId);
        return newSet;
      });
    }
  }

  /**
   * Animate heart icon flying from carousel to topbar favorites text
   */
  animateHeartToFavorites(startX: number, startY: number): void {
    // Find the favorites button/text in the topbar - try multiple selectors
    let favoritesElement: HTMLElement | null = null;
    
    // Try to find by text content in button
    const navButtons = document.querySelectorAll('nav button');
    for (let i = 0; i < navButtons.length; i++) {
      const btn = navButtons[i] as HTMLElement;
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('favorite') || text.includes('favourites')) {
        favoritesElement = btn;
        break;
      }
    }
    
    if (!favoritesElement) {
      // Try aria-label
      favoritesElement = document.querySelector('button[aria-label*="favorite" i]') as HTMLElement;
    }
    
    if (!favoritesElement) {
      return; // Can't find the element, skip animation
    }
    
    const rect = favoritesElement.getBoundingClientRect();
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;
    
    // Start animation
    this.flyingHeart.set({ active: false, startX, startY, endX, endY });
    
    // Trigger animation after a brief delay
    setTimeout(() => {
      this.flyingHeart.update(heart => heart ? { ...heart, active: true } : null);
      
      // Remove heart and trigger glow after animation completes
      setTimeout(() => {
        this.flyingHeart.set(null);
        // Add glow class to favorites button/text (warm orange-red glow)
        favoritesElement!.classList.add('favorites-glow-pulse');
        setTimeout(() => {
          favoritesElement!.classList.remove('favorites-glow-pulse');
        }, 1500);
      }, 800);
    }, 50);
  }

  /**
   * Quick entry from favorites
   */
  async quickEntry(houseId: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.authService.getCurrentUser()()?.isAuthenticated || this.isQuickEntering(houseId)) {
      return;
    }

    if (!this.isFavorite(houseId)) {
      this.toastService.warning(
        this.translate('lottery.favorites.mustBeFavorite') || 'This house must be in your favorites to use quick entry',
        3000
      );
      return;
    }

    this.quickEntering.update(set => new Set(set).add(houseId));

    try {
      const result = await this.lotteryService.quickEntryFromFavorite({
        houseId: houseId,
        quantity: 1,
        paymentMethodId: 'default'
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(
          this.translate(LOTTERY_TRANSLATION_KEYS.quickEntry.success) || 'Quick entry successful!',
          3000
        );
      }
    } catch (error: any) {
      console.error('Error with quick entry:', error);
      // Suppress errors for 200 status (response format issues, not actual errors)
      if (error?.status !== 200) {
        this.toastService.error(
          this.translate(LOTTERY_TRANSLATION_KEYS.quickEntry.error) || 'Failed to complete quick entry',
          3000
        );
      }
    } finally {
      this.quickEntering.update(set => {
        const newSet = new Set(set);
        newSet.delete(houseId);
        return newSet;
      });
    }
  }
}