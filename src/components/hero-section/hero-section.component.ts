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