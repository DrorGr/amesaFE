import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { ConsolidatedHouseEntry } from '../consolidated-house-entry.model';

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
      [attr.aria-label]="getAriaLabel()">
      <div class="entry-card-layout">
        @if (group.houseImageUrl) {
          <img
            [src]="group.houseImageUrl"
            [alt]="group.houseTitle"
            class="entry-card-image"
            loading="lazy" />
        } @else {
          <div class="entry-card-image entry-card-image-placeholder" aria-hidden="true">🏠</div>
        }

        <div class="entry-card-content">
          <div class="entry-card-header">
            <h4 class="entry-card-title">{{ group.houseTitle }}</h4>
            <div class="entry-card-badges">
              <span class="entry-card-count">{{ ticketCountLabel }}</span>
              <span class="entry-card-status" [class]="statusClass">
                {{ getStatusText() }}
              </span>
            </div>
          </div>

          @if (group.location) {
            <p class="entry-card-location">{{ group.location }}</p>
          }

          <div class="entry-card-meta">
            @if (hasBedBathMeta) {
              <span>{{ bedBathLabel }}</span>
            }
            @if (group.propertyType) {
              <span>{{ group.propertyType }}</span>
            }
            @if (group.squareFeet) {
              <span>{{ squareFeetLabel }}</span>
            }
          </div>

          <div class="entry-card-body">
            @if (group.ticketPrice != null && group.ticketPrice > 0) {
              <div class="entry-card-field">
                <span class="entry-card-label">{{ getTranslation('common.price') || 'Ticket price' }}:</span>
                <span class="entry-card-value">{{ formatPrice(group.ticketPrice) }}</span>
              </div>
            }
            <div class="entry-card-field">
              <span class="entry-card-label">{{ getTranslation('lottery.entries.purchaseDate') }}:</span>
              <span class="entry-card-value">{{ formatDate(group.latestPurchaseDate) }}</span>
            </div>
            @if (group.drawDate || group.lotteryEndDate) {
              <div class="entry-card-field">
                <span class="entry-card-label">{{ drawLabel }}:</span>
                <span class="entry-card-value">{{ formatDate(group.drawDate || group.lotteryEndDate) }}</span>
              </div>
            }
            <div class="entry-card-field">
              <span class="entry-card-label">{{ totalSpentLabel }}:</span>
              <span class="entry-card-value">{{ formatPrice(group.totalSpent) }}</span>
            </div>
          </div>

          @if (group.ticketCount > 1) {
            <details class="entry-card-tickets" (click)="$event.stopPropagation()">
              <summary class="entry-card-tickets-summary">
                {{ ticketNumbersLabel }}
              </summary>
              <ul class="entry-card-ticket-list">
                @for (ticket of group.tickets; track ticket.ticketNumber) {
                  <li class="entry-card-ticket-item">{{ ticket.ticketNumber }}</li>
                }
              </ul>
            </details>
          } @else if (group.tickets[0]?.ticketNumber) {
            <p class="entry-card-single-ticket">
              <span class="entry-card-label">{{ getTranslation('lottery.entries.ticketNumber') }}:</span>
              <span class="entry-card-value">{{ group.tickets[0].ticketNumber }}</span>
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .entry-card {
      background: var(--entry-card-bg, #ffffff);
      border: 1px solid var(--entry-card-border, #e0e0e0);
      border-radius: 8px;
      padding: 0.875rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .entry-card.clickable {
      cursor: pointer;
    }

    .entry-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .entry-card.clickable:focus-visible {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .entry-card-layout {
      display: flex;
      gap: 0.875rem;
      align-items: flex-start;
    }

    .entry-card-image {
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 0.5rem;
      object-fit: cover;
      flex-shrink: 0;
    }

    .entry-card-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      font-size: 1.5rem;
    }

    .entry-card-content {
      flex: 1;
      min-width: 0;
    }

    .entry-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .entry-card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: var(--entry-card-title-color, #333);
      line-height: 1.3;
    }

    .entry-card-badges {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .entry-card-count {
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      background: #dbeafe;
      color: #1e40af;
      white-space: nowrap;
    }

    .entry-card-status {
      padding: 0.2rem 0.55rem;
      border-radius: 12px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
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

    .entry-card-location {
      margin: 0 0 0.35rem;
      font-size: 0.8125rem;
      color: var(--entry-card-label-color, #666);
    }

    .entry-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
      color: var(--entry-card-label-color, #666);
    }

    .entry-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .entry-card-field,
    .entry-card-single-ticket {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .entry-card-label {
      font-size: 0.8125rem;
      color: var(--entry-card-label-color, #666);
    }

    .entry-card-value {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--entry-card-value-color, #333);
      text-align: right;
    }

    .entry-card-tickets {
      margin-top: 0.5rem;
    }

    .entry-card-tickets-summary {
      font-size: 0.75rem;
      color: var(--primary-color, #3b82f6);
      cursor: pointer;
      list-style: none;
    }

    .entry-card-tickets-summary::-webkit-details-marker {
      display: none;
    }

    .entry-card-ticket-list {
      margin: 0.35rem 0 0;
      padding-left: 1rem;
      font-size: 0.75rem;
      color: var(--entry-card-value-color, #333);
    }

    .entry-card-ticket-item {
      margin-bottom: 0.15rem;
      font-family: ui-monospace, monospace;
    }

    :host-context(html.dark) {
      .entry-card {
        --entry-card-bg: #1f2937;
        --entry-card-border: #374151;
        --entry-card-title-color: #f9fafb;
        --entry-card-label-color: #e5e7eb;
        --entry-card-value-color: #f9fafb;
      }

      .entry-card-image-placeholder {
        background: #374151;
      }

      .entry-card-count {
        background: #1e3a8a;
        color: #bfdbfe;
      }

      .entry-card.clickable:hover {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
      }

      .status-expired {
        background: #374151;
        color: #d1d5db;
      }

      .entry-card-tickets-summary {
        color: #93c5fd;
      }
    }
  `]
})
export class EntryCardComponent {
  @Input({ required: true }) group!: ConsolidatedHouseEntry;
  @Input() clickable = true;
  @Output() clicked = new EventEmitter<ConsolidatedHouseEntry>();

  private translationService = inject(TranslationService);
  private localeService = inject(LocaleService);

  onClick(): void {
    if (this.clickable) {
      this.clicked.emit(this.group);
    }
  }

  get ticketCountLabel(): string {
    const template =
      this.getTranslation('lottery.entries.ticketCount') || '{count} tickets';
    return template.replace('{count}', String(this.group.ticketCount));
  }

  get ticketNumbersLabel(): string {
    const template =
      this.getTranslation('lottery.entries.viewTicketNumbers') || 'View ticket numbers';
    return template;
  }

  get totalSpentLabel(): string {
    return this.getTranslation('lottery.entries.totalSpent') || 'Total spent';
  }

  get drawLabel(): string {
    return this.getTranslation('lottery.entries.drawDate') || 'Draw date';
  }

  get hasBedBathMeta(): boolean {
    return (this.group.bedrooms ?? 0) > 0 || (this.group.bathrooms ?? 0) > 0;
  }

  get bedBathLabel(): string {
    const beds = this.group.bedrooms ?? 0;
    const baths = this.group.bathrooms ?? 0;
    const bedLabel = this.getTranslation('lottery.entries.bedrooms') || 'bed';
    const bathLabel = this.getTranslation('lottery.entries.bathrooms') || 'bath';
    return `${beds} ${bedLabel} · ${baths} ${bathLabel}`;
  }

  get squareFeetLabel(): string {
    const template = this.getTranslation('lottery.entries.squareFeet') || '{value} sq ft';
    return template.replace('{value}', String(this.group.squareFeet));
  }

  getStatusText(): string {
    const status = (this.group.status || '').toLowerCase();
    if (status === 'active') {
      return this.getTranslation('lottery.entries.statusActive');
    }
    if (status === 'winner' || this.group.isWinner) {
      return this.getTranslation('lottery.entries.statusWinner');
    }
    if (status === 'refunded') {
      return this.getTranslation('lottery.entries.statusRefunded');
    }
    return status;
  }

  get statusClass(): string {
    const status = (this.group.status || '').toLowerCase();
    if (status === 'active') return 'status-active';
    if (status === 'winner' || this.group.isWinner) return 'status-winner';
    if (status === 'refunded') return 'status-refunded';
    return 'status-expired';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return this.localeService.formatDate(d, 'medium');
    } catch {
      return 'Invalid Date';
    }
  }

  formatPrice(amount: number | undefined): string {
    if (amount == null) return 'N/A';
    return this.localeService.formatCurrency(amount);
  }

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }

  getAriaLabel(): string {
    return `${this.group.houseTitle}, ${this.ticketCountLabel}, ${this.getStatusText()}`;
  }
}
