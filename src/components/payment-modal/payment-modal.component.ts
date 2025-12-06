import { Component, inject, input, output, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { StripeService, PaymentIntentResponse } from '../../services/stripe.service';
import { PaymentService } from '../../services/payment.service';
import { ProductService } from '../../services/product.service';
import { StripePaymentElement } from '@stripe/stripe-js';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { ToastService } from '../../services/toast.service';
import { FocusTrapService } from '../../services/focus-trap.service';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
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

    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 dark:bg-opacity-80"
      (click)="onBackdropClick($event)"
      role="dialog"
      [attr.aria-modal]="'true'"
      [attr.aria-labelledby]="'payment-modal-title'">
      <div 
        #modalContainer
        class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
        role="document">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 
              id="payment-modal-title"
              class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ translate('payment.stripe.title') }}
            </h2>
            <button 
              (click)="close.emit()"
              (keydown.enter)="close.emit()"
              (keydown.space)="close.emit(); $event.preventDefault()"
              (keydown.escape)="close.emit()"
              [attr.aria-label]="translate('payment.stripe.close')"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 focus:outline-none rounded">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

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
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {{ translate('payment.stripe.paymentDetails') }}
              </h3>
              <div id="stripe-payment-element" class="mb-4" [attr.aria-label]="translate('payment.stripe.paymentForm')" #paymentElementContainer></div>
              
              @if (requiresAction()) {
                <div 
                  class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4"
                  role="alert"
                  [attr.aria-live]="'polite'">
                  {{ translate('payment.stripe.requiresAction') }}
                </div>
              }

              <div class="flex gap-4">
                <button 
                  type="button"
                  (click)="close.emit()"
                  [attr.aria-label]="translate('payment.stripe.cancel')"
                  class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none">
                  {{ translate('payment.stripe.cancel') }}
                </button>
                <button 
                  type="button"
                  (click)="confirmPayment()"
                  (keydown.enter)="confirmPayment()"
                  (keydown.space)="confirmPayment(); $event.preventDefault()"
                  [disabled]="processing()"
                  [attr.aria-label]="translate('payment.stripe.confirmButton')"
                  [attr.aria-describedby]="processing() ? 'processing-help' : null"
                  class="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none">
                  @if (processing()) {
                    {{ translate('payment.stripe.processing') }}
                  } @else {
                    {{ translate('payment.stripe.pay') }} {{ localeService.formatCurrency(totalAmount(), currency()) }}
                  }
                </button>
              </div>
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
            <button 
              type="button"
              (click)="close.emit()"
              class="w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 focus:outline-none">
              {{ translate('payment.stripe.close') }}
            </button>
          }
        </div>
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
export class PaymentModalComponent implements AfterViewInit, OnDestroy {
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);
  private focusTrapService = inject(FocusTrapService);
  private toastService = inject(ToastService);

  // Inputs
  productId = input.required<string>();
  quantity = input<number>(1);
  houseTitle = input<string>('');

  // Outputs
  close = output<void>();
  paymentSuccess = output<{ paymentIntentId: string; transactionId?: string }>();

  // State
  loading = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  clientSecret = signal<string | null>(null);
  requiresAction = signal(false);
  totalAmount = signal(0);
  currency = signal('USD');
  paymentElement: StripePaymentElement | null = null;

  @ViewChild('modalContainer') modalContainer!: ElementRef;
  @ViewChild('paymentElementContainer') paymentElementContainer!: ElementRef;

  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService,
    private productService: ProductService
  ) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  ngAfterViewInit() {
    // Trap focus in modal
    this.focusTrapService.trapFocus(this.modalContainer.nativeElement);
    
    // Initialize payment
    this.initializePayment();
  }

  ngOnDestroy() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
    }
    this.focusTrapService.releaseFocus();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (!this.processing() && !this.loading()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !this.processing() && !this.loading()) {
      this.close.emit();
    }
  }

  async initializePayment() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const productId = this.productId();
      const quantity = this.quantity();

      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Get product price (server-side)
      const price = await firstValueFrom(this.productService.getProductPrice(productId, quantity));
      if (!price) {
        throw new Error('Failed to get product price');
      }

      this.totalAmount.set(price);
      
      // Create payment intent
      const idempotencyKey = this.paymentService.generateIdempotencyKey();
      const paymentIntent = await firstValueFrom(this.stripeService.createPaymentIntent({
        amount: price,
        currency: 'USD',
        productId,
        quantity,
        idempotencyKey
      }));

      if (!paymentIntent) {
        throw new Error('Failed to create payment intent');
      }

      this.clientSecret.set(paymentIntent.clientSecret);
      this.currency.set(paymentIntent.currency);
      this.requiresAction.set(paymentIntent.requiresAction);

      // Create and mount payment element (must pass clientSecret)
      if (!paymentIntent.clientSecret) {
        throw new Error('Payment intent missing client secret');
      }
      
      // Set loading to false so the element can be rendered
      // The element is conditionally rendered with @if (!loading() && !error() && clientSecret())
      this.loading.set(false);
      
      // Wait for Angular's change detection to render the element
      // Use setTimeout to let Angular's change detection cycle complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Wait for the DOM element to be rendered and ensure it's empty
      await this.waitForElement('stripe-payment-element');
      
      // Additional wait to ensure Angular's rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear any existing content in the container (prevents "contains child nodes" warning)
      const container = document.getElementById('stripe-payment-element');
      if (container) {
        container.innerHTML = '';
      }
      
      // Wait a bit more to ensure the container is empty
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.paymentElement = await this.stripeService.createPaymentElement('stripe-payment-element', paymentIntent.clientSecret);
      
      if (!this.paymentElement) {
        throw new Error('Failed to create payment element');
      }
      
      // Wait a bit more to ensure the element is fully mounted and ready
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err: any) {
      this.error.set(err.message || 'Failed to initialize payment');
      this.loading.set(false);
      console.error(err);
      this.toastService.error(this.error() || 'Failed to initialize payment', 5000);
    }
  }

  /**
   * Wait for a DOM element to exist before proceeding
   * Uses polling with exponential backoff
   */
  private async waitForElement(elementId: string, maxAttempts: number = 20, initialDelay: number = 50): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const element = document.getElementById(elementId);
      if (element) {
        return; // Element found
      }
      
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc. (capped at 500ms)
      const delay = Math.min(initialDelay * Math.pow(2, attempt), 500);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error(`Element #${elementId} not found after ${maxAttempts} attempts`);
  }

  async confirmPayment() {
    if (!this.paymentElement || !this.clientSecret()) {
      this.error.set('Payment element is not ready. Please wait for the payment form to load.');
      this.toastService.error('Payment form is not ready. Please wait a moment and try again.', 3000);
      return;
    }

    // Verify the element is still mounted
    const element = document.getElementById('stripe-payment-element');
    if (!element || element.children.length === 0) {
      this.error.set('Payment element is not mounted. Please refresh the page and try again.');
      this.toastService.error('Payment form error. Please refresh and try again.', 5000);
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    try {
      const result = await this.stripeService.confirmPayment(this.clientSecret()!);
      
      if (result.success) {
        this.success.set(true);
        this.toastService.success(this.translate('payment.stripe.success'), 3000);
        
        // Get payment intent ID from client secret (format: pi_xxx_secret_xxx)
        const paymentIntentId = this.clientSecret()?.split('_secret_')[0] || '';
        
        // Emit success event
        this.paymentSuccess.emit({ paymentIntentId });
        
        // Close modal after short delay
        setTimeout(() => {
          this.close.emit();
        }, 2000);
      } else {
        this.error.set(result.error || 'Payment failed');
        this.processing.set(false);
        this.toastService.error(result.error || 'Payment failed', 5000);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Payment failed');
      this.processing.set(false);
      console.error(err);
      this.toastService.error(this.error() || 'Payment failed', 5000);
    }
  }
}

