import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface LotteryResult {
  id: string;
  lotteryId: string;
  drawId: string;
  winnerTicketNumber: string;
  winnerUserId: string;
  prizePosition: number;
  prizeType: string;
  prizeValue: number;
  prizeDescription: string;
  qrCodeData: string;
  qrCodeImageUrl?: string;
  isVerified: boolean;
  isClaimed: boolean;
  claimedAt?: string;
  resultDate: string;
  houseTitle?: string;
  houseAddress?: string;
  winnerName?: string;
  winnerEmail?: string;
}

export interface LotteryResultsPage {
  results: LotteryResult[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LotteryResultsFilter {
  fromDate?: string;
  toDate?: string;
  address?: string;
  city?: string;
  country?: string;
  prizePosition?: number;
  prizeType?: string;
  isClaimed?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface QRCodeValidation {
  isValid: boolean;
  isWinner: boolean;
  prizePosition?: number;
  prizeType?: string;
  prizeValue?: number;
  prizeDescription?: string;
  isClaimed: boolean;
  message?: string;
  result?: LotteryResult;
}

export interface PrizeDelivery {
  id: string;
  lotteryResultId: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  deliveryMethod: string;
  trackingNumber?: string;
  deliveryStatus: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingCost: number;
  deliveryNotes?: string;
}

export interface CreatePrizeDeliveryRequest {
  lotteryResultId: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  deliveryMethod: string;
  deliveryNotes?: string;
}

export interface ScratchCardResult {
  id: string;
  userId: string;
  cardType: string;
  cardNumber: string;
  isWinner: boolean;
  prizeType?: string;
  prizeValue: number;
  prizeDescription?: string;
  cardImageUrl: string;
  scratchedImageUrl?: string;
  isScratched: boolean;
  scratchedAt?: string;
  isClaimed: boolean;
  claimedAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class LotteryResultsService {
  // Signals for reactive state management
  private _results = signal<LotteryResult[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _currentFilter = signal<LotteryResultsFilter>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'resultDate',
    sortDirection: 'desc'
  });

  // Computed signals
  public results = this._results.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public currentFilter = this._currentFilter.asReadonly();

  // Computed properties
  public totalResults = computed(() => this._results().length);
  public recentResults = computed(() => 
    this._results()
      .filter(result => new Date(result.resultDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .slice(0, 5)
  );

  public winnersByPosition = computed(() => {
    const results = this._results();
    return {
      first: results.filter(r => r.prizePosition === 1).length,
      second: results.filter(r => r.prizePosition === 2).length,
      third: results.filter(r => r.prizePosition === 3).length
    };
  });

  constructor(private apiService: ApiService, private http: HttpClient) {}

  /**
   * Get lottery results with filtering and pagination
   */
  getLotteryResults(filter?: Partial<LotteryResultsFilter>): Observable<LotteryResultsPage> {
    this._loading.set(true);
    this._error.set(null);

    const currentFilter = { ...this._currentFilter(), ...filter };
    this._currentFilter.set(currentFilter);

    const params: any = {};
    if (currentFilter.fromDate) params.fromDate = currentFilter.fromDate;
    if (currentFilter.toDate) params.toDate = currentFilter.toDate;
    if (currentFilter.address) params.address = currentFilter.address;
    if (currentFilter.city) params.city = currentFilter.city;
    if (currentFilter.country) params.country = currentFilter.country;
    if (currentFilter.prizePosition) params.prizePosition = currentFilter.prizePosition;
    if (currentFilter.prizeType) params.prizeType = currentFilter.prizeType;
    if (currentFilter.isClaimed !== undefined) params.isClaimed = currentFilter.isClaimed;
    params.pageNumber = currentFilter.pageNumber || 1;
    params.pageSize = currentFilter.pageSize || 10;
    params.sortBy = currentFilter.sortBy || 'resultDate';
    params.sortDirection = currentFilter.sortDirection || 'desc';

    return this.http.get<any>(`${this.apiService.getBaseUrl()}/lotteryresults`, { params }).pipe(
      map(response => {
        if (response.success) {
          this._results.set(response.data.results);
          this._loading.set(false);
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch lottery results');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to fetch lottery results');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Get specific lottery result by ID
   */
  getLotteryResult(id: string): Observable<LotteryResult> {
    return this.http.get<any>(`${this.apiService.getBaseUrl()}/lotteryresults/${id}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch lottery result');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to fetch lottery result');
        throw error;
      })
    );
  }

  /**
   * Validate QR code
   */
  validateQRCode(qrCodeData: string): Observable<QRCodeValidation> {
    return this.http.post<any>(`${this.apiService.getBaseUrl()}/lotteryresults/validate-qr`, qrCodeData).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to validate QR code');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to validate QR code');
        throw error;
      })
    );
  }

  /**
   * Claim a prize
   */
  claimPrize(resultId: string, claimNotes?: string): Observable<LotteryResult> {
    return this.http.post<any>(`${this.apiService.getBaseUrl()}/lotteryresults/claim`, {
      resultId,
      claimNotes
    }).pipe(
      map(response => {
        if (response.success) {
          // Update local results
          const currentResults = this._results();
          const updatedResults = currentResults.map(result => 
            result.id === resultId 
              ? { ...result, isClaimed: true, claimedAt: new Date().toISOString() }
              : result
          );
          this._results.set(updatedResults);
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to claim prize');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to claim prize');
        throw error;
      })
    );
  }

  /**
   * Create prize delivery request
   */
  createPrizeDelivery(request: CreatePrizeDeliveryRequest): Observable<PrizeDelivery> {
    return this.http.post<any>(`${this.apiService.getBaseUrl()}/lotteryresults/delivery`, request).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create prize delivery');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to create prize delivery');
        throw error;
      })
    );
  }

  /**
   * Get scratch card results for user
   */
  getScratchCards(userId: string): Observable<ScratchCardResult[]> {
    return this.http.get<any>(`${this.apiService.getBaseUrl()}/scratchcards?userId=${userId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch scratch cards');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to fetch scratch cards');
        throw error;
      })
    );
  }

  /**
   * Scratch a card
   */
  scratchCard(cardId: string): Observable<ScratchCardResult> {
    return this.http.post<any>(`${this.apiService.getBaseUrl()}/scratchcards/${cardId}/scratch`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to scratch card');
        }
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to scratch card');
        throw error;
      })
    );
  }

  /**
   * Update filter and refresh results
   */
  updateFilter(filter: Partial<LotteryResultsFilter>): void {
    const newFilter = { ...this._currentFilter(), ...filter };
    this._currentFilter.set(newFilter);
    this.getLotteryResults(newFilter).subscribe();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Get prize position text
   */
  getPrizePositionText(position: number): string {
    switch (position) {
      case 1: return '1st Place';
      case 2: return '2nd Place';
      case 3: return '3rd Place';
      default: return `${position}th Place`;
    }
  }

  /**
   * Get prize position color class
   */
  getPrizePositionColor(position: number): string {
    switch (position) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
