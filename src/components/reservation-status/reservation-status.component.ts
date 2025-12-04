import { Component, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, Reservation } from '../../services/reservation.service';
import { RealtimeService } from '../../services/realtime.service';
import { LocaleService } from '../../services/locale.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reservation-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" role="region" aria-labelledby="reservation-status-title">
      <h3 id="reservation-status-title" class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Reservation Status
      </h3>
      
      @if (isLoading()) {
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      } @else if (error()) {
        <div class="text-red-600 dark:text-red-400 text-sm">
          {{ error() }}
        </div>
      }       @else if (reservation()) {
        <div class="space-y-4" aria-live="polite" aria-atomic="true">
          <!-- Status Badge -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
            <span 
              class="px-3 py-1 rounded-full text-sm font-semibold"
              [class.bg-yellow-100]="reservation()!.status === 'pending'"
              [class.text-yellow-800]="reservation()!.status === 'pending'"
              [class.dark:bg-yellow-900]="reservation()!.status === 'pending'"
              [class.dark:text-yellow-200]="reservation()!.status === 'pending'"
              [class.bg-blue-100]="reservation()!.status === 'processing'"
              [class.text-blue-800]="reservation()!.status === 'processing'"
              [class.dark:bg-blue-900]="reservation()!.status === 'processing'"
              [class.dark:text-blue-200]="reservation()!.status === 'processing'"
              [class.bg-green-100]="reservation()!.status === 'completed'"
              [class.text-green-800]="reservation()!.status === 'completed'"
              [class.dark:bg-green-900]="reservation()!.status === 'completed'"
              [class.dark:text-green-200]="reservation()!.status === 'completed'"
              [class.bg-red-100]="reservation()!.status === 'failed' || reservation()!.status === 'expired'"
              [class.text-red-800]="reservation()!.status === 'failed' || reservation()!.status === 'expired'"
              [class.dark:bg-red-900]="reservation()!.status === 'failed' || reservation()!.status === 'expired'"
              [class.dark:text-red-200]="reservation()!.status === 'failed' || reservation()!.status === 'expired'"
              [class.bg-gray-100]="reservation()!.status === 'cancelled'"
              [class.text-gray-800]="reservation()!.status === 'cancelled'"
              [class.dark:bg-gray-700]="reservation()!.status === 'cancelled'"
              [class.dark:text-gray-200]="reservation()!.status === 'cancelled'"
              [attr.aria-label]="'Reservation status: ' + getStatusText(reservation()!.status)">
              {{ getStatusText(reservation()!.status) }}
            </span>
          </div>
          
          <!-- Details -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Quantity:</span>
              <span class="ml-2 font-semibold text-gray-900 dark:text-white">
                {{ reservation()!.quantity }}
              </span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Total Price:</span>
              <span class="ml-2 font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(reservation()!.totalPrice) }}
              </span>
            </div>
          </div>
          
          <!-- Expiration Time -->
          @if (reservation()!.status === 'pending') {
            <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p class="text-sm text-yellow-800 dark:text-yellow-300">
                Reservation expires in: 
                <strong>{{ getTimeUntilExpiry() }}</strong>
              </p>
            </div>
          }
          
          <!-- Error Message -->
          @if (reservation()!.errorMessage) {
            <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-300">
                {{ reservation()!.errorMessage }}
              </p>
            </div>
          }
          
          <!-- Actions -->
          @if (reservation()!.status === 'pending') {
            <button
              (click)="cancelReservation()"
              (keydown.enter)="cancelReservation()"
              (keydown.space)="cancelReservation(); $event.preventDefault()"
              aria-label="Cancel reservation"
              class="mt-4 w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none">
              Cancel Reservation
            </button>
          }
        </div>
      } @else {
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          No reservation found
        </p>
      }
    </div>
  `
})
export class ReservationStatusComponent implements OnInit, OnDestroy {
  reservationId = input.required<string>();
  
  reservation = signal<Reservation | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private subscription = new Subscription();
  private reservationService = inject(ReservationService);
  private realtimeService = inject(RealtimeService);
  private localeService = inject(LocaleService);
  private expiryInterval?: any;
  
  ngOnInit(): void {
    this.loadReservation();
    this.setupRealtimeUpdates();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
    }
  }
  
  private loadReservation(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.reservationService.getReservation(this.reservationId()).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.isLoading.set(false);
        
        // Start expiry countdown if pending
        if (reservation.status === 'pending') {
          this.startExpiryCountdown(reservation.expiresAt);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load reservation');
        this.isLoading.set(false);
      }
    });
  }
  
  private setupRealtimeUpdates(): void {
    // Subscribe to reservation status updates
    const sub = this.realtimeService.reservationStatusUpdates$.subscribe(update => {
      if (update.reservationId === this.reservationId()) {
        const current = this.reservation();
        if (current) {
          this.reservation.set({
            ...current,
            status: update.status as any,
            errorMessage: update.errorMessage,
            processedAt: update.processedAt
          });
        }
      }
    });
    
    this.subscription.add(sub);
  }
  
  private startExpiryCountdown(expiresAt: Date): void {
    this.expiryInterval = setInterval(() => {
      const now = new Date();
      if (now >= expiresAt) {
        // Expired - reload reservation to get updated status
        this.loadReservation();
        if (this.expiryInterval) {
          clearInterval(this.expiryInterval);
        }
      }
    }, 1000);
  }
  
  cancelReservation(): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    this.isLoading.set(true);
    this.reservationService.cancelReservation(this.reservationId()).subscribe({
      next: () => {
        // Reload to get updated status
        this.loadReservation();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to cancel reservation');
        this.isLoading.set(false);
      }
    });
  }
  
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'completed': 'Completed',
      'expired': 'Expired',
      'failed': 'Failed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }
  
  getTimeUntilExpiry(): string {
    const reservation = this.reservation();
    if (!reservation || reservation.status !== 'pending') {
      return '';
    }
    
    const now = new Date();
    const expiresAt = reservation.expiresAt;
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  formatCurrency(amount: number): string {
    return this.localeService.formatCurrency(amount, 'USD');
  }
}



