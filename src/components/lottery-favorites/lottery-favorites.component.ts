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
              <div class="relative h-48 bg-gray-200">
                <img 
                  [src]="(house.images && house.images[0]) ? house.images[0].imageUrl : ''" 
                  [alt]="house.title"
                  class="w-full h-full object-cover">
                
                <!-- Favorite Button -->
                <button
                  (click)="removeFavorite($event, house.id)"
                  [class.animate-pulse]="isRemovingFavorite()(house.id)"
                  class="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer z-10">
                  <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
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
                    €{{ formatPrice(house.price) }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    €{{ formatPrice(house.ticketPrice) }} {{ translate('house.perTicket') }}
                  </div>
                </div>
                
                <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>{{ house.bedrooms }} {{ translate('house.bed') }}{{ house.bedrooms > 1 ? 's' : '' }}</span>
                  <span>{{ house.bathrooms }} {{ translate('house.bath') }}{{ house.bathrooms > 1 ? 's' : '' }}</span>
                  <span *ngIf="house.squareFeet">{{ formatSqft(house.squareFeet) }} {{ translate('house.sqft') }}</span>
                </div>
                
                <!-- Quick Entry Button -->
                <button
                  (click)="quickEntry($event, house)"
                  [disabled]="isQuickEntering()(house.id) || house.status !== 'active'"
                  class="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <ng-container *ngIf="isQuickEntering()(house.id); else quickEntryText">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.processing) }}
                  </ng-container>
                  <ng-template #quickEntryText>
                    ⚡ {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.enterNow) }}
                  </ng-template>
                </button>
                
                <!-- View Details Link -->
                <button
                  (click)="viewDetails($event, house.id)"
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
  quickEntering = signal<Set<string>>(new Set());
  
  // Watch favorite IDs changes to auto-refresh
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  
  // Computed signals for Set operations
  isRemovingFavorite = computed(() => {
    const set = this.removingFavorites();
    return (houseId: string) => set.has(houseId);
  });
  
  isQuickEntering = computed(() => {
    const set = this.quickEntering();
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery-favorites.component.ts:loadFavorites',message:'Skipping load - user not authenticated',data:{hasCurrentUser:!!this.currentUser()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery-favorites.component.ts:loadFavorites',message:'Loading favorites',data:{currentUser:this.currentUser()?.email,currentFavoritesCount:this.favoriteHouses().length,currentFavoriteIds:this.lotteryService.getFavoriteHouseIds()()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    try {
      const houses = await this.lotteryService.getFavoriteHouses().toPromise();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery-favorites.component.ts:loadFavorites:success',message:'Favorites loaded',data:{housesReturned:houses?.length||0,houseIds:houses?.map(h=>h.id)||[],willSetToComponent:!!houses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      if (houses) {
        this.favoriteHouses.set(houses);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery-favorites.component.ts:loadFavorites:empty',message:'No houses returned from API',data:{housesIsNull:houses===null,housesIsUndefined:houses===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        this.favoriteHouses.set([]);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery-favorites.component.ts:loadFavorites:error',message:'Error loading favorites',data:{error:error instanceof Error?error.message:String(error),currentFavoritesCount:this.favoriteHouses().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
      this.toastService.error('Failed to remove from favorites');
    } finally {
      const newSet = new Set(this.removingFavorites());
      newSet.delete(houseId);
      this.removingFavorites.set(newSet);
    }
  }

  async quickEntry(event: Event, house: HouseDto): Promise<void> {
    event.stopPropagation();
    
    if (!this.currentUser() || this.quickEntering().has(house.id)) {
      return;
    }

    this.quickEntering.set(new Set([...this.quickEntering(), house.id]));

    try {
      const result = await this.lotteryService.quickEntryFromFavorite({
        houseId: house.id,
        quantity: 1, // API contract specifies "quantity", matches backend [JsonPropertyName("quantity")]
        paymentMethodId: 'default'
      }).toPromise();
      
      if (result) {
        console.log('Quick entry successful!', result);
        // TODO: Show success notification
      }
    } catch (error) {
      console.error('Error with quick entry:', error);
      // TODO: Show error notification
    } finally {
      const newSet = new Set(this.quickEntering());
      newSet.delete(house.id);
      this.quickEntering.set(newSet);
    }
  }

  viewDetails(event: Event, houseId: string): void {
    event.stopPropagation();
    // Navigation handled by routerLink
  }

  formatPrice(price: number): string {
    return price.toLocaleString();
  }

  formatSqft(sqft: number): string {
    return sqft.toLocaleString();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

