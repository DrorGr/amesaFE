import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { LoggingService } from '../../services/logging.service';
import { LotteryTicketDto } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';

@Component({
  selector: 'app-lottery-dashboard-accordion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  animations: [
    trigger('slideDown', [
      state('false', style({
        maxHeight: '0px',
        opacity: 0,
        overflow: 'hidden',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        borderTopWidth: '0px'
      })),
      state('true', style({
        maxHeight: '2000px',
        opacity: 1,
        overflow: 'visible',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderTopWidth: '1px'
      })),
      transition('false => true', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ],
  template: `
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-20 left-0 right-0 z-[99]">
      <button
        (click)="toggleAccordion()"
        (keydown.enter)="toggleAccordion()"
        (keydown.space)="toggleAccordion(); $event.preventDefault()"
        [attr.aria-label]="isExpanded() ? 'Close dashboard' : 'Open dashboard'"
        [attr.aria-expanded]="isExpanded()"
        class="w-full px-4 py-3 flex items-center justify-center relative hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none">
        <div class="flex items-center gap-3 absolute left-4">
          @if (currentUser() && activeEntriesCount() > 0) {
            <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {{ activeEntriesCount() }}
            </span>
          }
        </div>
        <div class="flex items-center justify-center flex-1 relative">
          <span class="text-gray-700 dark:text-gray-300 font-semibold text-center">
            {{ translate('nav.lotteries') }}
          </span>
          <!-- Small close button at center middle (only when expanded) -->
          @if (isExpanded()) {
            <button
              (click)="toggleAccordion(); $event.stopPropagation()"
              (keydown.enter)="toggleAccordion(); $event.stopPropagation()"
              (keydown.space)="toggleAccordion(); $event.preventDefault(); $event.stopPropagation()"
              [attr.aria-label]="'Close dashboard'"
              class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none z-10 shadow-sm">
              <svg 
                class="w-3 h-3 text-gray-600 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          }
        </div>
        <svg 
          [class.rotate-180]="isExpanded()" 
          class="w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 ease-in-out absolute right-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      <div 
        id="dashboard-accordion-content"
        [@slideDown]="isExpanded().toString()"
        [attr.aria-hidden]="!isExpanded()"
        class="overflow-hidden border-t border-gray-200 dark:border-gray-700">
        <div aria-live="polite" aria-atomic="true">
          @if (!currentUser()) {
            <!-- Not logged in - show login prompt -->
            <div class="py-8 text-center">
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ translate('lottery.dashboard.loginRequired') || 'Please log in to view your lottery dashboard' }}
              </p>
              <button
                (click)="navigateToLogin()"
                (keydown.enter)="navigateToLogin()"
                (keydown.space)="navigateToLogin(); $event.preventDefault()"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none">
                {{ translate('auth.login') || 'Log In' }}
              </button>
            </div>
          } @else if (isLoading()) {
            <div class="flex items-center justify-center py-8" role="status" aria-busy="true">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-label="Loading dashboard data"></div>
            </div>
          } @else if (error()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4" role="alert">
              <p class="text-sm text-red-800 dark:text-red-300">
                {{ error() }}
              </p>
              <button
                (click)="loadDashboardData()"
                (keydown.enter)="loadDashboardData()"
                (keydown.space)="loadDashboardData(); $event.preventDefault()"
                class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none"
                aria-label="Retry loading dashboard data">
                {{ translate('common.retry') || 'Retry' }}
              </button>
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
              <div class="mb-4" aria-live="polite">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.activeEntries) }}
                </h3>
                <div class="space-y-2">
                  @for (entry of activeEntries().slice(0, 3); track entry.id) {
                    <div 
                      class="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      [routerLink]="['/houses', entry.houseId]"
                      [attr.aria-label]="'View house: ' + entry.houseTitle">
                      <p class="font-medium text-gray-900 dark:text-white truncate">{{ entry.houseTitle }}</p>
                      <p class="text-gray-600 dark:text-gray-400">#{{ entry.ticketNumber }}</p>
                    </div>
                  }
                </div>
              </div>
            }

          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    #dashboard-accordion-content {
      /* Animation controls visibility via maxHeight and overflow */
    }
  `]
})
export class LotteryDashboardAccordionComponent implements OnInit, OnDestroy {
  localeService = inject(LocaleService);
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private logger = inject(LoggingService);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  stats = this.lotteryService.getUserLotteryStats();
  activeEntries = this.lotteryService.getActiveEntries();
  isLoading = signal(false);
  isExpanded = signal(false); // Start closed by default
  error = signal<string | null>(null);
  
  activeEntriesCount = computed(() => this.activeEntries().length);

  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }

  toggleAccordion(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  async loadDashboardData(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      await firstValueFrom(this.lotteryService.getUserActiveEntries());
      await firstValueFrom(this.lotteryService.getLotteryAnalytics());
      this.error.set(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      this.error.set(
        this.translate('lottery.dashboard.loadError') || 
        'Unable to load dashboard data. Please try again.'
      );
      this.logger.error('Error loading dashboard data in accordion', { error }, 'LotteryDashboardAccordionComponent');
    } finally {
      this.isLoading.set(false);
    }
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

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}

