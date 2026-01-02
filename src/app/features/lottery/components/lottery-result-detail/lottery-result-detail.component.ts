import { Component, OnInit, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LotteryResultsService, LotteryResult, CreatePrizeDeliveryRequest } from '../../services/lottery-results.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { AuthService } from '@core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-lottery-result-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div class="container mx-auto px-4 py-8">
        <!-- Back Button -->
        <div class="mb-6">
          <button 
            (click)="goBack()"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ translate('lotteryResults.backToResults') }}
          </button>
        </div>

        @if (loading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-lg text-gray-600 dark:text-gray-300">
              {{ translate('lotteryResults.loading') }}
            </span>
          </div>
        }

        @if (error()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
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

        @if (result() && !loading() && !error()) {
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('lotteryResults.resultDetails') }}
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-300">
                {{ translate('lotteryResults.resultDetailsSubtitle') }}
              </p>
            </div>

            <!-- Result Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <!-- Prize Position Badge -->
              <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div class="flex items-center justify-center">
                  <span 
                    class="px-4 py-2 text-lg font-bold text-white rounded-full"
                    [class]="lotteryResultsService.getPrizePositionColor(result()!.prizePosition)"
                  >
                    {{ lotteryResultsService.getPrizePositionText(result()!.prizePosition) }}
                  </span>
                </div>
              </div>

              <div class="p-6">
                <!-- House Information -->
                <div class="mb-8">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {{ result()!.houseTitle }}
                  </h2>
                  <p class="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    {{ result()!.houseAddress }}
                  </p>
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {{ translate('lotteryResults.drawDate') }}
                        </p>
                        <p class="text-lg font-semibold text-gray-900 dark:text-white">
                          {{ lotteryResultsService.formatDate(result()!.resultDate) }}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {{ translate('lotteryResults.ticketNumber') }}
                        </p>
                        <p class="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                          {{ result()!.winnerTicketNumber }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Winner Information -->
                <div class="mb-8">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('lotteryResults.winnerInformation') }}
                  </h3>
                  <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {{ translate('lotteryResults.winner') }}
                        </p>
                        <p class="text-lg font-semibold text-gray-900 dark:text-white">
                          {{ result()!.winnerName }}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {{ translate('lotteryResults.email') }}
                        </p>
                        <p class="text-lg font-semibold text-gray-900 dark:text-white">
                          {{ result()!.winnerEmail }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Prize Information -->
                <div class="mb-8">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('lotteryResults.prizeInformation') }}
                  </h3>
                  <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {{ translate('lotteryResults.prizeValue') }}
                      </p>
                      <p class="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
                        {{ lotteryResultsService.formatCurrency(result()!.prizeValue) }}
                      </p>
                      <p class="text-lg text-gray-700 dark:text-gray-300">
                        {{ result()!.prizeDescription }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- QR Code Section -->
                <div class="mb-8">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('lotteryResults.verificationQR') }}
                  </h3>
                  
                  <!-- Spinning Container -->
                  <div class="flex justify-center">
                    <div 
                      class="relative w-80 h-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden cursor-pointer"
                      (click)="toggleQRCode()"
                      [class.spinning]="isSpinning()"
                      [class.revealed]="isQRRevealed()"
                    >
                      <!-- Initial State -->
                      @if (!isQRRevealed()) {
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                          <div class="text-center">
                            <svg class="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m-4 4h4m-4 4h4m-4-8h4m-4 4h4"></path>
                            </svg>
                            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                              {{ translate('lotteryResults.clickToReveal') }}
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {{ translate('lotteryResults.clickToRevealDescription') }}
                            </p>
                          </div>
                        </div>
                      }

                      <!-- Spinning State -->
                      @if (isSpinning() && !isQRRevealed()) {
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30">
                          <div class="text-center">
                            <div class="animate-spin mx-auto h-16 w-16 border-4 border-yellow-500 border-t-transparent rounded-full mb-4"></div>
                            <p class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              {{ translate('lotteryResults.spinning') }}
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {{ translate('lotteryResults.spinningDescription') }}
                            </p>
                          </div>
                        </div>
                      }

                      <!-- Revealed QR Code -->
                      @if (isQRRevealed() && result()!.qrCodeImageUrl) {
                        <div class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 p-4">
                          <div class="text-center">
                            <img 
                              [src]="result()!.qrCodeImageUrl" 
                              [alt]="translate('lotteryResults.qrCode')"
                              class="mx-auto w-64 h-64 mb-4"
                            >
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              {{ translate('lotteryResults.qrCodeDescription') }}
                            </p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="text-center mt-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ translate('lotteryResults.qrCodeInstructions') }}
                    </p>
                  </div>
                </div>

                <!-- Draw Participants -->
                @if (result()!.drawId) {
                  <div class="mb-8">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {{ translate('draws.detail.participants') || 'Draw Participants' }}
                    </h3>
                    @if (loadingParticipants()) {
                      <div class="flex justify-center items-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                          {{ translate('draws.loading') || 'Loading participants...' }}
                        </span>
                      </div>
                    } @else if (participantsError()) {
                      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p class="text-sm text-red-700 dark:text-red-300">
                          {{ participantsError() }}
                        </p>
                      </div>
                    } @else {
                      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-4">
                          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ translate('draws.detail.participantsCount') || 'Total Participants' }}:
                          </p>
                          <span class="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {{ participants().length }}
                          </span>
                        </div>
                        @if (participants().length > 0) {
                          <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('draws.detail.participantsDescription') || 'Number of users who participated in this draw' }}
                          </div>
                        } @else {
                          <div class="text-sm text-gray-500 dark:text-gray-400 italic">
                            {{ translate('draws.empty.participants') || 'No participants found' }}
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                <!-- Claim Status -->
                <div class="mb-8">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('lotteryResults.claimStatus') }}
                  </h3>
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        @if (result()!.isClaimed) {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            {{ translate('lotteryResults.claimed') }}
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                            </svg>
                            {{ translate('lotteryResults.unclaimed') }}
                          </span>
                        }
                      </div>
                      @if (result()!.isClaimed && result()!.claimedAt) {
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ translate('lotteryResults.claimedOn') }}: {{ lotteryResultsService.formatDate(result()!.claimedAt!) }}
                        </p>
                      }
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-center space-x-4 flex-wrap gap-4">
                  <!-- Claim Prize Button (only for winner, unclaimed) -->
                  @if (isCurrentUserWinner() && !result()!.isClaimed) {
                    <button 
                      (click)="openClaimModal()"
                      class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ translate('lotteryResults.claimPrize') || 'Claim Prize' }}
                    </button>
                  }
                  
                  <!-- Request Prize Delivery Button (only for claimed, non-first place winners) -->
                  @if (isCurrentUserWinner() && result()!.isClaimed && result()!.prizePosition !== 1) {
                    <button 
                      (click)="openDeliveryModal()"
                      class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {{ translate('lotteryResults.requestDelivery') || 'Request Delivery' }}
                    </button>
                  }
                  
                  @if (result()!.qrCodeImageUrl) {
                    <button 
                      (click)="downloadQRCode()"
                      class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {{ translate('lotteryResults.downloadQR') }}
                    </button>
                  }
                  
                  <button 
                    (click)="shareResult()"
                    class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {{ translate('lotteryResults.share') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Prize Delivery Modal -->
    @if (showDeliveryModal()) {
      <div 
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        (click)="closeDeliveryModal()"
      >
        <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800" (click)="$event.stopPropagation()">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ translate('lotteryResults.requestDelivery') || 'Request Prize Delivery' }}
              </h3>
              <button 
                (click)="closeDeliveryModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form (ngSubmit)="createDelivery()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Recipient Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.recipientName') || 'Recipient Name' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.recipientName"
                    name="recipientName"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.phone') || 'Phone' }}
                  </label>
                  <input 
                    type="tel"
                    [(ngModel)]="deliveryForm.phone"
                    name="phone"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Address Line 1 -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.addressLine1') || 'Address Line 1' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.addressLine1"
                    name="addressLine1"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Address Line 2 -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.addressLine2') || 'Address Line 2' }}
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.addressLine2"
                    name="addressLine2"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- City -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.city') || 'City' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.city"
                    name="city"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- State -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.state') || 'State/Province' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.state"
                    name="state"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Postal Code -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.postalCode') || 'Postal Code' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.postalCode"
                    name="postalCode"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Country -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.country') || 'Country' }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    [(ngModel)]="deliveryForm.country"
                    name="country"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.email') || 'Email' }}
                  </label>
                  <input 
                    type="email"
                    [(ngModel)]="deliveryForm.email"
                    name="email"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Delivery Method -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.deliveryMethod') || 'Delivery Method' }} <span class="text-red-500">*</span>
                  </label>
                  <select 
                    [(ngModel)]="deliveryForm.deliveryMethod"
                    name="deliveryMethod"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{{ translate('lotteryResults.selectMethod') || 'Select Method' }}</option>
                    <option value="Standard">{{ translate('lotteryResults.standard') || 'Standard' }}</option>
                    <option value="Express">{{ translate('lotteryResults.express') || 'Express' }}</option>
                    <option value="Overnight">{{ translate('lotteryResults.overnight') || 'Overnight' }}</option>
                  </select>
                </div>

                <!-- Delivery Notes -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('lotteryResults.deliveryNotes') || 'Delivery Notes' }}
                  </label>
                  <textarea 
                    [(ngModel)]="deliveryForm.deliveryNotes"
                    name="deliveryNotes"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                    [placeholder]="translate('lotteryResults.deliveryNotesPlaceholder') || 'Any special delivery instructions...'"
                  ></textarea>
                </div>
              </div>
              
              @if (deliveryError()) {
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p class="text-sm text-red-800 dark:text-red-200">{{ deliveryError() }}</p>
                </div>
              }
              
              <div class="flex justify-center space-x-3 pt-4">
                <button 
                  type="button"
                  (click)="closeDeliveryModal()"
                  class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  {{ translate('lotteryResults.cancel') || 'Cancel' }}
                </button>
                <button 
                  type="submit"
                  [disabled]="creatingDelivery()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (creatingDelivery()) {
                    <span class="inline-flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ translate('lotteryResults.creating') || 'Creating...' }}
                    </span>
                  } @else {
                    {{ translate('lotteryResults.submitDelivery') || 'Submit Delivery Request' }}
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Claim Prize Modal -->
    @if (showClaimModal()) {
      <div 
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        (click)="closeClaimModal()"
      >
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800" (click)="$event.stopPropagation()">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ translate('lotteryResults.claimPrize') || 'Claim Prize' }}
              </h3>
              <button 
                (click)="closeClaimModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {{ translate('lotteryResults.claimPrizeDescription') || 'You are about to claim your prize. This action cannot be undone.' }}
              </p>
              
              <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  {{ translate('lotteryResults.prizeValue') || 'Prize Value' }}
                </p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ lotteryResultsService.formatCurrency(result()!.prizeValue) }}
                </p>
              </div>
              
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('lotteryResults.claimNotes') || 'Notes (Optional)' }}
              </label>
              <textarea 
                [(ngModel)]="claimNotes"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-transparent dark:bg-gray-700 dark:text-white"
                [placeholder]="translate('lotteryResults.claimNotesPlaceholder') || 'Add any notes about your claim...'"
              ></textarea>
            </div>
            
            @if (claimError()) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p class="text-sm text-red-800 dark:text-red-200">{{ claimError() }}</p>
              </div>
            }
            
            <div class="flex justify-center space-x-3">
              <button 
                (click)="closeClaimModal()"
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {{ translate('lotteryResults.cancel') || 'Cancel' }}
              </button>
              <button 
                (click)="claimPrize()"
                [disabled]="claiming()"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (claiming()) {
                  <span class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ translate('lotteryResults.claiming') || 'Claiming...' }}
                  </span>
                } @else {
                  {{ translate('lotteryResults.confirmClaim') || 'Confirm Claim' }}
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .spinning {
      animation: spin 2s linear;
    }
    
    .revealed {
      animation: reveal 0.5s ease-in-out;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes reveal {
      from { 
        opacity: 0;
        transform: scale(0.8);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LotteryResultDetailComponent implements OnInit {
  public lotteryResultsService = inject(LotteryResultsService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);

  @Input() resultId?: string;

  // Signals
  private _result = signal<LotteryResult | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _isSpinning = signal<boolean>(false);
  private _isQRRevealed = signal<boolean>(false);
  private _showClaimModal = signal<boolean>(false);
  private _claiming = signal<boolean>(false);
  private _claimError = signal<string | null>(null);
  private _showDeliveryModal = signal<boolean>(false);
  private _creatingDelivery = signal<boolean>(false);
  private _deliveryError = signal<string | null>(null);
  private _participants = signal<any[]>([]);
  private _loadingParticipants = signal<boolean>(false);
  private _participantsError = signal<string | null>(null);

  // Public signals
  public result = this._result.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public isSpinning = this._isSpinning.asReadonly();
  public isQRRevealed = this._isQRRevealed.asReadonly();
  public showClaimModal = this._showClaimModal.asReadonly();
  public claiming = this._claiming.asReadonly();
  public claimError = this._claimError.asReadonly();
  public showDeliveryModal = this._showDeliveryModal.asReadonly();
  public creatingDelivery = this._creatingDelivery.asReadonly();
  public deliveryError = this._deliveryError.asReadonly();
  public participants = this._participants.asReadonly();
  public loadingParticipants = this._loadingParticipants.asReadonly();
  public participantsError = this._participantsError.asReadonly();

  // Claim form
  public claimNotes: string = '';

  // Delivery form
  public deliveryForm: CreatePrizeDeliveryRequest = {
    lotteryResultId: '',
    recipientName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    deliveryMethod: '',
    deliveryNotes: ''
  };

  ngOnInit(): void {
    if (this.resultId) {
      this.loadResult(this.resultId);
    }
  }

  private loadResult(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.lotteryResultsService.getLotteryResult(id).subscribe({
      next: (result) => {
        this._result.set(result);
        this._loading.set(false);
        // Load participants if drawId is available
        if (result.drawId) {
          this.loadParticipants(result.drawId);
        }
      },
      error: (error) => {
        this._error.set(error.message || 'Failed to load lottery result');
        this._loading.set(false);
      }
    });
  }

  private async loadParticipants(drawId: string): Promise<void> {
    this._loadingParticipants.set(true);
    this._participantsError.set(null);

    try {
      const participants = await firstValueFrom(this.lotteryService.getDrawParticipants(drawId));
      this._participants.set(participants || []);
    } catch (error: any) {
      console.error('Error loading draw participants:', error);
      this._participantsError.set(error?.message || this.translate('draws.error.loadFailed'));
    } finally {
      this._loadingParticipants.set(false);
    }
  }

  toggleQRCode(): void {
    if (this.isQRRevealed()) {
      this._isQRRevealed.set(false);
      this._isSpinning.set(false);
      return;
    }

    // Start spinning animation
    this._isSpinning.set(true);
    
    // After 2 seconds, reveal QR code
    setTimeout(() => {
      this._isSpinning.set(false);
      this._isQRRevealed.set(true);
    }, 2000);
  }

  downloadQRCode(): void {
    if (this.result()?.qrCodeImageUrl) {
      const link = document.createElement('a');
      link.href = this.result()!.qrCodeImageUrl!;
      link.download = `lottery-result-${this.result()!.winnerTicketNumber}.png`;
      link.click();
    }
  }

  shareResult(): void {
    if (navigator.share && this.result()) {
      navigator.share({
        title: `Lottery Result - ${this.result()!.winnerTicketNumber}`,
        text: `Check out this lottery result: ${this.result()!.prizeDescription}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        alert('Result link copied to clipboard!');
      }).catch(console.error);
    }
  }

  goBack(): void {
    window.history.back();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  isCurrentUserWinner(): boolean {
    const currentUser = this.authService.getCurrentUser()();
    const result = this.result();
    if (!currentUser || !result) {
      return false;
    }
    // Compare user IDs
    return currentUser.id === result.winnerUserId;
  }

  openClaimModal(): void {
    this._showClaimModal.set(true);
    this._claimError.set(null);
    this.claimNotes = '';
  }

  closeClaimModal(): void {
    this._showClaimModal.set(false);
    this._claimError.set(null);
    this.claimNotes = '';
  }

  claimPrize(): void {
    const result = this.result();
    if (!result) {
      return;
    }

    this._claiming.set(true);
    this._claimError.set(null);

    this.lotteryResultsService.claimPrize(result.id, this.claimNotes || undefined).subscribe({
      next: (updatedResult) => {
        this._result.set(updatedResult);
        this._showClaimModal.set(false);
        this._claiming.set(false);
        this.claimNotes = '';
        // Show success message (you might want to use a toast service here)
        alert(this.translate('lotteryResults.claimSuccess') || 'Prize claimed successfully!');
      },
      error: (error) => {
        this._claimError.set(error.message || this.translate('lotteryResults.claimError') || 'Failed to claim prize');
        this._claiming.set(false);
      }
    });
  }

  openDeliveryModal(): void {
    const result = this.result();
    if (!result) {
      return;
    }

    // Initialize form with result ID
    this.deliveryForm = {
      lotteryResultId: result.id,
      recipientName: result.winnerName || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      email: result.winnerEmail || '',
      deliveryMethod: '',
      deliveryNotes: ''
    };

    this._showDeliveryModal.set(true);
    this._deliveryError.set(null);
  }

  closeDeliveryModal(): void {
    this._showDeliveryModal.set(false);
    this._deliveryError.set(null);
    this.deliveryForm = {
      lotteryResultId: '',
      recipientName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      email: '',
      deliveryMethod: '',
      deliveryNotes: ''
    };
  }

  createDelivery(): void {
    const result = this.result();
    if (!result) {
      return;
    }

    this._creatingDelivery.set(true);
    this._deliveryError.set(null);

    this.lotteryResultsService.createPrizeDelivery(this.deliveryForm).subscribe({
      next: (delivery) => {
        this._showDeliveryModal.set(false);
        this._creatingDelivery.set(false);
        // Show success message
        alert(this.translate('lotteryResults.deliverySuccess') || 'Prize delivery request created successfully!');
        // Reset form
        this.closeDeliveryModal();
      },
      error: (error) => {
        this._deliveryError.set(error.message || this.translate('lotteryResults.deliveryError') || 'Failed to create delivery request');
        this._creatingDelivery.set(false);
      }
    });
  }
}
