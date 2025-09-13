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
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-12 w-auto mb-4">
              <p class="text-gray-300 leading-relaxed">
                {{ translate('footer.description') }}
              </p>
              <div class="mt-6">
                <p class="text-blue-400 font-semibold mb-2">{{ translate('footer.supportCause') }}</p>
                <p class="text-gray-300 text-sm">{{ translate('footer.supportDescription') }}</p>
              
              <!-- App Store Links -->
              <div class="mt-6">
                <p class="text-white font-semibold mb-3">{{ translate('footer.downloadApp') }}</p>
                <div class="flex space-x-2">
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
            </div>
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
                      <span class="text-white text-xs font-bold">⚖️</span>
                    </div>
                    <div class="text-sm">
                      <div class="text-white font-medium">{{ translate('footer.attorneyOffice') }}</div>
                      <div class="text-gray-400 text-xs">{{ translate('footer.legalSupport') }}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span class="text-white text-xs font-bold">💰</span>
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
          <div class="border-t border-gray-700 mt-12 pt-8">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <p class="text-sm text-gray-400 mb-4 md:mb-0">{{ translate('footer.copyright') }}</p>
              <div class="flex space-x-4">
                <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
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