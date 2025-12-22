import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TwoFactorManageComponent } from './two-factor-manage.component';
import { AuthService, TwoFactorStatusDto } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

describe('TwoFactorManageComponent', () => {
  let component: TwoFactorManageComponent;
  let fixture: ComponentFixture<TwoFactorManageComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockStatus: TwoFactorStatusDto = {
    isEnabled: true,
    isVerified: true
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getTwoFactorStatus',
      'enableTwoFactor',
      'disableTwoFactor',
      'verifyTwoFactor'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        TwoFactorManageComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TwoFactorManageComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load status on init', () => {
    mockAuthService.getTwoFactorStatus.and.returnValue(of(mockStatus));
    
    component.ngOnInit();
    
    expect(mockAuthService.getTwoFactorStatus).toHaveBeenCalled();
    expect(component.status()).toEqual(mockStatus);
    expect(component.isLoading()).toBe(false);
  });

  it('should enable 2FA with verification code', () => {
    component.status.set({ isEnabled: false, isVerified: false });
    component.verificationCode.set('123456');
    mockAuthService.enableTwoFactor.and.returnValue(of({ success: true }));
    mockAuthService.getTwoFactorStatus.and.returnValue(of({ isEnabled: true, isVerified: true }));
    
    component.enableTwoFactor();
    
    expect(mockAuthService.enableTwoFactor).toHaveBeenCalledWith('123456');
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should disable 2FA with verification code', () => {
    component.status.set(mockStatus);
    component.verificationCode.set('123456');
    mockAuthService.disableTwoFactor.and.returnValue(of({ success: true }));
    mockAuthService.getTwoFactorStatus.and.returnValue(of({ isEnabled: false, isVerified: false }));
    
    component.disableTwoFactor();
    
    expect(mockAuthService.disableTwoFactor).toHaveBeenCalledWith('123456');
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should handle enable error', () => {
    component.verificationCode.set('123456');
    const error = { message: 'Invalid code' };
    mockAuthService.enableTwoFactor.and.returnValue(throwError(() => error));
    
    component.enableTwoFactor();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should handle disable error', () => {
    component.verificationCode.set('123456');
    const error = { message: 'Invalid code' };
    mockAuthService.disableTwoFactor.and.returnValue(throwError(() => error));
    
    component.disableTwoFactor();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should not enable/disable with empty code', () => {
    component.verificationCode.set('');
    
    component.enableTwoFactor();
    component.disableTwoFactor();
    
    expect(mockAuthService.enableTwoFactor).not.toHaveBeenCalled();
    expect(mockAuthService.disableTwoFactor).not.toHaveBeenCalled();
  });
});





