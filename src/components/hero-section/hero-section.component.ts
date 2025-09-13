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
          <!-- Blue gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 opacity-90"></div>
        </div>
        
        <!-- Content Overlay -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <!-- Left side content -->
          <div class="text-white max-w-2xl">
            <h1 class="hero-title font-black mb-6 leading-tight text-white" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
              {{ translate('hero.title') }}
            </h1>
            <p class="hero-subtitle mb-8 text-blue-100 leading-relaxed font-medium">
              {{ translate('hero.subtitle') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                {{ translate('hero.browseLotteries') }}
              </button>
              <button class="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                {{ translate('hero.howItWorks') }}
              </button>
            </div>
          </div>
          
          <!-- Right side - Winner celebration visual -->
          <div class="hidden lg:flex flex-col items-center">
            <div class="text-8xl animate-bounce mb-4">🗝️</div>
            <div class="text-center text-white">
              <div class="text-2xl font-bold mb-2">{{ translate('hero.winnerKeys') }}</div>
              <div class="text-lg opacity-90">{{ translate('hero.dreamHome') }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scrolling Marketing Images -->
      <div class="bg-gray-50 dark:bg-gray-800 py-8 overflow-hidden">
        <div class="flex animate-scroll space-x-2">
          @for (image of marketingImages; track image.id) {
            <div class="flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <img 
                [src]="image.url" 
                [alt]="image.alt"
                class="w-full h-full object-cover">
            </div>
          }
          <!-- Duplicate for seamless loop -->
          @for (image of marketingImages; track image.id + '-duplicate') {
            <div class="flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <img 
                [src]="image.url" 
                [alt]="image.alt"
                class="w-full h-full object-cover">
            </div>
          }
        </div>
      </div>
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
    
    .animate-scroll {
      animation: scroll 8s linear infinite;
    }
    
    .animate-scroll:hover {
      animation-play-state: paused;
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
      }
    }
  `]
})
export class HeroSectionComponent {
  private translationService = inject(TranslationService);

  marketingImages = [
    {
      id: 1,
      url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      alt: 'Beautiful family home'
    },
    {
      id: 2,
      url: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
      alt: 'Modern downtown condo'
    },
    {
      id: 3,
      url: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg',
      alt: 'Luxury waterfront villa'
    },
    {
      id: 4,
      url: 'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg',
      alt: 'Cozy suburban house'
    },
    {
      id: 5,
      url: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
      alt: 'Contemporary apartment'
    }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}