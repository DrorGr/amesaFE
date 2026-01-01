import { Component, OnInit, OnDestroy, inject, computed, signal, effect, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { LotteryService } from '../../services/lottery.service';
import { LocaleService } from '../../services/locale.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HeartAnimationService } from '../../services/heart-animation.service';
import { ProductService } from '../../services/product.service';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { VerificationGateComponent } from '../verification-gate/verification-gate.component';
import { PaymentPanelService } from '../../services/payment-panel.service';
import { PaymentMethodPreferenceService } from '../../services/payment-method-preference.service';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule, VerificationGateComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-4 md:py-4 transition-colors duration-300 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div class="overflow-hidden">
          @if (houses().length === 0 || lotteryService.isHousesLoading) {
            <!-- Skeleton loader for house carousel -->
            <div class="w-full flex-shrink-0 flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 px-2 md:px-0" role="status" aria-busy="true" aria-live="polite">
              <!-- Image skeleton -->
              <div class="flex-1 max-w-5xl">
                <div class="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
              <!-- Content skeleton -->
              <div class="flex-1 max-w-md">
                <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse w-3/4"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse w-1/2"></div>
                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          } @else {
            <div class="flex transition-transform duration-500 ease-in-out" 
                 [style.transform]="'translateX(' + (-currentSlide * 100) + '%)'">
              @for (house of houses(); track house.id; let houseIndex = $index) {
              <div class="w-full flex-shrink-0 flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 relative px-2 md:px-0">
                <!-- Main House Image -->
                <div class="flex-1 max-w-5xl flex flex-col mb-4">
                  <div class="relative overflow-hidden rounded-xl shadow-lg group">
                    @if (isImageLoaded(getCurrentMainImage(house, houseIndex).url)) {
                        @let currentImage = getCurrentMainImage(house, houseIndex);
                        @let imageId = getImageIdFromUrl(currentImage.url);
                        @let isS3Url = currentImage.url.includes('/houses/');
                        @if (isS3Url && imageId) {
                          <!-- Responsive picture element for S3/CloudFront images -->
                          <picture>
                            <!-- Mobile: 500×375 -->
                            <source 
                              [srcset]="getImageUrl(currentImage.url, 'mobile', house.id, imageId)" 
                              type="image/webp"
                              media="(max-width: 768px)">
                            <source 
                              [srcset]="getImageUrl(currentImage.url, 'mobile', house.id, imageId).replace('.webp', '.jpg')" 
                              type="image/jpeg"
                              media="(max-width: 768px)">
                            
                            <!-- Desktop: 800×600 for carousel -->
                            <source 
                              [srcset]="getImageUrl(currentImage.url, 'carousel', house.id, imageId)" 
                              type="image/webp">
                            <img 
                              [src]="getImageUrl(currentImage.url, 'carousel', house.id, imageId).replace('.webp', '.jpg')" 
                              [alt]="currentImage.alt"
                              [loading]="houseIndex === 0 && currentSlide === 0 ? 'eager' : 'lazy'"
                              decoding="async"
                              fetchpriority="high"
                              (error)="onImageError($event)"
                              class="w-full h-64 md:h-96 object-cover object-center opacity-100 transition-opacity duration-300"
                              (load)="onImageLoad($event)">
                          </picture>
                        } @else {
                          <!-- Fallback to regular img for Unsplash URLs (during migration) -->
                          <img
                            [src]="currentImage.url" 
                            [alt]="currentImage.alt"
                            [loading]="houseIndex === 0 && currentSlide === 0 ? 'eager' : 'lazy'"
                            decoding="async"
                            fetchpriority="high"
                            (error)="onImageError($event)"
                            class="w-full h-64 md:h-96 object-cover object-center opacity-100 transition-opacity duration-300"
                            (load)="onImageLoad($event)"
                            onerror="this.src='/assets/AmesaNoBG.png'">
                        }
                    } @else {
                      <div class="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div class="animate-pulse flex flex-col items-center space-y-2">
                          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div class="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
                        </div>
                      </div>
                      <div class="relative w-full h-full">
                        <img
                          [attr.data-src]="getCurrentMainImage(house, houseIndex).url" 
                          [alt]="getCurrentMainImage(house, houseIndex).alt"
                          [class.thumbnail-upcoming]="house.status === 'upcoming'"
                          [class.thumbnail-ended]="house.status === 'ended'"
                          class="w-full h-64 md:h-96 object-cover object-center opacity-0 absolute inset-0 transition-opacity duration-300"
                          (load)="onImageLoad($event)"
                          (error)="onImageError($event)">
                        <!-- Thumbnail overlay for status -->
                        <div 
                          *ngIf="house.status === 'upcoming'"
                          class="absolute inset-0 bg-yellow-500 bg-opacity-15 dark:bg-yellow-400 dark:bg-opacity-10 pointer-events-none z-0">
                        </div>
                        <div 
                          *ngIf="house.status === 'ended'"
                          class="absolute inset-0 bg-gray-500 bg-opacity-30 dark:bg-gray-600 dark:bg-opacity-40 pointer-events-none z-0 thumbnail-ended-overlay">
                        </div>
                      </div>
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
                        [class.bg-emerald-500]="house.status === 'active'"
                        [class.bg-yellow-500]="house.status === 'upcoming'"
                        [class.bg-gray-500]="house.status === 'ended'"
                        [class.animate-seesaw]="house.status === 'active' && vibrationTrigger()"
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
                      [title]="isFavorite(house.id) ? (translate(LOTTERY_TRANSLATION_KEYS.favorites.removeFromFavorites) || 'Remove from favorites') : (translate(LOTTERY_TRANSLATION_KEYS.favorites.addToFavorites) || 'Add to favorites')"
                      [disabled]="isTogglingFavorite(house.id) || house.status === 'ended'"
                      [class.animate-pulse]="isTogglingFavorite(house.id)"
                      [class.favorite-button-red-hover]="!isFavorite(house.id) && house.status !== 'ended'"
                      [class.favorite-button-red-filled]="isFavorite(house.id) && house.status !== 'ended'"
                      [class.favorite-button-ended]="house.status === 'ended'"
                      [class.bg-gray-400]="house.status === 'ended'"
                      [class.cursor-not-allowed]="house.status === 'ended'"
                      class="absolute top-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-20 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      [class.hover:bg-purple-700]="house.status !== 'ended'">
                      <svg class="w-6 h-6 transition-all duration-300 favorite-heart-icon"
                           [class.text-red-500]="isFavorite(house.id)"
                           [class.text-white]="!isFavorite(house.id)"
                           [class.heart-beat]="isFavorite(house.id)"
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
                      <div class="flex space-x-2">
                        @for (image of getSecondaryImages(house.images); track $index) {
                          <button 
                            (click)="goToSecondaryImage($index)"
                            class="w-20 h-12 rounded overflow-hidden border-2 transition-all hover:scale-105"
                            [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                            [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
                            <img [src]="image.url" [alt]="image.alt" loading="lazy" decoding="async" class="w-full h-full object-cover" (error)="onImageError($event)">
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
                          class="w-30 h-19 rounded overflow-hidden border-2 transition-all hover:scale-105"
                          [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                          [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
                          <img [src]="image.url" [alt]="image.alt" loading="lazy" decoding="async" class="w-full h-full object-cover" (error)="onImageError($event)">
                        </button>
                      }
                    </div>
                    
                    <!-- Image Navigation Dots - For switching between house images -->
                    <div class="flex space-x-1 mt-1">
                      @for (image of house.images; track $index) {
                        <button 
                          (click)="goToHouseImage($index); $event.stopPropagation()"
                          type="button"
                          class="w-2 h-2 rounded-full transition-all hover:scale-125 cursor-pointer focus:outline-none"
                          [class.bg-blue-500]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.bg-gray-300]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                          [class.dark:bg-blue-400]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.dark:bg-gray-600]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                          [class.opacity-50]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                          [class.w-3]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.h-3]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [attr.aria-label]="'Go to image ' + ($index + 1) + ' of ' + house.images.length"
                          [attr.aria-current]="(currentSlide === houseIndex && currentHouseImageIndex === $index) ? 'true' : 'false'">
                        </button>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Property Description and Lottery Info -->
                <div class="flex-1 max-w-2xl text-center lg:text-left flex flex-col justify-between h-auto md:h-120 mx-auto lg:mx-0 px-2 md:px-0">
                  <div>
                    <!-- House Title -->
                    <div class="mb-4 md:mb-4">
                      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center">
                        {{ house.title }}
                      </h2>
                    </div>
                    
                    <p class="text-gray-700 dark:text-gray-200 mb-6 md:mb-6 leading-relaxed text-base md:text-2xl">
                      {{ translate('house.propertyOfYourOwn') }}
                    </p>
                  </div>
                  
                  <!-- Lottery Information -->
                  <div class="space-y-2 md:space-y-2 flex-grow flex flex-col justify-center">
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ translate('common.price') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-lg md:text-3xl">{{ formatPrice(house.price) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ translate('house.city') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-lg md:text-3xl">{{ house.city || 'Manhattan' }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ translate('house.address') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-lg md:text-3xl">{{ house.address || '123 Park Ave' }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ translate('house.perTicket') }}</span>
                      <span class="font-bold text-blue-600 dark:text-blue-400 text-lg md:text-3xl">{{ formatPrice(house.ticketPrice) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ translate('house.odds') }}</span>
                      <span class="font-bold text-gray-900 dark:text-white text-lg md:text-3xl">{{ getOdds(house) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span *ngIf="getLotteryCountdownLabel(house)" class="text-gray-600 dark:text-gray-400 text-lg md:text-2xl font-large">{{ getLotteryCountdownLabel(house) }}</span>
                      <span class="font-bold text-orange-600 dark:text-orange-400 text-lg md:text-3xl font-mono">{{ getLotteryCountdown(house) }}</span>
                    </div>
                  
                    <!-- Tickets Available -->
                    <div class="mt-4 md:mt-3">
                      <div class="text-center text-lg md:text-xl text-orange-600 dark:text-orange-400 font-semibold">
                        {{ getTicketsAvailableText(house) }}
                      </div>
                    </div>
                    
                    <!-- Buttons Section -->
                    @if (currentUser()?.isAuthenticated) {
                      <app-verification-gate [isVerificationRequired]="true">
                        <!-- Buy Ticket / Reserve Ticket Button -->
                        @if (house.status === 'ended') {
                          <button 
                            disabled
                            class="w-full mt-6 md:mt-4 bg-gray-400 dark:bg-gray-600 text-white py-4 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 text-xl md:text-2xl min-h-[60px] md:min-h-[72px] cursor-not-allowed opacity-60 buy-ticket-ended">
                            {{ translate('house.ended') || 'Ended' }}
                          </button>
                        } @else if (house.status === 'upcoming') {
                          <button class="w-full mt-6 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-4 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-xl md:text-2xl min-h-[60px] md:min-h-[72px] relative overflow-hidden">
                            {{ translate('house.reserveTicket') || 'Reserve Ticket' }}
                          </button>
                        } @else {
                          <button 
                            (click)="onBuyTicketClick(house, $event)"
                            (keydown.enter)="onBuyTicketClick(house, $event)"
                            (keydown.space)="onBuyTicketClick(house, $event); $event.preventDefault()"
                            [disabled]="isPurchasing(house.id)"
                            [class.buy-ticket-active-animation]="house.status === 'active' && !isPurchasing(house.id)"
                            class="w-full mt-6 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-4 md:py-4 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-xl md:text-2xl min-h-[60px] md:min-h-[72px] disabled:bg-gray-400 disabled:cursor-not-allowed relative overflow-hidden">
                            <span class="relative z-10">
                              @if (isPurchasing(house.id)) {
                                {{ translate('house.processing') }}
                              } @else {
                                {{ translate('house.buyTicket') }} - {{ formatPrice(house.ticketPrice) }}
                              }
                            </span>
                          </button>
                        }
                      </app-verification-gate>
                    } @else {
                      <!-- Sign In Prompt -->
                      <div class="text-center mt-6 md:mt-4">
                        <p class="text-xl md:text-xl text-gray-600 dark:text-gray-300 mb-4 md:mb-3">{{ translate('house.signInToParticipate') }}</p>
                        <div class="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{{ formatPrice(house.ticketPrice) }} {{ translate('house.perTicket') }}</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          }
        </div>
        
        <!-- Fixed Navigation Controls - Bottom of component -->
        <!-- Mobile Navigation - Bottom -->
        @if (houses().length > 0 && !lotteryService.isHousesLoading) {
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
        }
        
        <!-- Desktop Navigation -->
        <!-- Desktop Navigation - Only visible on desktop -->
        @if (houses().length > 0 && !lotteryService.isHousesLoading) {
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
        }
        
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
      animation-name: seesaw !important;
      animation-duration: 0.3s !important;
      animation-timing-function: ease-in-out !important;
      animation-iteration-count: 2 !important;
      animation-fill-mode: none !important;
      animation-play-state: running !important;
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
    
    /* Red hover glow for favorites button - around the heart icon */
    .favorite-button-red-hover:hover .favorite-heart-icon {
      filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 24px rgba(239, 68, 68, 0.4));
    }
    
    .favorite-button-red-filled .favorite-heart-icon {
      filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.7)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.5)) drop-shadow(0 0 18px rgba(239, 68, 68, 0.3));
    }
    
    /* Beating heart animation for favorited items */
    @keyframes heart-beat {
      0%, 100% {
        transform: scale(1);
      }
      25% {
        transform: scale(1.1);
      }
      50% {
        transform: scale(1);
      }
      75% {
        transform: scale(1.1);
      }
    }
    
    .heart-beat {
      animation: heart-beat 1.5s ease-in-out infinite;
      transform-origin: center center;
    }
    
    /* Thumbnail filters for status */
    .thumbnail-upcoming {
      filter: sepia(0.2) saturate(1.1) brightness(1.05);
    }
    
    .thumbnail-ended {
      filter: grayscale(0.8) brightness(0.7);
    }
    
    .thumbnail-ended-overlay {
      filter: grayscale(0.8) brightness(0.7);
    }
    
    /* Active buy ticket button border glow animation (continuous loop around border) */
    /* Creates a moving glow effect that travels around the button perimeter like a chasing tail */
    .buy-ticket-active-animation {
      position: relative;
      overflow: hidden;
      border-radius: 0.5rem;
      background: transparent !important; /* Override Tailwind bg-blue-600 */
    }

    /* Override all hover and dark mode background states */
    .buy-ticket-active-animation:hover {
      background: transparent !important; /* Override hover:bg-blue-700 */
    }

    /* Override Tailwind dark mode utilities - use attribute selector for higher specificity */
    :host-context(.dark) .buy-ticket-active-animation,
    .buy-ticket-active-animation[class*="dark:bg-blue"] {
      background: transparent !important; /* Override dark:bg-blue-700 */
    }

    :host-context(.dark) .buy-ticket-active-animation:hover,
    .buy-ticket-active-animation[class*="dark:hover:bg-blue"]:hover {
      background: transparent !important; /* Override dark:hover:bg-blue-600 */
    }

    .buy-ticket-active-animation::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: conic-gradient(
        from 0deg,
        rgba(251, 146, 60, 0.8),
        rgba(251, 146, 60, 1),
        rgba(251, 146, 60, 0.8),
        rgba(251, 146, 60, 0.4),
        rgba(251, 146, 60, 0.8),
        rgba(251, 146, 60, 1),
        rgba(251, 146, 60, 0.8)
      );
      border-radius: 0.5rem;
      z-index: -2;
      animation: buy-ticket-border-rotate 4s linear infinite;
    }
    
    .buy-ticket-active-animation::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      background: rgb(37, 99, 235); /* bg-blue-600 explicit color */
      border-radius: calc(0.5rem - 2px);
      z-index: -1;
    }
    
    .dark .buy-ticket-active-animation::after {
      background: rgb(29, 78, 216); /* dark:bg-blue-700 */
    }
    
    /* Handle disabled/purchasing state - ensure background matches */
    .buy-ticket-active-animation.bg-gray-400::after {
      background: rgb(156, 163, 175); /* bg-gray-400 */
    }
    
    @keyframes buy-ticket-border-rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    /* Button content already has z-10 class (Tailwind), no need to override */
    .buy-ticket-active-animation > * {
      position: relative;
      /* z-index handled by Tailwind z-10 class on content */
    }
    
    .buy-ticket-ended {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      background-color: #9ca3af !important;
      pointer-events: none !important;
    }
    
    .buy-ticket-ended:hover {
      background-color: #9ca3af !important;
      opacity: 0.6 !important;
    }
    
    .buy-ticket-ended:disabled {
      background-color: #9ca3af !important;
      opacity: 0.6 !important;
      cursor: not-allowed !important;
    }
    
    .favorite-button-ended {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      background-color: #9ca3af !important;
      pointer-events: none !important;
    }
    
    .favorite-button-ended:hover {
      background-color: #9ca3af !important;
      opacity: 0.5 !important;
    }
  `]
})
export class HouseCarouselComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  lotteryService = inject(LotteryService);
  private localeService = inject(LocaleService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private heartAnimationService = inject(HeartAnimationService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private verificationService = inject(IdentityVerificationService, { optional: true });
  private paymentPanelService = inject(PaymentPanelService);
  private paymentMethodPreference = inject(PaymentMethodPreferenceService);
  private togglingFavorites = signal<Set<string>>(new Set());
  private quickEntering = signal<Set<string>>(new Set());
  private purchasing = signal<Set<string>>(new Set());
  private buyTicketClickInProgress = signal<Set<string>>(new Set()); // Guard against duplicate clicks
  
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
  currentSecondaryImageIndex = -1; // -1 means show primary image, >= 0 means show secondary image at that index
  isTransitioning = false;
  private autoSlideInterval: any;
  private vibrationInterval?: any;
  private countdownInterval?: any;
  private intersectionObserver: IntersectionObserver | null = null;
  loadedImages = new Set<string>();
  private _vibrationTrigger = signal<number>(0);
  vibrationTrigger = computed(() => {
    // Explicitly read the signal value to ensure tracking
    const value = this._vibrationTrigger();
    return value > 0;
  });
  
  // Force signal tracking with effect - ensures computed is always tracked
  private vibrationEffect = effect(() => {
    // Reading the computed signal here ensures it's tracked
    const _ = this.vibrationTrigger();
  });
  
  // Use signals for values that change over time to avoid change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  currentTime = signal<number>(Date.now()); // Signal for countdown updates

  // Use computed signal to get active houses from lottery service
  houses = computed(() => {
    const allHouses = this.lotteryService.getHouses()();
    return allHouses.filter(house => house.status === 'active');
  });
  
  // Computed signal for favorite house IDs
  favoriteHouseIds = computed(() => this.lotteryService.getFavoriteHouseIds());

  ngOnInit() {
    // Auto-rotation disabled - only manual navigation via arrows
    this.setupIntersectionObserver();
    // Load the first slide images immediately
    setTimeout(() => this.loadCurrentSlideImages(), 100);
    
    // Start seesaw animation for active status badges (every 5 seconds)
    this.vibrationInterval = window.setInterval(() => {
      const currentHouse = this.getCurrentHouse();
      if (currentHouse && currentHouse.status === 'active') {
        // Trigger animation by updating signal
        const triggerValue = Date.now();
        this._vibrationTrigger.set(triggerValue);
        // Remove animation class after animation completes (700ms - 2 iterations × 0.3s = 600ms + 100ms buffer)
        setTimeout(() => {
          this._vibrationTrigger.set(0);
        }, 700);
      }
    }, 5000);
    
    // Trigger initial animation if current house is active
    const currentHouse = this.getCurrentHouse();
    if (currentHouse && currentHouse.status === 'active') {
      setTimeout(() => {
        const triggerValue = Date.now();
        this._vibrationTrigger.set(triggerValue);
        setTimeout(() => {
          this._vibrationTrigger.set(0);
        }, 700);
      }, 1000);
    }

    // Update countdown every second
    this.countdownInterval = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
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
    const currentSrc = img.src;
    
    // If this is an S3/CloudFront URL that failed, try falling back to detail.webp
    if (currentSrc.includes('/houses/') && !currentSrc.includes('/detail.webp') && !currentSrc.includes('/detail.jpg')) {
      // Extract base path and try detail.webp
      const urlMatch = currentSrc.match(/^(.+\/houses\/[^\/]+\/[^\/]+)\/[^\/]+\.(webp|jpg|jpeg|png)$/i);
      if (urlMatch) {
        const fallbackUrl = `${urlMatch[1]}/detail.webp`;
        // Only retry once (prevent infinite loop)
        if (!img.dataset['retried']) {
          img.dataset['retried'] = 'true';
          img.src = fallbackUrl;
          return;
        }
      }
    }
    
    // If fallback failed or not an S3 URL, show Amesa logo
    img.src = '/assets/AmesaNoBG.png';
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
    this.currentSecondaryImageIndex = -1; // Reset to show primary image
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses().length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.currentSecondaryImageIndex = -1; // Reset to show primary image
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  goToSlide(index: number) {
    if (index < 0 || index >= this.houses().length) return;
    this.currentSlide = index;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.currentSecondaryImageIndex = -1; // Reset to show primary image
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }
  
  nextHouseImage() {
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse) {
      return;
    }
    
    const nextIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
    this.goToHouseImage(nextIndex);
  }
  
  previousHouseImage() {
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse) {
      return;
    }
    
    const prevIndex = this.currentHouseImageIndex === 0 
      ? currentHouse.images.length - 1 
      : this.currentHouseImageIndex - 1;
    this.goToHouseImage(prevIndex);
  }
  
  goToHouseImage(index: number) {
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse || index < 0 || index >= currentHouse.images.length) {
      return;
    }
    
    // Update the house image index
    this.currentHouseImageIndex = index;
    
    // Determine if the selected image is primary or secondary
    // Note: HouseImage interface doesn't include isPrimary, but actual data does
    const selectedImage = currentHouse.images[index] as any;
    if (selectedImage.isPrimary) {
      // If primary image, reset secondary index to show primary
      this.currentSecondaryImageIndex = -1;
    } else {
      // If secondary image, find its index in the secondary images array
      const secondaryImages = this.getSecondaryImages(currentHouse.images);
      const secondaryIndex = secondaryImages.findIndex(img => img === selectedImage);
      if (secondaryIndex >= 0) {
        this.currentSecondaryImageIndex = secondaryIndex;
      }
    }
    
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
    const ticketsSold = house.soldTickets || 0;
    return Math.round((ticketsSold / house.totalTickets) * 100);
  }
  
  getImageIndexForHouse(houseIndex: number): number {
    return houseIndex === this.currentSlide ? this.currentHouseImageIndex : 0;
  }

  getOdds(house: any): string {
    if (!house || !house.totalTickets || house.totalTickets === 0) return 'N/A';
    const ticketsSold = house.soldTickets || 0;
    const availableTickets = house.totalTickets - ticketsSold;
    if (availableTickets <= 0) return 'N/A';
    // Odds = 1 : available tickets (ratio between a ticket and possible entries)
    return `1:${this.localeService.formatNumber(availableTickets)}`;
  }

  getRemainingTickets(house: any): number {
    if (!house || !house.totalTickets) return 0;
    const ticketsSold = house.soldTickets || 0;
    return Math.max(0, house.totalTickets - ticketsSold);
  }

  getLotteryCountdownLabel(house: any): string {
    if (!house) return '';
    
    if (house.status === 'ended') {
      return ''; // No label for ended
    }
    
    if (house.status === 'upcoming' && house.lotteryStartDate) {
      return this.translate('house.lotteryStartsIn') || 'Lottery starts in';
    }
    
    return this.translate('house.lotteryCountdown');
  }

  getLotteryCountdown(house: any): string {
    if (!house) return '00:00:00:00';
    
    // For ended status, just return "Ended"
    if (house.status === 'ended') {
      return this.translate('house.ended') || 'Ended';
    }
    
    // For upcoming, use lotteryStartDate if available
    const targetDate = house.status === 'upcoming' && house.lotteryStartDate 
      ? new Date(house.lotteryStartDate)
      : house.lotteryEndDate 
        ? new Date(house.lotteryEndDate)
        : null;
    
    if (!targetDate) return '00:00:00:00';
    
    const now = this.currentTime();
    const timeLeft = targetDate.getTime() - now;

    if (timeLeft <= 0) {
      return house.status === 'upcoming' 
        ? (this.translate('house.ended') || 'Ended')
        : '00:00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Format: DD:HH:MM:SS (always show days, hours, minutes, seconds)
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        return 'bg-gray-500';
      case 'upcoming':
        return 'bg-yellow-500';
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
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse) {
      return;
    }
    
    const secondaryImages = this.getSecondaryImages(currentHouse.images);
    if (index < 0 || index >= secondaryImages.length) {
      return;
    }
    
    // Update secondary index
    this.currentSecondaryImageIndex = index;
    
    // Find the actual index of this secondary image in the full images array
    const selectedSecondaryImage = secondaryImages[index];
    const actualIndex = currentHouse.images.findIndex(img => img === selectedSecondaryImage);
    if (actualIndex >= 0) {
      this.currentHouseImageIndex = actualIndex;
    }
    
    // Auto-rotation disabled - no reset needed
    this.loadCurrentSlideImages();
  }

  // Get the current main image to display (primary by default, or selected secondary)
  getCurrentMainImage(house: any, houseIndex: number): any {
    // If this is the current slide, use currentHouseImageIndex to get the actual image
    if (houseIndex === this.currentSlide && this.currentHouseImageIndex >= 0 && this.currentHouseImageIndex < house.images.length) {
      return house.images[this.currentHouseImageIndex];
      }
    // Fallback to primary image
    return this.getPrimaryImage(house.images);
  }

  /**
   * Get optimized image URL for a specific size
   * Supports both S3/CloudFront URLs (new format) and Unsplash URLs (legacy)
   * @param imageUrl Original image URL
   * @param size Image size: 'thumbnail' | 'mobile' | 'carousel' | 'detail' | 'full'
   * @param houseId House ID for S3 URL construction
   * @param imageId Image ID for S3 URL construction
   * @returns Optimized image URL
   */
  getImageUrl(imageUrl: string, size: 'thumbnail' | 'mobile' | 'carousel' | 'detail' | 'full' = 'carousel', houseId?: string, imageId?: string): string {
    // If S3/CloudFront URL (contains /houses/), construct size-specific URL
    // Database URLs are in format: https://dpqbvdgnenckf.cloudfront.net/houses/{houseId}/{imageId}/detail.webp
    if (imageUrl.includes('/houses/')) {
      // Extract the base path (everything before the size/file extension)
      // URL format: https://cloudfront.net/houses/{houseId}/{imageId}/detail.webp
      // We want: https://cloudfront.net/houses/{houseId}/{imageId}/{size}.webp
      
      // Match pattern: /houses/{houseId}/{imageId}/{size}.webp or /houses/{houseId}/{imageId}/{size}.jpg
      const urlMatch = imageUrl.match(/^(.+\/houses\/[^\/]+\/[^\/]+)\/[^\/]+\.(webp|jpg|jpeg|png)$/i);
      
      if (urlMatch) {
        // Extract base path (everything up to and including /houses/{houseId}/{imageId})
        const basePath = urlMatch[1];
        
        // If requesting detail, return as-is (already correct)
        if (size === 'detail') {
          return imageUrl; // Already has /detail.webp
        }
        
        // Try requested size first
        // If the size-specific image doesn't exist in S3, it will 404
        // The browser's onerror handler will fallback to detail.webp
        return `${basePath}/${size}.webp`;
      }
    }
    
    // Fallback to original URL (for Unsplash or other formats)
    return imageUrl;
  }

  /**
   * Get fallback image URL (detail.webp) for S3 images when size-specific image fails
   * @param imageUrl Original image URL from database
   * @returns Fallback URL (detail.webp) or original URL
   */
  getFallbackImageUrl(imageUrl: string): string {
    if (imageUrl.includes('/houses/')) {
      // Extract base path and return detail.webp
      const urlMatch = imageUrl.match(/^(.+\/houses\/[^\/]+\/[^\/]+)\/[^\/]+\.(webp|jpg|jpeg|png)$/i);
      if (urlMatch) {
        return `${urlMatch[1]}/detail.webp`;
      }
    }
    return imageUrl;
  }

  /**
   * Get image ID from URL (extracts from S3 path structure)
   * @param imageUrl Image URL
   * @returns Image ID or null if not found
   */
  getImageIdFromUrl(imageUrl: string): string | null {
    // S3 URL format: .../houses/{houseId}/{imageId}/...
    const match = imageUrl.match(/\/houses\/[^\/]+\/([^\/]+)\//);
    return match ? match[1] : null;
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

  isPurchasing(houseId: string): boolean {
    return this.purchasing().has(houseId);
  }

  onBuyTicketClick(house: any, event: Event) {

    event.preventDefault();
    event.stopPropagation();

    // Guard against duplicate clicks
    if (this.buyTicketClickInProgress().has(house.id)) {
      return;
    }

    // Mark as in progress
    this.buyTicketClickInProgress.update(set => new Set(set).add(house.id));

    if (!this.currentUser()?.isAuthenticated) {
      this.buyTicketClickInProgress.update(set => {
        const newSet = new Set(set);
        newSet.delete(house.id);
        return newSet;
      });
      this.toastService.error('Please sign in to purchase tickets', 3000);
      return;
    }

    this.purchaseTicket(house, event).finally(() => {
      // Clear the in-progress flag when done
      this.buyTicketClickInProgress.update(set => {
        const newSet = new Set(set);
        newSet.delete(house.id);
        return newSet;
      });
    });
  }

  async purchaseTicket(house: any, event?: Event) {
    if (!this.currentUser()?.isAuthenticated) {
      this.toastService.error('Please sign in to purchase tickets', 3000);
      return;
    }

    if (this.isPurchasing(house.id)) {
      return;
    }

    if (!house) {
      this.toastService.error('House data not available', 3000);
      return;
    }

    // Check house status (case-insensitive)
    const houseStatus = house.status?.toLowerCase();
    if (houseStatus !== 'active') {
      this.toastService.error('This lottery is not currently active', 3000);
      return;
    }

    // Check verification status
    if (this.verificationService) {
      try {
        const verificationStatus = await firstValueFrom(this.verificationService.getVerificationStatus());
        const userVerificationStatus = this.authService.getCurrentUserDto()()?.verificationStatus;
        const identityVerified = verificationStatus?.verificationStatus === 'verified';
        const userFullyVerified = userVerificationStatus === 'IdentityVerified' || userVerificationStatus === 'FullyVerified';
        const isVerified = identityVerified || userFullyVerified;
        
        if (!isVerified) {
          // Provide more specific error message based on verification status
          let errorMessage = this.translate('auth.verificationRequired');
          if (userVerificationStatus === 'EmailVerified') {
            // User has verified email but needs identity verification
            errorMessage = this.translate('auth.identityVerificationRequired') || 
                         'Identity verification required to purchase tickets. Please complete identity verification in your account settings.';
          }
          
          this.toastService.error(errorMessage, 5000);
          this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
          return;
        }
      } catch (error: any) {
        // If verification check fails, check user profile verification status as fallback
        const userVerificationStatusFallback = this.authService.getCurrentUserDto()()?.verificationStatus;
        const userFullyVerifiedFallback = userVerificationStatusFallback === 'IdentityVerified' || userVerificationStatusFallback === 'FullyVerified';
        
        // Only block if we get a clear "not verified" response AND user profile is not verified
        if ((error?.error?.verificationStatus === 'not_verified' || error?.error?.verificationStatus === 'pending') && !userFullyVerifiedFallback) {
          this.toastService.error(this.translate('auth.verificationRequired'), 4000);
          this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
          return;
        }
        
        // If user profile shows verified, allow purchase even if identity endpoint failed
        if (userFullyVerifiedFallback) {
          // Continue with purchase - user is verified according to profile
        }
      }
    }

    // Fetch product ID if not available
    let productId = house.productId;

    if (!productId) {
      try {
        this.purchasing.update(set => new Set(set).add(house.id));
        const product = await firstValueFrom(this.productService.getProductByHouseId(house.id));
        if (product?.id) {
          productId = product.id;
        } else {
          throw new Error('Product not found');
        }
      } catch (error: any) {
        this.toastService.error('Product not available for this house. Please try again later.', 5000);
        this.purchasing.update(set => {
          const newSet = new Set(set);
          newSet.delete(house.id);
          return newSet;
        });
        return;
      } finally {
        this.purchasing.update(set => {
          const newSet = new Set(set);
          newSet.delete(house.id);
          return newSet;
        });
      }
    }

    // Ensure productId is set before showing modal
    if (!productId) {
      this.toastService.error('Product not available for this house. Please try again later.', 5000);
      return;
    }

    // Store button reference for desktop animation
    const button = this.getClosestElement(event?.target, 'button');

    // Open payment panel via service (rendered at app level - global)
    this.paymentPanelService.open({
      productId: productId,
      houseId: house.id,
      houseTitle: house.title,
      triggerButton: button || undefined
    });
  }

  async toggleFavorite(houseId: string, event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    
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

    // Get the source button for animation
    const sourceButton = this.getClosestElement(event?.target, 'button');

    try {
      const result = await firstValueFrom(this.lotteryService.toggleFavorite(houseId));
      if (result) {
        // State is automatically updated by LotteryService
        const message = result.message || (result.added 
          ? (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.added) || 'Added to favorites')
          : (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.removed) || 'Removed from favorites'));
        this.toastService.success(message, 2000);
        
        // Trigger heart animation when adding to favorites
        if (result.added && sourceButton) {
          this.triggerHeartAnimation(sourceButton);
        }
      }
    } catch (error: any) {
      // Suppress errors for 200 status (response format issues, not actual errors)
      if (error?.status !== 200) {
        console.error('Error toggling favorite:', error);
        this.toastService.error(
          this.translate('lottery.common.error') || 'Failed to update favorites',
          3000
        );
      }
    } finally {
      this.togglingFavorites.update(set => {
        const newSet = new Set(set);
        newSet.delete(houseId);
        return newSet;
      });
    }
  }

  /**
   * Trigger heart animation from button to favorites tab
   */
  private triggerHeartAnimation(sourceButton: HTMLElement): void {
    // Find favorites button in topbar
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
    
    if (favoritesElement && sourceButton) {
      this.heartAnimationService.animateHeart({
        fromElement: sourceButton,
        toElement: favoritesElement
      });
    }
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
      // Get default payment method or use fallback
      const defaultMethod = await this.paymentMethodPreference.getDefaultPaymentMethod();
      const paymentMethodId = defaultMethod?.id || '00000000-0000-0000-0000-000000000000';
      
      const result = await firstValueFrom(this.lotteryService.quickEntryFromFavorite({
        houseId: houseId,
        quantity: 1,
        paymentMethodId: paymentMethodId
      }));
      
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

  /**
   * Safely gets the closest element matching a selector from an event target.
   * Handles cases where event.target might be a Text node or other non-Element node.
   */
  private getClosestElement(target: EventTarget | null | undefined, selector: string): HTMLElement | null {
    if (!target) {
      return null;
    }

    // If target is already an Element, use closest() directly
    if (target instanceof Element) {
      return target.closest(selector) as HTMLElement | null;
    }

    // If target is a Node (like Text), traverse up to find the parent Element
    if (target instanceof Node) {
      let current: Node | null = target;
      while (current && current.nodeType !== Node.ELEMENT_NODE) {
        current = current.parentNode;
      }
      if (current instanceof Element) {
        return current.closest(selector) as HTMLElement | null;
      }
    }

    return null;
  }
}
