/**
 * PaymentQuantityStepComponent
 * Step 1: Quantity selection with real-time price calculation
 */

import { Component, inject, input, output, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService, ProductDto } from '../../services/product.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { QuantitySelectedEvent } from '@core/interfaces/payment-flow.interface';
import { PAYMENT_PANEL_CONFIG } from '../../../../../config/payment-panel.config';

@Component({
  selector: 'app-payment-quantity-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-step-quantity">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (loading()) {
          {{ translate('payment.quantity.loading') }}
        } @else if (product()) {
          {{ translate('payment.quantity.ready') }}
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-8" [attr.aria-busy]="true">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p class="mt-4 text-gray-700 dark:text-gray-300">{{ translate('payment.quantity.loading') }}</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div 
          class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
          role="alert"
          [attr.aria-live]="'assertive'">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="font-semibold mb-1">{{ translate('payment.error.title') || 'Error' }}</p>
              <p class="text-sm">{{ error() }}</p>
            </div>
            <button
              type="button"
              (click)="loadProduct()"
              [disabled]="loading()"
              [attr.aria-label]="translate('payment.error.retry') || 'Retry'"
              class="ml-4 px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
              {{ translate('payment.error.retry') || 'Retry' }}
            </button>
          </div>
        </div>
      }

      <!-- Product Info -->
      @if (product() && !loading()) {
        <div class="space-y-6">
          <!-- Product Details -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {{ product()!.name }}
            </h3>
            @if (product()!.description) {
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ product()!.description }}
              </p>
            }
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ translate('payment.quantity.basePrice') }}: 
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ localeService.formatCurrency(product()!.basePrice, product()!.currency) }}
              </span>
            </p>
          </div>

          <!-- Quantity Selector -->
          <div class="space-y-4">
            <label 
              for="quantity-select"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ translate('payment.quantity.selectQuantity') }}
            </label>
            <div class="flex items-center gap-4">
              <button
                type="button"
                (click)="decreaseQuantity()"
                [disabled]="quantity() <= 1 || isLoading()"
                [attr.aria-label]="translate('payment.quantity.decrease')"
                class="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span class="text-xl">−</span>
              </button>
              <input
                id="quantity-select"
                type="number"
                [value]="quantity()"
                (input)="onQuantityChange($event)"
                [min]="1"
                [max]="maxQuantity()"
                [disabled]="isLoading()"
                [attr.aria-label]="translate('payment.quantity.input')"
                [attr.aria-describedby]="'quantity-help'"
                class="w-20 text-center text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <button
                type="button"
                (click)="increaseQuantity()"
                [disabled]="quantity() >= maxQuantity() || isLoading()"
                [attr.aria-label]="translate('payment.quantity.increase')"
                class="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span class="text-xl">+</span>
              </button>
            </div>
            <p id="quantity-help" class="text-sm text-gray-500 dark:text-gray-400">
              {{ translate('payment.quantity.maxQuantity') }}: {{ maxQuantity() }}
            </p>
          </div>

          <!-- Price Calculation -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ translate('payment.quantity.unitPrice') }}
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ localeService.formatCurrency(product()!.basePrice, product()!.currency) }}
              </span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ translate('payment.quantity.quantity') }}: {{ quantity() }}
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                × {{ localeService.formatCurrency(product()!.basePrice, product()!.currency) }}
              </span>
            </div>
            <div class="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ translate('payment.quantity.total') }}
                </span>
                <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {{ localeService.formatCurrency(calculatedPrice(), product()!.currency) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Validation Errors -->
          @if (validationErrors().length > 0) {
            <div 
              class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded"
              role="alert"
              [attr.aria-live]="'assertive'">
              <ul class="list-disc list-inside space-y-1">
                @for (error of validationErrors(); track error) {
                  <li class="text-sm">{{ error }}</li>
                }
              </ul>
            </div>
          }

          <!-- Next Button -->
          <button
            type="button"
            (click)="onNext()"
            [disabled]="!canProceed() || isLoading()"
            [attr.aria-label]="translate('payment.quantity.next')"
            class="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {{ translate('payment.quantity.next') }}
          </button>
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
export class PaymentQuantityStepComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  // Inputs
  productId = input.required<string>();
  initialQuantity = input<number>(1);

  // Outputs
  quantitySelected = output<QuantitySelectedEvent>();
  errorOccurred = output<string>();

  // State
  product = signal<ProductDto | null>(null);
  quantity = signal<number>(1);
  calculatedPrice = signal<number>(0);
  validationErrors = signal<string[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed
  maxQuantity = computed(() => {
    const prod = this.product();
    if (!prod) return 1;
    return Math.min(
      prod.maxQuantityPerUser || 999,
      (prod.totalQuantityAvailable || 999) - (prod.quantitySold || 0)
    );
  });

  isLoading = computed(() => this.loading());

  canProceed = computed(() => {
    return !this.loading() && 
           this.product() !== null && 
           this.quantity() >= 1 && 
           this.quantity() <= this.maxQuantity() &&
           this.validationErrors().length === 0;
  });

  // Debounce timer for price calculation (HIGH-1 fix: Store reference for cleanup)
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  constructor() {
    // Effect to calculate price when quantity or product changes
    // Use a debounce mechanism to prevent race conditions
    effect(() => {
      const qty = this.quantity();
      const prod = this.product();
      
      if (prod && !this.isDestroyed) {
        // Clear existing timer (HIGH-1 fix: Use stored reference)
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
        
        // Debounce price calculation to avoid multiple rapid API calls
        this.debounceTimer = setTimeout(() => {
          if (!this.isDestroyed) {
            this.calculatePrice(qty, prod).catch(err => {
              if (!this.isDestroyed) {
                console.error('Price calculation error in effect:', err);
                // Error is already handled in calculatePrice method
              }
            });
          }
          this.debounceTimer = null;
        }, PAYMENT_PANEL_CONFIG.DEBOUNCE_DELAY);
      }
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    // Cleanup debounce timer to prevent memory leaks (HIGH-1 fix)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  async ngOnInit() {
    this.quantity.set(this.initialQuantity());
    await this.loadProduct();
  }

  async loadProduct() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const product = await firstValueFrom(this.productService.getProduct(this.productId()));
      this.product.set(product);
      await this.validateQuantity(this.quantity());
    } catch (err: any) {
      const errorMsg = err?.message || this.translate('payment.quantity.loadError');
      this.error.set(errorMsg);
      this.errorOccurred.emit(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  private async calculatePrice(qty: number, product: ProductDto) {
    if (this.isDestroyed) return;
    
    try {
      const validation = await firstValueFrom(
        this.productService.validateProduct({
          productId: product.id,
          quantity: qty
        })
      );
      
      if (!this.isDestroyed) {
        this.calculatedPrice.set(validation.calculatedPrice);
        this.validationErrors.set(validation.errors || []);
      }
    } catch (err: any) {
      if (!this.isDestroyed) {
        // Fallback to simple calculation
        this.calculatedPrice.set(product.basePrice * qty);
        this.validationErrors.set([err?.message || this.translate('payment.quantity.priceCalculationError')]);
      }
    }
  }

  private async validateQuantity(qty: number) {
    if (!this.product()) return;
    
    await this.calculatePrice(qty, this.product()!);
  }

  increaseQuantity() {
    if (this.quantity() < this.maxQuantity()) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  onQuantityChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (isNaN(value) || value < 1) {
      this.quantity.set(1);
    } else if (value > this.maxQuantity()) {
      this.quantity.set(this.maxQuantity());
    } else {
      this.quantity.set(value);
    }
  }

  async onNext() {
    if (!this.canProceed()) return;

    // Final validation
    await this.validateQuantity(this.quantity());

    if (this.validationErrors().length > 0) {
      return;
    }

    // Emit quantity selected event
    this.quantitySelected.emit({
      quantity: this.quantity(),
      calculatedPrice: this.calculatedPrice()
    });
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

