import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { PromotionService, PromotionDto } from '../../services/promotion.service';
import { AuthService } from '../../services/auth.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-promotions-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Promotions" 
              class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('promotions.heroTitle') }}
              </h1>
              <p class="text-2xl md:text-2xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('promotions.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Introduction -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('promotions.availablePromotions') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('promotions.introduction') }}
            </p>
          </div>
        </section>

        <!-- Promotions Grid -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-16">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        } @else if (promotions().length === 0) {
          <div class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1013.5 8H12m-2 0h2m0 0v13m0-13l-3-3m3 3l3-3"></path>
            </svg>
            <p class="text-xl text-gray-600 dark:text-gray-400">
              {{ translate('promotions.noPromotions') }}
            </p>
          </div>
        } @else {
          <div class="space-y-8">
            @for (promotion of promotions(); track promotion.id) {
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div class="p-8">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-4 flex-1">
                      <div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex-shrink-0">
                        🎁
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ promotion.name }}
                          </h3>
                          @if (promotion.code) {
                            <span class="px-3 py-1 text-sm font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              {{ promotion.code }}
                            </span>
                          }
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 mb-2">
                          {{ promotion.description }}
                        </p>
                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          @if (promotion.type === 'percentage') {
                            <span class="font-semibold text-green-600 dark:text-green-400">
                              {{ promotion.value }}% {{ translate('promotions.off') }}
                            </span>
                          } @else if (promotion.type === 'fixed' || promotion.type === 'fixed_amount') {
                            <span class="font-semibold text-green-600 dark:text-green-400">
                              {{ formatCurrency(promotion.value) }} {{ translate('promotions.off') }}
                            </span>
                          }
                          <span [class.bg-green-100]="promotion.isActive"
                                [class.text-green-800]="promotion.isActive"
                                [class.bg-gray-100]="!promotion.isActive"
                                [class.text-gray-800]="!promotion.isActive"
                                [class.dark:bg-green-900]="promotion.isActive"
                                [class.dark:text-green-200]="promotion.isActive"
                                [class.dark:bg-gray-700]="!promotion.isActive"
                                [class.dark:text-gray-300]="!promotion.isActive"
                                class="px-2 py-1 text-xs rounded-full">
                            {{ promotion.isActive ? translate('promotions.active') : translate('promotions.inactive') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  @if (promotion.minAmount) {
                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ translate('promotions.minimumPurchase') }}: {{ formatCurrency(promotion.minAmount) }}
                      </p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class PromotionsPageComponent implements OnInit {
  private translationService = inject(TranslationService);
  private promotionService = inject(PromotionService);
  private authService = inject(AuthService);
  private localeService = inject(LocaleService);

  promotions = signal<PromotionDto[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading.set(true);
    
    const currentUser = this.authService.getCurrentUser()();
    if (currentUser && currentUser.isAuthenticated) {
      // Load available promotions for authenticated user
      this.promotionService.getAvailablePromotionsForUser(currentUser.id).subscribe({
        next: (promotions) => {
          this.promotions.set(promotions);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading promotions:', error);
          // Fallback to public promotions if available
          this.loadPublicPromotions();
        }
      });
    } else {
      // Load public promotions for unauthenticated users
      this.loadPublicPromotions();
    }
  }

  private loadPublicPromotions(): void {
    // Load all active promotions (public endpoint)
    this.promotionService.getPromotions({ isActive: true, limit: 20 }).subscribe({
      next: (response) => {
        this.promotions.set(response.items || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading public promotions:', error);
        this.promotions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) {
      return '$0.00';
    }
    return this.localeService.formatCurrency(amount);
  }
}