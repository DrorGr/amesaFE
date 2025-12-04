import { Component, inject, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, InventoryStatus } from '../../services/reservation.service';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-live-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" role="region" aria-labelledby="inventory-title">
      <h3 id="inventory-title" class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {{ title() || 'Live Inventory' }}
      </h3>
      
      <div aria-live="polite" aria-atomic="true">
        @if (isLoading()) {
          <div class="animate-pulse" aria-label="Loading inventory">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        } @else if (error()) {
          <div class="text-red-600 dark:text-red-400 text-sm" role="alert">
            {{ error() }}
          </div>
        } @else if (inventory()) {
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">Available Tickets:</span>
              <span class="text-2xl font-bold" 
                    [class.text-green-600]="inventory()!.availableTickets > 0" 
                    [class.text-red-600]="inventory()!.availableTickets === 0"
                    [attr.aria-label]="'Available tickets: ' + inventory()!.availableTickets">
                {{ inventory()!.availableTickets }}
              </span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">Total Tickets:</span>
              <span class="text-lg font-semibold text-gray-900 dark:text-white"
                    [attr.aria-label]="'Total tickets: ' + inventory()!.totalTickets">
                {{ inventory()!.totalTickets }}
              </span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">Sold:</span>
              <span class="text-lg font-semibold text-gray-900 dark:text-white"
                    [attr.aria-label]="'Sold tickets: ' + inventory()!.soldTickets">
                {{ inventory()!.soldTickets }}
              </span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">Reserved:</span>
              <span class="text-lg font-semibold text-gray-900 dark:text-white"
                    [attr.aria-label]="'Reserved tickets: ' + inventory()!.reservedTickets">
                {{ inventory()!.reservedTickets }}
              </span>
            </div>
            
            <!-- Progress Bar -->
            <div class="mt-4" role="progressbar" 
                 [attr.aria-valuenow]="progressPercentage()" 
                 aria-valuemin="0" 
                 aria-valuemax="100"
                 [attr.aria-label]="'Progress: ' + progressPercentage() + ' percent'">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{{ progressPercentage() }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="progressPercentage()">
                </div>
              </div>
            </div>
            
            @if (inventory()!.isSoldOut) {
              <div class="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg" role="alert">
                <p class="text-red-800 dark:text-red-400 font-semibold text-sm">
                  Sold Out
                </p>
              </div>
            } @else if (inventory()!.isEnded) {
              <div class="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p class="text-gray-800 dark:text-gray-300 font-semibold text-sm">
                  Lottery Ended
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class LiveInventoryComponent implements OnInit, OnDestroy {
  houseId = input.required<string>();
  title = input<string>();
  
  inventory = signal<InventoryStatus | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private subscription = new Subscription();
  private reservationService = inject(ReservationService);
  private realtimeService = inject(RealtimeService);
  
  progressPercentage = computed(() => {
    const inv = this.inventory();
    if (!inv || inv.totalTickets === 0) return 0;
    return Math.round((inv.soldTickets / inv.totalTickets) * 100);
  });
  
  ngOnInit(): void {
    this.loadInventory();
    this.setupRealtimeUpdates();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  private loadInventory(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.reservationService.getInventoryStatus(this.houseId(), false).subscribe({
      next: (inventory) => {
        this.inventory.set(inventory);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load inventory');
        this.isLoading.set(false);
      }
    });
  }
  
  private setupRealtimeUpdates(): void {
    // Join lottery group for real-time updates
    this.realtimeService.ensureConnection().then(() => {
      this.realtimeService.joinLotteryGroup(this.houseId());
    });
    
    // Subscribe to inventory updates
    const sub = this.realtimeService.inventoryUpdates$.subscribe(update => {
      if (update.houseId === this.houseId()) {
        const current = this.inventory();
        if (current) {
          this.inventory.set({
            ...current,
            availableTickets: update.availableTickets,
            reservedTickets: update.reservedTickets,
            soldTickets: update.soldTickets,
            isSoldOut: update.isSoldOut,
            lotteryEndDate: current.lotteryEndDate
          });
        }
      }
    });
    
    this.subscription.add(sub);
  }
}



