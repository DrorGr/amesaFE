import { Injectable, signal, inject } from '@angular/core';
import { Observable, throwError, Subscription, of, Subject } from 'rxjs';
import { map, catchError, tap, switchMap, takeUntil, take, mergeMap, finalize, filter } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
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
  UserGamificationDto,
  HouseRecommendation,
  EntryFilters,
  PagedEntryHistoryResponse,
  QuickEntryRequest,
  QuickEntryResponse,
  FavoriteHouseResponse,
  BulkFavoritesRequest,
  BulkFavoritesResponse,
  FavoritesAnalyticsDto
} from '../interfaces/lottery.interface';
import {
  LotteryParticipantStats,
  CanEnterLotteryResponse
} from '../interfaces/watchlist.interface';
import { RealtimeService, FavoriteUpdateEvent, EntryStatusChangeEvent, DrawReminderEvent, RecommendationEvent, InventoryUpdateEvent, CountdownUpdateEvent } from './realtime.service';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';

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
  private gamificationData = signal<UserGamificationDto | null>(null);
  
  // Debouncing for favorites operations (prevent rapid clicks/exploits)
  // Uses pending request tracking to prevent duplicate requests for the same house
  private pendingFavoriteAdds = new Map<string, boolean>();
  private pendingFavoriteRemoves = new Map<string, boolean>();
  
  // Debounce favorites refresh to prevent multiple simultaneous refresh calls
  private favoritesRefreshTimeout: any = null;
  
  // Caching for houses list
  private housesCache: { data: House[], timestamp: number } | null = null;
  private readonly HOUSES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HOUSES_LOCALSTORAGE_KEY = 'amesa_houses_cache';
  private readonly HOUSES_LOCALSTORAGE_TTL = 30 * 60 * 1000; // 30 minutes
  
  // Caching for individual houses
  private houseCache = new Map<string, { house: HouseDto, timestamp: number }>();
  private readonly HOUSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HOUSE_LOCALSTORAGE_PREFIX = 'amesa_house_';
  private readonly HOUSE_LOCALSTORAGE_TTL = 60 * 60 * 1000; // 1 hour
  
  // localStorage caching for user lottery data
  private readonly FAVORITES_LOCALSTORAGE_KEY = 'amesa_favorites_cache';
  private readonly FAVORITES_LOCALSTORAGE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly ACTIVE_ENTRIES_LOCALSTORAGE_KEY = 'amesa_active_entries_cache';
  private readonly ACTIVE_ENTRIES_LOCALSTORAGE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly USER_STATS_LOCALSTORAGE_KEY = 'amesa_user_stats_cache';
  private readonly USER_STATS_LOCALSTORAGE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly GAMIFICATION_LOCALSTORAGE_KEY = 'amesa_gamification_cache';
  private readonly GAMIFICATION_LOCALSTORAGE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // Guard to prevent duplicate house loading requests
  private isLoadingHouses = false;
  
  private realtimeService = inject(RealtimeService, { optional: true });
  private subscriptions = new Subscription();
  private retryService = inject(RetryService);
  private toastService = inject(ToastService);
  private translationService = inject(TranslationService);
  
  // Cleanup subject for managing subscriptions in root service
  private cleanup$ = new Subject<void>();
  
  private http = inject(HttpClient);
  
  constructor(private apiService: ApiService) {
    // REMOVED: Houses loading from constructor
    // Houses will be loaded on-demand when home component initializes
    // This prevents blocking app startup with unnecessary API calls
    
    // Setup SignalR subscriptions for real-time updates (FE-2.6)
    this.setupRealtimeSubscriptions();
  }
  
  /**
   * Ensure houses are loaded - call this when houses data is needed
   * Only loads if not already loaded or currently loading
   */
  public ensureHousesLoaded(): void {
    // Only load if not already loaded or loading
    if (this.houses().length === 0 && !this.isLoadingHouses) {
      this.loadHousesInternal();
    }
  }
  
  /**
   * Get loading state for houses data
   * Useful for components to show skeleton loaders
   * Note: Checking houses().length === 0 also works for skeleton display
   */
  public get isHousesLoading(): boolean {
    return this.isLoadingHouses;
  }
  
  /**
   * Cleanup method to be called before app shutdown or service destruction
   * Since services with providedIn: 'root' don't have ngOnDestroy, this must be called explicitly
   */
  cleanup(): void {
    this.cleanup$.next();
    this.cleanup$.complete();
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Setup SignalR subscriptions for real-time updates (FE-2.6)
   */
  private setupRealtimeSubscriptions(): void {
    if (!this.realtimeService) {
      return;
    }
    
    // Subscribe to favorite updates - use takeUntil for automatic cleanup
    const favoriteSub = this.realtimeService.favoriteUpdates$
      .pipe(takeUntil(this.cleanup$))
      .subscribe((event: FavoriteUpdateEvent) => {
        const currentFavorites = this.favoriteHouseIds();
        if (event.updateType === 'added' && !currentFavorites.includes(event.houseId)) {
          this.favoriteHouseIds.set([...currentFavorites, event.houseId]);
        } else if (event.updateType === 'removed') {
          this.favoriteHouseIds.set(currentFavorites.filter(id => id !== event.houseId));
        }
        
        // Invalidate cache
        this.safeInvalidateCache('favorites');
        this.safeInvalidateCache(`house:${event.houseId}`);
        // Invalidate gamification cache when favorite is added (points may have been awarded)
        if (event.updateType === 'added') {
          this.safeInvalidateCache('gamificationData');
        }
      });
    this.subscriptions.add(favoriteSub);
    
    // Subscribe to entry status changes - use takeUntil for automatic cleanup
    const entryStatusSub = this.realtimeService.entryStatusChanges$
      .pipe(takeUntil(this.cleanup$))
      .subscribe((event: EntryStatusChangeEvent) => {
        const currentEntries = this.activeEntries();
        const updatedEntries = currentEntries.map(entry => 
          entry.id === event.ticketId 
            ? { ...entry, status: event.newStatus }
            : entry
        );
        this.activeEntries.set(updatedEntries);
        
        // CRITICAL: Invalidate cache immediately (real-time data changed)
        this.safeInvalidateCache('activeEntries');
        this.safeInvalidateCache('userStats');
        // Invalidate gamification cache when entry status changes (points may have been awarded on win)
        if (event.newStatus === 'winner') {
          this.safeInvalidateCache('gamificationData');
        }
        
        // If entry won or refunded, also invalidate houses list
        if (event.newStatus === 'winner' || event.newStatus === 'refunded') {
          this.safeInvalidateCache('housesList');
        }
      });
    this.subscriptions.add(entryStatusSub);
    
    // Subscribe to draw reminders - use takeUntil for automatic cleanup
    const drawReminderSub = this.realtimeService.drawReminders$
      .pipe(takeUntil(this.cleanup$))
      .subscribe((event: DrawReminderEvent) => {
        console.log('Draw reminder:', event);
        const message = this.translationService.translate('lottery.drawReminder.message') || 
          `Draw for ${event.houseTitle} is starting soon!`;
        this.toastService.info(message, 5000);
      });
    this.subscriptions.add(drawReminderSub);
    
    // Subscribe to recommendations - use switchMap to prevent nested subscription leaks
    const recommendationSub = this.realtimeService.recommendations$
      .pipe(
        switchMap((event: RecommendationEvent) => {
          console.log('New recommendation:', event);
          const message = this.translationService.translate('lottery.recommendation.new') || 
            `New recommendation: ${event.houseTitle}`;
          this.toastService.info(message, 4000);
          // Refresh recommendations (switchMap automatically unsubscribes previous requests)
          return this.getRecommendations(10);
        }),
        takeUntil(this.cleanup$),
        catchError(error => {
          console.error('Error refreshing recommendations:', error);
          return of([]); // Return empty array on error to prevent stream breaking
        })
      )
      .subscribe();
    this.subscriptions.add(recommendationSub);
    
    // CRITICAL: Inventory updates - MUST invalidate house cache immediately
    // Ticket counts (ticketsSold, availableTickets) change in real-time
    const inventoryUpdateSub = this.realtimeService.inventoryUpdates$
      .pipe(takeUntil(this.cleanup$))
      .subscribe((event: InventoryUpdateEvent) => {
        // Invalidate house cache immediately (ticket counts changed)
        this.safeInvalidateCache(`house:${event.houseId}`);
        this.safeInvalidateCache('housesList');
        
        // Optional: Optimistically update in-memory cache to prevent UI flicker
        const cached = this.houseCache.get(event.houseId);
        if (cached) {
          try {
            cached.house.ticketsSold = event.soldTickets;
            // HouseDto has participationPercentage, update it
            if (cached.house.totalTickets > 0) {
              cached.house.participationPercentage = (event.soldTickets / cached.house.totalTickets) * 100;
            }
            // Update timestamp to prevent immediate re-fetch
            cached.timestamp = Date.now();
          } catch (error) {
            console.warn('Failed to optimistically update house cache:', error);
            // Still invalidate cache to ensure fresh data
            this.safeInvalidateCache(`house:${event.houseId}`);
          }
        }
        
        // Update houses list signal if house is in list (optimistic update)
        const houses = this.houses();
        const houseIndex = houses.findIndex(h => h.id === event.houseId);
        if (houseIndex >= 0) {
          try {
            const updatedHouses = [...houses];
            updatedHouses[houseIndex] = {
              ...updatedHouses[houseIndex],
              soldTickets: event.soldTickets
            };
            this.houses.set(updatedHouses);
          } catch (error) {
            console.warn('Failed to optimistically update houses signal:', error);
          }
        }
      });
    this.subscriptions.add(inventoryUpdateSub);

    // CRITICAL: Ticket purchased - invalidate house availability immediately
    const ticketPurchasedSub = this.realtimeService.generalEvents$
      .pipe(
        filter(event => event.type === 'ticket_purchased'),
        takeUntil(this.cleanup$)
      )
      .subscribe((event) => {
        const data = event.data;
        if (data?.houseId) {
          // Invalidate house cache (availability changed)
          this.safeInvalidateCache(`house:${data.houseId}`);
          this.safeInvalidateCache('housesList');
          
          // Also invalidate user data (safer - ensures fresh data for all users)
          // Note: If you want to optimize, you can check if data.userId matches current user
          // This requires injecting AuthService or getting current user ID
          this.safeInvalidateCache('activeEntries');
          this.safeInvalidateCache('userStats');
        }
      });
    this.subscriptions.add(ticketPurchasedSub);

    // Countdown updates - invalidate if house ended
    const countdownUpdateSub = this.realtimeService.countdownUpdates$
      .pipe(takeUntil(this.cleanup$))
      .subscribe((event: CountdownUpdateEvent) => {
        // Only invalidate if house ended (status change)
        if (event.isEnded) {
          this.safeInvalidateCache(`house:${event.houseId}`);
          this.safeInvalidateCache('housesList');
        }
      });
    this.subscriptions.add(countdownUpdateSub);

    // Lottery draw completed - invalidate all affected caches
    const drawCompletedSub = this.realtimeService.generalEvents$
      .pipe(
        filter(event => event.type === 'lottery_draw_completed'),
        takeUntil(this.cleanup$)
      )
      .subscribe((event) => {
        const data = event.data;
        if (data?.houseId) {
          // Draw completed - invalidate all affected caches
          this.safeInvalidateCache('housesList');
          this.safeInvalidateCache('activeEntries');
          this.safeInvalidateCache('userStats');
          this.safeInvalidateCache(`house:${data.houseId}`);
          
          // Reload immediately (critical data)
          this.reloadActiveEntries();
          this.reloadUserStats();
        }
      });
    this.subscriptions.add(drawCompletedSub);

    // Lottery draw started - invalidate house cache (status might change)
    const drawStartedSub = this.realtimeService.generalEvents$
      .pipe(
        filter(event => event.type === 'lottery_draw_started'),
        takeUntil(this.cleanup$)
      )
      .subscribe((event) => {
        const data = event.data;
        if (data?.houseId) {
          // Draw started - invalidate house cache (status might change)
          this.safeInvalidateCache('housesList');
          this.safeInvalidateCache(`house:${data.houseId}`);
        }
      });
    this.subscriptions.add(drawStartedSub);
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
    const now = Date.now();
    
    // Check localStorage cache first (persists across page refreshes)
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.HOUSES_LOCALSTORAGE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.timestamp && (now - cacheData.timestamp) < this.HOUSES_LOCALSTORAGE_TTL) {
            // Use cached data
            this.houses.set(cacheData.data);
            this.housesCache = { data: cacheData.data, timestamp: cacheData.timestamp };
            return;
          }
        }
      } catch (e) {
        // Invalid cache, continue to in-memory cache check
        console.warn('Failed to load houses from localStorage cache:', e);
      }
    }
    
    // Check in-memory cache (faster, but lost on refresh)
    if (this.housesCache && (now - this.housesCache.timestamp) < this.HOUSES_CACHE_TTL) {
      this.houses.set(this.housesCache.data);
      return; // Use cached data
    }
    
    // CRITICAL: Prevent duplicate requests if already loading
    // This prevents multiple simultaneous requests that can cause hanging
    if (this.isLoadingHouses) {
      return; // Already loading, don't make duplicate request
    }
    
    this.isLoadingHouses = true;
    
    this.getHousesFromApi().pipe(
      take(1), // Auto-unsubscribe after first emission to prevent memory leaks
      finalize(() => {
        // Reset flag when request completes (success or error)
        this.isLoadingHouses = false;
      })
    ).subscribe({
      next: (response) => {
        // Convert HouseDto to House format
        const houses: House[] = response.items.map(dto => this.convertHouseDtoToHouse(dto));
        this.houses.set(houses);
        
        // Update in-memory cache
        const timestamp = Date.now();
        this.housesCache = { data: houses, timestamp };
        
        // Save to localStorage for persistence
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(this.HOUSES_LOCALSTORAGE_KEY, JSON.stringify({
              data: houses,
              timestamp: timestamp
            }));
          } catch (e) {
            // localStorage quota exceeded - non-critical, continue with in-memory cache
            console.warn('Failed to cache houses to localStorage:', e);
          }
        }
      },
      error: (error) => {
        console.error('Failed to load houses:', error);
        // Set empty array on error
        this.houses.set([]);
      }
    });
  }
  
  /**
   * Force refresh houses from API (bypasses cache)
   */
  refreshHouses(): void {
    // Clear both in-memory and localStorage caches
    this.clearHousesCache();
    this.loadHousesInternal();
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
    const now = Date.now();
    
    // Check localStorage cache first (persists across page refreshes)
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`${this.HOUSE_LOCALSTORAGE_PREFIX}${id}`);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.timestamp && (now - cacheData.timestamp) < this.HOUSE_LOCALSTORAGE_TTL) {
            // Use cached data
            const houseDto = cacheData.house as HouseDto;
            // Also update in-memory cache
            this.houseCache.set(id, { house: houseDto, timestamp: cacheData.timestamp });
            return of(houseDto);
          }
        }
      } catch (e) {
        // Invalid cache, continue to in-memory cache check
        console.warn(`Failed to load house ${id} from localStorage cache:`, e);
      }
    }
    
    // Check in-memory cache (faster, but lost on refresh)
    const cached = this.houseCache.get(id);
    if (cached && (now - cached.timestamp) < this.HOUSE_CACHE_TTL) {
      return of(cached.house);
    }
    
    return this.retryService.retryOnNetworkError(
      this.apiService.get<HouseDto>(`houses/${id}`)
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Update in-memory cache
          const timestamp = Date.now();
          this.houseCache.set(id, { house: response.data, timestamp });
          
          // Save to localStorage for persistence
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(`${this.HOUSE_LOCALSTORAGE_PREFIX}${id}`, JSON.stringify({
                house: response.data,
                timestamp: timestamp
              }));
            } catch (e) {
              // localStorage quota exceeded - non-critical, continue with in-memory cache
              console.warn(`Failed to cache house ${id} to localStorage:`, e);
            }
          }
          
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
  
  /**
   * Clear cache for a specific house (in-memory and localStorage)
   */
  clearHouseCache(id: string): void {
    // Clear in-memory cache
    this.houseCache.delete(id);
    
    // Clear localStorage cache
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${this.HOUSE_LOCALSTORAGE_PREFIX}${id}`);
    }
  }
  
  /**
   * Clear houses list cache (in-memory and localStorage)
   */
  private clearHousesCache(): void {
    // Clear in-memory cache
    this.housesCache = null;
    
    // Clear localStorage cache
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.HOUSES_LOCALSTORAGE_KEY);
    }
  }
  
  /**
   * Clear all house caches
   */
  clearAllHouseCaches(): void {
    this.houseCache.clear();
    this.housesCache = null;
    
    // Clear all house localStorage caches
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.HOUSES_LOCALSTORAGE_KEY);
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.HOUSE_LOCALSTORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
  
  /**
   * Invalidate specific cache or all caches
   * @param cacheKey - Cache key to invalidate ('favorites', 'activeEntries', 'userStats', 'gamificationData', 'housesList', 'house:{id}', or '*' for all)
   */
  private invalidateCache(cacheKey: string): void {
    // Handle wildcard - clear all caches
    if (cacheKey === '*') {
      this.clearAllCaches();
      return;
    }
    
    // Handle specific cache types
    switch (cacheKey) {
      case 'favorites':
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.FAVORITES_LOCALSTORAGE_KEY);
        }
        break;
      case 'activeEntries':
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.ACTIVE_ENTRIES_LOCALSTORAGE_KEY);
        }
        break;
      case 'userStats':
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.USER_STATS_LOCALSTORAGE_KEY);
        }
        break;
      case 'gamificationData':
        // Clear gamification signal (no localStorage cache for gamification, only signal)
        this.gamificationData.set(null);
        break;
      case 'housesList':
        this.clearHousesCache();
        break;
      default:
        // Handle house:{houseId} pattern
        if (cacheKey.startsWith('house:')) {
          const houseId = cacheKey.replace('house:', '');
          this.clearHouseCache(houseId);
        }
        break;
    }
  }
  
  /**
   * Clear all caches (in-memory and localStorage)
   */
  private clearAllCaches(): void {
    // Clear in-memory caches
    this.housesCache = null;
    this.houseCache.clear();
    
    // Clear localStorage caches
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.HOUSES_LOCALSTORAGE_KEY);
      localStorage.removeItem(this.FAVORITES_LOCALSTORAGE_KEY);
      localStorage.removeItem(this.ACTIVE_ENTRIES_LOCALSTORAGE_KEY);
      localStorage.removeItem(this.USER_STATS_LOCALSTORAGE_KEY);
      
      // Clear all house caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.HOUSE_LOCALSTORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
  
  /**
   * Clear all user-specific caches (not houses list)
   * Used on login to clear old user data
   */
  clearAllUserCaches(): void {
    // Clear user-specific caches (not houses list)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.FAVORITES_LOCALSTORAGE_KEY);
      localStorage.removeItem(this.ACTIVE_ENTRIES_LOCALSTORAGE_KEY);
      localStorage.removeItem(this.USER_STATS_LOCALSTORAGE_KEY);
    }
    // Signals are already cleared by clearLotteryData()
    // Note: gamificationData is cleared in clearLotteryData()
  }
  
  /**
   * Safe cache invalidation wrapper
   * Logs errors but doesn't throw - cache invalidation failure shouldn't break app
   */
  private safeInvalidateCache(cacheKey: string): void {
    try {
      this.invalidateCache(cacheKey);
    } catch (error) {
      // Log error but don't throw - cache invalidation failure shouldn't break app
      console.warn(`Failed to invalidate cache: ${cacheKey}`, error);
    }
  }
  
  /**
   * Reload active entries immediately (for critical updates)
   */
  private reloadActiveEntries(): void {
    this.getUserActiveEntries().pipe(take(1)).subscribe({
      error: (error) => {
        console.warn('Failed to reload active entries:', error);
      }
    });
  }
  
  /**
   * Reload user stats immediately (for critical updates)
   */
  private reloadUserStats(): void {
    this.getLotteryAnalytics().pipe(take(1)).subscribe({
      error: (error) => {
        console.warn('Failed to reload user stats:', error);
      }
    });
  }
  
  /**
   * Handle house status changes - invalidate caches when status changes significantly
   */
  private handleHouseStatusChange(houseId: string, oldStatus: string, newStatus: string): void {
    // If status changed significantly (active -> ended, etc.), invalidate caches
    if (oldStatus !== newStatus) {
      this.safeInvalidateCache('housesList');
      this.safeInvalidateCache(`house:${houseId}`);
      
      // If house ended, also invalidate user data (entries might have changed)
      if (newStatus === 'ended' || newStatus === 'completed') {
        this.safeInvalidateCache('activeEntries');
        this.safeInvalidateCache('userStats');
      }
    }
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
    originalCost: number;
    discountAmount: number;
    promotionCode?: string;
    ticketNumbers: string[];
    transactionId: string;
  }> {
    // Backend expects Quantity, PaymentMethodId, and optional PromotionCode in the request body
    // houseId is in the URL path, not the body
    const requestBody: any = {
      quantity: purchaseRequest.quantity,
      paymentMethodId: purchaseRequest.paymentMethodId && purchaseRequest.paymentMethodId !== 'default' 
        ? purchaseRequest.paymentMethodId 
        : '00000000-0000-0000-0000-000000000000' // Use empty Guid if "default" or invalid
    };
    
    // Add promotion code if provided
    if (purchaseRequest.promotionCode && purchaseRequest.promotionCode.trim()) {
      requestBody.promotionCode = purchaseRequest.promotionCode.trim();
    }
    
    return this.apiService.post(`houses/${purchaseRequest.houseId}/tickets/purchase`, requestBody).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          
          // Invalidate caches (critical data changed)
          this.safeInvalidateCache('activeEntries');
          this.safeInvalidateCache('userStats');
          this.safeInvalidateCache('gamificationData'); // Points may have been awarded
          this.safeInvalidateCache('housesList');
          this.safeInvalidateCache(`house:${purchaseRequest.houseId}`);
          
          return {
            ticketsPurchased: data.ticketsPurchased,
            totalCost: data.totalCost || data.totalCost, // Final cost after discount
            originalCost: data.originalCost || data.totalCost, // Cost before discount (fallback to totalCost if not provided)
            discountAmount: data.discountAmount || 0, // Discount applied
            promotionCode: data.promotionCode, // Promotion code used (if any)
            ticketNumbers: data.ticketNumbers || [],
            transactionId: data.transactionId || ''
          };
        }
        throw new Error('Failed to purchase tickets');
      }),
      catchError(error => {
        // Suppress errors for 200 status (response format issues, not actual errors)
        if (error?.status !== 200) {
          console.error('Error purchasing tickets:', error);
        }
        return throwError(() => error);
      })
    );
  }

  // Get user's tickets
  // Endpoint: GET /api/v1/tickets
  getUserTicketsFromApi(): Observable<LotteryTicketDto[]> {
    return this.apiService.get<LotteryTicketDto[]>('tickets').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user tickets');
      }),
      catchError(error => {
        console.error('getUserTicketsFromApi error:', error);
        return throwError(() => error);
      })
    );
  }

  // Get lottery draws
  // Endpoints: GET /api/v1/draws, /api/v1/draws/{id}, /api/v1/draws/{id}/participants
  getLotteryDraws(params?: any): Observable<any[]> {
    return this.apiService.get<any[]>('draws', params).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('getLotteryDraws error:', error);
        return throwError(() => error);
      })
    );
  }

  getTicketById(id: string): Observable<LotteryTicketDto> {
    return this.apiService.get<LotteryTicketDto>(`tickets/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch ticket');
      }),
      catchError(error => {
        console.error('Error fetching ticket:', error);
        return throwError(() => error);
      })
    );
  }

  getActiveTickets(filters?: { status?: string; houseId?: string }): Observable<LotteryTicketDto[]> {
    const params = filters || {};
    return this.apiService.get<LotteryTicketDto[]>('tickets/active', params).pipe(
      map(response => {
        if (response.success && response.data) {
          this.userTickets.set(response.data);
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch active tickets');
      }),
      catchError(error => {
        console.error('Error fetching active tickets:', error);
        return throwError(() => error);
      })
    );
  }

  getTicketHistory(filters?: { 
    status?: string; 
    houseId?: string; 
    fromDate?: Date; 
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Observable<PagedResponse<LotteryTicketDto>> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.houseId) params.houseId = filters.houseId;
    if (filters?.fromDate) params.fromDate = filters.fromDate.toISOString();
    if (filters?.toDate) params.toDate = filters.toDate.toISOString();
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    return this.apiService.get<PagedResponse<LotteryTicketDto>>('tickets/history', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch ticket history');
      }),
      catchError(error => {
        console.error('Error fetching ticket history:', error);
        return throwError(() => error);
      })
    );
  }

  getDrawById(id: string): Observable<any> {
    return this.apiService.get<any>(`draws/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch draw');
      }),
      catchError(error => {
        console.error('Error fetching draw:', error);
        return throwError(() => error);
      })
    );
  }

  getDrawParticipants(id: string): Observable<any[]> {
    return this.apiService.get<any[]>(`draws/${id}/participants`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch draw participants');
      }),
      catchError(error => {
        console.error('Error fetching draw participants:', error);
        return throwError(() => error);
      })
    );
  }

  getLotteryDrawById(drawId: string): Observable<any> {
    return this.apiService.get<any>(`draws/${drawId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch draw details');
      }),
      catchError(error => {
        console.error('getLotteryDrawById error:', error);
        return throwError(() => error);
      })
    );
  }

  getLotteryDrawParticipants(drawId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`draws/${drawId}/participants`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('getLotteryDrawParticipants error:', error);
        return throwError(() => error);
      })
    );
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
      lotteryStartDate: houseDto.lotteryStartDate ? new Date(houseDto.lotteryStartDate) : undefined,
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
    this.getHousesFromApi(params).pipe(
      take(1) // Auto-unsubscribe after first emission to prevent memory leaks
    ).subscribe({
      next: (pagedResponse) => {
        const houses = pagedResponse.items.map((houseDto: HouseDto) => this.convertHouseDtoToHouse(houseDto));
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
  /**
   * Get user's favorite houses with pagination and sorting
   * @param options Pagination and sorting options
   * @returns Observable of paginated favorite houses
   */
  getFavoriteHouses(options?: {
    page?: number;
    limit?: number;
    sortBy?: 'dateadded' | 'price' | 'location' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Observable<PagedResponse<HouseDto>> {
    const params: any = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.sortBy) params.sortBy = options.sortBy;
    if (options?.sortOrder) params.sortOrder = options.sortOrder;
    
    // Load from API with pagination
    return this.apiService.get<PagedResponse<HouseDto>>('houses/favorites', params).pipe(
      map(response => {
        if (response.success && response.data) {
          // Update favorite IDs signal from all items (for backward compatibility)
          const favoriteIds = response.data.items.map((house: HouseDto) => house.id);
          const currentIds = this.favoriteHouseIds();
          
          // Only update signal if IDs actually changed (prevents infinite loops)
          const currentIdsStr = currentIds.sort().join(',');
          const newIdsStr = favoriteIds.sort().join(',');
          if (currentIdsStr !== newIdsStr) {
            // Only update if we're on first page or no pagination (backward compatibility)
            if (!options?.page || options.page === 1) {
              this.favoriteHouseIds.set(favoriteIds);
            }
          }
          
          // Save to localStorage (only for first page, backward compatibility)
          if ((!options?.page || options.page === 1) && typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(this.FAVORITES_LOCALSTORAGE_KEY, JSON.stringify({
                data: response.data.items,
                favoriteIds: favoriteIds,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.warn('Failed to cache favorites to localStorage:', e);
            }
          }
          
          return response.data;
        }
        
        throw new Error('Failed to fetch favorite houses');
      }),
      catchError(error => {
        console.error('Error fetching favorite houses:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Get all favorite houses (backward compatibility - no pagination)
   * @deprecated Use getFavoriteHouses() with pagination instead
   * Note: Limited to 100 items due to API pagination limit. For more items, use getFavoriteHouses() with pagination.
   */
  getFavoriteHousesAll(): Observable<HouseDto[]> {
    return this.getFavoriteHouses({ page: 1, limit: 100 }).pipe(
      map(pagedResponse => pagedResponse.items)
    );
  }
  
  /**
   * Get count of user's favorite houses
   * @returns Observable of favorite houses count
   */
  getFavoriteHousesCount(): Observable<number> {
    return this.apiService.get<{ count: number }>('houses/favorites/count').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.count;
        }
        return 0;
      }),
      catchError(error => {
        console.error('Error fetching favorites count:', error);
        return of(0);
      })
    );
  }
  
  /**
   * Debounced refresh of favorites from backend
   * Prevents multiple simultaneous refresh calls
   */
  private debouncedRefreshFavorites(): void {
    if (this.favoritesRefreshTimeout) {
      clearTimeout(this.favoritesRefreshTimeout);
    }
    this.favoritesRefreshTimeout = setTimeout(() => {
      // Use backward compatibility method to get all favorites for refresh
      this.getFavoriteHousesAll().pipe(
        take(1) // Auto-unsubscribe after first emission to prevent memory leaks
      ).subscribe({
        next: (houses: HouseDto[]) => {
          // Update favorite IDs signal
          const favoriteIds = houses.map((house: HouseDto) => house.id);
          this.favoriteHouseIds.set(favoriteIds);
        },
        error: (error) => {
          console.error('Error refreshing favorites:', error);
        }
      });
      this.favoritesRefreshTimeout = null;
    }, 300); // 300ms debounce
  }

  /**
   * Toggle favorite status for a house
   * Adds if not favorited, removes if already favorited
   * Endpoint: POST /api/v1/houses/{id}/favorite or DELETE /api/v1/houses/{id}/favorite
   * Note: Backend endpoint is implemented and working
   */
  toggleFavorite(houseId: string): Observable<FavoriteHouseResponse> {
    if (this.isFavorite(houseId)) {
      return this.removeHouseFromFavorites(houseId);
    } else {
      return this.addHouseToFavorites(houseId);
    }
  }

  /**
   * Generate idempotency key for favorites operations
   * Ensures duplicate requests are handled gracefully by the backend
   */
  private generateIdempotencyKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    // Use crypto.randomUUID if available for better uniqueness, otherwise fallback
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${timestamp}-${random}-${Math.random().toString(36).substring(2, 9)}`;
    // Backend limit is 128 chars
    return uuid.substring(0, 128);
  }
  
  /**
   * Parse rate limit headers from HTTP response
   * @param headers HTTP headers from error response
   * @returns Rate limit information or null if headers not present
   */
  private parseRateLimitHeaders(headers: HttpHeaders): { limit: number; remaining: number; reset: Date } | null {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    
    if (limit && remaining && reset) {
      try {
        return {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: new Date(reset)
        };
      } catch (e) {
        console.warn('Failed to parse rate limit headers:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Add house to favorites
   * Endpoint: POST /api/v1/houses/{id}/favorite
   * Debounced to prevent rapid clicks/exploits (500ms debounce)
   * Supports idempotency via Idempotency-Key header
   */
  addHouseToFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // Debounce: Prevent rapid clicks/exploits - if request is already pending, return early
    if (this.pendingFavoriteAdds.has(houseId)) {
      // Return a cached/duplicate response to prevent UI flicker
      return of({
        houseId: houseId,
        added: this.favoriteHouseIds().includes(houseId),
        message: 'Request already in progress'
      });
    }
    
    // Mark as pending
    this.pendingFavoriteAdds.set(houseId, true);
    
    // Generate idempotency key to prevent duplicate operations on network retries
    const idempotencyKey = this.generateIdempotencyKey();
    
    // Backend expects no body (null) for POST /api/v1/houses/{id}/favorite
    // Note: debounceTime is not used here because we debounce at the request level (pending request tracking)
    // debounceTime on the response would delay the response, not prevent duplicate requests
    return this.apiService.post<FavoriteHouseResponse>(
      `houses/${houseId}/favorite`, 
      null,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ).pipe(
      map(response => {
        // Backend returns success: false with message for "already in favorites" case
        // Check the message to handle this gracefully
        if (response.success && response.data) {
          // Optimistically update signal for immediate UI feedback
          const currentFavorites = this.favoriteHouseIds();
          if (!currentFavorites.includes(houseId)) {
            this.favoriteHouseIds.set([...currentFavorites, houseId]);
          }
          
          // Invalidate caches
          this.safeInvalidateCache('favorites');
          this.safeInvalidateCache(`house:${houseId}`);
          
          // Refresh from backend in background to ensure sync (debounced)
          this.debouncedRefreshFavorites();
          return response.data;
        } else if (!response.success && response.message) {
          // Backend returned success: false with a message
          const message = response.message.toLowerCase();
          if (message.includes('already') || message.includes('already be in favorites')) {
            // Already in favorites - optimistically update signal
            const currentFavorites = this.favoriteHouseIds();
            if (!currentFavorites.includes(houseId)) {
              this.favoriteHouseIds.set([...currentFavorites, houseId]);
            }
            // No refresh needed - already in favorites, state is correct
            
            // Clear pending flag before returning
            this.pendingFavoriteAdds.delete(houseId);
            
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
        // Handle 400 errors gracefully - backend returns success: false with message
        // Angular HttpClient throws 400 as error, so error.error contains the response body
        if (error.status === 400 && (error.error !== null && error.error !== undefined)) {
          // Check if error.error is the ApiResponse structure
          const responseBody = error.error;
          const errorMessage = (responseBody.message || error.message || '').toLowerCase();
          
          // Check for "already in favorites" or "may not exist or already be in favorites"
          // The backend message is: "Failed to add house to favorites. House may not exist or already be in favorites."
          if (errorMessage.includes('already') || 
              errorMessage.includes('already be in favorites') ||
              errorMessage.includes('may not exist or already be in favorites')) {
            // Backend says "already in favorites" - optimistically update signal
            const currentFavorites = this.favoriteHouseIds();
            if (!currentFavorites.includes(houseId)) {
              this.favoriteHouseIds.set([...currentFavorites, houseId]);
            }
            // No refresh needed - already in favorites, state is correct
            
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
   * Supports idempotency via Idempotency-Key header
   */
  removeHouseFromFavorites(houseId: string): Observable<FavoriteHouseResponse> {
    // Debounce: Prevent rapid clicks/exploits - if request is already pending, return early
    if (this.pendingFavoriteRemoves.has(houseId)) {
      // Return a cached/duplicate response to prevent UI flicker
      return of({
        houseId: houseId,
        removed: !this.favoriteHouseIds().includes(houseId),
        message: 'Request already in progress'
      });
    }
    
    // CRITICAL FIX: Clear pendingFavoriteAdds for this houseId to allow re-adding after removal
    this.pendingFavoriteAdds.delete(houseId);
    
    // Mark as pending
    this.pendingFavoriteRemoves.set(houseId, true);
    
    // Generate idempotency key to prevent duplicate operations on network retries
    const idempotencyKey = this.generateIdempotencyKey();
    
    return this.apiService.delete<FavoriteHouseResponse>(
      `houses/${houseId}/favorite`,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ).pipe(
      map(response => {
        // Backend returns success: false with message for "not in favorites" case
        if (response.success && response.data) {
          // Update favorite IDs signal
          const currentFavorites = this.favoriteHouseIds();
          this.favoriteHouseIds.set(currentFavorites.filter(id => id !== houseId));
          
          // Invalidate caches
          this.safeInvalidateCache('favorites');
          this.safeInvalidateCache(`house:${houseId}`);
          
          // Clear pending flag on success
          this.pendingFavoriteRemoves.delete(houseId);
          
          return response.data;
        } else if (!response.success && response.message) {
          // Backend returned success: false with a message
          const message = response.message.toLowerCase();
          if (message.includes('not be in favorites') || message.includes('may not be in favorites')) {
            // Not in favorites - treat as success (already removed)
            const currentFavorites = this.favoriteHouseIds();
            this.favoriteHouseIds.set(currentFavorites.filter(id => id !== houseId));
            
            // Clear pending flag before returning
            this.pendingFavoriteRemoves.delete(houseId);
            
            return {
              houseId: houseId,
              removed: false,
              message: 'Not in favorites'
            };
          }
        }
        throw new Error(response.message || 'Failed to remove house from favorites');
      }),
      catchError((error: HttpErrorResponse | any) => {
        // Handle rate limit errors (429)
        if (error.status === 429) {
          const headers = error instanceof HttpErrorResponse ? error.headers : null;
          const rateLimitInfo = headers ? this.parseRateLimitHeaders(headers) : null;
          const resetTime = rateLimitInfo?.reset 
            ? new Date(rateLimitInfo.reset).toLocaleTimeString()
            : 'soon';
          
          this.toastService.error(
            `Rate limit exceeded. Please try again after ${resetTime}`,
            5000
          );
          this.pendingFavoriteRemoves.delete(houseId);
          return throwError(() => error);
        }
        
        // Handle 400 errors gracefully - backend returns success: false with message
        // Angular HttpClient throws 400 as error, so error.error contains the response body
        if (error.status === 400 && (error.error !== null && error.error !== undefined)) {
          const responseBody = error.error;
          const errorMessage = (responseBody.message || error.message || '').toLowerCase();
          
          if (errorMessage.includes('not be in favorites') || 
              errorMessage.includes('may not be in favorites') ||
              errorMessage.includes('may not exist or already be in favorites')) {
            // Backend says "not in favorites" - optimistically update signal
            const currentFavorites = this.favoriteHouseIds();
            this.favoriteHouseIds.set(currentFavorites.filter(id => id !== houseId));
            // No refresh needed - not in favorites, state is correct
            
            // Clear pending flag
            this.pendingFavoriteRemoves.delete(houseId);
            
            return of({
              houseId: houseId,
              removed: true, // Set to true so UI shows it as removed
              message: 'Removed from favorites'
            });
          }
        } else if (error.status !== 401 && error.status !== 403) {
          console.error('Error removing house from favorites:', error.status, error.statusText, error.error);
        }
        // Clear pending flag on error
        this.pendingFavoriteRemoves.delete(houseId);
        return throwError(() => error);
      })
    );
  }

  /**
   * Bulk add houses to favorites
   * Endpoint: POST /api/v1/houses/favorites/bulk
   * @param houseIds Array of house IDs to add (max 50)
   * @returns Observable of bulk operation result
   */
  bulkAddFavorites(houseIds: string[]): Observable<BulkFavoritesResponse> {
    if (houseIds.length === 0) {
      return throwError(() => new Error('House IDs list cannot be empty'));
    }
    if (houseIds.length > 50) {
      return throwError(() => new Error('Maximum 50 house IDs allowed per request'));
    }
    
    const request: BulkFavoritesRequest = { houseIds };
    
    return this.apiService.post<BulkFavoritesResponse>('houses/favorites/bulk', request).pipe(
      map(response => {
        if (response.success && response.data) {
          // Update favorite IDs signal with successfully added houses
          const currentFavorites = this.favoriteHouseIds();
          const newFavorites = [...currentFavorites];
          response.data.successfulHouseIds.forEach(id => {
            if (!newFavorites.includes(id)) {
              newFavorites.push(id);
            }
          });
          this.favoriteHouseIds.set(newFavorites);
          
          // Invalidate caches
          this.safeInvalidateCache('favorites');
          
          // Refresh from backend in background to ensure sync (debounced)
          this.debouncedRefreshFavorites();
          
          return response.data;
        }
        throw new Error(response.message || 'Failed to bulk add favorites');
      }),
      catchError((error: HttpErrorResponse | any) => {
        // Handle rate limit errors (429)
        if (error.status === 429) {
          const headers = error instanceof HttpErrorResponse ? error.headers : null;
          const rateLimitInfo = headers ? this.parseRateLimitHeaders(headers) : null;
          const resetTime = rateLimitInfo?.reset 
            ? new Date(rateLimitInfo.reset).toLocaleTimeString()
            : 'soon';
          
          this.toastService.error(
            `Rate limit exceeded. Please try again after ${resetTime}`,
            5000
          );
          return throwError(() => error);
        }
        
        console.error('Error bulk adding favorites:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Bulk remove houses from favorites
   * Endpoint: DELETE /api/v1/houses/favorites/bulk
   * @param houseIds Array of house IDs to remove (max 50)
   * @returns Observable of bulk operation result
   */
  bulkRemoveFavorites(houseIds: string[]): Observable<BulkFavoritesResponse> {
    if (houseIds.length === 0) {
      return throwError(() => new Error('House IDs list cannot be empty'));
    }
    if (houseIds.length > 50) {
      return throwError(() => new Error('Maximum 50 house IDs allowed per request'));
    }
    
    const request: BulkFavoritesRequest = { houseIds };
    
    // Backend expects DELETE with body
    return this.apiService.delete<BulkFavoritesResponse>('houses/favorites/bulk', { 
      body: request,
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Update favorite IDs signal by removing successfully removed houses
          const currentFavorites = this.favoriteHouseIds();
          const removedIds = new Set(response.data.successfulHouseIds);
          this.favoriteHouseIds.set(currentFavorites.filter(id => !removedIds.has(id)));
          
          // Invalidate caches
          this.safeInvalidateCache('favorites');
          
          return response.data;
        }
        throw new Error(response.message || 'Failed to bulk remove favorites');
      }),
      catchError((error: HttpErrorResponse | any) => {
        // Handle rate limit errors (429)
        if (error.status === 429) {
          const headers = error instanceof HttpErrorResponse ? error.headers : null;
          const rateLimitInfo = headers ? this.parseRateLimitHeaders(headers) : null;
          const resetTime = rateLimitInfo?.reset 
            ? new Date(rateLimitInfo.reset).toLocaleTimeString()
            : 'soon';
          
          this.toastService.error(
            `Rate limit exceeded. Please try again after ${resetTime}`,
            5000
          );
          return throwError(() => error);
        }
        
        console.error('Error bulk removing favorites:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get favorites analytics
   * Endpoint: GET /api/v1/houses/favorites/analytics
   * @returns Observable of favorites analytics data
   */
  getFavoritesAnalytics(): Observable<FavoritesAnalyticsDto> {
    return this.apiService.get<FavoritesAnalyticsDto>('houses/favorites/analytics').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch favorites analytics');
      }),
      catchError((error: HttpErrorResponse | any) => {
        // Handle rate limit errors (429)
        if (error.status === 429) {
          const headers = error instanceof HttpErrorResponse ? error.headers : null;
          const rateLimitInfo = headers ? this.parseRateLimitHeaders(headers) : null;
          const resetTime = rateLimitInfo?.reset 
            ? new Date(rateLimitInfo.reset).toLocaleTimeString()
            : 'soon';
          
          this.toastService.error(
            `Rate limit exceeded. Please try again after ${resetTime}`,
            5000
          );
        }
        console.error('Error fetching favorites analytics:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Export user's favorites as CSV or JSON
   * Endpoint: GET /api/v1/houses/favorites/export?format=csv|json
   * @param format Export format: 'csv' or 'json' (default: 'json')
   * @returns Observable that triggers file download
   */
  exportFavorites(format: 'csv' | 'json' = 'json'): Observable<Blob> {
    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return throwError(() => new Error('Invalid export format. Only "csv" or "json" are supported.'));
    }

    const baseUrl = environment.backendUrl || '/api/v1';
    const url = `${baseUrl}/houses/favorites/export?format=${format}`;
    
    // Get auth token for headers
    const token = localStorage.getItem('access_token');
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get(url, {
      headers: httpHeaders,
      responseType: 'blob'
    }).pipe(
      map(blob => {
        // Trigger download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `favorites_${timestamp}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        return blob;
      }),
      catchError((error: HttpErrorResponse | any) => {
        // Handle rate limit errors (429)
        if (error.status === 429) {
          const headers = error instanceof HttpErrorResponse ? error.headers : null;
          const rateLimitInfo = headers ? this.parseRateLimitHeaders(headers) : null;
          const resetTime = rateLimitInfo?.reset 
            ? new Date(rateLimitInfo.reset).toLocaleTimeString()
            : 'soon';
          
          this.toastService.error(
            `Rate limit exceeded. Please try again after ${resetTime}`,
            5000
          );
        } else if (error.status === 404) {
          this.toastService.error('No favorites found to export.');
        } else if (error.status === 400) {
          this.toastService.error('Export limit exceeded. You have too many favorites to export at once.');
        }
        console.error('Error exporting favorites:', error);
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
    const now = Date.now();
    
    // Check localStorage cache first
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.ACTIVE_ENTRIES_LOCALSTORAGE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.timestamp && (now - cacheData.timestamp) < this.ACTIVE_ENTRIES_LOCALSTORAGE_TTL) {
            // Use cached data - update signal
            this.activeEntries.set(cacheData.data);
            return of(cacheData.data);
          }
        }
      } catch (e) {
        console.warn('Failed to load active entries from localStorage cache:', e);
      }
    }
    
    // Load from API
    return this.apiService.get<LotteryTicketDto[]>('tickets/active').pipe(
      map(response => {
        if (response.success && response.data) {
          // Update active entries signal
          this.activeEntries.set(response.data);
          
          // Save to localStorage
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(this.ACTIVE_ENTRIES_LOCALSTORAGE_KEY, JSON.stringify({
                data: response.data,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.warn('Failed to cache active entries to localStorage:', e);
            }
          }
          
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
    const now = Date.now();
    
    // Check localStorage cache first
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.USER_STATS_LOCALSTORAGE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.timestamp && (now - cacheData.timestamp) < this.USER_STATS_LOCALSTORAGE_TTL) {
            // Use cached data - update signal
            this.userLotteryStats.set(cacheData.data);
            return of(cacheData.data);
          }
        }
      } catch (e) {
        console.warn('Failed to load user stats from localStorage cache:', e);
      }
    }
    
    // Load from API
    return this.apiService.get<UserLotteryStats>('tickets/analytics').pipe(
      map(response => {
        if (response.success && response.data) {
          // Update stats signal
          this.userLotteryStats.set(response.data);
          
          // Save to localStorage
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(this.USER_STATS_LOCALSTORAGE_KEY, JSON.stringify({
                data: response.data,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.warn('Failed to cache user stats to localStorage:', e);
            }
          }
          
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
   * Get gamification data for the current user
   * Endpoint: GET /api/v1/gamification
   */
  getGamificationData(): Observable<UserGamificationDto> {
    return this.apiService.get<UserGamificationDto>('gamification').pipe(
      map(response => {
        if (response.success && response.data) {
          // Update gamification signal
          this.gamificationData.set(response.data);
          return response.data;
        }
        throw new Error('Failed to fetch gamification data');
      }),
      catchError(error => {
        console.error('Error fetching gamification data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh dashboard data by clearing caches and reloading
   * Clears activeEntries and userStats caches, then reloads data
   */
  refreshDashboardData(): void {
    // Clear caches
    this.safeInvalidateCache('activeEntries');
    this.safeInvalidateCache('userStats');
    this.safeInvalidateCache('gamificationData'); // Clear gamification cache on refresh
    
    // Reload data (will trigger fresh API calls)
    this.getUserActiveEntries().pipe(take(1)).subscribe();
    this.getLotteryAnalytics().pipe(take(1)).subscribe();
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
          // Invalidate caches (critical data changed)
          this.safeInvalidateCache('activeEntries');
          this.safeInvalidateCache('userStats');
          this.safeInvalidateCache('gamificationData'); // Points may have been awarded
          this.safeInvalidateCache('housesList');
          
          return response.data;
        }
        throw new Error('Failed to process quick entry');
      }),
      tap(() => {
        // Refresh active entries after quick entry (side effect)
        this.getUserActiveEntries().pipe(
          take(1) // Auto-unsubscribe after first emission to prevent memory leaks
        ).subscribe();
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
    this.gamificationData.set(null); // Clear gamification data on logout
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