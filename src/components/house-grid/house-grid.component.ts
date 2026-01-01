import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotteryService } from '../../services/lottery.service';
import { HouseCardComponent } from '../house-card/house-card.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-house-grid',
  standalone: true,
  imports: [CommonModule, HouseCardComponent],
  template: `
    <section class="bg-white dark:bg-gray-900 py-8 pb-16 transition-colors duration-300" style="overflow: visible;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="overflow: visible;">
        <div class="text-center mb-8">
          <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 text-balance">
            {{ translate('hero.title') }}
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 w-full">
          @for (house of houses(); track house.id) {
            <div class="w-full h-full block">
              <app-house-card [house]="house"></app-house-card>
            </div>
          }
        </div>

        @if (houses().length === 0) {
          <div class="text-center py-20" role="status" [attr.aria-live]="'polite'">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
              <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ translate('lottery.entries.empty') }}</h3>
            <p class="text-xl text-gray-600 dark:text-gray-300">{{ translate('lottery.entries.emptyDescription') }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
  `]
})
export class HouseGridComponent {
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  
  houses = this.lotteryService.getHouses();

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}