import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { IdentityVerificationService } from './identity-verification.service';
import { ApiService } from './api.service';
import { VerifyIdentityRequest, IdentityVerificationResult, IdentityVerificationStatus } from '../interfaces/identity-verification.interface';

describe('IdentityVerificationService', () => {
  let service: IdentityVerificationService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockApiResponse = <T>(data: T) => ({
    success: true,
    data: data,
    message: '',
    timestamp: new Date().toISOString()
  });

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'get'], {
      getApiUrl: '/api/v1'
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IdentityVerificationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(IdentityVerificationService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('verifyIdentity', () => {
    it('should verify identity successfully', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport',
        documentNumber: 'P123456'
      };

      const mockResult: IdentityVerificationResult = {
        isVerified: true,
        validationKey: 'guid-123',
        livenessScore: 95,
        faceMatchScore: 98,
        verificationStatus: 'verified'
      };

      apiService.post.and.returnValue(of(mockApiResponse(mockResult)));

      service.verifyIdentity(request).subscribe({
        next: (result) => {
          expect(result.isVerified).toBe(true);
          expect(result.verificationStatus).toBe('verified');
          expect(result.livenessScore).toBe(95);
          expect(result.faceMatchScore).toBe(98);
          expect(apiService.post).toHaveBeenCalledWith('auth/identity/verify', request);
          done();
        }
      });
    });

    it('should handle verification failure', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport'
      };

      const mockResult: IdentityVerificationResult = {
        isVerified: false,
        validationKey: 'guid-123',
        livenessScore: 75,
        faceMatchScore: 85,
        verificationStatus: 'rejected',
        rejectionReason: 'Liveness score too low'
      };

      apiService.post.and.returnValue(of(mockApiResponse(mockResult)));

      service.verifyIdentity(request).subscribe({
        next: (result) => {
          expect(result.isVerified).toBe(false);
          expect(result.verificationStatus).toBe('rejected');
          expect(result.rejectionReason).toBe('Liveness score too low');
          done();
        }
      });
    });

    it('should handle API errors', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport'
      };

      apiService.post.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      service.verifyIdentity(request).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getVerificationStatus', () => {
    it('should get verification status successfully', (done) => {
      const mockStatus: IdentityVerificationStatus = {
        validationKey: 'guid-123',
        verificationStatus: 'verified',
        livenessScore: 95,
        faceMatchScore: 98,
        verificationAttempts: 1,
        verifiedAt: '2025-01-01T00:00:00Z'
      };

      apiService.get.and.returnValue(of(mockApiResponse(mockStatus)));

      service.getVerificationStatus().subscribe({
        next: (status) => {
          expect(status.verificationStatus).toBe('verified');
          expect(status.validationKey).toBe('guid-123');
          expect(status.livenessScore).toBe(95);
          expect(apiService.get).toHaveBeenCalledWith('auth/identity/status');
          done();
        }
      });
    });

    it('should handle no verification status', (done) => {
      const mockStatus: IdentityVerificationStatus = {
        verificationStatus: 'not_started',
        verificationAttempts: 0
      };

      apiService.get.and.returnValue(of(mockApiResponse(mockStatus)));

      service.getVerificationStatus().subscribe({
        next: (status) => {
          expect(status.verificationStatus).toBe('not_started');
          expect(status.validationKey).toBeUndefined();
          done();
        }
      });
    });

    it('should handle API errors when getting status', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      service.getVerificationStatus().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('retryVerification', () => {
    it('should retry verification successfully', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport'
      };

      const mockResult: IdentityVerificationResult = {
        isVerified: true,
        validationKey: 'guid-456',
        verificationStatus: 'verified'
      };

      apiService.post.and.returnValue(of(mockApiResponse(mockResult)));

      service.retryVerification(request).subscribe({
        next: (result) => {
          expect(result.isVerified).toBe(true);
          expect(result.verificationStatus).toBe('verified');
          expect(apiService.post).toHaveBeenCalledWith('auth/identity/retry', request);
          done();
        }
      });
    });

    it('should handle retry failure', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport'
      };

      const mockResult: IdentityVerificationResult = {
        isVerified: false,
        validationKey: 'guid-456',
        verificationStatus: 'rejected',
        rejectionReason: 'Face match failed'
      };

      apiService.post.and.returnValue(of(mockApiResponse(mockResult)));

      service.retryVerification(request).subscribe({
        next: (result) => {
          expect(result.isVerified).toBe(false);
          expect(result.rejectionReason).toBe('Face match failed');
          done();
        }
      });
    });

    it('should handle API errors during retry', (done) => {
      const request: VerifyIdentityRequest = {
        idFrontImage: 'base64image1',
        selfieImage: 'base64image2',
        documentType: 'passport'
      };

      apiService.post.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' })));

      service.retryVerification(request).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });
});
