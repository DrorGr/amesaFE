/**
 * ResponsivePaymentPanelComponent
 * Main container component for responsive payment UI
 * - Mobile (≤990px): Full-screen sidebar that slides in from the right
 * - Desktop (>990px): Expanding popup that grows from button to center
 */

import { 
  Component, 
  inject, 
  input, 
  output, 
  signal, 
  computed,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { TranslationService } from '../../services/translation.service';
import { ProductService } from '../../services/product.service';
import { PaymentStep, PaymentMethod, PaymentFlowState, QuantitySelectedEvent, PaymentMethodSelectedEvent, PaymentSuccessEvent } from '../../interfaces/payment-flow.interface';
import { PaymentQuantityStepComponent } from '../payment-quantity-step/payment-quantity-step.component';
import { PaymentReviewStepComponent } from '../payment-review-step/payment-review-step.component';
import { PaymentTabsStepComponent } from '../payment-tabs-step/payment-tabs-step.component';
import { PaymentProcessingStepComponent } from '../payment-processing-step/payment-processing-step.component';
import { PaymentConfirmationStepComponent } from '../payment-confirmation-step/payment-confirmation-step.component';
import { PaymentIntentResponse } from '../../services/stripe.service';
import { CoinbaseChargeResponse } from '../../services/crypto-payment.service';
import { LotteryService } from '../../services/lottery.service';
import { ReservationService } from '../../services/reservation.service';
import { ToastService } from '../../services/toast.service';
import { RealtimeService } from '../../services/realtime.service';
import { PurchaseTicketRequest } from '../../models/house.model';
import { PAYMENT_PANEL_CONFIG } from '../../config/payment-panel.config';

@Component({
  selector: 'app-responsive-payment-panel',
  standalone: true,
  imports: [
    CommonModule,
    PaymentQuantityStepComponent,
    PaymentReviewStepComponent,
    PaymentTabsStepComponent,
    PaymentProcessingStepComponent,
    PaymentConfirmationStepComponent
  ],
  template: `
    <!-- Screen reader announcement -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      @if (isOpen()) {
        {{ translate('payment.panel.title') }}
      }
    </div>

    <!-- Backdrop -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-[119] transition-opacity duration-300 ease-in-out"
        [class.opacity-100]="isOpen()"
        [class.opacity-0]="!isOpen()"
        (click)="onBackdropClick($event)"
        [attr.aria-label]="translate('payment.panel.close')">
      </div>
    }

    <!-- Mobile: Full-Screen Sidebar -->
    @if (isMobile()) {
      <div 
        #panelContainer
        class="fixed right-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-xl z-[120] transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="isOpen()"
        [class.translate-x-full]="!isOpen()"
        role="dialog"
        [attr.aria-modal]="'true'"
        [attr.aria-labelledby]="'payment-panel-title'"
        [attr.aria-describedby]="'payment-panel-description'">
        
        <!-- Mobile Content -->
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 
              id="payment-panel-title"
              class="text-xl font-bold text-gray-900 dark:text-white">
              {{ translate('payment.panel.title') }}
            </h2>
            <button
              (click)="close()"
              (keydown.enter)="close()"
              (keydown.escape)="close()"
              [attr.aria-label]="translate('payment.panel.close')"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4">
            <div id="payment-panel-description" class="sr-only">
              {{ translate('payment.panel.description') || 'Payment panel for purchasing lottery tickets' }}
            </div>
            
            <!-- Step Components -->
            @switch (currentStep()) {
              @case (PaymentStep.Quantity) {
                <app-payment-quantity-step
                  [productId]="flowState().productId"
                  [initialQuantity]="flowState().quantity"
                  (quantitySelected)="onQuantitySelected($event)"
                  (errorOccurred)="handleError($event)">
                </app-payment-quantity-step>
              }
              @case (PaymentStep.Review) {
                <app-payment-review-step
                  [flowState]="flowState()"
                  (back)="goToStep(PaymentStep.Quantity)"
                  (continue)="goToStep(PaymentStep.Payment)">
                </app-payment-review-step>
              }
              @case (PaymentStep.Payment) {
                <app-payment-tabs-step
                  [flowState]="flowState()"
                  (paymentMethodSelected)="onPaymentMethodSelected($event)"
                  (paymentIntentCreated)="onPaymentIntentCreated($event)"
                  (cryptoChargeCreated)="onCryptoChargeCreated($event)"
                  (cryptoPaymentConfirmed)="onCryptoPaymentConfirmed($event)"
                  (stripePaymentConfirmed)="onStripePaymentConfirmed($event)"
                  (back)="goToStep(PaymentStep.Review)">
                </app-payment-tabs-step>
              }
              @case (PaymentStep.Processing) {
                <app-payment-processing-step
                  [paymentMethod]="flowState().paymentMethod"
                  [customMessage]="flowState().error">
                </app-payment-processing-step>
              }
              @case (PaymentStep.Confirmation) {
                <app-payment-confirmation-step
                  [successData]="successData()"
                  [paymentMethod]="flowState().paymentMethod"
                  (close)="handlePaymentSuccess()">
                </app-payment-confirmation-step>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- Desktop: Expanding Popup -->
    @if (!isMobile()) {
      <div 
        #panelContainer
        class="payment-panel-desktop fixed left-1/2 top-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[120] overflow-hidden"
        [style.width.px]="PAYMENT_PANEL_CONFIG.DESKTOP_PANEL_WIDTH"
        [style.max-width]="'90vw'"
        [style.max-height]="PAYMENT_PANEL_CONFIG.DESKTOP_PANEL_MAX_HEIGHT_PERCENT + 'vh'"
        [style.transform]="isOpen() ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)'"
        [style.transform-origin]="transformOrigin()"
        [style.opacity]="isOpen() ? 1 : 0"
        [class.payment-panel-open]="isOpen()"
        role="dialog"
        [attr.aria-modal]="'true'"
        [attr.aria-labelledby]="'payment-panel-title'"
        [attr.aria-describedby]="'payment-panel-description'">
        
        <!-- Desktop Content -->
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 
              id="payment-panel-title"
              class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ translate('payment.panel.title') }}
            </h2>
            <button
              (click)="close()"
              (keydown.enter)="close()"
              (keydown.escape)="close()"
              [attr.aria-label]="translate('payment.panel.close')"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-6">
            <div id="payment-panel-description" class="sr-only">
              {{ translate('payment.panel.description') || 'Payment panel for purchasing lottery tickets' }}
            </div>
            
            <!-- Step Components -->
            @switch (currentStep()) {
              @case (PaymentStep.Quantity) {
                <app-payment-quantity-step
                  [productId]="flowState().productId"
                  [initialQuantity]="flowState().quantity"
                  (quantitySelected)="onQuantitySelected($event)"
                  (errorOccurred)="handleError($event)">
                </app-payment-quantity-step>
              }
              @case (PaymentStep.Review) {
                <app-payment-review-step
                  [flowState]="flowState()"
                  (back)="goToStep(PaymentStep.Quantity)"
                  (continue)="goToStep(PaymentStep.Payment)">
                </app-payment-review-step>
              }
              @case (PaymentStep.Payment) {
                <app-payment-tabs-step
                  [flowState]="flowState()"
                  (paymentMethodSelected)="onPaymentMethodSelected($event)"
                  (paymentIntentCreated)="onPaymentIntentCreated($event)"
                  (cryptoChargeCreated)="onCryptoChargeCreated($event)"
                  (cryptoPaymentConfirmed)="onCryptoPaymentConfirmed($event)"
                  (stripePaymentConfirmed)="onStripePaymentConfirmed($event)"
                  (back)="goToStep(PaymentStep.Review)">
                </app-payment-tabs-step>
              }
              @case (PaymentStep.Processing) {
                <app-payment-processing-step
                  [paymentMethod]="flowState().paymentMethod"
                  [customMessage]="flowState().error">
                </app-payment-processing-step>
              }
              @case (PaymentStep.Confirmation) {
                <app-payment-confirmation-step
                  [successData]="successData()"
                  [paymentMethod]="flowState().paymentMethod"
                  (close)="handlePaymentSuccess()">
                </app-payment-confirmation-step>
              }
            }
          </div>
        </div>
      </div>
    }

  `,
  styles: [`
    /* Desktop Panel Animation */
    .payment-panel-desktop {
      will-change: transform, opacity, left, top, width, height;
      transition: 
        transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
        opacity 300ms ease-out,
        left 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
        top 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
        width 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
        height 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .payment-panel-desktop.payment-panel-open {
      will-change: auto;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .payment-panel-desktop {
        transition: opacity 0.01ms !important;
        transform: none !important;
      }
    }

    /* Screen reader only */
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
export class ResponsivePaymentPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  // Services
  private mobileDetectionService = inject(MobileDetectionService);
  private focusTrapService = inject(FocusTrapService);
  private translationService = inject(TranslationService);
  private productService = inject(ProductService);
  private location = inject(Location);
  private lotteryService = inject(LotteryService);
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);
  private realtimeService = inject(RealtimeService);

  // Inputs
  productId = input.required<string>();
  houseId = input<string | undefined>(undefined);
  houseTitle = input<string | undefined>(undefined);
  triggerButton = input<HTMLElement | undefined>(undefined);

  // Outputs
  closeEvent = output<void>();
  paymentSuccess = output<{ paymentIntentId?: string; chargeId?: string; transactionId?: string }>();

  // ViewChild
  @ViewChild('panelContainer') panelContainer!: ElementRef<HTMLElement>;
  
  // Panel dimensions signal for dynamic calculation
  private panelDimensions = signal<{ width: number; height: number }>({ width: PAYMENT_PANEL_CONFIG.DESKTOP_PANEL_WIDTH, height: 600 });

  // State signals
  isOpen = signal(false);
  currentStep = signal<PaymentStep>(PaymentStep.Quantity);
  flowState = signal<PaymentFlowState>({
    step: PaymentStep.Quantity,
    quantity: 1,
    totalAmount: 0,
    calculatedPrice: 0,
    currency: 'USD',
    paymentMethod: PaymentMethod.Stripe,
    productId: '',
    houseId: undefined,
    houseTitle: undefined,
    validationErrors: [],
    isLoading: false,
    isProcessing: false
  });
  successData = signal<PaymentSuccessEvent>({
    paymentIntentId: undefined,
    chargeId: undefined,
    transactionId: undefined,
    method: PaymentMethod.Stripe
  });

  // Internal state for button tracking
  private triggerButtonElement = signal<HTMLElement | null>(null);
  private buttonPosition = signal({ x: 0, y: 0, width: 0, height: 0 });

  // Expose enums and config to template
  PaymentStep = PaymentStep;
  PAYMENT_PANEL_CONFIG = PAYMENT_PANEL_CONFIG;

  // Computed properties
  isMobile = computed(() => this.mobileDetectionService.isMobile());
  
  buttonCenterX = computed(() => {
    if (!this.triggerButtonElement() || typeof window === 'undefined') {
      return window?.innerWidth ? window.innerWidth / 2 : 0;
    }
    const pos = this.buttonPosition();
    return pos.x || (window.innerWidth / 2);
  });

  buttonCenterY = computed(() => {
    if (!this.triggerButtonElement() || typeof window === 'undefined') {
      return window?.innerHeight ? window.innerHeight / 2 : 0;
    }
    const pos = this.buttonPosition();
    return pos.y || (window.innerHeight / 2);
  });

  transformOrigin = computed(() => {
    if (this.isMobile() || !this.triggerButtonElement()) {
      return 'center center';
    }
    
    const buttonPos = this.buttonPosition();
    if (buttonPos.x === 0 && buttonPos.y === 0) {
      return 'center center';
    }
    
    // Calculate transform origin relative to center (50%, 50%)
    // Button position relative to screen center
    if (typeof window === 'undefined') {
      return 'center center';
    }
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const offsetX = buttonPos.x - centerX;
    const offsetY = buttonPos.y - centerY;
    
    // Use dynamic panel dimensions instead of hardcoded values (CRITICAL-2 fix)
    const dimensions = this.panelDimensions();
    const panelWidth = dimensions.width || PAYMENT_PANEL_CONFIG.DESKTOP_PANEL_WIDTH;
    const panelHeight = dimensions.height || 600;
    const originX = 50 + (offsetX / panelWidth * 100);
    const originY = 50 + (offsetY / panelHeight * 100);
    
    return `${originX}% ${originY}%`;
  });

  // Browser back button handler
  private popStateHandler?: () => void;
  private resizeListener?: () => void;
  
  // HIGH-4: Webhook confirmation polling
  private webhookPollingInterval?: ReturnType<typeof setInterval>;
  private inventoryUpdateSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor() {
    // Effect to handle body scroll locking
    effect(() => {
      if (this.isOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Effect to recalculate on window resize
    effect(() => {
      if (this.isOpen() && !this.isMobile()) {
        this.setupResizeListener();
      } else {
        this.removeResizeListener();
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (this.isOpen() && this.triggerButtonElement()) {
      this.calculateButtonPosition(this.triggerButtonElement()!);
      // Update panel dimensions on resize (CRITICAL-2 fix)
      this.updatePanelDimensions();
    }
  }
  
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    // Recalculate button position on scroll (HIGH-3 fix)
    if (this.isOpen() && this.triggerButtonElement() && !this.isMobile()) {
      this.calculateButtonPosition(this.triggerButtonElement()!);
    }
  }

  private calculateButtonPosition(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    this.buttonPosition.set({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    });
  }

  private setupResizeListener() {
    if (this.resizeListener) return;
    
    this.resizeListener = () => {
      if (this.triggerButtonElement()) {
        this.calculateButtonPosition(this.triggerButtonElement()!);
      }
    };
    
    window.addEventListener('resize', this.resizeListener);
  }

  private removeResizeListener() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
    }
  }

  async ngOnInit() {
    // Initialize flow state
    const houseId = this.houseId();
    const houseTitle = this.houseTitle();
    
    this.flowState.update(state => ({
      ...state,
      productId: this.productId(),
      houseId: houseId,
      houseTitle: houseTitle
    }));

    // Load product to get currency
    try {
      const product = await firstValueFrom(this.productService.getProduct(this.productId()));
      this.flowState.update(state => ({
        ...state,
        currency: product.currency
      }));
    } catch (err) {
      console.error('Failed to load product:', err);
    }

    // Setup browser back button handling
    this.setupBrowserBackButton();
  }

  ngAfterViewInit() {
    if (this.isOpen()) {
      // Update panel dimensions after view init (CRITICAL-2 fix)
      this.updatePanelDimensions();
      
      // Wait for animation to complete before trapping focus
      setTimeout(() => {
        if (this.panelContainer) {
          this.focusTrapService.trapFocus(this.panelContainer.nativeElement);
          // Update dimensions again after animation
          this.updatePanelDimensions();
        }
      }, PAYMENT_PANEL_CONFIG.FOCUS_TRAP_DELAY);
    }
  }
  
  private updatePanelDimensions() {
    if (this.panelContainer?.nativeElement && !this.isMobile()) {
      const rect = this.panelContainer.nativeElement.getBoundingClientRect();
      this.panelDimensions.set({
        width: rect.width > 0 ? Math.round(rect.width) : PAYMENT_PANEL_CONFIG.DESKTOP_PANEL_WIDTH,
        height: rect.height > 0 ? Math.round(rect.height) : 600
      });
    }
  }

  ngOnDestroy() {
    // Cleanup destroy subject
    this.destroy$.next();
    this.destroy$.complete();
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Release focus trap
    this.focusTrapService.releaseFocus();

    // Cleanup browser back button handler
    if (this.popStateHandler) {
      window.removeEventListener('popstate', this.popStateHandler);
      this.popStateHandler = undefined;
    }

    // Cleanup resize listener
    this.removeResizeListener();
    
    // HIGH-4 & MEDIUM-3: Cleanup webhook polling and inventory subscription
    if (this.webhookPollingInterval) {
      clearInterval(this.webhookPollingInterval);
      this.webhookPollingInterval = undefined;
    }
    if (this.inventoryUpdateSubscription) {
      this.inventoryUpdateSubscription.unsubscribe();
      this.inventoryUpdateSubscription = undefined;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen() && !this.flowState().isProcessing && !this.flowState().isLoading) {
      this.close();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private setupBrowserBackButton() {
    // Prevent navigation when panel is open, close panel instead
    this.popStateHandler = () => {
      if (this.isOpen()) {
        this.close();
      }
    };
    
    // Listen for popstate events using window
    window.addEventListener('popstate', this.popStateHandler);
  }

  open(buttonElement?: HTMLElement) {
    // Prevent multiple instances
    if (this.isOpen()) {
      return;
    }

    // Reset state
    this.currentStep.set(PaymentStep.Quantity);
    this.flowState.update(state => ({
      ...state,
      step: PaymentStep.Quantity,
      quantity: 1,
      totalAmount: 0,
      calculatedPrice: 0,
      error: undefined,
      validationErrors: [],
      isLoading: false,
      isProcessing: false,
      paymentIntentId: undefined,
      chargeId: undefined,
      transactionId: undefined
    }));
    this.successData.set({
      paymentIntentId: undefined,
      chargeId: undefined,
      transactionId: undefined,
      method: PaymentMethod.Stripe
    });

    // Store button reference for position tracking
    const button = buttonElement || this.triggerButton();
    if (button) {
      this.triggerButtonElement.set(button);
      this.calculateButtonPosition(button);
    } else {
      // Fallback: use center if no button provided
      if (typeof window !== 'undefined') {
        this.buttonPosition.set({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          width: 0,
          height: 0
        });
      }
    }

    // Open panel
    this.isOpen.set(true);
    this.setupResizeListener();

    // Trap focus after animation completes and update dimensions (CRITICAL-2 fix)
    setTimeout(() => {
      if (this.panelContainer) {
        this.updatePanelDimensions();
        this.focusTrapService.trapFocus(this.panelContainer.nativeElement);
      }
    }, PAYMENT_PANEL_CONFIG.ANIMATION_DURATION); // Match CSS transition duration
  }

  close() {
    // CRITICAL-3: Cancel reservation if panel is closed before payment
    this.cancelReservationIfNeeded();

    // Release focus trap
    this.focusTrapService.releaseFocus();

    // Remove resize listener
    this.removeResizeListener();

    // Close panel (animation handled by CSS)
    this.isOpen.set(false);

    // Cleanup after animation
    setTimeout(() => {
      this.triggerButtonElement.set(null);
      this.buttonPosition.set({ x: 0, y: 0, width: 0, height: 0 });
    }, PAYMENT_PANEL_CONFIG.ANIMATION_DURATION);

    // Emit close event
    this.closeEvent.emit();
  }
  
  private async cancelReservationIfNeeded() {
    const reservationId = this.flowState().reservationId;
    const isProcessing = this.flowState().isProcessing;
    
    // Only cancel if reservation exists and payment hasn't completed
    if (reservationId && !isProcessing) {
      try {
        await firstValueFrom(this.reservationService.cancelReservation(reservationId));
        this.flowState.update(state => ({
          ...state,
          reservationId: undefined
        }));
      } catch (err) {
        console.error('Failed to cancel reservation:', err);
        // Don't block panel close on reservation cancellation failure
      }
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !this.flowState().isProcessing && !this.flowState().isLoading) {
      this.close();
    }
  }

  // Step Navigation
  goToStep(step: PaymentStep) {
    this.currentStep.set(step);
    this.flowState.update(state => ({
      ...state,
      step: step
    }));
  }

  // Step Event Handlers
  async onQuantitySelected(event: QuantitySelectedEvent) {
    this.flowState.update(state => ({
      ...state,
      quantity: event.quantity,
      calculatedPrice: event.calculatedPrice,
      totalAmount: event.calculatedPrice
    }));
    
    // CRITICAL-3: Create reservation before proceeding to review
    if (this.flowState().houseId) {
      try {
        this.flowState.update(s => ({ ...s, isLoading: true }));
        const reservation = await firstValueFrom(
          this.reservationService.createReservation(this.flowState().houseId!, {
            quantity: event.quantity
          })
        );
        this.flowState.update(state => ({
          ...state,
          reservationId: reservation.id,
          isLoading: false
        }));
      } catch (err: any) {
        console.error('Failed to create reservation:', err);
        this.flowState.update(s => ({ ...s, isLoading: false }));
        // Continue without reservation - backend should handle gracefully
        this.handleError(err?.message || this.translate('payment.reservation.failed'));
      }
    }
    
    this.goToStep(PaymentStep.Review);
  }

  onPaymentMethodSelected(event: PaymentMethodSelectedEvent) {
    this.flowState.update(state => ({
      ...state,
      paymentMethod: event.method
    }));
  }

  onPaymentIntentCreated(response: PaymentIntentResponse) {
    this.flowState.update(state => ({
      ...state,
      paymentIntentId: response.paymentIntentId
    }));
  }

  onCryptoChargeCreated(charge: CoinbaseChargeResponse) {
    this.flowState.update(state => ({
      ...state,
      chargeId: charge.chargeId
    }));
  }

  async onStripePaymentConfirmed(event: { paymentIntentId: string }) {
    this.flowState.update(state => ({
      ...state,
      paymentIntentId: event.paymentIntentId,
      isProcessing: true
    }));
    
    this.goToStep(PaymentStep.Processing);
    
    // Move to confirmation after brief processing state
    // In production, this would wait for webhook confirmation
    setTimeout(() => {
      this.successData.set({
        paymentIntentId: event.paymentIntentId,
        method: PaymentMethod.Stripe
      });
      this.goToStep(PaymentStep.Confirmation);
      this.flowState.update(state => ({
        ...state,
        isProcessing: false
      }));
    }, PAYMENT_PANEL_CONFIG.PROCESSING_STEP_DURATION);
  }

  async onCryptoPaymentConfirmed(event: { chargeId: string }) {
    this.flowState.update(state => ({
      ...state,
      chargeId: event.chargeId,
      isProcessing: true
    }));
    
    this.goToStep(PaymentStep.Processing);
    
    // Move to confirmation after brief processing state
    setTimeout(() => {
      this.successData.set({
        chargeId: event.chargeId,
        method: PaymentMethod.Crypto
      });
      this.goToStep(PaymentStep.Confirmation);
      this.flowState.update(state => ({
        ...state,
        isProcessing: false
      }));
    }, PAYMENT_PANEL_CONFIG.PROCESSING_STEP_DURATION);
  }

  handleError(error: string) {
    this.flowState.update(state => ({
      ...state,
      error: error,
      validationErrors: [...(state.validationErrors || []), error],
      isLoading: false,
      isProcessing: false
    }));
  }


  async handlePaymentSuccess() {
    const state = this.flowState();
    
    // CRITICAL: Create tickets after payment confirmation
    if (state.houseId) {
      try {
        this.flowState.update(s => ({ ...s, isLoading: true }));
        
        const result = await firstValueFrom(
          this.lotteryService.purchaseTicket({
            houseId: state.houseId,
            quantity: state.quantity,
            paymentMethodId: '00000000-0000-0000-0000-000000000000' // Default payment method (backend handles this)
          })
        );
        
        if (result && result.ticketsPurchased > 0) {
          this.toastService.success(
            this.translate('payment.success.ticketsCreated') || 
            `Successfully created ${result.ticketsPurchased} ticket(s)!`,
            5000
          );
        }
      } catch (err: any) {
        console.error('Ticket creation failed:', err);
        // Don't block payment success - tickets may be created via webhook
        this.toastService.warning(
          this.translate('payment.success.ticketsPending') ||
          'Payment successful. Tickets will be created shortly via webhook.',
          5000
        );
      } finally {
        this.flowState.update(s => ({ ...s, isLoading: false }));
      }
    }
    
    this.paymentSuccess.emit({
      paymentIntentId: state.paymentIntentId,
      chargeId: state.chargeId,
      transactionId: state.transactionId
    });
    this.close();
  }

  translate(key: string): string {
    const translation = this.translationService.translate(key);
    // Fallback to key if translation not found
    return translation || key;
  }
}

