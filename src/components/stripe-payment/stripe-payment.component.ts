import { Component, OnInit, OnDestroy, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StripeService, PaymentIntentResponse } from '../../services/stripe.service';
import { PaymentService } from '../../services/payment.service';
import { ProductService } from '../../services/product.service';
import { StripePaymentElement } from '@stripe/stripe-js';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { FocusTrapService } from '../../services/focus-trap.service';

@Component({
  selector: 'app-stripe-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-2xl" #paymentContainer>
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (loading()) {
          {{ translate('payment.stripe.loading') }}
        } @else if (error()) {
          {{ translate('payment.stripe.error') }}: {{ error() }}
        } @else if (success()) {
          {{ translate('payment.stripe.success') }}
        }
      </div>

      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ translate('payment.stripe.title') }}
      </h1>

      <!-- Loading -->
      @if (loading()) {
        <div 
          class="text-center py-8 text-gray-700 dark:text-gray-300"
          [attr.aria-live]="'polite'"
          [attr.aria-busy]="true">
          {{ translate('payment.stripe.processing') }}
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div 
          class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
          role="alert"
          [attr.aria-live]="'assertive'">
          {{ error() }}
        </div>
      }

      <!-- Payment Element Container -->
      @if (!loading() && !error() && clientSecret()) {
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 shadow-sm">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.stripe.paymentDetails') }}
          </h2>
          <div id="stripe-payment-element" class="mb-4" [attr.aria-label]="translate('payment.stripe.paymentForm')"></div>
          
          @if (requiresAction()) {
            <div 
              class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4"
              role="alert"
              [attr.aria-live]="'polite'">
              {{ translate('payment.stripe.requiresAction') }}
            </div>
          }

          <button 
            type="button"
            (click)="confirmPayment()"
            (keydown.enter)="confirmPayment()"
            (keydown.space)="confirmPayment(); $event.preventDefault()"
            [disabled]="processing()"
            [attr.aria-label]="translate('payment.stripe.confirmButton')"
            [attr.aria-describedby]="processing() ? 'processing-help' : null"
            class="w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none transition-colors duration-200">
            @if (processing()) {
              {{ translate('payment.stripe.processing') }}
            } @else {
              {{ translate('payment.stripe.pay') }} {{ localeService.formatCurrency(totalAmount(), currency()) }}
            }
          </button>
          @if (processing()) {
            <div id="processing-help" class="sr-only">
              {{ translate('payment.stripe.processingHelp') }}
            </div>
          }
        </div>
      }

      <!-- Success -->
      @if (success()) {
        <div 
          class="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4"
          role="alert"
          [attr.aria-live]="'polite'">
          {{ translate('payment.stripe.success') }}
        </div>
      }
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
export class StripePaymentComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService); // Public for template access
  private focusTrapService = inject(FocusTrapService);

  loading = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  clientSecret = signal<string | null>(null);
  requiresAction = signal(false);
  totalAmount = signal(0);
  currency = signal('USD');
  paymentElement: StripePaymentElement | null = null;

  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  async ngOnInit() {
    const productId = this.route.snapshot.queryParams['productId'];
    const quantity = parseInt(this.route.snapshot.queryParams['quantity'] || '1');

    if (productId) {
      await this.initializePayment(productId, quantity);
    } else {
      this.error.set('No product selected');
    }
  }

  ngOnDestroy() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
    }
  }

  async initializePayment(productId: string, quantity: number) {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Get product price (server-side)
      const price = await this.productService.getProductPrice(productId, quantity).toPromise();
      if (!price) {
        throw new Error('Failed to get product price');
      }

      this.totalAmount.set(price);
      
      // Create payment intent
      const idempotencyKey = this.paymentService.generateIdempotencyKey();
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: price,
        currency: 'USD',
        productId,
        quantity,
        idempotencyKey
      }).toPromise();

      if (!paymentIntent) {
        throw new Error('Failed to create payment intent');
      }

      this.clientSecret.set(paymentIntent.clientSecret);
      this.currency.set(paymentIntent.currency);
      this.requiresAction.set(paymentIntent.requiresAction);

      // Create and mount payment element
      this.paymentElement = await this.stripeService.createPaymentElement('stripe-payment-element');
      
      this.loading.set(false);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to initialize payment');
      this.loading.set(false);
      console.error(err);
    }
  }

  async confirmPayment() {
    if (!this.paymentElement || !this.clientSecret()) {
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    try {
      const result = await this.stripeService.confirmPayment(this.clientSecret()!);
      
      if (result.success) {
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/payment/success']);
        }, 2000);
      } else {
        this.error.set(result.error || 'Payment failed');
        this.processing.set(false);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Payment failed');
      this.processing.set(false);
      console.error(err);
    }
  }
}

