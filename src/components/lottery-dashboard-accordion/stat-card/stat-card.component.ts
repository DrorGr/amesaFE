import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * StatCardComponent
 * Reusable stat card component with icon, label, value, color themes, and trend indicators
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class]="themeClass" [attr.aria-label]="ariaLabel">
      <div class="stat-card-header">
        <div class="stat-card-icon" *ngIf="icon" [innerHTML]="icon"></div>
        <div class="stat-card-label">{{ label }}</div>
      </div>
      <div class="stat-card-value">{{ formattedValue }}</div>
      <div class="stat-card-trend" *ngIf="trend !== undefined">
        <span [class]="trendClass">
          <span *ngIf="trend > 0">↑</span>
          <span *ngIf="trend < 0">↓</span>
          <span *ngIf="trend === 0">→</span>
          {{ trendText }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--stat-card-bg, #ffffff);
      border: 1px solid var(--stat-card-border, #e0e0e0);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-card-icon {
      font-size: 1.25rem;
      opacity: 0.7;
    }

    .stat-card-label {
      font-size: 0.875rem;
      color: var(--stat-card-label-color, #666);
      font-weight: 500;
    }

    .stat-card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--stat-card-value-color, #333);
    }

    .stat-card-trend {
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .trend-up {
      color: #10b981;
    }

    .trend-down {
      color: #ef4444;
    }

    .trend-neutral {
      color: #6b7280;
    }

    /* Theme variants */
    .stat-card.primary {
      --stat-card-bg: #eff6ff;
      --stat-card-border: #3b82f6;
      --stat-card-value-color: #1e40af;
    }

    .stat-card.success {
      --stat-card-bg: #f0fdf4;
      --stat-card-border: #10b981;
      --stat-card-value-color: #047857;
    }

    .stat-card.warning {
      --stat-card-bg: #fffbeb;
      --stat-card-border: #f59e0b;
      --stat-card-value-color: #b45309;
    }

    .stat-card.danger {
      --stat-card-bg: #fef2f2;
      --stat-card-border: #ef4444;
      --stat-card-value-color: #991b1b;
    }

    .stat-card.info {
      --stat-card-bg: #f0f9ff;
      --stat-card-border: #06b6d4;
      --stat-card-value-color: #0e7490;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .stat-card {
        --stat-card-bg: #1f2937;
        --stat-card-border: #374151;
        --stat-card-label-color: #9ca3af;
        --stat-card-value-color: #f9fafb;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = 0;
  @Input() icon?: string;
  @Input() theme: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
  @Input() trend?: number; // Positive = up, negative = down, 0 = neutral
  @Input() trendText?: string;
  @Input() format: 'number' | 'currency' | 'percentage' | 'text' = 'number';
  @Input() ariaLabel?: string;

  get themeClass(): string {
    return this.theme !== 'default' ? this.theme : '';
  }

  get formattedValue(): string {
    if (this.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(this.value));
    } else if (this.format === 'percentage') {
      return `${Number(this.value).toFixed(1)}%`;
    } else if (this.format === 'number') {
      return new Intl.NumberFormat('en-US').format(Number(this.value));
    }
    return String(this.value);
  }

  get trendClass(): string {
    if (this.trend === undefined) return '';
    if (this.trend > 0) return 'trend-up';
    if (this.trend < 0) return 'trend-down';
    return 'trend-neutral';
  }
}




