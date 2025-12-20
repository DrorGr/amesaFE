import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HouseDto, House, HouseImage } from '../../models/house.model';
import { PagedResponse } from '../../services/api.service';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { HouseCardComponent } from '../house-card/house-card.component';
import { BulkFavoritesResponse, BulkFavoriteError } from '../../interfaces/lottery.interface';

@Component({
  selector: 'app-lottery-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HouseCardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.title) }}
            <span *ngIf="favoritesCount() > 0" class="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({{ favoritesCount() }})
            </span>
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.favorites.emptyDescription) }}
          </p>
        </div>

        <!-- Controls: Sorting and Pagination Info -->
        <ng-container *ngIf="favoriteHouses().length > 0 || isLoading()">
          <div class="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <!-- Sorting Controls -->
            <div class="flex gap-2 items-center">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <select 
                [(ngModel)]="sortBy" 
                (change)="onSortChange()"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="dateadded">Date Added</option>
                <option value="price">Price</option>
                <option value="location">Location</option>
                <option value="title">Title</option>
              </select>
              <select 
                [(ngModel)]="sortOrder" 
                (change)="onSortChange()"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            
            <!-- Action Buttons: Analytics, Export -->
            <div class="flex gap-2 items-center">
              <button
                routerLink="/lottery/favorites/analytics"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                Analytics
              </button>
              <button
                (click)="onExport('csv')"
                [disabled]="isExporting() || favoritesCount() === 0"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ isExporting() ? 'Exporting...' : 'Export CSV' }}
              </button>
              <button
                (click)="onExport('json')"
                [disabled]="isExporting() || favoritesCount() === 0"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ isExporting() ? 'Exporting...' : 'Export JSON' }}
              </button>
            </div>
            
            <!-- Pagination Info -->
            <div *ngIf="pagedResponse()" class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ (currentPage() - 1) * pageSize() + 1 }} - {{ Math.min(currentPage() * pageSize(), pagedResponse()!.total) }} of {{ pagedResponse()!.total }}
            </div>
          </div>
        </ng-container>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Bulk Selection Controls -->
        <div *ngIf="!isLoading() && favoriteHouses().length > 0" class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              [checked]="selectAll"
              (change)="toggleSelectAll()"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({{ selectedHouses().size }} selected)
            </label>
          </div>
          <button
            *ngIf="selectedHouses().size > 0"
            (click)="bulkRemoveSelected()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Remove Selected ({{ selectedHouses().size }})
          </button>
        </div>

        <!-- Favorites Grid using house-card component -->
        <ng-container *ngIf="!isLoading() && favoriteHouses().length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <div *ngFor="let house of favoriteHouses()" class="relative">
              <input 
                type="checkbox"
                [checked]="selectedHouses().has(house.id)"
                (change)="toggleHouseSelection(house.id)"
                class="absolute top-2 left-2 z-10 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white">
              <app-house-card 
                [house]="convertToHouse(house)"
                [isFavoritesPage]="true">
              </app-house-card>
            </div>
          </div>
          
          <!-- Pagination Controls -->
          <div *ngIf="pagedResponse() && pagedResponse()!.totalPages > 1" class="mt-8 flex justify-center items-center gap-2">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="!pagedResponse()!.hasPrevious || isLoading()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            
            <div class="flex gap-1">
              <button
                *ngFor="let page of getPageNumbers()"
                (click)="goToPage(page)"
                [class.bg-blue-600]="page === currentPage()"
                [class.text-white]="page === currentPage()"
                [class.bg-white]="page !== currentPage()"
                [class.dark:bg-gray-700]="page !== currentPage()"
                [class.text-gray-700]="page !== currentPage()"
                [class.dark:text-gray-300]="page !== currentPage()"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                {{ page }}
              </button>
            </div>
            
            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="!pagedResponse()!.hasNext || isLoading()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </ng-container>
        
        <!-- Empty State -->
        <div *ngIf="!isLoading() && favoriteHouses().length === 0 && favoritesCount() === 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
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
  readonly Math = Math; // Make Math available in template
  
  currentUser = this.authService.getCurrentUser();
  favoriteHouses = signal<HouseDto[]>([]);
  pagedResponse = signal<PagedResponse<HouseDto> | null>(null);
  favoritesCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  
  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  
  // Sorting state (persisted to localStorage)
  sortBy = signal<'dateadded' | 'price' | 'location' | 'title'>(
    this.getStoredSortBy() || 'dateadded'
  );
  sortOrder = signal<'asc' | 'desc'>(
    this.getStoredSortOrder() || 'asc'
  );
  
  // Bulk selection state
  selectedHouses = signal<Set<string>>(new Set());
  selectAll = false;
  
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
    // Load sorting preferences from localStorage
    const storedSortBy = this.getStoredSortBy();
    const storedSortOrder = this.getStoredSortOrder();
    if (storedSortBy) this.sortBy.set(storedSortBy);
    if (storedSortOrder) this.sortOrder.set(storedSortOrder);
    
    this.loadFavorites();
    this.loadFavoritesCount();
  }

  /**
   * Get storage key with user ID to prevent collisions
   */
  private getStorageKey(suffix: string): string {
    const userId = this.currentUser()?.id || 'anonymous';
    return `favorites_${userId}_${suffix}`;
  }

  /**
   * Get stored sort by preference from localStorage
   */
  private getStoredSortBy(): 'dateadded' | 'price' | 'location' | 'title' | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.getStorageKey('sortBy'));
      if (stored && ['dateadded', 'price', 'location', 'title'].includes(stored)) {
        return stored as 'dateadded' | 'price' | 'location' | 'title';
      }
    } catch (e) {
      console.warn('Failed to read sortBy from localStorage:', e);
    }
    return null;
  }

  /**
   * Get stored sort order preference from localStorage
   */
  private getStoredSortOrder(): 'asc' | 'desc' | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.getStorageKey('sortOrder'));
      if (stored && ['asc', 'desc'].includes(stored)) {
        return stored as 'asc' | 'desc';
      }
    } catch (e) {
      console.warn('Failed to read sortOrder from localStorage:', e);
    }
    return null;
  }

  /**
   * Store sort by preference to localStorage
   */
  private storeSortBy(value: 'dateadded' | 'price' | 'location' | 'title'): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey('sortBy'), value);
    } catch (e) {
      console.warn('Failed to store sortBy to localStorage:', e);
    }
  }

  /**
   * Store sort order preference to localStorage
   */
  private storeSortOrder(value: 'asc' | 'desc'): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey('sortOrder'), value);
    } catch (e) {
      console.warn('Failed to store sortOrder to localStorage:', e);
    }
  }
  
  async loadFavoritesCount(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }
    
    try {
      const count = await firstValueFrom(this.lotteryService.getFavoriteHousesCount());
      this.favoritesCount.set(count);
    } catch (error) {
      console.error('Error loading favorites count:', error);
      // Don't show error toast for count, just use 0
      this.favoritesCount.set(0);
    }
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
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.lotteryService.getFavoriteHouses({
          page: this.currentPage(),
          limit: this.pageSize(),
          sortBy: this.sortBy(),
          sortOrder: this.sortOrder()
        })
      );
      
      if (response) {
        this.pagedResponse.set(response);
        this.favoriteHouses.set(response.items);
        this.favoritesCount.set(response.total);
        
        // Validate current page doesn't exceed total pages
        if (this.currentPage() > response.totalPages && response.totalPages > 0) {
          this.currentPage.set(response.totalPages);
          // Reload with corrected page
          this.isLoadingFavorites = false;
          this.isLoading.set(false);
          await this.loadFavorites();
          return;
        }
        
        // Clear selection if page changed and sync selectAll state
        this.selectedHouses.set(new Set());
        this.selectAll = false; // Reset selectAll since selection is cleared
      } else {
        this.favoriteHouses.set([]);
        this.pagedResponse.set(null);
        this.favoritesCount.set(0);
        this.currentPage.set(1);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoriteHouses.set([]);
      this.pagedResponse.set(null);
      this.favoritesCount.set(0);
      this.currentPage.set(1);
      this.toastService.error('Failed to load favorites. Please try again.');
    } finally {
      this.isLoadingFavorites = false;
      this.isLoading.set(false);
    }
  }
  
  onSortChange(): void {
    // Store sorting preferences
    this.storeSortBy(this.sortBy());
    this.storeSortOrder(this.sortOrder());
    
    // Reset to first page when sorting changes
    this.currentPage.set(1);
    this.loadFavorites();
  }
  
  goToPage(page: number): void {
    const paged = this.pagedResponse();
    if (!paged || paged.totalPages === 0) {
      return;
    }
    if (page >= 1 && page <= paged.totalPages) {
      this.currentPage.set(page);
      this.loadFavorites();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  getPageNumbers(): number[] {
    const paged = this.pagedResponse();
    if (!paged || paged.totalPages === 0) {
      return [];
    }
    
    const current = this.currentPage();
    const total = paged.totalPages;
    const pages: number[] = [];
    
    // Show max 5 page numbers
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    // Adjust start if we're near the end
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Convert HouseDto to House interface for house-card component
   * Provides type-safe conversion with null/undefined handling
   */
  convertToHouse(houseDto: HouseDto): House {
    if (!houseDto) {
      throw new Error('HouseDto cannot be null or undefined');
    }

    // Get primary image or first image
    const primaryImage = houseDto.images?.find(img => img?.isPrimary) || houseDto.images?.[0];
    
    // Convert HouseImageDto[] to HouseImage[] with null safety
    const images: HouseImage[] = (houseDto.images || [])
      .filter((img): img is NonNullable<typeof img> => img != null)
      .map(img => ({
        url: img.imageUrl || '',
        alt: img.altText || houseDto.title || 'House image'
      }));
    
    // Ensure status is valid
    const validStatuses = ['active', 'ended', 'upcoming'] as const;
    const status = validStatuses.includes(houseDto.status as typeof validStatuses[number]) 
      ? (houseDto.status as 'active' | 'ended' | 'upcoming')
      : 'active';
    
    return {
      id: houseDto.id || '',
      title: houseDto.title || '',
      description: houseDto.description || '',
      price: houseDto.price ?? 0,
      location: houseDto.location || '',
      city: houseDto.address?.split(',')[0]?.trim() || undefined,
      address: houseDto.address || undefined,
      imageUrl: primaryImage?.imageUrl || '',
      images: images,
      bedrooms: houseDto.bedrooms ?? 0,
      bathrooms: houseDto.bathrooms ?? 0,
      sqft: houseDto.squareFeet ?? 0,
      lotteryEndDate: houseDto.lotteryEndDate ? new Date(houseDto.lotteryEndDate) : new Date(),
      totalTickets: houseDto.totalTickets ?? 0,
      soldTickets: houseDto.ticketsSold ?? 0,
      ticketPrice: houseDto.ticketPrice ?? 0,
      status: status
    };
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  /**
   * Toggle selection of a single house
   */
  toggleHouseSelection(houseId: string): void {
    const current = this.selectedHouses();
    const newSet = new Set(current);
    if (newSet.has(houseId)) {
      newSet.delete(houseId);
    } else {
      newSet.add(houseId);
    }
    this.selectedHouses.set(newSet);
    // Update selectAll state
    this.selectAll = newSet.size === this.favoriteHouses().length && this.favoriteHouses().length > 0;
  }

  /**
   * Toggle select all checkbox
   */
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      // Select all houses on current page
      const allIds = new Set(this.favoriteHouses().map(h => h.id));
      this.selectedHouses.set(allIds);
    } else {
      // Deselect all
      this.selectedHouses.set(new Set());
    }
  }

  /**
   * Bulk remove selected houses from favorites
   */
  async bulkRemoveSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedHouses());
    if (selectedIds.length === 0) {
      return;
    }

    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.lotteryService.bulkRemoveFavorites(selectedIds)
      );

      // Show success message
      if (result.successful > 0) {
        this.toastService.success(`Successfully removed ${result.successful} ${result.successful === 1 ? 'favorite' : 'favorites'}`);
      }

      // Show error message for failures (truncate if too long)
      if (result.failed > 0 && result.errors && result.errors.length > 0) {
        const maxErrorLength = 200; // Truncate error messages to prevent UI overflow
        let errorMessages = result.errors
          .slice(0, 5) // Show max 5 errors
          .map((e: BulkFavoriteError) => `${e.houseId}: ${e.errorMessage}`)
          .join(', ');
        
        if (errorMessages.length > maxErrorLength) {
          errorMessages = errorMessages.substring(0, maxErrorLength) + '...';
        }
        
        if (result.errors.length > 5) {
          errorMessages += ` (and ${result.errors.length - 5} more errors)`;
        }
        
        this.toastService.warning(`Failed to remove ${result.failed} ${result.failed === 1 ? 'favorite' : 'favorites'}: ${errorMessages}`);
      }

      // Clear selection
      this.selectedHouses.set(new Set());
      this.selectAll = false;

      // Reload favorites to reflect changes
      await this.loadFavorites();
      await this.loadFavoritesCount();
    } catch (error: any) {
      console.error('Error bulk removing favorites:', error);
      this.toastService.error('Failed to remove favorites. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Export favorites in the specified format
   */
  async onExport(format: 'csv' | 'json'): Promise<void> {
    // Validate format
    if (format !== 'csv' && format !== 'json') {
      this.toastService.error('Invalid export format. Please use CSV or JSON.');
      return;
    }

    // Check if there are favorites to export
    if (this.favoritesCount() === 0) {
      this.toastService.warning('No favorites to export.');
      return;
    }

    this.isExporting.set(true);
    try {
      await firstValueFrom(this.lotteryService.exportFavorites(format));
      this.toastService.success(`Favorites exported successfully as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Error exporting favorites:', error);
      // Error message is already shown by the service
    } finally {
      this.isExporting.set(false);
    }
  }
}

