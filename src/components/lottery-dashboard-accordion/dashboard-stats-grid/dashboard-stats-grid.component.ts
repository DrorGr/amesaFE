import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { UserLotteryStats } from '../../../interfaces/lottery.interface';
import { TranslationService } from '../../../services/translation.service';

/**
 * DashboardStatsGridComponent
 * Displays 4 stat cards using StatCardComponent
 */
@Component({
  selector: 'app-dashboard-stats-grid',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="stats-grid" role="region" [attr.aria-label]="getTranslation('lottery.statistics.title')">
      <app-stat-card
        [label]="getTranslation('lottery.statistics.totalEntries')"
        [value]="stats?.totalEntries || 0"
        [format]="'number'"
        [theme]="'primary'"
        [icon]="'📊'"
        [ariaLabel]="getTranslation('lottery.statistics.totalEntries') + ': ' + (stats?.totalEntries || 0)"
      ></app-stat-card>
      
      <app-stat-card
        [label]="getTranslation('lottery.statistics.activeEntries')"
        [value]="stats?.activeEntries || 0"
        [format]="'number'"
        [theme]="'success'"
        [icon]="'🎫'"
        [ariaLabel]="getTranslation('lottery.statistics.activeEntries') + ': ' + (stats?.activeEntries || 0)"
      ></app-stat-card>
      
      <app-stat-card
        [label]="getTranslation('lottery.statistics.totalWins')"
        [value]="stats?.totalWins || 0"
        [format]="'number'"
        [theme]="'info'"
        [icon]="'🏆'"
        [ariaLabel]="getTranslation('lottery.statistics.totalWins') + ': ' + (stats?.totalWins || 0)"
      ></app-stat-card>
      
      <app-stat-card
        [label]="getTranslation('lottery.statistics.winRate')"
        [value]="(stats?.winRate || 0) * 100"
        [format]="'percentage'"
        [theme]="'warning'"
        [icon]="'📈'"
        [ariaLabel]="getTranslation('lottery.statistics.winRate') + ': ' + ((stats?.winRate || 0) * 100).toFixed(1) + '%'"
      ></app-stat-card>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardStatsGridComponent {
  @Input() stats?: UserLotteryStats | null;

  constructor(private translationService: TranslationService) {}

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

