import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TelegramLinkComponent } from './telegram-link.component';
import { TelegramLinkService } from '../../services/telegram-link.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';

describe('TelegramLinkComponent', () => {
  let component: TelegramLinkComponent;
  let fixture: ComponentFixture<TelegramLinkComponent>;
  let mockTelegramLinkService: jasmine.SpyObj<TelegramLinkService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  const mockLinkStatus = {
    verified: true,
    telegramUserId: '123456',
    telegramUsername: 'testuser'
  };

  beforeEach(async () => {
    const telegramLinkServiceSpy = jasmine.createSpyObj('TelegramLinkService', [
      'fetchStatus',
      'requestLink',
      'verifyLink',
      'unlink',
      'getLinkStatus',
      'getVerificationCode'
    ]);
    
    telegramLinkServiceSpy.getLinkStatus.and.returnValue({ asReadonly: () => ({}) } as any);
    telegramLinkServiceSpy.getVerificationCode.and.returnValue({ asReadonly: () => ({}) } as any);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);

    await TestBed.configureTestingModule({
      imports: [
        TelegramLinkComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TelegramLinkService, useValue: telegramLinkServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TelegramLinkComponent);
    component = fixture.componentInstance;
    mockTelegramLinkService = TestBed.inject(TelegramLinkService) as jasmine.SpyObj<TelegramLinkService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockLoggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch status on init', () => {
    mockTelegramLinkService.fetchStatus.and.returnValue(of(mockLinkStatus));
    
    component.ngOnInit();
    
    expect(mockTelegramLinkService.fetchStatus).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should request link', () => {
    const mockLink = { ...mockLinkStatus, verificationCode: 'ABC123' };
    mockTelegramLinkService.requestLink.and.returnValue(of(mockLink));
    
    component.requestLink();
    
    expect(mockTelegramLinkService.requestLink).toHaveBeenCalled();
    expect(component.isRequesting()).toBe(false);
  });

  it('should verify link', () => {
    component.codeInput = 'ABC123';
    mockTelegramLinkService.verifyLink.and.returnValue(of(mockLinkStatus));
    
    component.verifyLink();
    
    expect(mockTelegramLinkService.verifyLink).toHaveBeenCalledWith('ABC123');
    expect(component.codeInput).toBe('');
  });

  it('should unlink account', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockTelegramLinkService.unlink.and.returnValue(of(true));
    
    component.unlinkAccount();
    
    expect(mockTelegramLinkService.unlink).toHaveBeenCalled();
  });

  it('should handle request link error', () => {
    const error = { message: 'Request failed' };
    mockTelegramLinkService.requestLink.and.returnValue(throwError(() => error));
    
    component.requestLink();
    
    expect(mockLoggingService.error).toHaveBeenCalled();
  });

  it('should handle verify link error', () => {
    component.codeInput = 'ABC123';
    const error = { message: 'Invalid code' };
    mockTelegramLinkService.verifyLink.and.returnValue(throwError(() => error));
    
    component.verifyLink();
    
    expect(mockLoggingService.error).toHaveBeenCalled();
  });

  it('should not verify with empty code', () => {
    component.codeInput = '';
    
    component.verifyLink();
    
    expect(mockTelegramLinkService.verifyLink).not.toHaveBeenCalled();
  });

  it('should copy verification code', () => {
    component.verificationCode.set('ABC123');
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.copyCode();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });
});




