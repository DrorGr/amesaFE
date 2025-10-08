import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';


@Component({
  selector: 'app-partners-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Partners" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('partners.heroTitle') }}
              </h1>
              <p class="text-2xl md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('partners.heroSubtitle') }}
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
              {{ translate('partners.trustedPartners') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('partners.introduction') }}
            </p>
          </div>
        </section>

        <!-- Partners Grid -->
        <div class="space-y-16">
          <!-- Accounting Partner -->
          <section>
            <div class="text-center mb-8">
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('partners.accountingPartner') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('partners.accountingDescription') }}
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <div class="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
                <!-- Partner Logo/Icon -->
                <div class="flex-shrink-0">
                  <div class="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>

                <!-- Partner Information -->
                <div class="flex-1 text-center lg:text-left">
                  <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    PiK Podatki i Księgowość Sp. z o.o
                  </h4>
                  <p class="text-2xl text-gray-600 dark:text-gray-400 mb-6">
                    {{ translate('partners.pikDescription') }}
                  </p>
                  
                  <!-- Specialties -->
                  <div class="mb-6">
                    <h5 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      {{ translate('partners.specialties') }}
                    </h5>
                    <div class="flex flex-wrap gap-2 justify-center lg:justify-start">
                      <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {{ translate('partners.taxServices') }}
                      </span>
                      <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {{ translate('partners.accounting') }}
                      </span>
                      <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {{ translate('partners.financialManagement') }}
                      </span>
                      <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {{ translate('partners.compliance') }}
                      </span>
                    </div>
                  </div>

                  <!-- Contact Button -->
                  <a 
                    href="https://pik.tax/kontakt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    {{ translate('partners.learnMore') }}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <!-- Legal Partner -->
          <section>
            <div class="text-center mb-8">
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('partners.legalPartner') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('partners.legalDescription') }}
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <div class="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
                <!-- Partner Logo/Icon -->
                <div class="flex-shrink-0">
                  <div class="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                    </svg>
                  </div>
                </div>

                <!-- Partner Information -->
                <div class="flex-1 text-center lg:text-left">
                  <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Zeiba & Partners
                  </h4>
                  <p class="text-2xl text-gray-600 dark:text-gray-400 mb-6">
                    {{ translate('partners.zeibaDescription') }}
                  </p>
                  
                  <!-- Specialties -->
                  <div class="mb-6">
                    <h5 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      {{ translate('partners.specialties') }}
                    </h5>
                    <div class="flex flex-wrap gap-2 justify-center lg:justify-start">
                      <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {{ translate('partners.realEstate') }}
                      </span>
                      <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {{ translate('partners.construction') }}
                      </span>
                      <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {{ translate('partners.gamblingRegulations') }}
                      </span>
                      <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {{ translate('partners.legalAdvice') }}
                      </span>
                    </div>
                  </div>

                  <!-- Contact Button -->
                  <a 
                    href="https://ziebapartners.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    {{ translate('partners.learnMore') }}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <!-- Banking Partners (Coming Soon) -->
          <section>
            <div class="text-center mb-8">
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('partners.bankingPartners') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('partners.bankingDescription') }}
              </p>
            </div>

            <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl p-8 md:p-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div class="text-center">
                <div class="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  {{ translate('partners.comingSoon') }}
                </h4>
                <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {{ translate('partners.bankingComingSoon') }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Trust & Security Section -->
        <section class="mt-20">
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
            <div class="text-center">
              <h2 class="text-3xl md:text-4xl font-bold mb-6">
                {{ translate('partners.trustSecurity') }}
              </h2>
              <p class="text-xl mb-8 max-w-3xl mx-auto">
                {{ translate('partners.trustDescription') }}
              </p>
              
              <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div class="text-center">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-semibold mb-2">{{ translate('partners.legalCompliance') }}</h3>
                  <p class="text-blue-100">{{ translate('partners.legalComplianceDesc') }}</p>
                </div>
                
                <div class="text-center">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-semibold mb-2">{{ translate('partners.financialSecurity') }}</h3>
                  <p class="text-blue-100">{{ translate('partners.financialSecurityDesc') }}</p>
                </div>
                
                <div class="text-center">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-semibold mb-2">{{ translate('partners.expertise') }}</h3>
                  <p class="text-blue-100">{{ translate('partners.expertiseDesc') }}</p>
                </div>
              </div>
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
export class PartnersPageComponent {
  private translationService = inject(TranslationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
