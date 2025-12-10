import { Injectable, signal, computed, inject } from '@angular/core';
import { House, HouseDto } from '../models/house.model';
import { LotteryService } from './lottery.service';
import { AuthService } from './auth.service';
import { TranslationService } from './translation.service';
import { ToastService } from './toast.service';
import { LocaleService } from './locale.service';
import { UserPreferencesService } from './user-preferences.service';
import { firstValueFrom } from 'rxjs';

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

  private localeService = inject(LocaleService);
  private userPreferencesService = inject(UserPreferencesService);

  // Formatting utilities - Uses LocaleService for locale-aware formatting
  formatPrice(price: number): string {
    // Get currency from user preferences or default to USD
    const currency = this.getCurrencyCode();
    return this.localeService.formatCurrency(price, currency);
  }

  private getCurrencyCode(): string {
    // Get currency from user preferences, default to USD
    try {
      const prefs = this.userPreferencesService.getPreferences();
      return prefs.localization?.currency || 'USD';
    } catch {
      // If preferences not available, use default
      return 'USD';
    }
  }

  formatSqft(sqft: number): string {
    return this.localeService.formatNumber(sqft);
  }

  formatLotteryDate(endDate: Date | string): string {
    const date = typeof endDate === 'string' ? new Date(endDate) : endDate;
    return this.localeService.formatDate(date, 'medium');
  }

  // House calculations
  getTicketProgress(house: House): number {
    if (!house.totalTickets || house.totalTickets === 0) return 0;
    return Math.min((house.soldTickets / house.totalTickets) * 100, 100);
  }

  getOdds(house: House): string {
    if (!house.totalTickets || house.totalTickets === 0) return 'N/A';
    const soldTickets = house.soldTickets || 0;
    const availableTickets = house.totalTickets - soldTickets;
    if (availableTickets <= 0) return 'N/A';
    // Odds = 1 : available tickets (ratio between a ticket and possible entries)
    return `1:${this.localeService.formatNumber(availableTickets)}`;
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
      return '00:00:00:00';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Format: DD:HH:MM:SS (always show days, hours, minutes, seconds)
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    return template.replace('{count}', this.localeService.formatNumber(remaining));
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
      const result = await firstValueFrom(this.lotteryService.purchaseTicket({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default' // You'll need to implement payment method selection
      }));
      
      if (result && result.ticketsPurchased > 0) {
        this.toastService.success(`Successfully purchased ${result.ticketsPurchased} ticket(s)!`, 3000);
        return { success: true };
      } else {
        this.toastService.error('Failed to purchase ticket. Please try again.', 4000);
        return { success: false, message: 'Purchase failed' };
      }
    } catch (error: any) {
      // Suppress errors for 200 status (response format issues, not actual errors)
      if (error?.status !== 200) {
        console.error('Error purchasing ticket:', error);
      }
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
      const result = await firstValueFrom(this.lotteryService.quickEntryFromFavorite({
        houseId: house.id,
        quantity: 1,
        paymentMethodId: 'default'
      }));
      
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


