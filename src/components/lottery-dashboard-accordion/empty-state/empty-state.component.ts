import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';

/**
 * EmptyStateComponent
 * Displays empty state messages for no entries, new user welcome, error states
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state" [class]="type" role="status" [attr.aria-live]="ariaLive">
      <div class="empty-state-icon" *ngIf="icon">{{ icon }}</div>
      <h3 class="empty-state-title" *ngIf="title">{{ title }}</h3>
      <p class="empty-state-message" *ngIf="message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary, #333);
    }

    .empty-state-message {
      font-size: 0.875rem;
      margin: 0;
      color: var(--text-secondary, #666);
    }

    .empty-state.error {
      color: #ef4444;
    }

    .empty-state.welcome {
      background: var(--welcome-bg, #f0f9ff);
      border-radius: 8px;
      border: 1px solid var(--welcome-border, #bae6fd);
    }

    @media (prefers-color-scheme: dark) {
      .empty-state {
        color: #9ca3af;
      }

      .empty-state-title {
        color: #f9fafb;
      }

      .empty-state.welcome {
        --welcome-bg: #1e3a5f;
        --welcome-border: #3b82f6;
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() type: 'default' | 'error' | 'welcome' = 'default';
  @Input() icon?: string;
  @Input() title?: string;
  @Input() message?: string;
  @Input() ariaLive: 'polite' | 'assertive' | 'off' = 'polite';

  constructor(private translationService: TranslationService) {}

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

