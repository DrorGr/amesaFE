import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Observable, from, throwError, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  productId?: string;
  quantity?: number;
  idempotencyKey?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  requiresAction: boolean;
  nextAction?: {
    type: string;
    redirectToUrl?: string;
    useStripeSdk?: boolean;
  };
  expiresAt?: Date;
}

export interface PaymentIntentStatus {
  id: string;
  status: string;
  clientSecret: string;
  amount: number;
  currency: string;
  requiresAction: boolean;
  nextAction?: {
    type: string;
    redirectToUrl?: string;
    useStripeSdk?: boolean;
  };
  expiresAt?: Date;
}

export interface ConfirmPaymentIntentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Promise<Stripe | null>;
  private publishableKey: string | null = null;
  private publishableKeyPromise: Promise<string> | null = null;
  private elements: StripeElements | null = null;

  constructor(private apiService: ApiService) {
    // Load publishable key from backend
    this.publishableKeyPromise = this.loadPublishableKey();
    this.stripe = this.publishableKeyPromise.then(key => loadStripe(key));
  }

  private async loadPublishableKey(): Promise<string> {
    if (this.publishableKey) {
      return this.publishableKey;
    }

    try {
      const response = await firstValueFrom(this.apiService.get<{ publishableKey: string }>('payments/stripe/publishable-key'));
      if (response?.success && response.data?.publishableKey) {
        const key = response.data.publishableKey;
        this.publishableKey = key;
        return key;
      }
      throw new Error('Failed to load Stripe publishable key from backend');
    } catch (error) {
      console.error('Error loading Stripe publishable key:', error);
      throw new Error('Failed to initialize Stripe: publishable key not available');
    }
  }

  async createPaymentElement(containerId: string, clientSecret: string): Promise<StripePaymentElement | null> {
    const stripe = await this.stripe;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    if (!clientSecret) {
      throw new Error('Client secret is required to create payment element');
    }

    // Create elements instance with client secret
    this.elements = stripe.elements({
      clientSecret: clientSecret,
      appearance: {
        theme: 'stripe'
      }
    });

    // Use type assertion to work around Stripe type definitions
    // The 'payment' element type is valid but not in the type definitions
    const createElement = this.elements.create as any;
    const paymentElement = createElement('payment', {
      layout: 'tabs'
    }) as StripePaymentElement;

    // Wait for the container element to exist
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Payment element container #${containerId} not found`);
    }

    // Clear any existing content in the container
    // This prevents the "contains child nodes" warning and ensures clean mounting
    container.innerHTML = '';
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mount the payment element
    try {
      paymentElement.mount(`#${containerId}`);
      
      // Wait a bit to ensure the element is fully mounted and initialized
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return paymentElement;
    } catch (error: any) {
      console.error('Error mounting Stripe Payment Element:', error);
      throw new Error(`Failed to mount payment element: ${error.message || 'Unknown error'}`);
    }
  }

  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.apiService.post<PaymentIntentResponse>('payments/stripe/create-payment-intent', request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        // Check if it's a rate limit error
        if (response.error?.code === 'RATE_LIMIT_EXCEEDED') {
          const err: any = new Error(response.error.message || 'Too many payment requests');
          err.status = 429;
          err.error = response.error;
          throw err;
        }
        throw new Error(response.error?.message || 'Failed to create payment intent');
      }),
      catchError(error => {
        // Preserve rate limit errors
        if (error.status === 429 || error.error?.code === 'RATE_LIMIT_EXCEEDED') {
          return throwError(() => error);
        }
        console.error('Error creating payment intent:', error);
        return throwError(() => error);
      })
    );
  }

  confirmPaymentIntent(request: ConfirmPaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.apiService.post<PaymentIntentResponse>('payments/stripe/confirm-payment-intent', request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        if (response.error?.code === 'RATE_LIMIT_EXCEEDED') {
          const err: any = new Error(response.error.message || 'Too many payment requests');
          err.status = 429;
          err.error = response.error;
          throw err;
        }
        throw new Error(response.error?.message || 'Failed to confirm payment intent');
      }),
      catchError(error => {
        if (error.status === 429 || error.error?.code === 'RATE_LIMIT_EXCEEDED') {
          return throwError(() => error);
        }
        console.error('Error confirming payment intent:', error);
        return throwError(() => error);
      })
    );
  }

  async confirmPayment(clientSecret: string): Promise<{ 
    success: boolean; 
    error?: string; 
    requiresAction?: boolean;
    nextAction?: { type: string; redirectToUrl?: string };
    paymentIntentId?: string;
  }> {
    const stripe = await this.stripe;
    if (!stripe) {
      return { success: false, error: 'Stripe failed to load' };
    }

    if (!this.elements) {
      return { success: false, error: 'Payment element not created. Please wait for payment form to load.' };
    }

    try {
      // CRITICAL: Submit elements first to validate and collect payment method
      // This must be called before confirmPayment() according to Stripe's API
      const { error: submitError } = await this.elements.submit();
      
      if (submitError) {
        console.error('Stripe elements.submit() error:', submitError);
        return { success: false, error: submitError.message || 'Please check your payment details' };
      }

      // Now confirm the payment after successful submission
      // HIGH-5: Use current URL as return URL for 3DS redirects
      const returnUrl = window.location.href.split('?')[0]; // Remove query params
      const result = await stripe.confirmPayment({
        elements: this.elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl
        },
        redirect: 'if_required' // Only redirect if 3D Secure or similar is required
      });

      if (result.error) {
        console.error('Stripe confirmPayment error:', result.error);
        
        // Handle specific error types
        if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
          return { 
            success: false, 
            error: result.error.message || 'Payment failed. Please check your payment details.' 
          };
        }
        
        return { success: false, error: result.error.message || 'Payment failed' };
      }

      // Check if payment requires additional action (3DS)
      if (result.paymentIntent?.status === 'requires_action') {
        return {
          success: true,
          requiresAction: true,
          nextAction: {
            type: 'redirect',
            redirectToUrl: result.paymentIntent.next_action?.redirect_to_url?.url || undefined
          },
          paymentIntentId: result.paymentIntent.id
        };
      }

      // Payment succeeded
      return { 
        success: true,
        paymentIntentId: result.paymentIntent?.id
      };
    } catch (error: unknown) {
      const err = error as { message?: string; type?: string };
      console.error('Error confirming payment:', error);
      
      // Handle specific error types
      if (err.type === 'StripeCardError') {
        return { success: false, error: err.message || 'Card payment failed. Please check your card details.' };
      }
      
      return { success: false, error: err.message || 'Payment failed. Please ensure the payment form is fully loaded.' };
    }
  }

  getPaymentIntentStatus(paymentIntentId: string): Observable<PaymentIntentStatus> {
    return this.apiService.get<PaymentIntentStatus>(`payments/stripe/payment-intent/${paymentIntentId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to get payment intent status');
      }),
      catchError(error => {
        console.error('Error getting payment intent status:', error);
        return throwError(() => error);
      })
    );
  }

  isPaymentIntentExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  }

  getTimeUntilExpiry(expiresAt?: Date): number | null {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = expiry - now;
    return remaining > 0 ? remaining : 0;
  }

  async isGooglePayAvailable(): Promise<boolean> {
    const stripe = await this.stripe;
    if (!stripe) return false;
    return stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { amount: 0, label: 'Test' }
    }).canMakePayment().then(result => result !== null);
  }

  async isApplePayAvailable(): Promise<boolean> {
    // Apple Pay detection is handled by Stripe Elements automatically
    return false; // Simplified - Stripe handles this
  }
}

