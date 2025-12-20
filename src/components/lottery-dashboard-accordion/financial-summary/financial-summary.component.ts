import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLotteryStats } from '../../../interfaces/lottery.interface';
import { TranslationService } from '../../../services/translation.service';

/**
 * FinancialSummaryComponent
 * Displays spending, winnings, net, averages, dates
 */
@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="financial-summary" role="region" [attr.aria-label]="getTranslation('lottery.dashboard.financialOverview')">
      <h3 class="financial-summary-title">{{ getTranslation('lottery.dashboard.financialOverview') }}</h3>
      <div class="financial-summary-grid">
        <div class="financial-item">
          <span class="financial-label">{{ getTranslation('lottery.statistics.totalSpending') }}</span>
          <span class="financial-value spending">{{ formatCurrency(stats?.totalSpending || 0) }}</span>
        </div>
        <div class="financial-item">
          <span class="financial-label">{{ getTranslation('lottery.statistics.totalWinnings') }}</span>
          <span class="financial-value winnings">{{ formatCurrency(stats?.totalWinnings || 0) }}</span>
        </div>
        <div class="financial-item net">
          <span class="financial-label">{{ getTranslation('lottery.statistics.net') }}</span>
          <span class="financial-value" [class.positive]="netValue >= 0" [class.negative]="netValue < 0">
            {{ formatCurrency(netValue) }}
          </span>
        </div>
        <div class="financial-item">
          <span class="financial-label">{{ getTranslation('lottery.statistics.averageSpending') }}</span>
          <span class="financial-value">{{ formatCurrency(stats?.averageSpendingPerEntry || 0) }}</span>
        </div>
      </div>
      <div class="financial-dates" *ngIf="stats?.lastEntryDate">
        <div class="financial-date-item">
          <span class="financial-date-label">{{ getTranslation('lottery.statistics.lastEntry') }}:</span>
          <span class="financial-date-value">{{ stats && stats.lastEntryDate ? formatDate(stats.lastEntryDate) : '' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .financial-summary {
      background: var(--financial-summary-bg, #f9fafb);
      border: 1px solid var(--financial-summary-border, #e0e0e0);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .financial-summary-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: var(--text-primary, #333);
    }

    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .financial-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .financial-item.net {
      grid-column: span 2;
      padding-top: 1rem;
      border-top: 2px solid var(--financial-summary-border, #e0e0e0);
    }

    .financial-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      font-weight: 500;
    }

    .financial-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary, #333);
    }

    .financial-value.spending {
      color: #ef4444;
    }

    .financial-value.winnings {
      color: #10b981;
    }

    .financial-value.positive {
      color: #10b981;
    }

    .financial-value.negative {
      color: #ef4444;
    }

    .financial-dates {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--financial-summary-border, #e0e0e0);
    }

    .financial-date-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .financial-date-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .financial-date-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    @media (prefers-color-scheme: dark) {
      .financial-summary {
        --financial-summary-bg: #1f2937;
        --financial-summary-border: #374151;
      }

      .financial-summary-title {
        color: #f9fafb;
      }

      .financial-value {
        color: #f9fafb;
      }

      .financial-date-value {
        color: #f9fafb;
      }
    }
  `]
})
export class FinancialSummaryComponent {
  @Input() stats?: UserLotteryStats | null;

  constructor(private translationService: TranslationService) {}

  get netValue(): number {
    return (this.stats?.totalWinnings || 0) - (this.stats?.totalSpending || 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: string | Date | undefined | null): string {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(d);
    } catch {
      return 'Invalid Date';
    }
  }

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

