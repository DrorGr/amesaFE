import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-96 md:h-[500px]">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="About Amesa" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-4xl md:text-6xl font-black mb-6 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('about.heroTitle') }}
              </h1>
              <p class="text-xl md:text-2xl mb-8 leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('about.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Our Story Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('about.ourStory') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('about.founded') }}
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('about.coreOffering') }}
              </p>
            </div>
            <div class="relative">
              <img 
                src="https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg" 
                alt="Team collaboration" 
                class="rounded-xl shadow-2xl">
              <div class="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <!-- 4Wins Model Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('about.fourWinsModel') }}
            </h2>
            <div class="w-24 h-1 bg-emerald-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('about.fourWinsSubtitle') }}
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="relative">
              <img 
                src="https://images.pexels.com/photos/1181393/pexels-photo-1181393.jpeg" 
                alt="Property lottery" 
                class="rounded-xl shadow-2xl">
              <div class="absolute -top-6 -left-6 w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            
            <div class="space-y-6">
              <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('about.breakOdds') }}
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('about.minimumPrice') }}
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('about.foundedFrom') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Social Impact Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('about.socialImpact') }}
            </h2>
            <div class="w-24 h-1 bg-orange-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('about.socialImpactSubtitle') }}
            </p>
          </div>

          <div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-8 md:p-12">
            <div class="text-center">
              <div class="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <p class="text-xl md:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {{ translate('about.profitsUsage') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Values Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('about.ourValues') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Trust -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('about.trust') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('about.trustDescription') }}
              </p>
            </div>

            <!-- Accessibility -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('about.accessibility') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('about.accessibilityDescription') }}
              </p>
            </div>

            <!-- Innovation -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('about.innovation') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('about.innovationDescription') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('about.joinUs') }}
            </h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">
              {{ translate('about.joinUsDescription') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button class="btn-primary bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                {{ translate('about.browseLotteries') }}
              </button>
              <button class="btn-outline border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                {{ translate('about.learnMore') }}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class AboutPageComponent {
  private translationService = inject(TranslationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
