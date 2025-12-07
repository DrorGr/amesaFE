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
  nextAction?: string;
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
        this.publishableKey = response.data.publishableKey;
        return this.publishableKey;
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

  async confirmPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
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
      const { error } = await stripe.confirmPayment({
        elements: this.elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`
        },
        redirect: 'if_required' // Only redirect if 3D Secure or similar is required
      });

      if (error) {
        console.error('Stripe confirmPayment error:', error);
        return { success: false, error: error.message || 'Payment failed' };
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error confirming payment:', error);
      return { success: false, error: err.message || 'Payment failed. Please ensure the payment form is fully loaded.' };
    }
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

