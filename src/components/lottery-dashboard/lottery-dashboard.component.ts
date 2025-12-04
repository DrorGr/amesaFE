import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { ToastService } from '../../services/toast.service';
import { HouseDto, LotteryTicketDto } from '../../models/house.model';
import { UserLotteryStats, HouseRecommendation } from '../../interfaces/lottery.interface';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { LocaleService } from '../../services/locale.service';
import { UserPreferencesService } from '../../services/user-preferences.service';

@Component({
  selector: 'app-lottery-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <header class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.title) }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.welcome) }}
          </p>
        </header>

        <!-- Statistics Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.activeEntries) }}
                </p>
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {{ stats()?.activeEntries || 0 }}
                </p>
              </div>
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.totalEntries) }}
                </p>
                <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                  {{ stats()?.totalEntries || 0 }}
                </p>
              </div>
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.totalWins) }}
                </p>
                <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ stats()?.totalWins || 0 }}
                </p>
              </div>
              <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.statistics.winRate) }}
                </p>
                <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {{ getWinRate() }}%
                </p>
              </div>
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <!-- Active Entries Section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl md:text-xl font-bold text-gray-900 dark:text-white">
                {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.activeEntries) }}
              </h2>
              <a 
                routerLink="/lottery/entries/active"
                (keydown.enter)="navigateToActiveEntries()"
                (keydown.space)="navigateToActiveEntries(); $event.preventDefault()"
                aria-label="View all active entries"
                class="text-blue-600 dark:text-blue-400 hover:underline text-sm focus:outline-none rounded">
                {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.viewAll) }}
              </a>
            </div>
            
            @if (activeEntries().length > 0) {
              <div class="space-y-4">
                @for (entry of activeEntries().slice(0, 3); track entry.id) {
                <div 
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="font-semibold text-gray-900 dark:text-white">{{ entry.houseTitle }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {{ translate(LOTTERY_TRANSLATION_KEYS.entries.ticketNumber) }}: {{ entry.ticketNumber }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {{ formatDate(entry.purchaseDate) }}
                      </p>
                    </div>
                    <div class="ml-4 flex items-center gap-2">
                      <button
                        (click)="toggleFavorite(entry.houseId, $event)"
                        (keydown.enter)="toggleFavorite(entry.houseId, $event)"
                        (keydown.space)="toggleFavorite(entry.houseId, $event); $event.preventDefault()"
                        [class.text-red-500]="isFavorite(entry.houseId)"
                        [class.text-gray-400]="!isFavorite(entry.houseId)"
                        [class.animate-pulse]="isTogglingFavorite(entry.houseId)"
                        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 cursor-pointer focus:outline-none"
                        [attr.aria-label]="isFavorite(entry.houseId) ? 'Remove from favorites' : 'Add to favorites'"
                        [title]="isFavorite(entry.houseId) ? translate(LOTTERY_TRANSLATION_KEYS.favorites.removeFromFavorites) : translate(LOTTERY_TRANSLATION_KEYS.favorites.addToFavorites)">
                        <svg 
                          class="w-5 h-5 transition-all duration-300"
                          [class.text-red-500]="isFavorite(entry.houseId)"
                          [class.text-gray-400]="!isFavorite(entry.houseId)"
                          [style.color]="isFavorite(entry.houseId) ? '#ef4444' : '#9ca3af'"
                          [attr.fill]="isFavorite(entry.houseId) ? 'currentColor' : 'none'"
                          [attr.stroke]="!isFavorite(entry.houseId) ? 'currentColor' : 'none'"
                          stroke-width="2" 
                          viewBox="0 0 24 24">
                          <path 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z">
                          </path>
                        </svg>
                      </button>
                      <span 
                        class="px-3 py-1 rounded-full text-xs font-semibold"
                        [class.bg-green-100]="entry.status === 'active'"
                        [class.text-green-800]="entry.status === 'active'"
                        [class.dark:bg-green-900]="entry.status === 'active'"
                        [class.dark:text-green-200]="entry.status === 'active'">
                        {{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusActive) }}
                      </span>
                    </div>
                  </div>
                </div>
                }
              </div>
            } @else {
              <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.entries.empty) }}
                </p>
              </div>
            }
          </div>

          <!-- Favorite Houses Section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl md:text-xl font-bold text-gray-900 dark:text-white">
                {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.favoriteHouses) }}
              </h2>
              <a 
                routerLink="/lottery/favorites"
                (keydown.enter)="navigateToFavorites()"
                (keydown.space)="navigateToFavorites(); $event.preventDefault()"
                aria-label="View all favorite houses"
                class="text-blue-600 dark:text-blue-400 hover:underline text-sm focus:outline-none rounded">
                {{ translate(LOTTERY_TRANSLATION_KEYS.dashboard.viewAll) }}
              </a>
            </div>
            
            @if (favoriteHouses().length > 0) {
              <div class="space-y-4">
                @for (house of favoriteHouses().slice(0, 3); track house.id) {
                <div 
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none"
                  [routerLink]="['/houses', house.id]"
                  (keydown.enter)="navigateToHouse(house.id)"
                  (keydown.space)="navigateToHouse(house.id); $event.preventDefault()"
                  [attr.aria-label]="'View house: ' + house.title"
                  tabindex="0"
                  role="link">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="font-semibold text-gray-900 dark:text-white">{{ house.title }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ house.location }}</p>
                      <p class="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        {{ formatPrice(house.price) }}
                      </p>
                    </div>
                    <div class="ml-4">
                      <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                }
              </div>
            } @else {
              <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.empty) }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Recommendations Section -->
        <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl md:text-xl font-bold text-gray-900 dark:text-white mb-6">
            {{ translate(LOTTERY_TRANSLATION_KEYS.recommendations.title) }}
          </h2>
          
          @if (recommendations().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (rec of recommendations().slice(0, 3); track rec.id) {
              <div 
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none"
                [routerLink]="['/houses', rec.id]"
                (keydown.enter)="navigateToHouse(rec.id)"
                (keydown.space)="navigateToHouse(rec.id); $event.preventDefault()"
                [attr.aria-label]="'View recommended house: ' + rec.title"
                tabindex="0"
                role="link">
                <p class="font-semibold text-gray-900 dark:text-white">{{ rec.title }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ rec.location }}</p>
                <p class="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {{ formatPrice(rec.price) }}
                </p>
                <p class="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  {{ rec.reason }}
                </p>
              </div>
              }
            </div>
          } @else {
            <div class="text-center py-8">
              <p class="text-gray-500 dark:text-gray-400">
                {{ translate(LOTTERY_TRANSLATION_KEYS.recommendations.empty) }}
              </p>
            </div>
          }
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class LotteryDashboardComponent implements OnInit, OnDestroy {
  localeService = inject(LocaleService);
  userPreferencesService = inject(UserPreferencesService);
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private logger = inject(LoggingService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  activeEntries = this.lotteryService.getActiveEntries();
  stats = this.lotteryService.getUserLotteryStats();
  recommendations = this.lotteryService.getRecommendationsSignal();
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  
  favoriteHouses = signal<HouseDto[]>([]);
  isLoading = signal<boolean>(true);
  private togglingFavorites = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  async loadDashboardData(): Promise<void> {
    if (!this.currentUser()) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    try {
      // Load active entries
      await this.lotteryService.getUserActiveEntries().toPromise();
      
      // Load statistics
      await this.lotteryService.getLotteryAnalytics().toPromise();
      
      // Load recommendations
      await this.lotteryService.getRecommendations(3).toPromise();
      
      // Load favorite houses
      const favorites = await this.lotteryService.getFavoriteHouses().toPromise();
      if (favorites) {
        this.favoriteHouses.set(favorites);
      }
    } catch (error) {
      this.logger.error('Error loading dashboard data', { error }, 'LotteryDashboardComponent');
    } finally {
      this.isLoading.set(false);
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  formatPrice(price: number): string {
    return this.localeService.formatCurrency(price, 'USD');
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.localeService.formatDate(d, 'short');
  }

  navigateToActiveEntries(): void {
    this.router.navigate(['/lottery/entries/active']);
  }

  navigateToFavorites(): void {
    this.router.navigate(['/lottery/favorites']);
  }

  navigateToHouse(houseId: string): void {
    this.router.navigate(['/houses', houseId]);
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

  isFavorite(houseId: string): boolean {
    return this.favoriteHouseIds().includes(houseId);
  }

  isTogglingFavorite(houseId: string): boolean {
    return this.togglingFavorites().has(houseId);
  }

  async toggleFavorite(houseId: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.currentUser()) {
      this.toastService.warning(
        this.translate('house.signInToParticipate') || 'Please sign in to add houses to favorites',
        3000
      );
      return;
    }

    if (this.isTogglingFavorite(houseId)) {
      return;
    }

    this.togglingFavorites.update(set => new Set(set).add(houseId));
    
    try {
      const result = await this.lotteryService.toggleFavorite(houseId).toPromise();
      
      if (result) {
        const message = result.added 
          ? (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.added) || 'Added to favorites')
          : (this.translate(LOTTERY_TRANSLATION_KEYS.favorites.removed) || 'Removed from favorites');
        this.toastService.success(message, 2000);
      }
    } catch (error) {
      this.logger.error('Error toggling favorite', { error, houseId }, 'LotteryDashboardComponent');
      this.toastService.error(
        this.translate('lottery.common.error') || 'Failed to update favorites',
        3000
      );
    } finally {
      this.togglingFavorites.update(set => {
        const newSet = new Set(set);
        newSet.delete(houseId);
        return newSet;
      });
    }
  }
}

