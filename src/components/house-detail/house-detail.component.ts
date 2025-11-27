import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HouseDto } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { WatchlistService } from '../../services/watchlist.service';
import { TranslationService } from '../../services/translation.service';
import { VerificationGateComponent } from '../verification-gate/verification-gate.component';
import { ParticipantStatsComponent } from '../participant-stats/participant-stats.component';
import { CanEnterLotteryResponse } from '../../interfaces/watchlist.interface';

@Component({
  selector: 'app-house-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VerificationGateComponent,
    ParticipantStatsComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Back Button -->
        <button
          (click)="goBack()"
          class="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span>{{ translate('common.back') }}</span>
        </button>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex justify-center items-center min-h-[400px]">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error() && !loading()" class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          <p>{{ error() }}</p>
        </div>

        <!-- House Detail Content -->
        <div *ngIf="house() && !loading()" class="space-y-6">
          <!-- Header Section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <!-- Image Gallery -->
            <div class="relative h-64 md:h-96 bg-gray-200">
              <img
                [src]="primaryImage()"
                [alt]="house()!.title"
                class="w-full h-full object-cover">
              
              <!-- Watchlist Button -->
              <button
                *ngIf="currentUser()"
                (click)="toggleWatchlist()"
                [class.animate-pulse]="isTogglingWatchlist()"
                class="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                [attr.aria-label]="isInWatchlist() ? 'Remove from watchlist' : 'Add to watchlist'"
                [title]="isInWatchlist() ? translate('watchlist.remove') : translate('watchlist.add')">
                <svg 
                  class="w-6 h-6 transition-all duration-300"
                  [class.text-blue-500]="isInWatchlist()"
                  [class.text-gray-400]="!isInWatchlist()"
                  fill="currentColor" 
                  viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                </svg>
              </button>

              <!-- Status Badge -->
              <div class="absolute top-4 left-4">
                <span class="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  {{ getStatusText() }}
                </span>
              </div>
            </div>

            <!-- Title and Basic Info -->
            <div class="p-6 md:p-8">
              <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{ house()!.title }}
              </h1>
              
              <div class="flex flex-wrap items-center gap-4 mb-6 text-gray-600 dark:text-gray-300">
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{{ house()!.location }}</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>€{{ house()!.price | number:'1.0-0' }}</span>
                </div>
              </div>

              <!-- Property Details Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ house()!.bedrooms }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.bedrooms') }}</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ house()!.bathrooms }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.bathrooms') }}</div>
                </div>
                <div *ngIf="house()!.squareFeet" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ house()!.squareFeet | number:'1.0-0' }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.squareFeet') }}</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">€{{ house()!.ticketPrice | number:'1.2-2' }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.perTicket') }}</div>
                </div>
              </div>

              <!-- Description -->
              <div *ngIf="house()!.description" class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">{{ translate('house.description') }}</h2>
                <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ house()!.description }}</p>
              </div>

              <!-- Features -->
              <div *ngIf="house()!.features && house()!.features.length > 0" class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">{{ translate('house.features') }}</h2>
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let feature of house()!.features"
                    class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    {{ feature }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lottery Information Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Participant Stats -->
            <app-participant-stats [houseId]="house()!.id"></app-participant-stats>

            <!-- Lottery Details Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ translate('house.lotteryDetails') }}
              </h3>

              <div class="space-y-4">
                <!-- Tickets Sold -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ translate('house.ticketsSold') }}</span>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ house()!.ticketsSold }} / {{ house()!.totalTickets }}
                  </span>
                </div>

                <!-- Participation Progress -->
                <div>
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>{{ translate('house.participation') }}</span>
                    <span>{{ house()!.participationPercentage | number:'1.1-1' }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      class="h-2.5 rounded-full transition-all duration-300"
                      [class.bg-green-500]="house()!.canExecute"
                      [class.bg-yellow-500]="!house()!.canExecute"
                      [style.width.%]="house()!.participationPercentage">
                    </div>
                  </div>
                </div>

                <!-- Lottery End Date -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ translate('house.lotteryEndDate') }}</span>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ formatDate(house()!.lotteryEndDate) }}
                  </span>
                </div>

                <!-- Can Enter Status -->
                <div *ngIf="currentUser() && canEnterResponse()" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div
                    class="p-3 rounded-lg"
                    [class.bg-green-100]="canEnterResponse()!.canEnter"
                    [class.bg-red-100]="!canEnterResponse()!.canEnter"
                    [class.dark:bg-green-900/30]="canEnterResponse()!.canEnter"
                    [class.dark:bg-red-900/30]="!canEnterResponse()!.canEnter"
                    [class.border-green-300]="canEnterResponse()!.canEnter"
                    [class.border-red-300]="!canEnterResponse()!.canEnter"
                    [class.dark:border-green-700]="canEnterResponse()!.canEnter"
                    [class.dark:border-red-700]="!canEnterResponse()!.canEnter"
                    [class.border]="true">
                    <div class="flex items-center">
                      <svg
                        *ngIf="canEnterResponse()!.canEnter"
                        class="w-5 h-5 mr-2 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                      <svg
                        *ngIf="!canEnterResponse()!.canEnter"
                        class="w-5 h-5 mr-2 text-red-600 dark:text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                      </svg>
                      <div>
                        <div class="font-semibold"
                          [class.text-green-800]="canEnterResponse()!.canEnter"
                          [class.text-red-800]="!canEnterResponse()!.canEnter"
                          [class.dark:text-green-200]="canEnterResponse()!.canEnter"
                          [class.dark:text-red-200]="!canEnterResponse()!.canEnter">
                          {{ canEnterResponse()!.canEnter ? translate('entry.canEnter') : translate('entry.cannotEnter', { reason: canEnterResponse()!.reason || '' }) }}
                        </div>
                        <div
                          *ngIf="canEnterResponse()!.isExistingParticipant"
                          class="text-sm mt-1"
                          [class.text-green-700]="canEnterResponse()!.canEnter"
                          [class.text-red-700]="!canEnterResponse()!.canEnter"
                          [class.dark:text-green-300]="canEnterResponse()!.canEnter"
                          [class.dark:text-red-300]="!canEnterResponse()!.canEnter">
                          {{ translate('entry.existingParticipant') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Entry Section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {{ translate('house.enterLottery') }}
            </h2>

            <app-verification-gate>
              <ng-container *ngTemplateOutlet="entryBlock"></ng-container>
              <ng-template #signInBlock>
                <div class="text-center py-8">
                  <p class="text-xl text-gray-600 dark:text-gray-300 mb-4">
                    {{ translate('house.signInToParticipate') }}
                  </p>
                  <a
                    [routerLink]="['/register']"
                    class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                    {{ translate('common.signUp') }}
                  </a>
                </div>
              </ng-template>
            </app-verification-gate>

            <ng-template #entryBlock>
              <div class="space-y-4">
                <!-- Entry Disabled Message (if cap reached and not existing participant) -->
                <div
                  *ngIf="house()!.isParticipantCapReached && !canEnterResponse()?.isExistingParticipant"
                  class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-red-800 dark:text-red-200 font-semibold">
                      {{ translate('entry.capReached') }}
                    </span>
                  </div>
                </div>

                <!-- Entry Button -->
                <button
                  (click)="enterLottery()"
                  [disabled]="house()!.isParticipantCapReached && !canEnterResponse()?.isExistingParticipant"
                  class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100">
                  {{ translate('entry.enterLottery') }}
                </button>

                <!-- Watchlist Indicator -->
                <div *ngIf="isInWatchlist()" class="text-center text-sm text-blue-600 dark:text-blue-400">
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                  </svg>
                  {{ translate('watchlist.notificationEnabled') }}
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HouseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lotteryService = inject(LotteryService);
  private watchlistService = inject(WatchlistService);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);

  house = signal<HouseDto | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  canEnterResponse = signal<CanEnterLotteryResponse | null>(null);
  isInWatchlist = signal<boolean>(false);
  isTogglingWatchlist = signal<boolean>(false);

  currentUser = computed(() => this.authService.currentUser());

  primaryImage = computed(() => {
    const h = this.house();
    if (!h) return '';
    if (h.images && h.images.length > 0) {
      const primary = h.images.find(img => img.isPrimary);
      return primary ? primary.imageUrl : h.images[0].imageUrl;
    }
    return h.imageUrl || '';
  });

  ngOnInit(): void {
    const houseId = this.route.snapshot.paramMap.get('id');
    if (!houseId) {
      this.error.set('House ID is required');
      this.loading.set(false);
      return;
    }

    this.loadHouse(houseId);
    this.checkCanEnter(houseId);
    this.checkWatchlist(houseId);
  }

  loadHouse(houseId: string): void {
    this.loading.set(true);
    this.lotteryService.getHouseById(houseId).subscribe({
      next: (house) => {
        this.house.set(house);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading house:', error);
        this.error.set('Failed to load house details');
        this.loading.set(false);
      }
    });
  }

  checkCanEnter(houseId: string): void {
    if (!this.currentUser()) return;

    this.lotteryService.canEnterLottery(houseId).subscribe({
      next: (response) => {
        this.canEnterResponse.set(response);
      },
      error: (error) => {
        console.error('Error checking if can enter:', error);
      }
    });
  }

  checkWatchlist(houseId: string): void {
    if (!this.currentUser()) return;

    this.watchlistService.isInWatchlist(houseId).subscribe({
      next: (inWatchlist) => {
        this.isInWatchlist.set(inWatchlist);
      },
      error: (error) => {
        console.error('Error checking watchlist:', error);
      }
    });
  }

  toggleWatchlist(): void {
    const h = this.house();
    if (!h || !this.currentUser()) return;

    this.isTogglingWatchlist.set(true);
    if (this.isInWatchlist()) {
      this.watchlistService.removeFromWatchlist(h.id).subscribe({
        next: () => {
          this.isInWatchlist.set(false);
          this.isTogglingWatchlist.set(false);
        },
        error: (error) => {
          console.error('Error removing from watchlist:', error);
          this.isTogglingWatchlist.set(false);
        }
      });
    } else {
      this.watchlistService.addToWatchlist(h.id, true).subscribe({
        next: () => {
          this.isInWatchlist.set(true);
          this.isTogglingWatchlist.set(false);
        },
        error: (error) => {
          console.error('Error adding to watchlist:', error);
          this.isTogglingWatchlist.set(false);
        }
      });
    }
  }

  enterLottery(): void {
    const h = this.house();
    if (!h || !this.currentUser()) return;

    // Navigate to entry/purchase flow
    // This would typically open a modal or navigate to a purchase page
    // For now, we'll just show an alert
    alert('Entry functionality will be implemented in the purchase flow');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusText(): string {
    const h = this.house();
    if (!h) return '';
    
    switch (h.status.toLowerCase()) {
      case 'active':
        return this.translate('house.status.active');
      case 'inactive':
        return this.translate('house.status.inactive');
      case 'sold':
        return this.translate('house.status.sold');
      case 'cancelled':
        return this.translate('house.status.cancelled');
      default:
        return h.status;
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  translate(key: string, params?: Record<string, any>): string {
    return this.translationService.translate(key, params);
  }
}

