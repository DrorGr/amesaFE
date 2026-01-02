/**
 * PaymentReviewStepComponent
 * Step 2: Order review and summary before payment
 */

import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { PaymentFlowState } from '@core/interfaces/payment-flow.interface';

@Component({
  selector: 'app-payment-review-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-step-review">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ translate('payment.review.title') }}
      </div>

      <div class="space-y-6">
        <!-- Order Summary -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.review.orderSummary') }}
          </h3>
          
          <div class="space-y-3">
            @if (flowState().houseTitle) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.house') }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ flowState().houseTitle }}</span>
              </div>
            }
            
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.quantity') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ flowState().quantity }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.review.unitPrice') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ localeService.formatCurrency(unitPrice(), flowState().currency) }}
              </span>
            </div>
            
            <div class="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ translate('payment.review.total') }}
                </span>
                <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {{ localeService.formatCurrency(flowState().totalAmount || flowState().calculatedPrice || 0, flowState().currency) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Method Preview -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ translate('payment.review.paymentMethod') }}
            </span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ translate('payment.method.' + flowState().paymentMethod) }}
            </span>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex gap-4">
          <button
            type="button"
            (click)="onBack()"
            [attr.aria-label]="translate('payment.review.back')"
            class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
            {{ translate('payment.review.back') }}
          </button>
          <button
            type="button"
            (click)="onContinue()"
            [attr.aria-label]="translate('payment.review.continue')"
            class="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            {{ translate('payment.review.continue') }}
          </button>
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
export class PaymentReviewStepComponent {
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  // Inputs
  flowState = input.required<PaymentFlowState>();

  // Outputs
  back = output<void>();
  continue = output<void>();

  // Computed
  unitPrice = computed(() => {
    const state = this.flowState();
    if (state.quantity > 0) {
      return (state.totalAmount || state.calculatedPrice || 0) / state.quantity;
    }
    return 0;
  });

  onBack() {
    this.back.emit();
  }

  onContinue() {
    this.continue.emit();
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

