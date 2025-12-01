import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { LotteryService } from '../../services/lottery.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HeartAnimationService } from '../../services/heart-animation.service';
import { HouseCarouselService } from '../../services/house-carousel.service';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-4 md:py-4 transition-colors duration-300 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div class="overflow-hidden">
          <div class="flex transition-transform duration-500 ease-in-out" 
               [style.transform]="'translateX(' + (-currentSlide() * 100) + '%)'">
            @for (house of houses(); track house.id; let houseIndex = $index) {
              <div class="w-full flex-shrink-0 flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 relative px-2 md:px-0 mobile-carousel-container">
                <!-- Main House Image -->
                <div class="flex-1 max-w-5xl flex flex-col mb-4">
                  <div class="relative overflow-hidden rounded-xl shadow-lg group">
                    @if (isImageLoaded(getCurrentMainImage(house, houseIndex).url)) {
                        <img
                          [src]="getCurrentMainImage(house, houseIndex).url" 
                          [alt]="getCurrentMainImage(house, houseIndex).alt"
                          class="w-full h-64 md:h-96 object-cover object-center opacity-100 transition-opacity duration-300 mobile-carousel-image"
                          (load)="onImageLoad($event)"
                          (error)="onImageError($event)"
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
                    
                    <!-- Location Icon - 50% bigger -->
                    <button 
                      (click)="openLocationMap(house)"
                      class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                      [attr.aria-label]="'View ' + house.title + ' location on map'">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                    
                    <!-- Favorite Button - Always visible, 40% smaller than previous size -->
                    <button
                      (click)="toggleFavorite($event, house)"
                      [class.favorite-button-pulse]="isTogglingFavorite(house.id)"
                      [class.favorite-button-glow]="isFavorite(house.id)"
                      [class.favorite-button-orange-glow]="!isFavorite(house.id)"
                      class="absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 p-3 rounded-full shadow-2xl transition-all duration-500 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 border-2 border-white dark:border-gray-800 favorite-button"
                      [attr.aria-label]="isFavorite(house.id) ? 'Remove from favorites' : 'Add to favorites'"
                      [title]="isFavorite(house.id) ? translate('lottery.favorites.removeFromFavorites') : translate('lottery.favorites.addToFavorites')">
                      <svg 
                        class="w-5 h-5 transition-all duration-500 favorite-heart"
                        [class.text-red-500]="isFavorite(house.id)"
                        [class.text-white]="!isFavorite(house.id)"
                        [class.heart-fill-animation]="isFavorite(house.id)"
                        [attr.fill]="isFavorite(house.id) ? 'currentColor' : 'none'"
                        [attr.stroke]="!isFavorite(house.id) ? 'currentColor' : 'none'"
                        stroke-width="2"
                        viewBox="0 0 24 24">
                        <path 
                          fill-rule="evenodd"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          clip-rule="evenodd">
                        </path>
                      </svg>
                    </button>
                    
                    <!-- Status Badge - Center top with vibration animation, 50% bigger -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <span class="status-badge-vibrate bg-emerald-500 text-white px-6 py-4 rounded-full text-xl font-semibold shadow-lg">
                        {{ getStatusText(house) }}
                      </span>
                    </div>
                    
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
                            [class.border-blue-500]="currentSlide() === houseIndex && currentSecondaryImageIndex() === $index"
                            [class.border-gray-300]="!(currentSlide() === houseIndex && currentSecondaryImageIndex() === $index)"
                            [class.dark:border-blue-400]="currentSlide() === houseIndex && currentSecondaryImageIndex() === $index"
                            [class.dark:border-gray-600]="!(currentSlide() === houseIndex && currentSecondaryImageIndex() === $index)">
                            <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover mobile-thumbnail-image" 
                               >
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
                          [class.border-blue-500]="currentSlide() === houseIndex && currentSecondaryImageIndex() === $index"
                          [class.border-gray-300]="!(currentSlide() === houseIndex && currentSecondaryImageIndex() === $index)"
                          [class.dark:border-blue-400]="currentSlide() === houseIndex && currentSecondaryImageIndex() === $index"
                          [class.dark:border-gray-600]="!(currentSlide() === houseIndex && currentSecondaryImageIndex() === $index)">
                          <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover mobile-thumbnail-image" 
                          >
                        </button>
                      }
                    </div>
                    
                    <!-- Image Navigation Dots - For switching between house images -->
                    <div class="flex space-x-1 mt-1">
                      @for (image of house.images; track $index) {
                        <button 
                          (click)="goToHouseImage($index)"
                          class="w-2 h-2 rounded-full transition-all hover:scale-125"
                          [class.bg-blue-500]="currentSlide() === houseIndex && currentHouseImageIndex() === $index"
                          [class.bg-gray-300]="!(currentSlide() === houseIndex && currentHouseImageIndex() === $index)"
                          [class.dark:bg-blue-400]="currentSlide() === houseIndex && currentHouseImageIndex() === $index"
                          [class.dark:bg-gray-600]="!(currentSlide() === houseIndex && currentHouseImageIndex() === $index)">
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
                      <span class="font-bold text-gray-900 dark:text-white text-xl md:text-3xl">€{{ formatPrice(house.price) }}</span>
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
                      <span class="text-gray-600 dark:text-gray-400 text-xl md:text-2xl font-large">{{ translate('common.price') }}</span>
                      <span class="font-bold text-blue-600 dark:text-blue-400 text-xl md:text-3xl">€{{ house.ticketPrice }}</span>
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
                    
                    <!-- Buy Ticket Button -->
                    <button class="w-full mt-6 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-6 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-2xl md:text-2xl min-h-[72px] mobile-carousel-button">
                      {{ translate('house.buyTicket') }} - €{{ house.ticketPrice }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        
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
                  [class.bg-blue-600]="currentSlide() === $index"
                  [class.bg-gray-300]="currentSlide() !== $index"
                  [class.dark:bg-blue-500]="currentSlide() === $index"
                  [class.dark:bg-gray-600]="currentSlide() !== $index">
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
                [class.bg-blue-600]="currentSlide() === $index"
                [class.bg-gray-300]="currentSlide() !== $index"
                [class.dark:bg-blue-500]="currentSlide() === $index"
                [class.dark:bg-gray-600]="currentSlide() !== $index">
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

    /* Favorite Button Animations - Matching house-card styling */
    @keyframes favorite-pulse-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(139, 92, 246, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(139, 92, 246, 1), 0 0 60px rgba(139, 92, 246, 0.8), 0 0 90px rgba(139, 92, 246, 0.6), 0 0 0 6px rgba(139, 92, 246, 0.5);
      }
    }

    @keyframes favorite-red-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4), 0 0 0 3px rgba(239, 68, 68, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(239, 68, 68, 1), 0 0 60px rgba(239, 68, 68, 0.8), 0 0 90px rgba(239, 68, 68, 0.6), 0 0 0 6px rgba(239, 68, 68, 0.5);
      }
    }

    @keyframes favorite-orange-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(249, 115, 22, 0.8), 0 0 40px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.4), 0 0 0 3px rgba(249, 115, 22, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(249, 115, 22, 1), 0 0 60px rgba(249, 115, 22, 0.8), 0 0 90px rgba(249, 115, 22, 0.6), 0 0 0 6px rgba(249, 115, 22, 0.5);
      }
    }

    /* Status Badge Vertical Vibration Animation */
    /* Vibrates (seesaw motion around center), then pauses for 3 seconds, repeats */
    /* Total duration: 3.5s (0.5s vibration + 3s pause) */
    @keyframes status-badge-vibrate {
      /* Vibration phase: 0% to ~14.3% (0.5s out of 3.5s total) */
      0% {
        transform: rotate(0deg);
        transform-origin: center center;
      }
      3.57% {
        transform: rotate(-3deg);
        transform-origin: center center;
      }
      7.14% {
        transform: rotate(3deg);
        transform-origin: center center;
      }
      10.71% {
        transform: rotate(-3deg);
        transform-origin: center center;
      }
      14.28% {
        transform: rotate(3deg);
        transform-origin: center center;
      }
      14.3% {
        transform: rotate(0deg);
        transform-origin: center center;
      }
      /* Pause phase: 14.3% to 100% (3s pause) */
      14.3%, 100% {
        transform: rotate(0deg);
        transform-origin: center center;
      }
    }

    .status-badge-vibrate {
      animation: status-badge-vibrate 3.5s ease-in-out infinite;
      transform-origin: center center;
      display: inline-block;
    }

    @keyframes heart-fill {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.3);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .favorite-button-pulse {
      animation: favorite-pulse-glow 2s ease-in-out infinite;
    }

    .favorite-button-glow {
      animation: favorite-red-glow 2s ease-in-out infinite;
    }

    .favorite-button-orange-glow {
      animation: favorite-orange-glow 2s ease-in-out infinite;
    }

    .heart-fill-animation {
      animation: heart-fill 0.6s ease-out;
    }
  `]
})
export class HouseCarouselComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private heartAnimationService = inject(HeartAnimationService);
  private carouselService = inject(HouseCarouselService);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  // Delegate to service - use computed signals for template binding
  currentSlide = computed(() => this.carouselService.currentSlide());
  currentHouseImageIndex = computed(() => this.carouselService.currentHouseImageIndex());
  currentSecondaryImageIndex = computed(() => this.carouselService.currentSecondaryImageIndex());
  isTransitioning = computed(() => this.carouselService.isTransitioning());
  houses = this.carouselService.houses;
  
  private countdownInterval?: number;
  private intersectionObserver: IntersectionObserver | null = null;
  
  // Use signals for values that change over time to avoid change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  currentTime = signal<number>(Date.now());
  currentUser = this.authService.getCurrentUser();

  // Check if house is favorite (delegate to service)
  isFavorite(houseId: string): boolean {
    return this.carouselService.isFavorite(houseId);
  }

  // Check if toggling favorite (delegate to service)
  isTogglingFavorite(houseId: string): boolean {
    return this.carouselService.isTogglingFavorite(houseId);
  }

  ngOnInit() {
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
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupIntersectionObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset['src'];
              if (src && !this.carouselService.isImageLoaded(src)) {
                img.src = src;
                img.classList.remove('opacity-0');
                img.classList.add('opacity-100');
                this.carouselService.markImageAsLoaded(src);
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
    return this.carouselService.isImageLoaded(imageUrl);
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
    if (img.src) {
      this.carouselService.markImageAsLoaded(img.src);
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.add('opacity-50');
    console.warn('Failed to load image:', img.src);
  }

  private loadCurrentSlideImages() {
    this.carouselService.loadCurrentSlideImages();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  getCurrentHouse() {
    return this.carouselService.getCurrentHouse();
  }
  
  getCurrentHouseImage() {
    return this.carouselService.getCurrentHouseImage();
  }
  
  nextSlide() {
    this.carouselService.nextSlide();
    this.loadCurrentSlideImages();
  }
  
  previousSlide() {
    this.carouselService.previousSlide();
    this.loadCurrentSlideImages();
  }
  
  goToSlide(index: number) {
    this.carouselService.goToSlide(index);
    this.loadCurrentSlideImages();
  }
  
  nextHouseImage() {
    this.carouselService.nextHouseImage();
  }
  
  previousHouseImage() {
    this.carouselService.previousHouseImage();
  }
  
  goToHouseImage(index: number) {
    this.carouselService.goToHouseImage(index);
    this.loadCurrentSlideImages();
  }
  
  formatPrice(price: number): string {
    return this.carouselService.formatPrice(price);
  }

  formatDate(date: Date): string {
    return this.carouselService.formatDate(date);
  }

  getTicketProgressForHouse(house: any): number {
    return this.carouselService.getTicketProgressForHouse(house);
  }
  
  getImageIndexForHouse(houseIndex: number): number {
    return this.carouselService.getImageIndexForHouse(houseIndex);
  }

  getOdds(house: any): string {
    return this.carouselService.getOdds(house);
  }

  getRemainingTickets(house: any): number {
    return this.carouselService.getRemainingTickets(house);
  }

  getLotteryCountdown(house: any): string {
    // Use currentTime signal for countdown
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
    return this.carouselService.getTicketsAvailableText(house);
  }

  getStatusText(house: any): string {
    return this.carouselService.getStatusText(house);
  }

  async toggleFavorite(event: Event, house: any): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    
    // Show toast if user is not logged in
    if (!this.currentUser()) {
      this.toastService.info('Please log in to add favorites', 3000);
      return;
    }
    
    // Delegate to service for favorite toggling
    await this.carouselService.toggleFavorite(event, house);
    
    // Trigger heart animation if added to favorites
    const isCurrentlyFavorite = this.isFavorite(house.id);
    if (!isCurrentlyFavorite) {
      setTimeout(() => {
        const favoriteButton = event.currentTarget as HTMLElement;
        let favoritesTab: HTMLElement | null = null;
        
        // Try multiple selectors to find the favorites tab
        const navButtons = document.querySelectorAll('nav button');
        for (const btn of Array.from(navButtons)) {
          const text = btn.textContent?.trim().toLowerCase() || '';
          if (text.includes('favorite') || text.includes('favourites')) {
            favoritesTab = btn as HTMLElement;
            break;
          }
        }
        
        if (!favoritesTab) {
          const allButtons = document.querySelectorAll('app-topbar button');
          for (const btn of Array.from(allButtons)) {
            const text = btn.textContent?.trim().toLowerCase() || '';
            if (text.includes('favorite') || text.includes('favourites')) {
              favoritesTab = btn as HTMLElement;
              break;
            }
          }
        }

        if (favoritesTab && favoriteButton) {
          this.heartAnimationService.animateHeart({
            fromElement: favoriteButton,
            toElement: favoritesTab
          });
        }
      }, 100);
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
    return this.carouselService.getSecondaryImages(images);
  }

  // Get the primary image for the main display
  getPrimaryImage(images: any[]): any {
    return this.carouselService.getPrimaryImage(images);
  }

  // Navigate to a secondary image
  goToSecondaryImage(index: number) {
    this.carouselService.goToSecondaryImage(index);
    this.loadCurrentSlideImages();
  }

  // Get the current main image to display (primary by default, or selected secondary)
  getCurrentMainImage(house: any, houseIndex: number): any {
    return this.carouselService.getCurrentMainImage(house, houseIndex);
  }
}