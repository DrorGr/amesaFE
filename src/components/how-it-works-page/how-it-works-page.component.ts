import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-how-it-works-page',
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
              alt="How It Works" 
              class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('howItWorks.heroTitle') }}
              </h1>
              <p class="text-lg md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('howItWorks.heroSubtitle') }}
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
              {{ translate('howItWorks.simpleProcess') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('howItWorks.introduction') }}
            </p>
          </div>
        </section>

        <!-- Steps -->
        <section class="mb-16">
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">1</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step1Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step1Desc') }}
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">2</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step2Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step2Desc') }}
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">3</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step3Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step3Desc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('howItWorks.readyToStart') }}
            </h2>
            <p class="text-xl mb-8 max-w-3xl mx-auto">
              {{ translate('howItWorks.ctaDescription') }}
            </p>
            <button
              (click)="navigateToHome()"
              class="btn-outline bg-white text-blue-600 hover:bg-gray-100 border-white">
              {{ translate('howItWorks.browseLotteries') }}
            </button>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class HowItWorksPageComponent {
  private translationService = inject(TranslationService);
  private navigationService = inject(NavigationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHome() {
    this.navigationService.navigateTo('home');
    this.scrollToTop();
  }

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
