import { Injectable } from '@angular/core';
import { Observable, interval, throwError } from 'rxjs';
import { map, catchError, switchMap, takeWhile, take } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface CreateCryptoChargeRequest {
  productId: string;
  quantity: number;
  idempotencyKey?: string;
}

export interface CoinbaseChargeResponse {
  chargeId: string;
  code: string;
  hostedUrl: string;
  status: string;
  expiresAt: Date;
  payments: CoinbasePayment[];
  pricing: CoinbasePricing;
}

export interface CoinbasePayment {
  network: string;
  transactionId: string;
  status: string;
  value: CoinbaseValue;
  block: CoinbaseValue;
}

export interface CoinbasePricing {
  local: CoinbaseValue;
  bitcoin: CoinbaseValue;
  ethereum: CoinbaseValue;
  usdc?: CoinbaseValue;
  usdt?: CoinbaseValue;
  dai?: CoinbaseValue;
}

export interface CoinbaseValue {
  amount: number;
  currency: string;
}

export interface SupportedCrypto {
  code: string;
  name: string;
  isStablecoin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoPaymentService {
  constructor(private apiService: ApiService) {}

  createCharge(request: CreateCryptoChargeRequest): Observable<CoinbaseChargeResponse> {
    return this.apiService.post<CoinbaseChargeResponse>('payments/crypto/create-charge', request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create crypto charge');
      }),
      catchError(error => {
        console.error('Error creating crypto charge:', error);
        return throwError(() => error);
      })
    );
  }

  getCharge(chargeId: string): Observable<CoinbaseChargeResponse> {
    return this.apiService.get<CoinbaseChargeResponse>(`payments/crypto/charge/${chargeId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to get charge');
      }),
      catchError(error => {
        console.error('Error getting charge:', error);
        return throwError(() => error);
      })
    );
  }

  getSupportedCryptocurrencies(): Observable<SupportedCrypto[]> {
    return this.apiService.get<SupportedCrypto[]>('payments/crypto/supported-cryptocurrencies').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to get supported cryptocurrencies');
      }),
      catchError(error => {
        console.error('Error getting supported cryptocurrencies:', error);
        return throwError(() => error);
      })
    );
  }

  pollChargeStatus(chargeId: string, maxAttempts: number = 60): Observable<CoinbaseChargeResponse> {
    return interval(5000).pipe(
      switchMap(() => this.getCharge(chargeId)),
      takeWhile(charge => charge.status === 'NEW' || charge.status === 'PENDING', true),
      take(maxAttempts),
      catchError(error => {
        console.error('Error polling charge status:', error);
        return throwError(() => error);
      })
    );
  }
}






