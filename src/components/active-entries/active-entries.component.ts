import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { LotteryTicketDto } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-active-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate(LOTTERY_TRANSLATION_KEYS.entries.active) }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.entries.title) }}
          </p>
        </div>

        <!-- Filter and Sort -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div class="flex flex-col md:flex-row gap-4">
            <select 
              [(ngModel)]="selectedStatus"
              (change)="filterEntries()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">{{ translate(LOTTERY_TRANSLATION_KEYS.filters.all) }}</option>
              <option value="active">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusActive) }}</option>
              <option value="winner">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusWinner) }}</option>
            </select>
            
            <select 
              [(ngModel)]="sortBy"
              (change)="filterEntries()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="date">{{ translate('common.sortByDate') }}</option>
              <option value="house">{{ translate('common.sortByHouse') }}</option>
              <option value="price">{{ translate('common.sortByPrice') }}</option>
            </select>
          </div>
        </div>

        <!-- Entries List -->
        <ng-container *ngIf="filteredEntries().length > 0; else noEntries">
          <div class="space-y-4">
            <div 
              *ngFor="let entry of filteredEntries()" 
              class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
              [routerLink]="['/houses', entry.houseId]"
              (keydown.enter)="navigateToHouse(entry.houseId)"
              (keydown.space)="navigateToHouse(entry.houseId); $event.preventDefault()"
              [attr.aria-label]="translateWithParams('entries.viewEntryDetails', { house: entry.houseTitle })"
              role="link"
              tabindex="0"
              class="focus:outline-none">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-xl md:text-lg font-bold text-gray-900 dark:text-white">
                      {{ entry.houseTitle }}
                    </h3>
                    <span 
                      class="px-3 py-1 rounded-full text-xs font-semibold"
                      [class.bg-green-100]="entry.status === 'active'"
                      [class.text-green-800]="entry.status === 'active'"
                      [class.bg-yellow-100]="entry.status === 'winner'"
                      [class.text-yellow-800]="entry.status === 'winner'"
                      [class.dark:bg-green-900]="entry.status === 'active'"
                      [class.dark:text-green-200]="entry.status === 'active'"
                      [class.dark:bg-yellow-900]="entry.status === 'winner'"
                      [class.dark:text-yellow-200]="entry.status === 'winner'">
                      {{ getStatusText(entry.status) }}
                    </span>
                    <span *ngIf="entry.isWinner" class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">
                      🎉 {{ translate(LOTTERY_TRANSLATION_KEYS.entries.isWinner) }}
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span class="font-semibold">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.ticketNumber) }}:</span>
                      <span class="ml-2 font-mono">{{ entry.ticketNumber }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.purchaseDate) }}:</span>
                      <span class="ml-2">{{ formatDate(entry.purchaseDate) }}</span>
                    </div>
                    <div>
                      <span class="font-semibold">{{ translate('common.price') }}:</span>
                      <span class="ml-2 font-semibold text-blue-600 dark:text-blue-400">{{ formatPrice(entry.purchasePrice) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="flex-shrink-0">
                  <button
                    (click)="viewDetails($event, entry)"
                    [attr.aria-label]="translateWithParams('entries.viewDetailsFor', { house: entry.houseTitle })"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors">
                    {{ translate(LOTTERY_TRANSLATION_KEYS.common.view) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
        
        <ng-template #noEntries>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {{ translate(LOTTERY_TRANSLATION_KEYS.entries.empty) }}
            </p>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate(LOTTERY_TRANSLATION_KEYS.entries.emptyDescription) }}
            </p>
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
export class ActiveEntriesComponent implements OnInit {
  localeService = inject(LocaleService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  activeEntries = this.lotteryService.getActiveEntries();
  private router = inject(Router);
  
  selectedStatus = signal<string>('');
  sortBy = signal<string>('date');
  allEntries = signal<LotteryTicketDto[]>([]);
  
  filteredEntries = computed(() => {
    let entries = [...this.allEntries()];
    
    // Filter by status
    if (this.selectedStatus()) {
      entries = entries.filter(e => e.status === this.selectedStatus());
    }
    
    // Sort
    const sortBy = this.sortBy();
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'house':
          return a.houseTitle.localeCompare(b.houseTitle);
        case 'price':
          return b.purchasePrice - a.purchasePrice;
        default:
          return 0;
      }
    });
    
    return entries;
  });

  ngOnInit(): void {
    this.loadActiveEntries();
  }

  async loadActiveEntries(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    try {
      const entries = await this.lotteryService.getUserActiveEntries().toPromise();
      if (entries) {
        this.allEntries.set(entries);
      }
    } catch (error) {
      console.error('Error loading active entries:', error);
    }
  }

  filterEntries(): void {
    // Computed signal will automatically update
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return this.translate(LOTTERY_TRANSLATION_KEYS.entries.statusActive);
      case 'winner':
        return this.translate(LOTTERY_TRANSLATION_KEYS.entries.statusWinner);
      case 'refunded':
        return this.translate(LOTTERY_TRANSLATION_KEYS.entries.statusRefunded);
      default:
        return status;
    }
  }

  formatDate(date: Date | string): string {
    // Use LocaleService for locale-aware formatting
    return this.localeService.formatDate(
      typeof date === 'string' ? new Date(date) : date, 
      'medium'
    );
  }

  formatPrice(price: number): string {
    // Use LocaleService for locale-aware currency formatting
    return this.localeService.formatCurrency(price, this.localeService.getCurrencyCode());
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    return this.translationService.translateWithParams(key, params);
  }

  viewDetails(event: Event, entry: LotteryTicketDto): void {
    event.stopPropagation();
    // Navigate to house detail page
    // Router navigation is handled by the card click
  }

  navigateToHouse(houseId: string): void {
    this.router.navigate(['/houses', houseId]);
  }
}

