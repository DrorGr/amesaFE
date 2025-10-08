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
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }
    };

    service.login('test@example.com', 'password123').then(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getCurrentUser()).toEqual(mockResponse.user);
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
    const mockError = new HttpErrorResponse({
      error: { message: 'Invalid credentials' },
      status: 401,
      statusText: 'Unauthorized'
    });

    service.login('test@example.com', 'wrongpassword').catch(error => {
      expect(error.status).toBe(401);
      expect(error.error.message).toBe('Invalid credentials');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockError.error, { status: 401, statusText: 'Unauthorized' });
  });

  it('should register successfully', () => {
    const mockResponse = {
      success: true,
      message: 'Registration successful',
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      }
    };

    const registerRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email' as const
    };

    service.register(registerRequest).then(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(mockResponse);
  });

  it('should handle registration failure', () => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Email already exists' },
      status: 400,
      statusText: 'Bad Request'
    });

    const registerRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email' as const
    };

    service.register(registerRequest).catch(error => {
      expect(error.status).toBe(400);
      expect(error.error.message).toBe('Email already exists');
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    req.flush(mockError.error, { status: 400, statusText: 'Bad Request' });
  });

  it('should logout successfully', () => {
    const mockResponse = { success: true, message: 'Logged out successfully' };

    service.logout().then(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
    });

    const req = httpMock.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle logout failure', () => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Logout failed' },
      status: 500,
      statusText: 'Internal Server Error'
    });

    service.logout().catch(error => {
      expect(error.status).toBe(500);
      expect(error.error.message).toBe('Logout failed');
    });

    const req = httpMock.expectOne('/api/v1/auth/logout');
    req.flush(mockError.error, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should refresh token successfully', () => {
    const mockResponse = {
      success: true,
      token: 'new-jwt-token',
      refreshToken: 'new-refresh-token'
    };

    service.refreshToken().then(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle refresh token failure', () => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Invalid refresh token' },
      status: 401,
      statusText: 'Unauthorized'
    });

    service.refreshToken().catch(error => {
      expect(error.status).toBe(401);
      expect(error.error.message).toBe('Invalid refresh token');
    });

    const req = httpMock.expectOne('/api/v1/auth/refresh');
    req.flush(mockError.error, { status: 401, statusText: 'Unauthorized' });
  });

  it('should get current user', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    service.setCurrentUser(mockUser);
    expect(service.getCurrentUser()).toEqual(mockUser);
  });

  it('should check authentication status', () => {
    expect(service.isAuthenticated()).toBeFalse();

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    service.setCurrentUser(mockUser);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should clear authentication data', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    service.setCurrentUser(mockUser);
    expect(service.isAuthenticated()).toBeTrue();

    service.clearAuthData();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should handle network errors', () => {
    service.login('test@example.com', 'password123').catch(error => {
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Unknown Error');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.error(new ErrorEvent('Network error'));
  });

  it('should handle 500 server errors', () => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Internal server error' },
      status: 500,
      statusText: 'Internal Server Error'
    });

    service.login('test@example.com', 'password123').catch(error => {
      expect(error.status).toBe(500);
      expect(error.error.message).toBe('Internal server error');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockError.error, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle 403 forbidden errors', () => {
    const mockError = new HttpErrorResponse({
      error: { message: 'Forbidden' },
      status: 403,
      statusText: 'Forbidden'
    });

    service.login('test@example.com', 'password123').catch(error => {
      expect(error.status).toBe(403);
      expect(error.error.message).toBe('Forbidden');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockError.error, { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 422 validation errors', () => {
    const mockError = new HttpErrorResponse({
      error: { 
        message: 'Validation failed',
        errors: {
          email: ['Email is required'],
          password: ['Password must be at least 6 characters']
        }
      },
      status: 422,
      statusText: 'Unprocessable Entity'
    });

    const registerRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email' as const
    };

    service.register(registerRequest).catch(error => {
      expect(error.status).toBe(422);
      expect(error.error.message).toBe('Validation failed');
      expect(error.error.errors.password).toEqual(['Password must be at least 6 characters']);
    });

    const req = httpMock.expectOne('/api/v1/auth/register');
    req.flush(mockError.error, { status: 422, statusText: 'Unprocessable Entity' });
  });

  it('should handle empty response', () => {
    service.login('test@example.com', 'password123').then(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(null);
  });

  it('should handle response with no data', () => {
    const mockResponse = { success: true };

    service.login('test@example.com', 'password123').then(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockResponse);
  });

  it('should handle response with error object', () => {
    const mockResponse = { 
      success: false, 
      message: 'Login failed',
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    };

    service.login('test@example.com', 'password123').then(response => {
      expect(response).toEqual(mockResponse);
      expect(response.success).toBeFalse();
      expect(response.error.code).toBe('INVALID_CREDENTIALS');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockResponse);
  });

  it('should handle timeout errors', () => {
    service.login('test@example.com', 'password123').catch(error => {
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Unknown Error');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.error(new ErrorEvent('timeout'));
  });

  it('should handle aborted requests', () => {
    service.login('test@example.com', 'password123').catch(error => {
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Unknown Error');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.error(new ErrorEvent('abort'));
  });

  it('should maintain user session across service instances', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    service.setCurrentUser(mockUser);
    expect(service.isAuthenticated()).toBeTrue();

    // Create new service instance
    const newService = TestBed.inject(AuthService);
    expect(newService.isAuthenticated()).toBeTrue();
    expect(newService.getCurrentUser()).toEqual(mockUser);
  });

  it('should handle authentication state changes', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    expect(service.isAuthenticated()).toBeFalse();

    service.setCurrentUser(mockUser);
    expect(service.isAuthenticated()).toBeTrue();

    service.clearAuthData();
    expect(service.isAuthenticated()).toBeFalse();
  });
});


