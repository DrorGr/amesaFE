import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LotteryResultsService, LotteryResult, LotteryResultsFilter } from './lottery-results.service';

describe('LotteryResultsService', () => {
  let service: LotteryResultsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LotteryResultsService]
    });
    service = TestBed.inject(LotteryResultsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLotteryResults', () => {
    it('should return lottery results with pagination', () => {
      const mockResponse = {
        success: true,
        data: {
          results: [
            {
              id: '1',
              lotteryId: 'lottery-1',
              drawId: 'draw-1',
              winnerTicketNumber: 'TICKET-001',
              winnerUserId: 'user-1',
              prizePosition: 1,
              prizeType: 'House',
              prizeValue: 500000,
              prizeDescription: 'Winner of Test House',
              qrCodeData: 'qr-data-1',
              qrCodeImageUrl: 'qr-image-1',
              isVerified: true,
              isClaimed: true,
              claimedAt: '2024-01-01T00:00:00Z',
              resultDate: '2024-01-01T00:00:00Z',
              houseTitle: 'Test House',
              houseAddress: '123 Test Street',
              winnerName: 'Test User',
              winnerEmail: 'test@example.com'
            }
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        message: 'Success',
        timestamp: '2024-01-01T00:00:00Z'
      };

      const filter: LotteryResultsFilter = {
        pageNumber: 1,
        pageSize: 10
      };

      service.getLotteryResults(filter).subscribe(response => {
        expect(response.results).toHaveLength(1);
        expect(response.results[0].id).toBe('1');
        expect(response.totalCount).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults?pageNumber=1&pageSize=10');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle API errors', () => {
      const filter: LotteryResultsFilter = {};

      service.getLotteryResults(filter).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Failed to fetch lottery results');
        }
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults');
      req.flush({ success: false, message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getLotteryResult', () => {
    it('should return specific lottery result', () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          lotteryId: 'lottery-1',
          winnerTicketNumber: 'TICKET-001',
          prizePosition: 1,
          prizeValue: 500000,
          isClaimed: true
        }
      };

      service.getLotteryResult('1').subscribe(result => {
        expect(result.id).toBe('1');
        expect(result.prizeValue).toBe(500000);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 errors', () => {
      service.getLotteryResult('invalid-id').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Failed to fetch lottery result');
        }
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/invalid-id');
      req.flush({ success: false, message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('validateQRCode', () => {
    it('should validate QR code successfully', () => {
      const mockResponse = {
        success: true,
        data: {
          isValid: true,
          isWinner: true,
          prizePosition: 1,
          prizeType: 'House',
          prizeValue: 500000,
          prizeDescription: 'Winner of Test House',
          isClaimed: false,
          result: {
            id: '1',
            winnerTicketNumber: 'TICKET-001',
            prizePosition: 1,
            prizeValue: 500000
          }
        }
      };

      service.validateQRCode('qr-data').subscribe(result => {
        expect(result.isValid).toBe(true);
        expect(result.isWinner).toBe(true);
        expect(result.prizePosition).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/validate-qr');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe('qr-data');
      req.flush(mockResponse);
    });

    it('should handle invalid QR code', () => {
      const mockResponse = {
        success: true,
        data: {
          isValid: false,
          isWinner: false,
          message: 'Invalid QR code'
        }
      };

      service.validateQRCode('invalid-qr').subscribe(result => {
        expect(result.isValid).toBe(false);
        expect(result.isWinner).toBe(false);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/validate-qr');
      req.flush(mockResponse);
    });
  });

  describe('claimPrize', () => {
    it('should claim prize successfully', () => {
      const mockResponse = {
        success: true,
        data: {
          id: '1',
          isClaimed: true,
          claimedAt: '2024-01-01T00:00:00Z'
        }
      };

      service.claimPrize('1', 'Test claim notes').subscribe(result => {
        expect(result.isClaimed).toBe(true);
        expect(result.claimedAt).toBe('2024-01-01T00:00:00Z');
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/claim');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        resultId: '1',
        claimNotes: 'Test claim notes'
      });
      req.flush(mockResponse);
    });

    it('should handle claim errors', () => {
      service.claimPrize('1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Failed to claim prize');
        }
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/claim');
      req.flush({ success: false, message: 'Already claimed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('createPrizeDelivery', () => {
    it('should create prize delivery successfully', () => {
      const deliveryRequest = {
        lotteryResultId: '1',
        recipientName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'USA',
        deliveryMethod: 'Standard'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'delivery-1',
          recipientName: 'John Doe',
          deliveryStatus: 'Pending'
        }
      };

      service.createPrizeDelivery(deliveryRequest).subscribe(result => {
        expect(result.recipientName).toBe('John Doe');
        expect(result.deliveryStatus).toBe('Pending');
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/lotteryresults/delivery');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(deliveryRequest);
      req.flush(mockResponse);
    });
  });

  describe('getScratchCards', () => {
    it('should return scratch cards for user', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'card-1',
            userId: 'user-1',
            cardType: 'Gold',
            cardNumber: 'SC-G-123456',
            isWinner: true,
            prizeType: 'Cash',
            prizeValue: 100,
            isScratched: true,
            isClaimed: false
          }
        ]
      };

      service.getScratchCards('user-1').subscribe(cards => {
        expect(cards).toHaveLength(1);
        expect(cards[0].cardType).toBe('Gold');
        expect(cards[0].isWinner).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/scratchcards?userId=user-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('scratchCard', () => {
    it('should scratch card successfully', () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'card-1',
          isScratched: true,
          scratchedAt: '2024-01-01T00:00:00Z',
          isWinner: true,
          prizeValue: 100
        }
      };

      service.scratchCard('card-1').subscribe(result => {
        expect(result.isScratched).toBe(true);
        expect(result.isWinner).toBe(true);
        expect(result.prizeValue).toBe(100);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/scratchcards/card-1/scratch');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('utility methods', () => {
    it('should format currency correctly', () => {
      expect(service.formatCurrency(1000)).toBe('$1,000.00');
      expect(service.formatCurrency(500000)).toBe('$500,000.00');
      expect(service.formatCurrency(0)).toBe('$0.00');
    });

    it('should format dates correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = service.formatDate(dateString);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should get prize position text correctly', () => {
      expect(service.getPrizePositionText(1)).toBe('1st Place');
      expect(service.getPrizePositionText(2)).toBe('2nd Place');
      expect(service.getPrizePositionText(3)).toBe('3rd Place');
      expect(service.getPrizePositionText(4)).toBe('4th Place');
      expect(service.getPrizePositionText(10)).toBe('10th Place');
    });

    it('should get prize position color classes correctly', () => {
      expect(service.getPrizePositionColor(1)).toBe('text-yellow-600 bg-yellow-100');
      expect(service.getPrizePositionColor(2)).toBe('text-gray-600 bg-gray-100');
      expect(service.getPrizePositionColor(3)).toBe('text-orange-600 bg-orange-100');
      expect(service.getPrizePositionColor(4)).toBe('text-blue-600 bg-blue-100');
    });
  });

  describe('signal management', () => {
    it('should initialize with empty signals', () => {
      expect(service.results()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should update computed signals correctly', () => {
      // Mock some results
      const mockResults: LotteryResult[] = [
        {
          id: '1',
          lotteryId: 'lottery-1',
          drawId: 'draw-1',
          winnerTicketNumber: 'TICKET-001',
          winnerUserId: 'user-1',
          prizePosition: 1,
          prizeType: 'House',
          prizeValue: 500000,
          prizeDescription: 'Winner of Test House',
          qrCodeData: 'qr-data-1',
          isVerified: true,
          isClaimed: true,
          claimedAt: '2024-01-01T00:00:00Z',
          resultDate: '2024-01-01T00:00:00Z',
          houseTitle: 'Test House',
          houseAddress: '123 Test Street',
          winnerName: 'Test User',
          winnerEmail: 'test@example.com'
        },
        {
          id: '2',
          lotteryId: 'lottery-2',
          drawId: 'draw-2',
          winnerTicketNumber: 'TICKET-002',
          winnerUserId: 'user-2',
          prizePosition: 2,
          prizeType: 'Cash',
          prizeValue: 50000,
          prizeDescription: 'Second place cash prize',
          qrCodeData: 'qr-data-2',
          isVerified: true,
          isClaimed: false,
          resultDate: '2024-01-02T00:00:00Z',
          houseTitle: 'Test House 2',
          houseAddress: '456 Test Avenue',
          winnerName: 'Test User 2',
          winnerEmail: 'test2@example.com'
        }
      ];

      // Update results signal
      service['_results'].set(mockResults);

      expect(service.totalResults()).toBe(2);
      expect(service.winnersByPosition().first).toBe(1);
      expect(service.winnersByPosition().second).toBe(1);
      expect(service.winnersByPosition().third).toBe(0);
    });
  });
});


