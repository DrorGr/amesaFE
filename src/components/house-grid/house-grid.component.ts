import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotteryService } from '../../services/lottery.service';
import { HouseCardComponent } from '../../house-card/house-card.component';

@Component({
  selector: 'app-house-grid',
  standalone: true,
  imports: [CommonModule, HouseCardComponent],
  template: `
    <section class="bg-gray-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Active House Lotteries
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our selection of amazing properties and enter to win your dream home today.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (house of houses(); track house.id) {
            <app-house-card [house]="house"></app-house-card>
          }
        </div>

        @if (houses().length === 0) {
          <div class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Lotteries</h3>
            <p class="text-gray-600">Check back soon for new lottery opportunities!</p>
          </div>
        }
      </div>
    </section>
  `
})
export class HouseGridComponent {
  private lotteryService = inject(LotteryService);
  
  houses = this.lotteryService.getHouses();
}