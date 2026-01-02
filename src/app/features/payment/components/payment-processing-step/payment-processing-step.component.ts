/**
 * PaymentProcessingStepComponent
 * Step 4: Payment processing with loading states
 */

import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@core/services/translation.service';
import { PaymentMethod } from '@core/interfaces/payment-flow.interface';

@Component({
  selector: 'app-payment-processing-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-step-processing">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ translate('payment.processing.title') }}
      </div>

      <div class="text-center py-12">
        <!-- Loading Spinner -->
        <div class="mb-6">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
        </div>

        <!-- Status Message -->
        <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {{ statusMessage() }}
        </h3>

        <p class="text-gray-600 dark:text-gray-400">
          {{ translate('payment.processing.pleaseWait') }}
        </p>

        <!-- Payment Method Specific Message -->
        @if (paymentMethod() === PaymentMethod.Stripe) {
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {{ translate('payment.processing.stripeMessage') }}
          </p>
        } @else if (paymentMethod() === PaymentMethod.Crypto) {
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {{ translate('payment.processing.cryptoMessage') }}
          </p>
        }
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
export class PaymentProcessingStepComponent implements OnInit {
  private translationService = inject(TranslationService);

  // Inputs
  paymentMethod = input<PaymentMethod>(PaymentMethod.Stripe);
  customMessage = input<string | undefined>(undefined);

  // Expose enum to template
  PaymentMethod = PaymentMethod;

  // Computed
  statusMessage = signal<string>('');

  ngOnInit() {
    const message = this.customMessage() || this.translate(`payment.processing.${this.paymentMethod()}`);
    this.statusMessage.set(message);
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

