import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { LotteryService } from '../../services/lottery.service';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule],
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
                    
                    <!-- Location Icon -->
                    <button 
                      (click)="openLocationMap(house)"
                      class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                      [attr.aria-label]="'View ' + house.title + ' location on map'">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                    
                    <!-- Status Badge -->
                    <div class="absolute top-4 right-4 z-20">
                      <span class="bg-emerald-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg">
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
                            [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                            [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                            [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
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
                          [class.border-blue-500]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.border-gray-300]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)"
                          [class.dark:border-blue-400]="currentSlide === houseIndex && currentSecondaryImageIndex === $index"
                          [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentSecondaryImageIndex === $index)">
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
  `]
})
export class HouseCarouselComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  private lotteryService = inject(LotteryService);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;
  
  currentSlide = 0;
  currentHouseImageIndex = 0;
  currentSecondaryImageIndex = 0;
  isTransitioning = false;
  private autoSlideInterval: any;
  private countdownInterval?: number;
  private intersectionObserver: IntersectionObserver | null = null;
  loadedImages = new Set<string>();
  
  // Use signals for values that change over time to avoid change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  currentTime = signal<number>(Date.now());

  // Use computed signal to get active houses from lottery service
  houses = computed(() => {
    const allHouses = this.lotteryService.getHouses()();
    return allHouses.filter(house => house.status === 'active');
  });

  ngOnInit() {
    // DISABLED: Auto-slide disabled - houses will be manually controlled by user
    // this.startAutoSlide();
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
    this.stopAutoSlide();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }


  private startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 8000);
  }

  private stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private resetAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
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
    img.classList.add('opacity-50');
    console.warn('Failed to load image:', img.src);
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
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses().length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  goToSlide(index: number) {
    if (index < 0 || index >= this.houses().length) return;
    this.currentSlide = index;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  nextHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
    this.resetAutoSlide();
  }
  
  previousHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = this.currentHouseImageIndex === 0 
      ? currentHouse.images.length - 1 
      : this.currentHouseImageIndex - 1;
    this.resetAutoSlide();
  }
  
  goToHouseImage(index: number) {
    this.currentHouseImageIndex = index;
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  formatPrice(price: number): string {
    return price.toLocaleString();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getTicketProgressForHouse(house: any): number {
    return Math.round((house.soldTickets / house.totalTickets) * 100);
  }
  
  getImageIndexForHouse(houseIndex: number): number {
    return houseIndex === this.currentSlide ? this.currentHouseImageIndex : 0;
  }

  getOdds(house: any): string {
    const totalTickets = house.totalTickets;
    return `1:${totalTickets.toLocaleString()}`;
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
    return template.replace('{count}', remaining.toLocaleString());
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
    this.resetAutoSlide();
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
}