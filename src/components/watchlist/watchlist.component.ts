import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WatchlistService } from '../../services/watchlist.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { WatchlistItem } from '../../interfaces/watchlist.interface';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('watchlist.title') }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate('watchlist.description') }}
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex justify-center items-center min-h-[400px]">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Watchlist Grid -->
        <ng-container *ngIf="!loading() && watchlistItems().length > 0; else noWatchlist">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              *ngFor="let item of watchlistItems()" 
              class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <!-- House Image -->
              <div class="relative h-48 bg-gray-200">
                <img 
                  [src]="(item.house.images && item.house.images[0]) ? item.house.images[0].imageUrl : ''" 
                  [alt]="item.house.title"
                  class="w-full h-full object-cover">
                
                <!-- Watchlist Button -->
                <button
                  (click)="removeFromWatchlist($event, item.houseId)"
                  (keydown)="handleRemoveKeyDown($event, item.houseId)"
                  [class.animate-pulse]="isRemoving().get(item.houseId) || false"
                  [attr.aria-label]="translate('watchlist.remove') + ' ' + item.house.title"
                  [attr.aria-busy]="isRemoving().get(item.houseId) || false"
                  class="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
                  <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                  </svg>
                </button>
                
                <!-- Notification Toggle -->
                <button
                  (click)="toggleNotification($event, item)"
                  (keydown)="handleNotificationKeyDown($event, item)"
                  [class.bg-blue-500]="item.notificationEnabled"
                  [class.bg-gray-400]="!item.notificationEnabled"
                  class="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  [attr.aria-label]="item.notificationEnabled ? 'Disable notifications' : 'Enable notifications'">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
                  </svg>
                </button>
                
                <!-- Status Badge -->
                <div class="absolute bottom-4 left-4">
                  <span class="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {{ item.house.status }}
                  </span>
                </div>
              </div>
              
              <!-- House Details -->
              <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ item.house.title }}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ item.house.location }}</p>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    €{{ formatPrice(item.house.price) }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    €{{ formatPrice(item.house.ticketPrice) }} {{ translate('house.perTicket') }}
                  </div>
                </div>
                
                <!-- Participant Stats -->
                <div *ngIf="item.house.maxParticipants" class="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {{ translateWithParams('participants.count', { count: item.house.uniqueParticipants }) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-500">
                    {{ translateWithParams('participants.maxParticipants', { max: item.house.maxParticipants }) }}
                  </div>
                  <div *ngIf="item.house.isParticipantCapReached" class="text-xs text-red-600 dark:text-red-400 mt-1">
                    {{ translate('participants.capReached') }}
                  </div>
                  <div *ngIf="item.house.remainingParticipantSlots !== undefined && item.house.remainingParticipantSlots > 0" class="text-xs text-green-600 dark:text-green-400 mt-1">
                    {{ translateWithParams('participants.remainingSlots', { count: item.house.remainingParticipantSlots }) }}
                  </div>
                </div>
                
                <!-- View Details Link -->
                <button
                  (click)="viewDetails($event, item.houseId)"
                  (keydown)="handleViewDetailsKeyDown($event, item.houseId)"
                  [attr.aria-label]="translate('common.view') + ' ' + translate('common.details') + ' ' + item.house.title"
                  class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
                  {{ translate('common.view') }} {{ translate('common.details') }}
                </button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Empty State -->
        <ng-template #noWatchlist>
          <div *ngIf="!loading()" class="text-center py-16">
            <svg class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ translate('watchlist.empty') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ translate('watchlist.emptyDescription') }}
            </p>
            <a 
              routerLink="/houses"
              class="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200">
              {{ translate('watchlist.browseHouses') }}
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class WatchlistComponent implements OnInit {
  private watchlistService = inject(WatchlistService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private errorMessageService = inject(ErrorMessageService);

  watchlistItems = signal<WatchlistItem[]>([]);
  isRemoving = signal<Map<string, boolean>>(new Map());
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadWatchlist();
  }

  loadWatchlist(): void {
    this.loading.set(true);
    this.watchlistService.getWatchlist().subscribe({
      next: (items) => {
        this.watchlistItems.set(items);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading watchlist:', error);
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.toastService.error(errorMessage);
        this.loading.set(false);
      }
    });
  }

  removeFromWatchlist(event: Event, houseId: string): void {
    event.stopPropagation();
    const current = this.isRemoving();
    current.set(houseId, true);
    this.isRemoving.set(new Map(current));

    this.watchlistService.removeFromWatchlist(houseId).subscribe({
      next: () => {
        const items = this.watchlistItems().filter(item => item.houseId !== houseId);
        this.watchlistItems.set(items);
        this.toastService.success(this.translate('watchlist.removeSuccess'));
        current.delete(houseId);
        this.isRemoving.set(new Map(current));
      },
      error: (error) => {
        console.error('Error removing from watchlist:', error);
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.toastService.error(errorMessage);
        current.delete(houseId);
        this.isRemoving.set(new Map(current));
      }
    });
  }

  toggleNotification(event: Event, item: WatchlistItem): void {
    event.stopPropagation();
    const newEnabled = !item.notificationEnabled;

    this.watchlistService.toggleNotification(item.houseId, newEnabled).subscribe({
      next: () => {
        const items = this.watchlistItems().map(i =>
          i.houseId === item.houseId ? { ...i, notificationEnabled: newEnabled } : i
        );
        this.watchlistItems.set(items);
        this.toastService.success(
          this.translate(newEnabled ? 'watchlist.notificationEnabled' : 'watchlist.notificationDisabled')
        );
      },
      error: (error) => {
        console.error('Error toggling notification:', error);
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.toastService.error(errorMessage);
      }
    });
  }

  viewDetails(event: Event, houseId: string): void {
    event.stopPropagation();
    // Navigate to house details - router will handle this
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    let translation = this.translationService.translate(key);
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }

  /**
   * Handle keyboard events for remove from watchlist button
   */
  handleRemoveKeyDown(event: KeyboardEvent, houseId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isRemoving().get(houseId)) {
        this.removeFromWatchlist(event, houseId);
      }
    }
  }

  /**
   * Handle keyboard events for notification toggle button
   */
  handleNotificationKeyDown(event: KeyboardEvent, item: WatchlistItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.toggleNotification(event, item);
    }
  }

  /**
   * Handle keyboard events for view details button
   */
  handleViewDetailsKeyDown(event: KeyboardEvent, houseId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.viewDetails(event, houseId);
    }
  }
}


