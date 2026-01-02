import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '@core/services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { LoggingService } from '@core/services/logging.service';
import { LotteryTicketDto } from '@core/models/house.model';
import { UserGamificationDto } from '@core/interfaces/lottery.interface';
import { LOTTERY_TRANSLATION_KEYS } from '@shared/constants/lottery-translation-keys';
import { DashboardStatsGridComponent } from './dashboard-stats-grid/dashboard-stats-grid.component';
import { GamificationPanelComponent } from './gamification-panel/gamification-panel.component';
import { FinancialSummaryComponent } from './financial-summary/financial-summary.component';
import { ActiveEntriesPreviewComponent } from './active-entries-preview/active-entries-preview.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';
import { EmptyStateComponent } from './empty-state/empty-state.component';

// Error types enum
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

@Component({
  selector: 'app-lottery-dashboard-accordion',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    DashboardStatsGridComponent,
    GamificationPanelComponent,
    FinancialSummaryComponent,
    ActiveEntriesPreviewComponent,
    QuickActionsComponent,
    EmptyStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance optimization
  animations: [
    trigger('slideDown', [
      state('false', style({
        height: '0px',
        maxHeight: '0px',
        opacity: 0,
        overflow: 'hidden',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
        borderTopWidth: '0px'
      })),
      state('true', style({
        height: '*',
        maxHeight: '2000px',
        opacity: 1,
        overflow: 'visible',
        paddingTop: '1rem',
        paddingBottom: '0px',
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
        (keydown.escape)="handleEscapeKey($event)"
        [attr.aria-label]="isExpanded() ? 'Close dashboard' : 'Open dashboard'"
        [attr.aria-expanded]="isExpanded()"
        [attr.aria-controls]="'dashboard-accordion-content'"
        [id]="'dashboard-accordion-toggle'"
        class="w-full px-4 py-3 flex items-center justify-center relative hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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
        [attr.aria-busy]="isLoading()"
        role="region"
        [attr.aria-label]="translate('lottery.dashboard.title')"
        class="overflow-hidden border-t border-gray-200 dark:border-gray-700"
        >
        <!-- Screen reader announcement region -->
        <div 
          #screenReaderAnnouncement
          aria-live="polite" 
          aria-atomic="true" 
          class="sr-only"
          style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">
        </div>
        
        <div aria-live="polite" aria-atomic="true" class="px-4" [attr.aria-busy]="isLoading()">
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
                [attr.aria-label]="'Navigate to login page'"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {{ translate('auth.login') || 'Log In' }}
              </button>
            </div>
          } @else if (isLoading()) {
            <!-- Skeleton loader for dashboard -->
            <div class="px-4 py-4" role="status" aria-busy="true" aria-live="polite">
              <!-- Stats skeleton - Match exact structure and colors -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 pt-4">
                @for (item of [1,2,3,4]; track item) {
                  <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 border border-gray-300 dark:border-gray-600 animate-pulse">
                    <!-- Label skeleton - text-xs size -->
                    <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-2/3"></div>
                    <!-- Value skeleton - text-2xl size -->
                    <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                }
              </div>
              <!-- Active Entries skeleton - Match exact structure -->
              <div class="mb-4">
                <!-- Heading skeleton -->
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3 animate-pulse"></div>
                <!-- Entries skeleton - space-y-2, p-2 -->
                <div class="space-y-2">
                  @for (item of [1,2,3]; track item) {
                    <div class="bg-gray-200 dark:bg-gray-700 rounded p-2 animate-pulse">
                      <!-- Title skeleton - font-medium, truncate -->
                      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-3/4"></div>
                      <!-- Ticket number skeleton - text-xs -->
                      <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    </div>
                  }
                </div>
              </div>
            </div>
          } @else if (error()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4" role="alert" [attr.aria-live]="'assertive'">
              <p class="text-sm text-red-800 dark:text-red-300 mb-2">
                {{ error() }}
              </p>
              @if (errorType() === 'AUTHENTICATION') {
                <button
                  (click)="handleAuthenticationError()"
                  (keydown.enter)="handleAuthenticationError()"
                  (keydown.space)="handleAuthenticationError(); $event.preventDefault()"
                  [attr.aria-label]="'Navigate to login page'"
                  class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">
                  {{ translate('auth.login') || 'Log In' }}
                </button>
              } @else {
                <div class="flex items-center gap-2">
                  <button
                    (click)="retryLoad()"
                    (keydown.enter)="retryLoad()"
                    (keydown.space)="retryLoad(); $event.preventDefault()"
                    [disabled]="isRetrying()"
                    [attr.aria-label]="'Retry loading dashboard data'"
                    class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded disabled:opacity-50">
                    {{ isRetrying() ? (translate('common.retrying') || 'Retrying...') : (translate('common.retry') || 'Retry') }}
                  </button>
                  @if (isRetrying()) {
                    <span class="text-xs text-red-600 dark:text-red-400" aria-live="polite">
                      ({{ retryCount() + 1 }}/{{ MAX_RETRIES }})
                    </span>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- Manual Refresh Button -->
            <div class="flex justify-end mb-4">
              <button
                (click)="refreshDashboard()"
                (keydown.enter)="refreshDashboard()"
                (keydown.space)="refreshDashboard(); $event.preventDefault()"
                [disabled]="isLoading()"
                [attr.aria-label]="'Refresh dashboard data'"
                [attr.aria-busy]="isLoading()"
                class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                🔄 {{ translate('common.refresh') || 'Refresh' }}
              </button>
            </div>

            <!-- Dashboard Stats Grid -->
            <app-dashboard-stats-grid [stats]="stats()"></app-dashboard-stats-grid>

            <!-- Gamification Panel -->
            @if (gamification()) {
              <app-gamification-panel [gamification]="gamification()"></app-gamification-panel>
            }

            <!-- Financial Summary -->
            <app-financial-summary [stats]="stats()"></app-financial-summary>

            <!-- Active Entries Preview -->
            <app-active-entries-preview
              [entries]="activeEntries()"
              [previewLimit]="5"
              (entryClicked)="onEntryClick($event)">
            </app-active-entries-preview>

            <!-- Quick Actions -->
            <app-quick-actions></app-quick-actions>

            <!-- Empty State (if no entries and no stats) -->
            @if (activeEntries().length === 0 && !stats()) {
              <app-empty-state
                type="welcome"
                icon="🎉"
                [title]="translate('lottery.dashboard.welcome')"
                [message]="translate('lottery.dashboard.noActiveEntries')">
              </app-empty-state>
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
  readonly MAX_RETRIES = 3; // Make available in template
  
  @ViewChild('screenReaderAnnouncement', { static: false }) screenReaderAnnouncement?: ElementRef<HTMLDivElement>;
  
  private destroy$ = new Subject<void>();
  private abortController: AbortController | null = null;
  private toggleDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly TOGGLE_DEBOUNCE_MS = 300; // Debounce rapid toggles
  retryCount = signal(0); // Make accessible in template
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in ms
  
  currentUser = this.authService.getCurrentUser();
  stats = this.lotteryService.getUserLotteryStats();
  activeEntries = this.lotteryService.getActiveEntries();
  gamification = signal<UserGamificationDto | null>(null);
  isLoading = signal(false);
  isExpanded = signal(false); // Start closed by default
  error = signal<string | null>(null);
  errorType = signal<ErrorType | null>(null);
  isRetrying = signal(false);
  
  activeEntriesCount = computed(() => this.activeEntries().length);

  ngOnInit(): void {
    // Don't load data on init - wait for user to expand accordion
    // This prevents unnecessary API calls when accordion is closed
  }
  
  ngOnDestroy(): void {
    // Cancel any pending requests
    if (this.abortController) {
      this.abortController.abort();
    }
    // Clear debounce timer
    if (this.toggleDebounceTimer) {
      clearTimeout(this.toggleDebounceTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleAccordion(): void {
    // Clear any existing debounce timer
    if (this.toggleDebounceTimer) {
      clearTimeout(this.toggleDebounceTimer);
    }
    
    // Debounce rapid toggles to prevent multiple simultaneous requests
    this.toggleDebounceTimer = setTimeout(() => {
      this.performToggle();
      this.toggleDebounceTimer = null;
    }, this.TOGGLE_DEBOUNCE_MS);
  }
  
  private performToggle(): void {
    const wasExpanded = this.isExpanded();
    this.isExpanded.set(!this.isExpanded());
    
    // Cancel any pending requests when closing
    if (wasExpanded && !this.isExpanded()) {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    }
    
    // Load data when expanding
    if (!wasExpanded && this.isExpanded() && this.currentUser()) {
      // Load data if not already loading (service-level caching will handle TTL)
      if (!this.isLoading()) {
        this.loadDashboardData();
      }
      // Announce expansion to screen readers
      this.announceToScreenReader(
        this.translate('lottery.dashboard.expanded') || 'Dashboard expanded'
      );
    } else if (wasExpanded && !this.isExpanded()) {
      // Announce collapse to screen readers
      this.announceToScreenReader(
        this.translate('lottery.dashboard.collapsed') || 'Dashboard collapsed'
      );
    }
    
    // Focus management: If closing, return focus to toggle button
    if (wasExpanded && !this.isExpanded()) {
      // Use setTimeout to ensure DOM update completes
      setTimeout(() => {
        const toggleButton = document.getElementById('dashboard-accordion-toggle');
        if (toggleButton) {
          toggleButton.focus();
        }
      }, 100);
    }
  }

  handleEscapeKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.isExpanded()) {
      this.toggleAccordion();
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
    }
  }

  async loadDashboardData(retryAttempt: number = 0): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    // Cancel previous request if exists
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Create new AbortController for this request
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.isLoading.set(true);
    this.error.set(null);
    this.errorType.set(null);
    this.retryCount.set(retryAttempt);
    
    try {
      // Load data in parallel - service-level localStorage caching will handle TTL
      const [entries, stats, gamification] = await Promise.all([
        firstValueFrom(this.lotteryService.getUserActiveEntries()).catch(err => {
          if (signal.aborted) throw new Error('Request cancelled');
          throw err;
        }),
        firstValueFrom(this.lotteryService.getLotteryAnalytics()).catch(err => {
          if (signal.aborted) throw new Error('Request cancelled');
          throw err;
        }),
        firstValueFrom(this.lotteryService.getGamificationData()).catch(() => null) // Gamification is optional
      ]);
      
      // Check if request was cancelled
      if (signal.aborted) {
        return;
      }
      
      // Update gamification signal if available
      if (gamification) {
        this.gamification.set(gamification);
      }
      
      this.error.set(null);
      this.errorType.set(null);
      this.retryCount.set(0);
      
      // Announce successful load to screen readers
      this.announceToScreenReader(
        this.translate('lottery.dashboard.loaded') || 'Dashboard data loaded successfully'
      );
    } catch (error: any) {
      // Don't handle error if request was cancelled
      if (signal.aborted || error?.message === 'Request cancelled') {
        return;
      }
      
      const errorType = this.categorizeError(error);
      this.errorType.set(errorType);
      
      const errorMessage = this.getErrorMessage(errorType, error);
      this.error.set(errorMessage);
      
      this.logger.error('Error loading dashboard data in accordion', { 
        error, 
        errorType,
        retryAttempt 
      }, 'LotteryDashboardAccordionComponent');
      
      // Announce error to screen readers
      this.announceToScreenReader(errorMessage);
      
      // Auto-retry for retryable errors
      if (this.isRetryableError(errorType) && retryAttempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[retryAttempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        this.isRetrying.set(true);
        
        setTimeout(() => {
          if (!signal.aborted) {
            this.loadDashboardData(retryAttempt + 1);
          }
        }, delay);
      } else {
        this.isRetrying.set(false);
      }
    } finally {
      if (!signal.aborted) {
        this.isLoading.set(false);
      }
    }
  }
  
  categorizeError(error: any): ErrorType {
    if (error?.name === 'AbortError' || error?.message === 'Request cancelled') {
      return ErrorType.UNKNOWN; // Don't show error for cancelled requests
    }
    
    // Network errors (retryable)
    if (error?.status === 0 || error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    // Authentication errors (redirect to login)
    if (error?.status === 401 || error?.status === 403) {
      return ErrorType.AUTHENTICATION;
    }
    
    // Server errors (retryable)
    if (error?.status >= 500) {
      return ErrorType.SERVER;
    }
    
    // Validation errors
    if (error?.status === 400 || error?.status === 422) {
      return ErrorType.VALIDATION;
    }
    
    return ErrorType.UNKNOWN;
  }
  
  isRetryableError(errorType: ErrorType): boolean {
    return errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER;
  }
  
  getErrorMessage(errorType: ErrorType, error: any): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return this.translate('lottery.dashboard.error.network') || 
               'Network error. Please check your connection and try again.';
      case ErrorType.AUTHENTICATION:
        return this.translate('lottery.dashboard.error.authentication') || 
               'Your session has expired. Please log in again.';
      case ErrorType.SERVER:
        return this.translate('lottery.dashboard.error.server') || 
               'Server error. Please try again in a moment.';
      case ErrorType.VALIDATION:
        return this.translate('lottery.dashboard.error.validation') || 
               'Invalid data. Please refresh the page.';
      default:
        return this.translate('lottery.dashboard.loadError') || 
               'Unable to load dashboard data. Please try again.';
    }
  }
  
  announceToScreenReader(message: string): void {
    // Use aria-live region for screen reader announcements
    setTimeout(() => {
      if (this.screenReaderAnnouncement) {
        this.screenReaderAnnouncement.nativeElement.textContent = message;
        // Clear after announcement is read
        setTimeout(() => {
          if (this.screenReaderAnnouncement) {
            this.screenReaderAnnouncement.nativeElement.textContent = '';
          }
        }, 1000);
      }
    }, 100);
  }

  refreshDashboard(): void {
    // Cancel any pending requests
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Reset retry count
    this.retryCount.set(0);
    this.isRetrying.set(false);
    
    // Clear caches and reload data
    this.lotteryService.refreshDashboardData();
    this.loadDashboardData(0);
  }
  
  retryLoad(): void {
    // Manual retry button
    this.retryCount.set(0);
    this.isRetrying.set(false);
    this.loadDashboardData(0);
  }
  
  handleAuthenticationError(): void {
    // Redirect to login on authentication error
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: this.router.url } 
    });
  }

  onEntryClick(entry: LotteryTicketDto): void {
    // Navigate to house details page
    this.router.navigate(['/houses', entry.houseId]);
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

