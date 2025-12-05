import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductDto, ProductValidationResponse } from '../../services/product.service';
import { PaymentService } from '../../services/payment.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { ReservationService, Reservation } from '../../services/reservation.service';
import { ReservationCountdownComponent } from '../reservation-countdown/reservation-countdown.component';
import { ReservationStatusComponent } from '../reservation-status/reservation-status.component';

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReservationCountdownComponent, ReservationStatusComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl" #checkoutContainer>
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (loading()) {
          {{ translate('payment.checkout.loading') }}
        } @else if (error()) {
          {{ translate('payment.checkout.error') }}: {{ error() }}
        } @else if (product()) {
          {{ translate('payment.checkout.ready') }}
        }
      </div>

      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ translate('payment.checkout.title') }}
      </h1>

      <!-- Loading -->
      @if (loading()) {
        <div 
          class="text-center py-8 text-gray-700 dark:text-gray-300"
          [attr.aria-live]="'polite'"
          [attr.aria-busy]="true">
          {{ translate('payment.checkout.loading') }}
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

      <!-- Product Summary -->
      @if (product() && !loading()) {
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 shadow-sm">
          <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.checkout.orderSummary') }}
          </h2>
          <div class="space-y-2">
            <div class="flex justify-between text-gray-700 dark:text-gray-300">
              <span>{{ product()!.name }}</span>
              <span>{{ localeService.formatCurrency(product()!.basePrice, product()!.currency) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <label 
                for="quantity-input"
                class="text-gray-700 dark:text-gray-300">
                {{ translate('payment.checkout.quantity') }}:
              </label>
              <input 
                id="quantity-input"
                type="number" 
                [(ngModel)]="quantity" 
                (ngModelChange)="validateProduct()"
                min="1" 
                [max]="product()!.maxQuantityPerUser || 999"
                [attr.aria-label]="translate('payment.checkout.quantityInput')"
                [attr.aria-describedby]="'quantity-help'"
                class="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
            </div>
            <div id="quantity-help" class="sr-only">
              {{ translate('payment.checkout.quantityHelp') }}
            </div>
            <div class="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
              <div class="flex justify-between font-bold text-xl text-gray-900 dark:text-white">
                <span>{{ translate('payment.checkout.total') }}:</span>
                <span>{{ localeService.formatCurrency(totalPrice(), product()!.currency) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        @if (validationErrors().length > 0) {
          <div 
            class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4"
            role="alert"
            [attr.aria-live]="'assertive'">
            <ul class="list-disc list-inside">
              @for (error of validationErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }

        <!-- Reservation Error -->
        @if (reservationError()) {
          <div 
            class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
            role="alert"
            [attr.aria-live]="'assertive'">
            {{ reservationError() }}
          </div>
        }

        <!-- Reservation Status (if reservation exists) -->
        @if (reservationId() && !reservationError()) {
          <div class="mb-6">
            <app-reservation-status [reservationId]="reservationId()!"></app-reservation-status>
          </div>
        }

        <!-- Reservation Countdown (if reservation exists and is pending) -->
        @if (reservation() && reservation()!.status === 'pending' && reservation()!.expiresAt) {
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between">
              <span class="text-yellow-800 dark:text-yellow-200 font-medium">
                {{ translate('payment.checkout.reservationExpires') || 'Reservation expires in' }}:
              </span>
              <app-reservation-countdown 
                [houseId]="reservation()!.houseId" 
                [targetDate]="reservation()!.expiresAt">
              </app-reservation-countdown>
            </div>
          </div>
        }

        <!-- Payment Method Selection -->
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 shadow-sm">
          <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.checkout.paymentMethod') }}
          </h2>
          <div class="space-y-4" role="radiogroup" [attr.aria-label]="translate('payment.checkout.paymentMethod')">
            <label class="flex items-center cursor-pointer text-gray-700 dark:text-gray-300">
              <input 
                type="radio" 
                [(ngModel)]="paymentMethod" 
                value="stripe"
                name="payment-method"
                [attr.aria-label]="translate('payment.checkout.stripeMethod')"
                class="mr-2 w-4 h-4 text-blue-600 dark:text-blue-400">
              <span>{{ translate('payment.checkout.stripeMethod') }}</span>
            </label>
            <label class="flex items-center cursor-pointer text-gray-700 dark:text-gray-300">
              <input 
                type="radio" 
                [(ngModel)]="paymentMethod" 
                value="crypto"
                name="payment-method"
                [attr.aria-label]="translate('payment.checkout.cryptoMethod')"
                class="mr-2 w-4 h-4 text-blue-600 dark:text-blue-400">
              <span>{{ translate('payment.checkout.cryptoMethod') }}</span>
            </label>
          </div>
        </div>

        <!-- Continue Button -->
        <div class="flex justify-end">
          <button 
            type="button"
            [disabled]="!canProceed()"
            (click)="proceedToPayment()"
            (keydown.enter)="proceedToPayment()"
            (keydown.space)="proceedToPayment(); $event.preventDefault()"
            [attr.aria-label]="translate('payment.checkout.continueButton')"
            [attr.aria-describedby]="!canProceed() ? 'continue-help' : null"
            class="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none transition-colors duration-200">
            {{ translate('payment.checkout.continueButton') }}
          </button>
          @if (!canProceed()) {
            <div id="continue-help" class="sr-only">
              {{ translate('payment.checkout.cannotProceed') }}
            </div>
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
export class PaymentCheckoutComponent implements OnInit {
  product = signal<ProductDto | null>(null);
  quantity = 1;
  paymentMethod = 'stripe';
  loading = signal(false);
  error = signal<string | null>(null);
  validationErrors = signal<string[]>([]);
  calculatedPrice = signal<number>(0);
  reservation = signal<Reservation | null>(null);
  reservationId = signal<string | null>(null);
  reservationError = signal<string | null>(null);

  totalPrice = computed(() => {
    const price = this.calculatedPrice();
    return price > 0 ? price : (this.product()?.basePrice || 0) * this.quantity;
  });

  canProceed = computed(() => {
    return this.product() !== null && 
           this.validationErrors().length === 0 && 
           this.paymentMethod !== '';
  });

  private translationService = inject(TranslationService);
  localeService = inject(LocaleService); // Public for template access
  private focusTrapService = inject(FocusTrapService);
  private reservationService = inject(ReservationService);

  constructor(
    private productService: ProductService,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnInit() {
    const productId = this.route.snapshot.queryParams['productId'];
    const reservationId = this.route.snapshot.queryParams['reservationId'];
    
    if (reservationId) {
      this.reservationId.set(reservationId);
      this.loadReservation(reservationId);
    }
    
    if (productId) {
      this.loadProduct(productId);
    } else if (!reservationId) {
      this.error.set(this.translate('payment.checkout.noProductSelected'));
    }
  }

  loadReservation(reservationId: string) {
    this.reservationError.set(null);
    this.reservationService.getReservation(reservationId).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.reservationError.set(null);
        // If we have a reservation, load the associated product
        if (reservation.houseId) {
          // Note: We'd need to get productId from houseId - this may require additional service call
          // For now, reservation status will show without product details
        }
      },
      error: (err) => {
        console.error('Error loading reservation:', err);
        this.reservationError.set(
          err?.error?.message || 
          this.translate('payment.checkout.failedToLoadReservation') || 
          'Failed to load reservation'
        );
      }
    });
  }

  loadProduct(productId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.validateProduct();
      },
      error: (err) => {
        this.error.set(this.translate('payment.checkout.failedToLoadProduct'));
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  validateProduct() {
    const product = this.product();
    if (!product) return;

    this.productService.validateProduct({
      productId: product.id,
      quantity: this.quantity
    }).subscribe({
      next: (response) => {
        if (response.isValid) {
          this.validationErrors.set([]);
          this.calculatedPrice.set(response.calculatedPrice);
        } else {
          this.validationErrors.set(response.errors);
        }
      },
      error: (err) => {
        this.validationErrors.set([this.translate('payment.checkout.failedToValidateProduct')]);
        console.error(err);
      }
    });
  }

  proceedToPayment() {
    const product = this.product();
    if (!product || !this.canProceed()) return;

    if (this.paymentMethod === 'stripe') {
      this.router.navigate(['/payment/stripe'], {
        queryParams: { productId: product.id, quantity: this.quantity }
      });
    } else if (this.paymentMethod === 'crypto') {
      this.router.navigate(['/payment/crypto'], {
        queryParams: { productId: product.id, quantity: this.quantity }
      });
    }
  }
}

