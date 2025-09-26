import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-help-center-page',
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
              alt="Help Center" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('help.heroTitle') }}
              </h1>
              <p class="text-lg md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('help.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- How Can We Help Section -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('help.howCanWeHelp') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('help.howCanWeHelpDesc') }}
            </p>
          </div>
        </section>

        <!-- Quick Support Options -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {{ translate('help.quickSupportOptions') }}
            </h2>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- FAQ Link -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 text-center">
              <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('help.faqs') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ translate('help.faqsDesc') }}
              </p>
              <button 
                (click)="navigateToFAQ()"
                class="btn-primary w-full">
                {{ translate('help.visitFAQ') }}
              </button>
            </div>

            <!-- Email Support -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 text-center">
              <div class="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('help.emailUs') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ translate('help.emailUsDesc') }}
              </p>
              <a 
                href="mailto:support@amesa-group.com"
                class="btn-primary w-full inline-block text-center">
                {{ translate('help.sendEmail') }}
              </a>
            </div>

            <!-- Phone Support -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 text-center">
              <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('help.callUs') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ translate('help.callUsDesc') }}
              </p>
              <a 
                href="tel:+1234567890"
                class="btn-primary w-full inline-block text-center">
                {{ translate('help.callNow') }}
              </a>
            </div>
          </div>
        </section>

        <!-- Topics We Cover -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {{ translate('help.topicsWeCover') }}
            </h2>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <!-- Responsible Gambling -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span class="text-2xl">🎲</span>
                </div>
                <h3 class="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {{ translate('help.responsibleGambling') }}
                </h3>
              </div>
              <p class="text-blue-700 dark:text-blue-300">
                {{ translate('help.responsibleGamblingDesc') }}
              </p>
            </div>

            <!-- Payments & Withdrawals -->
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <span class="text-2xl">💳</span>
                </div>
                <h3 class="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                  {{ translate('help.paymentsWithdrawals') }}
                </h3>
              </div>
              <p class="text-emerald-700 dark:text-emerald-300">
                {{ translate('help.paymentsWithdrawalsDesc') }}
              </p>
            </div>

            <!-- Technical Support -->
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span class="text-2xl">🧑‍💻</span>
                </div>
                <h3 class="text-xl font-bold text-orange-800 dark:text-orange-200">
                  {{ translate('help.technicalSupport') }}
                </h3>
              </div>
              <p class="text-orange-700 dark:text-orange-300">
                {{ translate('help.technicalSupportDesc') }}
              </p>
            </div>

            <!-- Your Account -->
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span class="text-2xl">👤</span>
                </div>
                <h3 class="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {{ translate('help.yourAccount') }}
                </h3>
              </div>
              <p class="text-purple-700 dark:text-purple-300">
                {{ translate('help.yourAccountDesc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Our Commitment -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {{ translate('help.ourCommitment') }}
            </h2>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Fast Response -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('help.fastResponse') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ translate('help.fastResponseDesc') }}
              </p>
            </div>

            <!-- Friendly & Professional -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('help.friendlyProfessional') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ translate('help.friendlyProfessionalDesc') }}
              </p>
            </div>

            <!-- Safe & Private -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('help.safePrivate') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ translate('help.safePrivateDesc') }}
              </p>
            </div>

            <!-- Money Back Guarantee -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('help.moneyBackGuarantee') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ translate('help.moneyBackGuaranteeDesc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Can't Find What You're Looking For -->
        <section class="mb-16">
          <div class="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-8 md:p-12">
            <div class="text-center">
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('help.cantFindWhatYoureLookingFor') }}
              </h2>
              <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                {{ translate('help.cantFindDesc') }}
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="btn-primary text-lg px-8 py-4">
                  {{ translate('help.sendUsMessage') }}
                </button>
                <button 
                  (click)="navigateToFAQ()"
                  class="btn-outline text-lg px-8 py-4">
                  {{ translate('help.visitFAQSection') }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Contact Information -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('help.getInTouch') }}
            </h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">
              {{ translate('help.getInTouchDesc') }}
            </p>
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div class="text-center">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ translate('help.email') }}</h3>
                <p class="text-blue-100">support@amesa-group.com</p>
              </div>
              <div class="text-center">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ translate('help.phone') }}</h3>
                <p class="text-blue-100">+1 (234) 567-8900</p>
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
export class HelpCenterPageComponent {
  private translationService = inject(TranslationService);
  private navigationService = inject(NavigationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToFAQ() {
    this.navigationService.navigateTo('faq');
  }
}
