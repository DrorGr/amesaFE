import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PaymentService, PaymentMethodDto, ProcessPaymentRequest } from './payment.service';
import { ApiService } from './api.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockPaymentMethod: PaymentMethodDto = {
    id: 'pm-1',
    type: 'card',
    provider: 'stripe',
    cardLastFour: '4242',
    cardBrand: 'visa',
    cardExpMonth: 12,
    cardExpYear: 2025,
    isDefault: true,
    isActive: true,
    createdAt: new Date()
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PaymentService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(PaymentService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPaymentMethods', () => {
    it('should fetch payment methods successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [mockPaymentMethod],
        timestamp: new Date().toISOString()
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getPaymentMethods().subscribe({
        next: (methods) => {
          expect(methods.length).toBe(1);
          expect(methods[0].id).toBe('pm-1');
          expect(methods[0].cardLastFour).toBe('4242');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('payments/methods');
    });

    it('should handle errors when fetching payment methods', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      service.getPaymentMethods().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method successfully', (done) => {
      const addRequest = {
        type: 'card',
        cardNumber: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvv: '123',
        cardholderName: 'Test User',
        isDefault: true
      };

      const mockResponse = {
        success: true,
        data: mockPaymentMethod,
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addPaymentMethod(addRequest).subscribe({
        next: (method) => {
          expect(method.id).toBe('pm-1');
          expect(method.type).toBe('card');
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith('payments/methods', addRequest);
    });

    it('should handle validation errors', (done) => {
      const addRequest = {
        type: 'card',
        cardNumber: 'invalid',
        expMonth: 12,
        expYear: 2025,
        cvv: '123',
        cardholderName: 'Test User',
        isDefault: true
      };

      apiService.post.and.returnValue(throwError(() => ({ 
        status: 400, 
        message: 'Invalid card number' 
      })));

      service.addPaymentMethod(addRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', (done) => {
      const paymentRequest: ProcessPaymentRequest = {
        paymentMethodId: 'pm-1',
        amount: 100.50,
        currency: 'USD',
        description: 'Lottery tickets purchase',
        referenceId: 'ref-123'
      };

      const mockResponse = {
        success: true,
        data: {
          transactionId: 'txn-1',
          providerTransactionId: 'stripe-txn-1',
          message: 'Payment processed successfully'
        },
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.processPayment(paymentRequest).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.transactionId).toBe('txn-1');
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith('payments/process', paymentRequest);
    });

    it('should handle payment failures', (done) => {
      const paymentRequest: ProcessPaymentRequest = {
        paymentMethodId: 'pm-1',
        amount: 100.50,
        currency: 'USD'
      };

      const mockResponse = {
        success: false,
        errorCode: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds',
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.processPayment(paymentRequest).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('INSUFFICIENT_FUNDS');
          done();
        }
      });
    });

    it('should handle declined cards', (done) => {
      const paymentRequest: ProcessPaymentRequest = {
        paymentMethodId: 'pm-1',
        amount: 100.50,
        currency: 'USD'
      };

      const mockResponse = {
        success: false,
        errorCode: 'CARD_DECLINED',
        message: 'Card was declined',
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.processPayment(paymentRequest).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('CARD_DECLINED');
          done();
        }
      });
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions successfully', (done) => {
      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'purchase',
          amount: 100,
          currency: 'USD',
          status: 'completed',
          createdAt: new Date()
        }
      ];

      const mockResponse = {
        success: true,
        data: mockTransactions,
        timestamp: new Date().toISOString()
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTransactions().subscribe({
        next: (transactions) => {
          expect(transactions.length).toBe(1);
          expect(transactions[0].id).toBe('txn-1');
          done();
        }
      });

      expect(apiService.get).toHaveBeenCalledWith('payments/transactions');
    });
  });

  describe('requestRefund', () => {
    it('should process refund successfully', (done) => {
      const refundRequest = {
        transactionId: 'txn-1',
        amount: 50,
        reason: 'Customer request'
      };

      const mockResponse = {
        success: true,
        data: {
          transactionId: 'txn-1',
          message: 'Refund processed'
        },
        timestamp: new Date().toISOString()
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.requestRefund(refundRequest).subscribe({
        next: (result) => {
          expect(result.transactionId).toBe('txn-1');
          done();
        }
      });

      expect(apiService.post).toHaveBeenCalledWith('payments/refund', refundRequest);
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method to default', (done) => {
      const updateRequest = {
        isDefault: true
      };

      const mockResponse = {
        success: true,
        data: { ...mockPaymentMethod, isDefault: true },
        timestamp: new Date().toISOString()
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updatePaymentMethod('pm-1', updateRequest).subscribe({
        next: (method) => {
          expect(method.isDefault).toBe(true);
          done();
        }
      });

      expect(apiService.put).toHaveBeenCalledWith('payments/methods/pm-1', updateRequest);
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Payment method deleted',
        timestamp: new Date().toISOString()
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deletePaymentMethod('pm-1').subscribe({
        next: (result) => {
          expect(result).toBe(true);
          done();
        }
      });

      expect(apiService.delete).toHaveBeenCalledWith('payments/methods/pm-1');
    });
  });
});










