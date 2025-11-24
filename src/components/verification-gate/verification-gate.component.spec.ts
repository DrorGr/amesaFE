import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { VerificationGateComponent } from './verification-gate.component';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { TranslationService } from '../../services/translation.service';
import { of, throwError } from 'rxjs';
import { IdentityVerificationStatus } from '../../interfaces/identity-verification.interface';

describe('VerificationGateComponent', () => {
  let component: VerificationGateComponent;
  let fixture: ComponentFixture<VerificationGateComponent>;
  let verificationService: jasmine.SpyObj<IdentityVerificationService>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const verificationServiceSpy = jasmine.createSpyObj('IdentityVerificationService', ['getVerificationStatus']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VerificationGateComponent],
      providers: [
        { provide: IdentityVerificationService, useValue: verificationServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationGateComponent);
    component = fixture.componentInstance;
    verificationService = TestBed.inject(IdentityVerificationService) as jasmine.SpyObj<IdentityVerificationService>;
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    translationService.translate.and.returnValue('translated text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should check verification status when verification is required', () => {
      component.isVerificationRequired = () => true;
      verificationService.getVerificationStatus.and.returnValue(
        of({ verificationStatus: 'verified', verificationAttempts: 1 } as IdentityVerificationStatus)
      );

      component.ngOnInit();

      expect(verificationService.getVerificationStatus).toHaveBeenCalled();
    });

    it('should not check verification status when verification is not required', () => {
      component.isVerificationRequired = () => false;

      component.ngOnInit();

      expect(verificationService.getVerificationStatus).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should set isVerified to true when status is verified', (done) => {
      component.isVerificationRequired = () => true;
      const mockStatus: IdentityVerificationStatus = {
        verificationStatus: 'verified',
        verificationAttempts: 1
      };
      verificationService.getVerificationStatus.and.returnValue(of(mockStatus));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isVerified()).toBe(true);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should set isVerified to false when status is not verified', (done) => {
      component.isVerificationRequired = () => true;
      const mockStatus: IdentityVerificationStatus = {
        verificationStatus: 'rejected',
        verificationAttempts: 1
      };
      verificationService.getVerificationStatus.and.returnValue(of(mockStatus));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isVerified()).toBe(false);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle errors when checking verification status', (done) => {
      component.isVerificationRequired = () => true;
      verificationService.getVerificationStatus.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isVerified()).toBe(false);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Navigation', () => {
    it('should navigate to member settings with verification tab when goToVerification is called', () => {
      component.goToVerification();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/member-settings'],
        { queryParams: { tab: 'verification' } }
      );
    });

    it('should navigate to member settings when goToSettings is called', () => {
      component.goToSettings();

      expect(router.navigate).toHaveBeenCalledWith(['/member-settings']);
    });
  });

  describe('shouldBlock', () => {
    it('should return true when verification is required and not verified', () => {
      component.isVerificationRequired = () => true;
      component.isVerified.set(false);

      expect(component.shouldBlock()).toBe(true);
    });

    it('should return false when verification is required and verified', () => {
      component.isVerificationRequired = () => true;
      component.isVerified.set(true);

      expect(component.shouldBlock()).toBe(false);
    });

    it('should return false when verification is not required', () => {
      component.isVerificationRequired = () => false;
      component.isVerified.set(false);

      expect(component.shouldBlock()).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should show verification gate when verification required and not verified', () => {
      component.isVerificationRequired = () => true;
      component.isVerified.set(false);
      component.isLoading.set(false);

      fixture.detectChanges();

      const gateElement = fixture.nativeElement.querySelector('.bg-yellow-50');
      expect(gateElement).toBeTruthy();
    });

    it('should not show verification gate when verification not required', () => {
      component.isVerificationRequired = () => false;
      component.isVerified.set(false);
      component.isLoading.set(false);

      fixture.detectChanges();

      const gateElement = fixture.nativeElement.querySelector('.bg-yellow-50');
      expect(gateElement).toBeFalsy();
    });

    it('should not show verification gate when verified', () => {
      component.isVerificationRequired = () => true;
      component.isVerified.set(true);
      component.isLoading.set(false);

      fixture.detectChanges();

      const gateElement = fixture.nativeElement.querySelector('.bg-yellow-50');
      expect(gateElement).toBeFalsy();
    });
  });

  describe('Translation', () => {
    it('should use translation service for text', () => {
      component.translate('lottery.verificationRequired');

      expect(translationService.translate).toHaveBeenCalledWith('lottery.verificationRequired');
    });
  });
});
