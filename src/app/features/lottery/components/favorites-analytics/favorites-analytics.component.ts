import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';
import { FavoritesAnalyticsDto, MostFavoritedHouseDto } from '@core/interfaces/lottery.interface';

@Component({
  selector: 'app-favorites-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Favorites Analytics
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            Insights into your favorite houses
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Analytics Content -->
        <ng-container *ngIf="!isLoading() && analytics()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Total Favorites Card -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Favorites</h3>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ analytics()!.totalFavorites }}</p>
            </div>

            <!-- Unique Users Card -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unique Users</h3>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ analytics()!.uniqueUsers }}</p>
            </div>
          </div>

          <!-- Most Favorited Houses -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Most Favorited Houses</h2>
            <div *ngIf="analytics()!.mostFavoritedHouses.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No favorites data available
            </div>
            <div *ngIf="analytics()!.mostFavoritedHouses.length > 0" class="space-y-4">
              <div 
                *ngFor="let house of analytics()!.mostFavoritedHouses; let i = index"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-bold text-gray-400 dark:text-gray-500">#{{ i + 1 }}</span>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ house.title }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">ID: {{ house.houseId }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ house.favoriteCount }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">favorites</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Favorites by Date Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Favorites Added Over Time</h2>
            <div *ngIf="!hasFavoritesByDate()" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No date data available
            </div>
            <div *ngIf="hasFavoritesByDate()" class="space-y-2">
              <div 
                *ngFor="let entry of getFavoritesByDateEntries()"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300" [attr.title]="entry.date">{{ entry.date }}</span>
                <div class="flex items-center gap-3">
                  <div class="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                      [style.width.%]="getPercentage(entry.count)">
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{{ entry.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Error State -->
        <div *ngIf="!isLoading() && !analytics() && error()" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p class="text-red-800 dark:text-red-200">{{ error() }}</p>
          <button
            (click)="loadAnalytics()"
            class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class FavoritesAnalyticsComponent implements OnInit {
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);

  analytics = signal<FavoritesAnalyticsDto | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const data = await firstValueFrom(this.lotteryService.getFavoritesAnalytics());
      this.analytics.set(data);
    } catch (error: any) {
      console.error('Error loading favorites analytics:', error);
      
      // Handle rate limit errors (429)
      if (error.status === 429) {
        this.error.set('Rate limit exceeded. Please try again later.');
        this.toastService.error('Too many requests. Please wait a moment before trying again.');
      } else {
        this.error.set(error.message || 'Failed to load analytics');
        this.toastService.error('Failed to load favorites analytics. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  hasFavoritesByDate(): boolean {
    const analyticsData = this.analytics();
    if (!analyticsData || !analyticsData.favoritesByDate) {
      return false;
    }
    return Object.keys(analyticsData.favoritesByDate).length > 0;
  }

  getFavoritesByDateEntries(): { date: string; count: number }[] {
    const analyticsData = this.analytics();
    if (!analyticsData || !analyticsData.favoritesByDate) {
      return [];
    }
    
    return Object.entries(analyticsData.favoritesByDate)
      .map(([dateKey, count]) => {
        // Format date for display (convert ISO string to readable format)
        let formattedDate = dateKey;
        try {
          const dateObj = new Date(dateKey);
          if (!isNaN(dateObj.getTime())) {
            // Use user's locale for date formatting
            formattedDate = dateObj.toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          }
        } catch (e) {
          // If parsing fails, use original date string
        }
        return { date: formattedDate, count, sortKey: dateKey };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-30) // Last 30 days
      .map(({ sortKey, ...rest }) => rest as { date: string; count: number }); // Remove sortKey from final result
  }

  getPercentage(count: number): number {
    const analyticsData = this.analytics();
    if (!analyticsData || !analyticsData.favoritesByDate) {
      return 0;
    }
    
    const maxCount = Math.max(...Object.values(analyticsData.favoritesByDate));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

