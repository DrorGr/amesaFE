import { Component, inject, input, ViewEncapsulation, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { House, HouseDto } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { WatchlistService } from '../../services/watchlist.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col w-full transform hover:scale-105">
      <!-- Clickable overlay for navigation -->
      <a
        [routerLink]="['/house', house().id]"
        class="absolute inset-0 z-0"
        [attr.aria-label]="'View details for ' + house().title">
      </a>
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
        
        <!-- Favorite Button (Always visible) -->
        <button
          (click)="toggleFavorite($event)"
          [class.animate-pulse]="isTogglingFavorite"
          class="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
          [attr.aria-label]="isFavorite() ? 'Remove from favorites' : 'Add to favorites'"
          [title]="isFavorite() ? translate(LOTTERY_TRANSLATION_KEYS.favorites.removeFromFavorites) : translate(LOTTERY_TRANSLATION_KEYS.favorites.addToFavorites)">
          <svg 
            class="w-5 h-5 transition-all duration-300"
            [class.text-red-500]="isFavorite()"
            [class.text-gray-400]="!isFavorite()"
            [class.fill-current]="isFavorite()"
            [class.stroke-current]="!isFavorite()"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              [attr.d]="isFavorite() ? 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' : 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'">
            </path>
          </svg>
        </button>

        <!-- Watchlist Button -->
        <button
          *ngIf="currentUser()"
          (click)="toggleWatchlist($event)"
          [class.animate-pulse]="isTogglingWatchlist"
          class="absolute top-16 right-4 z-20 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
          [attr.aria-label]="isInWatchlist() ? 'Remove from watchlist' : 'Add to watchlist'"
          [title]="isInWatchlist() ? translate('watchlist.remove') : translate('watchlist.add')">
          <svg 
            class="w-5 h-5 transition-all duration-300"
            [class.text-blue-500]="isInWatchlist()"
            [class.text-gray-400]="!isInWatchlist()"
            fill="currentColor" 
            viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
          </svg>
        </button>
        
        <div class="absolute top-28 right-4 z-20">
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

          <!-- Participant Stats (if maxParticipants is set) -->
          <div *ngIf="houseDto()?.maxParticipants" class="mb-4 md:mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {{ translateWithParams('participants.count', { count: houseDto()?.uniqueParticipants || 0 }) }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mb-2">
              {{ translateWithParams('participants.maxParticipants', { max: houseDto()?.maxParticipants }) }}
            </div>
            <div *ngIf="houseDto()?.isParticipantCapReached" class="text-xs text-red-600 dark:text-red-400">
              {{ translate('participants.capReached') }}
            </div>
            <div *ngIf="houseDto()?.remainingParticipantSlots !== undefined && houseDto()?.remainingParticipantSlots !== null && houseDto()?.remainingParticipantSlots! > 0" class="text-xs text-green-600 dark:text-green-400">
              {{ translateWithParams('participants.remainingSlots', { count: houseDto()?.remainingParticipantSlots! }) }}
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

        <div class="mt-auto flex-shrink-0 space-y-2">
          <ng-container *ngIf="currentUser(); else signInBlock">
            <!-- Quick Entry Button (only show if favorited) -->
            <button
              *ngIf="isFavorite()"
              (click)="quickEntry()"
              [disabled]="isQuickEntering || house().status !== 'active'"
              class="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white py-3 md:py-2 px-6 md:px-4 rounded-lg font-semibold transition-all duration-200 border-none cursor-pointer text-lg md:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              [class.bg-gray-400]="(isQuickEntering || house().status !== 'active')"
              [class.cursor-not-allowed]="(isQuickEntering || house().status !== 'active')">
              <ng-container *ngIf="isQuickEntering; else quickEntryBlock">
                {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.processing) }}
              </ng-container>
              <ng-template #quickEntryBlock>
                ⚡ {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.enterNow) }}
              </ng-template>
            </button>
            
            <!-- Regular Purchase Button -->
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
  private watchlistService = inject(WatchlistService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  house = input.required<House>();
  private countdownInterval?: number;
  isPurchasing = false;
  isTogglingFavorite = false;
  isTogglingWatchlist = false;
  isQuickEntering = false;
  
  currentUser = this.authService.getCurrentUser();
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  watchlistItems = this.watchlistService.getWatchlistSignal();
  houseDto = signal<HouseDto | null>(null);
  canEnter = signal<boolean>(true);
  isExistingParticipant = signal<boolean>(false);
  
  // Use signals for dynamic values to prevent change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  currentTime = signal<number>(Date.now());
  
  // Computed signal to check if this house is favorited
  isFavorite = computed(() => {
    return this.favoriteHouseIds().includes(this.house().id);
  });

  // Computed signal to check if this house is in watchlist
  isInWatchlist = computed(() => {
    return this.watchlistItems().some(item => item.houseId === this.house().id);
  });

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
    if (!this.currentUser() || !this.currentUser()?.isAuthenticated) {
      this.toastService.error('Please log in to purchase tickets.', 4000);
      return;
    }
    
    if (this.isPurchasing) {
      return;
    }

    // Check if user can enter (participant cap check)
    if (!this.canEnter() && !this.isExistingParticipant()) {
      this.toastService.error('Participant cap reached for this lottery.', 4000);
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
        this.toastService.success(`Successfully purchased ${result.ticketsPurchased} ticket(s)!`, 3000);
        // Refresh can enter status
        this.checkCanEnter();
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
      }
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      // Check if it's a verification error
      if (error?.error?.error?.code === 'ID_VERIFICATION_REQUIRED' || 
          error?.error?.message?.includes('ID_VERIFICATION_REQUIRED') ||
          error?.error?.message?.includes('verification')) {
        this.toastService.error('Please validate your account to purchase tickets.', 4000);
      }
      // Check if it's a participant cap error
      else if (error?.error?.error?.code === 'PARTICIPANT_CAP_REACHED') {
        this.canEnter.set(false);
        this.toastService.error('Participant cap reached for this lottery.', 4000);
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
      }
    } finally {
      this.isPurchasing = false;
    }
  }

  /**
   * Toggle watchlist status for this house
   */
  async toggleWatchlist(event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.currentUser() || this.isTogglingWatchlist) {
      return;
    }

    this.isTogglingWatchlist = true;
    
    try {
      if (this.isInWatchlist()) {
        await this.watchlistService.removeFromWatchlist(this.house().id).toPromise();
      } else {
        await this.watchlistService.addToWatchlist(this.house().id, true).toPromise();
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      // TODO: Show error toast notification
    } finally {
      this.isTogglingWatchlist = false;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    let translation = this.translationService.translate(key);
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
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
    return this.currentViewers();
  }

  getTicketsAvailableText(): string {
    const remaining = this.getRemainingTickets();
    const template = this.translate('house.onlyTicketsAvailable');
    return template.replace('{count}', remaining.toLocaleString());
  }

  ngOnInit() {
    // Update countdown every second
    this.countdownInterval = window.setInterval(() => {
      this.currentTime.set(Date.now());
      // Occasionally update viewers count (every 3-5 seconds)
      if (Math.random() < 0.2) {
        this.currentViewers.set(Math.floor(Math.random() * 46) + 5);
      }
    }, 1000);

    // Load house DTO and participant stats if user is authenticated
    if (this.currentUser()) {
      this.loadHouseDetails();
      this.checkCanEnter();
    }
  }

  loadHouseDetails(): void {
    // Load house details with participant stats
    this.lotteryService.getHouseById(this.house().id).subscribe({
      next: (houseDto) => {
        this.houseDto.set(houseDto);
      },
      error: (error) => {
        console.error('Error loading house details:', error);
      }
    });
  }

  checkCanEnter(): void {
    this.lotteryService.canEnterLottery(this.house().id).subscribe({
      next: (response) => {
        this.canEnter.set(response.canEnter);
        this.isExistingParticipant.set(response.isExistingParticipant);
      },
      error: (error) => {
        console.error('Error checking if can enter:', error);
        this.canEnter.set(true); // Default to allowing entry on error
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getLotteryCountdown(): string {
    const now = this.currentTime();
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

  /**
   * Toggle favorite status for this house
   */
  async toggleFavorite(event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Check if user is logged in
    if (!this.currentUser() || !this.currentUser()?.isAuthenticated) {
      this.toastService.error('Please log in to add favorites.', 4000);
      return;
    }
    
    if (this.isTogglingFavorite) {
      return;
    }

    this.isTogglingFavorite = true;
    
    try {
      // Check if already in favorites
      const isCurrentlyFavorite = this.isFavorite();
      
      const result = await this.lotteryService.toggleFavorite(this.house().id).toPromise();
      
      if (result) {
        // State is automatically updated by LotteryService
        if (result.added) {
          this.toastService.success('Added to favorites!', 3000);
        } else {
          this.toastService.success('Removed from favorites', 3000);
        }
      } else if (isCurrentlyFavorite) {
        // Already in favorites - this shouldn't happen, but handle gracefully
        this.toastService.info('Already in favorites', 2000);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      // Check if error is because already in favorites
      if (error?.error?.message?.includes('already') || error?.error?.message?.includes('favorite')) {
        this.toastService.info('Already in favorites', 2000);
      } else {
        this.toastService.error('Failed to update favorites. Please try again.', 4000);
      }
    } finally {
      this.isTogglingFavorite = false;
    }
  }

  /**
   * Quick entry from favorites
   */
  async quickEntry(): Promise<void> {
    if (!this.currentUser() || !this.currentUser()?.isAuthenticated) {
      this.toastService.error('Please log in to enter the lottery.', 4000);
      return;
    }
    
    if (this.isQuickEntering || !this.isFavorite()) {
      return;
    }

    this.isQuickEntering = true;
    
    try {
      const result = await this.lotteryService.quickEntryFromFavorite({
        houseId: this.house().id,
        quantity: 1, // API contract specifies "quantity", matches backend [JsonPropertyName("quantity")]
        paymentMethodId: 'default' // TODO: Get from user preferences or payment service
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(`Quick entry successful! Purchased ${result.ticketsPurchased} ticket(s).`, 3000);
      } else {
        this.toastService.error('Failed to complete quick entry. Please try again.', 4000);
      }
    } catch (error: any) {
      console.error('Error with quick entry:', error);
      // Check if it's a verification error
      if (error?.error?.error?.code === 'ID_VERIFICATION_REQUIRED' || 
          error?.error?.message?.includes('ID_VERIFICATION_REQUIRED') ||
          error?.error?.message?.includes('verification')) {
        this.toastService.error('Please validate your account to enter the lottery.', 4000);
      } else {
        this.toastService.error('Failed to complete quick entry. Please try again.', 4000);
      }
    } finally {
      this.isQuickEntering = false;
    }
  }
}