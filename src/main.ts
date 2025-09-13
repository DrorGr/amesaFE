import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { HouseGridComponent } from './components/house-grid/house-grid.component';
import { StatsSectionComponent } from './components/stats-section/stats-section.component';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    HeroSectionComponent,
    HouseGridComponent,
    StatsSectionComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <app-topbar></app-topbar>
      <main>
        <app-hero-section></app-hero-section>
        <app-stats-section></app-stats-section>
        <app-house-grid></app-house-grid>
      </main>
      
      <footer class="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
          <!-- Logo and Description Section -->
          <div class="mb-12 text-center md:text-left md:col-span-4">
            <img 
              src="assets/AmesaNoBG.png" 
              alt="Amesa" 
              class="h-16 md:h-20 w-auto mx-auto md:mx-0 mb-4">
            <p class="text-gray-300 leading-relaxed max-w-2xl mx-auto md:mx-0">
              {{ translate('footer.description') }}
            </p>
            <div class="mt-6">
              <p class="text-blue-400 font-semibold mb-2">{{ translate('footer.supportCause') }}</p>
              <p class="text-gray-300 text-sm max-w-2xl mx-auto md:mx-0">{{ translate('footer.supportDescription') }}</p>
            </div>
          </div>
          
          
          <!-- Footer Links Grid -->
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.community') }}</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.about') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.makeSponsorship') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.partners') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.responsibleGaming') }}</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.support') }}</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.helpCenter') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.liveChat') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.contactUs') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.faq') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.drawCalendar') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.branchMap') }}</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.support') }}</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.helpCenter') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.liveChat') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.contactUs') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.faq') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.drawCalendar') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.branchMap') }}</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.downloadApp') }}</h4>
              <div class="flex flex-col space-y-2">
                <a href="#" class="inline-block">
                  <div class="bg-black rounded-lg px-3 py-2 flex items-center space-x-2">
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <div class="text-left">
                      <div class="text-xs text-gray-300">Download on the</div>
                      <div class="text-sm font-semibold text-white">App Store</div>
                    </div>
                  </div>
                </a>
                <a href="#" class="inline-block">
                  <div class="bg-black rounded-lg px-3 py-2 flex items-center space-x-2">
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div class="text-left">
                      <div class="text-xs text-gray-300">Get it on</div>
                      <div class="text-sm font-semibold text-white">Google Play</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.legal') }}</h4>
              <ul class="space-y-3 text-gray-300 mb-6">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.regulations') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.termsConditions') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.privacyPolicy') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.gdprInfo') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.news') }}</a></li>
              </ul>
              
              <!-- Legal Partners -->
              <div class="mb-6">
                <h5 class="font-semibold mb-3 text-white">{{ translate('footer.legalPartners') }}</h5>
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 2L3 7v11c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-7-5zM8 13l2-2 4 4-6 6-4-4 4-4z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div class="text-sm">
                      <div class="text-white font-medium">{{ translate('footer.attorneyOffice') }}</div>
                      <div class="text-gray-400 text-xs">{{ translate('footer.legalSupport') }}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8.070 8.686 8.433 7.418zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.364.589 0 .832-.155.103-.346.196-.567.267z"/>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6.102 7.036 6.102 8c0 .964.5 1.766 1.222 2.246.135.09.288.171.448.245.18.083.389.179.627.291.18-.083.389-.179.627-.291.16-.074.313-.155.448-.245C10.898 9.766 11.398 8.964 11.398 8c0-.964-.5-1.766-1.222-2.246A4.535 4.535 0 009.5 5.092V5a1 1 0 011 0zm-1 4a3 3 0 100 6 3 3 0 000-6z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div class="text-sm">
                      <div class="text-white font-medium">{{ translate('footer.accountingPartner') }}</div>
                      <div class="text-gray-400 text-xs">{{ translate('footer.financialServices') }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </footer>
    </div>
  `
})
export class App {
  private translationService = inject(TranslationService);
  private themeService = inject(ThemeService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

bootstrapApplication(App);