import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReservationService, Reservation, InventoryStatus } from './reservation.service';
import { ApiService } from './api.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockReservation: Reservation = {
    id: 'reservation-1',
    houseId: 'house-1',
    userId: 'user-1',
    quantity: 5,
    totalPrice: 250,
    status: 'pending',
    reservationToken: 'token-123',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInventoryStatus: InventoryStatus = {
    houseId: 'house-1',
    totalTickets: 1000,
    availableTickets: 500,
    reservedTickets: 0,
    soldTickets: 500,
    lotteryEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timeRemaining: 7 * 24 * 60 * 60 * 1000,
    isSoldOut: false,
    isEnded: false
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReservationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReservationService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createReservation', () => {
    it('should create reservation successfully', (done) => {
      const mockResponse = {
        success: true,
        data: mockReservation,
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createReservation('house-1', {
        quantity: 5,
        paymentMethodId: 'payment-1'
      }).subscribe({
        next: (reservation) => {
          expect(reservation.id).toBe('reservation-1');
          expect(reservation.quantity).toBe(5);
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('/reservations'),
        jasmine.any(Object)
      );
    });

    it('should handle errors when creating reservation', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('Failed')));

      service.createReservation('house-1', { quantity: 5 }).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getReservation', () => {
    it('should fetch reservation successfully', (done) => {
      const mockResponse = {
        success: true,
        data: mockReservation,
        timestamp: new Date().toISOString()
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getReservation('reservation-1').subscribe({
        next: (reservation) => {
          expect(reservation.id).toBe('reservation-1');
          done();
        }
      });
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', (done) => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString()
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.cancelReservation('reservation-1').subscribe({
        next: () => {
          expect(apiService.delete).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getInventoryStatus', () => {
    it('should fetch inventory status successfully', (done) => {
      const mockResponse = {
        success: true,
        data: mockInventoryStatus,
        timestamp: new Date().toISOString()
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryStatus('house-1').subscribe({
        next: (inventory) => {
          expect(inventory.houseId).toBe('house-1');
          expect(inventory.availableTickets).toBe(500);
          done();
        }
      });
    });

    it('should use cache when available', (done) => {
      // First call - cache miss
      const mockResponse = {
        success: true,
        data: mockInventoryStatus,
        timestamp: new Date().toISOString()
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryStatus('house-1', true).subscribe({
        next: () => {
          // Second call - should use cache
          apiService.get.calls.reset();
          service.getInventoryStatus('house-1', true).subscribe({
            next: (inventory) => {
              // Should not call API again
              expect(apiService.get).not.toHaveBeenCalled();
              expect(inventory.houseId).toBe('house-1');
              done();
            }
          });
        }
      });
    });
  });

  describe('getUserReservations', () => {
    it('should fetch user reservations successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [mockReservation],
        timestamp: new Date().toISOString()
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getUserReservations().subscribe({
        next: (reservations) => {
          expect(reservations.length).toBe(1);
          expect(reservations[0].id).toBe('reservation-1');
          done();
        }
      });
    });
  });
});





