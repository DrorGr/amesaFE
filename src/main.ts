import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { HouseGridComponent } from './components/house-grid/house-grid.component';
import { StatsSectionComponent } from './components/stats-section/stats-section.component';
import { TranslationService } from './services/translation.service';

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
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <app-topbar></app-topbar>
      <main>
        <app-hero-section></app-hero-section>
        <app-stats-section></app-stats-section>
        <app-house-grid></app-house-grid>
      </main>
      
      <!-- Footer -->
      <footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 class="text-2xl font-bold mb-4 text-gradient">HomeLotto</h3>
              <p class="text-gray-300 leading-relaxed">
                {{ translate('footer.description') }}
              </p>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.quickLinks') }}</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('nav.howItWorks') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.winnersGallery') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.termsConditions') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.contactUs') }}</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">{{ translate('footer.support') }}</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.helpCenter') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.liveChat') }}</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">{{ translate('footer.privacyPolicy') }}</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p class="text-sm">{{ translate('footer.copyright') }}</p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class App {
  private translationService = inject(TranslationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

bootstrapApplication(App);