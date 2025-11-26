import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LotteryService } from './lottery.service';
import { ApiService } from './api.service';
import { RealtimeService } from './realtime.service';

describe('LotteryService', () => {
  let service: LotteryService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;
  let realtimeService: jasmine.SpyObj<RealtimeService>;

  const mockHouseDto = {
    id: 'house-1',
    title: 'Test House',
    description: 'A test house',
    price: 500000,
    location: 'Test City',
    address: '123 Test St',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    status: 'active',
    totalTickets: 1000,
    ticketsSold: 500,
    ticketPrice: 10,
    lotteryEndDate: '2025-12-31T23:59:59Z',
    images: [{ imageUrl: 'test.jpg', altText: 'Test', isPrimary: true }]
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeService', [], {
      favoriteUpdates$: of({ updateType: 'added', houseId: 'house-1' }),
      entryStatusChanges$: of({ ticketId: 'ticket-1', newStatus: 'active' }),
      drawReminders$: of({ houseId: 'house-1', drawDate: new Date() }),
      recommendations$: of({ houseId: 'house-1', reason: 'test' })
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LotteryService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: RealtimeService, useValue: realtimeServiceSpy }
      ]
    });

    service = TestBed.inject(LotteryService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    realtimeService = TestBed.inject(RealtimeService) as jasmine.SpyObj<RealtimeService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHousesFromApi', () => {
    it('should fetch houses successfully', (done) => {
      const mockResponse = {
        success: true,
        data: {
          items: [mockHouseDto],
          totalCount: 1,
          page: 1,
          pageSize: 10
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getHousesFromApi().subscribe({
        next: (response) => {
          expect(response.items.length).toBe(1);
          expect(response.items[0].id).toBe('house-1');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('houses', undefined);
    });

    it('should handle API errors', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      service.getHousesFromApi().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getHouseById', () => {
    it('should fetch a single house by ID', (done) => {
      const mockResponse = {
        success: true,
        data: mockHouseDto
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getHouseById('house-1').subscribe({
        next: (house) => {
          expect(house.id).toBe('house-1');
          expect(house.title).toBe('Test House');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('houses/house-1');
    });

    it('should throw error when house not found', (done) => {
      const mockResponse = {
        success: false,
        data: null
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getHouseById('invalid-id').subscribe({
        error: (error) => {
          expect(error.message).toBe('House not found');
          done();
        }
      });
    });
  });

  describe('purchaseTicket', () => {
    it('should purchase tickets successfully', (done) => {
      const purchaseRequest = {
        houseId: 'house-1',
        quantity: 5
      };

      const mockResponse = {
        success: true,
        data: {
          ticketsPurchased: 5,
          totalCost: 50,
          ticketNumbers: ['T1', 'T2', 'T3', 'T4', 'T5']
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.purchaseTicket(purchaseRequest).subscribe({
        next: (result) => {
          expect(result.ticketsPurchased).toBe(5);
          expect(result.totalCost).toBe(50);
          expect(result.ticketNumbers.length).toBe(5);
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith(
        'houses/house-1/tickets/purchase',
        purchaseRequest
      );
    });

    it('should handle purchase errors', (done) => {
      const purchaseRequest = {
        houseId: 'house-1',
        quantity: 5
      };

      apiService.post.and.returnValue(throwError(() => ({ status: 400, message: 'Insufficient tickets' })));

      service.purchaseTicket(purchaseRequest).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('favorites management', () => {
    it('should add house to favorites', (done) => {
      const mockResponse = {
        success: true,
        data: {
          houseId: 'house-1',
          isFavorite: true
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addHouseToFavorites('house-1').subscribe({
        next: (result) => {
          expect(result.isFavorite).toBe(true);
          expect(service.isFavorite('house-1')).toBe(true);
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith('houses/house-1/favorite', {});
    });

    it('should remove house from favorites', (done) => {
      // First add to favorites
      const addResponse = {
        success: true,
        data: { houseId: 'house-1', isFavorite: true }
      };
      apiService.post.and.returnValue(of(addResponse));
      service.addHouseToFavorites('house-1').subscribe();

      // Then remove
      const removeResponse = {
        success: true,
        data: { houseId: 'house-1', isFavorite: false }
      };
      apiService.delete.and.returnValue(of(removeResponse));

      service.removeHouseFromFavorites('house-1').subscribe({
        next: (result) => {
          expect(result.isFavorite).toBe(false);
          done();
        }
      });

      expect(apiService.delete).toHaveBeenCalledWith('houses/house-1/favorite');
    });

    it('should toggle favorite status', (done) => {
      const mockResponse = {
        success: true,
        data: { houseId: 'house-1', isFavorite: true }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.toggleFavorite('house-1').subscribe({
        next: (result) => {
          expect(result.isFavorite).toBe(true);
          done();
        }
      });
    });
  });

  describe('getFavoriteHouses', () => {
    it('should fetch favorite houses', (done) => {
      const mockResponse = {
        success: true,
        data: [mockHouseDto]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getFavoriteHouses().subscribe({
        next: (houses) => {
          expect(houses.length).toBe(1);
          expect(houses[0].id).toBe('house-1');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('houses/favorites');
    });
  });

  describe('getUserActiveEntries', () => {
    it('should fetch active entries', (done) => {
      const mockTickets = [
        { id: 'ticket-1', lotteryId: 'house-1', status: 'active', ticketNumber: 'T1' },
        { id: 'ticket-2', lotteryId: 'house-1', status: 'active', ticketNumber: 'T2' }
      ];

      const mockResponse = {
        success: true,
        data: mockTickets
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getUserActiveEntries().subscribe({
        next: (entries) => {
          expect(entries.length).toBe(2);
          expect(entries[0].id).toBe('ticket-1');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('tickets/active');
    });
  });

  describe('getRecommendations', () => {
    it('should fetch recommendations', (done) => {
      const mockRecommendations = [
        { houseId: 'house-1', reason: 'Based on your preferences', score: 0.9 }
      ];

      const mockResponse = {
        success: true,
        data: mockRecommendations
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getRecommendations(10).subscribe({
        next: (recommendations) => {
          expect(recommendations.length).toBe(1);
          expect(recommendations[0].houseId).toBe('house-1');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('houses/recommendations', { limit: 10 });
    });
  });

  describe('quickEntryFromFavorite', () => {
    it('should process quick entry', (done) => {
      const quickEntryRequest = {
        houseId: 'house-1',
        quantity: 3
      };

      const mockResponse = {
        success: true,
        data: {
          ticketsPurchased: 3,
          totalCost: 30,
          ticketNumbers: ['T1', 'T2', 'T3']
        }
      };

      apiService.post.and.returnValue(of(mockResponse));
      apiService.get.and.returnValue(of({ success: true, data: [] }));

      service.quickEntryFromFavorite(quickEntryRequest).subscribe({
        next: (result) => {
          expect(result.ticketsPurchased).toBe(3);
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith('tickets/quick-entry', quickEntryRequest);
    });
  });

  describe('clearLotteryData', () => {
    it('should clear all lottery data', () => {
      service.clearLotteryData();
      expect(service.getFavoriteHouseIds().length).toBe(0);
      expect(service.getActiveEntries().length).toBe(0);
      expect(service.getUserLotteryStats()).toBeNull();
    });
  });

  describe('isFavorite', () => {
    it('should return true if house is favorited', () => {
      const mockResponse = {
        success: true,
        data: { houseId: 'house-1', isFavorite: true }
      };
      apiService.post.and.returnValue(of(mockResponse));
      
      service.addHouseToFavorites('house-1').subscribe();
      expect(service.isFavorite('house-1')).toBe(true);
    });

    it('should return false if house is not favorited', () => {
      expect(service.isFavorite('house-1')).toBe(false);
    });
  });
});






