import { Component, EventEmitter, Output, Input, signal, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { FocusTrapService } from '../../services/focus-trap.service';

export interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-payment-method-selection-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      (click)="close()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'payment-method-modal-title'"
      [attr.aria-describedby]="'payment-method-modal-description'">
      
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        (click)="$event.stopPropagation()"
        #modalContent>
        
        <!-- Screen reader announcement -->
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ translate('payment.methodSelection.title') }}
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 
            id="payment-method-modal-title"
            class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ translate('payment.methodSelection.title') }}
          </h2>
          <button
            (click)="close()"
            (keydown.enter)="close()"
            (keydown.space)="close(); $event.preventDefault()"
            [attr.aria-label]="translate('common.close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Description -->
        <p 
          id="payment-method-modal-description"
          class="text-gray-600 dark:text-gray-400 mb-6">
          {{ translate('payment.methodSelection.description') }}
        </p>

        <!-- Payment Methods List -->
        <div class="space-y-3 mb-6">
          <div
            *ngFor="let method of paymentMethodsSignal(); trackBy: trackByMethodId"
            [class.opacity-50]="!method.enabled"
            [class.cursor-not-allowed]="!method.enabled"
            [class.cursor-pointer]="method.enabled"
            class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            [class.bg-blue-50]="selectedMethod() === method.id && method.enabled"
            [class.dark:bg-blue-900]="selectedMethod() === method.id && method.enabled"
            (click)="selectMethod(method)"
            (keydown.enter)="selectMethod(method)"
            (keydown.space)="selectMethod(method); $event.preventDefault()"
            [attr.aria-label]="method.name + (method.enabled ? '' : ' - ' + translate('common.disabled'))"
            [attr.aria-pressed]="selectedMethod() === method.id"
            role="button"
            [tabindex]="method.enabled ? 0 : -1">
            
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                  <div [innerHTML]="method.icon" class="w-8 h-8"></div>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ method.name }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ method.description }}
                  </p>
                </div>
              </div>
              <div *ngIf="selectedMethod() === method.id && method.enabled" class="flex-shrink-0">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            (click)="close()"
            (keydown.enter)="close()"
            (keydown.space)="close(); $event.preventDefault()"
            [attr.aria-label]="translate('common.cancel')"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
            {{ translate('common.cancel') }}
          </button>
          <button
            (click)="confirmSelection()"
            (keydown.enter)="confirmSelection()"
            (keydown.space)="confirmSelection(); $event.preventDefault()"
            [disabled]="!selectedMethod() || !isMethodEnabled(selectedMethod()!)"
            [attr.aria-label]="translate('common.confirm')"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ translate('common.confirm') }}
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
export class PaymentMethodSelectionModalComponent implements OnInit, AfterViewInit {
  private _paymentMethodsInput: PaymentMethodOption[] = [];
  
  @Input() set paymentMethods(value: PaymentMethodOption[]) {
    this._paymentMethodsInput = value || [];
    this.paymentMethodsSignal.set(this._paymentMethodsInput);
  }
  get paymentMethods(): PaymentMethodOption[] {
    return this._paymentMethodsInput;
  }
  
  paymentMethodsSignal = signal<PaymentMethodOption[]>([]);
  @Output() methodSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('modalContent') modalContent!: ElementRef<HTMLDivElement>;

  private translationService = inject(TranslationService);
  private focusTrapService = inject(FocusTrapService);

  selectedMethod = signal<string | null>(null);

  ngOnInit(): void {
    // Set default payment methods if none provided
    if (this.paymentMethodsSignal().length === 0) {
      this.paymentMethodsSignal.set(this.getDefaultPaymentMethods());
    }
  }

  ngAfterViewInit(): void {
    // Trap focus within modal after view is initialized
    if (this.modalContent?.nativeElement) {
      this.focusTrapService.trapFocus(this.modalContent.nativeElement);
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  selectMethod(method: PaymentMethodOption): void {
    if (method.enabled) {
      this.selectedMethod.set(method.id);
    }
  }

  confirmSelection(): void {
    const methodId = this.selectedMethod();
    if (methodId && this.isMethodEnabled(methodId)) {
      this.methodSelected.emit(methodId);
      this.close();
    }
  }

  close(): void {
    // Release focus trap before closing
    this.focusTrapService.releaseFocus();
    this.closed.emit();
  }

  isMethodEnabled(methodId: string | null): boolean {
    if (!methodId) return false;
    const method = this.paymentMethodsSignal().find(m => m.id === methodId);
    return method?.enabled ?? false;
  }

  trackByMethodId(index: number, method: PaymentMethodOption): string {
    return method.id;
  }

  private getDefaultPaymentMethods(): PaymentMethodOption[] {
    return [
      {
        id: 'stripe',
        name: this.translate('payment.methods.stripe') || 'Credit/Debit Card',
        description: this.translate('payment.methods.stripeDescription') || 'Pay with credit or debit card via Stripe',
        icon: '<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.532-5.851-6.594-7.305h.003z"/></svg>',
        enabled: true
      },
      {
        id: 'crypto',
        name: this.translate('payment.methods.crypto') || 'Cryptocurrency',
        description: this.translate('payment.methods.cryptoDescription') || 'Pay with cryptocurrency',
        icon: '<svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.273 5.789c.238 0 .462.027.673.076v1.715a3.687 3.687 0 00-.673-.07c-1.891 0-3.375 1.345-3.375 3.12 0 1.775 1.485 3.12 3.375 3.12.238 0 .462-.027.673-.07v1.715a5.503 5.503 0 01-.673.076c-2.957 0-5.25-2.139-5.25-4.84 0-2.7 2.293-4.84 5.25-4.84zm5.395 2.582v1.715a3.676 3.676 0 00-.673-.07c-1.891 0-3.375 1.345-3.375 3.12 0 1.775 1.485 3.12 3.375 3.12.238 0 .462-.027.673-.07v1.715a5.503 5.503 0 01-.673.076c-2.957 0-5.25-2.139-5.25-4.84 0-2.7 2.293-4.84 5.25-4.84.238 0 .462.027.673.076z"/></svg>',
        enabled: false // Crypto payment not yet implemented
      }
    ];
  }
}

