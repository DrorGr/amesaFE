import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { House } from '../../models/house.model';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { LocaleService } from '../../services/locale.service';
import { UserPreferencesService } from '../../services/user-preferences.service';

interface SearchFilters {
  query: string;
  status: 'all' | 'active' | 'past' | 'upcoming';
  minPrice: number | null;
  maxPrice: number | null;
  location: string;
  features: string[];
  showWinnersOnly: boolean;
  drawDateFilter: 'all' | 'upcoming' | 'past';
  minTicketsAvailable: number | null;
  sortBy: 'date' | 'price' | 'popularity' | 'name';
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CountdownTimerComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('search.title') }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate('search.subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filters Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ translate('search.filters') }}
              </h2>

              <!-- Search Input -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('search.searchInput') }}
                </label>
                <input
                  type="text"
                  [(ngModel)]="filters().query"
                  (ngModelChange)="applyFilters()"
                  [placeholder]="translate('search.searchPlaceholder')"
                  [attr.aria-label]="translate('search.searchInput')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-transparent">
              </div>

              <!-- Status Filter -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('search.status') }}
                </label>
                <select
                  [(ngModel)]="filters().status"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('search.status')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="all">{{ translate('search.statusAll') }}</option>
                  <option value="active">{{ translate('search.statusActive') }}</option>
                  <option value="upcoming">{{ translate('search.statusUpcoming') }}</option>
                  <option value="past">{{ translate('search.statusPast') }}</option>
                </select>
              </div>

              <!-- Price Range -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('search.priceRange') }}
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    [(ngModel)]="filters().minPrice"
                    (ngModelChange)="applyFilters()"
                    [placeholder]="translate('search.minPrice')"
                    [attr.aria-label]="translate('search.minPrice')"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <input
                    type="number"
                    [(ngModel)]="filters().maxPrice"
                    (ngModelChange)="applyFilters()"
                    [placeholder]="translate('search.maxPrice')"
                    [attr.aria-label]="translate('search.maxPrice')"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
              </div>

              <!-- Location -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('search.location') }}
                </label>
                <input
                  type="text"
                  [(ngModel)]="filters().location"
                  (ngModelChange)="applyFilters()"
                  [placeholder]="translate('search.locationPlaceholder')"
                  [attr.aria-label]="translate('search.location')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              </div>

              <!-- Winner Filter -->
              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="filters().showWinnersOnly"
                    (ngModelChange)="applyFilters()"
                    class="mr-2 rounded border-gray-300 text-blue-600">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ translate('search.showWinnersOnly') }}
                  </span>
                </label>
              </div>

              <!-- Sort By -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('search.sortBy') }}
                </label>
                <select
                  [(ngModel)]="filters().sortBy"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('search.sortBy')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="date">{{ translate('search.sortByDate') }}</option>
                  <option value="price">{{ translate('search.sortByPrice') }}</option>
                  <option value="popularity">{{ translate('search.sortByPopularity') }}</option>
                  <option value="name">{{ translate('search.sortByName') }}</option>
                </select>
              </div>

              <!-- Reset Filters -->
              <button
                (click)="resetFilters()"
                [attr.aria-label]="translate('search.resetFilters')"
                class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors">
                {{ translate('search.resetFilters') }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="lg:col-span-3">
            <!-- Results Header -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <p class="text-gray-600 dark:text-gray-400">
                  {{ translate('search.resultsCount', { count: filteredHouses().length }) }}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    (click)="viewMode.set('grid')"
                    [class.bg-blue-600]="viewMode() === 'grid'"
                    [class.text-white]="viewMode() === 'grid'"
                    [class.bg-gray-200]="viewMode() !== 'grid'"
                    [class.dark:bg-gray-700]="viewMode() !== 'grid'"
                    [attr.aria-label]="translate('search.gridView')"
                    [attr.aria-pressed]="viewMode() === 'grid'"
                    role="button"
                    class="p-2 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                  </button>
                  <button
                    (click)="viewMode.set('list')"
                    [class.bg-blue-600]="viewMode() === 'list'"
                    [class.text-white]="viewMode() === 'list'"
                    [class.bg-gray-200]="viewMode() !== 'list'"
                    [class.dark:bg-gray-700]="viewMode() !== 'list'"
                    [attr.aria-label]="translate('search.listView')"
                    [attr.aria-pressed]="viewMode() === 'list'"
                    role="button"
                    class="p-2 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Results Grid/List -->
            @if (filteredHouses().length === 0) {
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {{ translate('search.noResults') }}
                </p>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ translate('search.noResultsDescription') }}
                </p>
              </div>
            } @else {
              @if (viewMode() === 'grid') {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @for (house of filteredHouses(); track house.id) {
                    <div 
                      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
                      [routerLink]="['/houses', house.id]">
                      <div class="relative w-full h-48">
                        <img 
                          [src]="house.imageUrl || 'https://via.placeholder.com/400x300'" 
                          [alt]="house.title"
                          [class.thumbnail-upcoming]="house.status === 'upcoming'"
                          [class.thumbnail-ended]="house.status === 'ended'"
                          class="w-full h-48 object-cover">
                        <!-- Thumbnail overlay for status -->
                        <div 
                          *ngIf="house.status === 'upcoming'"
                          class="absolute inset-0 bg-yellow-500 bg-opacity-15 dark:bg-yellow-400 dark:bg-opacity-10 pointer-events-none z-0">
                        </div>
                        <div 
                          *ngIf="house.status === 'ended'"
                          class="absolute inset-0 bg-gray-500 bg-opacity-30 dark:bg-gray-600 dark:bg-opacity-40 pointer-events-none z-0 thumbnail-ended-overlay">
                        </div>
                      </div>
                      <div class="p-4">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {{ house.title }}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {{ house.description }}
                        </p>
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            G�{{ formatPrice(house.price) }}
                          </span>
                          <span 
                            class="px-2 py-1 text-xs rounded-full font-semibold"
                            [class.bg-green-100]="house.status === 'active'"
                            [class.text-green-800]="house.status === 'active'"
                            [class.bg-yellow-100]="house.status === 'upcoming'"
                            [class.text-yellow-800]="house.status === 'upcoming'"
                            [class.bg-gray-100]="house.status === 'ended'"
                            [class.text-gray-800]="house.status === 'ended'">
                            {{ getStatusText(house.status) }}
                          </span>
                        </div>
                        @if (house.lotteryEndDate) {
                          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>{{ translate('search.drawDate') }}</span>
                            <app-countdown-timer 
                              [targetDate]="house.lotteryEndDate"
                              [translateFn]="translate.bind(this)">
                            </app-countdown-timer>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="space-y-4">
                  @for (house of filteredHouses(); track house.id) {
                    <div 
                      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
                      [routerLink]="['/houses', house.id]">
                      <div class="flex gap-4">
                        <div class="relative w-32 h-24">
                          <img 
                            [src]="house.imageUrl || 'https://via.placeholder.com/200x150'" 
                            [alt]="house.title"
                            [class.thumbnail-upcoming]="house.status === 'upcoming'"
                            [class.thumbnail-ended]="house.status === 'ended'"
                            class="w-32 h-24 object-cover rounded-lg">
                          <!-- Thumbnail overlay for status -->
                          <div 
                            *ngIf="house.status === 'upcoming'"
                            class="absolute inset-0 bg-yellow-500 bg-opacity-15 dark:bg-yellow-400 dark:bg-opacity-10 rounded-lg pointer-events-none z-0">
                          </div>
                          <div 
                            *ngIf="house.status === 'ended'"
                            class="absolute inset-0 bg-gray-500 bg-opacity-30 dark:bg-gray-600 dark:bg-opacity-40 rounded-lg pointer-events-none z-0 thumbnail-ended-overlay">
                          </div>
                        </div>
                        <div class="flex-1">
                          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {{ house.title }}
                          </h3>
                          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {{ house.description }}
                          </p>
                          <div class="flex items-center justify-between">
                            <span class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                              {{ formatPrice(house.price) }}
                            </span>
                            <span 
                              class="px-2 py-1 text-xs rounded-full font-semibold"
                              [class.bg-green-100]="house.status === 'active'"
                              [class.text-green-800]="house.status === 'active'"
                              [class.bg-yellow-100]="house.status === 'upcoming'"
                              [class.text-yellow-800]="house.status === 'upcoming'"
                              [class.bg-gray-100]="house.status === 'ended'"
                              [class.text-gray-800]="house.status === 'ended'">
                              {{ getStatusText(house.status) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Thumbnail filters for status */
    .thumbnail-upcoming {
      filter: sepia(0.2) saturate(1.1) brightness(1.05);
    }
    
    .thumbnail-ended {
      filter: grayscale(0.8) brightness(0.7);
    }
    
    .thumbnail-ended-overlay {
      filter: grayscale(0.8) brightness(0.7);
    }
  `]
})
export class SearchPageComponent implements OnInit, OnDestroy {
  localeService = inject(LocaleService);
  userPreferencesService = inject(UserPreferencesService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  
  filters = signal<SearchFilters>({
    query: '',
    status: 'all',
    minPrice: null,
    maxPrice: null,
    location: '',
    features: [],
    showWinnersOnly: false,
    drawDateFilter: 'all',
    minTicketsAvailable: null,
    sortBy: 'date'
  });
  
  viewMode = signal<'grid' | 'list'>('grid');
  allHouses = signal<House[]>([]);
  
  filteredHouses = computed(() => {
    let houses = [...this.allHouses()];
    const filter = this.filters();
    
    // Search query
    if (filter.query) {
      const query = filter.query.toLowerCase();
      houses = houses.filter(h => 
        h.title.toLowerCase().includes(query) ||
        h.description?.toLowerCase().includes(query) ||
        h.location?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filter.status !== 'all') {
      houses = houses.filter(h => h.status === filter.status);
    }
    
    // Price range
    if (filter.minPrice !== null) {
      houses = houses.filter(h => h.price >= filter.minPrice!);
    }
    if (filter.maxPrice !== null) {
      houses = houses.filter(h => h.price <= filter.maxPrice!);
    }
    
    // Location
    if (filter.location) {
      const location = filter.location.toLowerCase();
      houses = houses.filter(h => h.location?.toLowerCase().includes(location));
    }
    
    // Sort
    switch (filter.sortBy) {
      case 'price':
        houses.sort((a, b) => a.price - b.price);
        break;
      case 'name':
        houses.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popularity':
        houses.sort((a, b) => (b.soldTickets || 0) - (a.soldTickets || 0));
        break;
      case 'date':
      default:
        houses.sort((a, b) => 
          new Date(b.lotteryEndDate).getTime() - new Date(a.lotteryEndDate).getTime()
        );
        break;
    }
    
    return houses;
  });

  ngOnInit(): void {
    this.loadHouses();
  }

  private subscriptions = new Subscription();

  loadHouses(): void {
    this.subscriptions.add(
      this.lotteryService.getHousesFromApi({}).subscribe({
        next: (response) => {
          // getHousesFromApi returns PagedResponse<HouseDto>
          const houses = response.items.map(dto => 
            this.lotteryService.convertHouseDtoToHouse(dto)
          );
          this.allHouses.set(houses);
        },
        error: (error) => {
          console.error('Error loading houses:', error);
          // Fallback to using houses from service signal
          const houses = this.lotteryService.getHouses()();
          this.allHouses.set(houses);
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  applyFilters(): void {
    // Computed signal will automatically update
  }

  resetFilters(): void {
    this.filters.set({
      query: '',
      status: 'all',
      minPrice: null,
      maxPrice: null,
      location: '',
      features: [],
      showWinnersOnly: false,
      drawDateFilter: 'all',
      minTicketsAvailable: null,
      sortBy: 'date'
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return this.translate('lottery.status.active');
      case 'ended':
        return this.translate('lottery.status.ended');
      case 'upcoming':
        return this.translate('lottery.status.upcoming');
      default:
        return status;
    }
  }

  formatPrice(price: number): string {
    return this.localeService.formatCurrency(price, 'USD');
  }

  translate(key: string, params?: { [key: string]: any }): string {
    let translation = this.translationService.translate(key);
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, params[paramKey]);
      });
    }
    return translation;
  }
}

