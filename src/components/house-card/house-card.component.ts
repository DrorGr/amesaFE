import { Component, inject, input, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
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
    <div class="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col w-full transform hover:scale-105">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"></div>
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>
      </div>
      

      <div class="relative h-64 md:h-64 bg-gray-200 flex-shrink-0 group">
        <img 
          [src]="house().imageUrl" 
          [alt]="house().title"
          class="w-full h-full object-cover rounded-t-xl">
        
        <!-- Location Icon -->
        <button 
          (click)="openLocationMap()"
          class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
          [attr.aria-label]="'View ' + house().title + ' location on map'">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
          </svg>
        </button>
        
        <div class="absolute top-4 right-4 z-20">
          <span class="bg-emerald-500 text-white px-3 py-2 rounded-full text-sm md:text-sm font-semibold shadow-lg">
            {{ getStatusText() }}
          </span>
        </div>
        
        <!-- Currently Viewers Hover Overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-xl">
          <div class="text-white text-center">
            <div class="text-lg font-semibold">{{ translate('house.currentlyViewing') }}</div>
            <div class="text-2xl font-bold">{{ getCurrentViewers() }}</div>
          </div>
        </div>
      </div>

      <div class="relative p-6 md:p-6 flex flex-col flex-grow min-h-0 overflow-visible bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div class="flex-grow flex flex-col min-h-0 overflow-visible">
          <h3 class="text-2xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-4 md:mb-3 break-words leading-tight mobile-card-title">{{ house().title }}</h3>
          <p class="text-gray-700 dark:text-gray-200 text-lg md:text-base mb-4 md:mb-3 line-clamp-2 break-words leading-relaxed mobile-card-text">{{ translate('house.propertyOfYourOwn') }}</p>
          
          <div class="flex items-center justify-between mb-4 md:mb-3">
            <div class="flex items-center text-gray-600 dark:text-gray-300 text-2xl md:text-base min-w-0 flex-1 mr-2">
              <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="truncate">{{ house().location }}</span>
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

          <div class="mb-4 md:mb-3 space-y-2">
            <div class="flex justify-between text-2xl md:text-base text-gray-600 dark:text-gray-300 mobile-card-details">
              <span>{{ translate('house.city') }}</span>
              <span class="font-medium">{{ house().city || 'Manhattan' }}</span>
            </div>
            <div class="flex justify-between text-2xl md:text-base text-gray-600 dark:text-gray-300 mobile-card-details">
              <span>{{ translate('house.address') }}</span>
              <span class="font-medium">{{ house().address || '123 Park Ave' }}</span>
            </div>
          </div>

          <div class="mb-3 md:mb-2">
            <div class="flex justify-between text-2xl md:text-base text-gray-600 dark:text-gray-300 mb-3 md:mb-2 mobile-card-details">
              <span>{{ translate('house.odds') }}</span>
              <span>{{ getOdds() }}</span>
            </div>
            <div class="text-center text-xl md:text-base text-orange-600 dark:text-orange-400 font-semibold mobile-card-tickets">
              {{ getTicketsAvailableText() }}
            </div>
          </div>

          <div class="text-center mb-4 md:mb-3">
            <div class="text-2xl md:text-base text-gray-600 dark:text-gray-300">{{ translate('house.lotteryCountdown') }}</div>
            <div class="text-xl md:text-xl font-bold text-orange-600 dark:text-orange-400 mobile-card-time font-mono">{{ getLotteryCountdown() }}</div>
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
        font-size: 2.5rem !important;
        line-height: 1.3 !important;
      }
      
      .mobile-card-text {
        font-size: 1.75rem !important;
        line-height: 1.5 !important;
      }
      
      .mobile-card-price {
        font-size: 2.25rem !important;
      }
      
      .mobile-card-details {
        font-size: 1.75rem !important;
      }
      
      .mobile-card-button {
        font-size: 2rem !important;
        padding: 1.5rem 2rem !important;
        min-height: 80px !important;
      }
      
      .mobile-card-progress {
        height: 1rem !important;
      }
      
      .mobile-card-time {
        font-size: 2rem !important;
      }
      
      /* Override Tailwind text classes specifically for house cards */
      .text-gray-600,
      .text-gray-300 {
        font-size: 1.75rem !important;
      }
      
      .text-xl {
        font-size: 2.25rem !important;
      }
      
      .text-2xl {
        font-size: 2.5rem !important;
      }
      
      .text-base {
        font-size: 1.75rem !important;
      }
      
      .text-sm {
        font-size: 1.5rem !important;
      }
      
      /* Specific targeting for property details */
      .flex.items-center.justify-between {
        font-size: 1.75rem !important;
      }
      
      .flex.items-center.justify-between span {
        font-size: 1.75rem !important;
      }
      
      /* Target the specific property details section */
      .flex.items-center.justify-between.text-gray-600,
      .flex.items-center.justify-between.text-gray-300 {
        font-size: 1.75rem !important;
      }
      
      /* Target all spans within the details section */
      .flex.items-center.justify-between.text-gray-600 span,
      .flex.items-center.justify-between.text-gray-300 span {
        font-size: 1.75rem !important;
      }
      
      /* Target tickets sold section */
      .flex.justify-between.text-gray-600,
      .flex.justify-between.text-gray-300 {
        font-size: 1.75rem !important;
      }
      
      .flex.justify-between.text-gray-600 span,
      .flex.justify-between.text-gray-300 span {
        font-size: 1.75rem !important;
      }
      
      /* Target lottery ends section */
      .text-center.text-gray-600,
      .text-center.text-gray-300 {
        font-size: 1.75rem !important;
      }
      
      .text-center.text-gray-600 div,
      .text-center.text-gray-300 div {
        font-size: 1.75rem !important;
      }
      
      /* Target sign in text */
      .text-center p {
        font-size: 1.75rem !important;
      }
    }
  `]
})
export class HouseCardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  
  house = input.required<House>();
  private countdownInterval?: number;
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
      const result = await this.lotteryService.purchaseTicket({
        houseId: this.house().id,
        quantity: 1,
        paymentMethodId: 'default' // You'll need to implement payment method selection
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
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

  getOdds(): string {
    const totalTickets = this.house().totalTickets;
    return `1:${totalTickets.toLocaleString()}`;
  }

  getRemainingTickets(): number {
    return this.house().totalTickets - this.house().soldTickets;
  }

  formatLotteryDate(): string {
    return new Date(this.house().lotteryEndDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getCurrentViewers(): number {
    // Generate a random number of viewers between 5-50 for demo purposes
    return Math.floor(Math.random() * 46) + 5;
  }

  getTicketsAvailableText(): string {
    const remaining = this.getRemainingTickets();
    const template = this.translate('house.onlyTicketsAvailable');
    return template.replace('{count}', remaining.toLocaleString());
  }

  ngOnInit() {
    // Update countdown every second
    this.countdownInterval = window.setInterval(() => {
      // Force change detection by updating a property
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getLotteryCountdown(): string {
    const now = new Date().getTime();
    const endTime = new Date(this.house().lotteryEndDate).getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      return '00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Show seconds only when less than 24 hours left
    if (days === 0 && hours < 24) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  openLocationMap(): void {
    const house = this.house();
    const address = house.address || house.location || house.title;
    const city = house.city || 'New York';
    
    // Create a search query for Google Maps
    const searchQuery = encodeURIComponent(`${address}, ${city}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // Open in a new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    
    console.log(`Opening location map for: ${address}, ${city}`);
  }
}