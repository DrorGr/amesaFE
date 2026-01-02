import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserGamificationDto, AchievementDto } from '@core/interfaces/lottery.interface';
import { TranslationService } from '@core/services/translation.service';

/**
 * GamificationPanelComponent
 * Displays level, achievements, and streak information
 */
@Component({
  selector: 'app-gamification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gamification-panel" role="region" [attr.aria-label]="getTranslation('lottery.gamification.achievements')">
      <h3 class="gamification-title">{{ getTranslation('lottery.gamification.achievements') }}</h3>
      
      <div class="gamification-stats" *ngIf="gamification">
        <div class="gamification-stat">
          <span class="gamification-stat-label">{{ getTranslation('lottery.gamification.level') }}</span>
          <span class="gamification-stat-value">{{ gamification.currentLevel }}</span>
        </div>
        <div class="gamification-stat">
          <span class="gamification-stat-label">{{ getTranslation('lottery.gamification.points') }}</span>
          <span class="gamification-stat-value">{{ formatNumber(gamification.totalPoints) }}</span>
        </div>
        <div class="gamification-stat">
          <span class="gamification-stat-label">{{ getTranslation('lottery.gamification.tier') }}</span>
          <span class="gamification-stat-value tier" [class]="getTierClass(gamification.currentTier)">
            {{ getTierTranslation(gamification.currentTier) }}
          </span>
        </div>
        <div class="gamification-stat">
          <span class="gamification-stat-label">{{ getTranslation('lottery.gamification.streak') }}</span>
          <span class="gamification-stat-value">
            {{ gamification.currentStreak }} / {{ gamification.longestStreak }}
          </span>
        </div>
      </div>

      <div class="gamification-achievements" *ngIf="gamification && gamification.recentAchievements.length > 0">
        <h4 class="achievements-title">{{ getTranslation('lottery.gamification.recentAchievements') }}</h4>
        <div class="achievements-list">
          <div 
            *ngFor="let achievement of gamification.recentAchievements; trackBy: trackByAchievementId"
            class="achievement-item"
            [attr.aria-label]="achievement.name + ': ' + achievement.description"
          >
            <span class="achievement-icon" *ngIf="achievement.icon">{{ achievement.icon }}</span>
            <div class="achievement-details">
              <span class="achievement-name">{{ achievement.name }}</span>
              <span class="achievement-description">{{ achievement.description }}</span>
              <span class="achievement-date" *ngIf="achievement.unlockedAt">
                {{ formatDate(achievement.unlockedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="gamification-empty" *ngIf="!gamification || gamification.recentAchievements.length === 0">
        <p>{{ getTranslation('lottery.gamification.noAchievements') }}</p>
      </div>
    </div>
  `,
  styles: [`
    .gamification-panel {
      background: var(--gamification-panel-bg, #f9fafb);
      border: 1px solid var(--gamification-panel-border, #e0e0e0);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .gamification-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: var(--text-primary, #333);
    }

    .gamification-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .gamification-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .gamification-stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      font-weight: 500;
    }

    .gamification-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary, #333);
    }

    .gamification-stat-value.tier {
      font-size: 1rem;
      text-transform: capitalize;
    }

    .tier-bronze { color: #cd7f32; }
    .tier-silver { color: #c0c0c0; }
    .tier-gold { color: #ffd700; }
    .tier-platinum { color: #e5e4e2; }
    .tier-diamond { color: #b9f2ff; }

    .achievements-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      color: var(--text-primary, #333);
    }

    .achievements-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .achievement-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--achievement-item-bg, #ffffff);
      border: 1px solid var(--achievement-item-border, #e0e0e0);
      border-radius: 6px;
    }

    .achievement-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .achievement-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .achievement-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .achievement-description {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .achievement-date {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .gamification-empty {
      text-align: center;
      padding: 1rem;
      color: var(--text-secondary, #666);
    }

    @media (prefers-color-scheme: dark) {
      .gamification-panel {
        --gamification-panel-bg: #1f2937;
        --gamification-panel-border: #374151;
      }

      .gamification-title {
        color: #f9fafb;
      }

      .gamification-stat-value {
        color: #f9fafb;
      }

      .achievement-item {
        --achievement-item-bg: #374151;
        --achievement-item-border: #4b5563;
      }

      .achievement-name {
        color: #f9fafb;
      }
    }
  `]
})
export class GamificationPanelComponent {
  @Input() gamification?: UserGamificationDto | null;

  constructor(private translationService: TranslationService) {}

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(d);
    } catch {
      return 'Invalid Date';
    }
  }

  getTierClass(tier: string): string {
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('bronze')) return 'tier-bronze';
    if (tierLower.includes('silver')) return 'tier-silver';
    if (tierLower.includes('gold')) return 'tier-gold';
    if (tierLower.includes('platinum')) return 'tier-platinum';
    if (tierLower.includes('diamond')) return 'tier-diamond';
    return '';
  }

  getTierTranslation(tier: string): string {
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('bronze')) return this.getTranslation('lottery.gamification.tierBronze');
    if (tierLower.includes('silver')) return this.getTranslation('lottery.gamification.tierSilver');
    if (tierLower.includes('gold')) return this.getTranslation('lottery.gamification.tierGold');
    if (tierLower.includes('platinum')) return this.getTranslation('lottery.gamification.tierPlatinum');
    if (tierLower.includes('diamond')) return this.getTranslation('lottery.gamification.tierDiamond');
    return tier;
  }

  trackByAchievementId(index: number, achievement: AchievementDto): string {
    return achievement.id || index.toString();
  }

  getTranslation(key: string): string {
    return this.translationService.translate(key);
  }
}

