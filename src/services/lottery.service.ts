import { Injectable, signal, inject } from '@angular/core';
import { Observable, throwError, Subscription, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, PagedResponse } from './api.service';
import { RetryService } from './retry.service';
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
import {
  LotteryParticipantStats,
  CanEnterLotteryResponse
} from '../interfaces/watchlist.interface';
import { RealtimeService, FavoriteUpdateEvent, EntryStatusChangeEvent, DrawReminderEvent, RecommendationEvent } from './realtime.service';

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
  
  // Debouncing for favorites operations (prevent rapid clicks/exploits)
  // Uses pending request tracking to prevent duplicate requests for the same house
  private pendingFavoriteAdds = new Map<string, boolean>();
  private pendingFavoriteRemoves = new Map<string, boolean>();
  
  private realtimeService = inject(RealtimeService, { optional: true });
  private subscriptions = new Subscription();
  private retryService = inject(RetryService);
  
  constructor(private apiService: ApiService) {
    // Load houses automatically when service is initialized
    this.loadHousesInternal();
    
    // Setup SignalR subscriptions for real-time updates (FE-2.6)
    this.setupRealtimeSubscriptions();
  }
  
  /**
   * Setup SignalR subscriptions for real-time updates (FE-2.6)
   */
  private setupRealtimeSubscriptions(): void {
    if (!this.realtimeService) {
      return;
    }
    
    // Subscribe to favorite updates
    const favoriteSub = this.realtimeService.favoriteUpdates$.subscribe((event: FavoriteUpdateEvent) => {
      const currentFavorites = this.favoriteHouseIds();
      if (event.updateType === 'added' && !currentFavorites.includes(event.houseId)) {
        this.favoriteHouseIds.set([...currentFavorites, event.houseId]);
      } else if (event.updateType === 'removed') {
        this.favoriteHouseIds.set(currentFavorites.filter(id => id !== event.houseId));
      }
    });
    this.subscriptions.add(favoriteSub);
    
    // Subscribe to entry status changes
    const entryStatusSub = this.realtimeService.entryStatusChanges$.subscribe((event: EntryStatusChangeEvent) => {
      const currentEntries = this.activeEntries();
      const updatedEntries = currentEntries.map(entry => 
        entry.id === event.ticketId 
          ? { ...entry, status: event.newStatus }
          : entry
      );
      this.activeEntries.set(updatedEntries);
    });
    this.subscriptions.add(entryStatusSub);
    
    // Subscribe to draw reminders
    const drawReminderSub = this.realtimeService.drawReminders$.subscribe((event: DrawReminderEvent) => {
      // TODO: Show notification/toast for draw reminder
      console.log('Draw reminder:', event);
    });
    this.subscriptions.add(drawReminderSub);
    
    // Subscribe to recommendations
    const recommendationSub = this.realtimeService.recommendations$.subscribe((event: RecommendationEvent) => {
      // TODO: Show notification/toast for new recommendation
      console.log('New recommendation:', event);
      // Optionally refresh recommendations
      this.getRecommendations(10).subscribe();
    });
    this.subscriptions.add(recommendationSub);
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

  getRecommendationsSignal() {
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
    return this.retryService.retryOnNetworkError(
      this.apiService.get<HouseDto>(`houses/${id}`)
    ).pipe(
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

  /**
   * Get user's favorite houses
   * Endpoint: GET /api/v1/houses/favorites
   */
  getFavoriteHouses(): Observable<HouseDto[]> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:getFavoriteHouses',message:'Loading favorite houses',data:{currentFavoriteIds:this.favoriteHouseIds(),currentFavoriteIdsCount:this.favoriteHouseIds().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    return this.apiService.get<HouseDto[]>('houses/favorites').pipe(
      map(response => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:getFavoriteHouses:map',message:'Processing favorite houses response',data:{responseSuccess:response.success,hasData:!!response.data,dataLength:response.data?.length||0,dataIds:response.data?.map(h=>h.id)||[],currentSignalIds:this.favoriteHouseIds()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (response.success && response.data) {
          // Update favorite IDs signal
          const favoriteIds = response.data.map(house => house.id);
          this.favoriteHouseIds.set(favoriteIds);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:getFavoriteHouses:success',message:'Favorite houses loaded successfully',data:{favoriteIds,favoriteIdsCount:favoriteIds.length,housesReturned:response.data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          return response.data;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:getFavoriteHouses:error',message:'Failed to fetch favorite houses - invalid response',data:{responseSuccess:response.success,hasData:!!response.data,responseMessage:response.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        throw new Error('Failed to fetch favorite houses');
      }),
      catchError(error => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:getFavoriteHouses:catchError',message:'Error fetching favorite houses',data:{status:error.status,statusText:error.statusText,url:error.url,errorMessage:error.error?.message||error.message,currentSignalIds:this.favoriteHouseIds()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        console.error('Error fetching favorite houses:', error);
        return throwError(() => error);
      })
    );
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
   * Debounced to prevent rapid clicks/exploits (500ms debounce)
   */
  addHouseToFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites',message:'Adding house to favorites',data:{houseId,currentFavorites:this.favoriteHouseIds(),isAlreadyFavorite:this.favoriteHouseIds().includes(houseId),isPending:this.pendingFavoriteAdds.has(houseId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Debounce: Prevent rapid clicks/exploits - if request is already pending, return early
    if (this.pendingFavoriteAdds.has(houseId)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:debounced',message:'Request debounced - already pending',data:{houseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Return a cached/duplicate response to prevent UI flicker
      return of({
        houseId: houseId,
        added: this.favoriteHouseIds().includes(houseId),
        message: 'Request already in progress'
      });
    }
    
    // Mark as pending
    this.pendingFavoriteAdds.set(houseId, true);
    
    // Backend expects no body (null) for POST /api/v1/houses/{id}/favorite
    // Note: debounceTime is not used here because we debounce at the request level (pending request tracking)
    // debounceTime on the response would delay the response, not prevent duplicate requests
    return this.apiService.post<FavoriteHouseResponse>(`houses/${houseId}/favorite`, null).pipe(
      map(response => {
        // Backend returns success: false with message for "already in favorites" case
        // Check the message to handle this gracefully
        if (response.success && response.data) {
          // On success, refresh favorites from backend to ensure sync
          // Don't optimistically update signal - let backend be the source of truth
          this.getFavoriteHouses().subscribe({
            next: (houses) => {
              // Signal is updated in getFavoriteHouses()
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:success-refresh',message:'Favorites refreshed after successful add',data:{houseId,housesReturned:houses.length,houseIds:houses.map(h=>h.id),isInList:houses.some(h=>h.id===houseId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
            }
          });
          return response.data;
        } else if (!response.success && response.message) {
          // Backend returned success: false with a message
          const message = response.message.toLowerCase();
          if (message.includes('already') || message.includes('already be in favorites')) {
            // Already in favorites - treat as success and ADD to favorites list
            // This ensures the UI shows it as favorited even if backend says it's already there
            const currentFavorites = this.favoriteHouseIds();
            if (!currentFavorites.includes(houseId)) {
              this.favoriteHouseIds.set([...currentFavorites, houseId]);
            }
            return {
              houseId: houseId,
              added: true, // Set to true so UI shows it as added
              message: 'Added to favorites'
            };
          }
        }
        throw new Error(response.message || 'Failed to add house to favorites');
      }),
      catchError(error => {
        // #region agent log
        const errorDetails = {
          houseId,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          errorBody: error.error,
          errorMessage: error.error?.message || error.error?.error?.message || error.message || '',
          errorCode: error.error?.error?.code || error.error?.code || '',
          errorSuccess: error.error?.success,
          fullError: JSON.stringify(error.error || {}).substring(0, 1000),
          currentFavorites: this.favoriteHouseIds(),
          errorType: typeof error.error,
          errorKeys: error.error ? Object.keys(error.error) : []
        };
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:catchError',message:'Error adding to favorites',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Handle 400 errors gracefully - backend returns success: false with message
        // Angular HttpClient throws 400 as error, so error.error contains the response body
        // #region agent log
        const conditionCheck = {
          status: error.status,
          statusIs400: error.status === 400,
          hasError: !!error.error,
          errorType: typeof error.error,
          errorIsNull: error.error === null,
          errorIsUndefined: error.error === undefined,
          errorKeys: error.error ? Object.keys(error.error) : [],
          errorValue: JSON.stringify(error.error || {}).substring(0, 200),
          conditionResult: error.status === 400 && error.error
        };
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:condition-check',message:'Checking 400 error condition',data:conditionCheck,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // More robust condition: check for 400 status and that error.error exists (can be object, string, or truthy value)
        if (error.status === 400 && (error.error !== null && error.error !== undefined)) {
          // Check if error.error is the ApiResponse structure
          const responseBody = error.error;
          const errorMessage = (responseBody.message || error.message || '').toLowerCase();
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:400-handler',message:'Processing 400 error',data:{houseId,errorMessage,messageIncludesAlready:errorMessage.includes('already'),messageIncludesAlreadyBeInFavorites:errorMessage.includes('already be in favorites'),messageIncludesMayNotExist:errorMessage.includes('may not exist or already be in favorites'),responseBody:JSON.stringify(responseBody).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
          // Check for "already in favorites" or "may not exist or already be in favorites"
          // The backend message is: "Failed to add house to favorites. House may not exist or already be in favorites."
          if (errorMessage.includes('already') || 
              errorMessage.includes('already be in favorites') ||
              errorMessage.includes('may not exist or already be in favorites')) {
            // Backend says "already in favorites" - refresh from backend to get actual state
            // Don't optimistically update signal - let backend be the source of truth
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:400-refresh',message:'Refreshing favorites from backend after 400',data:{houseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            // Refresh favorites list from backend to ensure sync
            this.getFavoriteHouses().subscribe({
              next: (houses) => {
                // Signal is updated in getFavoriteHouses()
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:refresh-complete',message:'Favorites refreshed from backend',data:{houseId,housesReturned:houses.length,houseIds:houses.map(h=>h.id),isInList:houses.some(h=>h.id===houseId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
              },
              error: (err) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:refresh-error',message:'Error refreshing favorites',data:{houseId,error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
              }
            });
            
            // Clear pending flag
            this.pendingFavoriteAdds.delete(houseId);
            return of({
              houseId: houseId,
              added: true, // Set to true so UI shows it as added
              message: 'Already in favorites'
            });
          }
          // If message doesn't match, it might be a different error (e.g., house doesn't exist)
          // Still log it but don't add to favorites
          console.warn('Favorites API returned 400 with unexpected message:', errorMessage);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:addHouseToFavorites:400-unexpected',message:'400 error with unexpected message',data:{houseId,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
        } else if (error.status !== 401 && error.status !== 403) {
          // Only log non-auth errors
          console.error('Error adding house to favorites:', error.status, error.statusText, error.error);
        }
        // Clear pending flag on error
        this.pendingFavoriteAdds.delete(houseId);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove house from favorites
   * Endpoint: DELETE /api/v1/houses/{id}/favorite
   */
  removeHouseFromFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites',message:'Removing house from favorites',data:{houseId,currentFavorites:this.favoriteHouseIds(),isInFavorites:this.favoriteHouseIds().includes(houseId),pendingAdds:Array.from(this.pendingFavoriteAdds.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL FIX: Clear pendingFavoriteAdds for this houseId to allow re-adding after removal
    this.pendingFavoriteAdds.delete(houseId);
    
    return this.apiService.delete<FavoriteHouseResponse>(`houses/${houseId}/favorite`).pipe(
      map(response => {
        // Backend returns success: false with message for "not in favorites" case
        if (response.success && response.data) {
          // Update favorite IDs signal
          const currentFavorites = this.favoriteHouseIds();
          this.favoriteHouseIds.set(currentFavorites.filter(id => id !== houseId));
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:success',message:'Successfully removed from favorites',data:{houseId,remainingFavorites:this.favoriteHouseIds().length,pendingAddsCleared:!this.pendingFavoriteAdds.has(houseId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          return response.data;
        } else if (!response.success && response.message) {
          // Backend returned success: false with a message
          const message = response.message.toLowerCase();
          if (message.includes('not be in favorites') || message.includes('may not be in favorites')) {
            // Not in favorites - treat as success (already removed)
            const currentFavorites = this.favoriteHouseIds();
            this.favoriteHouseIds.set(currentFavorites.filter(id => id !== houseId));
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:already-removed',message:'House already not in favorites',data:{houseId,remainingFavorites:this.favoriteHouseIds().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return {
              houseId: houseId,
              removed: false,
              message: 'Not in favorites'
            };
          }
        }
        throw new Error(response.message || 'Failed to remove house from favorites');
      }),
      catchError(error => {
        // #region agent log
        const errorDetails = {
          houseId,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          errorBody: error.error,
          errorMessage: error.error?.message || error.error?.error?.message || error.message || '',
          errorCode: error.error?.error?.code || error.error?.code || '',
          errorSuccess: error.error?.success,
          fullError: JSON.stringify(error.error || {}).substring(0, 1000),
          currentFavorites: this.favoriteHouseIds(),
          wasInFavorites: this.favoriteHouseIds().includes(houseId),
          errorType: typeof error.error,
          errorKeys: error.error ? Object.keys(error.error) : []
        };
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:catchError',message:'Error removing from favorites',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Handle 400 errors gracefully - backend returns success: false with message
        // Angular HttpClient throws 400 as error, so error.error contains the response body
        // #region agent log
        const conditionCheck = {
          status: error.status,
          statusIs400: error.status === 400,
          hasError: !!error.error,
          errorType: typeof error.error,
          errorIsNull: error.error === null,
          errorIsUndefined: error.error === undefined,
          errorKeys: error.error ? Object.keys(error.error) : [],
          errorValue: JSON.stringify(error.error || {}).substring(0, 200),
          conditionResult: error.status === 400 && (error.error !== null && error.error !== undefined)
        };
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:condition-check',message:'Checking 400 error condition',data:conditionCheck,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // More robust condition: check for 400 status and that error.error exists (can be object, string, or truthy value)
        if (error.status === 400 && (error.error !== null && error.error !== undefined)) {
          const responseBody = error.error;
          const errorMessage = (responseBody.message || error.message || '').toLowerCase();
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:400-handler',message:'Processing 400 error',data:{houseId,errorMessage,messageIncludesNotBeInFavorites:errorMessage.includes('not be in favorites'),messageIncludesMayNotBeInFavorites:errorMessage.includes('may not be in favorites'),messageIncludesMayNotExist:errorMessage.includes('may not exist or already be in favorites'),responseBody:JSON.stringify(responseBody).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
          if (errorMessage.includes('not be in favorites') || 
              errorMessage.includes('may not be in favorites') ||
              errorMessage.includes('may not exist or already be in favorites')) {
            // Backend says "not in favorites" - refresh from backend to get actual state
            // Don't optimistically update signal - let backend be the source of truth
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:400-refresh',message:'Refreshing favorites from backend after 400',data:{houseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            // Refresh favorites list from backend to ensure sync
            this.getFavoriteHouses().subscribe({
              next: (houses) => {
                // Signal is updated in getFavoriteHouses()
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:refresh-complete',message:'Favorites refreshed from backend',data:{houseId,housesReturned:houses.length,houseIds:houses.map(h=>h.id),isInList:houses.some(h=>h.id===houseId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
              },
              error: (err) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:refresh-error',message:'Error refreshing favorites',data:{houseId,error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
              }
            });
            
            // Clear pending flag
            this.pendingFavoriteRemoves.delete(houseId);
            
            return of({
              houseId: houseId,
              removed: true, // Set to true so UI shows it as removed
              message: 'Removed from favorites'
            });
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lottery.service.ts:removeHouseFromFavorites:400-unexpected',message:'400 error with unexpected message',data:{houseId,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
        } else if (error.status !== 401 && error.status !== 403) {
          console.error('Error removing house from favorites:', error.status, error.statusText, error.error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get personalized house recommendations
   * Endpoint: GET /api/v1/houses/recommendations
   */
  getRecommendations(limit?: number): Observable<HouseRecommendation[]> {
    const params = limit ? { limit } : undefined;
    return this.apiService.get<HouseRecommendation[]>('houses/recommendations', params).pipe(
      map(response => {
        if (response.success && response.data) {
          // Update recommendations signal
          this.recommendations.set(response.data);
          return response.data;
        }
        throw new Error('Failed to fetch recommendations');
      }),
      catchError(error => {
        console.error('Error fetching recommendations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user's active lottery entries
   * Endpoint: GET /api/v1/tickets/active
   */
  getUserActiveEntries(): Observable<LotteryTicketDto[]> {
    return this.apiService.get<LotteryTicketDto[]>('tickets/active').pipe(
      map(response => {
        if (response.success && response.data) {
          // Update active entries signal
          this.activeEntries.set(response.data);
          return response.data;
        }
        throw new Error('Failed to fetch active entries');
      }),
      catchError(error => {
        console.error('Error fetching active entries:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user's entry history with filters
   * Endpoint: GET /api/v1/tickets/history
   */
  getUserEntryHistory(filters?: EntryFilters): Observable<PagedEntryHistoryResponse> {
    return this.apiService.get<PagedEntryHistoryResponse>('tickets/history', filters).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch entry history');
      }),
      catchError(error => {
        console.error('Error fetching entry history:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user's lottery statistics and analytics
   * Endpoint: GET /api/v1/tickets/analytics
   */
  getLotteryAnalytics(): Observable<UserLotteryStats> {
    return this.apiService.get<UserLotteryStats>('tickets/analytics').pipe(
      map(response => {
        if (response.success && response.data) {
          // Update stats signal
          this.userLotteryStats.set(response.data);
          return response.data;
        }
        throw new Error('Failed to fetch lottery analytics');
      }),
      catchError(error => {
        console.error('Error fetching lottery analytics:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Quick entry into lottery from favorites
   * Endpoint: POST /api/v1/tickets/quick-entry
   */
  quickEntryFromFavorite(request: QuickEntryRequest): Observable<QuickEntryResponse> {
    return this.retryService.retryOnNetworkError(
      this.apiService.post<QuickEntryResponse>('tickets/quick-entry', request)
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Refresh active entries after quick entry
          this.getUserActiveEntries().subscribe();
          return response.data;
        }
        throw new Error('Failed to process quick entry');
      }),
      catchError(error => {
        console.error('Error processing quick entry:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Initialize lottery data from UserLotteryData
   * Called after login to populate state
   */
  initializeLotteryData(lotteryData: UserLotteryData): void {
    this.favoriteHouseIds.set(lotteryData.favoriteHouseIds || []);
    this.activeEntries.set(lotteryData.activeEntries || []);
    if (lotteryData.stats) {
      this.userLotteryStats.set(lotteryData.stats);
    }
    if (lotteryData.preferences) {
      // Preferences are handled by UserPreferencesService
      // This service only manages lottery-specific state
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

  /**
   * Get participant statistics for a house
   * Endpoint: GET /api/v1/houses/{id}/participants
   */
  getParticipantStats(houseId: string): Observable<LotteryParticipantStats> {
    return this.apiService.get<LotteryParticipantStats>(`houses/${houseId}/participants`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch participant stats');
      }),
      catchError(error => {
        console.error('Error fetching participant stats:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user can enter lottery
   * Endpoint: GET /api/v1/houses/{id}/can-enter
   */
  canEnterLottery(houseId: string): Observable<CanEnterLotteryResponse> {
    return this.retryService.retryOnNetworkError(
      this.apiService.get<CanEnterLotteryResponse>(`houses/${houseId}/can-enter`)
    ).pipe(
      map(response => {
        // Handle both ApiResponse<T> format and direct response format
        if (response.success && response.data) {
          return response.data;
        }
        // If response is already the data (direct format), check if it has required properties
        if (response && typeof response === 'object' && 'canEnter' in response) {
          const directResponse = response as any;
          // Ensure all required properties exist
          return {
            canEnter: directResponse.canEnter ?? true,
            isExistingParticipant: directResponse.isExistingParticipant ?? false,
            reason: directResponse.reason ?? 'Direct response format'
          } as CanEnterLotteryResponse;
        }
        // Default response if format is unexpected
        console.warn('Unexpected response format from can-enter endpoint, using defaults', response);
        return {
          canEnter: true,
          isExistingParticipant: false,
          reason: 'Unknown response format'
        };
      }),
      catchError(error => {
        // Only log if it's not a 200 status (which might be a format issue)
        if (error.status !== 200) {
          console.error('Error checking if user can enter lottery:', error);
        } else {
          // 200 status but wrong format - return default
          console.warn('can-enter returned 200 but unexpected format, using defaults', error);
          return of({
            canEnter: true,
            isExistingParticipant: false,
            reason: 'Response format error'
          });
        }
        // For other errors, return default to allow user to proceed
        return of({
          canEnter: true,
          isExistingParticipant: false,
          reason: 'Error checking entry status'
        });
      })
    );
  }

}