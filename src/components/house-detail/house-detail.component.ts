import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LotteryService } from '../../services/lottery.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { HouseDto } from '../../models/house.model';
import { LOTTERY_TRANSLATION_KEYS } from '../../constants/lottery-translation-keys';
import { VerificationGateComponent } from '../verification-gate/verification-gate.component';

@Component({
  selector: 'app-house-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VerificationGateComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <!-- Loading State -->
      <ng-container *ngIf="isLoading()">
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">{{ translate('common.loading') }}</p>
          </div>
        </div>
      </ng-container>

      <!-- Error State -->
      <ng-container *ngIf="error() && !isLoading()">
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center max-w-md mx-auto p-8">
            <div class="text-6xl mb-4">🏠</div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('house.notFound') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error() }}</p>
            <button
              (click)="router.navigate(['/'])"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {{ translate('common.backToHome') }}
            </button>
          </div>
        </div>
      </ng-container>

      <!-- House Detail Content -->
      <ng-container *ngIf="house() && !isLoading() && !error()">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Back Button -->
          <button
            (click)="router.navigate(['/'])"
            class="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            {{ translate('common.back') }}
          </button>

          <!-- Image Gallery -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <!-- Main Image -->
              <div class="md:col-span-2">
                <img
                  [src]="selectedImage() || (house()!.images && house()!.images.length > 0 ? house()!.images[0].imageUrl : '')"
                  [alt]="house()!.title"
                  class="w-full h-96 object-cover rounded-lg">
              </div>
              <!-- Thumbnail Images -->
              <div
                *ngFor="let image of (house()!.images || []).slice(0, 4)"
                (click)="selectedImage.set(image.imageUrl)"
                class="cursor-pointer border-2 rounded-lg overflow-hidden transition-all"
                [class.border-blue-500]="selectedImage() === image.imageUrl"
                [class.border-transparent]="selectedImage() !== image.imageUrl">
                <img
                  [src]="image.imageUrl"
                  [alt]="image.altText || house()!.title"
                  class="w-full h-24 object-cover">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Title and Location -->
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {{ house()!.title }}
                    </h1>
                    <div class="flex items-center text-gray-600 dark:text-gray-400">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{{ house()!.location }}</span>
                    </div>
                    <p *ngIf="house()!.address" class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {{ house()!.address }}
                    </p>
                  </div>
                  <!-- Favorite Button -->
                  <button
                    *ngIf="currentUser()"
                    (click)="toggleFavorite()"
                    [class.animate-pulse]="isTogglingFavorite()"
                    class="p-3 rounded-full transition-all duration-300"
                    [class.bg-red-100]="isFavorite()"
                    [class.bg-gray-100]="!isFavorite()"
                    [class.dark:bg-red-900]="isFavorite()"
                    [class.dark:bg-gray-700]="!isFavorite()">
                    <svg
                      class="w-6 h-6 transition-all duration-300"
                      [class.text-red-500]="isFavorite()"
                      [class.text-gray-400]="!isFavorite()"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>
                </div>

                <!-- Price -->
                <div class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  €{{ formatPrice(house()!.price) }}
                </div>

                <!-- Status Badge -->
                <div class="mb-4">
                  <span
                    class="px-4 py-2 rounded-full text-sm font-semibold"
                    [class.bg-green-100]="house()!.status === 'active'"
                    [class.text-green-800]="house()!.status === 'active'"
                    [class.dark:bg-green-900]="house()!.status === 'active'"
                    [class.dark:text-green-200]="house()!.status === 'active'"
                    [class.bg-yellow-100]="house()!.status === 'upcoming'"
                    [class.text-yellow-800]="house()!.status === 'upcoming'"
                    [class.dark:bg-yellow-900]="house()!.status === 'upcoming'"
                    [class.dark:text-yellow-200]="house()!.status === 'upcoming'"
                    [class.bg-gray-100]="house()!.status === 'ended'"
                    [class.text-gray-800]="house()!.status === 'ended'"
                    [class.dark:bg-gray-700]="house()!.status === 'ended'"
                    [class.dark:text-gray-200]="house()!.status === 'ended'">
                    {{ getStatusText() }}
                  </span>
                </div>
              </div>

              <!-- Description -->
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ translate('house.description') }}
                </h2>
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {{ house()!.description || translate('house.noDescription') }}
                </p>
              </div>

              <!-- Property Details -->
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ translate('house.propertyDetails') }}
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ house()!.bedrooms }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.bedrooms') }}</div>
                  </div>
                  <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ house()!.bathrooms }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.bathrooms') }}</div>
                  </div>
                  <div *ngIf="house()!.squareFeet" class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ house()!.squareFeet }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.squareFeet') }}</div>
                  </div>
                  <div *ngIf="house()!.yearBuilt" class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ house()!.yearBuilt }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.yearBuilt') }}</div>
                  </div>
                </div>

                <!-- Features -->
                <div *ngIf="hasFeatures()" class="mt-6">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {{ translate('house.features') }}
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      *ngFor="let feature of getFeatures()"
                      class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar - Lottery Info & Purchase -->
            <div class="lg:col-span-1">
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
                <!-- Lottery Information -->
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ translate('lottery.information') }}
                </h2>

                <div class="space-y-4 mb-6">
                  <div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {{ translate('lottery.ticketPrice') }}
                    </div>
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      €{{ formatPrice(house()!.ticketPrice) }}
                    </div>
                  </div>

                  <div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {{ translate('lottery.ticketsSold') }}
                    </div>
                    <div class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ house()!.ticketsSold }} / {{ house()!.totalTickets }}
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        [style.width.%]="house()!.participationPercentage">
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {{ house()!.participationPercentage.toFixed(1) }}% {{ translate('lottery.participation') }}
                    </div>
                  </div>

                  <div *ngIf="house()!.lotteryEndDate">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {{ translate('lottery.endDate') }}
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ formatDate(house()!.lotteryEndDate) }}
                    </div>
                  </div>

                  <div *ngIf="house()!.drawDate">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {{ translate('lottery.drawDate') }}
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ formatDate(house()!.drawDate!) }}
                    </div>
                  </div>
                </div>

                <!-- Purchase Section -->
                <app-verification-gate>
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {{ translate('lottery.purchaseTickets') }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {{ translate('lottery.selectQuantity') }}
                    </p>
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {{ translate('lottery.quantity') }}
                        </label>
                        <input
                          type="number"
                          [(ngModel)]="ticketQuantity"
                          [min]="1"
                          [max]="getMaxTickets()"
                          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ translate('lottery.totalCost') }}: 
                        <span class="font-semibold text-blue-600 dark:text-blue-400">
                          €{{ formatPrice(getTotalCost()) }}
                        </span>
                      </div>
                      <button
                        (click)="purchaseTickets()"
                        [disabled]="!canPurchase() || isPurchasing()"
                        class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        <span *ngIf="!isPurchasing()">{{ translate('lottery.purchase') }}</span>
                        <span *ngIf="isPurchasing()">{{ translate('common.processing') }}...</span>
                      </button>
                    </div>
                  </div>
                </app-verification-gate>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class HouseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private lotteryService = inject(LotteryService);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private logger = inject(LoggingService);
  router = inject(Router);

  house = signal<HouseDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedImage = signal<string | null>(null);
  ticketQuantity = 1;
  isPurchasing = signal<boolean>(false);
  isTogglingFavorite = signal<boolean>(false);

  currentUser = this.authService.getCurrentUser();
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();

  readonly LOTTERY_TRANSLATION_KEYS = LOTTERY_TRANSLATION_KEYS;

  ngOnInit(): void {
    const houseId = this.route.snapshot.paramMap.get('id');
    if (houseId) {
      this.loadHouse(houseId);
    } else {
      this.error.set('Invalid house ID');
      this.isLoading.set(false);
    }
  }

  loadHouse(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.lotteryService.getHouseById(id).subscribe({
      next: (house) => {
        this.house.set(house);
        if (house.images && house.images.length > 0) {
          this.selectedImage.set(house.images[0].imageUrl);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.logger.error('Error loading house', { error, houseId: id }, 'HouseDetailComponent');
        this.error.set('Failed to load house details');
        this.isLoading.set(false);
      }
    });
  }

  isFavorite(): boolean {
    const house = this.house();
    if (!house) return false;
    return this.favoriteHouseIds().includes(house.id);
  }

  toggleFavorite(): void {
    const house = this.house();
    if (!house || this.isTogglingFavorite()) return;

    this.isTogglingFavorite.set(true);

    if (this.isFavorite()) {
      this.lotteryService.removeHouseFromFavorites(house.id).subscribe({
        next: () => {
          this.isTogglingFavorite.set(false);
        },
        error: (error: any) => {
          this.logger.error('Error removing favorite', { error, houseId: house.id }, 'HouseDetailComponent');
          this.isTogglingFavorite.set(false);
        }
      });
    } else {
      this.lotteryService.addHouseToFavorites(house.id).subscribe({
        next: () => {
          this.isTogglingFavorite.set(false);
        },
        error: (error: any) => {
          this.logger.error('Error adding favorite', { error, houseId: house.id }, 'HouseDetailComponent');
          this.isTogglingFavorite.set(false);
        }
      });
    }
  }

  getStatusText(): string {
    const house = this.house();
    if (!house) return '';
    
    switch (house.status.toLowerCase()) {
      case 'active':
        return this.translate('lottery.statusActive');
      case 'upcoming':
        return this.translate('lottery.statusUpcoming');
      case 'ended':
        return this.translate('lottery.statusEnded');
      default:
        return house.status;
    }
  }

  getMaxTickets(): number {
    const house = this.house();
    if (!house) return 0;
    return Math.max(0, house.totalTickets - house.ticketsSold);
  }

  getTotalCost(): number {
    const house = this.house();
    if (!house) return 0;
    return this.ticketQuantity * house.ticketPrice;
  }

  canPurchase(): boolean {
    const house = this.house();
    if (!house || !this.currentUser()) return false;
    return house.status === 'active' && this.ticketQuantity > 0 && this.ticketQuantity <= this.getMaxTickets();
  }

  purchaseTickets(): void {
    const house = this.house();
    if (!house || !this.canPurchase() || this.isPurchasing()) return;

    // TODO: Get payment method from user or payment service
    // For now, using a placeholder - this should be implemented properly
    const paymentMethodId = 'default'; // This should come from user's payment methods

    this.isPurchasing.set(true);

    this.lotteryService.purchaseTicket({
      houseId: house.id,
      quantity: this.ticketQuantity,
      paymentMethodId: paymentMethodId
    }).subscribe({
      next: (result) => {
        this.logger.info('Tickets purchased successfully', { result, houseId: house.id }, 'HouseDetailComponent');
        // Reload house to update ticket counts
        this.loadHouse(house.id);
        this.isPurchasing.set(false);
        // TODO: Show success toast/notification
      },
      error: (error: any) => {
        this.logger.error('Error purchasing tickets', { error, houseId: house.id }, 'HouseDetailComponent');
        this.isPurchasing.set(false);
        // TODO: Show error toast/notification
      }
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  hasFeatures(): boolean {
    const house = this.house();
    return !!(house?.features && house.features.length > 0);
  }

  getFeatures(): string[] {
    const house = this.house();
    return house?.features || [];
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

