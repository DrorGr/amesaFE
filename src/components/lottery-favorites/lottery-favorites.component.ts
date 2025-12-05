import { Component, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HouseDto } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { LocaleService } from '../../services/locale.service';
import { UserPreferencesService } from '../../services/user-preferences.service';

@Component({
  selector: 'app-lottery-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.title) }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.emptyDescription) }}
          </p>
        </div>

        <!-- Favorites Grid -->
        <ng-container *ngIf="favoriteHouses().length > 0; else noFavorites">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              *ngFor="let house of favoriteHouses()" 
              class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <!-- House Image -->
              <div class="relative h-64 md:h-80 bg-gray-200">
                <img 
                  [src]="(house.images && house.images[0]) ? house.images[0].imageUrl : ''" 
                  [alt]="house.title"
                  class="w-full h-full object-cover"
                  (error)="onImageError($event)">
                
                <!-- Favorite Button -->
                <button
                  (click)="removeFavorite($event, house.id)"
                  (keydown.enter)="removeFavorite($event, house.id)"
                  (keydown.space)="removeFavorite($event, house.id); $event.preventDefault()"
                  [class.animate-pulse]="isRemovingFavorite()(house.id)"
                  [attr.aria-label]="translate('favorites.removeFromFavorites')"
                  class="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer z-10 focus:outline-none">
                  <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
                
                <!-- Status Badge -->
                <div class="absolute top-4 left-4">
                  <span class="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {{ house.status }}
                  </span>
                </div>
              </div>
              
              <!-- House Details -->
              <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ house.title }}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ house.location }}</p>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ formatPrice(house.price) }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatPrice(house.ticketPrice) }} {{ translate('house.perTicket') }}
                  </div>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>{{ house.bedrooms }} {{ translate('house.bed') }}{{ house.bedrooms > 1 ? 's' : '' }}</span>
                  <span>{{ house.bathrooms }} {{ translate('house.bath') }}{{ house.bathrooms > 1 ? 's' : '' }}</span>
                  <span *ngIf="house.squareFeet">{{ formatSqft(house.squareFeet) }} {{ translate('house.sqft') }}</span>
                </div>
                
                <!-- Enter Now Button (replaces Buy Ticket on favorites page) -->
                <button
                  (click)="quickEntry($event, house)"
                  [disabled]="isPurchasing()(house.id) || house.status !== 'active'"
                  [attr.aria-label]="translate(LOTTERY_TRANSLATION_KEYS.quickEntry.enterNow)"
                  [attr.aria-describedby]="house.status !== 'active' ? 'enter-now-disabled-' + house.id : null"
                  class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <ng-container *ngIf="isPurchasing()(house.id); else enterNowText">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.processing) }}
                  </ng-container>
                  <ng-template #enterNowText>
                    {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.enterNow) }}
                  </ng-template>
                </button>
                @if (house.status !== 'active') {
                  <div [id]="'enter-now-disabled-' + house.id" class="sr-only">
                    {{ translate('entry.lotteryNotActive') }}
                  </div>
                }
                
                <!-- View Details Link -->
                <button
                  (click)="viewDetails($event, house.id)"
                  [attr.aria-label]="translateWithParams('house.viewDetails', { title: house.title })"
                  class="w-full mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.common.view) }} {{ translate('common.details') }}
                </button>
              </div>
            </div>
          </div>
        </ng-container>
        
        <ng-template #noFavorites>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            <p class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.empty) }}
            </p>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.emptyDescription) }}
            </p>
            <button
              routerLink="/houses"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors">
              {{ translate('common.browseHouses') }}
            </button>
          </div>
        </ng-template>
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
export class LotteryFavoritesComponent implements OnInit, OnDestroy {
  localeService = inject(LocaleService);
  userPreferencesService = inject(UserPreferencesService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private favoriteIdsSubscription?: Subscription;
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  favoriteHouses = signal<HouseDto[]>([]);
  removingFavorites = signal<Set<string>>(new Set());
  purchasing = signal<Set<string>>(new Set());
  
  // Watch favorite IDs changes to auto-refresh
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  
  // Computed signals for Set operations
  isRemovingFavorite = computed(() => {
    const set = this.removingFavorites();
    return (houseId: string) => set.has(houseId);
  });
  
  isPurchasing = computed(() => {
    const set = this.purchasing();
    return (houseId: string) => set.has(houseId);
  });

  constructor() {
    // Auto-refresh favorites when favorite IDs change (user adds/removes from other pages)
    effect(() => {
      const favoriteIds = this.favoriteHouseIds();
      const currentUser = this.currentUser();
      
      // Only refresh if user is logged in and we have favorite IDs
      if (currentUser && favoriteIds.length > 0) {
        // Debounce: only refresh if we don't already have these houses loaded
        const currentHouseIds = this.favoriteHouses().map(h => h.id).sort().join(',');
        const newHouseIds = favoriteIds.sort().join(',');
        
        if (currentHouseIds !== newHouseIds) {
          this.loadFavorites();
        }
      } else if (currentUser && favoriteIds.length === 0 && this.favoriteHouses().length > 0) {
        // If favorites were removed, clear the list
        this.favoriteHouses.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.loadFavorites();
  }
  
  ngOnDestroy(): void {
    if (this.favoriteIdsSubscription) {
      this.favoriteIdsSubscription.unsubscribe();
    }
  }

  async loadFavorites(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    try {
      const houses = await this.lotteryService.getFavoriteHouses().toPromise();
      
      if (houses) {
        this.favoriteHouses.set(houses);
      } else {
        this.favoriteHouses.set([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async removeFavorite(event: Event, houseId: string): Promise<void> {
    event.stopPropagation();
    
    if (!this.currentUser() || this.removingFavorites().has(houseId)) {
      return;
    }

    this.removingFavorites.set(new Set([...this.removingFavorites(), houseId]));

    try {
      const result = await this.lotteryService.removeHouseFromFavorites(houseId).toPromise();
      if (result) {
        // Remove from local list - the effect will also refresh from API
        this.favoriteHouses.set(this.favoriteHouses().filter(h => h.id !== houseId));
        // Reload to ensure sync with backend
        this.loadFavorites();
        // Show success toast notification
        this.toastService.success(this.translate(LOTTERY_TRANSLATION_KEYS.favorites.removeFromFavorites) || 'Removed from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Show error toast notification
      this.toastService.error(this.translate('favorites.removeFailed'));
    } finally {
      const newSet = new Set(this.removingFavorites());
      newSet.delete(houseId);
      this.removingFavorites.set(newSet);
    }
  }

  async quickEntry(event: Event, house: HouseDto): Promise<void> {
    event.stopPropagation();
    
    if (!this.currentUser() || this.purchasing().has(house.id)) {
      return;
    }

    this.purchasing.set(new Set([...this.purchasing(), house.id]));

    try {
      const result = await this.lotteryService.quickEntryFromFavorite({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default' // TODO: Get from user preferences or payment setup
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(this.translationService.translate(LOTTERY_TRANSLATION_KEYS.quickEntry.success) || 'Entered lottery successfully!');
      } else {
        this.toastService.error(this.translationService.translate(LOTTERY_TRANSLATION_KEYS.quickEntry.error) || 'Failed to enter lottery');
      }
    } catch (error) {
      console.error('Error with quick entry:', error);
      this.toastService.error(this.translationService.translate(LOTTERY_TRANSLATION_KEYS.quickEntry.error) || 'Failed to enter lottery');
    } finally {
      const newSet = new Set(this.purchasing());
      newSet.delete(house.id);
      this.purchasing.set(newSet);
    }
  }

  viewDetails(event: Event, houseId: string): void {
    event.stopPropagation();
    // Navigation handled by routerLink
  }

  formatPrice(price: number): string {
    return this.localeService.formatCurrency(price, 'USD');
  }

  formatSqft(sqft: number): string {
    return this.localeService.formatNumber(sqft);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    return this.translationService.translateWithParams(key, params);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Replace with a placeholder SVG image
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.onerror = null; // Prevent infinite loop
  }
}

