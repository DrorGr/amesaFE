import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TelegramLinkService } from './telegram-link.service';

describe('TelegramLinkService', () => {
  let service: TelegramLinkService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TelegramLinkService]
    });
    service = TestBed.inject(TelegramLinkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch link status', () => {
    const mockResponse = {
      success: true,
      data: {
        verified: true,
        telegramUserId: '123456',
        telegramUsername: 'testuser'
      }
    };

    service.fetchStatus().subscribe(response => {
      expect(response.verified).toBe(true);
      expect(response.telegramUserId).toBe('123456');
    });

    const req = httpMock.expectOne('/api/v1/notifications/telegram/status');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should request link', () => {
    const mockResponse = {
      success: true,
      data: {
        verified: false,
        verificationCode: 'ABC123',
        telegramUserId: null,
        telegramUsername: null
      }
    };

    service.requestLink().subscribe(response => {
      expect(response.verificationCode).toBe('ABC123');
    });

    const req = httpMock.expectOne('/api/v1/notifications/telegram/link');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should verify link', () => {
    const mockResponse = {
      success: true,
      data: {
        verified: true,
        telegramUserId: '123456',
        telegramUsername: 'testuser'
      }
    };

    service.verifyLink('ABC123').subscribe(response => {
      expect(response.verified).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/notifications/telegram/verify');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'ABC123' });
    req.flush(mockResponse);
  });

  it('should unlink account', () => {
    const mockResponse = { success: true };

    service.unlink().subscribe(response => {
      expect(response).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/notifications/telegram/unlink');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle link error', () => {
    service.requestLink().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne('/api/v1/notifications/telegram/link');
    req.flush({ error: { message: 'Link failed' } }, { status: 400, statusText: 'Bad Request' });
  });
});




