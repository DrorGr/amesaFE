import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="gradient-hero dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-black opacity-10"></div>
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-10 left-10 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="hero-title font-black mb-8 text-balance animate-fadeIn">
            {{ translate('hero.title') }}
          </h1>
          <p class="hero-subtitle mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed animate-fadeIn text-balance">
            {{ translate('hero.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-6 justify-center animate-fadeIn">
            <button class="btn-secondary text-lg px-10 py-4">
              {{ translate('hero.browseLotteries') }}
            </button>
            <button class="btn-outline text-lg px-10 py-4">
              {{ translate('hero.howItWorks') }}
            </button>
          </div>
          
          <div class="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-80">
            <div class="text-center">
              <div class="text-2xl font-bold">142</div>
              <div class="text-sm text-blue-200">{{ translate('hero.happyWinners') }}</div>
            </div>
            <div class="hidden sm:block w-px h-12 bg-blue-300 opacity-30"></div>
            <div class="text-center">
              <div class="text-2xl font-bold">$24M</div>
              <div class="text-sm text-blue-200">{{ translate('hero.propertiesWon') }}</div>
            </div>
            <div class="hidden sm:block w-px h-12 bg-blue-300 opacity-30"></div>
            <div class="text-center">
              <div class="text-2xl font-bold">99.8%</div>
              <div class="text-sm text-blue-200">{{ translate('hero.satisfaction') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {
  private translationService = inject(TranslationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}