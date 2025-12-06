import { Component, inject, input, ViewEncapsulation, OnInit, OnDestroy, AfterViewInit, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { House } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { HouseCardService } from '../../services/house-card.service';
import { HeartAnimationService } from '../../services/heart-animation.service';
import { ToastService } from '../../services/toast.service';
import { ProductService } from '../../services/product.service';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { VerificationGateComponent } from '../verification-gate/verification-gate.component';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule, VerificationGateComponent, PaymentModalComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-visible flex flex-col w-full h-full transform hover:scale-105">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"></div>
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>
      </div>
      

      <div class="relative h-64 md:h-64 bg-gray-200 flex-shrink-0 group">
        <div class="relative w-full h-full">
          <img 
            [src]="house().imageUrl" 
            [alt]="house().title"
            (error)="onImageError($event)"
            [class.thumbnail-upcoming]="house().status === 'upcoming'"
            [class.thumbnail-ended]="house().status === 'ended'"
            class="w-full h-full object-cover rounded-t-xl">
          <!-- Thumbnail overlay for status -->
          <div 
            *ngIf="house().status === 'upcoming'"
            class="absolute inset-0 bg-yellow-500 bg-opacity-15 dark:bg-yellow-400 dark:bg-opacity-10 rounded-t-xl pointer-events-none z-0">
          </div>
          <div 
            *ngIf="house().status === 'ended'"
            class="absolute inset-0 bg-gray-500 bg-opacity-30 dark:bg-gray-600 dark:bg-opacity-40 rounded-t-xl pointer-events-none z-0 thumbnail-ended-overlay">
          </div>
        </div>
        
        <!-- Location Icon - Red Circular (Standardized Size) -->
        <button 
          (click)="openLocationMap()"
          (keydown.enter)="openLocationMap()"
          (keydown.space)="openLocationMap(); $event.preventDefault()"
          class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none"
          [attr.aria-label]="'View ' + house().title + ' location on map'">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
          </svg>
        </button>
        
        <!-- Status Badge - Color based on status (Centered, Same Height as Icons) -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span 
            [class.animate-seesaw]="house().status === 'active' && vibrationTrigger()"
            [class.bg-emerald-500]="house().status === 'active'"
            [class.bg-yellow-500]="house().status === 'upcoming'"
            [class.bg-gray-500]="house().status === 'ended'"
            class="text-white px-6 py-3 rounded-[20px] text-base font-semibold shadow-lg whitespace-nowrap flex items-center h-12">
            {{ getStatusText() }}
          </span>
        </div>
        
        <!-- Favorite Button - Purple Circular (Same Size as Location Icon) -->
        <button
          *ngIf="currentUser()"
          (click)="toggleFavorite($event)"
          (keydown.enter)="toggleFavorite($event)"
          (keydown.space)="toggleFavorite($event); $event.preventDefault()"
          [disabled]="isTogglingFavorite || house().status === 'ended'"
          [class.animate-pulse]="isTogglingFavorite"
          [class.favorite-button-red-hover]="!isFavorite() && house().status !== 'ended'"
          [class.favorite-button-red-filled]="isFavorite() && house().status !== 'ended'"
          [class.favorite-button-ended]="house().status === 'ended'"
          class="absolute top-4 right-4 z-20 bg-purple-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          [class.hover:bg-purple-700]="house().status !== 'ended'"
          [class.bg-gray-400]="house().status === 'ended'"
          [class.cursor-not-allowed]="house().status === 'ended'"
          [attr.aria-label]="isFavorite() ? 'Remove from favorites' : 'Add to favorites'"
          [title]="isFavorite() ? translate(LOTTERY_TRANSLATION_KEYS.favorites.removeFromFavorites) : translate(LOTTERY_TRANSLATION_KEYS.favorites.addToFavorites)">
          <svg 
            class="w-6 h-6 transition-all duration-300 favorite-heart-icon"
            [class.text-red-500]="isFavorite()"
            [class.text-white]="!isFavorite()"
            [class.heart-beat]="isFavorite()"
            [attr.fill]="isFavorite() ? 'currentColor' : 'none'"
            [attr.stroke]="!isFavorite() ? 'currentColor' : 'none'"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true">
            <path 
              fill-rule="evenodd"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              clip-rule="evenodd">
            </path>
          </svg>
        </button>
        
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
            <div *ngIf="getLotteryCountdownLabel()" class="text-2xl md:text-base text-gray-600 dark:text-gray-300">{{ getLotteryCountdownLabel() }}</div>
            <div class="text-xl md:text-xl font-bold text-orange-600 dark:text-orange-400 mobile-card-time font-mono">{{ getLotteryCountdown() }}</div>
          </div>
        </div>

        <div class="mt-auto flex-shrink-0 space-y-2 overflow-visible">
          <ng-container *ngIf="currentUser(); else signInBlock">
            <app-verification-gate [isVerificationRequired]="true">
              <!-- Enter Now Button: Show when favorited (purple style, with lightning icon) -->
              <button
                *ngIf="isFavorite()"
                (click)="quickEntry()"
                (keydown.enter)="quickEntry()"
                (keydown.space)="quickEntry(); $event.preventDefault()"
                [disabled]="isQuickEntering || house().status !== 'active'"
                class="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white py-3 md:py-2 px-6 md:px-4 rounded-lg font-semibold transition-all duration-200 border-none cursor-pointer text-lg md:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none"
                [class.bg-gray-400]="(isQuickEntering || house().status !== 'active')"
                [class.cursor-not-allowed]="(isQuickEntering || house().status !== 'active')">
                <ng-container *ngIf="isQuickEntering; else quickEntryBlock">
                  {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.processing) }}
                </ng-container>
                <ng-template #quickEntryBlock>
                  ⚡ {{ translate(LOTTERY_TRANSLATION_KEYS.quickEntry.enterNow) }}
                </ng-template>
              </button>
              
              <!-- Regular Purchase Button: Show only when NOT favorited -->
              <button
                *ngIf="!isFavorite()"
                (click)="onBuyTicketClick($event)"
                (keydown.enter)="onBuyTicketClick($event)"
                (keydown.space)="onBuyTicketClick($event); $event.preventDefault()"
                [disabled]="isPurchasing || house().status === 'ended'"
                [class.buy-ticket-active-animation]="house().status === 'active' && !isPurchasing"
                [class.buy-ticket-ended]="house().status === 'ended'"
                class="w-full bg-blue-600 text-white py-5 md:py-3 px-6 md:px-6 rounded-lg font-bold transition-all duration-200 border-none cursor-pointer min-h-[64px] text-xl md:text-base disabled:bg-gray-400 disabled:cursor-not-allowed mobile-card-button focus:outline-none relative overflow-hidden"
                [class.hover:bg-blue-700]="house().status !== 'ended' && !isPurchasing"
                [class.dark:hover:bg-blue-600]="house().status !== 'ended' && !isPurchasing"
                [class.dark:bg-blue-700]="house().status !== 'ended' && !isPurchasing"
                [class.bg-gray-400]="house().status === 'ended' || isPurchasing"
                [class.cursor-not-allowed]="house().status === 'ended' || isPurchasing"
                [attr.aria-disabled]="(isPurchasing || house().status === 'ended') ? 'true' : 'false'"
                #buyTicketButton>
                <ng-container *ngIf="isPurchasing; else buyTicketBlock">
                  {{ translate('house.processing') }}
                </ng-container>
                <ng-template #buyTicketBlock>
                  <span class="relative z-10">{{ getBuyTicketButtonText() }}</span>
                </ng-template>
              </button>
            </app-verification-gate>
          </ng-container>
          <ng-template #signInBlock>
            <div class="text-center">
              <p class="text-2xl md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-3 mobile-card-text">{{ translate('house.signInToParticipate') }}</p>
              <div class="text-xl md:text-xl font-bold text-blue-600 dark:text-blue-400 mobile-card-price">€{{ house().ticketPrice }} {{ translate('house.perTicket') }}</div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <app-payment-modal
          [productId]="currentProductId() || house().productId || ''"
          [quantity]="1"
          [houseTitle]="house().title"
          (close)="closePaymentModal()"
          (paymentSuccess)="onPaymentSuccess($event)">
        </app-payment-modal>
      }
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
      
      /* Animation: rotates like a seesaw board, one end up while other end down, then reverses */
      @keyframes seesaw {
        0%, 100% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(-4deg);
        }
        50% {
          transform: rotate(0deg);
        }
        75% {
          transform: rotate(4deg);
        }
      }
      
      .animate-seesaw {
        animation: seesaw 0.3s ease-in-out;
        animation-iteration-count: 2;
        transform-origin: center center;
      }
      
      /* Red hover glow for favorites button - around the heart icon */
      .favorite-button-red-hover:hover .favorite-heart-icon {
        filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 24px rgba(239, 68, 68, 0.4));
      }
      
      .favorite-button-red-filled .favorite-heart-icon {
        filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.7)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.5)) drop-shadow(0 0 18px rgba(239, 68, 68, 0.3));
      }
      
      /* Beating heart animation for favorited items */
      @keyframes heart-beat {
        0%, 100% {
          transform: scale(1);
        }
        25% {
          transform: scale(1.1);
        }
        50% {
          transform: scale(1);
        }
        75% {
          transform: scale(1.1);
        }
      }
      
      .heart-beat {
        animation: heart-beat 1.5s ease-in-out infinite;
        transform-origin: center center;
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
      
      /* Active buy ticket button border glow animation (continuous loop around border) */
      /* Creates a moving glow effect that travels around the button perimeter like a chasing tail */
      .buy-ticket-active-animation {
        position: relative;
        overflow: hidden;
        border-radius: 0.5rem;
      }

      .buy-ticket-active-animation::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: conic-gradient(
          from 0deg,
          rgba(251, 146, 60, 0.8),
          rgba(251, 146, 60, 1),
          rgba(251, 146, 60, 0.8),
          rgba(251, 146, 60, 0.4),
          rgba(251, 146, 60, 0.8),
          rgba(251, 146, 60, 1),
          rgba(251, 146, 60, 0.8)
        );
        border-radius: 0.5rem;
        z-index: -2;
        animation: buy-ticket-border-rotate 4s linear infinite;
      }
      
      .buy-ticket-active-animation::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: rgb(37, 99, 235); /* bg-blue-600 explicit color */
        border-radius: calc(0.5rem - 2px);
        z-index: -1;
      }
      
      .dark .buy-ticket-active-animation::after {
        background: rgb(29, 78, 216); /* dark:bg-blue-700 */
      }
      
      /* Handle disabled/purchasing state - ensure background matches */
      .buy-ticket-active-animation.bg-gray-400::after {
        background: rgb(156, 163, 175); /* bg-gray-400 */
      }
      
      @keyframes buy-ticket-border-rotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
      /* Button content already has z-10 class (Tailwind), no need to override */
      .buy-ticket-active-animation > * {
        position: relative;
        /* z-index handled by Tailwind z-10 class on content */
      }
      
      .buy-ticket-ended {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        background-color: #9ca3af !important;
        pointer-events: none !important;
      }
      
      .buy-ticket-ended:hover {
        background-color: #9ca3af !important;
        opacity: 0.6 !important;
      }
      
      .buy-ticket-ended:disabled {
        background-color: #9ca3af !important;
        opacity: 0.6 !important;
        cursor: not-allowed !important;
      }
      
      .favorite-button-ended {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        background-color: #9ca3af !important;
        pointer-events: none !important;
      }
      
      .favorite-button-ended:hover {
        background-color: #9ca3af !important;
        opacity: 0.5 !important;
      }
    }
  `]
})
export class HouseCardComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private houseCardService = inject(HouseCardService);
  private heartAnimationService = inject(HeartAnimationService);
  private toastService = inject(ToastService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private verificationService = inject(IdentityVerificationService, { optional: true });
  
  // Make LOTTERY_TRANSLATION_KEYS available in template
  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;
  
  house = input.required<House>();
  isFavoritesPage = input<boolean>(false);
  private vibrationInterval?: number;
  private countdownInterval?: number;
  isPurchasing = false;
  isTogglingFavorite = false;
  isQuickEntering = false;
  showPaymentModal = signal(false);
  currentProductId = signal<string | null>(null); // Store productId for payment modal
  
  @ViewChild('buyTicketButton', { static: false }) buyTicketButton?: ElementRef<HTMLButtonElement>;
  
  // Get current user DTO for verification status
  currentUserDto = this.authService.getCurrentUserDto();
  
  // Debug logging helper - works in both dev and production
  private debugLog(location: string, message: string, data: any, hypothesisId: string) {
    const logData = {
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId
    };
    // Always log to console.error (kept in production)
    console.error('[DEBUG]', logData);
    // Also try to send to debug endpoint (works in local dev)
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {});
    }
  }
  
  currentUser = this.authService.getCurrentUser();
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  
  // Use signals for dynamic values to prevent change detection errors
  currentViewers = signal<number>(Math.floor(Math.random() * 46) + 5);
  private _vibrationTrigger = signal<number>(0);
  vibrationTrigger = computed(() => this._vibrationTrigger() > 0);
  currentTime = signal<number>(Date.now()); // Signal for countdown updates
  
  // Computed signal to check if this house is favorited
  isFavorite = computed(() => {
    return this.favoriteHouseIds().includes(this.house().id);
  });
  
  // Computed signal to detect if we're on the favorites page (auto-detect from route or use input)
  isOnFavoritesPage = computed(() => {
    // If input is explicitly provided, use it
    if (this.isFavoritesPage() !== false) {
      return this.isFavoritesPage();
    }
    // Otherwise, auto-detect from current route
    return this.router.url.includes('/lottery/favorites');
  });

  formatPrice(price: number): string {
    return this.houseCardService.formatPrice(price);
  }

  formatSqft(sqft: number): string {
    return this.houseCardService.formatSqft(sqft);
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
    const house = this.house();
    if (!house || !house.lotteryEndDate) return this.translate('house.ended');
    const endDate = new Date(house.lotteryEndDate);
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

  onBuyTicketClick(event: Event) {
    // #region agent log
    this.debugLog(
      'house-card.component.ts:onBuyTicketClick',
      'Button click handler called',
      {
        eventType: event.type,
        hasUser: !!this.currentUser(),
        userId: this.currentUser()?.id,
        isPurchasing: this.isPurchasing,
        houseId: this.house()?.id,
        houseStatus: this.house()?.status,
        houseStatusLower: this.house()?.status?.toLowerCase(),
        isFavorite: this.isFavorite(),
        buttonDisabled: (event.target as HTMLButtonElement)?.disabled
      },
      'A'
    );
    // #endregion
    
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // #region agent log
    this.debugLog(
      'house-card.component.ts:onBuyTicketClick',
      'After event preventDefault - checking user',
      {
        currentUser: this.currentUser(),
        currentUserIsAuthenticated: this.currentUser()?.isAuthenticated
      },
      'B'
    );
    // #endregion
    
    // Check if user is verified (verification gate check)
    // Note: Verification gate wraps the button but doesn't intercept clicks
    // We need to manually check verification status here
    if (!this.currentUser()) {
      // #region agent log
      this.debugLog(
        'house-card.component.ts:onBuyTicketClick',
        'No user - returning early',
        {},
        'B'
      );
      // #endregion
      this.toastService.error('Please sign in to purchase tickets', 3000);
      return;
    }
    
    // Always call purchaseTicket, let it handle validation
    this.purchaseTicket();
  }

  async purchaseTicket() {
    // #region agent log
    this.debugLog(
      'house-card.component.ts:purchaseTicket',
      'purchaseTicket method entry',
      {
        hasUser: !!this.currentUser(),
        isPurchasing: this.isPurchasing,
        houseId: this.house()?.id,
        houseStatus: this.house()?.status
      },
      'A,B,C'
    );
    // #endregion

    if (!this.currentUser()) {
      // #region agent log
      this.debugLog(
        'house-card.component.ts:purchaseTicket',
        'No user - returning early',
        {},
        'B'
      );
      // #endregion
      this.toastService.error('Please sign in to purchase tickets', 3000);
      return;
    }

    if (this.isPurchasing) {
      // #region agent log
      this.debugLog(
        'house-card.component.ts:purchaseTicket',
        'Already purchasing - returning early',
        {},
        'E'
      );
      // #endregion
      return;
    }

    const house = this.house();
    if (!house) {
      // #region agent log
      this.debugLog(
        'house-card.component.ts:purchaseTicket',
        'No house data - returning early',
        {},
        'C'
      );
      // #endregion
      this.toastService.error('House data not available', 3000);
      return;
    }

    // Check house status (case-insensitive)
    const houseStatus = house.status?.toLowerCase();
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'house-card.component.ts:purchaseTicket',
          message: 'House status check',
          data: {
            originalStatus: house.status,
            lowercasedStatus: houseStatus,
            statusMatch: houseStatus === 'active',
            statusType: typeof house.status,
            statusLength: house.status?.length
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
    }
    // #endregion
    if (houseStatus !== 'active') {
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'house-card.component.ts:purchaseTicket',
            message: 'House status not active - returning early',
            data: {
              originalStatus: house.status,
              lowercasedStatus: houseStatus
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
          })
        }).catch(() => {});
      }
      // #endregion
      this.toastService.error('This lottery is not currently active', 3000);
      return;
    }

    // Check verification status (verification gate check)
    if (this.verificationService) {
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'house-card.component.ts:purchaseTicket',
            message: 'Starting verification check',
            data: {
              verificationServiceExists: !!this.verificationService
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D'
          })
        }).catch(() => {});
      }
      // #endregion
      try {
        const verificationStatus = await firstValueFrom(this.verificationService.getVerificationStatus());
        // #region agent log
        if (typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'house-card.component.ts:purchaseTicket',
              message: 'Verification status received',
              data: {
                verificationStatus: verificationStatus?.verificationStatus,
                identityVerificationStatus: verificationStatus?.verificationStatus,
                userVerificationStatus: this.currentUserDto()?.verificationStatus,
                isVerified: verificationStatus?.verificationStatus === 'verified' || 
                           this.currentUserDto()?.verificationStatus === 'IdentityVerified' ||
                           this.currentUserDto()?.verificationStatus === 'FullyVerified'
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'D'
            })
          }).catch(() => {});
        }
        // #endregion
        
        // Check both identity verification status AND user profile verification status
        const identityVerified = verificationStatus?.verificationStatus === 'verified';
        const userVerificationStatus = this.currentUserDto()?.verificationStatus;
        const userFullyVerified = userVerificationStatus === 'IdentityVerified' || userVerificationStatus === 'FullyVerified';
        const isVerified = identityVerified || userFullyVerified;
        
        if (!isVerified) {
          // #region agent log
          this.debugLog(
            'house-card.component.ts:purchaseTicket',
            'User not verified - blocking purchase',
            {
              identityVerificationStatus: verificationStatus?.verificationStatus,
              userVerificationStatus: userVerificationStatus,
              identityVerified: identityVerified,
              userFullyVerified: userFullyVerified,
              isVerified: isVerified,
              currentUserDtoExists: !!this.currentUserDto(),
              currentUserDto: this.currentUserDto(),
              requiresIdentityVerification: userVerificationStatus === 'EmailVerified' || userVerificationStatus === 'Unverified'
            },
            'D'
          );
          // #endregion
          
          // Provide more specific error message based on verification status
          let errorMessage = this.translationService.translate('auth.verificationRequired');
          if (userVerificationStatus === 'EmailVerified') {
            // User has verified email but needs identity verification
            errorMessage = this.translationService.translate('auth.identityVerificationRequired') || 
                         'Identity verification required to purchase tickets. Please complete identity verification in your account settings.';
          }
          
          this.toastService.error(errorMessage, 5000);
          this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
          return;
        }
      } catch (error: any) {
        // #region agent log
        if (typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'house-card.component.ts:purchaseTicket',
              message: 'Verification check error',
              data: {
                error: error?.message,
                errorStatus: error?.status,
                errorVerificationStatus: error?.error?.verificationStatus
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'D'
            })
          }).catch(() => {});
        }
        // #endregion
        
        // If verification check fails, check user profile verification status as fallback
        const userVerificationStatusFallback = this.currentUserDto()?.verificationStatus;
        const userFullyVerifiedFallback = userVerificationStatusFallback === 'IdentityVerified' || userVerificationStatusFallback === 'FullyVerified';
        
        // #region agent log
        this.debugLog(
          'house-card.component.ts:purchaseTicket',
          'Verification check error - checking user profile as fallback',
          {
            error: error?.message,
            errorStatus: error?.status,
            errorVerificationStatus: error?.error?.verificationStatus,
            userVerificationStatusFallback: userVerificationStatusFallback,
            userFullyVerifiedFallback: userFullyVerifiedFallback
          },
          'D'
        );
        // #endregion
        
        // Only block if we get a clear "not verified" response AND user profile is not verified
        if ((error?.error?.verificationStatus === 'not_verified' || error?.error?.verificationStatus === 'pending') && !userFullyVerifiedFallback) {
          this.toastService.error(this.translationService.translate('auth.verificationRequired'), 4000);
          this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
          return;
        }
        
        // If user profile shows verified, allow purchase even if identity endpoint failed
        if (userFullyVerifiedFallback) {
          // #region agent log
          this.debugLog(
            'house-card.component.ts:purchaseTicket',
            'Identity endpoint failed but user profile shows verified - allowing purchase',
            {
              userVerificationStatusFallback: userVerificationStatusFallback
            },
            'D'
          );
          // #endregion
          // Continue with purchase - user is verified according to profile
        }
      }
    }

    // Fetch product ID if not available (on-demand for performance)
    let productId = house.productId;
    console.log('Product ID from house:', productId);
    
    if (!productId) {
      try {
        this.isPurchasing = true;
        console.log('Fetching product for house:', house.id);
        const product = await firstValueFrom(this.productService.getProductByHouseId(house.id));
        console.log('Product fetched:', product);
        if (product?.id) {
          productId = product.id;
        } else {
          throw new Error('Product not found');
        }
      } catch (error: any) {
        console.error('Error fetching product for house:', error);
        this.toastService.error('Product not available for this house. Please try again later.', 5000);
        // Don't use fallback - payment modal is the correct flow
        // If product fetch fails, user should refresh and try again
        this.isPurchasing = false;
        return;
      } finally {
        this.isPurchasing = false;
      }
    }

    // Ensure productId is set before showing modal
    if (!productId) {
      console.error('Product ID is still null after fetch attempt');
      this.toastService.error('Product not available for this house. Please try again later.', 5000);
      return;
    }

    // Store productId for payment modal
    this.currentProductId.set(productId);
    
    // Show payment modal with product ID
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.currentProductId.set(null); // Clear productId when modal closes
  }

  async onPaymentSuccess(event: { paymentIntentId: string; transactionId?: string }) {
    this.showPaymentModal.set(false);
    
    // Payment was successful - webhook will create tickets
    // Show success message
    this.toastService.success('Payment successful! Your tickets will be created shortly.', 5000);
    
    // Refresh house data to show updated ticket counts
    // The webhook will create tickets and publish TicketPurchasedEvent
    // SignalR will update the UI automatically
  }

  // Fallback method for direct purchase (if product ID not available)
  private async purchaseTicketDirect() {
    this.isPurchasing = true;
    
    try {
      const house = this.house();
      if (!house) return;
      const result = await firstValueFrom(this.lotteryService.purchaseTicket({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default' // Fallback to direct purchase
      }));
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(`Successfully purchased ${result.ticketsPurchased} ticket(s)!`, 3000);
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
      }
    } catch (error: any) {
      // Suppress errors for 200 status (response format issues, not actual errors)
      if (error?.status !== 200) {
        console.error('Error purchasing ticket:', error);
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
      }
      // Check if it's a verification error
      if (error?.error?.error?.code === 'ID_VERIFICATION_REQUIRED' || 
          error?.error?.message?.includes('ID_VERIFICATION_REQUIRED')) {
        // Verification gate will handle showing the message
        // User will see the gate component
      }
    } finally {
      this.isPurchasing = false;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getOdds(): string {
    return this.houseCardService.getOdds(this.house());
  }

  getRemainingTickets(): number {
    const house = this.house();
    return house.totalTickets - house.soldTickets;
  }

  formatLotteryDate(): string {
    const house = this.house();
    if (!house || !house.lotteryEndDate) return '';
    return this.houseCardService.formatLotteryDate(house.lotteryEndDate);
  }

  getCurrentViewers(): number {
    return this.currentViewers();
  }

  getTicketsAvailableText(): string {
    return this.houseCardService.getTicketsAvailableText(this.house());
  }

  ngAfterViewInit() {
    // #region agent log
    if (typeof fetch !== 'undefined' && this.buyTicketButton) {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'house-card.component.ts:ngAfterViewInit',
          message: 'Button element state after view init',
          data: {
            buttonExists: !!this.buyTicketButton,
            buttonDisabled: this.buyTicketButton?.nativeElement?.disabled,
            buttonAriaDisabled: this.buyTicketButton?.nativeElement?.getAttribute('aria-disabled'),
            houseStatus: this.house()?.status,
            isPurchasing: this.isPurchasing
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,E'
        })
      }).catch(() => {});
    }
    // #endregion
  }

  ngOnInit() {
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'house-card.component.ts:ngOnInit',
          message: 'Component initialized - button state check',
          data: {
            houseId: this.house()?.id,
            houseStatus: this.house()?.status,
            isFavorite: this.isFavorite(),
            hasUser: !!this.currentUser(),
            isPurchasing: this.isPurchasing
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B,C,D,E'
        })
      }).catch(() => {});
    }
    // #endregion
    // Start seesaw animation for active status badges (every 5 seconds)
    this.vibrationInterval = window.setInterval(() => {
      if (this.house().status === 'active') {
        // Trigger animation by updating signal
        this._vibrationTrigger.set(Date.now());
        // Remove animation class after animation completes (600ms - 2 iterations × 0.3s)
        setTimeout(() => {
          this._vibrationTrigger.set(0);
        }, 600);
      }
    }, 5000);
    
    // Trigger initial animation if active
    if (this.house().status === 'active') {
      setTimeout(() => {
        this._vibrationTrigger.set(Date.now());
        setTimeout(() => {
          this._vibrationTrigger.set(0);
        }, 600);
      }, 1000);
    }

    // Update countdown every second
    this.countdownInterval = window.setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getLotteryCountdownLabel(): string {
    const house = this.house();
    if (!house) return '';
    
    if (house.status === 'ended') {
      return ''; // No label for ended
    }
    
    if (house.status === 'upcoming' && house.lotteryStartDate) {
      return this.translate('house.lotteryStartsIn') || 'Lottery starts in';
    }
    
    return this.translate('house.lotteryCountdown');
  }

  getBuyTicketButtonText(): string {
    const house = this.house();
    if (!house) return this.translate('house.buyTicket');
    
    if (house.status === 'ended') {
      return this.translate('house.ended') || 'Ended';
    }
    
    if (house.status === 'upcoming') {
      return this.translate('house.reserveTicket') || 'Reserve Ticket';
    }
    
    return `${this.translate('house.buyTicket')} - €${house.ticketPrice}`;
  }

  getLotteryCountdown(): string {
    const house = this.house();
    if (!house) return '00:00:00:00';
    
    // For ended status, just return "Ended"
    if (house.status === 'ended') {
      return this.translate('house.ended') || 'Ended';
    }
    
    // For upcoming, use lotteryStartDate if available
    const targetDate = house.status === 'upcoming' && house.lotteryStartDate 
      ? new Date(house.lotteryStartDate)
      : house.lotteryEndDate 
        ? new Date(house.lotteryEndDate)
        : null;
    
    if (!targetDate) return '00:00:00:00';
    
    const now = this.currentTime();
    const timeLeft = targetDate.getTime() - now;

    if (timeLeft <= 0) {
      return house.status === 'upcoming' 
        ? (this.translate('house.ended') || 'Ended')
        : '00:00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Format: DD:HH:MM:SS (always show days, hours, minutes, seconds)
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    
    if (!this.currentUser() || this.isTogglingFavorite) {
      return;
    }

    this.isTogglingFavorite = true;
    
    // Get source button for animation
    const sourceButton = event?.target ? (event.target as HTMLElement).closest('button') : null;
    
    try {
      const house = this.house();
      if (!house) return;
      const result = await firstValueFrom(this.lotteryService.toggleFavorite(house.id));
      
      if (result) {
        // State is automatically updated by LotteryService
        console.log(result.message || (result.added ? 'Added to favorites' : 'Removed from favorites'));
        
        // Trigger heart animation when adding to favorites
        if (result.added && sourceButton) {
          this.triggerHeartAnimation(sourceButton);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // TODO: Show error toast notification
    } finally {
      this.isTogglingFavorite = false;
    }
  }
  
  /**
   * Trigger heart animation from button to favorites tab
   */
  private triggerHeartAnimation(sourceButton: HTMLElement): void {
    // Find favorites button in topbar
    let favoritesElement: HTMLElement | null = null;
    
    // Try to find by text content in button
    const navButtons = document.querySelectorAll('nav button');
    for (let i = 0; i < navButtons.length; i++) {
      const btn = navButtons[i] as HTMLElement;
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('favorite') || text.includes('favourites')) {
        favoritesElement = btn;
        break;
      }
    }
    
    if (!favoritesElement) {
      // Try aria-label
      favoritesElement = document.querySelector('button[aria-label*="favorite" i]') as HTMLElement;
    }
    
    if (favoritesElement && sourceButton) {
      this.heartAnimationService.animateHeart({
        fromElement: sourceButton,
        toElement: favoritesElement
      });
    }
  }

  /**
   * Quick entry from favorites
   */
  async quickEntry(): Promise<void> {
    // Verification check is handled by backend and verification gate component
    if (!this.currentUser() || this.isQuickEntering || !this.isFavorite()) {
      return;
    }

    this.isQuickEntering = true;
    
    try {
      const house = this.house();
      if (!house) return;
      const result = await firstValueFrom(this.lotteryService.quickEntryFromFavorite({
        houseId: house.id,
        quantity: 1, // API contract specifies "quantity", matches backend [JsonPropertyName("quantity")]
        paymentMethodId: 'default' // TODO: Get from user preferences or payment service
      }));
      
      if (result && result.ticketsPurchased > 0) {
        console.log('Quick entry successful!', result);
        // TODO: Show success toast notification
      }
    } catch (error) {
      console.error('Error with quick entry:', error);
      // TODO: Show error toast notification
    } finally {
      this.isQuickEntering = false;
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Set fallback placeholder image
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.classList.add('opacity-100');
    // Don't log warnings for missing images - they're handled gracefully
  }
}