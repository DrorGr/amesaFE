import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, PagedResponse } from './api.service';
import { 
  House, 
  HouseDto, 
  LotteryTicketDto, 
  PurchaseTicketRequest 
} from '../models/house.model';
import {
  UserLotteryData,
  UserLotteryStats,
  HouseRecommendation,
  EntryFilters,
  PagedEntryHistoryResponse,
  QuickEntryRequest,
  QuickEntryResponse,
  FavoriteHouseResponse
} from '../interfaces/lottery.interface';

@Injectable({
  providedIn: 'root'
})
export class LotteryService {
  private houses = signal<House[]>([]);
  private userTickets = signal<LotteryTicketDto[]>([]);
  
  // Lottery Favorites & Entry Management State
  private favoriteHouseIds = signal<string[]>([]);
  private activeEntries = signal<LotteryTicketDto[]>([]);
  private userLotteryStats = signal<UserLotteryStats | null>(null);
  private recommendations = signal<HouseRecommendation[]>([]);

  constructor(private apiService: ApiService) {
    // Load houses automatically when service is initialized
    this.loadHousesInternal();
  }

  getHouses() {
    return this.houses.asReadonly();
  }

  getUserTickets() {
    return this.userTickets.asReadonly();
  }

  // Lottery Favorites & Entry Management Getters
  getFavoriteHouseIds() {
    return this.favoriteHouseIds.asReadonly();
  }

  getActiveEntries() {
    return this.activeEntries.asReadonly();
  }

  getUserLotteryStats() {
    return this.userLotteryStats.asReadonly();
  }

  getRecommendations() {
    return this.recommendations.asReadonly();
  }

  // Check if a house is favorited
  isFavorite(houseId: string): boolean {
    return this.favoriteHouseIds().includes(houseId);
  }

  // Load houses from API and update the signal
  private loadHousesInternal(): void {
    this.getHousesFromApi().subscribe({
      next: (response) => {
        // Convert HouseDto to House format
        const houses: House[] = response.items.map(dto => this.convertHouseDtoToHouse(dto));
        this.houses.set(houses);
      },
      error: (error) => {
        console.error('Failed to load houses:', error);
        // Set empty array on error
        this.houses.set([]);
      }
    });
  }

  // Get houses with pagination and filtering
  getHousesFromApi(params?: {
    page?: number;
    limit?: number;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
  }): Observable<PagedResponse<HouseDto>> {
    return this.apiService.get<PagedResponse<HouseDto>>('houses', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch houses');
      }),
      catchError(error => {
        console.error('Error fetching houses:', error);
        return throwError(() => error);
      })
    );
  }

  // Get single house by ID
  getHouseById(id: string): Observable<HouseDto> {
    return this.apiService.get<HouseDto>(`houses/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('House not found');
      }),
      catchError(error => {
        console.error('Error fetching house:', error);
        return throwError(() => error);
      })
    );
  }

  // Get available tickets for a house
  getAvailableTickets(houseId: string): Observable<{
    totalTickets: number;
    ticketsSold: number;
    availableTickets: number;
    ticketPrice: number;
    canPurchase: boolean;
  }> {
    return this.apiService.get(`houses/${houseId}/tickets`).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          return {
            totalTickets: data.totalTickets,
            ticketsSold: data.ticketsSold,
            availableTickets: data.availableTickets,
            ticketPrice: data.ticketPrice,
            canPurchase: data.canPurchase
          };
        }
        throw new Error('Failed to get ticket information');
      }),
      catchError(error => {
        console.error('Error fetching available tickets:', error);
        return throwError(() => error);
      })
    );
  }

  // Purchase tickets
  purchaseTicket(purchaseRequest: PurchaseTicketRequest): Observable<{
    ticketsPurchased: number;
    totalCost: number;
    ticketNumbers: string[];
  }> {
    return this.apiService.post(`houses/${purchaseRequest.houseId}/tickets/purchase`, purchaseRequest).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          return {
            ticketsPurchased: data.ticketsPurchased,
            totalCost: data.totalCost,
            ticketNumbers: data.ticketNumbers
          };
        }
        throw new Error('Failed to purchase tickets');
      }),
      catchError(error => {
        console.error('Error purchasing tickets:', error);
        return throwError(() => error);
      })
    );
  }

  // Get user's tickets
  // NOTE: Backend endpoint not yet available - tickets are accessed via houses/{id}/tickets
  // This method is kept for future implementation when user tickets endpoint is added
  getUserTicketsFromApi(): Observable<LotteryTicketDto[]> {
    // TODO: Implement when backend provides /api/v1/tickets or /api/v1/users/me/tickets endpoint
    console.warn('getUserTicketsFromApi: Endpoint not yet available in backend');
    return throwError(() => new Error('User tickets endpoint not yet implemented in backend'));
  }

  // Get lottery draws
  // NOTE: Backend endpoint not yet available
  // This method is kept for future implementation when draws endpoint is added
  getLotteryDraws(): Observable<any[]> {
    // TODO: Implement when backend provides /api/v1/draws endpoint
    console.warn('getLotteryDraws: Endpoint not yet available in backend');
    return throwError(() => new Error('Lottery draws endpoint not yet implemented in backend'));
  }

  // Legacy methods for backward compatibility
  getHouseByIdLegacy(id: string): House | undefined {
    return this.houses().find(house => house.id === id);
  }

  getActiveHouses(): House[] {
    return this.houses().filter(house => house.status === 'active');
  }

  getUpcomingHouses(): House[] {
    return this.houses().filter(house => house.status === 'upcoming');
  }

  getEndedHouses(): House[] {
    return this.houses().filter(house => house.status === 'ended');
  }

  // Convert HouseDto to House for backward compatibility
  convertHouseDtoToHouse(houseDto: HouseDto): House {
    return {
      id: houseDto.id,
      title: houseDto.title,
      description: houseDto.description || '',
      price: houseDto.price,
      location: houseDto.location,
      imageUrl: houseDto.images.find(img => img.isPrimary)?.imageUrl || houseDto.images[0]?.imageUrl || '',
      images: houseDto.images.map(img => ({
        url: img.imageUrl,
        alt: img.altText || ''
      })),
      bedrooms: houseDto.bedrooms,
      bathrooms: houseDto.bathrooms,
      sqft: houseDto.squareFeet || 0,
      lotteryEndDate: new Date(houseDto.lotteryEndDate),
      totalTickets: houseDto.totalTickets,
      soldTickets: houseDto.ticketsSold,
      ticketPrice: houseDto.ticketPrice,
      status: this.mapStatusToLegacy(houseDto.status)
    };
  }

  private mapStatusToLegacy(status: string): 'active' | 'ended' | 'upcoming' {
    switch (status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'ended':
      case 'completed':
        return 'ended';
      case 'upcoming':
      case 'pending':
        return 'upcoming';
      default:
        return 'active';
    }
  }

  // Load houses from API and update local state
  loadHouses(params?: any): void {
    this.getHousesFromApi(params).subscribe({
      next: (pagedResponse) => {
        const houses = pagedResponse.items.map(houseDto => this.convertHouseDtoToHouse(houseDto));
        this.houses.set(houses);
      },
      error: (error) => {
        console.error('Failed to load houses:', error);
        // Set empty array on error - no fallback to mock data
        this.houses.set([]);
      }
    });
  }

  // ============================================
  // Lottery Favorites & Entry Management Methods
  // ============================================
  // NOTE: These methods will be fully implemented once BE Agent completes BE-1.4 (API endpoints)
  // Currently preparing structure and state management

  /**
   * Get user's favorite houses
   * Endpoint: GET /api/v1/houses/favorites
   * TODO: Implement when BE-1.4 is complete
   */
  getFavoriteHouses(): Observable<HouseDto[]> {
    // TODO: Implement when backend provides /api/v1/houses/favorites endpoint
    console.warn('getFavoriteHouses: Endpoint not yet available in backend (waiting for BE-1.4)');
    return throwError(() => new Error('Favorites endpoint not yet implemented in backend'));
  }

  /**
   * Toggle favorite status for a house
   * Adds if not favorited, removes if already favorited
   * Endpoint: POST /api/v1/houses/{id}/favorite or DELETE /api/v1/houses/{id}/favorite
   * TODO: Implement when BE-1.4 is complete
   */
  toggleFavorite(houseId: string): Observable<FavoriteHouseResponse> {
    if (this.isFavorite(houseId)) {
      return this.removeHouseFromFavorites(houseId);
    } else {
      return this.addHouseToFavorites(houseId);
    }
  }

  /**
   * Add house to favorites
   * Endpoint: POST /api/v1/houses/{id}/favorite
   * TODO: Implement when BE-1.4 is complete
   */
  addHouseToFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // TODO: Implement when backend provides POST /api/v1/houses/{id}/favorite endpoint
    console.warn('addHouseToFavorites: Endpoint not yet available in backend (waiting for BE-1.4)');
    return throwError(() => new Error('Add favorite endpoint not yet implemented in backend'));
  }

  /**
   * Remove house from favorites
   * Endpoint: DELETE /api/v1/houses/{id}/favorite
   * TODO: Implement when BE-1.4 is complete
   */
  removeHouseFromFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // TODO: Implement when backend provides DELETE /api/v1/houses/{id}/favorite endpoint
    console.warn('removeHouseFromFavorites: Endpoint not yet available in backend (waiting for BE-1.4)');
    return throwError(() => new Error('Remove favorite endpoint not yet implemented in backend'));
  }

  /**
   * Get personalized house recommendations
   * Endpoint: GET /api/v1/houses/recommendations
   * TODO: Implement when BE-1.4 is complete
   */
  getRecommendations(limit?: number): Observable<HouseRecommendation[]> {
    // TODO: Implement when backend provides GET /api/v1/houses/recommendations endpoint
    console.warn('getRecommendations: Endpoint not yet available in backend (waiting for BE-1.4)');
    return throwError(() => new Error('Recommendations endpoint not yet implemented in backend'));
  }

  /**
   * Get user's active lottery entries
   * Endpoint: GET /api/v1/tickets/active
   * TODO: Implement when BE-2.1 is complete
   */
  getUserActiveEntries(): Observable<LotteryTicketDto[]> {
    // TODO: Implement when backend provides GET /api/v1/tickets/active endpoint
    console.warn('getUserActiveEntries: Endpoint not yet available in backend (waiting for BE-2.1)');
    return throwError(() => new Error('Active entries endpoint not yet implemented in backend'));
  }

  /**
   * Get user's entry history with filters
   * Endpoint: GET /api/v1/tickets/history
   * TODO: Implement when BE-2.1 is complete
   */
  getUserEntryHistory(filters?: EntryFilters): Observable<PagedEntryHistoryResponse> {
    // TODO: Implement when backend provides GET /api/v1/tickets/history endpoint
    console.warn('getUserEntryHistory: Endpoint not yet available in backend (waiting for BE-2.1)');
    return throwError(() => new Error('Entry history endpoint not yet implemented in backend'));
  }

  /**
   * Get user's lottery statistics and analytics
   * Endpoint: GET /api/v1/tickets/analytics
   * TODO: Implement when BE-2.1 is complete
   */
  getLotteryAnalytics(): Observable<UserLotteryStats> {
    // TODO: Implement when backend provides GET /api/v1/tickets/analytics endpoint
    console.warn('getLotteryAnalytics: Endpoint not yet available in backend (waiting for BE-2.1)');
    return throwError(() => new Error('Analytics endpoint not yet implemented in backend'));
  }

  /**
   * Quick entry into lottery from favorites
   * Endpoint: POST /api/v1/tickets/quick-entry
   * TODO: Implement when BE-2.1 is complete
   */
  quickEntryFromFavorite(request: QuickEntryRequest): Observable<QuickEntryResponse> {
    // TODO: Implement when backend provides POST /api/v1/tickets/quick-entry endpoint
    console.warn('quickEntryFromFavorite: Endpoint not yet available in backend (waiting for BE-2.1)');
    return throwError(() => new Error('Quick entry endpoint not yet implemented in backend'));
  }

  /**
   * Initialize lottery data from UserLotteryData
   * Called after login to populate state
   * TODO: Implement when BE-1.6 is complete
   */
  initializeLotteryData(lotteryData: UserLotteryData): void {
    this.favoriteHouseIds.set(lotteryData.favoriteHouseIds || []);
    this.activeEntries.set(lotteryData.activeEntries || []);
    if (lotteryData.stats) {
      this.userLotteryStats.set(lotteryData.stats);
    }
  }

  /**
   * Clear all lottery data (called on logout)
   */
  clearLotteryData(): void {
    this.favoriteHouseIds.set([]);
    this.activeEntries.set([]);
    this.userLotteryStats.set(null);
    this.recommendations.set([]);
  }

}