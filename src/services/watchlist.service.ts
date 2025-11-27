import { Injectable, signal, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { RetryService } from './retry.service';
import {
  WatchlistItem,
  AddToWatchlistRequest,
  ToggleNotificationRequest
} from '../interfaces/watchlist.interface';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private watchlist = signal<WatchlistItem[]>([]);
  private watchlistCount = signal<number>(0);
  private retryService = inject(RetryService);

  constructor(private apiService: ApiService) {
    // Load watchlist count on initialization
    this.loadWatchlistCount();
  }

  /**
   * Get user's watchlist
   */
  getWatchlist(): Observable<WatchlistItem[]> {
    return this.retryService.retryOnNetworkError(
      this.apiService.get<WatchlistItem[]>('/watchlist').pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error('Failed to fetch watchlist');
        })
      )
    ).pipe(
      tap(items => {
        this.watchlist.set(items);
        this.watchlistCount.set(items.length);
      }),
      catchError(error => {
        console.error('Error fetching watchlist:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get watchlist as signal (reactive)
   */
  getWatchlistSignal() {
    return this.watchlist.asReadonly();
  }

  /**
   * Add house to watchlist
   */
  addToWatchlist(houseId: string, notificationEnabled: boolean = true): Observable<WatchlistItem> {
    const request: AddToWatchlistRequest = { notificationEnabled };
    return this.apiService.post<WatchlistItem>(`/watchlist/${houseId}`, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to add to watchlist');
      }),
      tap(item => {
        const current = this.watchlist();
        this.watchlist.set([...current, item]);
        this.watchlistCount.set(this.watchlist().length);
      }),
      catchError(error => {
        console.error('Error adding to watchlist:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove house from watchlist
   */
  removeFromWatchlist(houseId: string): Observable<void> {
    return this.apiService.delete<void>(`/watchlist/${houseId}`).pipe(
      map((response) => {
        // ApiResponse<void> doesn't have data, just return void
        if (response.success) {
          return undefined as void;
        }
        throw new Error('Failed to remove from watchlist');
      }),
      tap(() => {
        const current = this.watchlist();
        this.watchlist.set(current.filter(item => item.houseId !== houseId));
        this.watchlistCount.set(this.watchlist().length);
      }),
      catchError(error => {
        console.error('Error removing from watchlist:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle notification for watchlist item
   */
  toggleNotification(houseId: string, enabled: boolean): Observable<void> {
    const request: ToggleNotificationRequest = { enabled };
    return this.apiService.put<void>(`/watchlist/${houseId}/notification`, request).pipe(
      map((response) => {
        // ApiResponse<void> doesn't have data, just return void
        if (response.success) {
          return undefined as void;
        }
        throw new Error('Failed to toggle notification');
      }),
      tap(() => {
        const current = this.watchlist();
        this.watchlist.set(
          current.map(item =>
            item.houseId === houseId
              ? { ...item, notificationEnabled: enabled }
              : item
          )
        );
      }),
      catchError(error => {
        console.error('Error toggling notification:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get watchlist count
   */
  getWatchlistCount(): Observable<number> {
    return this.apiService.get<number>('/watchlist/count').pipe(
      map(response => {
        if (response.success && response.data !== undefined) {
          return response.data;
        }
        throw new Error('Failed to fetch watchlist count');
      }),
      tap(count => {
        this.watchlistCount.set(count);
      }),
      catchError(error => {
        console.error('Error fetching watchlist count:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get watchlist count as signal (reactive)
   */
  getWatchlistCountSignal() {
    return this.watchlistCount.asReadonly();
  }

  /**
   * Check if house is in watchlist
   */
  isInWatchlist(houseId: string): Observable<boolean> {
    return this.getWatchlist().pipe(
      map(items => items.some(item => item.houseId === houseId)),
      catchError(() => {
        // If error, assume not in watchlist
        return new Observable<boolean>(observer => {
          observer.next(false);
          observer.complete();
        });
      })
    );
  }

  /**
   * Load watchlist count (internal)
   */
  private loadWatchlistCount(): void {
    this.getWatchlistCount().subscribe({
      error: (error) => {
        // Silently fail for 401/403 (not authenticated) and 503 (service unavailable)
        // Only log other errors
        if (error.status !== 401 && error.status !== 403 && error.status !== 503) {
          console.warn('Unexpected error loading watchlist count:', error.status, error.statusText);
        }
        // Silently fail - user might not be authenticated or service might be down
      }
    });
  }

  /**
   * Refresh watchlist
   */
  refreshWatchlist(): void {
    this.getWatchlist().subscribe({
      error: error => {
        console.error('Error refreshing watchlist:', error);
      }
    });
  }
}


