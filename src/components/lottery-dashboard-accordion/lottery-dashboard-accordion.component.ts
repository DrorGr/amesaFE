import { Component, inject, OnInit, OnDestroy, signal, computed, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { LotteryTicketDto } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';

@Component({
  selector: 'app-lottery-dashboard-accordion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (currentUser()) {
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <button 
          (click)="toggleAccordion()"
          (keydown.enter)="toggleAccordion()"
          (keydown.space)="toggleAccordion(); $event.preventDefault()"
          [attr.aria-label]="translate('nav.lotteries')"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'dashboard-accordion-content'"
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative focus:outline-none">
          <div class="flex items-center gap-3">
            <span class="text-gray-700 dark:text-gray-300 font-semibold">
              {{ translate('nav.lotteries') }}
            </span>
            @if (activeEntriesCount() > 0) {
              <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                {{ activeEntriesCount() }}
              </span>
            }
          </div>
          <svg 
            [class.rotate-180]="isExpanded()" 
            class="w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          id="dashboard-accordion-content"
          [class.max-h-0]="!isExpanded()"
          [class.max-h-[2000px]]="isExpanded()"
          [class.opacity-0]="!isExpanded()"
          [class.opacity-100]="isExpanded()"
          [attr.aria-hidden]="!isExpanded()"
          class="overflow-hidden transition-all duration-300 ease-in-out">
          <div class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            } @else {
              <!-- Statistics Section -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 pt-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.activeEntries) }}
                  </p>
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ stats()?.activeEntries || 0 }}
                  </p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <p class="text-xs text-green-600 dark:text-green-400 mb-1">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.totalEntries) }}
                  </p>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ stats()?.totalEntries || 0 }}
                  </p>
                </div>
                <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                  <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-1">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.totalWins) }}
                  </p>
                  <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {{ stats()?.totalWins || 0 }}
                  </p>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.winRate) }}
                  </p>
                  <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {{ getWinRate() }}%
                  </p>
                </div>
              </div>

              <!-- Active Entries Preview -->
              @if (activeEntries().length > 0) {
                <div class="mb-4">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.activeEntries) }}
                  </h3>
                  <div class="space-y-2">
                    @for (entry of activeEntries().slice(0, 3); track entry.id) {
                      <div 
                        class="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        [routerLink]="['/houses', entry.houseId]">
                        <p class="font-medium text-gray-900 dark:text-white truncate">{{ entry.houseTitle }}</p>
                        <p class="text-gray-600 dark:text-gray-400">#{{ entry.ticketNumber }}</p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- View Full Dashboard Link -->
              <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  (click)="navigateToDashboard()"
                  (keydown.enter)="navigateToDashboard()"
                  (keydown.space)="navigateToDashboard(); $event.preventDefault()"
                  class="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium focus:outline-none">
                  {{ translate('nav.viewFullDashboard') || 'View Full Dashboard' }} →
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LotteryDashboardAccordionComponent implements OnInit, OnDestroy {
  localeService = inject(LocaleService);
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  stats = this.lotteryService.getUserLotteryStats();
  activeEntries = this.lotteryService.getActiveEntries();
  isLoading = signal(false);
  isExpanded = signal(false);
  
  activeEntriesCount = computed(() => this.activeEntries().length);
  private autoExpandEffect?: EffectRef;

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Auto-expand if user has entries
    this.autoExpandEffect = effect(() => {
      if (this.activeEntries().length > 0 && !this.isExpanded()) {
        this.isExpanded.set(true);
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.autoExpandEffect) {
      this.autoExpandEffect.destroy();
      this.autoExpandEffect = undefined;
    }
  }

  async loadDashboardData(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.lotteryService.getUserActiveEntries().toPromise();
      await this.lotteryService.getLotteryAnalytics().toPromise();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAccordion(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getWinRate(): string {
    const stats = this.stats();
    if (!stats || stats.totalEntries === 0) {
      return '0';
    }
    return this.localeService.formatNumber((stats.winRate * 100) || 0, { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/lottery/dashboard']);
  }
}

