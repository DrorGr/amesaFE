import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TwoFactorSetupComponent } from './two-factor-setup.component';
import { AuthService, TwoFactorSetupDto } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

describe('TwoFactorSetupComponent', () => {
  let component: TwoFactorSetupComponent;
  let fixture: ComponentFixture<TwoFactorSetupComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockSetupData: TwoFactorSetupDto = {
    qrCodeUrl: 'data:image/png;base64,test',
    manualEntryKey: 'ABCD1234EFGH5678',
    backupCodes: ['123456', '234567', '345678']
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'setupTwoFactor',
      'verifyTwoFactorSetup'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        TwoFactorSetupComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TwoFactorSetupComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load setup data on init', () => {
    mockAuthService.setupTwoFactor.and.returnValue(of(mockSetupData));
    
    component.ngOnInit();
    
    expect(mockAuthService.setupTwoFactor).toHaveBeenCalled();
    expect(component.setupData()).toEqual(mockSetupData);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle setup error', () => {
    const error = { message: 'Setup failed' };
    mockAuthService.setupTwoFactor.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.isLoading()).toBe(false);
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should verify setup code successfully', () => {
    component.setupData.set(mockSetupData);
    component.verificationCode.set('123456');
    mockAuthService.verifyTwoFactorSetup.and.returnValue(of({ success: true }));
    
    component.verifySetup();
    
    expect(mockAuthService.verifyTwoFactorSetup).toHaveBeenCalledWith('123456');
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should handle verification error', () => {
    component.setupData.set(mockSetupData);
    component.verificationCode.set('123456');
    const error = { message: 'Invalid code' };
    mockAuthService.verifyTwoFactorSetup.and.returnValue(throwError(() => error));
    
    component.verifySetup();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should not verify with empty code', () => {
    component.verificationCode.set('');
    
    component.verifySetup();
    
    expect(mockAuthService.verifyTwoFactorSetup).not.toHaveBeenCalled();
  });

  it('should copy manual entry key', () => {
    component.setupData.set(mockSetupData);
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.copyManualKey();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD1234EFGH5678');
  });

  it('should copy backup codes', () => {
    component.setupData.set(mockSetupData);
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.copyBackupCodes();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456\n234567\n345678');
  });
});






