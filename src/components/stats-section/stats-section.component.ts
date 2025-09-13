import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-16 md:py-16 py-8 transition-colors duration-300 overflow-hidden">
      <div class="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        <div class="flex animate-scroll-stats space-x-8 md:space-x-12">
          @for (stat of stats; track stat.labelKey) {
            <div class="flex-shrink-0 text-center min-w-[100px] md:min-w-[200px]">
              <div class="text-xl md:text-6xl font-black text-gradient mb-0.5 md:mb-4">
                {{ stat.value }}
              </div>
              <div class="text-gray-700 dark:text-gray-300 font-semibold text-xs md:text-lg leading-loose md:leading-tight">
                {{ getStatLabel(stat.labelKey) }}
              </div>
            </div>
          }
          <!-- Duplicate for seamless loop -->
          @for (stat of stats; track stat.labelKey + '-duplicate') {
            <div class="flex-shrink-0 text-center min-w-[100px] md:min-w-[200px]">
              <div class="text-xl md:text-6xl font-black text-gradient mb-0.5 md:mb-4">
                {{ stat.value }}
              </div>
              <div class="text-gray-700 dark:text-gray-300 font-semibold text-xs md:text-lg leading-loose md:leading-tight">
                {{ getStatLabel(stat.labelKey) }}
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @keyframes scroll-stats {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .animate-scroll-stats {
      animation: scroll-stats 8s linear infinite;
    }
    
    @media (max-width: 767px) {
      .animate-scroll-stats {
        animation: scroll-stats 3s linear infinite;
      }
    }
    
    .animate-scroll-stats:hover {
      animation-play-state: paused;
    }
  `]
})
export class StatsSectionComponent {
  private translationService = inject(TranslationService);

  stats = [
    { value: '1:2,500', labelKey: 'stats.oddsToWin' },
    { value: '€2.5M', labelKey: 'stats.currentPrizes' },
    { value: '12', labelKey: 'stats.activeLotteries' },
    { value: '98%', labelKey: 'stats.satisfaction' },
    { value: '500+', labelKey: 'stats.happyWinners' },
    { value: '€50M+', labelKey: 'stats.totalPrizes' }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getStatLabel(labelKey: string): string {
    return this.translate(labelKey);
  }
}