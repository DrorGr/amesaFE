import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TopbarComponent } from './components/topbar/topbar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { AccessibilityWidgetComponent } from './components/accessibility-widget/accessibility-widget.component';
import { TranslationService } from './services/translation.service';
import { RouteLoadingService } from './services/route-loading.service';
// Services are available for dependency injection but not used directly in this component

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    LoadingComponent,
    ChatbotComponent,
    AccessibilityWidgetComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-500 ease-in-out">
      <app-topbar></app-topbar>
      
      <div class="transition-all duration-500 ease-in-out">
        @if (isLoading | async) {
          <app-loading></app-loading>
        } @else {
          <router-outlet></router-outlet>
        }
      </div>
      
      <footer class="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Logo, Description and Social Media -->
          <div class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mobile-footer-header">
            <div class="flex items-center gap-6 mobile-footer-logo-section">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="h-36 w-auto mobile-footer-logo">
              <p class="text-gray-300 text-2xl leading-relaxed mobile-footer-description">
                {{ translate('footer.description') }}
              </p>
            </div>
            <!-- Social Media Links -->
            <div class="flex items-center space-x-4 mobile-footer-social">
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.27 20.1H3.65V9.24h3.62V20.1zM5.47 7.76h-.03c-1.22 0-2-.83-2-1.87 0-1.06.8-1.87 2.05-1.87 1.24 0 2 .8 2.02 1.87 0 1.04-.78 1.87-2.05 1.87zM20.34 20.1h-3.63v-5.8c0-1.45-.52-2.45-1.83-2.45-1 0-1.6.67-1.87 1.32-.1.23-.11.55-.11.88v6.05H9.28s.05-9.82 0-10.84h3.63v1.54a3.6 3.6 0 0 1 3.26-1.8c2.37 0 4.15 1.55 4.15 4.9v6.2h.02z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-3.866 0-7-3.134-7-7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          
          
          <!-- Footer Links Grid -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6 mobile-footer-links">
            <!-- Community -->
            <div>
              <h4 class="font-semibold mb-3 text-white mobile-footer-section-heading">{{ translate('footer.community') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm mobile-footer-link-text">
                <li><button (click)="navigateToAbout()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.about') }}</button></li>
                <li><button (click)="navigateToSponsorship()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.makeSponsorship') }}</button></li>
                <li><button (click)="navigateToResponsibleGambling()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.responsibleGaming') }}</button></li>
              </ul>
            </div>
            
            <!-- Support -->
            <div>
              <h4 class="font-semibold mb-3 text-white mobile-footer-section-heading">{{ translate('footer.support') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm mobile-footer-link-text">
                <li><button (click)="navigateToHelp()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.helpCenter') }}</button></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.liveChat') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.contactUs') }}</a></li>
                <li><button (click)="navigateToFAQ()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.faq') }}</button></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.drawCalendar') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.branchMap') }}</a></li>
              </ul>
            </div>
            
            <!-- Legal -->
            <div>
              <h4 class="font-semibold mb-3 text-white mobile-footer-section-heading">{{ translate('footer.legal') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm mobile-footer-link-text">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.regulations') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.termsConditions') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.privacyPolicy') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.gdprInfo') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.news') }}</a></li>
              </ul>
            </div>
            
                <!-- Legal Partners -->
                <div>
                  <h4 class="font-semibold mb-3 text-white mobile-footer-section-heading">{{ translate('footer.legalPartners') }}</h4>
                  <div class="space-y-3">
                    <div>
                      <div class="text-gray-400 text-xs mb-1 mobile-footer-link-text">{{ translate('partners.legalPartner') }}</div>
                      <a href="https://ziebapartners.com" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-sm mobile-footer-link-text">
                        Zeiba & Partners
                      </a>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs mb-1 mobile-footer-link-text">{{ translate('partners.accountingPartner') }}</div>
                      <a href="https://pik.tax/kontakt" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-sm mobile-footer-link-text">
                        PiK Podatki i Księgowość Sp. z o.o
                      </a>
                    </div>
                  </div>
                </div>
            
            <!-- App Download -->
            <div>
              <h4 class="font-semibold mb-3 text-white mobile-footer-section-heading">{{ translate('footer.comingSoon') }}</h4>
              <div class="flex flex-col space-y-2">
                <div class="bg-gray-600 rounded-lg px-4 py-3 flex items-center space-x-3 opacity-60 cursor-not-allowed">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div class="text-left">
                    <div class="text-xs text-gray-300">Coming soon on</div>
                    <div class="text-sm font-semibold text-white">App Store</div>
                  </div>
                </div>
                <div class="bg-gray-600 rounded-lg px-4 py-3 flex items-center space-x-3 opacity-60 cursor-not-allowed">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div class="text-left">
                    <div class="text-xs text-gray-300">Coming soon on</div>
                    <div class="text-sm font-semibold text-white">Google Play</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </footer>
      
      <!-- Fixed Chatbot -->
      <app-chatbot></app-chatbot>
      
      <!-- Fixed Accessibility Widget -->
      <app-accessibility-widget></app-accessibility-widget>
      
    </div>
  `,
  styles: []
})
export class AppComponent {
  private translationService = inject(TranslationService);
  private routeLoadingService = inject(RouteLoadingService);
  private router = inject(Router);
  // Services are injected but not used directly in this component
  // They are available for dependency injection in child components

  isLoading = this.routeLoadingService.loading$;

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // Navigation methods
  navigateToAbout() {
    this.router.navigate(['/about']);
  }

  navigateToSponsorship() {
    this.router.navigate(['/sponsorship']);
  }

  navigateToPartners() {
    this.router.navigate(['/partners']);
  }

  navigateToResponsibleGambling() {
    this.router.navigate(['/responsible-gambling']);
  }

  navigateToHelp() {
    this.router.navigate(['/help-center']);
  }

  navigateToFAQ() {
    this.router.navigate(['/faq']);
  }
}
