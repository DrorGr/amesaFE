import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

// AM-34: Promotion details in separate data structure
interface PromotionDetail {
  id: string;
  icon: string;
  title: string;
  titleKey: string;
  briefKey: string;
  gradient: string;
  purchased: boolean;
  details: {
    description: string;
    features: string[];
    price: string;
    duration: string;
  };
}

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

        <!-- AM-31: Wide Rectangles Grid, AM-32: Single promotion per rectangle -->
        <div class="space-y-6">
          @for (promotion of promotions; track promotion.id) {
            <!-- AM-33: Each promotion with details and purchase button -->
            <div class="promotion-card bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                 [class.expanded]="expandedPromotion() === promotion.id">
              <div class="p-8 cursor-pointer" (click)="!promotion.purchased && toggleExpanded(promotion.id)">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4 flex-1">
                    <div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl text-white" 
                         [ngClass]="promotion.gradient">
                      {{ promotion.icon }}
                    </div>
                    <div class="flex-1">
                      <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                        {{ translate(promotion.titleKey) }}
                      </h3>
                      <p class="text-gray-600 dark:text-gray-400">
                        {{ translate(promotion.briefKey) }}
                      </p>
                    </div>
                  </div>
                  <!-- AM-28: Changed "Learn more" to "Purchase" -->
                  @if (promotion.purchased) {
                    <div class="flex items-center space-x-2 text-green-600 dark:text-green-400 px-4 py-2">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      <span class="font-semibold">{{ translate('promotions.purchased') }}</span>
                    </div>
                  } @else {
                    <div class="flex items-center space-x-3">
                      <!-- AM-29: Arrow down to expand details -->
                      <button class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200">
                        <svg class="w-6 h-6 transition-transform duration-200"
                             [class.rotate-180]="expandedPromotion() === promotion.id"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      <button class="btn-primary" (click)="purchasePromotion(promotion.id); $event.stopPropagation()">
                        {{ translate('promotions.purchase') }}
                      </button>
                    </div>
                  }
                </div>
              </div>
              
              <!-- AM-35: Expanded details section -->
              @if (expandedPromotion() === promotion.id) {
                <div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-8 expanded-details">
                  <div class="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Details
                      </h4>
                      <p class="text-gray-700 dark:text-gray-300 mb-6">
                        {{ promotion.details.description }}
                      </p>
                      <div class="space-y-2">
                        @for (feature of promotion.details.features; track $index) {
                          <div class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
                          </div>
                        }
                      </div>
                    </div>
                    <div>
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div class="text-center mb-6">
                          <div class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {{ promotion.details.price }}
                          </div>
                          <div class="text-gray-600 dark:text-gray-400">
                            {{ promotion.details.duration }}
                          </div>
                        </div>
                        <button class="btn-primary w-full text-xl py-4" (click)="purchasePromotion(promotion.id)">
                          {{ translate('promotions.purchase') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
    
    /* AM-31: Wide rectangle styling */
    .promotion-card {
      width: 100% !important;
      min-height: 120px !important;
    }
    
    /* AM-35: Expanded state animation */
    .promotion-card.expanded {
      transform: scale(1.01) !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    }
    
    .expanded-details {
      animation: slideDown 0.3s ease-out !important;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* AM-30: Purchased - ensure green background */
    .purchased-badge {
      background-color: #DEF7EC !important;
      color: #03543F !important;
      padding: 0.5rem 1rem !important;
      border-radius: 9999px !important;
    }
  `]
})
export class PromotionsPageComponent {
  private translationService = inject(TranslationService);
  
  // AM-34: Promotions data in separate structure
  promotions: PromotionDetail[] = [
    {
      id: 'gold-membership',
      icon: '👑',
      title: 'Gold Membership',
      titleKey: 'promotions.becomeMember',
      briefKey: 'promotions.becomeMemberBrief',
      gradient: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      purchased: false,
      details: {
        description: 'Join our exclusive Gold Membership program and unlock premium benefits including priority access to new lotteries, exclusive promotions, and enhanced winning opportunities.',
        features: [
          'Priority access to all new lotteries',
          'Exclusive member-only promotions',
          '10% discount on all ticket purchases',
          'Early notification of draw results',
          'Dedicated customer support'
        ],
        price: '$99.99',
        duration: 'per year'
      }
    },
    {
      id: 'amesa-stars',
      icon: '⭐',
      title: 'Amesa Stars',
      titleKey: 'promotions.amesaStars',
      briefKey: 'promotions.amesaStarsBrief',
      gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
      purchased: true,
      details: {
        description: 'Earn Amesa Stars with every ticket purchase and redeem them for free entries, discounts, and exclusive rewards.',
        features: [
          'Earn 1 star per dollar spent',
          'Redeem stars for free lottery entries',
          'Special bonus star events',
          'Exclusive star member rewards',
          'Never expire stars'
        ],
        price: 'Free',
        duration: 'included with account'
      }
    },
    {
      id: 'take-part',
      icon: '🤝',
      title: 'Take Part',
      titleKey: 'promotions.takePart',
      briefKey: 'promotions.takePartBrief',
      gradient: 'bg-gradient-to-br from-green-400 to-green-600',
      purchased: false,
      details: {
        description: 'Participate in special community events and group lotteries with enhanced odds and shared winning opportunities.',
        features: [
          'Access to community lottery pools',
          'Shared odds increase winning chances',
          'Monthly special event lotteries',
          'Community jackpot opportunities',
          'Social lottery experience'
        ],
        price: '$4.99',
        duration: 'per entry'
      }
    }
  ];
  
  expandedPromotion = signal<string | null>(null);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  // AM-29, AM-35: Toggle expanded state
  toggleExpanded(promotionId: string) {
    if (this.expandedPromotion() === promotionId) {
      this.expandedPromotion.set(null);
    } else {
      this.expandedPromotion.set(promotionId);
    }
  }
  
  // AM-35: Purchase promotion handler
  purchasePromotion(promotionId: string) {
    console.log('Purchasing promotion:', promotionId);
    // TODO: Implement actual purchase logic
    // This would connect to payment service and update user's promotions
  }
}