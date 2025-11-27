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
      expect(response).toBe(true);
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
});
