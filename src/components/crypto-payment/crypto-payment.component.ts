import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QRCodeComponent } from 'angularx-qrcode';
import { CryptoPaymentService, CoinbaseChargeResponse, SupportedCrypto } from '../../services/crypto-payment.service';
import { PaymentService } from '../../services/payment.service';
import { ProductService } from '../../services/product.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { FocusTrapService } from '../../services/focus-trap.service';

@Component({
  selector: 'app-crypto-payment',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-2xl" #paymentContainer>
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (loading()) {
          {{ translate('payment.crypto.loading') }}
        } @else if (error()) {
          {{ translate('payment.crypto.error') }}: {{ error() }}
        } @else if (charge()?.status === 'COMPLETED') {
          {{ translate('payment.crypto.success') }}
        }
      </div>

      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ translate('payment.crypto.title') }}
      </h1>

      <!-- Loading -->
      @if (loading()) {
        <div 
          class="text-center py-8 text-gray-700 dark:text-gray-300"
          [attr.aria-live]="'polite'"
          [attr.aria-busy]="true">
          {{ translate('payment.crypto.creating') }}
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

      <!-- Charge Created -->
      @if (charge() && !loading()) {
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 shadow-sm">
          <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            {{ translate('payment.crypto.paymentDetails') }}
          </h2>
          
          <div class="mb-4 space-y-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ translate('payment.crypto.status') }}: 
              <span class="font-semibold text-gray-900 dark:text-white">{{ charge()!.status }}</span>
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ translate('payment.crypto.amount') }}: 
              <span class="font-semibold text-gray-900 dark:text-white">{{ localeService.formatCurrency(totalAmount(), currency()) }}</span>
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ translate('payment.crypto.expires') }}: 
              <span class="font-semibold text-gray-900 dark:text-white">{{ localeService.formatDate(expiresAt(), 'medium') }}</span>
            </p>
          </div>

          <!-- QR Code -->
          @if (charge()!.hostedUrl) {
            <div class="mb-4 text-center">
              <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {{ translate('payment.crypto.scanQR') }}
              </h3>
              <qrcode 
                [qrdata]="charge()!.hostedUrl" 
                [width]="256"
                [errorCorrectionLevel]="'M'"
                [colorDark]="'#000000'"
                [colorLight]="'#FFFFFF'"
                [attr.aria-label]="translate('payment.crypto.qrCode')">
              </qrcode>
              <a 
                [href]="charge()!.hostedUrl" 
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="translate('payment.crypto.openPaymentPage')"
                class="text-blue-600 dark:text-blue-400 hover:underline mt-2 block focus:outline-none rounded">
                {{ translate('payment.crypto.openPaymentPage') }}
              </a>
            </div>
          }

          <!-- Status Polling -->
          @if (charge()!.status === 'NEW' || charge()!.status === 'PENDING') {
            <div 
              class="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4"
              role="status"
              [attr.aria-live]="'polite'">
              <p>{{ translate('payment.crypto.waiting') }}</p>
              <p class="text-sm mt-1">{{ translate('payment.crypto.autoUpdate') }}</p>
            </div>
          }

          <!-- Success -->
          @if (charge()!.status === 'COMPLETED') {
            <div 
              class="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4"
              role="alert"
              [attr.aria-live]="'polite'">
              {{ translate('payment.crypto.success') }}
            </div>
          }

          <!-- Failed -->
          @if (charge()!.status === 'FAILED' || charge()!.status === 'EXPIRED') {
            <div 
              class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
              role="alert"
              [attr.aria-live]="'assertive'">
              {{ translate('payment.crypto.failed') }}: {{ charge()!.status.toLowerCase() }}
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
export class CryptoPaymentComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService); // Public for template access
  private focusTrapService = inject(FocusTrapService);

  loading = signal(false);
  error = signal<string | null>(null);
  charge = signal<CoinbaseChargeResponse | null>(null);
  totalAmount = signal(0);
  currency = signal('USD');
  expiresAt = signal<string>('');
  private pollingSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private cryptoService: CryptoPaymentService,
    private paymentService: PaymentService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnInit() {
    const productId = this.route.snapshot.queryParams['productId'];
    const quantity = parseInt(this.route.snapshot.queryParams['quantity'] || '1');

    if (productId) {
      this.createCharge(productId, quantity);
    } else {
      this.error.set('No product selected');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  async createCharge(productId: string, quantity: number) {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Get product price (server-side)
      const price = await firstValueFrom(this.productService.getProductPrice(productId, quantity));
      if (!price) {
        throw new Error('Failed to get product price');
      }

      this.totalAmount.set(price);

      // Create charge
      const idempotencyKey = this.paymentService.generateIdempotencyKey();
      const charge = await firstValueFrom(this.cryptoService.createCharge({
        productId,
        quantity,
        idempotencyKey
      }));

      if (!charge) {
        throw new Error('Failed to create charge');
      }

      this.charge.set(charge);
      this.currency.set(charge.pricing.local.currency);
      // Use LocaleService for date formatting
      this.expiresAt.set(this.localeService.formatDate(new Date(charge.expiresAt), 'medium'));
      this.loading.set(false);

      // Start polling if pending
      if (charge.status === 'NEW' || charge.status === 'PENDING') {
        this.startPolling(charge.chargeId);
      }

      // Redirect on success
      if (charge.status === 'COMPLETED') {
        setTimeout(() => {
          this.router.navigate(['/payment/success']);
        }, 2000);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to create payment');
      this.loading.set(false);
      console.error(err);
    }
  }

  startPolling(chargeId: string) {
    // Clean up existing subscription if any
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    
    this.pollingSubscription = this.cryptoService.pollChargeStatus(chargeId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (charge) => {
        this.charge.set(charge);
        
        if (charge.status === 'COMPLETED') {
          if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = undefined;
          }
          setTimeout(() => {
            this.router.navigate(['/payment/success']);
          }, 2000);
        } else if (charge.status === 'FAILED' || charge.status === 'EXPIRED') {
          if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = undefined;
          }
        }
      },
      error: (err) => {
        console.error('Error polling charge status:', err);
        // Continue polling on error
      }
    });
  }
}

