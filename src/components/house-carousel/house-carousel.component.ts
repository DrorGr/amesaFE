import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { LotteryService } from '../../services/lottery.service';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-2 md:py-4 transition-colors duration-300 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div class="overflow-hidden">
          <div class="flex transition-transform duration-500 ease-in-out" 
               [style.transform]="'translateX(' + (-currentSlide * 100) + '%)'">
            @for (house of houses; track house.id; let houseIndex = $index) {
              <div class="w-full flex-shrink-0 flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 relative">
                <!-- Main House Image -->
                <div class="flex-1 max-w-4xl flex flex-col mb-2">
                  <div class="relative">
                    @if (isImageLoaded(house.images[getImageIndexForHouse(houseIndex)].url)) {
                      <img
                        [src]="house.images[getImageIndexForHouse(houseIndex)].url" 
                        [alt]="house.images[getImageIndexForHouse(houseIndex)].alt"
                        class="w-full h-48 md:h-96 object-cover rounded-xl shadow-lg opacity-100 transition-opacity duration-300"
                        (load)="onImageLoad($event)"
                        (error)="onImageError($event)">
                    } @else {
                      <div class="w-full h-48 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-center">
                        <div class="animate-pulse flex flex-col items-center space-y-2">
                          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div class="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
                        </div>
                      </div>
                      <img
                        [attr.data-src]="house.images[getImageIndexForHouse(houseIndex)].url" 
                        [alt]="house.images[getImageIndexForHouse(houseIndex)].alt"
                        class="w-full h-48 md:h-96 object-cover rounded-xl shadow-lg opacity-0 absolute inset-0 transition-opacity duration-300"
                        (load)="onImageLoad($event)"
                        (error)="onImageError($event)">
                    }
                  </div>
                  
                  <!-- Image Navigation Below Main Image -->
                  <div class="flex flex-col items-center mt-3">
                    <!-- Mobile: Navigation buttons positioned outside thumbnails -->
                    <div class="md:hidden relative w-full flex justify-center">
                      <!-- Thumbnail Images - centered -->
                      <div class="flex space-x-1">
                        @for (image of house.images; track $index) {
                          <button 
                            (click)="goToHouseImage($index)"
                            class="w-12 h-8 rounded overflow-hidden border-2 transition-all hover:scale-105"
                            [class.border-blue-500]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                            [class.border-gray-300]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                            [class.dark:border-blue-400]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                            [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)">
                            <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover">
                          </button>
                        }
                      </div>
                    </div>
                    
                    <!-- Desktop: Only thumbnails with side navigation -->
                    <div class="hidden md:flex space-x-2">
                      <!-- Desktop thumbnails -->
                      @for (image of house.images; track $index) {
                        <button 
                          (click)="goToHouseImage($index)"
                          class="w-16 h-10 rounded overflow-hidden border-2 transition-all hover:scale-105"
                          [class.border-blue-500]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.border-gray-300]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)"
                          [class.dark:border-blue-400]="currentSlide === houseIndex && currentHouseImageIndex === $index"
                          [class.dark:border-gray-600]="!(currentSlide === houseIndex && currentHouseImageIndex === $index)">
                          <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover">
                        </button>
                      }
                    </div>
                    
                    <!-- Image Navigation Dots - Directly under thumbnails -->
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
                <div class="flex-1 max-w-lg text-center lg:text-left flex flex-col justify-between h-auto md:h-96">
                  <div>
                    <!-- House Title -->
                    <div class="mb-2 md:mb-4">
                      <h2 class="text-lg md:text-3xl font-bold text-gray-900 dark:text-white text-center">
                        {{ house.name }}
                      </h2>
                    </div>
                    
                    <p class="text-gray-600 dark:text-gray-300 mb-3 md:mb-6 leading-relaxed text-xs md:text-base">
                      {{ house.description }}
                    </p>
                  </div>
                  
                  <!-- Lottery Information -->
                  <div class="space-y-1 md:space-y-2 flex-grow flex flex-col justify-center">
                    <div class="flex justify-between items-center py-1 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-xs md:text-base">Property Value</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xs md:text-lg">€{{ formatPrice(house.price) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-1 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-xs md:text-base">Ticket Price</span>
                      <span class="font-bold text-blue-600 dark:text-blue-400 text-xs md:text-lg">€{{ house.ticketPrice }}</span>
                    </div>
                    <div class="flex justify-between items-center py-1 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-xs md:text-base">Tickets Sold</span>
                      <span class="font-bold text-gray-900 dark:text-white text-xs md:text-lg">{{ house.soldTickets }}/{{ house.totalTickets }}</span>
                    </div>
                    <div class="flex justify-between items-center py-1 md:py-2 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-gray-600 dark:text-gray-400 text-xs md:text-base">Draw Date</span>
                      <span class="font-bold text-orange-600 dark:text-orange-400 text-xs md:text-lg">{{ formatDate(house.lotteryEndDate) }}</span>
                    </div>
                  
                    <!-- Progress Bar -->
                    <div class="mt-1 md:mt-3">
                      <div class="flex justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 md:mb-2">
                        <span>Progress</span>
                        <span>{{ getTicketProgressForHouse(house) }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3">
                        <div 
                          class="bg-blue-600 dark:bg-blue-500 h-2 md:h-3 rounded-full transition-all duration-300"
                          [style.width.%]="getTicketProgressForHouse(house)">
                        </div>
                      </div>
                    </div>
                    
                    <!-- Buy Ticket Button -->
                    <button class="w-full mt-2 md:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 md:py-4 px-4 md:px-6 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 text-sm md:text-lg">
                      Buy Ticket - €{{ house.ticketPrice }}
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
          <div class="flex items-center justify-between px-4 py-4">
            <!-- Left Navigation Button -->
            <button 
              (click)="previousSlide()"
              class="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-3 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <!-- Container Dots -->
            <div class="flex space-x-2">
              @for (house of houses; track house.id) {
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
              class="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white p-3 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            @for (house of houses; track house.id) {
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
  `
})
export class HouseCarouselComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private lotteryService = inject(LotteryService);
  
  currentSlide = 0;
  currentHouseImageIndex = 0;
  isTransitioning = false;
  private autoSlideInterval: any;
  private intersectionObserver: IntersectionObserver | null = null;
  loadedImages = new Set<string>();

  houses = [
    {
      id: 1,
      name: 'Modern Downtown Condo',
      description: 'Stunning 2-bedroom condo in the heart of downtown with city views and modern amenities. Perfect for urban professionals seeking luxury living.',
      price: 450000,
      ticketPrice: 50,
      totalTickets: 1000,
      soldTickets: 650,
      lotteryEndDate: new Date('2025-02-15'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
          alt: 'Modern downtown condo exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
          alt: 'Modern living room'
        },
        {
          url: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg',
          alt: 'Modern kitchen'
        },
        {
          url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg',
          alt: 'Modern bedroom'
        }
      ]
    },
    {
      id: 2,
      name: 'Suburban Family Home',
      description: 'Beautiful 4-bedroom family home with large backyard and garage in quiet neighborhood. Ideal for growing families.',
      price: 680000,
      ticketPrice: 75,
      totalTickets: 1500,
      soldTickets: 890,
      lotteryEndDate: new Date('2025-02-20'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
          alt: 'Suburban family home exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg',
          alt: 'Family living room'
        },
        {
          url: 'https://images.pexels.com/photos/1571457/pexels-photo-1571457.jpeg',
          alt: 'Family kitchen'
        },
        {
          url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg',
          alt: 'Family dining room'
        }
      ]
    },
    {
      id: 3,
      name: 'Luxury Waterfront Villa',
      description: 'Exclusive waterfront villa with private beach access and panoramic ocean views. The ultimate in luxury living.',
      price: 1200000,
      ticketPrice: 100,
      totalTickets: 2000,
      soldTickets: 1245,
      lotteryEndDate: new Date('2025-03-01'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg',
          alt: 'Luxury waterfront villa exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571475/pexels-photo-1571475.jpeg',
          alt: 'Luxury living area'
        },
        {
          url: 'https://images.pexels.com/photos/1571477/pexels-photo-1571477.jpeg',
          alt: 'Luxury master bedroom'
        },
        {
          url: 'https://images.pexels.com/photos/1571479/pexels-photo-1571479.jpeg',
          alt: 'Luxury bathroom'
        }
      ]
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
    this.setupIntersectionObserver();
    // Load the first slide images immediately
    setTimeout(() => this.loadCurrentSlideImages(), 100);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
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
    return this.houses[this.currentSlide];
  }
  
  getCurrentHouseImage() {
    return this.getCurrentHouse().images[this.currentHouseImageIndex];
  }
  
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.houses.length;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses.length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
    this.resetAutoSlide();
    this.loadCurrentSlideImages();
  }
  
  goToSlide(index: number) {
    if (index < 0 || index >= this.houses.length) return;
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
}