import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Observable, from, throwError } from 'rxjs';
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
  private publishableKey = 'pk_test_YOUR_KEY'; // Load from environment
  private elements: StripeElements | null = null;

  constructor(private apiService: ApiService) {
    // Load Stripe.js
    this.stripe = loadStripe(this.publishableKey);
  }

  async createPaymentElement(containerId: string): Promise<StripePaymentElement | null> {
    const stripe = await this.stripe;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    this.elements = stripe.elements({
      appearance: {
        theme: 'stripe'
      }
    });

    // Use type assertion to work around Stripe type definitions
    // The 'payment' element type is valid but not in the type definitions
    const createElement = this.elements.create as any;
    const paymentElement = createElement('payment', {
      layout: 'tabs',
      paymentMethodTypes: ['card', 'link'],
      wallets: {
        applePay: 'auto',
        googlePay: 'auto'
      }
    }) as StripePaymentElement;

    paymentElement.mount(`#${containerId}`);
    return paymentElement;
  }

  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.apiService.post<PaymentIntentResponse>('payments/stripe/create-payment-intent', request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create payment intent');
      }),
      catchError(error => {
        console.error('Error creating payment intent:', error);
        return throwError(() => error);
      })
    );
  }

  async confirmPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
    const stripe = await this.stripe;
    if (!stripe || !this.elements) {
      return { success: false, error: 'Stripe failed to load or payment element not created' };
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements: this.elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return { success: false, error: err.message || 'Payment failed' };
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

