import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { ToastService } from '../../services/toast.service';
import { LotteryParticipantStats } from '../../interfaces/watchlist.interface';

@Component({
  selector: 'app-participant-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ translate('participants.title') }}
      </h3>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !stats()" class="text-center py-8">
        <svg class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <p class="text-gray-600 dark:text-gray-400">{{ translate('participants.empty') }}</p>
      </div>

      <!-- Stats Content -->
      <div *ngIf="!loading() && stats()" class="space-y-4">
        <!-- Participant Count -->
        <div class="flex items-center justify-between">
          <span class="text-gray-600 dark:text-gray-400">{{ translateWithParams('participants.count', { count: stats()?.uniqueParticipants || 0 }) }}</span>
          <span class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.uniqueParticipants || 0 }}</span>
        </div>

        <!-- Max Participants (if set) -->
        <div *ngIf="stats()?.maxParticipants" class="flex items-center justify-between">
          <span class="text-gray-600 dark:text-gray-400">{{ translateWithParams('participants.maxParticipants', { max: stats()?.maxParticipants }) }}</span>
          <span class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.maxParticipants }}</span>
        </div>

        <!-- Progress Bar (if max participants set) -->
        <div *ngIf="stats()?.maxParticipants" class="w-full">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{{ translate('participants.progress') }}</span>
            <span>{{ progressPercentage() }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              class="h-2.5 rounded-full transition-all duration-300"
              [class.bg-green-500]="!stats()?.isCapReached"
              [class.bg-red-500]="stats()?.isCapReached"
              [style.width.%]="progressPercentage()">
            </div>
          </div>
        </div>

        <!-- Remaining Slots -->
        <div *ngIf="stats()?.remainingSlots !== undefined && stats()?.remainingSlots !== null" class="flex items-center justify-between">
          <span class="text-gray-600 dark:text-gray-400">{{ translateWithParams('participants.remainingSlots', { count: stats()?.remainingSlots! }) }}</span>
          <span class="text-lg font-bold text-green-600 dark:text-green-400">{{ stats()?.remainingSlots }}</span>
        </div>

        <!-- Cap Reached Badge -->
        <div *ngIf="stats()?.isCapReached" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-red-800 dark:text-red-200 font-semibold">{{ translate('participants.capReached') }}</span>
          </div>
        </div>

        <!-- Unlimited Participants -->
        <div *ngIf="!stats()?.maxParticipants" class="text-center py-2">
          <span class="text-gray-500 dark:text-gray-400 text-sm">{{ translate('participants.unlimited') }}</span>
        </div>

        <!-- Total Tickets -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span class="text-gray-600 dark:text-gray-400">{{ translate('participants.totalTickets') }}</span>
          <span class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.totalTickets || 0 }}</span>
        </div>

        <!-- Last Entry Date -->
        <div *ngIf="stats()?.lastEntryDate" class="flex items-center justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">{{ translate('participants.lastEntry') }}</span>
          <span class="text-gray-600 dark:text-gray-300">{{ formatDate(stats()?.lastEntryDate) }}</span>
        </div>
      </div>
    </div>
  `
})
export class ParticipantStatsComponent implements OnInit {
  houseId = input.required<string>();
  
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private errorMessageService = inject(ErrorMessageService);
  private toastService = inject(ToastService);

  stats = signal<LotteryParticipantStats | null>(null);
  loading = signal<boolean>(false);

  progressPercentage = computed(() => {
    const s = this.stats();
    if (!s?.maxParticipants) return 0;
    return Math.min(100, (s.uniqueParticipants / s.maxParticipants) * 100);
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.lotteryService.getParticipantStats(this.houseId()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading participant stats:', error);
        const errorMessage = this.errorMessageService.getErrorMessage(error);
        this.toastService.error(errorMessage);
        this.loading.set(false);
      }
    });
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
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
}


