import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        }
      },
      timestamp: new Date().toISOString()
    };

    service.login('test@example.com', 'password123').subscribe(response => {
      expect(response).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@example.com',
      password: 'password123'
    });
    req.flush(mockResponse);
  });

  it('should handle login failure', () => {
    service.login('test@example.com', 'wrongpassword').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ error: { message: 'Invalid credentials' } }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should register successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        }
      },
      timestamp: new Date().toISOString()
    };

    const registerRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email' as const
    };

    service.register(registerRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(mockResponse);
  });

  it('should handle registration failure', () => {
    const registerRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email' as const
    };

    service.register(registerRequest).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    req.flush({ error: { message: 'Email already exists' } }, { status: 400, statusText: 'Bad Request' });
  });

  it('should logout', () => {
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should get current user', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    // Set user via login
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'token',
        user: mockUser
      },
      timestamp: new Date().toISOString()
    };

    service.login('test@example.com', 'password123').subscribe();
    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockResponse);

    expect(service.getCurrentUser()).toBeTruthy();
  });

  it('should check authentication status', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should handle network errors', () => {
    service.login('test@example.com', 'password123').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(0);
      }
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.error(new ErrorEvent('Network error'));
  });

  // 2FA Tests
  it('should setup two factor authentication', () => {
    const mockResponse = {
      success: true,
      data: {
        qrCodeUrl: 'data:image/png;base64,test',
        manualEntryKey: 'ABCD1234EFGH5678',
        backupCodes: ['123456', '234567']
      }
    };

    service.setupTwoFactor().subscribe(response => {
      expect(response.qrCodeUrl).toBeTruthy();
      expect(response.manualEntryKey).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/v1/auth/two-factor/setup');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should verify two factor setup', () => {
    const mockResponse = { success: true };

    service.verifyTwoFactorSetup('123456').subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/two-factor/verify-setup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: '123456' });
    req.flush(mockResponse);
  });

  it('should get two factor status', () => {
    const mockResponse = {
      success: true,
      data: { isEnabled: true, isVerified: true }
    };

    service.getTwoFactorStatus().subscribe(response => {
      expect(response.isEnabled).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/two-factor/status');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // Security Questions Tests
  it('should get security questions', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 1, question: 'What is your mother\'s maiden name?' }
      ]
    };

    service.getSecurityQuestions().subscribe(response => {
      expect(response.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/v1/auth/recovery/security-questions');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should setup security questions', () => {
    const mockResponse = { success: true };
    const questions = [
      { questionId: 1, answer: 'Smith' },
      { questionId: 2, answer: 'New York' }
    ];

    service.setupSecurityQuestions(questions).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/recovery/security-questions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ questions });
    req.flush(mockResponse);
  });

  it('should verify security question', () => {
    const mockResponse = {
      success: true,
      data: { nextQuestionId: 2 }
    };

    service.verifySecurityQuestion(1, 'Smith').subscribe(response => {
      expect(response.nextQuestionId).toBe(2);
    });

    const req = httpMock.expectOne('/api/v1/auth/recovery/verify-question');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ questionId: 1, answer: 'Smith' });
    req.flush(mockResponse);
  });

  // Account Deletion Tests
  it('should request account deletion', () => {
    const mockResponse = { success: true };

    service.requestAccountDeletion('password123').subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/account/delete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'password123' });
    req.flush(mockResponse);
  });

  it('should cancel account deletion', () => {
    const mockResponse = { success: true };

    service.cancelAccountDeletion().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/account/cancel-deletion');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get account deletion status', () => {
    const mockResponse = {
      success: true,
      data: {
        isPending: true,
        requestedAt: new Date().toISOString(),
        scheduledDeletionAt: new Date().toISOString()
      }
    };

    service.getAccountDeletionStatus().subscribe(response => {
      expect(response.isPending).toBe(true);
    });

    const req = httpMock.expectOne('/api/v1/auth/account/deletion-status');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
