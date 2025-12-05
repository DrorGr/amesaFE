import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { HouseGridComponent } from '../house-grid/house-grid.component';

@Component({
  selector: 'app-lottery-dashboard',
  standalone: true,
  imports: [CommonModule, HouseGridComponent],
  template: `
    <main class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <header class="mb-6">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('nav.lotteries') }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.welcome) }}
          </p>
        </header>

        <!-- House Grid - All Lottery Houses -->
        <div class="mb-8">
          <app-house-grid></app-house-grid>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class LotteryDashboardComponent {
  private translationService = inject(TranslationService);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

