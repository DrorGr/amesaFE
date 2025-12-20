import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotteryTicketDto } from '../../../models/house.model';
import { TranslationService } from '../../../services/translation.service';

/**
 * EntryCardComponent
 * Displays house title, ticket number, dates, status badge, clickable
 */
@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="entry-card" 
      [class.clickable]="clickable"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick(); $event.preventDefault()"
      [attr.role]="clickable ? 'button' : null"
      [attr.tabindex]="clickable ? 0 : -1"
      [attr.aria-label]="getAriaLabel()"
    >
      <div class="entry-card-header">
        <h4 class="entry-card-title">{{ entry.houseTitle || 'Unknown House' }}</h4>
        <span class="entry-card-status" [class]="statusClass">
          {{ getStatusText() }}
        </span>
      </div>
      <div class="entry-card-body">
        <div class="entry-card-field">
          <span class="entry-card-label">{{ getTranslation('lottery.entries.ticketNumber') }}:</span>
          <span class="entry-card-value">{{ entry.ticketNumber }}</span>
        </div>
        <div class="entry-card-field">
          <span class="entry-card-label">{{ getTranslation('lottery.entries.purchaseDate') }}:</span>
          <span class="entry-card-value">{{ formatDate(entry.purchaseDate) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .entry-card {
      background: var(--entry-card-bg, #ffffff);
      border: 1px solid var(--entry-card-border, #e0e0e0);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .entry-card.clickable {
      cursor: pointer;
    }

    .entry-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .entry-card.clickable:focus {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
    }

    .entry-card.clickable:focus-visible {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .entry-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .entry-card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: var(--entry-card-title-color, #333);
      flex: 1;
    }

    .entry-card-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-winner {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-refunded {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-expired {
      background: #f3f4f6;
      color: #6b7280;
    }

    .entry-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .entry-card-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .entry-card-label {
      font-size: 0.875rem;
      color: var(--entry-card-label-color, #666);
    }

    .entry-card-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--entry-card-value-color, #333);
    }

    @media (prefers-color-scheme: dark) {
      .entry-card {
        --entry-card-bg: #1f2937;
        --entry-card-border: #374151;
        --entry-card-title-color: #f9fafb;
        --entry-card-label-color: #9ca3af;
        --entry-card-value-color: #f9fafb;
      }
    }
  `]
})
export class EntryCardComponent {
  @Input() entry!: LotteryTicketDto;
  @Input() clickable: boolean = true;
  @Output() clicked = new EventEmitter<LotteryTicketDto>();

  constructor(private translationService: TranslationService) {}

  onClick(): void {
    if (this.clickable) {
      this.clicked.emit(this.entry);
    }
  }

  getStatusText(): string {
    const status = (this.entry.status || '').toLowerCase();
    if (status === 'active') {
      return this.getTranslation('lottery.entries.statusActive');
    } else if (status === 'winner' || this.entry.isWinner) {
      return this.getTranslation('lottery.entries.statusWinner');
    } else if (status === 'refunded') {
      return this.getTranslation('lottery.entries.statusRefunded');
    }
    return status;
  }

  get statusClass(): string {
    const status = (this.entry.status || '').toLowerCase();
    if (status === 'active') return 'status-active';
    if (status === 'winner' || this.entry.isWinner) return 'status-winner';
    if (status === 'refunded') return 'status-refunded';
    return 'status-expired';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
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

  getAriaLabel(): string {
    const status = this.getStatusText();
    return `${this.entry.houseTitle || 'Unknown House'}, ${this.getTranslation('lottery.entries.ticketNumber')}: ${this.entry.ticketNumber}, ${status}`;
  }
}

