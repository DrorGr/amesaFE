import { Component, inject, input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-300 overflow-visible flex flex-col w-full">
      <div class="relative h-48 md:h-48 bg-gray-200 flex-shrink-0">
        <img 
          [src]="house().imageUrl" 
          [alt]="house().title"
          class="w-full h-full object-cover">
        <div class="absolute top-4 right-4">
          <span class="bg-emerald-500 text-white px-3 py-2 rounded-full text-sm md:text-sm font-semibold">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <div class="p-4 md:p-4 flex flex-col flex-grow min-h-0 overflow-visible">
        <div class="flex-grow flex flex-col min-h-0 overflow-visible">
          <h3 class="text-2xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-3 break-words leading-tight mobile-card-title">{{ translate('house.' + house().id + '.title') }}</h3>
          <p class="text-gray-600 dark:text-gray-300 text-2xl md:text-base mb-4 md:mb-3 line-clamp-2 break-words leading-relaxed mobile-card-text">{{ translate('house.' + house().id + '.description') }}</p>
          
          <div class="flex items-center justify-between mb-4 md:mb-3">
            <div class="flex items-center text-gray-600 dark:text-gray-300 text-2xl md:text-base min-w-0 flex-1 mr-2">
              <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="truncate">{{ translate('house.' + house().id + '.location') }}</span>
            </div>
            <div class="text-xl md:text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 mobile-card-price">
              €{{ formatPrice(house().price) }}
            </div>
          </div>

          <div class="flex items-center justify-between text-2xl md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-3 mobile-card-details">
            <span>{{ house().bedrooms }} {{ translate('house.bed') }}{{ house().bedrooms > 1 ? 's' : '' }}</span>
            <span>{{ house().bathrooms }} {{ translate('house.bath') }}{{ house().bathrooms > 1 ? 's' : '' }}</span>
            <span>{{ formatSqft(house().sqft) }} {{ translate('house.sqft') }}</span>
          </div>

          <div class="mb-3 md:mb-2">
            <div class="flex justify-between text-2xl md:text-base text-gray-600 dark:text-gray-300 mb-3 md:mb-2 mobile-card-details">
              <span>{{ translate('house.ticketsSold') }}</span>
              <span>{{ house().soldTickets }}/{{ house().totalTickets }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 md:h-2 mobile-card-progress">
              <div 
                class="bg-blue-600 dark:bg-blue-500 h-3 md:h-2 rounded-full transition-all duration-300"
                [style.width.%]="getTicketProgress()">
              </div>
            </div>
          </div>

          <div class="text-center mb-4 md:mb-3">
            <div class="text-2xl md:text-base text-gray-600 dark:text-gray-300">{{ translate('house.lotteryEnds') }}</div>
            <div class="text-xl md:text-xl font-bold text-orange-600 dark:text-orange-400 mobile-card-time">{{ getTimeRemaining() }}</div>
          </div>
        </div>

        <div class="mt-auto flex-shrink-0">
          <ng-container *ngIf="currentUser(); else signInBlock">
            <button
              (click)="purchaseTicket()"
              [disabled]="isPurchasing || house().status !== 'active'"
              class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-5 md:py-3 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 border-none cursor-pointer min-h-[64px] text-xl md:text-base disabled:bg-gray-400 disabled:cursor-not-allowed mobile-card-button"
              [class.bg-gray-400]="(isPurchasing || house().status !== 'active')"
              [class.cursor-not-allowed]="(isPurchasing || house().status !== 'active')">
              <ng-container *ngIf="isPurchasing; else buyTicketBlock">
                {{ translate('house.processing') }}
              </ng-container>
              <ng-template #buyTicketBlock>
                {{ translate('house.buyTicket') }} - €{{ house().ticketPrice }}
              </ng-template>
            </button>
          </ng-container>
          <ng-template #signInBlock>
            <div class="text-center">
              <p class="text-2xl md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-3 mobile-card-text">{{ translate('house.signInToParticipate') }}</p>
              <div class="text-xl md:text-xl font-bold text-blue-600 dark:text-blue-400 mobile-card-price">€{{ house().ticketPrice }} {{ translate('house.perTicket') }}</div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block !important;
      height: auto !important;
      width: 100% !important;
    }
    
    * {
      box-sizing: border-box !important;
    }
    
    @media (max-width: 767px) {
      .mobile-card-title {
        font-size: 2rem !important;
        line-height: 1.3 !important;
      }
      
      .mobile-card-text {
        font-size: 1.5rem !important;
        line-height: 1.5 !important;
      }
      
      .mobile-card-price {
        font-size: 2rem !important;
      }
      
      .mobile-card-details {
        font-size: 1.5rem !important;
      }
      
      .mobile-card-button {
        font-size: 1.75rem !important;
        padding: 1.5rem 2rem !important;
        min-height: 80px !important;
      }
      
      .mobile-card-progress {
        height: 1rem !important;
      }
      
      .mobile-card-time {
        font-size: 1.75rem !important;
      }
    }
  `]
})
export class HouseCardComponent {
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  
  house = input.required<House>();
  isPurchasing = false;
  
  currentUser = this.authService.getCurrentUser();

  formatPrice(price: number): string {
    return price.toLocaleString();
  }

  formatSqft(sqft: number): string {
    return sqft.toLocaleString();
  }

  getTicketProgress(): number {
    const house = this.house();
    return (house.soldTickets / house.totalTickets) * 100;
  }

  getStatusText(): string {
    const status = this.house().status;
    switch (status) {
      case 'active': return this.translate('house.active');
      case 'ended': return this.translate('house.ended');
      case 'upcoming': return this.translate('house.upcoming');
      default: return 'Unknown';
    }
  }

  getTimeRemaining(): string {
    const endDate = new Date(this.house().lotteryEndDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return this.translate('house.ended');
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  }

  async purchaseTicket() {
    if (!this.currentUser() || this.isPurchasing) {
      return;
    }

    this.isPurchasing = true;
    
    try {
      const success = await this.lotteryService.purchaseTicket(this.house().id);
      if (success) {
        console.log('Ticket purchased successfully!');
      } else {
        console.log('Failed to purchase ticket');
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
    } finally {
      this.isPurchasing = false;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}