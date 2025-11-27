import { Component, inject, OnInit, OnDestroy, signal, computed, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';
import { LotteryTicketDto } from '../../models/house.model';

@Component({
  selector: 'app-active-entries-accordion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (currentUser()) {
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <button 
          (click)="toggleAccordion()" 
          class="w-full px-4 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative"
          [class.justify-center]="!isExpanded()"
          [class.justify-between]="isExpanded()">
          <div class="flex items-center gap-3">
            <span class="text-gray-700 dark:text-gray-300 font-semibold">
              {{ translate('nav.activeEntries') }}
            </span>
            @if (entriesCount() > 0) {
              <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                {{ entriesCount() }}
              </span>
            }
          </div>
          <svg 
            [class.rotate-180]="isExpanded()" 
            [class.opacity-0]="!isExpanded()"
            [class.opacity-100]="isExpanded()"
            class="w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-300 absolute right-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          [class.max-h-0]="!isExpanded()"
          [class.max-h-[1000px]]="isExpanded()"
          [class.opacity-0]="!isExpanded()"
          [class.opacity-100]="isExpanded()"
          class="overflow-hidden transition-all duration-300 ease-in-out">
          <div class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            } @else if (entries().length === 0) {
              <!-- Empty state -->
              <div class="py-6 text-center">
                <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  {{ translate('nav.enterLotteryToWin') }}
                </p>
                <button
                  (click)="navigateToHome()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors">
                  {{ translate('nav.viewLotteries') }}
                </button>
              </div>
            } @else {
              <!-- Entries list -->
              <div class="space-y-3 pt-3">
                @for (entry of entries(); track entry.id) {
                  <div 
                    class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    [routerLink]="['/houses', entry.houseId]">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {{ entry.houseTitle }}
                      </h4>
                      <span 
                        class="px-2 py-1 text-xs rounded-full font-semibold"
                        [class.bg-green-100]="entry.status === 'active'"
                        [class.text-green-800]="entry.status === 'active'"
                        [class.bg-yellow-100]="entry.status === 'winner'"
                        [class.text-yellow-800]="entry.status === 'winner'"
                        [class.dark:bg-green-900]="entry.status === 'active'"
                        [class.dark:text-green-200]="entry.status === 'active'"
                        [class.dark:bg-yellow-900]="entry.status === 'winner'"
                        [class.dark:text-yellow-200]="entry.status === 'winner'">
                        {{ getStatusText(entry.status) }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span class="font-mono">#{{ entry.ticketNumber }}</span>
                      <span class="text-gray-500 dark:text-gray-400">
                        {{ formatDate(entry.purchaseDate) }}
                      </span>
                    </div>
                  </div>
                }
                <div class="pt-2">
                  <button
                    (click)="navigateToActiveEntries()"
                    class="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    {{ translate('nav.viewAllEntries') }} ΓåÆ
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    /* Smooth accordion animation */
    .accordion-content {
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }
  `]
})
export class ActiveEntriesAccordionComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  currentUser = this.authService.getCurrentUser();
  entries = signal<LotteryTicketDto[]>([]);
  isLoading = signal(false);
  isExpanded = signal(false);
  
  entriesCount = computed(() => this.entries().length);
  private autoExpandEffect?: EffectRef;

  ngOnInit(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'active-entries-accordion.component.ts:ngOnInit',message:'Component initialized',data:{componentName:'ActiveEntriesAccordionComponent'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    this.loadActiveEntries();
    
    // Auto-expand if user has entries - properly cleanup effect
    this.autoExpandEffect = effect(() => {
      if (this.entries().length > 0 && !this.isExpanded()) {
        this.isExpanded.set(true);
      }
    });
  }
  
  ngOnDestroy(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'active-entries-accordion.component.ts:ngOnDestroy',message:'Component destroyed',data:{componentName:'ActiveEntriesAccordionComponent',effectCleaned:!!this.autoExpandEffect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    // Cleanup effect
    if (this.autoExpandEffect) {
      this.autoExpandEffect.destroy();
      this.autoExpandEffect = undefined;
    }
  }

  async loadActiveEntries(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const entries = await this.lotteryService.getUserActiveEntries().toPromise();
      if (entries) {
        this.entries.set(entries);
      }
    } catch (error) {
      console.error('Error loading active entries:', error);
      this.entries.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAccordion(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return this.translate('lottery.status.active');
      case 'winner':
        return this.translate('lottery.status.winner');
      default:
        return status;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToActiveEntries(): void {
    this.router.navigate(['/lottery/entries/active']);
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

