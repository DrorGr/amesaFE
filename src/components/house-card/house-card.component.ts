import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1 transform">
      <div class="relative h-48 bg-gray-200">
        <img 
          [src]="house().imageUrl" 
          [alt]="house().title"
          class="w-full h-full object-cover">
        <div class="absolute top-4 right-4">
          <span class="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ house().title }}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{{ house().description }}</p>
        
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            {{ house().location }}
          </div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
            {{ formatPrice(house().price) }}
          </div>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>{{ house().bedrooms }} {{ translate('house.bed') }}</span>
          <span>{{ house().bathrooms }} {{ translate('house.bath') }}</span>
          <span>{{ formatSqft(house().sqft) }} {{ translate('house.sqft') }}</span>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{{ translate('house.ticketsSold') }}</span>
            <span>{{ house().soldTickets }}/{{ house().totalTickets }}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              [style.width.%]="getTicketProgress()">
            </div>
          </div>
        </div>

        <div class="text-center mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.lotteryEnds') }}</div>
          <div class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ getTimeRemaining() }}</div>
        </div>

        <div class="space-y-2">
          <ng-container *ngIf="currentUser(); else signInBlock">
            <button
              (click)="purchaseTicket()"
              [disabled]="isPurchasing || house().status !== 'active'"
              class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
              <ng-container *ngIf="isPurchasing; else buyTicketBlock">
                {{ translate('house.processing') }}
              </ng-container>
              <ng-template #buyTicketBlock>
                {{ translate('house.buyTicket') }} - {{ house().ticketPrice | currency:'EUR':'symbol':'1.0-0' }}
              </ng-template>
            </button>
          </ng-container>
          <ng-template #signInBlock>
            <div class="text-center">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ translate('house.signInToParticipate') }}</p>
              <div class="text-lg font-medium text-blue-600 dark:text-blue-400">{{ house().ticketPrice | currency:'EUR':'symbol':'1.0-0' }} {{ translate('house.perTicket') }}</div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
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