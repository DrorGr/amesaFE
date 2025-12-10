/**
 * Payment Flow Interfaces and Enums
 * Used by ResponsivePaymentPanelComponent and related payment components
 */

/**
 * Payment flow step enumeration
 */
export enum PaymentStep {
  Quantity = 'quantity',
  Review = 'review',
  Payment = 'payment',
  Processing = 'processing',
  Confirmation = 'confirmation'
}

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
  Stripe = 'stripe',
  Crypto = 'crypto'
}

/**
 * Payment flow state interface
 */
export interface PaymentFlowState {
  step: PaymentStep;
  quantity: number;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  productId: string;
  houseId?: string;
  houseTitle?: string;
  calculatedPrice?: number;
  reservationId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  transactionId?: string;
  error?: string;
  validationErrors: string[];
  isLoading: boolean;
  isProcessing: boolean;
}

/**
 * Step navigation event
 */
export interface StepNavigationEvent {
  from: PaymentStep;
  to: PaymentStep;
  data?: any;
}

/**
 * Quantity selection event
 */
export interface QuantitySelectedEvent {
  quantity: number;
  calculatedPrice: number;
}

/**
 * Payment method selection event
 */
export interface PaymentMethodSelectedEvent {
  method: PaymentMethod;
}

/**
 * Payment success event
 */
export interface PaymentSuccessEvent {
  paymentIntentId?: string;
  chargeId?: string;
  transactionId?: string;
  method: PaymentMethod;
}





