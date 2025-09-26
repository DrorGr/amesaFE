import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-promotions-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Promotions" 
              class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('promotions.heroTitle') }}
              </h1>
              <p class="text-lg md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('promotions.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Introduction -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('promotions.availablePromotions') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('promotions.introduction') }}
            </p>
          </div>
        </section>

        <!-- Promotions Grid -->
        <div class="space-y-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div class="p-8">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                    👑
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ translate('promotions.becomeMember') }}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ translate('promotions.becomeMemberBrief') }}
                    </p>
                  </div>
                </div>
                <button class="btn-primary">
                  {{ translate('promotions.learnMore') }}
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div class="p-8">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    ⭐
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ translate('promotions.amesaStars') }}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ translate('promotions.amesaStarsBrief') }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="font-semibold">{{ translate('promotions.purchased') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div class="p-8">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-green-400 to-green-600 text-white">
                    🤝
                  </div>
                  <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ translate('promotions.takePart') }}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ translate('promotions.takePartBrief') }}
                    </p>
                  </div>
                </div>
                <button class="btn-primary">
                  {{ translate('promotions.learnMore') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class PromotionsPageComponent {
  private translationService = inject(TranslationService);
  private router = inject(Router);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}