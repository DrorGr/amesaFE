import { Injectable, signal, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { RetryService } from './retry.service';

export interface Reservation {
  id: string;
  houseId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  paymentMethodId?: string;
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'failed' | 'cancelled';
  reservationToken: string;
  expiresAt: Date;
  processedAt?: Date;
  paymentTransactionId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservationRequest {
  quantity: number;
  paymentMethodId?: string;
}

export interface InventoryStatus {
  houseId: string;
  totalTickets: number;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  lotteryEndDate: Date;
  timeRemaining: number; // milliseconds
  isSoldOut: boolean;
  isEnded: boolean;
}

export interface InventoryUpdate {
  houseId: string;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  isSoldOut: boolean;
  updatedAt: Date;
}

export interface CountdownUpdate {
  houseId: string;
  timeRemaining: number; // milliseconds
  isEnded: boolean;
  lotteryEndDate: Date;
}

export interface ReservationStatusUpdate {
  reservationId: string;
  status: string;
  errorMessage?: string;
  processedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private reservations = signal<Reservation[]>([]);
  private inventoryCache = new Map<string, { data: InventoryStatus; timestamp: number }>();
  private readonly INVENTORY_CACHE_TTL = 2000; // 2 seconds for real-time updates

  private retryService = inject(RetryService);

  constructor(private apiService: ApiService) {}

  /**
   * Get all reservations for the current user
   */
  getUserReservations(status?: string): Observable<Reservation[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    return this.apiService.get<ApiResponse<Reservation[]>>('/reservations', params).pipe(
      map(response => {
        if (response.success && response.data && Array.isArray(response.data)) {
          const reservations = response.data.map((r: Reservation) => this.mapReservation(r));
          this.reservations.set(reservations);
          return reservations;
        }
        throw new Error(response.error?.message || 'Failed to load reservations');
      }),
      catchError(error => {
        console.error('Error loading reservations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single reservation by ID
   */
  getReservation(id: string): Observable<Reservation> {
    return this.apiService.get<ApiResponse<Reservation>>(`/reservations/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapReservation(response.data);
        }
        throw new Error(response.error?.message || 'Reservation not found');
      }),
      catchError(error => {
        console.error('Error loading reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new reservation
   */
  createReservation(houseId: string, request: CreateReservationRequest): Observable<Reservation> {
    return this.apiService.post<ApiResponse<Reservation>>(
      `/reservations?houseId=${houseId}`,
      request
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const reservation = this.mapReservation(response.data);
          // Add to local state
          this.reservations.update(reservations => [...reservations, reservation]);
          return reservation;
        }
        throw new Error(response.error?.message || 'Failed to create reservation');
      }),
      catchError(error => {
        console.error('Error creating reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reserve tickets (convenience method that creates reservation)
   */
  reserveTickets(houseId: string, request: CreateReservationRequest): Observable<Reservation> {
    return this.createReservation(houseId, request);
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(id: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(`/reservations/${id}`).pipe(
      map(response => {
        if (response.success) {
          // Remove from local state
          this.reservations.update(reservations => 
            reservations.filter(r => r.id !== id)
          );
          return;
        }
        throw new Error(response.error?.message || 'Failed to cancel reservation');
      }),
      catchError(error => {
        console.error('Error cancelling reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory status for a house
   */
  getInventoryStatus(houseId: string, useCache: boolean = true): Observable<InventoryStatus> {
    // Check cache
    if (useCache) {
      const cached = this.inventoryCache.get(houseId);
      if (cached && Date.now() - cached.timestamp < this.INVENTORY_CACHE_TTL) {
        return new Observable(observer => {
          observer.next(cached.data);
          observer.complete();
        });
      }
    }

    return this.apiService.get<InventoryStatus>(`/houses/${houseId}/inventory`).pipe(
      map((response: ApiResponse<InventoryStatus>) => {
        if (response.success && response.data) {
          const data = response.data as InventoryStatus;
          const inventory: InventoryStatus = {
            ...data,
            houseId: data.houseId || houseId,
            lotteryEndDate: data.lotteryEndDate ? new Date(data.lotteryEndDate) : new Date()
          };
          
          // Cache result
          this.inventoryCache.set(houseId, {
            data: inventory,
            timestamp: Date.now()
          });
          
          return inventory;
        }
        throw new Error(response.error?.message || 'Failed to load inventory');
      }),
      catchError(error => {
        console.error('Error loading inventory:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current reservations signal
   */
  getReservations() {
    return this.reservations.asReadonly();
  }

  /**
   * Clear inventory cache
   */
  clearInventoryCache(houseId?: string): void {
    if (houseId) {
      this.inventoryCache.delete(houseId);
    } else {
      this.inventoryCache.clear();
    }
  }

  /**
   * Map API response to Reservation model
   */
  private mapReservation(data: any): Reservation {
    return {
      id: data.id,
      houseId: data.houseId,
      userId: data.userId,
      quantity: data.quantity,
      totalPrice: data.totalPrice,
      paymentMethodId: data.paymentMethodId,
      status: data.status,
      reservationToken: data.reservationToken,
      expiresAt: new Date(data.expiresAt),
      processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
      paymentTransactionId: data.paymentTransactionId,
      errorMessage: data.errorMessage,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}




