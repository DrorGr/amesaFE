import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          @for (stat of stats; track stat.label) {
            <div class="text-center p-6 bg-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 transform">
              <div class="text-4xl md:text-5xl font-black text-gradient mb-3">
                {{ stat.value }}
              </div>
              <div class="text-gray-700 font-semibold text-sm md:text-base">
                {{ getStatLabel(stat.labelKey) }}
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class StatsSectionComponent {
  private translationService = inject(TranslationService);

  stats = [
    { value: '142', labelKey: 'stats.happyWinners' },
    { value: '$24M', labelKey: 'stats.propertiesWon' },
    { value: '50+', labelKey: 'stats.activeLotteries' },
    { value: '99.8%', labelKey: 'stats.satisfactionRate' }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getStatLabel(labelKey: string): string {
    return this.translate(labelKey);
  }
}