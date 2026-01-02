/**
 * PaymentTabsStepComponent
 * Step 3: Payment method selection (Stripe/Crypto) with payment forms
 */

import { Component, inject, input, output, signal, computed, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom, Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QRCodeComponent } from 'angularx-qrcode';
import { StripeService, PaymentIntentResponse } from '../../services/stripe.service';
import { CryptoPaymentService, CoinbaseChargeResponse } from '../../services/crypto-payment.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { PaymentFlowState, PaymentMethod, PaymentMethodSelectedEvent } from '@core/interfaces/payment-flow.interface';
import { StripePaymentElement } from '@stripe/stripe-js';
import { PAYMENT_PANEL_CONFIG } from '../../../../../config/payment-panel.config';

@Component({
  selector: 'app-payment-tabs-step',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  template: `
    <div class="payment-step-tabs">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ translate('payment.tabs.title') }}
      </div>

      <div class="space-y-6">
        <!-- Tab Navigation -->
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
            class="flex-1 py-3 px-4 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
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
            class="flex-1 py-3 px-4 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            {{ translate('payment.method.crypto') }}
          </button>
        </div>

        <!-- Tab Panels -->
        <div class="tab-panels">
          <!-- Stripe Tab -->
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

            @if (stripeClientSecret() && !stripeLoading()) {
              <div class="space-y-4">
                <!-- Expiry Countdown -->
                @if (stripeTimeRemaining() !== null && stripeTimeRemaining()! > 0) {
                  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-yellow-800 dark:text-yellow-200">
                        {{ translate('payment.stripe.intent.expiresIn') || 'Payment session expires in' }}:
                      </span>
                      <span class="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                        {{ formatTimeRemaining(stripeTimeRemaining()!) }}
                      </span>
                    </div>
                  </div>
                }

                <!-- Expired Warning -->
                @if (stripeTimeRemaining() === 0) {
                  <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex items-start">
                      <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-red-800 dark:text-red-200">
                          {{ translate('payment.stripe.intent.expired') || 'Payment session has expired' }}
                        </p>
                        <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                          {{ translate('payment.stripe.intent.expiredMessage') || 'Please start a new payment session.' }}
                        </p>
                        <button
                          type="button"
                          (click)="onRetryPayment()"
                          class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                                 transition-colors duration-200 text-sm">
                          {{ translate('payment.stripe.retry.button') || 'Start New Payment' }}
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <!-- 3DS Redirect Notice -->
                @if (stripeRequires3DS()) {
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-start">
                      <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {{ translate('payment.stripe.3ds.required') || 'Additional verification required' }}
                        </p>
                        <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          {{ translate('payment.stripe.3ds.redirecting') || 'Redirecting to complete payment verification...' }}
                        </p>
                      </div>
                    </div>
                  </div>
                }

                <div 
                  [id]="stripePaymentElementId"
                  [attr.aria-label]="translate('payment.stripe.paymentForm')"
                  #stripeContainer>
                </div>
                
                <div class="flex space-x-3">
                  <button
                    type="button"
                    (click)="onCancelPayment()"
                    class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                           rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                           transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    {{ translate('payment.stripe.cancel') || 'Cancel' }}
                  </button>
                  
                  <button
                    type="button"
                    (click)="onStripePay()"
                    [disabled]="stripeProcessing() || !stripeClientSecret() || stripeTimeRemaining() === 0"
                    class="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg 
                           hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                    @if (stripeProcessing()) {
                      {{ translate('payment.stripe.processing') }}
                    } @else {
                      {{ translate('payment.stripe.pay') }}
                    }
                  </button>
                </div>

                <!-- Retry Button (shown on error) -->
                @if (stripeError() && !stripeProcessing()) {
                  <button
                    type="button"
                    (click)="onRetryPayment()"
                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors duration-200 text-sm">
                    {{ translate('payment.stripe.retry.button') || 'Retry Payment' }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Crypto Tab -->
          <div
            id="crypto-tab"
            role="tabpanel"
            [attr.aria-hidden]="selectedMethod() !== PaymentMethod.Crypto"
            [class.hidden]="selectedMethod() !== PaymentMethod.Crypto">
            
            @if (cryptoLoading()) {
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                <p class="mt-4 text-gray-700 dark:text-gray-300">{{ translate('payment.crypto.creating') }}</p>
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

            @if (cryptoCharge() && !cryptoLoading()) {
              <div class="space-y-4">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {{ translate('payment.crypto.amount') }}: 
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ localeService.formatCurrency(flowState().totalAmount || flowState().calculatedPrice || 0, flowState().currency) }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ translate('payment.crypto.status') }}: 
                    <span class="font-semibold text-gray-900 dark:text-white">{{ cryptoCharge()!.status }}</span>
                  </p>
                </div>

                @if (cryptoCharge()!.hostedUrl) {
                  <div class="text-center">
                    <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {{ translate('payment.crypto.scanQR') }}
                    </h3>
                    <qrcode 
                      [qrdata]="cryptoCharge()!.hostedUrl" 
                      [width]="256"
                      [errorCorrectionLevel]="'M'"
                      [colorDark]="'#000000'"
                      [colorLight]="'#FFFFFF'"
                      [attr.aria-label]="translate('payment.crypto.qrCode')">
                    </qrcode>
                    <a 
                      [href]="cryptoCharge()!.hostedUrl" 
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 dark:text-blue-400 hover:underline mt-2 block">
                      {{ translate('payment.crypto.openPaymentPage') }}
                    </a>
                  </div>
                }

                <p class="text-sm text-center text-gray-600 dark:text-gray-400">
                  {{ translate('payment.crypto.waiting') }}
                </p>
              </div>
            } @else if (!cryptoLoading() && !cryptoError()) {
              <button
                type="button"
                (click)="createCryptoCharge()"
                [disabled]="cryptoLoading()"
                class="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {{ translate('payment.crypto.createCharge') }}
              </button>
            }
          </div>
        </div>

        <!-- Back Button -->
        <button
          type="button"
          (click)="onBack()"
          [attr.aria-label]="translate('payment.tabs.back')"
          class="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
          {{ translate('payment.tabs.back') }}
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
export class PaymentTabsStepComponent implements OnInit, AfterViewInit, OnDestroy {
  private stripeService = inject(StripeService);
  private cryptoService = inject(CryptoPaymentService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);
  private router = inject(Router);

  // Inputs
  flowState = input.required<PaymentFlowState>();

  // Outputs
  paymentMethodSelected = output<PaymentMethodSelectedEvent>();
  paymentIntentCreated = output<PaymentIntentResponse>();
  cryptoChargeCreated = output<CoinbaseChargeResponse>();
  stripePaymentConfirmed = output<{ paymentIntentId: string }>();
  cryptoPaymentConfirmed = output<{ chargeId: string }>();
  back = output<void>();

  // ViewChild
  @ViewChild('stripeContainer') stripeContainer!: ElementRef<HTMLElement>;

  // State
  selectedMethod = signal<PaymentMethod>(PaymentMethod.Stripe);
  stripeLoading = signal<boolean>(false);
  stripeError = signal<string | null>(null);
  stripeClientSecret = signal<string | null>(null);
  stripePaymentElementId = `stripe-payment-element-${Math.random().toString(36).substring(2, 11)}`;
  stripeProcessing = signal<boolean>(false);
  stripePaymentElement: StripePaymentElement | null = null;
  stripePaymentIntentExpiresAt = signal<Date | null>(null);
  stripeTimeRemaining = signal<number | null>(null);
  stripeRequires3DS = signal<boolean>(false);
  stripe3DSRedirectUrl = signal<string | null>(null);
  private stripeCountdownInterval?: ReturnType<typeof setInterval>;

  cryptoLoading = signal<boolean>(false);
  cryptoError = signal<string | null>(null);
  cryptoCharge = signal<CoinbaseChargeResponse | null>(null);
  private cryptoPollingInterval?: ReturnType<typeof setInterval>;
  private destroy$ = new Subject<void>();

  // Expose enum to template
  PaymentMethod = PaymentMethod;

  private stripeMountTimeout?: ReturnType<typeof setTimeout>;
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Register cleanup on component destroy
    this.destroyRef.onDestroy(() => {
      if (this.stripeMountTimeout) {
        clearTimeout(this.stripeMountTimeout);
        this.stripeMountTimeout = undefined;
      }
    });

    // Reactive effect to mount Stripe element when conditions are met
    // This ensures the element is mounted as soon as it's rendered in the DOM
    effect(() => {
      // Clear any pending timeout
      if (this.stripeMountTimeout) {
        clearTimeout(this.stripeMountTimeout);
        this.stripeMountTimeout = undefined;
      }

      const hasSecret = this.stripeClientSecret();
      const isStripe = this.selectedMethod() === PaymentMethod.Stripe;
      const notLoading = !this.stripeLoading();
      const notMounted = !this.stripePaymentElement;
      
      // Mount element when: Stripe selected, secret exists, not loading, not already mounted
      if (hasSecret && isStripe && notLoading && notMounted) {
        // Wait for next change detection cycle to ensure @if block is rendered
        this.stripeMountTimeout = setTimeout(() => {
          this.stripeMountTimeout = undefined;
          this.mountStripeElement().catch(err => {
            console.error('Failed to mount Stripe element:', err);
            // Error is already handled in mountStripeElement
          });
        }, 0);
      }
    });
  }

  async ngOnInit() {
    this.selectedMethod.set(this.flowState().paymentMethod || PaymentMethod.Stripe);
    
    // Initialize payment method
    if (this.selectedMethod() === PaymentMethod.Stripe) {
      await this.initializeStripe();
    }
  }

  async ngAfterViewInit() {
    // Effect handles mounting, but we keep this as fallback
    if (this.selectedMethod() === PaymentMethod.Stripe && this.stripeClientSecret() && !this.stripePaymentElement) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.mountStripeElement().catch(() => {
        // Effect will retry if needed
      });
    }
  }

  ngOnDestroy() {
    // Cleanup destroy subject
    this.destroy$.next();
    this.destroy$.complete();
    
    // Stop expiry countdown
    this.stopExpiryCountdown();
    
    // Cleanup crypto polling
    if (this.cryptoPollingInterval) {
      clearInterval(this.cryptoPollingInterval);
      this.cryptoPollingInterval = undefined;
    }
    
    // Cleanup Stripe payment element if mounted
    // Note: Stripe Elements don't have a destroy method, but we can clear the container
    if (this.stripePaymentElement && this.stripeContainer) {
      const container = document.getElementById(this.stripePaymentElementId);
      if (container) {
        container.innerHTML = '';
      }
      this.stripePaymentElement = null;
    }
  }

  selectPaymentMethod(method: PaymentMethod) {
    // Cancel crypto polling if switching away from crypto
    if (this.selectedMethod() === PaymentMethod.Crypto && method !== PaymentMethod.Crypto) {
      if (this.cryptoPollingInterval) {
        clearInterval(this.cryptoPollingInterval);
        this.cryptoPollingInterval = undefined;
      }
    }
    
    this.selectedMethod.set(method);
    this.paymentMethodSelected.emit({ method });

    if (method === PaymentMethod.Stripe) {
      this.initializeStripe();
    } else if (method === PaymentMethod.Crypto && !this.cryptoCharge()) {
      this.createCryptoCharge();
    }
  }

  private async initializeStripe() {
    if (this.stripeClientSecret()) {
      // Already initialized - effect will handle mounting
      return;
    }

    // Validate amount before creating payment intent
    const amount = this.flowState().totalAmount || this.flowState().calculatedPrice || 0;
    if (amount <= 0) {
      this.stripeError.set(this.translate('payment.stripe.invalidAmount') || 'Invalid payment amount. Please check your order.');
      return;
    }

    this.stripeLoading.set(true);
    this.stripeError.set(null);

    try {
      const response = await firstValueFrom(
        this.stripeService.createPaymentIntent({
          amount: amount,
          currency: this.flowState().currency,
          productId: this.flowState().productId,
          quantity: this.flowState().quantity
        })
      );

      this.stripeClientSecret.set(response.clientSecret);
      
      // Store expiry time if provided
      if (response.expiresAt) {
        this.stripePaymentIntentExpiresAt.set(new Date(response.expiresAt));
        this.startExpiryCountdown();
      }
      
      this.paymentIntentCreated.emit(response);

      // Effect will automatically mount the element when stripeClientSecret is set
    } catch (err: any) {
      // Handle rate limiting (429)
      if (err?.status === 429 || err?.error?.code === 'RATE_LIMIT_EXCEEDED') {
        this.stripeError.set(this.translate('payment.stripe.rateLimit') || 'Too many payment requests. Please wait a moment and try again.');
      } else if (err?.error?.message) {
        this.stripeError.set(err.error.message);
      } else {
        this.stripeError.set(err?.message || this.translate('payment.stripe.error'));
      }
    } finally {
      this.stripeLoading.set(false);
    }
  }

  private async mountStripeElement() {
    if (!this.stripeClientSecret() || this.stripePaymentElement) return;

    try {
      // Wait for container element to exist
      await this.waitForElement(this.stripePaymentElementId);
      
      this.stripePaymentElement = await this.stripeService.createPaymentElement(
        this.stripePaymentElementId,
        this.stripeClientSecret()!
      );
    } catch (err: any) {
      this.stripeError.set(err?.message || this.translate('payment.stripe.elementError'));
    }
  }

  /**
   * Wait for a DOM element to exist before proceeding
   * Uses polling with exponential backoff
   * Increased maxAttempts and initial delay for slower rendering scenarios
   */
  private async waitForElement(elementId: string, maxAttempts: number = 30, initialDelay: number = 100): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const element = document.getElementById(elementId);
      if (element) {
        // Double-check element is actually visible/rendered (not just in DOM)
        if (element.offsetParent !== null || element.getBoundingClientRect().width > 0) {
          return; // Element found and visible
        }
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms, etc. (capped at 500ms)
      const delay = Math.min(initialDelay * Math.pow(2, attempt), 500);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error(`Element #${elementId} not found after ${maxAttempts} attempts`);
  }

  async onStripePay() {
    if (!this.stripeClientSecret() || this.stripeProcessing()) return;

    // Check if payment intent is expired
    if (this.stripeService.isPaymentIntentExpired(this.stripePaymentIntentExpiresAt() || undefined)) {
      this.stripeError.set(this.translate('payment.stripe.intent.expired') || 'Payment session has expired. Please start over.');
      this.stripeClientSecret.set(null);
      this.stripePaymentIntentExpiresAt.set(null);
      return;
    }

    this.stripeProcessing.set(true);
    this.stripeError.set(null);
    this.stripeRequires3DS.set(false);

    try {
      const result = await this.stripeService.confirmPayment(this.stripeClientSecret()!);
      
      if (result.success) {
        // Check if 3DS is required
        if (result.requiresAction && result.nextAction?.redirectToUrl) {
          this.stripeRequires3DS.set(true);
          this.stripe3DSRedirectUrl.set(result.nextAction.redirectToUrl);
          
          // Redirect to 3DS page
          window.location.href = result.nextAction.redirectToUrl;
          return;
        }

        // Payment succeeded without 3DS
        const paymentIntentId = result.paymentIntentId || this.extractPaymentIntentId(this.stripeClientSecret()!);
        if (!paymentIntentId) {
          this.stripeError.set('Invalid payment intent ID. Please try again.');
          this.stripeProcessing.set(false);
          return;
        }
        
        // Stop countdown
        this.stopExpiryCountdown();
        
        this.stripePaymentConfirmed.emit({ paymentIntentId });
      } else {
        // Handle specific error types
        let errorMsg = result.error || this.translate('payment.stripe.paymentFailed');
        
        // Map specific error codes
        if (result.error?.includes('insufficient') || result.error?.includes('funds')) {
          errorMsg = this.translate('payment.stripe.errors.insufficientFunds') || 'Insufficient funds. Please use a different payment method.';
        } else if (result.error?.includes('cancel')) {
          errorMsg = this.translate('payment.stripe.errors.cancelled') || 'Payment was cancelled.';
        }
        
        this.stripeError.set(errorMsg);
      }
    } catch (err: any) {
      // Network error handling
      if (err?.name === 'NetworkError' || err?.message?.includes('network')) {
        this.stripeError.set(this.translate('payment.stripe.networkError') || 'Network error. Please check your connection and try again.');
      } else {
        this.stripeError.set(err?.message || this.translate('payment.stripe.paymentFailed'));
      }
    } finally {
      this.stripeProcessing.set(false);
    }
  }

  startExpiryCountdown(): void {
    this.stopExpiryCountdown();
    
    this.stripeCountdownInterval = setInterval(() => {
      const expiresAt = this.stripePaymentIntentExpiresAt();
      if (!expiresAt) {
        this.stripeTimeRemaining.set(null);
        this.stopExpiryCountdown();
        return;
      }

      const remaining = this.stripeService.getTimeUntilExpiry(expiresAt);
      this.stripeTimeRemaining.set(remaining);

      if (remaining === null || remaining <= 0) {
        this.stripeTimeRemaining.set(0);
        this.stripeError.set(this.translate('payment.stripe.intent.expired') || 'Payment session has expired. Please start over.');
        this.stopExpiryCountdown();
      }
    }, 1000);
  }

  stopExpiryCountdown(): void {
    if (this.stripeCountdownInterval) {
      clearInterval(this.stripeCountdownInterval);
      this.stripeCountdownInterval = undefined;
    }
  }

  formatTimeRemaining(ms: number | null): string {
    if (ms === null || ms <= 0) {
      return this.translate('payment.stripe.intent.expired') || 'Expired';
    }

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onCancelPayment(): void {
    if (confirm(this.translate('payment.stripe.cancel.confirm') || 'Are you sure you want to cancel this payment?')) {
      this.stripeClientSecret.set(null);
      this.stripePaymentIntentExpiresAt.set(null);
      this.stripeTimeRemaining.set(null);
      this.stripeError.set(null);
      this.stripeRequires3DS.set(false);
      this.stripe3DSRedirectUrl.set(null);
      this.stopExpiryCountdown();
      
      // Clean up payment element
      if (this.stripePaymentElement && this.stripeContainer) {
        const container = document.getElementById(this.stripePaymentElementId);
        if (container) {
          container.innerHTML = '';
        }
        this.stripePaymentElement = null;
      }
      
      // Emit cancel event or navigate back
      this.back.emit();
    }
  }

  onRetryPayment(): void {
    this.stripeError.set(null);
    this.stripeClientSecret.set(null);
    this.stripePaymentIntentExpiresAt.set(null);
    this.stripeTimeRemaining.set(null);
    this.stopExpiryCountdown();
    
    // Clean up payment element
    if (this.stripePaymentElement && this.stripeContainer) {
      const container = document.getElementById(this.stripePaymentElementId);
      if (container) {
        container.innerHTML = '';
      }
      this.stripePaymentElement = null;
    }
    
    // Reinitialize Stripe
    this.initializeStripe();
  }

  /**
   * Safely extract payment intent ID from client secret
   * Format: pi_xxx_secret_yyy
   */
  private extractPaymentIntentId(clientSecret: string): string | null {
    if (!clientSecret || typeof clientSecret !== 'string') {
      return null;
    }
    
    const parts = clientSecret.split('_secret_');
    if (parts.length !== 2 || !parts[0] || !parts[0].startsWith('pi_')) {
      console.error('Invalid client secret format:', clientSecret.substring(0, 20) + '...');
      return null;
    }
    
    return parts[0];
  }

  async createCryptoCharge() {
    // Validate amount before creating charge
    const amount = this.flowState().totalAmount || this.flowState().calculatedPrice || 0;
    if (amount <= 0) {
      this.cryptoError.set(this.translate('payment.crypto.invalidAmount') || 'Invalid payment amount. Please check your order.');
      return;
    }

    this.cryptoLoading.set(true);
    this.cryptoError.set(null);

    try {
      const charge = await firstValueFrom(
        this.cryptoService.createCharge({
          productId: this.flowState().productId,
          quantity: this.flowState().quantity
        })
      );

      this.cryptoCharge.set(charge);
      this.cryptoChargeCreated.emit(charge);

      // Start polling for status
      this.startCryptoPolling(charge.chargeId);
    } catch (err: any) {
      this.cryptoError.set(err?.message || this.translate('payment.crypto.error'));
    } finally {
      this.cryptoLoading.set(false);
    }
  }

  private startCryptoPolling(chargeId: string) {
    if (this.cryptoPollingInterval) {
      clearInterval(this.cryptoPollingInterval);
    }

    let pollCount = 0;
    const maxPolls = PAYMENT_PANEL_CONFIG.CRYPTO_MAX_POLLS;

    this.cryptoPollingInterval = setInterval(async () => {
      pollCount++;
      
      // Stop polling after max attempts
      if (pollCount > maxPolls) {
        clearInterval(this.cryptoPollingInterval);
        this.cryptoPollingInterval = undefined;
        this.cryptoError.set(this.translate('payment.crypto.pollingTimeout') || 'Payment is taking longer than expected. Please check your transaction status.');
        return;
      }

      try {
        const charge = await firstValueFrom(this.cryptoService.getCharge(chargeId));
        this.cryptoCharge.set(charge);

        if (charge.status === 'COMPLETED') {
          clearInterval(this.cryptoPollingInterval);
          this.cryptoPollingInterval = undefined;
          // Emit success event to navigate to confirmation
          this.cryptoPaymentConfirmed.emit({ chargeId: charge.chargeId });
        } else if (charge.status === 'FAILED' || charge.status === 'EXPIRED') {
          clearInterval(this.cryptoPollingInterval);
          this.cryptoPollingInterval = undefined;
          this.cryptoError.set(
            charge.status === 'FAILED' 
              ? this.translate('payment.crypto.failed') || 'Payment failed. Please try again.'
              : this.translate('payment.crypto.expired') || 'Payment expired. Please create a new payment.'
          );
        }
      } catch (err: any) {
        // Only show error after multiple failures
        if (pollCount > 3) {
          console.error('Error polling crypto charge:', err);
          // Don't set error immediately, allow retries
        }
      }
    }, PAYMENT_PANEL_CONFIG.CRYPTO_POLL_INTERVAL);
  }

  // HIGH-2: Error recovery - retry methods
  retryStripeInitialization() {
    this.stripeError.set(null);
    this.stripeClientSecret.set(null);
    this.stripePaymentElement = null;
    if (this.stripeContainer) {
      const container = document.getElementById(this.stripePaymentElementId);
      if (container) {
        container.innerHTML = '';
      }
    }
    this.initializeStripe();
  }

  retryCryptoCharge() {
    this.cryptoError.set(null);
    this.cryptoCharge.set(null);
    if (this.cryptoPollingInterval) {
      clearInterval(this.cryptoPollingInterval);
      this.cryptoPollingInterval = undefined;
    }
    this.createCryptoCharge();
  }

  onBack() {
    this.back.emit();
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

