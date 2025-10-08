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
    return this.apiService.get<PaymentMethodDto[]>('payments/methods').pipe(
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
    return this.apiService.post<PaymentMethodDto>('payments/methods', paymentMethodData).pipe(
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
    return this.apiService.put<PaymentMethodDto>(`payments/methods/${paymentMethodId}`, updateData).pipe(
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
    return this.apiService.delete(`payments/methods/${paymentMethodId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting payment method:', error);
        return throwError(() => error);
      })
    );
  }

  // Transaction Management
  getTransactions(): Observable<TransactionDto[]> {
    return this.apiService.get<TransactionDto[]>('payments/transactions').pipe(
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
    return this.apiService.get<TransactionDto>(`payments/transactions/${transactionId}`).pipe(
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
    return this.apiService.post<PaymentResponse>('payments/process', paymentData).pipe(
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
    return this.apiService.post<PaymentResponse>('payments/refund', refundData).pipe(
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
    return this.apiService.post<PaymentResponse>('payments/withdraw', withdrawalData).pipe(
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
}
