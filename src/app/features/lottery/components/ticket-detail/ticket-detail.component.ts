import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { LotteryTicketDto } from '@core/models/house.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Back Button -->
        <button
          (click)="goBack()"
          class="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          {{ translate('common.back') }}
        </button>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">{{ translate('common.loading') }}</p>
          </div>
        }

        <!-- Error State -->
        @if (!isLoading() && error() && !ticket()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div class="flex items-start">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
                  {{ translate('tickets.error.title') || 'Error Loading Ticket' }}
                </h3>
                <p class="mt-2 text-sm text-red-700 dark:text-red-300">
                  {{ error() }}
                </p>
                <button
                  (click)="loadTicket()"
                  class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  {{ translate('common.retry') || 'Retry' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Ticket Details -->
        @if (!isLoading() && ticket()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold mb-2">
                    {{ translate('tickets.detail.title') || 'Ticket Details' }}
                  </h1>
                  <p class="text-blue-100">
                    {{ ticket()!.houseTitle }}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-sm text-blue-100 mb-1">{{ translate('tickets.detail.ticketNumber') || 'Ticket Number' }}</div>
                  <div class="text-2xl font-mono font-bold">{{ ticket()!.ticketNumber }}</div>
                </div>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <span 
                  class="px-4 py-2 rounded-full text-sm font-semibold"
                  [class.bg-green-100]="ticket()!.status === 'active'"
                  [class.text-green-800]="ticket()!.status === 'active'"
                  [class.bg-yellow-100]="ticket()!.status === 'winner'"
                  [class.text-yellow-800]="ticket()!.status === 'winner'"
                  [class.bg-gray-100]="ticket()!.status === 'refunded'"
                  [class.text-gray-800]="ticket()!.status === 'refunded'"
                  [class.dark:bg-green-900]="ticket()!.status === 'active'"
                  [class.dark:text-green-200]="ticket()!.status === 'active'"
                  [class.dark:bg-yellow-900]="ticket()!.status === 'winner'"
                  [class.dark:text-yellow-200]="ticket()!.status === 'winner'">
                  {{ getStatusText(ticket()!.status) }}
                </span>
                @if (ticket()!.isWinner) {
                  <span class="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold">
                    🎉 {{ translate('tickets.detail.winner') || 'Winner!' }}
                  </span>
                }
              </div>
            </div>

            <!-- Details Grid -->
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Purchase Date -->
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {{ translate('tickets.detail.purchaseDate') || 'Purchase Date' }}
                </div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ formatDate(ticket()!.purchaseDate) }}
                </div>
              </div>

              <!-- Purchase Price -->
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {{ translate('tickets.detail.purchasePrice') || 'Purchase Price' }}
                </div>
                <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {{ formatPrice(ticket()!.purchasePrice) }}
                </div>
              </div>

              <!-- House ID -->
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {{ translate('tickets.detail.houseId') || 'House ID' }}
                </div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                  {{ ticket()!.houseId }}
                </div>
              </div>

              <!-- Ticket ID -->
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {{ translate('tickets.detail.ticketId') || 'Ticket ID' }}
                </div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white font-mono text-sm">
                  {{ ticket()!.id }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div class="flex flex-col sm:flex-row gap-4">
                <button
                  (click)="navigateToHouse()"
                  class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 
                         text-white rounded-lg transition-colors font-semibold">
                  {{ translate('tickets.detail.viewHouse') || 'View House' }}
                </button>
                <button
                  (click)="goBack()"
                  class="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                         text-gray-900 dark:text-white rounded-lg transition-colors">
                  {{ translate('common.back') || 'Back' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class TicketDetailComponent implements OnInit {
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private localeService = inject(LocaleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ticketId = input<string>('');
  ticket = signal<LotteryTicketDto | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Get ticket ID from route params if not provided as input
    this.route.params.subscribe(params => {
      const id = this.ticketId() || params['id'];
      if (id) {
        this.loadTicket(id);
      } else {
        this.error.set(this.translate('tickets.error.missingId') || 'Ticket ID is required');
      }
    });
  }

  async loadTicket(id?: string): Promise<void> {
    const ticketId = id || this.ticketId() || this.route.snapshot.params['id'];
    if (!ticketId) {
      this.error.set(this.translate('tickets.error.missingId') || 'Ticket ID is required');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const ticketData = await firstValueFrom(this.lotteryService.getTicketById(ticketId));
      this.ticket.set(ticketData);
    } catch (err: any) {
      console.error('Error loading ticket:', err);
      this.error.set(
        err?.error?.error?.message || 
        err?.message || 
        this.translate('tickets.error.loadFailed') || 
        'Failed to load ticket details'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToHouse(): void {
    const houseId = this.ticket()?.houseId;
    if (houseId) {
      this.router.navigate(['/houses', houseId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/entries']);
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return this.translate('tickets.status.active') || 'Active';
      case 'winner':
        return this.translate('tickets.status.winner') || 'Winner';
      case 'refunded':
        return this.translate('tickets.status.refunded') || 'Refunded';
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
    return this.translationService.translate(key) || key;
  }
}








