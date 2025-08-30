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
                Your trusted platform for house lotteries. Win your dream home today.
              </p>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">Quick Links</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">How It Works</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Winners Gallery</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Terms & Conditions</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold mb-6 text-white">Support</h4>
              <ul class="space-y-3 text-gray-300">
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Help Center</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Live Chat</a></li>
                <li><a href="#" class="hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform inline-block">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p class="text-sm">&copy; 2025 HomeLotto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class App {}

bootstrapApplication(App);