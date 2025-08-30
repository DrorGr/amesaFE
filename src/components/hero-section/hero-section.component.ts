import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Win Your Dream Home
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Enter exclusive house lotteries and get the chance to win amazing properties at a fraction of their market value.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
              Browse Lotteries
            </button>
            <button class="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              How It Works
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {}