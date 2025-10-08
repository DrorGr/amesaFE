import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make GET request', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    
    service.get('/test').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should make GET request with query parameters', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const params = { page: 1, size: 10 };
    
    service.get('/test', params).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test?page=1&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should make POST request', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const body = { name: 'Test' };
    
    service.post('/test', body).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('should make PUT request', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Updated' } };
    const body = { id: 1, name: 'Updated' };
    
    service.put('/test/1', body).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('should make DELETE request', () => {
    const mockResponse = { success: true, message: 'Deleted successfully' };
    
    service.delete('/test/1').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should make PATCH request', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Patched' } };
    const body = { name: 'Patched' };
    
    service.patch('/test/1', body).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('should handle HTTP errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Not found' },
      status: 404,
      statusText: 'Not Found'
    });

    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.error.message).toBe('Not found');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse.error, { status: 404, statusText: 'Not Found' });
  });

  it('should handle network errors', () => {
    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(0);
        expect(error.statusText).toBe('Unknown Error');
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(new ErrorEvent('Network error'));
  });

  it('should handle 500 server errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Internal server error' },
      status: 500,
      statusText: 'Internal Server Error'
    });

    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.error.message).toBe('Internal server error');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse.error, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle 401 unauthorized errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Unauthorized' },
      status: 401,
      statusText: 'Unauthorized'
    });

    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(401);
        expect(error.error.message).toBe('Unauthorized');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse.error, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 403 forbidden errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Forbidden' },
      status: 403,
      statusText: 'Forbidden'
    });

    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(403);
        expect(error.error.message).toBe('Forbidden');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse.error, { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 422 validation errors', () => {
    const errorResponse = new HttpErrorResponse({
      error: { 
        message: 'Validation failed',
        errors: {
          name: ['Name is required'],
          email: ['Email is invalid']
        }
      },
      status: 422,
      statusText: 'Unprocessable Entity'
    });

    service.post('/test', {}).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(422);
        expect(error.error.message).toBe('Validation failed');
        expect(error.error.errors.name).toEqual(['Name is required']);
        expect(error.error.errors.email).toEqual(['Email is invalid']);
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse.error, { status: 422, statusText: 'Unprocessable Entity' });
  });

  it('should handle empty response', () => {
    service.get('/test').subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('/test');
    req.flush(null);
  });

  it('should handle response with no data', () => {
    const mockResponse = { success: true };
    
    service.get('/test').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test');
    req.flush(mockResponse);
  });

  it('should handle response with error object', () => {
    const mockResponse = { 
      success: false, 
      message: 'Error occurred',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed'
      }
    };
    
    service.get('/test').subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.success).toBeFalse();
      expect(response.error.code).toBe('VALIDATION_ERROR');
    });

    const req = httpMock.expectOne('/test');
    req.flush(mockResponse);
  });

  it('should handle query parameters with special characters', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const params = { 
      search: 'test & query',
      filter: 'value with spaces',
      sort: 'name,asc'
    };
    
    service.get('/test', params).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test?search=test%20%26%20query&filter=value%20with%20spaces&sort=name%2Casc');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle query parameters with arrays', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const params = { 
      tags: ['tag1', 'tag2', 'tag3'],
      ids: [1, 2, 3]
    };
    
    service.get('/test', params).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test?tags=tag1&tags=tag2&tags=tag3&ids=1&ids=2&ids=3');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle query parameters with undefined values', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const params = { 
      page: 1,
      size: undefined,
      filter: null,
      search: ''
    };
    
    service.get('/test', params).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test?page=1&search=');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle POST request with FormData', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    const formData = new FormData();
    formData.append('name', 'Test');
    formData.append('file', new Blob(['test'], { type: 'text/plain' }));
    
    service.post('/test', formData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush(mockResponse);
  });

  it('should handle PUT request with FormData', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Updated' } };
    const formData = new FormData();
    formData.append('name', 'Updated');
    
    service.put('/test/1', formData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush(mockResponse);
  });

  it('should handle PATCH request with FormData', () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Patched' } };
    const formData = new FormData();
    formData.append('name', 'Patched');
    
    service.patch('/test/1', formData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/test/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush(mockResponse);
  });

  it('should handle timeout errors', () => {
    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(0);
        expect(error.statusText).toBe('Unknown Error');
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(new ErrorEvent('timeout'));
  });

  it('should handle aborted requests', () => {
    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(0);
        expect(error.statusText).toBe('Unknown Error');
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(new ErrorEvent('abort'));
  });
});


