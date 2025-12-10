import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { EntryFilters, PagedEntryHistoryResponse } from '../../interfaces/lottery.interface';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { LocaleService } from '../../services/locale.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-entry-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate(LOTTERY_TRANSLATION_KEYS.entries.history) }}
          </h1>
          <p class="text-lg md:text-base text-gray-600 dark:text-gray-300">
            {{ translate(LOTTERY_TRANSLATION_KEYS.entries.title) }}
          </p>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate(LOTTERY_TRANSLATION_KEYS.filters.status) }}
              </label>
              <select 
                [(ngModel)]="filters.status"
                (change)="applyFilters()"
                [attr.aria-label]="translate(LOTTERY_TRANSLATION_KEYS.filters.status)"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option [value]="undefined">{{ translate(LOTTERY_TRANSLATION_KEYS.filters.all) }}</option>
                <option value="active">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusActive) }}</option>
                <option value="winner">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusWinner) }}</option>
                <option value="refunded">{{ translate(LOTTERY_TRANSLATION_KEYS.entries.statusRefunded) }}</option>
              </select>
            </div>
            
            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate(LOTTERY_TRANSLATION_KEYS.filters.startDate) }}
              </label>
              <input 
                type="date"
                [(ngModel)]="filters.startDate"
                (change)="applyFilters()"
                [attr.aria-label]="translate(LOTTERY_TRANSLATION_KEYS.filters.startDate)"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            
            <!-- End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate(LOTTERY_TRANSLATION_KEYS.filters.endDate) }}
              </label>
              <input 
                type="date"
                [(ngModel)]="filters.endDate"
                (change)="applyFilters()"
                [attr.aria-label]="translate(LOTTERY_TRANSLATION_KEYS.filters.endDate)"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            
            <!-- Actions -->
            <div class="flex items-end">
              <button
                (click)="clearFilters()"
                (keydown.enter)="clearFilters()"
                (keydown.space)="clearFilters(); $event.preventDefault()"
                [attr.aria-label]="translate(LOTTERY_TRANSLATION_KEYS.filters.clear)"
                class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors focus:outline-none">
                {{ translate(LOTTERY_TRANSLATION_KEYS.filters.clear) }}
              </button>
            </div>
          </div>
        </div>

        <!-- History List -->
        <ng-container *ngIf="historyData(); else loading">
          <div *ngIf="historyData()!.items.length > 0; else noHistory">
            <div class="space-y-4 mb-6">
                <div 
                *ngFor="let entry of historyData()!.items" 
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
                        [class.bg-gray-100]="entry.status === 'refunded'"
                        [class.text-gray-800]="entry.status === 'refunded'"
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
                        <span class="ml-2 font-semibold text-blue-600 dark:text-blue-400">€{{ formatPrice(entry.purchasePrice) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Pagination -->
            <div *ngIf="historyData()!.totalPages > 1" class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <button
                (click)="previousPage()"
                [disabled]="!historyData()!.hasPrevious"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                {{ translate(LOTTERY_TRANSLATION_KEYS.common.previous) }}
              </button>
              
              <span class="text-gray-600 dark:text-gray-400">
                {{ translate('common.page') }} {{ historyData()!.page }} {{ translate('common.of') }} {{ historyData()!.totalPages }}
              </span>
              
              <button
                (click)="nextPage()"
                [disabled]="!historyData()!.hasNext"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                {{ translate(LOTTERY_TRANSLATION_KEYS.common.next) }}
              </button>
            </div>
          </div>
          
          <ng-template #noHistory>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ translate(LOTTERY_TRANSLATION_KEYS.entries.empty) }}
              </p>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate(LOTTERY_TRANSLATION_KEYS.entries.emptyDescription) }}
              </p>
            </div>
          </ng-template>
        </ng-container>
        
        <ng-template #loading>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p class="text-gray-600 dark:text-gray-400">{{ translate(LOTTERY_TRANSLATION_KEYS.common.loading) }}</p>
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
export class EntryHistoryComponent implements OnInit {
  localeService = inject(LocaleService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  currentUser = this.authService.getCurrentUser();
  historyData = signal<PagedEntryHistoryResponse | null>(null);
  
  filters: EntryFilters = {
    page: 1,
    limit: 20,
    status: undefined,
    startDate: undefined,
    endDate: undefined
  };

  ngOnInit(): void {
    this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    try {
      const data = await firstValueFrom(this.lotteryService.getUserEntryHistory(this.filters));
      if (data) {
        this.historyData.set(data);
      }
    } catch (error) {
      console.error('Error loading entry history:', error);
    }
  }

  applyFilters(): void {
    this.filters.page = 1; // Reset to first page
    this.loadHistory();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      status: undefined,
      startDate: undefined,
      endDate: undefined
    };
    this.loadHistory();
  }

  nextPage(): void {
    const data = this.historyData();
    if (data && data.hasNext) {
      this.filters.page = (this.filters.page || 1) + 1;
      this.loadHistory();
    }
  }

  previousPage(): void {
    if ((this.filters.page || 1) > 1) {
      this.filters.page = (this.filters.page || 1) - 1;
      this.loadHistory();
    }
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
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.localeService.formatDate(d, 'medium');
  }

  formatPrice(price: number): string {
    return this.localeService.formatCurrency(price, 'USD');
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    return this.translationService.translateWithParams(key, params);
  }

  navigateToHouse(houseId: string): void {
    this.router.navigate(['/houses', houseId]);
  }
}

