import { Component, input, output, OnInit, OnChanges, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  link?: string;
}

@Component({
  selector: 'app-promotions-sliding-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
        (click)="close.emit()">
      </div>
    }
    
      <!-- Menu -->
      <div 
        class="fixed left-0 top-32 h-[calc(100vh-8rem)] w-80 md:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="isOpen()"
        [class.-translate-x-full]="!isOpen()">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-500">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-white">
              {{ translate('nav.promotions') }}
            </h2>
            <button 
              (click)="close.emit()"
              class="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Promotions List -->
        <div class="overflow-y-auto h-[calc(100vh-64px)] p-4">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          } @else if (promotions().length === 0) {
            <div class="text-center py-8">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-2 0h2m0 0v13m0-13l-3-3m3 3l3-3"></path>
              </svg>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('promotions.noPromotions') }}
              </p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (promotion of promotions(); track promotion.id) {
                <div 
                  class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  [routerLink]="promotion.link || ['/promotions']"
                  (click)="close.emit()">
                  @if (promotion.imageUrl) {
                    <img 
                      [src]="promotion.imageUrl" 
                      [alt]="promotion.title"
                      class="w-full h-32 object-cover">
                  }
                  <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {{ promotion.title }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {{ promotion.description }}
                    </p>
                    <div class="flex items-center justify-between">
                      <span 
                        class="px-2 py-1 text-xs rounded-full"
                        [class.bg-green-100]="promotion.isActive"
                        [class.text-green-800]="promotion.isActive"
                        [class.bg-gray-100]="!promotion.isActive"
                        [class.text-gray-800]="!promotion.isActive"
                        [class.dark:bg-green-900]="promotion.isActive"
                        [class.dark:text-green-200]="promotion.isActive"
                        [class.dark:bg-gray-700]="!promotion.isActive"
                        [class.dark:text-gray-300]="!promotion.isActive">
                        {{ promotion.isActive ? translate('promotions.active') : translate('promotions.inactive') }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(promotion.startDate) }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PromotionsSlidingMenuComponent implements OnInit {
  isOpen = input.required<boolean>();
  close = output<void>();
  
  private translationService = inject(TranslationService);
  
  promotions = signal<Promotion[]>([]);
  isLoading = signal(false);

  constructor() {
    // Watch for menu open state changes and load promotions
    // Use effect to watch for isOpen() changes
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.loadPromotions();
      }
    });
  }

  ngOnInit(): void {
    // Load promotions if menu is already open on init
    if (this.isOpen()) {
      this.loadPromotions();
    }
  }

  async loadPromotions(): Promise<void> {
    this.isLoading.set(true);
    try {
      // TODO: Replace with actual API call when promotions endpoint is available
      // For now, use mock data or fetch from promotions page component
      const mockPromotions: Promotion[] = [
        {
          id: '1',
          title: 'Welcome Bonus',
          description: 'Get 10% off your first lottery ticket purchase!',
          startDate: new Date().toISOString(),
          isActive: true,
          link: '/promotions'
        },
        {
          id: '2',
          title: 'Referral Program',
          description: 'Refer a friend and both get bonus tickets!',
          startDate: new Date().toISOString(),
          isActive: true,
          link: '/promotions'
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      this.promotions.set(mockPromotions);
    } catch (error) {
      console.error('Error loading promotions:', error);
      this.promotions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

