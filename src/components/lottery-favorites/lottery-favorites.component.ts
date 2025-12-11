import { Component, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HouseDto, House, HouseImage } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { HouseCardComponent } from '../house-card/house-card.component';

@Component({
  selector: 'app-lottery-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, HouseCardComponent],
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

        <!-- Favorites Grid using house-card component -->
        <ng-container *ngIf="favoriteHouses().length > 0; else noFavorites">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <app-house-card 
              *ngFor="let house of favoriteHouses()" 
              [house]="convertToHouse(house)"
              [isFavoritesPage]="true">
            </app-house-card>
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
  private isLoadingFavorites = false;
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  favoriteHouses = signal<HouseDto[]>([]);
  
  // Watch favorite IDs changes to auto-refresh (but prevent infinite loops)
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();

  constructor() {
    // Auto-refresh favorites when favorite IDs change (user adds/removes from other pages)
    // Use setTimeout to break synchronous effect chain and prevent infinite loops
    effect(() => {
      const favoriteIds = this.favoriteHouseIds();
      const currentUser = this.currentUser();
      
      // Prevent infinite loop: don't react if we're already loading
      if (this.isLoadingFavorites) {
        return;
      }
      
      // Only refresh if user is logged in and we have favorite IDs
      if (currentUser && favoriteIds.length > 0) {
        // Debounce: only refresh if we don't already have these houses loaded
        const currentHouseIds = this.favoriteHouses().map(h => h.id).sort().join(',');
        const newHouseIds = favoriteIds.sort().join(',');
        
        if (currentHouseIds !== newHouseIds) {
          // Use setTimeout to break the synchronous effect chain and prevent infinite loops
          setTimeout(() => {
            if (!this.isLoadingFavorites) {
              this.loadFavorites();
            }
          }, 0);
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

    // Prevent concurrent calls
    if (this.isLoadingFavorites) {
      return;
    }

    this.isLoadingFavorites = true;
    try {
      const houses = await firstValueFrom(this.lotteryService.getFavoriteHouses());
      
      if (houses) {
        this.favoriteHouses.set(houses);
      } else {
        this.favoriteHouses.set([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoriteHouses.set([]);
    } finally {
      this.isLoadingFavorites = false;
    }
  }

  /**
   * Convert HouseDto to House interface for house-card component
   */
  convertToHouse(houseDto: HouseDto): House {
    // Get primary image or first image
    const primaryImage = houseDto.images?.find(img => img.isPrimary) || houseDto.images?.[0];
    
    // Convert HouseImageDto[] to HouseImage[]
    const images: HouseImage[] = (houseDto.images || []).map(img => ({
      url: img.imageUrl,
      alt: img.altText || houseDto.title
    }));
    
    return {
      id: houseDto.id,
      title: houseDto.title,
      description: houseDto.description || '',
      price: houseDto.price,
      location: houseDto.location,
      city: houseDto.address?.split(',')[0] || undefined,
      address: houseDto.address,
      imageUrl: primaryImage?.imageUrl || '',
      images: images,
      bedrooms: houseDto.bedrooms,
      bathrooms: houseDto.bathrooms,
      sqft: houseDto.squareFeet || 0,
      lotteryEndDate: houseDto.lotteryEndDate,
      totalTickets: houseDto.totalTickets,
      soldTickets: houseDto.ticketsSold,
      ticketPrice: houseDto.ticketPrice,
      status: houseDto.status as 'active' | 'ended' | 'upcoming'
    };
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

