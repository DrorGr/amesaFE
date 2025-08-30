import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { HouseGridComponent } from './components/house-grid/house-grid.component';
import { StatsSectionComponent } from './components/stats-section/stats-section.component';

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
    <div class="min-h-screen bg-gray-50">
      <app-topbar></app-topbar>
      <main>
        <app-hero-section></app-hero-section>
        <app-stats-section></app-stats-section>
        <app-house-grid></app-house-grid>
      </main>
      
      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 class="text-xl font-bold mb-4">HomeLotto</h3>
              <p class="text-gray-400">
                Your trusted platform for house lotteries. Win your dream home today.
              </p>
            </div>
            <div>
              <h4 class="font-semibold mb-4">Quick Links</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="#" class="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Winners Gallery</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-4">Support</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Live Chat</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 HomeLotto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class App {}

bootstrapApplication(App);