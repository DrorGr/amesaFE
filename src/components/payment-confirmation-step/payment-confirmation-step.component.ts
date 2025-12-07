/**
 * PaymentConfirmationStepComponent
 * Step 5: Payment success confirmation
 */

import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { PaymentMethod, PaymentSuccessEvent } from '../../interfaces/payment-flow.interface';

@Component({
  selector: 'app-payment-confirmation-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-step-confirmation">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ translate('payment.confirmation.success') }}
      </div>

      <div class="text-center py-8">
        <!-- Success Icon -->
        <div class="mb-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
            <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>

        <!-- Success Message -->
        <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {{ translate('payment.confirmation.title') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ translate('payment.confirmation.message') }}
        </p>

        <!-- Transaction Details -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 max-w-md mx-auto">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.confirmation.details') }}
          </h3>
          
          <div class="space-y-2 text-left">
            @if (successData().paymentIntentId) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.confirmation.paymentIntentId') }}</span>
                <span class="font-mono text-gray-900 dark:text-white">{{ successData().paymentIntentId }}</span>
              </div>
            }
            
            @if (successData().chargeId) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.confirmation.chargeId') }}</span>
                <span class="font-mono text-gray-900 dark:text-white">{{ successData().chargeId }}</span>
              </div>
            }
            
            @if (successData().transactionId) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.confirmation.transactionId') }}</span>
                <span class="font-mono text-gray-900 dark:text-white">{{ successData().transactionId }}</span>
              </div>
            }
            
            <div class="flex justify-between text-sm pt-2 border-t border-gray-300 dark:border-gray-600">
              <span class="text-gray-600 dark:text-gray-400">{{ translate('payment.confirmation.method') }}</span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ translate('payment.method.' + paymentMethod()) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Close Button -->
        <button
          type="button"
          (click)="onClose()"
          [attr.aria-label]="translate('payment.confirmation.close')"
          class="bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {{ translate('payment.confirmation.close') }}
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
export class PaymentConfirmationStepComponent {
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  // Inputs
  successData = input.required<PaymentSuccessEvent>();
  paymentMethod = input<PaymentMethod>(PaymentMethod.Stripe);

  // Outputs
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

