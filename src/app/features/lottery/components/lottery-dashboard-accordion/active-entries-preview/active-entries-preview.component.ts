import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EntryCardComponent } from '../entry-card/entry-card.component';
import { LotteryTicketDto } from '@core/models/house.model';
import { TranslationService } from '@core/services/translation.service';

/**
 * ActiveEntriesPreviewComponent
 * Displays active entries with EntryCardComponent and View All link
 */
@Component({
  selector: 'app-active-entries-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, EntryCardComponent],
  template: `
    <div class="active-entries-preview" role="region" [attr.aria-label]="getTranslation('lottery.statistics.activeEntries')">
      <div class="active-entries-header">
        <h3 class="active-entries-title">{{ getTranslation('lottery.statistics.activeEntries') }}</h3>
        <a 
          *ngIf="entries.length > previewLimit"
          routerLink="/entries"
          class="view-all-link"
          [attr.aria-label]="getTranslation('lottery.dashboard.viewAll') + ' ' + getTranslation('lottery.statistics.activeEntries')"
        >
          {{ getTranslation('lottery.dashboard.viewAll') }} ({{ entries.length }})
        </a>
      </div>
      <div class="active-entries-list" *ngIf="entries.length > 0; else emptyState">
        <app-entry-card
          *ngFor="let entry of displayedEntries; trackBy: trackByTicketId"
          [entry]="entry"
          [clickable]="true"
          (clicked)="onEntryClick($event)"
        ></app-entry-card>
      </div>
      <ng-template #emptyState>
        <div class="empty-state">
          <p>{{ getTranslation('lottery.dashboard.noActiveEntries') }}</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .active-entries-preview {
      margin-bottom: 1.5rem;
    }

    .active-entries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .active-entries-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary, #333);
    }

    .view-all-link {
      color: var(--primary-color, #3b82f6);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .view-all-link:hover {
      color: var(--primary-color-hover, #2563eb);
      text-decoration: underline;
    }

    .active-entries-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }

    @media (prefers-color-scheme: dark) {
      .active-entries-title {
        color: #f9fafb;
      }

      .empty-state {
        color: #9ca3af;
      }
    }
  `]
})
export class ActiveEntriesPreviewComponent {
  @Input() entries: LotteryTicketDto[] = [];
  @Input() previewLimit: number = 5;
  @Output() entryClicked = new EventEmitter<LotteryTicketDto>();

  constructor(private translationService: TranslationService) {}

  get displayedEntries(): LotteryTicketDto[] {
    return this.entries.slice(0, this.previewLimit);
  }

  onEntryClick(entry: LotteryTicketDto): void {
    this.entryClicked.emit(entry);
  }

  trackByTicketId(index: number, entry: LotteryTicketDto): string {
    return entry.ticketNumber || index.toString();
  }

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

