import { Component, inject, OnInit, OnDestroy, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HouseDto } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { ToastService } from '../../services/toast.service';
import { HeartAnimationService } from '../../services/heart-animation.service';
import { LocaleService } from '../../services/locale.service';
import { ParticipantStatsComponent } from '../participant-stats/participant-stats.component';
import { LiveInventoryComponent } from '../live-inventory/live-inventory.component';
import { CanEnterLotteryResponse } from '../../interfaces/watchlist.interface';
import { QuickEntryRequest } from '../../interfaces/lottery.interface';

@Component({
  selector: 'app-house-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ParticipantStatsComponent,
    LiveInventoryComponent
  ],
  styles: [`
    /* Favorite Button Animations - Matching promotions glow */
    @keyframes favorite-pulse-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(139, 92, 246, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(139, 92, 246, 1), 0 0 60px rgba(139, 92, 246, 0.8), 0 0 90px rgba(139, 92, 246, 0.6), 0 0 0 6px rgba(139, 92, 246, 0.5);
      }
    }

    @keyframes favorite-red-glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4), 0 0 0 3px rgba(239, 68, 68, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(239, 68, 68, 1), 0 0 60px rgba(239, 68, 68, 0.8), 0 0 90px rgba(239, 68, 68, 0.6), 0 0 0 6px rgba(239, 68, 68, 0.5);
      }
    }

    @keyframes heart-fill {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.3);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .favorite-button-pulse {
      animation: favorite-pulse-glow 2s ease-in-out infinite;
    }

    .favorite-button-glow {
      animation: favorite-red-glow 2s ease-in-out infinite;
    }

    .heart-fill-animation {
      animation: heart-fill 0.6s ease-out;
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
  `],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Status Announcement (aria-live) -->
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          <span *ngIf="loading()">{{ translate('common.loading') }}</span>
          <span *ngIf="error()">{{ error() }}</span>
        </div>

        <!-- Back Button -->
        <button
          (click)="goBack()"
          (keydown)="handleBackKeyDown($event)"
          [attr.aria-label]="translate('common.back')"
          class="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none rounded">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            <div class="relative">
              <!-- Main Image -->
              <div class="relative h-64 md:h-96 bg-gray-200">
                <div class="relative w-full h-full">
                  <img
                    [src]="primaryImage()"
                    (error)="onImageError($event)"
                    [alt]="house()!.title"
                    [class.thumbnail-upcoming]="house()!.status === 'upcoming'"
                    [class.thumbnail-ended]="house()!.status === 'ended'"
                    class="w-full h-full object-cover transition-opacity duration-300">
                  <!-- Thumbnail overlay for status -->
                  <div 
                    *ngIf="house()!.status === 'upcoming'"
                    class="absolute inset-0 bg-yellow-500 bg-opacity-15 dark:bg-yellow-400 dark:bg-opacity-10 pointer-events-none z-0">
                  </div>
                  <div 
                    *ngIf="house()!.status === 'ended'"
                    class="absolute inset-0 bg-gray-500 bg-opacity-30 dark:bg-gray-600 dark:bg-opacity-40 pointer-events-none z-0 thumbnail-ended-overlay">
                  </div>
                </div>
                
                <!-- Location Icon - Red Circular (Standardized Size) -->
                <button 
                  (click)="openLocationMap()"
                  (keydown.enter)="openLocationMap()"
                  (keydown.space)="openLocationMap(); $event.preventDefault()"
                  class="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-10 cursor-pointer focus:outline-none"
                  [attr.aria-label]="'View ' + house()!.title + ' location on map'">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                  </svg>
                </button>

                <!-- Status Badge - Color based on status (Centered, Same Height as Icons) -->
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span 
                    [class.animate-seesaw]="house()!.status === 'active' && vibrationTrigger() > 0"
                    [class.bg-emerald-500]="house()!.status === 'active'"
                    [class.bg-yellow-500]="house()!.status === 'upcoming'"
                    [class.bg-gray-500]="house()!.status === 'ended'"
                    class="text-white px-6 py-3 rounded-[20px] text-base font-semibold shadow-lg whitespace-nowrap flex items-center h-12">
                    {{ getStatusText() }}
                  </span>
                </div>
                
                <!-- Favorite Button - Purple Circular (Same Size as Location Icon) -->
                <button
                  (click)="toggleFavorite($event)"
                  (keydown.enter)="toggleFavorite($event)"
                  (keydown.space)="toggleFavorite($event); $event.preventDefault()"
                  [disabled]="isTogglingFavorite()"
                  [class.favorite-button-pulse]="isTogglingFavorite()"
                  [class.favorite-button-red-hover]="!isFavorite()"
                  [class.favorite-button-red-filled]="isFavorite()"
                  class="absolute top-4 right-4 z-20 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 cursor-pointer focus:outline-none favorite-button disabled:opacity-50 disabled:cursor-not-allowed"
                  [attr.aria-label]="isFavorite() ? translate('favorites.removeFromFavorites') : translate('favorites.addToFavorites')"
                  [title]="isFavorite() ? translate('favorites.removeFromFavorites') : translate('favorites.addToFavorites')">
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
              </div>

              <!-- Thumbnail Gallery (if more than 1 image) -->
              <div *ngIf="allImages().length > 1" class="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div class="flex gap-2 overflow-x-auto pb-2">
                  <button
                    *ngFor="let image of allImages(); let i = index"
                    (click)="selectImage(i); $event.stopPropagation()"
                    [class.border-blue-500]="currentImageIndex() === i"
                    [class.border-gray-300]="currentImageIndex() !== i"
                    [class.dark:border-blue-400]="currentImageIndex() === i"
                    [class.dark:border-gray-600]="currentImageIndex() !== i"
                    class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none"
                    [attr.aria-label]="translateWithParams('house.viewImage', { current: i + 1, total: allImages().length })"
                    [attr.aria-current]="currentImageIndex() === i ? 'true' : 'false'">
                    <img
                      [src]="image.imageUrl"
                      [alt]="house()!.title + ' - Image ' + (i + 1)"
                      (error)="onImageError($event)"
                      class="w-full h-full object-cover">
                  </button>
                </div>

                <!-- Navigation Dots -->
                <div class="flex justify-center gap-2 mt-3">
                  <button
                    *ngFor="let image of allImages(); let i = index"
                    (click)="selectImage(i); $event.stopPropagation()"
                    type="button"
                    [class.bg-blue-500]="currentImageIndex() === i"
                    [class.bg-gray-300]="currentImageIndex() !== i"
                    [class.dark:bg-blue-400]="currentImageIndex() === i"
                    [class.dark:bg-gray-600]="currentImageIndex() !== i"
                    [class.opacity-50]="currentImageIndex() !== i"
                    [class.scale-125]="currentImageIndex() === i"
                    [class.w-4]="currentImageIndex() === i"
                    [class.h-4]="currentImageIndex() === i"
                    [class.w-3]="currentImageIndex() !== i"
                    [class.h-3]="currentImageIndex() !== i"
                    class="rounded-full transition-all duration-200 focus:outline-none hover:scale-125 cursor-pointer"
                    [attr.aria-label]="translateWithParams('house.goToImage', { current: i + 1, total: allImages().length })"
                    [attr.aria-current]="currentImageIndex() === i ? 'true' : 'false'">
                  </button>
                </div>
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
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{{ localeService.formatCurrency(house()!.price) }}</span>
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
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ localeService.formatCurrency(house()!.ticketPrice) }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ translate('house.perTicket') }}</div>
                </div>
              </div>

              <!-- Description -->
              <div *ngIf="house()!.description" class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">{{ translate('house.description') }}</h2>
                <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ house()!.description }}</p>
              </div>

              <!-- Features -->
              <div *ngIf="house()?.features && (house()?.features?.length ?? 0) > 0" class="mb-6">
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

            <!-- Live Inventory -->
            <app-live-inventory 
              [houseId]="house()!.id" 
              [title]="translate('house.availableTickets')">
            </app-live-inventory>
          </div>

          <!-- Additional Lottery Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                <div *ngIf="currentUser()" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div *ngIf="checkingCanEnter()" class="flex items-center justify-center py-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="ml-2 text-gray-600 dark:text-gray-400">{{ translate('common.loading') }}</span>
                  </div>
                  <div *ngIf="!checkingCanEnter() && canEnterResponse()"
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
                          {{ canEnterResponse()!.canEnter ? translate('entry.canEnter') : translateWithParams('entry.cannotEnter', { reason: canEnterResponse()!.reason || '' }) }}
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

            <ng-container *ngIf="currentUser(); else signInBlock">
              <ng-container *ngTemplateOutlet="entryBlock"></ng-container>
            </ng-container>
            <ng-template #signInBlock>
              <div class="text-center py-8">
                <p class="text-xl text-gray-600 dark:text-gray-300 mb-4">
                  {{ translate('house.signInToParticipate') }}
                </p>
                <a
                  [routerLink]="['/register']"
                  class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                  {{ translate('auth.signUp') }}
                </a>
              </div>
            </ng-template>

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
                  (keydown)="handleEntryKeyDown($event)"
                  [disabled]="enteringLottery() || (house()!.isParticipantCapReached && !canEnterResponse()?.isExistingParticipant)"
                  [attr.aria-busy]="enteringLottery()"
                  [attr.aria-label]="enteringLottery() ? translate('common.loading') : translate('entry.enterLottery')"
                  class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center focus:outline-none">
                  <span *ngIf="!enteringLottery()">{{ translate('entry.enterLottery') }}</span>
                  <div *ngIf="enteringLottery()" class="flex items-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    <span>{{ translate('common.loading') }}</span>
                  </div>
                </button>

              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HouseDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lotteryService = inject(LotteryService);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private errorMessageService = inject(ErrorMessageService);
  private toastService = inject(ToastService);
  private heartAnimationService = inject(HeartAnimationService);

  house = signal<HouseDto | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  canEnterResponse = signal<CanEnterLotteryResponse | null>(null);
  isTogglingFavorite = signal<boolean>(false);
  checkingCanEnter = signal<boolean>(false);
  enteringLottery = signal<boolean>(false);
  vibrationTrigger = signal<number>(0);
  
  // Image gallery state
  currentImageIndex = signal<number>(0);
  
  private vibrationInterval?: number;
  
  // Favorites
  favoriteHouseIds = this.lotteryService.getFavoriteHouseIds();
  isFavorite = computed(() => {
    const h = this.house();
    return h ? this.favoriteHouseIds().includes(h.id) : false;
  });

  currentUser = computed(() => {
    return this.authService.getCurrentUser()();
  });

  // Get all images sorted (primary first, then secondary)
  allImages = computed(() => {
    const h = this.house();
    if (!h || !h.images || h.images.length === 0) return [];
    
    const primary = h.images.find(img => img.isPrimary);
    const secondary = h.images.filter(img => !img.isPrimary);
    
    // Return primary first, then secondary
    return primary ? [primary, ...secondary] : h.images;
  });

  primaryImage = computed(() => {
    const images = this.allImages();
    const index = this.currentImageIndex();
    if (images.length === 0) return '';
    return images[index]?.imageUrl || images[0]?.imageUrl || '';
  });

  ngOnInit(): void {
    const houseId = this.route.snapshot.paramMap.get('id');
    if (!houseId) {
      this.error.set('House ID is required');
      this.loading.set(false);
      return;
    }

    // Load house first, then check canEnter after house loads
    this.loadHouse(houseId);
    
    // Start seesaw animation for active status badges (every 5 seconds)
    this.vibrationInterval = window.setInterval(() => {
      const h = this.house();
      if (h && h.status === 'active') {
        // Trigger animation by updating signal
        this.vibrationTrigger.set(Date.now());
        // Remove animation class after animation completes (600ms - 2 iterations × 0.3s)
        setTimeout(() => {
          this.vibrationTrigger.set(0);
        }, 600);
      }
    }, 5000);
  }
  
  ngOnDestroy(): void {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
    }
  }

  loadHouse(houseId: string): void {
    this.loading.set(true);
    this.lotteryService.getHouseById(houseId).subscribe({
      next: (house) => {
        this.house.set(house);
        // Reset image index when house loads
        this.currentImageIndex.set(0);
        this.loading.set(false);
        
        // After house loads successfully, check canEnter
        if (this.currentUser()) {
          this.checkCanEnter(houseId);
        }
      },
      error: (error) => {
        console.error('Error loading house:', error);
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.error.set(errorMessage);
        this.toastService.error(errorMessage);
        this.loading.set(false);
      }
    });
  }

  selectImage(index: number): void {
    const images = this.allImages();
    if (index >= 0 && index < images.length) {
      this.currentImageIndex.set(index);
    }
  }

  checkCanEnter(houseId: string): void {
    if (!this.currentUser()) return;

    this.checkingCanEnter.set(true);
    this.lotteryService.canEnterLottery(houseId).subscribe({
      next: (response) => {
        this.canEnterResponse.set(response);
        this.checkingCanEnter.set(false);
      },
      error: (error) => {
        console.error('Error checking if can enter:', error);
        this.checkingCanEnter.set(false);
        // Don't show error to user, just log it - this is not critical
      }
    });
  }

  toggleFavorite(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    const h = this.house();
    if (!h) return;
    
    // Check if user is logged in
    if (!this.currentUser() || !this.currentUser()?.isAuthenticated) {
      this.toastService.error(this.translate('favorites.loginRequired'), 4000);
      return;
    }
    
    if (this.isTogglingFavorite()) {
      return;
    }

    this.isTogglingFavorite.set(true);
    
    // Check if already in favorites
    const isCurrentlyFavorite = this.isFavorite();
    
    // Get source button for animation
    const sourceButton = this.getClosestElement(event?.target, 'button');
    
    this.lotteryService.toggleFavorite(h.id).subscribe({
      next: (result) => {
        this.isTogglingFavorite.set(false);
        if (result) {
          if (result.added) {
            this.toastService.success(this.translate('favorites.added'), 3000);
            // Trigger heart animation when adding to favorites
            if (sourceButton) {
              this.triggerHeartAnimation(sourceButton);
            }
          } else {
            this.toastService.success(this.translate('favorites.removed'), 3000);
          }
        } else if (isCurrentlyFavorite) {
          // Already in favorites - this shouldn't happen, but handle gracefully
          this.toastService.info(this.translate('favorites.alreadyInFavorites'), 2000);
        }
      },
      error: (error: any) => {
        this.isTogglingFavorite.set(false);
        console.error('Error toggling favorite:', error);
        // Check if error is because already in favorites
        if (error?.error?.message?.includes('already') || error?.error?.message?.includes('favorite')) {
          this.toastService.info(this.translate('favorites.alreadyInFavorites'), 2000);
        } else {
          this.toastService.error(this.translate('favorites.updateFailed'), 4000);
        }
      }
    });
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

  enterLottery(): void {
    const h = this.house();
    if (!h) return;
    
    if (!this.currentUser() || !this.currentUser()?.isAuthenticated) {
      this.toastService.error(this.translate('entry.loginRequired'), 4000);
      return;
    }

    // Check if user can enter before proceeding
    if (this.canEnterResponse() && !this.canEnterResponse()!.canEnter) {
      // Show error message - cap reached or other reason
      const reason = this.canEnterResponse()!.reason || 'Unknown reason';
      const errorMessage = this.translateWithParams('entry.cannotEnter', { reason });
      this.toastService.error(errorMessage);
      return;
    }

    // For now, use quick entry with default 1 ticket
    // TODO: In the future, this should open a modal to select ticket count and payment method
    const quickEntryRequest: QuickEntryRequest = {
      houseId: h.id,
      quantity: 1, // Default to 1 ticket
      paymentMethodId: '' // TODO: Get from user preferences or payment setup
    };

    // Show loading state
    this.enteringLottery.set(true);

    this.lotteryService.quickEntryFromFavorite(quickEntryRequest).subscribe({
      next: (response) => {
        this.enteringLottery.set(false);
        // Show success message
        const successMessage = `Successfully entered lottery! Purchased ${response.ticketsPurchased} ticket(s). Transaction ID: ${response.transactionId}`;
        this.toastService.success(successMessage);
        // Refresh house data to update participant stats
        this.loadHouse(h.id);
        // Refresh canEnter status
        if (this.currentUser()) {
          this.checkCanEnter(h.id);
        }
      },
      error: (error) => {
        this.enteringLottery.set(false);
        console.error('Error entering lottery:', error);
        
        // Show user-friendly error message
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.toastService.error(errorMessage);
      }
    });
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

  localeService = inject(LocaleService);

  formatDate(date: Date | string): string {
    if (!date) return '';
    // Use LocaleService for locale-aware formatting
    return this.localeService.formatDate(typeof date === 'string' ? new Date(date) : date, 'medium');
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


  /**
   * Handle keyboard events for entry button
   */
  handleEntryKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.enteringLottery() && !(this.house()?.isParticipantCapReached && !this.canEnterResponse()?.isExistingParticipant)) {
        this.enterLottery();
      }
    }
  }

  /**
   * Handle keyboard events for back button
   */
  handleBackKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.goBack();
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Set fallback placeholder image
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.classList.add('opacity-100');
    // Don't log warnings for missing images - they're handled gracefully
  }

  openLocationMap(): void {
    const h = this.house();
    if (!h) return;
    
    const address = h.address || h.location || h.title;
    
    // Create a search query for Google Maps
    const searchQuery = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // Open in a new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Safely gets the closest element matching a selector from an event target.
   * Handles cases where event.target might be a Text node or other non-Element node.
   */
  private getClosestElement(target: EventTarget | null | undefined, selector: string): HTMLElement | null {
    if (!target) {
      return null;
    }

    // If target is already an Element, use closest() directly
    if (target instanceof Element) {
      return target.closest(selector) as HTMLElement | null;
    }

    // If target is a Node (like Text), traverse up to find the parent Element
    if (target instanceof Node) {
      let current: Node | null = target;
      while (current && current.nodeType !== Node.ELEMENT_NODE) {
        current = current.parentNode;
      }
      if (current instanceof Element) {
        return current.closest(selector) as HTMLElement | null;
      }
    }

    return null;
  }
}

