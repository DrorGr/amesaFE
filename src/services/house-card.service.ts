import { Injectable, signal, computed } from '@angular/core';
import { House, HouseDto } from '../models/house.model';
import { LotteryService } from './lottery.service';
import { AuthService } from './auth.service';
import { TranslationService } from './translation.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class HouseCardService {
  private lotteryService: LotteryService;
  private authService: AuthService;
  private translationService: TranslationService;
  private toastService: ToastService;

  constructor(
    lotteryService: LotteryService,
    authService: AuthService,
    translationService: TranslationService,
    toastService: ToastService
  ) {
    this.lotteryService = lotteryService;
    this.authService = authService;
    this.translationService = translationService;
    this.toastService = toastService;
  }

  // Formatting utilities
  formatPrice(price: number): string {
    return price.toLocaleString();
  }

  formatSqft(sqft: number): string {
    return sqft.toLocaleString();
  }

  formatLotteryDate(endDate: Date | string): string {
    return new Date(endDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // House calculations
  getTicketProgress(house: House): number {
    if (!house.totalTickets || house.totalTickets === 0) return 0;
    return Math.min((house.soldTickets / house.totalTickets) * 100, 100);
  }

  getOdds(house: House): string {
    if (!house.totalTickets || house.totalTickets === 0) return 'N/A';
    return `1:${house.totalTickets.toLocaleString()}`;
  }

  getRemainingTickets(house: House): number {
    if (!house.totalTickets) return 0;
    return Math.max(0, house.totalTickets - house.soldTickets);
  }

  getTimeRemaining(house: House, currentTime: number): string {
    const endDate = new Date(house.lotteryEndDate);
    const now = new Date(currentTime);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return this.translationService.translate('house.ended');
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  }

  getLotteryCountdown(house: House, currentTime: number): string {
    const endTime = new Date(house.lotteryEndDate).getTime();
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) {
      return '00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Show seconds only when less than 24 hours left
    if (days === 0 && hours < 24) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Status and text utilities
  getStatusText(house: House): string {
    const status = house.status;
    switch (status) {
      case 'active': return this.translationService.translate('house.active');
      case 'ended': return this.translationService.translate('house.ended');
      case 'upcoming': return this.translationService.translate('house.upcoming');
      default: return 'Unknown';
    }
  }

  getTicketsAvailableText(house: House): string {
    const remaining = this.getRemainingTickets(house);
    const template = this.translationService.translate('house.onlyTicketsAvailable');
    return template.replace('{count}', remaining.toLocaleString());
  }

  // Viewers count (simulated)
  getCurrentViewers(): number {
    return Math.floor(Math.random() * 46) + 5;
  }

  // Location utilities
  openLocationMap(house: House): void {
    const address = house.address || house.location || house.title;
    const city = house.city || 'New York';
    
    // Create a search query for Google Maps
    const searchQuery = encodeURIComponent(`${address}, ${city}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // Open in a new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    
    console.log(`Opening location map for: ${address}, ${city}`);
  }

  // Translation utilities
  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    let translation = this.translationService.translate(key);
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }

  // Purchase ticket
  async purchaseTicket(house: House, canEnter: boolean, isExistingParticipant: boolean): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.authService.getCurrentUser()();
    
    if (!currentUser || !currentUser.isAuthenticated) {
      this.toastService.error('Please log in to purchase tickets.', 4000);
      return { success: false, message: 'Not authenticated' };
    }
    
    // Check if user can enter (participant cap check)
    if (!canEnter && !isExistingParticipant) {
      this.toastService.error('Participant cap reached for this lottery.', 4000);
      return { success: false, message: 'Participant cap reached' };
    }
    
    try {
      const result = await this.lotteryService.purchaseTicket({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default' // You'll need to implement payment method selection
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(`Successfully purchased ${result.ticketsPurchased} ticket(s)!`, 3000);
        return { success: true };
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
        return { success: false, message: 'Purchase failed' };
      }
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      // Check if it's a verification error
      if (error?.error?.error?.code === 'ID_VERIFICATION_REQUIRED' || 
          error?.error?.message?.includes('ID_VERIFICATION_REQUIRED') ||
          error?.error?.message?.includes('verification')) {
        this.toastService.error('Please validate your account to purchase tickets.', 4000);
        return { success: false, message: 'Verification required' };
      }
      // Check if it's a participant cap error
      else if (error?.error?.error?.code === 'PARTICIPANT_CAP_REACHED') {
        this.toastService.error('Participant cap reached for this lottery.', 4000);
        return { success: false, message: 'Participant cap reached' };
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
        return { success: false, message: 'Purchase failed' };
      }
    }
  }

  // Quick entry
  async quickEntry(house: House, favoriteHouseIds: string[]): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.authService.getCurrentUser()();
    
    if (!currentUser || !currentUser.isAuthenticated) {
      this.toastService.error('Please log in to enter lottery.', 4000);
      return { success: false, message: 'Not authenticated' };
    }
    
    // Check if house is in favorites
    if (!favoriteHouseIds.includes(house.id)) {
      this.toastService.error('Please add this house to favorites first.', 4000);
      return { success: false, message: 'Not in favorites' };
    }
    
    try {
      const result = await this.lotteryService.quickEntryFromFavorite({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default'
      }).toPromise();
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(`Successfully entered with ${result.ticketsPurchased} ticket(s)!`, 3000);
        return { success: true };
      } else {
        this.toastService.error('Failed to enter lottery. Please try again.', 4000);
        return { success: false, message: 'Entry failed' };
      }
    } catch (error: any) {
      console.error('Error in quick entry:', error);
      this.toastService.error('Failed to enter lottery. Please try again.', 4000);
      return { success: false, message: 'Entry failed' };
    }
  }

  // Load house details
  loadHouseDetails(houseId: string): Promise<HouseDto | null> {
    return new Promise((resolve) => {
      this.lotteryService.getHouseById(houseId).subscribe({
        next: (houseDto) => {
          resolve(houseDto);
        },
        error: (error) => {
          console.error('Error loading house details:', error);
          resolve(null);
        }
      });
    });
  }

  // Check if can enter lottery
  checkCanEnter(houseId: string): Promise<{ canEnter: boolean; isExistingParticipant: boolean }> {
    return new Promise((resolve) => {
      this.lotteryService.canEnterLottery(houseId).subscribe({
        next: (response) => {
          resolve(response);
        },
        error: (error) => {
          console.error('Error checking if can enter:', error);
          resolve({ canEnter: true, isExistingParticipant: false }); // Default to allowing entry on error
        }
      });
    });
  }
}


