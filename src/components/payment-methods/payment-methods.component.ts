import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { FocusTrapService } from '../../services/focus-trap.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl" #paymentMethodsContainer>
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ translate('payment.methods.title') }}
      </div>

      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ translate('payment.methods.title') }}
      </h1>

      <p class="text-gray-600 dark:text-gray-400 mb-8">
        {{ translate('payment.methods.description') }}
      </p>

      <!-- Payment Methods Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Stripe Payment Method -->
        <div 
          class="border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
          (click)="selectPaymentMethod('stripe')"
          (keydown.enter)="selectPaymentMethod('stripe')"
          (keydown.space)="selectPaymentMethod('stripe'); $event.preventDefault()"
          [attr.aria-label]="translate('payment.methods.selectStripe')"
          role="button"
          tabindex="0">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ translate('payment.methods.stripe') }}
            </h3>
            <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.532-5.851-6.594-7.305h.003z"/>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ translate('payment.methods.stripeDescription') }}
          </p>
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {{ translate('payment.methods.creditDebitCards') }}
          </div>
        </div>

        <!-- Crypto Payment Method -->
        <div 
          class="border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
          (click)="selectPaymentMethod('crypto')"
          (keydown.enter)="selectPaymentMethod('crypto')"
          (keydown.space)="selectPaymentMethod('crypto'); $event.preventDefault()"
          [attr.aria-label]="translate('payment.methods.selectCrypto')"
          role="button"
          tabindex="0">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ translate('payment.methods.crypto') }}
            </h3>
            <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.273 5.789c.238 0 .462.027.673.076v1.715a3.687 3.687 0 00-.673-.07c-1.891 0-3.375 1.345-3.375 3.12 0 1.775 1.485 3.12 3.375 3.12.238 0 .462-.027.673-.07v1.715a5.503 5.503 0 01-.673.076c-2.957 0-5.25-2.139-5.25-4.84 0-2.7 2.293-4.84 5.25-4.84zm5.395 2.582v1.715a3.676 3.676 0 00-.673-.07c-1.891 0-3.375 1.345-3.375 3.12 0 1.775 1.485 3.12 3.375 3.12.238 0 .462-.027.673-.07v1.715a5.503 5.503 0 01-.673.076c-2.957 0-5.25-2.139-5.25-4.84 0-2.7 2.293-4.84 5.25-4.84.238 0 .462.027.673.076z"/>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ translate('payment.methods.cryptoDescription') }}
          </p>
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {{ translate('payment.methods.cryptocurrencies') }}
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="mt-8">
        <button 
          (click)="goBack()"
          (keydown.enter)="goBack()"
          (keydown.space)="goBack(); $event.preventDefault()"
          [attr.aria-label]="translate('common.back')"
          class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
          {{ translate('common.back') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class PaymentMethodsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private localeService = inject(LocaleService);
  private focusTrapService = inject(FocusTrapService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnInit(): void {
    // Component initialized
  }

  selectPaymentMethod(method: 'stripe' | 'crypto'): void {
    const productId = this.route.snapshot.queryParams['productId'];
    const quantity = this.route.snapshot.queryParams['quantity'] || 1;

    if (productId) {
      this.router.navigate([`/payment/${method}`], {
        queryParams: { productId, quantity }
      });
    } else {
      // If no product ID, navigate to product selector
      this.router.navigate(['/products']);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
