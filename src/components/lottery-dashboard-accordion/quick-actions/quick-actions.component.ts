import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../../services/translation.service';

/**
 * QuickActionsComponent
 * Navigation buttons for quick actions (View All Entries, History, Favorites, etc.)
 */
@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="quick-actions" role="navigation" [attr.aria-label]="getTranslation('lottery.dashboard.quickActions')">
      <h3 class="quick-actions-title">{{ getTranslation('lottery.dashboard.quickActions') }}</h3>
      <div class="quick-actions-grid">
        <a 
          routerLink="/entries"
          class="quick-action-button"
          [attr.aria-label]="getTranslation('lottery.entries.active')"
        >
          <span class="quick-action-icon">🎫</span>
          <span class="quick-action-label">{{ getTranslation('lottery.entries.active') }}</span>
        </a>
        <a 
          routerLink="/entries/history"
          class="quick-action-button"
          [attr.aria-label]="getTranslation('lottery.entries.history')"
        >
          <span class="quick-action-icon">📜</span>
          <span class="quick-action-label">{{ getTranslation('lottery.entries.history') }}</span>
        </a>
        <a 
          routerLink="/favorites"
          class="quick-action-button"
          [attr.aria-label]="getTranslation('lottery.favorites.title')"
        >
          <span class="quick-action-icon">⭐</span>
          <span class="quick-action-label">{{ getTranslation('lottery.favorites.title') }}</span>
        </a>
        <a 
          routerLink="/statistics"
          class="quick-action-button"
          [attr.aria-label]="getTranslation('lottery.statistics.title')"
        >
          <span class="quick-action-icon">📊</span>
          <span class="quick-action-label">{{ getTranslation('lottery.statistics.title') }}</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .quick-actions {
      margin-bottom: 1.5rem;
    }

    .quick-actions-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: var(--text-primary, #333);
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .quick-action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--quick-action-bg, #f9fafb);
      border: 1px solid var(--quick-action-border, #e0e0e0);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-primary, #333);
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .quick-action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: var(--quick-action-bg-hover, #ffffff);
    }

    .quick-action-button:focus {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
    }

    .quick-action-icon {
      font-size: 1.5rem;
    }

    .quick-action-label {
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
    }

    @media (prefers-color-scheme: dark) {
      .quick-actions-title {
        color: #f9fafb;
      }

      .quick-action-button {
        --quick-action-bg: #1f2937;
        --quick-action-border: #374151;
        color: #f9fafb;
      }

      .quick-action-button:hover {
        --quick-action-bg-hover: #374151;
      }
    }
  `]
})
export class QuickActionsComponent {
  constructor(private translationService: TranslationService) {}

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

