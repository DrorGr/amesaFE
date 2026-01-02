/**
 * PaymentConsolidatedStepComponent
 * Single-step consolidated payment flow combining quantity selection, order summary, and payment form
 */

import { Component, inject, input, output, signal, computed, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QRCodeComponent } from 'angularx-qrcode';
import { StripeService, PaymentIntentResponse } from '../../services/stripe.service';
import { CryptoPaymentService, CoinbaseChargeResponse } from '../../services/crypto-payment.service';
import { ProductService, ProductDto } from '../../services/product.service';
import { LotteryService } from '../../../lottery/services/lottery.service';
import { PaymentService } from '../../services/payment.service';
import { PaymentMethodPreferenceService } from '../../services/payment-method-preference.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { ToastService } from '@core/services/toast.service';
import { PaymentFlowState, PaymentMethod, PaymentSuccessEvent, QuantitySelectedEvent } from '@core/interfaces/payment-flow.interface';
import { StripePaymentElement } from '@stripe/stripe-js';
import { PAYMENT_PANEL_CONFIG } from '../../../../../config/payment-panel.config';

@Component({
  selector: 'app-payment-consolidated-step',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  template: `
    <div class="payment-consolidated-step">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (productLoading()) {
          {{ translate('payment.quantity.loading') }}
        } @else if (isPaymentSuccess()) {
          {{ translate('payment.success.title') }}
        } @else {
          {{ translate('payment.consolidated.ready') || 'Payment form ready' }}
        }
      </div>

      <!-- Product Loading -->
      @if (productLoading()) {
        <div class="text-center py-8" [attr.aria-busy]="true">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p class="mt-4 text-gray-700 dark:text-gray-300">{{ translate('payment.quantity.loading') }}</p>
        </div>
      }

      <!-- Main Content (when product loaded and not in success state) -->
      @if (!productLoading() && !isPaymentSuccess()) {
        <div class="space-y-6">
          <!-- Quantity Selector Section -->
          <div class="quantity-section">
            <label 
              for="quantity-input"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('payment.quantity.selectQuantity') || 'Quantity' }}
            </label>
            <div class="flex items-center gap-4">
              <button
                type="button"
                (click)="decreaseQuantity()"
                [disabled]="quantity() <= 1 || isProcessing() || priceCalculating()"
                [attr.aria-label]="translate('payment.quantity.decrease') || 'Decrease quantity'"
                class="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                -
              </button>
              <input
                id="quantity-input"
                type="number"
                [ngModel]="quantity()"
                (ngModelChange)="onQuantityChange($event)"
                [min]="1"
                [max]="maxQuantity()"
                [disabled]="isProcessing() || priceCalculating() || productSoldOut()"
                [attr.aria-label]="translate('payment.quantity.input') || 'Quantity'"
                [attr.aria-describedby]="quantityError() ? 'quantity-error' : null"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <button
                type="button"
                (click)="increaseQuantity()"
                [disabled]="quantity() >= maxQuantity() || isProcessing() || priceCalculating() || productSoldOut()"
                [attr.aria-label]="translate('payment.quantity.increase') || 'Increase quantity'"
                class="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                +
              </button>
            </div>
            
            @if (quantityError()) {
              <p 
                id="quantity-error"
                class="mt-2 text-sm text-red-600 dark:text-red-400"
                role="alert"
                [attr.aria-live]="'assertive'">
                {{ quantityError() }}
              </p>
            }

            @if (priceCalculating()) {
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {{ translate('payment.quantity.calculating') || 'Calculating price...' }}
              </p>
            }
          </div>

          <!-- Order Summary Section (sticky on mobile) -->
          @if (calculatedPrice() > 0) {
            <div class="order-summary-section sticky top-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {{ translate('payment.review.orderSummary') || 'Order Summary' }}
              </h3>
              <div class="space-y-2 text-sm">
                @if (houseTitle()) {
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.house') || 'House' }}:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">{{ houseTitle() }}</span>
                  </div>
                }
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.quantity') || 'Quantity' }}:</span>
                  <span class="text-gray-900 dark:text-gray-100 font-medium">{{ quantity() }}</span>
                </div>
                @if (unitPrice() > 0) {
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.unitPrice') || 'Unit Price' }}:</span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium">
                      {{ localeService.formatCurrency(unitPrice(), flowState().currency) }}
                    </span>
                  </div>
                }
                <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ translate('payment.review.total') || 'Total' }}:</span>
                  <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ localeService.formatCurrency(calculatedPrice(), flowState().currency) }}
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Payment Method Tabs -->
          <div class="payment-methods-section">
            <div class="flex border-b border-gray-200 dark:border-gray-700" role="tablist">
              <button
                type="button"
                (click)="selectPaymentMethod(PaymentMethod.Stripe)"
                [class.border-b-2]="selectedMethod() === PaymentMethod.Stripe"
                [class.border-blue-600]="selectedMethod() === PaymentMethod.Stripe"
                [class.text-blue-600]="selectedMethod() === PaymentMethod.Stripe"
                [class.dark:text-blue-400]="selectedMethod() === PaymentMethod.Stripe"
                [class.text-gray-600]="selectedMethod() !== PaymentMethod.Stripe"
                [class.dark:text-gray-400]="selectedMethod() !== PaymentMethod.Stripe"
                [attr.aria-selected]="selectedMethod() === PaymentMethod.Stripe"
                [attr.aria-controls]="'stripe-tab'"
                role="tab"
                [disabled]="isProcessing()"
                class="flex-1 py-3 px-4 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ translate('payment.method.stripe') }}
              </button>
              <button
                type="button"
                (click)="selectPaymentMethod(PaymentMethod.Crypto)"
                [class.border-b-2]="selectedMethod() === PaymentMethod.Crypto"
                [class.border-blue-600]="selectedMethod() === PaymentMethod.Crypto"
                [class.text-blue-600]="selectedMethod() === PaymentMethod.Crypto"
                [class.dark:text-blue-400]="selectedMethod() === PaymentMethod.Crypto"
                [class.text-gray-600]="selectedMethod() !== PaymentMethod.Crypto"
                [class.dark:text-gray-400]="selectedMethod() !== PaymentMethod.Crypto"
                [attr.aria-selected]="selectedMethod() === PaymentMethod.Crypto"
                [attr.aria-controls]="'crypto-tab'"
                role="tab"
                [disabled]="isProcessing()"
                class="flex-1 py-3 px-4 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ translate('payment.method.crypto') }}
              </button>
            </div>

            <!-- Stripe Tab Panel -->
            <div
              id="stripe-tab"
              role="tabpanel"
              [attr.aria-hidden]="selectedMethod() !== PaymentMethod.Stripe"
              [class.hidden]="selectedMethod() !== PaymentMethod.Stripe">
              
              @if (stripeLoading()) {
                <div class="text-center py-8">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p class="mt-4 text-gray-700 dark:text-gray-300">{{ translate('payment.stripe.loading') }}</p>
                </div>
              }

              @if (stripeError()) {
                <div 
                  class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
                  role="alert">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="font-semibold mb-1">{{ translate('payment.error.title') || 'Payment Error' }}</p>
                      <p class="text-sm">{{ stripeError() }}</p>
                    </div>
                    <button
                      type="button"
                      (click)="retryStripeInitialization()"
                      [disabled]="stripeLoading()"
                      [attr.aria-label]="translate('payment.error.retry') || 'Retry'"
                      class="ml-4 px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                      {{ translate('payment.error.retry') || 'Retry' }}
                    </button>
                  </div>
                </div>
              }

              @if (!stripeLoading() && !stripeError() && stripeClientSecret()) {
                <div class="stripe-container">
                  <div #stripeContainer id="{{ stripePaymentElementId }}"></div>
                  
                  @if (expiryCountdown() > 0 && expiryCountdown() < 60) {
                    <div class="mt-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
                      <p class="text-sm">
                        {{ translate('payment.stripe.expiring') || 'Payment session expires in' }}: 
                        <span class="font-semibold">{{ formatCountdown(expiryCountdown()) }}</span>
                      </p>
                      <button
                        type="button"
                        (click)="refreshPaymentIntent()"
                        class="mt-2 px-3 py-1 bg-yellow-600 dark:bg-yellow-700 text-white text-sm rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        {{ translate('payment.stripe.refresh') || 'Refresh' }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Crypto Tab Panel -->
            <div
              id="crypto-tab"
              role="tabpanel"
              [attr.aria-hidden]="selectedMethod() !== PaymentMethod.Crypto"
              [class.hidden]="selectedMethod() !== PaymentMethod.Crypto">
              
              @if (cryptoLoading()) {
                <div class="text-center py-8">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p class="mt-4 text-gray-700 dark:text-gray-300">{{ translate('payment.crypto.creating') || 'Creating payment...' }}</p>
                </div>
              }

              @if (cryptoError()) {
                <div 
                  class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
                  role="alert">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="font-semibold mb-1">{{ translate('payment.error.title') || 'Payment Error' }}</p>
                      <p class="text-sm">{{ cryptoError() }}</p>
                    </div>
                    <button
                      type="button"
                      (click)="retryCryptoCharge()"
                      [disabled]="cryptoLoading()"
                      [attr.aria-label]="translate('payment.error.retry') || 'Retry'"
                      class="ml-4 px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                      {{ translate('payment.error.retry') || 'Retry' }}
                    </button>
                  </div>
                </div>
              }

              @if (cryptoCharge() && !cryptoLoading() && !cryptoError()) {
                <div class="crypto-container text-center space-y-4">
                  <p class="text-gray-700 dark:text-gray-300">
                    {{ translate('payment.crypto.scanQR') || 'Scan the QR code to complete payment' }}
                  </p>
                  <div class="flex justify-center">
                    <qrcode
                      [qrdata]="cryptoCharge()!.hostedUrl"
                      [width]="256"
                      [errorCorrectionLevel]="'M'"
                      [attr.aria-label]="translate('payment.crypto.qrCode') || 'Payment QR code'">
                    </qrcode>
                  </div>
                  
                  @if (cryptoExpiryCountdown() > 0 && cryptoExpiryCountdown() < 300) {
                    <div class="mt-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
                      <p class="text-sm">
                        {{ translate('payment.crypto.expiring') || 'Payment expires in' }}: 
                        <span class="font-semibold">{{ formatCountdown(cryptoExpiryCountdown()) }}</span>
                      </p>
                    </div>
                  }
                  
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('payment.crypto.waiting') || 'Waiting for payment confirmation...' }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Pay Button -->
          <div class="pay-button-section">
            <button
              type="button"
              (click)="onPay()"
              [disabled]="!canProceed() || isProcessing() || priceCalculating()"
              [attr.aria-label]="translate('payment.stripe.pay') || 'Pay'"
              class="w-full py-3 px-6 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              @if (isProcessing()) {
                <span class="flex items-center justify-center">
                  <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  {{ translate('payment.stripe.processing') || 'Processing...' }}
                </span>
              } @else {
                {{ translate('payment.stripe.pay') || 'Pay' }} {{ localeService.formatCurrency(calculatedPrice(), flowState().currency) }}
              }
            </button>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (isPaymentSuccess()) {
        <div class="success-section text-center py-8">
          <div class="mb-4">
            <svg class="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {{ translate('payment.success.title') || 'Payment Successful!' }}
          </h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            @if (ticketCreationStatus() === 'success') {
              {{ translate('payment.success.ticketsCreated') || 'Your tickets have been created successfully.' }}
            } @else if (ticketCreationStatus() === 'pending') {
              {{ translate('payment.success.ticketsPending') || 'Your tickets will be created shortly.' }}
            } @else if (ticketCreationStatus() === 'failed') {
              {{ translate('payment.ticketCreation.failed') || 'Payment succeeded but ticket creation failed. Please retry.' }}
            } @else {
              {{ translate('payment.success.message') || 'Thank you for your payment!' }}
            }
          </p>
          @if (ticketCreationStatus() === 'failed') {
            <button
              type="button"
              (click)="retryTicketCreation()"
              [disabled]="ticketCreationStatus() === 'creating'"
              class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500">
              {{ translate('payment.ticketCreation.retry') || 'Retry Ticket Creation' }}
            </button>
          }
          @if (ticketCreationStatus() !== 'failed') {
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ translate('payment.success.closing') || 'This window will close automatically...' }}
            </p>
          }
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
export class PaymentConsolidatedStepComponent implements OnInit, AfterViewInit, OnDestroy {
  // Services
  private stripeService = inject(StripeService);
  private cryptoPaymentService = inject(CryptoPaymentService);
  private productService = inject(ProductService);
  private lotteryService = inject(LotteryService);
  private paymentService = inject(PaymentService);
  private paymentMethodPreference = inject(PaymentMethodPreferenceService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService); // Public for template access
  private toastService = inject(ToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Inputs
  flowState = input.required<PaymentFlowState>();
  initialQuantity = input<number>(1);

  // Outputs
  errorOccurred = output<string>();
  paymentSuccess = output<PaymentSuccessEvent>();
  quantityChanged = output<QuantitySelectedEvent>();

  // ViewChild
  @ViewChild('stripeContainer') stripeContainer!: ElementRef<HTMLElement>;

  // State signals
  product = signal<ProductDto | null>(null);
  productLoading = signal<boolean>(true);
  quantity = signal<number>(1);
  calculatedPrice = signal<number>(0);
  validationErrors = signal<string[]>([]);
  quantityError = signal<string | null>(null);
  priceCalculating = signal<boolean>(false);
  
  selectedMethod = signal<PaymentMethod>(PaymentMethod.Stripe);
  isProcessing = signal<boolean>(false);
  paymentSuccessState = signal<PaymentSuccessEvent | null>(null);
  ticketCreationStatus = signal<'idle' | 'creating' | 'success' | 'pending' | 'failed'>('idle');

  // Stripe state
  stripeLoading = signal<boolean>(false);
  stripeError = signal<string | null>(null);
  stripeClientSecret = signal<string | null>(null);
  stripePaymentElement: StripePaymentElement | null = null;
  stripePaymentElementId = `stripe-payment-element-${Math.random().toString(36).substring(2, 11)}`;
  expiryCountdown = signal<number>(0);
  stripePaymentIntentExpiresAt = signal<Date | null>(null);
  private expiryInterval: ReturnType<typeof setInterval> | null = null;

  // Crypto state
  cryptoLoading = signal<boolean>(false);
  cryptoError = signal<string | null>(null);
  cryptoCharge = signal<CoinbaseChargeResponse | null>(null);
  private cryptoPollingInterval: ReturnType<typeof setInterval> | null = null;
  private cryptoPollAttempts = signal<number>(0);

  // Cleanup
  private isDestroyed = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private destroy$ = new Subject<void>();
  
  // Ticket creation retry state
  private pendingTicketCreation: {
    paymentId: string;
    method: PaymentMethod;
    houseId?: string;
    quantity: number;
  } | null = null;
  private ticketCreationRetryCount = signal<number>(0);
  private readonly MAX_TICKET_CREATION_RETRIES = 3;

  // Quantity lock during payment (HIGH-2 fix)
  private quantityAtPaymentStart = signal<number | null>(null);

  // Stripe mounting lock (MEDIUM-4 fix)
  private isMountingStripe = false;
  private stripeMountTimeout: ReturnType<typeof setTimeout> | null = null;

  // Stripe retry state (MEDIUM-6 fix)
  private stripeRetryCount = 0;
  private readonly MAX_STRIPE_RETRIES = 3;

  // Crypto expiry countdown (MEDIUM-5 fix)
  cryptoExpiryCountdown = signal<number>(0);
  private cryptoExpiryInterval: ReturnType<typeof setInterval> | null = null;

  // Constants (LOW-2 fix)
  private readonly SUCCESS_AUTO_CLOSE_DELAY = 2000; // 2 seconds
  private readonly MAX_QUANTITY_FALLBACK = 100;

  // Expose enums to template
  PaymentMethod = PaymentMethod;
  PAYMENT_PANEL_CONFIG = PAYMENT_PANEL_CONFIG;

  // Computed properties
  maxQuantity = computed(() => {
    const prod = this.product();
    if (!prod) return 1;
    return prod.maxQuantityPerUser || prod.totalQuantityAvailable || this.MAX_QUANTITY_FALLBACK;
  });

  productSoldOut = computed(() => {
    const prod = this.product();
    if (!prod) return false;
    if (prod.totalQuantityAvailable !== undefined) {
      return prod.quantitySold >= prod.totalQuantityAvailable;
    }
    return false;
  });

  unitPrice = computed(() => {
    const qty = this.quantity();
    const price = this.calculatedPrice();
    return qty > 0 ? price / qty : 0;
  });

  canProceed = computed(() => {
    return this.calculatedPrice() > 0 && 
           this.quantity() >= 1 && 
           this.quantity() <= this.maxQuantity() &&
           !this.productSoldOut() &&
           this.validationErrors().length === 0 &&
           !this.quantityError();
  });

  houseTitle = computed(() => this.flowState().houseTitle);

  isPaymentSuccess = computed(() => this.paymentSuccessState() !== null);

  constructor() {
    // Effect for price calculation when quantity or product changes
    effect(() => {
      const qty = this.quantity();
      const prod = this.product();
      
      if (prod && !this.isDestroyed) {
        // HIGH-3: Invalidate Stripe payment intent when quantity changes
        if (this.stripeClientSecret() && this.quantityAtPaymentStart() !== null && qty !== this.quantityAtPaymentStart()) {
          // Quantity changed after payment started - invalidate payment intent
          this.unmountStripeElement();
          this.stopExpiryCountdown();
          this.quantityAtPaymentStart.set(null);
        }
        
        // Clear existing timer
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
        
        // Debounce price calculation
        this.debounceTimer = setTimeout(() => {
          if (!this.isDestroyed) {
            this.calculatePrice(qty, prod).catch(err => {
              if (!this.isDestroyed) {
                console.error('Price calculation error in effect:', err);
              }
            });
          }
          this.debounceTimer = null;
        }, PAYMENT_PANEL_CONFIG.DEBOUNCE_DELAY);
      }
    });

    // Effect for Stripe element mounting
    effect(() => {
      const method = this.selectedMethod();
      const clientSecret = this.stripeClientSecret();
      
      if (method === PaymentMethod.Stripe && clientSecret && !this.isDestroyed) {
        // MEDIUM-4: Prevent concurrent mount attempts
        if (this.isMountingStripe) {
          return;
        }
        
        // Clear any existing mount timeout
        if (this.stripeMountTimeout) {
          clearTimeout(this.stripeMountTimeout);
          this.stripeMountTimeout = null;
        }
        
        // Small delay to ensure DOM is ready (ViewChild might not be available yet)
        this.stripeMountTimeout = setTimeout(() => {
          if (!this.isDestroyed && !this.isMountingStripe) {
            this.mountStripeElement();
          }
          this.stripeMountTimeout = null;
        }, PAYMENT_PANEL_CONFIG.STRIPE_ELEMENT_INIT_DELAY);
      } else if (method !== PaymentMethod.Stripe) {
        // Unmount when switching away from Stripe
        if (this.stripeMountTimeout) {
          clearTimeout(this.stripeMountTimeout);
          this.stripeMountTimeout = null;
        }
        this.unmountStripeElement();
      }
    });

    // Effect to auto-initialize Stripe when price is ready
    effect(() => {
      const price = this.calculatedPrice();
      const method = this.selectedMethod();
      const hasClientSecret = this.stripeClientSecret();
      
      if (price > 0 && method === PaymentMethod.Stripe && !hasClientSecret && !this.stripeLoading() && !this.isDestroyed) {
        // Auto-initialize Stripe when price is calculated
        this.initializeStripe();
      }
    });

    // Register cleanup
    this.destroyRef.onDestroy(() => {
      this.ngOnDestroy();
    });
  }

  async ngOnInit() {
    this.isDestroyed = false;
    this.quantity.set(this.initialQuantity());
    
    // Check for 3DS return
    await this.check3DSReturn();
    
    // Load product (price calculation effect will trigger Stripe initialization)
    await this.loadProduct();
  }

  ngAfterViewInit() {
    // Stripe element will be mounted via effect when conditions are met
  }

  ngOnDestroy() {
    // HIGH-4: Stop all intervals/timers BEFORE setting isDestroyed
    // This prevents race conditions where callbacks execute after isDestroyed is set
    
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Clear Stripe mount timeout
    if (this.stripeMountTimeout) {
      clearTimeout(this.stripeMountTimeout);
      this.stripeMountTimeout = null;
    }
    
    // Stop crypto polling (synchronously)
    this.stopCryptoPolling();
    
    // Stop crypto expiry countdown
    this.stopCryptoExpiryCountdown();
    
    // Stop expiry countdown
    this.stopExpiryCountdown();
    
    // Unmount Stripe element
    this.unmountStripeElement();
    
    // MEDIUM-7: Clean up 3DS state from sessionStorage
    try {
      sessionStorage.removeItem('payment3DSState');
    } catch (error) {
      // Ignore sessionStorage errors (e.g., in private browsing)
    }
    
    // Set isDestroyed AFTER all cleanup
    this.isDestroyed = true;
    
    // Complete destroy subject
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper methods
  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // Product loading
  private async loadProduct() {
    this.productLoading.set(true);
    this.quantityError.set(null);
    
    try {
      const product = await firstValueFrom(this.productService.getProduct(this.flowState().productId));
      this.product.set(product);
      
      // Update flow state currency
      if (product.currency) {
        // Note: We can't directly update parent's flowState, but we can emit events
        // The parent should handle currency updates
      }
      
      // Validate initial quantity
      await this.validateQuantity(this.quantity());
    } catch (err: any) {
      const errorMsg = err?.message || this.translate('payment.quantity.loadError');
      this.quantityError.set(errorMsg);
      this.errorOccurred.emit(errorMsg);
      this.toastService.error(errorMsg);
    } finally {
      this.productLoading.set(false);
    }
  }

  // Quantity management
  decreaseQuantity() {
    if (this.quantity() > 1 && !this.isProcessing() && !this.priceCalculating()) {
      this.quantity.update(qty => qty - 1);
    }
  }

  increaseQuantity() {
    const max = this.maxQuantity();
    if (this.quantity() < max && !this.isProcessing() && !this.priceCalculating() && !this.productSoldOut()) {
      this.quantity.update(qty => Math.min(qty + 1, max));
    }
  }

  onQuantityChange(value: number | string) {
    // HIGH-2: Prevent quantity changes during payment
    if (this.isProcessing()) {
      const warningMsg = this.translate('payment.quantity.changeDuringPayment') || 
        'Cannot change quantity while payment is processing.';
      this.toastService.warning(warningMsg, 3000);
      return;
    }
    
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(numValue) || numValue < 1) {
      this.quantity.set(1);
      this.quantityError.set(this.translate('payment.quantity.minQuantity') || 'Minimum quantity is 1');
      return;
    }
    
    const max = this.maxQuantity();
    if (numValue > max) {
      this.quantity.set(max);
      this.quantityError.set(
        this.translate('payment.quantity.maxQuantity')?.replace('{max}', max.toString()) || 
        `Maximum quantity is ${max}`
      );
      return;
    }
    
    this.quantity.set(numValue);
    this.quantityError.set(null);
  }

  private async validateQuantity(qty: number) {
    const prod = this.product();
    if (!prod) return;
    
    if (qty < 1) {
      this.quantity.set(1);
      this.quantityError.set(this.translate('payment.quantity.minQuantity') || 'Minimum quantity is 1');
      return;
    }
    
    if (qty > this.maxQuantity()) {
      this.quantity.set(this.maxQuantity());
      this.quantityError.set(
        this.translate('payment.quantity.maxQuantity')?.replace('{max}', this.maxQuantity().toString()) || 
        `Maximum quantity is ${this.maxQuantity()}`
      );
      return;
    }
    
    if (this.productSoldOut()) {
      this.quantityError.set(this.translate('payment.quantity.soldOut') || 'This product is sold out');
      return;
    }
    
    this.quantityError.set(null);
  }

  // Price calculation
  private async calculatePrice(qty: number, product: ProductDto) {
    if (this.isDestroyed) return;
    
    this.priceCalculating.set(true);
    this.quantityError.set(null);
    
    try {
      const validation = await firstValueFrom(
        this.productService.validateProduct({
          productId: product.id,
          quantity: qty
        })
      );
      
      if (!this.isDestroyed) {
        // MEDIUM-11: Read old price BEFORE setting new price for comparison
        const oldPrice = this.calculatedPrice();
        const newPrice = validation.calculatedPrice;
        
        this.calculatedPrice.set(validation.calculatedPrice);
        this.validationErrors.set(validation.errors || []);
        
        // HIGH-3: Invalidate Stripe payment intent if price changed significantly
        if (this.stripeClientSecret() && this.selectedMethod() === PaymentMethod.Stripe) {
          // If price changed by more than 1% or $1, refresh payment intent
          if (Math.abs(newPrice - oldPrice) > Math.max(newPrice * 0.01, 1)) {
            this.unmountStripeElement();
            this.stopExpiryCountdown();
            // Re-initialize Stripe with new price (effect will trigger)
          }
        }
        
        // Emit quantity changed event
        this.quantityChanged.emit({
          quantity: qty,
          calculatedPrice: validation.calculatedPrice
        });
      }
    } catch (err: any) {
      if (!this.isDestroyed) {
        // MEDIUM-8: Show error instead of fallback calculation
        const errorMsg = err?.message || this.translate('payment.quantity.priceError') || 'Unable to calculate price. Please try again.';
        this.quantityError.set(errorMsg);
        this.validationErrors.set([errorMsg]);
        // Don't set calculatedPrice - keep Pay button disabled
        this.toastService.error(errorMsg, 5000);
      }
    } finally {
      if (!this.isDestroyed) {
        this.priceCalculating.set(false);
      }
    }
  }

  // Payment method selection
  selectPaymentMethod(method: PaymentMethod) {
    if (this.isProcessing()) {
      // Prevent switching payment methods during active payment
      const confirmMessage = this.translate('payment.method.switchDuringProcessing') || 
        'Payment is in progress. Please wait for it to complete or cancel before switching payment methods.';
      this.toastService.warning(confirmMessage, 4000);
      return;
    }
    
    // Cleanup previous method
    if (this.selectedMethod() === PaymentMethod.Stripe) {
      this.unmountStripeElement();
      this.stopExpiryCountdown();
    } else if (this.selectedMethod() === PaymentMethod.Crypto) {
      this.stopCryptoPolling();
      // MEDIUM-12: Stop crypto expiry countdown when switching away from Crypto
      this.stopCryptoExpiryCountdown();
    }
    
    this.selectedMethod.set(method);
    this.clearPaymentErrors();
    
    // Initialize new method
    if (method === PaymentMethod.Stripe) {
      this.initializeStripe();
    } else if (method === PaymentMethod.Crypto) {
      this.initializeCrypto();
    }
  }

  private clearPaymentErrors() {
    this.stripeError.set(null);
    this.cryptoError.set(null);
  }

  // Stripe integration
  private async initializeStripe() {
    if (!this.canProceed()) {
      this.stripeError.set(this.translate('payment.stripe.invalidState') || 'Please complete quantity selection first');
      return;
    }
    
    // Stop any existing expiry countdown before initializing new payment
    this.stopExpiryCountdown();
    
    this.stripeLoading.set(true);
    this.stripeError.set(null);
    
    try {
      const idempotencyKey = this.paymentService.generateIdempotencyKey();
      const paymentIntent = await firstValueFrom(
        this.stripeService.createPaymentIntent({
          amount: this.calculatedPrice(),
          currency: this.flowState().currency || 'USD',
          productId: this.flowState().productId,
          quantity: this.quantity(),
          idempotencyKey
        })
      );
      
      this.stripeClientSecret.set(paymentIntent.clientSecret);
      
      // MEDIUM-10: Reset retry count on successful initialization
      this.stripeRetryCount = 0;
      
      // Start expiry countdown if expiresAt is provided
      if (paymentIntent.expiresAt) {
        this.stripePaymentIntentExpiresAt.set(new Date(paymentIntent.expiresAt));
        this.startExpiryCountdown(new Date(paymentIntent.expiresAt));
      }
    } catch (err: any) {
      this.stripeError.set(err?.message || this.translate('payment.stripe.createError') || 'Failed to initialize payment');
      this.errorOccurred.emit(this.stripeError()!);
      this.toastService.error(this.stripeError()!);
    } finally {
      this.stripeLoading.set(false);
    }
  }

  private async mountStripeElement() {
    const clientSecret = this.stripeClientSecret();
    
    if (!clientSecret || this.isDestroyed || this.stripePaymentElement || this.isMountingStripe) return;
    
    // MEDIUM-4: Set mounting lock to prevent concurrent attempts
    this.isMountingStripe = true;
    
    try {
      // Use StripeService.createPaymentElement which handles mounting
      this.stripePaymentElement = await this.stripeService.createPaymentElement(
        this.stripePaymentElementId,
        clientSecret
      );
    } catch (err: any) {
      console.error('Stripe element mount error:', err);
      this.stripeError.set(err?.message || this.translate('payment.stripe.mountError') || 'Failed to load payment form');
      this.errorOccurred.emit(this.stripeError()!);
    } finally {
      // MEDIUM-4: Release mounting lock
      this.isMountingStripe = false;
    }
  }

  private unmountStripeElement() {
    if (this.stripePaymentElement) {
      try {
        this.stripePaymentElement.unmount();
      } catch (err) {
        console.error('Error unmounting Stripe element:', err);
      }
      this.stripePaymentElement = null;
    }
    
    // Clear container
    const container = document.getElementById(this.stripePaymentElementId);
    if (container) {
      container.innerHTML = '';
    }
    
    this.stripeClientSecret.set(null);
  }

  retryStripeInitialization() {
    // MEDIUM-6: Add retry limit with exponential backoff
    if (this.stripeRetryCount >= this.MAX_STRIPE_RETRIES) {
      const errorMsg = this.translate('payment.stripe.maxRetriesReached') || 
        'Maximum retry attempts reached. Please refresh the page or contact support.';
      this.stripeError.set(errorMsg);
      this.toastService.error(errorMsg, 6000);
      return;
    }
    
    this.stripeRetryCount++;
    this.initializeStripe();
  }

  refreshPaymentIntent() {
    // LOW-10: Explicitly reset retry count when manually refreshing
    this.stripeRetryCount = 0;
    this.unmountStripeElement();
    this.initializeStripe();
  }

  private startExpiryCountdown(expiresAt: Date) {
    this.stopExpiryCountdown();
    
    const updateCountdown = () => {
      if (this.isDestroyed) {
        this.stopExpiryCountdown();
        return;
      }
      
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      this.expiryCountdown.set(remaining);
      
      if (remaining === 0) {
        this.stopExpiryCountdown();
        this.stripeError.set(this.translate('payment.stripe.expired') || 'Payment session expired');
      }
    };
    
    updateCountdown();
    this.expiryInterval = setInterval(updateCountdown, 1000);
  }

  private stopExpiryCountdown() {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
    this.expiryCountdown.set(0);
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Crypto integration
  private async initializeCrypto() {
    if (!this.canProceed()) {
      this.cryptoError.set(this.translate('payment.crypto.invalidState') || 'Please complete quantity selection first');
      return;
    }
    
    this.cryptoLoading.set(true);
    this.cryptoError.set(null);
    
    try {
      const idempotencyKey = this.paymentService.generateIdempotencyKey();
      const charge = await firstValueFrom(
        this.cryptoPaymentService.createCharge({
          productId: this.flowState().productId,
          quantity: this.quantity(),
          idempotencyKey
        })
      );
      
      this.cryptoCharge.set(charge);
      this.cryptoPollAttempts.set(0);
      
      // MEDIUM-5: Start crypto expiry countdown
      if (charge.expiresAt) {
        this.startCryptoExpiryCountdown(new Date(charge.expiresAt));
      }
      
      this.startCryptoPolling(charge.chargeId);
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        const networkErrorMsg = this.translate('payment.error.network') || 
          'Network error. Please check your connection and try again.';
        this.cryptoError.set(networkErrorMsg);
        this.toastService.error(networkErrorMsg, 5000);
      } else {
        this.cryptoError.set(err?.message || this.translate('payment.crypto.createError') || 'Failed to create payment');
      }
      this.errorOccurred.emit(this.cryptoError()!);
      this.toastService.error(this.cryptoError()!);
    } finally {
      this.cryptoLoading.set(false);
    }
  }

  private startCryptoPolling(chargeId: string) {
    this.stopCryptoPolling();
    
    this.cryptoPollingInterval = setInterval(async () => {
      // HIGH-4: Check isDestroyed FIRST before any operations
      if (this.isDestroyed) {
        this.stopCryptoPolling();
        return;
      }
      
        if (this.cryptoPollAttempts() >= PAYMENT_PANEL_CONFIG.CRYPTO_MAX_POLLS) {
        this.stopCryptoPolling();
          this.cryptoError.set(this.translate('payment.crypto.timeout') || 'Payment is taking longer than expected');
        return;
      }
      
      this.cryptoPollAttempts.update(attempts => attempts + 1);
      
      try {
        // HIGH-4: Check isDestroyed before async operation
        if (this.isDestroyed) {
          this.stopCryptoPolling();
          return;
        }
        
        const charge = await firstValueFrom(this.cryptoPaymentService.getCharge(chargeId));
        
        // HIGH-4: Check isDestroyed after async operation
        if (this.isDestroyed) {
          this.stopCryptoPolling();
          return;
        }
        
        if (charge.status === 'COMPLETED') {
          this.stopCryptoPolling();
          await this.handleCryptoPaymentSuccess(chargeId);
        } else if (charge.status === 'EXPIRED' || charge.status === 'CANCELED') {
          this.stopCryptoPolling();
          this.cryptoError.set(this.translate('payment.crypto.expired') || 'Payment session expired');
        }
      } catch (err: any) {
        // HIGH-4: Check isDestroyed before error handling
        if (this.isDestroyed) {
          this.stopCryptoPolling();
          return;
        }
        
        console.error('Crypto polling error:', err);
        // Check if it's a network error - stop polling if so
        if (this.isNetworkError(err)) {
          this.stopCryptoPolling();
          const networkErrorMsg = this.translate('payment.error.network') || 
            'Network error. Please check your connection and try again.';
          this.cryptoError.set(networkErrorMsg);
          this.toastService.error(networkErrorMsg, 5000);
          return;
        }
        // Continue polling on other errors (might be transient)
      }
    }, PAYMENT_PANEL_CONFIG.CRYPTO_POLL_INTERVAL);
  }

  private stopCryptoPolling() {
    if (this.cryptoPollingInterval) {
      clearInterval(this.cryptoPollingInterval);
      this.cryptoPollingInterval = null;
    }
    // HIGH-4: Ensure polling stops synchronously before setting isDestroyed
    // Check isDestroyed before any state updates in polling callback
  }
  
  // MEDIUM-5: Crypto expiry countdown
  private startCryptoExpiryCountdown(expiresAt: Date) {
    this.stopCryptoExpiryCountdown();
    
    const updateCountdown = () => {
      if (this.isDestroyed) {
        this.stopCryptoExpiryCountdown();
        return;
      }
      
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      this.cryptoExpiryCountdown.set(remaining);
      
      if (remaining === 0) {
        this.stopCryptoExpiryCountdown();
        this.cryptoError.set(this.translate('payment.crypto.expired') || 'Payment session expired');
        this.stopCryptoPolling();
      }
    };
    
    updateCountdown();
    this.cryptoExpiryInterval = setInterval(updateCountdown, 1000);
  }
  
  private stopCryptoExpiryCountdown() {
    if (this.cryptoExpiryInterval) {
      clearInterval(this.cryptoExpiryInterval);
      this.cryptoExpiryInterval = null;
    }
    this.cryptoExpiryCountdown.set(0);
  }

  retryCryptoCharge() {
    this.initializeCrypto();
  }

  // Validate product availability before payment
  private async validateProductAvailability(): Promise<void> {
    const product = this.product();
    if (!product) {
      throw new Error(this.translate('payment.product.notFound') || 'Product not found');
    }
    
    // Check if product is sold out
    if (product.totalQuantityAvailable !== undefined && 
        product.quantitySold >= product.totalQuantityAvailable) {
      throw new Error(this.translate('payment.product.soldOut') || 'Product is sold out');
    }
    
    // Validate quantity against available stock
    const validation = await firstValueFrom(
      this.productService.validateProduct({
        productId: this.flowState().productId,
        quantity: this.quantity()
      })
    );
    
    if (validation.errors && validation.errors.length > 0) {
      throw new Error(validation.errors[0]);
    }
  }

  // Check if error is a network error
  private isNetworkError(error: any): boolean {
    return error?.status === 0 || // Network error (CORS, offline)
           error?.code === 'ECONNABORTED' || // Timeout
           error?.code === 'NETWORK_ERROR' ||
           error?.message?.toLowerCase().includes('network') ||
           error?.message?.toLowerCase().includes('timeout') ||
           error?.message?.toLowerCase().includes('failed to fetch') ||
           error?.message?.toLowerCase().includes('networkerror');
  }

  // Retry with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (!this.isNetworkError(error) || attempt === maxRetries - 1) {
          throw error;
        }
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  // Payment processing
  async onPay() {
    if (!this.canProceed() || this.isProcessing()) {
      return;
    }
    
    // HIGH-2: Lock quantity at payment start
    this.quantityAtPaymentStart.set(this.quantity());
    
    // MEDIUM-3: Show loading state immediately
    this.isProcessing.set(true);
    this.clearPaymentErrors();
    
    // Final product validation
    try {
      const validation = await firstValueFrom(
        this.productService.validateProduct({
          productId: this.flowState().productId,
          quantity: this.quantity()
        })
      );
      
      if (validation.errors && validation.errors.length > 0) {
        this.isProcessing.set(false);
        this.quantityAtPaymentStart.set(null);
        this.quantityError.set(validation.errors[0]);
        this.toastService.error(validation.errors[0]);
        return;
      }
      
      // HIGH-2: Verify quantity hasn't changed during validation
      if (this.quantity() !== this.quantityAtPaymentStart()) {
        this.isProcessing.set(false);
        this.quantityAtPaymentStart.set(null);
        const warningMsg = this.translate('payment.quantity.changedDuringValidation') || 
          'Quantity was changed. Please try again.';
        this.toastService.warning(warningMsg, 4000);
        return;
      }
    } catch (err: any) {
      this.isProcessing.set(false);
      this.quantityAtPaymentStart.set(null);
      const errorMsg = err?.message || this.translate('payment.product.validationFailed') || 'Product validation failed';
      this.quantityError.set(errorMsg);
      this.toastService.error(errorMsg);
      return;
    }
    
    try {
      if (this.selectedMethod() === PaymentMethod.Stripe) {
        await this.processStripePayment();
      } else if (this.selectedMethod() === PaymentMethod.Crypto) {
        // Crypto payment is handled via polling
        this.toastService.info(this.translate('payment.crypto.waiting') || 'Please complete payment using the QR code');
      }
    } catch (err: any) {
      this.isProcessing.set(false);
      this.quantityAtPaymentStart.set(null); // HIGH-2: Release quantity lock
      
      // Handle network errors with retry option
      if (this.isNetworkError(err)) {
        const networkErrorMsg = this.translate('payment.error.network') || 
          'Network error. Please check your connection and try again.';
        this.toastService.error(networkErrorMsg, 5000);
        this.errorOccurred.emit(networkErrorMsg);
      } else {
        const errorMsg = err?.message || this.translate('payment.error.generic') || 'Payment failed';
        this.toastService.error(errorMsg);
        this.errorOccurred.emit(errorMsg);
      }
    }
  }

  private async processStripePayment() {
    if (!this.stripeClientSecret()) {
      throw new Error('Stripe payment not initialized');
    }
    
    try {
      // Final product availability check before payment submission
      await this.validateProductAvailability();
      
      // Check if payment intent is expired
      const expiresAt = this.stripePaymentIntentExpiresAt();
      if (expiresAt && this.stripeService.isPaymentIntentExpired(expiresAt)) {
        throw new Error(this.translate('payment.stripe.expired') || 'Payment session expired');
      }
      
      // Use StripeService.confirmPayment which handles elements.submit() and confirmation
      // Retry on network errors
      const result = await this.retryWithBackoff(async () => {
        return await this.stripeService.confirmPayment(this.stripeClientSecret()!);
      });
      
      if (!result.success) {
        throw new Error(result.error || this.translate('payment.stripe.paymentFailed') || 'Payment failed');
      }
      
      // Check if 3DS redirect is required
      if (result.requiresAction && result.nextAction?.redirectToUrl) {
        // Store state for 3DS return
        const paymentIntentId = result.paymentIntentId || this.extractPaymentIntentId(this.stripeClientSecret()!);
        if (paymentIntentId) {
          this.store3DSState(paymentIntentId);
        }
        // Redirect will happen automatically via Stripe
        window.location.href = result.nextAction.redirectToUrl;
        return;
      }
      
      // Payment succeeded
      const paymentIntentId = result.paymentIntentId || this.extractPaymentIntentId(this.stripeClientSecret()!);
      if (!paymentIntentId) {
        throw new Error('Invalid payment intent ID');
      }
      
      // MEDIUM-7: Clean up 3DS state on successful payment (no 3DS redirect)
      try {
        sessionStorage.removeItem('payment3DSState');
      } catch (error) {
        // Ignore sessionStorage errors
      }
      
      await this.handleStripePaymentSuccess(paymentIntentId);
    } catch (err: any) {
      if (err.type === 'card_error' || err.code === 'card_declined') {
        const errorMsg = this.translate('payment.stripe.declined') || 'Card declined. Please try another card.';
        this.stripeError.set(errorMsg);
        throw new Error(errorMsg);
      }
      // Use translation key for generic errors
      const errorMsg = err?.message || this.translate('payment.stripe.paymentFailed') || 'Payment failed';
      this.stripeError.set(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private extractPaymentIntentId(clientSecret: string): string | null {
    // Extract payment intent ID from client secret (format: pi_xxx_secret_xxx)
    const match = clientSecret.match(/pi_([a-zA-Z0-9_]+)/);
    return match ? match[0] : null;
  }

  private async handleStripePaymentSuccess(paymentIntentId: string) {
    // Stop expiry countdown since payment succeeded
    this.stopExpiryCountdown();
    
    // Final product validation before ticket creation
    try {
      const validation = await firstValueFrom(
        this.productService.validateProduct({
          productId: this.flowState().productId,
          quantity: this.quantity()
        })
      );
      
      if (validation.errors && validation.errors.length > 0) {
        // Validation failed - don't create tickets, webhook will handle
        this.ticketCreationStatus.set('pending');
        this.toastService.warning(
          this.translate('payment.success.ticketsPending') || 
          'Tickets will be created shortly. If this persists, please contact support.',
          6000
        );
        return;
      }
    } catch (err: any) {
      // Validation error - don't create tickets, webhook will handle
      this.ticketCreationStatus.set('pending');
      this.toastService.warning(
        this.translate('payment.success.ticketsPending') || 
        'Tickets will be created shortly. If this persists, please contact support.',
        6000
      );
      return;
    }
    
    // Create tickets only if validation passed
    await this.createTickets(paymentIntentId, PaymentMethod.Stripe);
  }

  private async handleCryptoPaymentSuccess(chargeId: string) {
    // Stop crypto polling since payment succeeded
    this.stopCryptoPolling();
    
    // Final product validation before ticket creation
    try {
      const validation = await firstValueFrom(
        this.productService.validateProduct({
          productId: this.flowState().productId,
          quantity: this.quantity()
        })
      );
      
      if (validation.errors && validation.errors.length > 0) {
        // Validation failed - don't create tickets, webhook will handle
        this.ticketCreationStatus.set('pending');
        this.toastService.warning(
          this.translate('payment.success.ticketsPending') || 
          'Tickets will be created shortly. If this persists, please contact support.',
          6000
        );
        return;
      }
    } catch (err: any) {
      // Validation error - don't create tickets, webhook will handle
      this.ticketCreationStatus.set('pending');
      this.toastService.warning(
        this.translate('payment.success.ticketsPending') || 
        'Tickets will be created shortly. If this persists, please contact support.',
        6000
      );
      return;
    }
    
    // Create tickets only if validation passed
    await this.createTickets(chargeId, PaymentMethod.Crypto);
  }

  private async createTickets(paymentId: string, method: PaymentMethod) {
    this.ticketCreationStatus.set('creating');
    
    try {
      const houseId = this.flowState().houseId;
      if (!houseId) {
        throw new Error('House ID is required');
      }
      
      // Get default payment method or use fallback
      const defaultMethod = await this.paymentMethodPreference.getDefaultPaymentMethod();
      const paymentMethodId = defaultMethod?.id || '00000000-0000-0000-0000-000000000000';
      
      await firstValueFrom(
        this.lotteryService.purchaseTicket({
          houseId,
          quantity: this.quantity(),
          paymentMethodId: paymentMethodId
        })
      );
      
      this.ticketCreationStatus.set('success');
      
      // Reset retry count on successful ticket creation
      this.ticketCreationRetryCount.set(0);
      this.pendingTicketCreation = null;
      
      // Emit success event
      const successEvent: PaymentSuccessEvent = {
        paymentIntentId: method === PaymentMethod.Stripe ? paymentId : undefined,
        chargeId: method === PaymentMethod.Crypto ? paymentId : undefined,
        method
      };
      
      this.paymentSuccessState.set(successEvent);
      this.paymentSuccess.emit(successEvent);
      
      // Auto-close after configured delay (LOW-8 fix)
      setTimeout(() => {
        if (!this.isDestroyed) {
          // Parent will handle closing
        }
      }, this.SUCCESS_AUTO_CLOSE_DELAY);
    } catch (err: any) {
      // Payment succeeded but ticket creation failed
      this.ticketCreationStatus.set('failed');
      
      // Check if it's a retryable error (network, timeout) vs permanent error
      const isRetryable = err?.status === 0 || // Network error
                         err?.status >= 500 || // Server error
                         err?.code === 'ECONNABORTED' || // Timeout
                         err?.message?.toLowerCase().includes('timeout') ||
                         err?.message?.toLowerCase().includes('network');
      
      if (isRetryable) {
        // Show retry option for retryable errors
        this.ticketCreationStatus.set('failed');
        const errorMessage = this.translate('payment.ticketCreation.retryable') || 
          'Ticket creation failed. Please retry.';
        this.toastService.error(errorMessage, 5000);
        
        // Store payment info for retry
        this.pendingTicketCreation = {
          paymentId,
          method,
          houseId: this.flowState().houseId,
          quantity: this.quantity()
        };
      } else {
        // Permanent error - still allow retry but show different message
        this.ticketCreationStatus.set('failed');
        const errorMessage = this.translate('payment.ticketCreation.failed') || 
          'Payment succeeded but ticket creation failed. Please retry.';
        this.toastService.warning(errorMessage, 6000);
        
        // Store payment info for retry (user can still retry even for permanent errors)
        this.pendingTicketCreation = {
          paymentId,
          method,
          houseId: this.flowState().houseId,
          quantity: this.quantity()
        };
      }
      
      // Still emit success event (payment succeeded)
      const successEvent: PaymentSuccessEvent = {
        paymentIntentId: method === PaymentMethod.Stripe ? paymentId : undefined,
        chargeId: method === PaymentMethod.Crypto ? paymentId : undefined,
        method,
        transactionId: err?.transactionId // Include transaction ID if available
      };
      
      this.paymentSuccessState.set(successEvent);
      this.paymentSuccess.emit(successEvent);
      
      // HIGH-2: Release quantity lock on payment success
      this.quantityAtPaymentStart.set(null);
    }
  }
  
  // Retry ticket creation after failed attempt
  async retryTicketCreation() {
    if (!this.pendingTicketCreation) {
      return;
    }
    
    // Check retry limit
    if (this.ticketCreationRetryCount() >= this.MAX_TICKET_CREATION_RETRIES) {
      let errorMessage = this.translate('payment.ticketCreation.maxRetriesReached') || 
        `Maximum retry attempts ({maxRetries}) reached. Please contact support with payment ID: {paymentId}`;
      // Manual interpolation
      errorMessage = errorMessage.replace('{maxRetries}', this.MAX_TICKET_CREATION_RETRIES.toString())
                                  .replace('{paymentId}', this.pendingTicketCreation.paymentId);
      this.toastService.error(errorMessage, 6000);
      return;
    }
    
    const { paymentId, method, houseId, quantity } = this.pendingTicketCreation;
    this.pendingTicketCreation = null;
    this.ticketCreationRetryCount.update(count => count + 1);
    
    try {
      await this.createTickets(paymentId, method);
      // Reset retry count on success
      this.ticketCreationRetryCount.set(0);
    } catch (err: any) {
      // If retry also fails, show error and keep retry option (if under limit)
      this.ticketCreationStatus.set('failed');
      // Use translation key with payment ID interpolation
      let errorMessage = this.translate('payment.ticketCreation.retryFailed') || 
        'Retry failed. Please contact support with payment ID: {paymentId}';
      // Manual interpolation
      errorMessage = errorMessage.replace('{paymentId}', paymentId);
      this.toastService.error(errorMessage, 6000);
      // Restore pending state for another retry (if under limit)
      if (this.ticketCreationRetryCount() < this.MAX_TICKET_CREATION_RETRIES) {
        this.pendingTicketCreation = { paymentId, method, houseId, quantity };
      } else {
        // Max retries reached - clear pending state
        this.pendingTicketCreation = null;
        let maxRetriesMessage = this.translate('payment.ticketCreation.maxRetriesReached') || 
          `Maximum retry attempts ({maxRetries}) reached. Please contact support with payment ID: {paymentId}`;
        // Manual interpolation
        maxRetriesMessage = maxRetriesMessage.replace('{maxRetries}', this.MAX_TICKET_CREATION_RETRIES.toString())
                                              .replace('{paymentId}', paymentId);
        this.toastService.error(maxRetriesMessage, 6000);
      }
    }
  }

  // 3DS handling
  private store3DSState(paymentIntentId: string) {
    const state = {
      productId: this.flowState().productId,
      quantity: this.quantity(),
      paymentIntentId,
      returnUrl: window.location.href,
      houseId: this.flowState().houseId,
      houseTitle: this.flowState().houseTitle,
      expiresAt: this.stripePaymentIntentExpiresAt()?.toISOString() || null // Store expiry for checking on return
    };
    
    sessionStorage.setItem('payment3DSState', JSON.stringify(state));
  }

  private async check3DSReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const redirectStatus = urlParams.get('redirect_status');
    
    // Clean up URL params after processing to prevent duplicate processing on refresh
    const shouldCleanUrl = paymentIntent && redirectStatus;
    
    if (paymentIntent && redirectStatus === 'succeeded') {
      // Restore state from sessionStorage
      const storedState = sessionStorage.getItem('payment3DSState');
      if (storedState) {
        try {
          const state = JSON.parse(storedState);
          this.quantity.set(state.quantity || 1);
          
          // Check if payment intent expired during 3DS redirect
          if (state.expiresAt) {
            const expiresAt = new Date(state.expiresAt);
            if (this.stripeService.isPaymentIntentExpired(expiresAt)) {
              this.stripeError.set(this.translate('payment.stripe.expired') || 'Payment session expired during verification. Please start a new payment.');
              sessionStorage.removeItem('payment3DSState');
              // Clear any existing payment intent
              this.stripeClientSecret.set(null);
              this.stripePaymentIntentExpiresAt.set(null);
              return;
            }
          }
          
          // Verify payment intent status
          const status = await firstValueFrom(
            this.stripeService.getPaymentIntentStatus(paymentIntent)
          );
          
          if (status.status === 'succeeded') {
            // MEDIUM-7: Clean up 3DS state on successful return
            try {
              sessionStorage.removeItem('payment3DSState');
            } catch (error) {
              // Ignore sessionStorage errors
            }
            await this.handleStripePaymentSuccess(paymentIntent);
          } else if (status.status === 'requires_payment_method') {
            // Payment intent expired or was canceled
            this.stripeError.set(this.translate('payment.stripe.expired') || 'Payment session expired. Please start a new payment.');
            this.stripeClientSecret.set(null);
            this.stripePaymentIntentExpiresAt.set(null);
          } else {
            this.stripeError.set(this.translate('payment.stripe.verificationFailed') || 'Payment verification failed');
          }
        } catch (err: any) {
          // Check if error is due to expired payment intent
          if (err?.message?.includes('expired') || err?.code === 'payment_intent_expired') {
            this.stripeError.set(this.translate('payment.stripe.expired') || 'Payment session expired. Please start a new payment.');
            this.stripeClientSecret.set(null);
            this.stripePaymentIntentExpiresAt.set(null);
          } else {
            this.stripeError.set(err?.message || 'Failed to restore payment state');
          }
        } finally {
          sessionStorage.removeItem('payment3DSState');
          // Clean up URL params to prevent duplicate processing
          if (shouldCleanUrl) {
            this.cleanup3DSUrlParams();
          }
        }
      }
    } else if (paymentIntent && redirectStatus === 'failed') {
      // 3DS authentication failed
      this.stripeError.set(this.translate('payment.stripe.verificationFailed') || 'Payment verification failed. Please try again.');
      sessionStorage.removeItem('payment3DSState');
      // Clean up URL params
      if (shouldCleanUrl) {
        this.cleanup3DSUrlParams();
      }
    }
  }
  
  // Clean up 3DS URL parameters to prevent duplicate processing
  private cleanup3DSUrlParams() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_intent');
      url.searchParams.delete('redirect_status');
      // Use replaceState to avoid adding to browser history
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      // Fallback: try simple string replacement
      try {
        const newUrl = window.location.href
          .replace(/[?&]payment_intent=[^&]*/g, '')
          .replace(/[?&]redirect_status=[^&]*/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
        window.history.replaceState({}, '', newUrl || window.location.pathname);
      } catch (fallbackError) {
        // Ignore errors - URL cleanup is best effort
        console.warn('Could not clean up 3DS URL params:', fallbackError);
      }
    }
  }
}