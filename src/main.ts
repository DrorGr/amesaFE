import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TopbarComponent } from './components/topbar/topbar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { RouteLoadingService } from './services/route-loading.service';
import { RoutePerformanceInterceptor } from './interceptors/route-performance.interceptor';
import { routes } from './app.routes';
import { provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { CustomPreloadingStrategy } from './app.preloading-strategy';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    LoadingComponent
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
          <div class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="flex items-center gap-6">
              <img 
                src="assets/AmesaNoBG.png" 
                alt="Amesa" 
                class="w-auto" 
                style="height: 7rem;">
              <p class="text-gray-300 text-lg leading-relaxed">
                {{ translate('footer.description') }}
              </p>
            </div>
            <!-- Social Media Links -->
            <div class="flex items-center space-x-4">
              <a href="#" class="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
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
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.017 0z"/>
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
          
          <div class="mb-4">
            <!-- Community Support Section -->
            <div>
              <h3 class="text-blue-400 font-semibold text-base mb-2">{{ translate('footer.supportCause') }}</h3>
              <p class="text-gray-300 text-sm leading-relaxed max-w-4xl">
                {{ translate('footer.supportDescription') }}
              </p>
            </div>
          </div>
          
          <!-- Footer Links Grid -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <!-- Community -->
            <div>
              <h4 class="font-semibold mb-3 text-white">{{ translate('footer.community') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm">
                <li><button (click)="navigateToAbout()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.about') }}</button></li>
                <li><button (click)="navigateToSponsorship()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.makeSponsorship') }}</button></li>
                <li><button (click)="navigateToPartners()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.partners') }}</button></li>
                <li><button (click)="navigateToResponsibleGambling()" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-left">{{ translate('footer.responsibleGaming') }}</button></li>
              </ul>
            </div>
            
            <!-- Support -->
            <div>
              <h4 class="font-semibold mb-3 text-white">{{ translate('footer.support') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm">
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
              <h4 class="font-semibold mb-3 text-white">{{ translate('footer.legal') }}</h4>
              <ul class="space-y-2 text-gray-300 text-sm">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.regulations') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.termsConditions') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.privacyPolicy') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.gdprInfo') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.news') }}</a></li>
              </ul>
            </div>
            
                <!-- Legal Partners -->
                <div>
                  <h4 class="font-semibold mb-3 text-white">{{ translate('footer.legalPartners') }}</h4>
                  <div class="space-y-3">
                    <div>
                      <div class="text-gray-400 text-xs mb-1">{{ translate('partners.legalPartner') }}</div>
                      <a href="https://ziebapartners.com" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-sm">
                        Zeiba & Partners
                      </a>
                    </div>
                    <div>
                      <div class="text-gray-400 text-xs mb-1">{{ translate('partners.accountingPartner') }}</div>
                      <a href="https://pik.tax/kontakt" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block text-sm">
                        PiK Podatki i Księgowość Sp. z o.o
                      </a>
                    </div>
                  </div>
                </div>
            
            <!-- App Download -->
            <div>
              <h4 class="font-semibold mb-3 text-white">{{ translate('footer.downloadApp') }}</h4>
              <div class="flex flex-col space-y-2">
                <a href="#" class="inline-block">
                  <div class="bg-black rounded-lg px-4 py-3 flex items-center space-x-3 hover:bg-gray-800 transition-colors duration-200">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <div class="text-left">
                      <div class="text-xs text-gray-300">Download on the</div>
                      <div class="text-sm font-semibold text-white">App Store</div>
                    </div>
                  </div>
                </a>
                <a href="#" class="inline-block">
                  <div class="bg-black rounded-lg px-4 py-3 flex items-center space-x-3 hover:bg-gray-800 transition-colors duration-200">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
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
          
          <!-- Copyright -->
          <div class="border-t border-gray-700 pt-4">
            <p class="text-center text-gray-400">{{ translate('footer.copyright') }}</p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class App {
  private translationService = inject(TranslationService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private routeLoadingService = inject(RouteLoadingService);
  
  isLoading = this.routeLoadingService.loading$;

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToAbout() {
    this.router.navigate(['/about']);
    this.scrollToTop();
  }

  navigateToSponsorship() {
    this.router.navigate(['/sponsorship']);
    this.scrollToTop();
  }

  navigateToFAQ() {
    this.router.navigate(['/faq']);
    this.scrollToTop();
  }

  navigateToHelp() {
    this.router.navigate(['/help']);
    this.scrollToTop();
  }

  navigateToPartners() {
    this.router.navigate(['/partners']);
    this.scrollToTop();
  }

  navigateToResponsibleGambling() {
    this.router.navigate(['/responsible-gambling']);
    this.scrollToTop();
  }

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

bootstrapApplication(App, {
  providers: [
    provideRouter(
      routes,
      withPreloading(CustomPreloadingStrategy),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    RoutePerformanceInterceptor
  ]
});