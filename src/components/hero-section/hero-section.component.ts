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
      <!-- Main Hero Image with Winner Celebration -->
      <div class="relative h-96 md:h-[500px] bg-gradient-to-br from-blue-600 to-blue-800">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg" 
            alt="Winner celebration" 
            class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-blue-600 bg-opacity-70"></div>
        </div>
        
        <!-- Content Overlay -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div class="text-white max-w-2xl">
            <h1 class="text-4xl md:text-6xl font-black mb-6 leading-tight" style="font-family: 'Brighter Brush', cursive; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              {{ translate('hero.title') }}
            </h1>
            <p class="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              {{ translate('hero.subtitle') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                {{ translate('hero.browseLotteries') }}
              </button>
              <button class="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105">
                {{ translate('hero.howItWorks') }}
              </button>
            </div>
          </div>
          
          <!-- Winner Keys Visual -->
          <div class="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2">
            <div class="text-6xl animate-bounce">🗝️</div>
            <div class="text-center text-white font-bold mt-2">{{ translate('hero.winnerKeys') }}</div>
          </div>
        </div>
      </div>
      
      <!-- Scrolling Marketing Images -->
      <div class="bg-white dark:bg-gray-900 py-8 overflow-hidden">
        <div class="flex animate-scroll space-x-8">
          @for (image of marketingImages; track image.id) {
            <div class="flex-shrink-0 w-80 h-48 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                [src]="image.url" 
                [alt]="image.alt"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
            </div>
          }
          <!-- Duplicate for seamless loop -->
          @for (image of marketingImages; track image.id + '-duplicate') {
            <div class="flex-shrink-0 w-80 h-48 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                [src]="image.url" 
                [alt]="image.alt"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
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
      animation: scroll 30s linear infinite;
    }
    
    .animate-scroll:hover {
      animation-play-state: paused;
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