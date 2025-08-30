import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="gradient-hero text-white relative overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 bg-black opacity-10"></div>
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-10 left-10 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="hero-title font-black mb-8 text-balance animate-fadeIn">
            Win Your Dream Home
          </h1>
          <p class="hero-subtitle mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed animate-fadeIn text-balance">
            Enter exclusive house lotteries and get the chance to win amazing properties at a fraction of their market value.
          </p>
          <div class="flex flex-col sm:flex-row gap-6 justify-center animate-fadeIn">
            <button class="btn-secondary text-lg px-10 py-4">
              Browse Lotteries
            </button>
            <button class="btn-outline text-lg px-10 py-4">
              How It Works
            </button>
          </div>
          
          <!-- Trust indicators -->
          <div class="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-80">
            <div class="text-center">
              <div class="text-2xl font-bold">142</div>
              <div class="text-sm text-blue-200">Happy Winners</div>
            </div>
            <div class="hidden sm:block w-px h-12 bg-blue-300 opacity-30"></div>
            <div class="text-center">
              <div class="text-2xl font-bold">$24M</div>
              <div class="text-sm text-blue-200">Properties Won</div>
            </div>
            <div class="hidden sm:block w-px h-12 bg-blue-300 opacity-30"></div>
            <div class="text-center">
              <div class="text-2xl font-bold">99.8%</div>
              <div class="text-sm text-blue-200">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {}