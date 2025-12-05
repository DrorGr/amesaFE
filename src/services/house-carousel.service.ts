import { Injectable, signal, computed, inject } from '@angular/core';
import { LotteryService } from './lottery.service';
import { AuthService } from './auth.service';
import { LocaleService } from './locale.service';

export interface CarouselState {
  currentSlide: number;
  currentHouseImageIndex: number;
  currentSecondaryImageIndex: number;
  isTransitioning: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HouseCarouselService {
  private lotteryService: LotteryService;
  private authService: AuthService;
  private localeService = inject(LocaleService);

  // Carousel state
  private _currentSlide = signal<number>(0);
  private _currentHouseImageIndex = signal<number>(0);
  private _currentSecondaryImageIndex = signal<number>(0);
  private _isTransitioning = signal<boolean>(false);
  private _loadedImages = signal<Set<string>>(new Set());
  private _togglingFavorites = signal<Set<string>>(new Set());

  // Computed values
  currentSlide = this._currentSlide.asReadonly();
  currentHouseImageIndex = this._currentHouseImageIndex.asReadonly();
  currentSecondaryImageIndex = this._currentSecondaryImageIndex.asReadonly();
  isTransitioning = this._isTransitioning.asReadonly();
  loadedImages = this._loadedImages.asReadonly();
  togglingFavorites = this._togglingFavorites.asReadonly();

  // Active houses from lottery service
  houses = computed(() => {
    const allHouses = this.lotteryService.getHouses()();
    return allHouses.filter(house => house.status === 'active');
  });

  // Favorite house IDs
  favoriteHouseIds = computed(() => this.lotteryService.getFavoriteHouseIds()());

  constructor(lotteryService: LotteryService, authService: AuthService) {
    this.lotteryService = lotteryService;
    this.authService = authService;
  }

  // Carousel navigation
  nextSlide(): void {
    const houses = this.houses();
    if (houses.length === 0) return;
    this._currentSlide.set((this._currentSlide() + 1) % houses.length);
    this._currentHouseImageIndex.set(0); // Reset to first image when changing houses
  }

  previousSlide(): void {
    const houses = this.houses();
    if (houses.length === 0) return;
    this._currentSlide.set(this._currentSlide() === 0 ? houses.length - 1 : this._currentSlide() - 1);
    this._currentHouseImageIndex.set(0); // Reset to first image when changing houses
  }

  goToSlide(index: number): void {
    const houses = this.houses();
    if (index >= 0 && index < houses.length) {
      this._currentSlide.set(index);
      this._currentHouseImageIndex.set(0); // Reset to first image when changing houses
    }
  }

  // Image navigation
  nextHouseImage(): void {
    const currentHouse = this.getCurrentHouse();
    if (currentHouse && currentHouse.images.length > 0) {
      this._currentHouseImageIndex.set((this._currentHouseImageIndex() + 1) % currentHouse.images.length);
    }
  }

  previousHouseImage(): void {
    const currentHouse = this.getCurrentHouse();
    if (currentHouse && currentHouse.images.length > 0) {
      const currentIndex = this._currentHouseImageIndex();
      this._currentHouseImageIndex.set(currentIndex === 0 ? currentHouse.images.length - 1 : currentIndex - 1);
    }
  }

  goToHouseImage(index: number): void {
    const currentHouse = this.getCurrentHouse();
    if (currentHouse && index >= 0 && index < currentHouse.images.length) {
      this._currentHouseImageIndex.set(index);
    }
  }

  goToSecondaryImage(index: number): void {
    this._currentSecondaryImageIndex.set(index);
  }

  // House data getters
  getCurrentHouse(): any {
    const houses = this.houses();
    return houses[this._currentSlide()];
  }

  getCurrentHouseImage(): any {
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse || !currentHouse.images || currentHouse.images.length === 0) {
      return null;
    }
    return currentHouse.images[this._currentHouseImageIndex()];
  }

  getCurrentMainImage(house: any, houseIndex: number): any {
    if (!house || !house.images || house.images.length === 0) {
      return { url: '', alt: '' };
    }
    const imageIndex = this.getImageIndexForHouse(houseIndex);
    return house.images[imageIndex] || house.images[0];
  }

  getImageIndexForHouse(houseIndex: number): number {
    if (houseIndex === this._currentSlide()) {
      return this._currentHouseImageIndex();
    }
    return 0;
  }

  getPrimaryImage(images: any[]): any {
    if (!images || images.length === 0) return null;
    return images.find(img => img.isPrimary) || images[0];
  }

  getSecondaryImages(images: any[]): any[] {
    if (!images || images.length <= 1) return [];
    const primary = this.getPrimaryImage(images);
    return images.filter(img => img !== primary);
  }

  // Image loading
  isImageLoaded(imageUrl: string): boolean {
    return this._loadedImages().has(imageUrl);
  }

  markImageAsLoaded(imageUrl: string): void {
    const current = this._loadedImages();
    current.add(imageUrl);
    this._loadedImages.set(new Set(current));
  }

  loadCurrentSlideImages(): void {
    const currentHouse = this.getCurrentHouse();
    if (!currentHouse || !currentHouse.images || currentHouse.images.length === 0) {
      return;
    }

    // Load the current image immediately
    const currentImageUrl = currentHouse.images[this._currentHouseImageIndex()].url;
    if (!this._loadedImages().has(currentImageUrl)) {
      this.markImageAsLoaded(currentImageUrl);
    }

    // Preload adjacent images for smoother transitions
    const nextImageIndex = (this._currentHouseImageIndex() + 1) % currentHouse.images.length;
    const prevImageIndex = this._currentHouseImageIndex() === 0
      ? currentHouse.images.length - 1
      : this._currentHouseImageIndex() - 1;

    [nextImageIndex, prevImageIndex].forEach(index => {
      const imageUrl = currentHouse.images[index].url;
      if (!this._loadedImages().has(imageUrl)) {
        const img = new Image();
        img.onload = () => {
          this.markImageAsLoaded(imageUrl);
        };
        img.src = imageUrl;
      }
    });
  }

  // Favorites
  isFavorite(houseId: string): boolean {
    return this.favoriteHouseIds().includes(houseId);
  }

  isTogglingFavorite(houseId: string): boolean {
    return this._togglingFavorites().has(houseId);
  }

  async toggleFavorite(event: Event, house: any): Promise<void> {
    event.stopPropagation();
    const houseId = house.id;

    if (this._togglingFavorites().has(houseId)) {
      return; // Already toggling
    }

    // Add to toggling set
    const toggling = this._togglingFavorites();
    toggling.add(houseId);
    this._togglingFavorites.set(new Set(toggling));

    try {
      const isCurrentlyFavorite = this.isFavorite(houseId);
      if (isCurrentlyFavorite) {
        await this.lotteryService.removeHouseFromFavorites(houseId).toPromise();
      } else {
        await this.lotteryService.addHouseToFavorites(houseId).toPromise();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      // Remove from toggling set
      const toggling = this._togglingFavorites();
      toggling.delete(houseId);
      this._togglingFavorites.set(new Set(toggling));
    }
  }

  // Formatting utilities
  formatPrice(price: number): string {
    return this.localeService.formatCurrency(price, 'USD');
  }

  formatDate(date: Date): string {
    return this.localeService.formatDate(date, 'long');
  }

  // House calculations
  getTicketProgressForHouse(house: any): number {
    if (!house || !house.totalTickets || house.totalTickets === 0) return 0;
    const ticketsSold = house.ticketsSold || 0;
    return Math.min((ticketsSold / house.totalTickets) * 100, 100);
  }

  getOdds(house: any): string {
    if (!house || !house.totalTickets || house.totalTickets === 0) return 'N/A';
    const ticketsSold = house.ticketsSold || 0;
    const availableTickets = house.totalTickets - ticketsSold;
    if (availableTickets <= 0) return 'N/A';
    // Odds = 1 : available tickets (ratio between a ticket and possible entries)
    return `1:${this.localeService.formatNumber(availableTickets)}`;
  }

  getRemainingTickets(house: any): number {
    if (!house || !house.totalTickets) return 0;
    const ticketsSold = house.ticketsSold || 0;
    return Math.max(0, house.totalTickets - ticketsSold);
  }

  getLotteryCountdown(house: any): string {
    if (!house || !house.lotteryEndDate) return '';
    const endDate = new Date(house.lotteryEndDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getTicketsAvailableText(house: any): string {
    const remaining = this.getRemainingTickets(house);
    if (remaining === 0) return 'Sold Out';
    if (remaining === 1) return '1 Ticket Left';
    return `${remaining} Tickets Left`;
  }

  getStatusText(house: any): string {
    if (!house || !house.status) return '';
    const status = house.status.toLowerCase();
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  // Viewers count (simulated)
  getCurrentViewers(): number {
    return Math.floor(Math.random() * 46) + 5;
  }
}

