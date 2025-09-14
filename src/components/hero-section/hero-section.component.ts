import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative overflow-hidden">
      <!-- Main Hero with Winner Celebration -->
      <div class="relative h-96 md:h-[500px]">
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
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <!-- Left side content -->
          <div class="text-white max-w-2xl">
            <h1 class="hero-title font-black mb-6 leading-tight text-white" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
              {{ translate('hero.title') }}
            </h1>
            <p class="hero-subtitle mb-8 text-white" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
              Enter exclusive house lotteries and get the chance to win amazing properties at a fraction of their market value.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="btn-primary text-lg px-8 py-4">
                {{ translate('hero.browseLotteries') }}
              </button>
              <button class="btn-outline text-lg px-8 py-4">
                {{ translate('hero.howItWorks') }}
              </button>
            </div>
          </div>
          
          <!-- Right side - House Carousel -->
        </div>
      </div>
      
      <!-- House Carousel Section -->
      <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-16 transition-colors duration-300">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              {{ translate('hero.dreamHome') }}
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300">
              Explore our featured properties and imagine your future home
            </p>
          </div>
          
          <div class="max-w-2xl mx-auto">
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <h3 class="text-gray-900 dark:text-white text-2xl font-bold mb-6 text-center">{{ getCurrentHouse().name }}</h3>
              
              <!-- Main House Image -->
              <div class="relative mb-6">
                <img 
                  [src]="getCurrentHouseImage().url" 
                  [alt]="getCurrentHouseImage().alt"
                  class="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg">
                
                <!-- Image Navigation -->
                <button 
                  (click)="previousHouseImage()"
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button 
                  (click)="nextHouseImage()"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
              
              <!-- Image Thumbnails -->
              <div class="flex justify-center space-x-3 mb-6">
                @for (image of getCurrentHouse().images; track $index) {
                  <button 
                    (click)="goToHouseImage($index)"
                    class="w-16 h-16 rounded-lg overflow-hidden border-3 transition-all hover:scale-105"
                    [class.border-blue-500]="currentHouseImageIndex === $index"
                    [class.border-gray-300]="currentHouseImageIndex !== $index"
                    [class.dark:border-blue-400]="currentHouseImageIndex === $index"
                    [class.dark:border-gray-600]="currentHouseImageIndex !== $index">
                    <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover">
                  </button>
                }
              </div>
              
              <!-- House Navigation -->
              <div class="flex justify-between items-center">
                <button 
                  (click)="previousSlide()"
                  class="bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 p-3 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                
                <div class="flex space-x-3">
                  @for (house of houses; track house.id) {
                    <button 
                      (click)="goToSlide($index)"
                      class="w-3 h-3 rounded-full transition-all hover:scale-125"
                      [class.bg-blue-600]="currentSlide === $index"
                      [class.bg-gray-300]="currentSlide !== $index"
                      [class.dark:bg-blue-400]="currentSlide === $index"
                      [class.dark:bg-gray-600]="currentSlide !== $index">
                    </button>
                  }
                </div>
                
                <button 
                  (click)="nextSlide()"
                  class="bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 p-3 rounded-full hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
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
    
    @media (max-width: 767px) {
      .hero-title {
        font-size: 2.5rem;
        line-height: 1.1;
      }
      
      .hero-subtitle {
        font-size: 1.125rem;
        line-height: 1.5;
      }
    }

    @media (min-width: 768px) {
      .hero-title {
        font-size: 4rem;
        line-height: 1;
      }
      
      .hero-subtitle {
        font-size: 1.5rem;
        line-height: 1.4;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        font-weight: 700;
      }
    }
  `]
})
export class HeroSectionComponent {
  private translationService = inject(TranslationService);
  
  currentSlide = 0;
  currentHouseImageIndex = 0;

  houses = [
    {
      id: 1,
      name: 'Modern Downtown Condo',
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
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses.length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
  }
  
  goToSlide(index: number) {
    this.currentSlide = index;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
  }
  
  nextHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
  }
  
  previousHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = this.currentHouseImageIndex === 0 
      ? currentHouse.images.length - 1 
      : this.currentHouseImageIndex - 1;
  }
  
  goToHouseImage(index: number) {
    this.currentHouseImageIndex = index;
  }
}