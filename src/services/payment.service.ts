import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface PaymentMethodDto {
  id: string;
  type: string;
  provider?: string;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface TransactionDto {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  referenceId?: string;
  providerTransactionId?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface AddPaymentMethodRequest {
  type: string;
  provider?: string;
  cardNumber?: string;
  expMonth?: number;
  expYear?: number;
  cvv?: string;
  cardholderName?: string;
  isDefault: boolean;
}

export interface UpdatePaymentMethodRequest {
  provider?: string;
  expMonth?: number;
  expYear?: number;
  cardholderName?: string;
  isDefault?: boolean;
}

export interface ProcessPaymentRequest {
  paymentMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  idempotencyKey?: string;
  productId?: string;
  quantity?: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  providerTransactionId?: string;
  message?: string;
  errorCode?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface WithdrawalRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private apiService: ApiService) {}

  // Payment Method Management
  getPaymentMethods(): Observable<PaymentMethodDto[]> {
    return this.apiService.get<PaymentMethodDto[]>('payment/methods').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch payment methods');
      }),
      catchError(error => {
        console.error('Error fetching payment methods:', error);
        return throwError(() => error);
      })
    );
  }

  addPaymentMethod(paymentMethodData: AddPaymentMethodRequest): Observable<PaymentMethodDto> {
    return this.apiService.post<PaymentMethodDto>('payment/methods', paymentMethodData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to add payment method');
      }),
      catchError(error => {
        console.error('Error adding payment method:', error);
        return throwError(() => error);
      })
    );
  }

  updatePaymentMethod(paymentMethodId: string, updateData: UpdatePaymentMethodRequest): Observable<PaymentMethodDto> {
    return this.apiService.put<PaymentMethodDto>(`payment/methods/${paymentMethodId}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update payment method');
      }),
      catchError(error => {
        console.error('Error updating payment method:', error);
        return throwError(() => error);
      })
    );
  }

  deletePaymentMethod(paymentMethodId: string): Observable<boolean> {
    return this.apiService.delete(`payment/methods/${paymentMethodId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting payment method:', error);
        return throwError(() => error);
      })
    );
  }

  // Transaction Management
  getTransactions(): Observable<TransactionDto[]> {
    return this.apiService.get<TransactionDto[]>('payment/transactions').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch transactions');
      }),
      catchError(error => {
        console.error('Error fetching transactions:', error);
        return throwError(() => error);
      })
    );
  }

  getTransaction(transactionId: string): Observable<TransactionDto> {
    return this.apiService.get<TransactionDto>(`payment/transactions/${transactionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch transaction');
      }),
      catchError(error => {
        console.error('Error fetching transaction:', error);
        return throwError(() => error);
      })
    );
  }

  // Payment Processing
  processPayment(paymentData: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/process', paymentData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to process payment');
      }),
      catchError(error => {
        console.error('Error processing payment:', error);
        return throwError(() => error);
      })
    );
  }

  // Refunds
  requestRefund(refundData: RefundRequest): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/refund', refundData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to process refund');
      }),
      catchError(error => {
        console.error('Error processing refund:', error);
        return throwError(() => error);
      })
    );
  }

  // Withdrawals
  requestWithdrawal(withdrawalData: WithdrawalRequest): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/withdraw', withdrawalData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to process withdrawal');
      }),
      catchError(error => {
        console.error('Error processing withdrawal:', error);
        return throwError(() => error);
      })
    );
  }

  // Idempotency key generation
  generateIdempotencyKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    // Use crypto.randomUUID if available for better uniqueness, otherwise fallback
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${timestamp}-${random}-${Math.random().toString(36).substring(2, 9)}`;
    // Ensure max length of 255 characters (common backend limit)
    return uuid.substring(0, 255);
  }

  // Product payment processing
  processProductPayment(productId: string, quantity: number, paymentMethodId?: string, idempotencyKey?: string): Observable<PaymentResponse> {
    const request: ProcessPaymentRequest = {
      paymentMethodId: paymentMethodId || '',
      amount: 0, // Will be calculated server-side
      currency: 'USD',
      productId,
      quantity,
      idempotencyKey: idempotencyKey || this.generateIdempotencyKey()
    };
    return this.processPayment(request);
  }

  // Get product price (server-side)
  getProductPrice(productId: string, quantity: number = 1): Observable<number> {
    return this.apiService.post<{ calculatedPrice: number }>(`products/${productId}/validate`, { productId, quantity }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.calculatedPrice;
        }
        throw new Error('Failed to get product price');
      }),
      catchError(error => {
        console.error('Error getting product price:', error);
        return throwError(() => error);
      })
    );
  }

  // Payment Intent Management
  /**
   * Creates a payment intent for deferred payment processing
   * POST /api/v1/payment/intent
   */
  createPaymentIntent(paymentData: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/intent', paymentData).pipe(
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

  /**
   * Confirms a payment intent
   * POST /api/v1/payment/confirm
   */
  confirmPayment(intentId: string, paymentMethodId?: string): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/confirm', { 
      intentId, 
      paymentMethodId 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to confirm payment');
      }),
      catchError(error => {
        console.error('Error confirming payment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancels a payment intent
   * POST /api/v1/payment/cancel
   */
  cancelPayment(intentId: string): Observable<PaymentResponse> {
    return this.apiService.post<PaymentResponse>('payment/cancel', { intentId }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to cancel payment');
      }),
      catchError(error => {
        console.error('Error canceling payment:', error);
        return throwError(() => error);
      })
    );
  }
}
