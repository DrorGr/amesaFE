import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';
import { LotteryResultsService, LotteryResult, LotteryResultsFilter, QRCodeValidation } from '../../services/lottery-results.service';
import { TranslationService } from '../../services/translation.service';
import { RealtimeService } from '../../services/realtime.service';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-lottery-results-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {{ translate('lotteryResults.title') }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {{ translate('lotteryResults.subtitle') }}
          </p>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {{ translate('lotteryResults.filters') }}
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('lotteryResults.fromDate') }}
              </label>
              <input 
                type="date" 
                [(ngModel)]="filters.fromDate"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                (change)="applyFilters()"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('lotteryResults.toDate') }}
              </label>
              <input 
                type="date" 
                [(ngModel)]="filters.toDate"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                (change)="applyFilters()"
              >
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('lotteryResults.address') }}
              </label>
              <input 
                type="text" 
                [(ngModel)]="filters.address"
                placeholder="{{ translate('lotteryResults.addressPlaceholder') }}"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                (input)="onFilterChange()"
              >
            </div>

            <!-- Prize Position -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('lotteryResults.prizePosition') }}
              </label>
              <select 
                [(ngModel)]="filters.prizePosition"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                (change)="applyFilters()"
              >
                <option value="">{{ translate('lotteryResults.allPositions') }}</option>
                <option value="1">{{ translate('lotteryResults.firstPlace') }}</option>
                <option value="2">{{ translate('lotteryResults.secondPlace') }}</option>
                <option value="3">{{ translate('lotteryResults.thirdPlace') }}</option>
              </select>
            </div>
          </div>

          <!-- Clear Filters Button -->
          <div class="mt-4 flex justify-between items-center">
            <button 
              (click)="clearFilters()"
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {{ translate('lotteryResults.clearFilters') }}
            </button>
            <button 
              (click)="openQRScanner()"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m-4 4h4m-4 4h4m-4-8h4m-4 4h4"></path>
              </svg>
              {{ translate('lotteryResults.scanQR') }}
            </button>
          </div>
        </div>

        <!-- Results Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <span class="text-yellow-600 dark:text-yellow-400 font-bold">1</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ translate('lotteryResults.firstPlaceWinners') }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ winnersByPosition().first }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span class="text-gray-600 dark:text-gray-400 font-bold">2</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ translate('lotteryResults.secondPlaceWinners') }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ winnersByPosition().second }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <span class="text-orange-600 dark:text-orange-400 font-bold">3</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ translate('lotteryResults.thirdPlaceWinners') }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ winnersByPosition().third }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-lg text-gray-600 dark:text-gray-300">
              {{ translate('lotteryResults.loading') }}
            </span>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ translate('lotteryResults.error') }}
                </h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  {{ error() }}
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Results Grid -->
        @if (!loading() && !error() && results().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (result of results(); track result.id) {
              <div 
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                (click)="viewResultDetails(result)"
              >
                <!-- Result Header -->
                <div class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <span 
                      class="px-3 py-1 text-xs font-semibold rounded-full"
                      [class]="lotteryResultsService.getPrizePositionColor(result.prizePosition)"
                    >
                      {{ lotteryResultsService.getPrizePositionText(result.prizePosition) }}
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ lotteryResultsService.formatDate(result.resultDate) }}
                    </span>
                  </div>

                  <!-- House Info -->
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {{ result.houseTitle }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {{ result.houseAddress }}
                  </p>

                  <!-- Prize Info -->
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ result.prizeDescription }}
                    </p>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                      {{ lotteryResultsService.formatCurrency(result.prizeValue) }}
                    </p>
                  </div>

                  <!-- Winner Info -->
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>{{ translate('lotteryResults.winner') }}:</strong> {{ result.winnerName }}</p>
                    <p><strong>{{ translate('lotteryResults.ticketNumber') }}:</strong> {{ result.winnerTicketNumber }}</p>
                  </div>
                </div>

                <!-- Result Footer -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      @if (result.isClaimed) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {{ translate('lotteryResults.claimed') }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {{ translate('lotteryResults.unclaimed') }}
                        </span>
                      }
                    </div>
                    
                    @if (result.qrCodeImageUrl) {
                      <button 
                        (click)="showQRCode(result, $event)"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m-4 4h4m-4 4h4m-4-8h4m-4 4h4"></path>
                        </svg>
                        {{ translate('lotteryResults.viewQR') }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex justify-center mt-8">
              <nav class="flex items-center space-x-2">
                <button 
                  (click)="previousPage()"
                  [disabled]="currentPage() <= 1"
                  class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ translate('lotteryResults.previous') }}
                </button>
                
                @for (page of getPageNumbers(); track page) {
                  <button 
                    (click)="goToPage(page)"
                    [class]="page === currentPage() 
                      ? 'px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md' 
                      : 'px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'"
                  >
                    {{ page }}
                  </button>
                }
                
                <button 
                  (click)="nextPage()"
                  [disabled]="currentPage() >= totalPages()"
                  class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ translate('lotteryResults.next') }}
                </button>
              </nav>
            </div>
          }
        }

        <!-- Empty State -->
        @if (!loading() && !error() && results().length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ translate('lotteryResults.noResults') }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ translate('lotteryResults.noResultsDescription') }}
            </p>
          </div>
        }
      </div>
    </div>

    <!-- QR Scanner Modal -->
    @if (showScanner()) {
      <div 
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        (click)="closeQRScanner()"
      >
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800" (click)="$event.stopPropagation()">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ translate('lotteryResults.scanQRTitle') || 'Scan QR Code' }}
              </h3>
              <button 
                (click)="closeQRScanner()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close scanner"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div id="qr-reader" class="w-full mb-4"></div>
            
            @if (scanningError()) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p class="text-sm text-red-800 dark:text-red-200">{{ scanningError() }}</p>
              </div>
            }
            
            @if (validationResult()) {
              <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <h4 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  {{ translate('lotteryResults.validationResult') || 'Validation Result' }}
                </h4>
                <p class="text-sm text-green-700 dark:text-green-300">{{ validationResult()!.message }}</p>
                @if (validationResult()!.isValid && validationResult()!.isWinner) {
                  <div class="mt-2 text-sm">
                    <p><strong>{{ translate('lotteryResults.prize') }}:</strong> {{ lotteryResultsService.formatCurrency(validationResult()!.prizeValue || 0) }}</p>
                    <p><strong>{{ translate('lotteryResults.position') || 'Position' }}:</strong> {{ validationResult()!.prizePosition }}</p>
                  </div>
                }
              </div>
            }
            
            <div class="flex justify-center space-x-3">
              <button 
                (click)="closeQRScanner()"
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {{ translate('lotteryResults.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- QR Code Modal -->
    @if (selectedResult()) {
      <div 
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        (click)="closeQRModal()"
      >
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <div class="mt-3 text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ translate('lotteryResults.qrCodeTitle') }}
            </h3>
            
            <div class="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4">
              <img 
                [src]="selectedResult()!.qrCodeImageUrl" 
                [alt]="translate('lotteryResults.qrCode')"
                class="mx-auto w-64 h-64"
              >
            </div>
            
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <p><strong>{{ translate('lotteryResults.winner') }}:</strong> {{ selectedResult()!.winnerName }}</p>
              <p><strong>{{ translate('lotteryResults.ticketNumber') }}:</strong> {{ selectedResult()!.winnerTicketNumber }}</p>
              <p><strong>{{ translate('lotteryResults.prize') }}:</strong> {{ lotteryResultsService.formatCurrency(selectedResult()!.prizeValue) }}</p>
            </div>
            
            <div class="flex justify-center space-x-3">
              <button 
                (click)="closeQRModal()"
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {{ translate('lotteryResults.close') }}
              </button>
              <button 
                (click)="downloadQRCode()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {{ translate('lotteryResults.download') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class LotteryResultsPageComponent implements OnInit, OnDestroy {
  public lotteryResultsService = inject(LotteryResultsService);
  private translationService = inject(TranslationService);
  private realtimeService = inject(RealtimeService);
  private router = inject(Router);

  // Signals
  private _results = signal<LotteryResult[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _currentPage = signal<number>(1);
  private _totalPages = signal<number>(1);
  private _selectedResult = signal<LotteryResult | null>(null);
  private _showScanner = signal<boolean>(false);
  private _scanningError = signal<string | null>(null);
  private _validationResult = signal<QRCodeValidation | null>(null);

  // Public signals
  public results = this._results.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public currentPage = this._currentPage.asReadonly();
  public totalPages = this._totalPages.asReadonly();
  public selectedResult = this._selectedResult.asReadonly();
  public showScanner = this._showScanner.asReadonly();
  public scanningError = this._scanningError.asReadonly();
  public validationResult = this._validationResult.asReadonly();

  // QR Scanner
  private qrScanner: Html5Qrcode | null = null;

  // Computed signals
  public winnersByPosition = this.lotteryResultsService.winnersByPosition;

  // Filter state
  public filters: LotteryResultsFilter = {
    pageNumber: 1,
    pageSize: 12,
    sortBy: 'resultDate',
    sortDirection: 'desc'
  };

  private filterTimeout: any;

  // Polling fallback
  private pollingSubscription: Subscription | null = null;
  private realtimeConnectionStateSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL_MS = 60000; // 60 seconds

  ngOnInit(): void {
    this.loadResults();
    this.setupPollingFallback();
  }

  private loadResults(): void {
    this._loading.set(true);
    this._error.set(null);

    this.lotteryResultsService.getLotteryResults(this.filters).subscribe({
      next: (page) => {
        this._results.set(page.results);
        this._currentPage.set(page.pageNumber);
        this._totalPages.set(page.totalPages);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set(error.message || 'Failed to load lottery results');
        this._loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.filters.pageNumber = 1; // Reset to first page when applying filters
    this.loadResults();
  }

  onFilterChange(): void {
    // Debounce filter changes
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  clearFilters(): void {
    this.filters = {
      pageNumber: 1,
      pageSize: 12,
      sortBy: 'resultDate',
      sortDirection: 'desc'
    };
    this.applyFilters();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.filters.pageNumber = this.currentPage() - 1;
      this.loadResults();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.filters.pageNumber = this.currentPage() + 1;
      this.loadResults();
    }
  }

  goToPage(page: number): void {
    this.filters.pageNumber = page;
    this.loadResults();
  }

  getPageNumbers(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];

    // Show up to 5 page numbers
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewResultDetails(result: LotteryResult): void {
    // Navigate to detailed result view
    if (result?.id) {
      this.router.navigate(['/lottery-results', result.id]);
    } else {
      console.error('Cannot navigate: result ID is missing', result);
    }
  }

  showQRCode(result: LotteryResult, event: Event): void {
    event.stopPropagation(); // Prevent card click
    this._selectedResult.set(result);
  }

  closeQRModal(): void {
    this._selectedResult.set(null);
  }

  downloadQRCode(): void {
    if (this.selectedResult()?.qrCodeImageUrl) {
      const link = document.createElement('a');
      link.href = this.selectedResult()!.qrCodeImageUrl!;
      link.download = `lottery-result-${this.selectedResult()!.winnerTicketNumber}.png`;
      link.click();
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  openQRScanner(): void {
    this._showScanner.set(true);
    this._scanningError.set(null);
    this._validationResult.set(null);
    
    // Initialize scanner after view update
    setTimeout(() => {
      this.initQRScanner();
    }, 100);
  }

  closeQRScanner(): void {
    this.stopQRScanner();
    this._showScanner.set(false);
    this._scanningError.set(null);
    this._validationResult.set(null);
  }

  private async initQRScanner(): Promise<void> {
    try {
      const qrCodeRegionId = 'qr-reader';
      this.qrScanner = new Html5Qrcode(qrCodeRegionId);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await this.qrScanner.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        config,
        (decodedText) => {
          // QR code scanned successfully
          this.handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Scanning error (not a fatal error, just no QR code detected yet)
          // Don't show error for normal scanning process
        }
      );
    } catch (error: any) {
      console.error('Error initializing QR scanner:', error);
      this._scanningError.set(
        error.message || this.translate('lotteryResults.scannerError') || 'Failed to initialize QR scanner'
      );
    }
  }

  private stopQRScanner(): void {
    if (this.qrScanner) {
      this.qrScanner.stop().catch((err) => {
        console.error('Error stopping QR scanner:', err);
      });
      this.qrScanner.clear();
      this.qrScanner = null;
    }
  }

  private handleQRCodeScanned(qrCodeData: string): void {
    // Stop scanning after successful scan
    this.stopQRScanner();
    
    // Validate the QR code
    this.lotteryResultsService.validateQRCode(qrCodeData).subscribe({
      next: (validation) => {
        this._validationResult.set(validation);
        if (!validation.isValid) {
          this._scanningError.set(validation.message || 'Invalid QR code');
        } else {
          this._scanningError.set(null);
        }
      },
      error: (error) => {
        this._scanningError.set(error.message || 'Failed to validate QR code');
        this._validationResult.set(null);
      }
    });
  }

  setupPollingFallback(): void {
    // Check SignalR connection status and set up polling fallback if needed
    // This can be implemented to poll for updates when SignalR is not available
    // Currently relying on SignalR for real-time updates
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.realtimeConnectionStateSubscription?.unsubscribe();
    this.stopQRScanner();
  }
}
