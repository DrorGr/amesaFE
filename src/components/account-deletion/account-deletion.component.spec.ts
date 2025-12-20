import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AccountDeletionComponent } from './account-deletion.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

describe('AccountDeletionComponent', () => {
  let component: AccountDeletionComponent;
  let fixture: ComponentFixture<AccountDeletionComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockDeletionStatus = {
    isPending: true,
    requestedAt: new Date('2024-01-01'),
    scheduledDeletionAt: new Date('2024-01-08')
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAccountDeletionStatus',
      'requestAccountDeletion',
      'cancelAccountDeletion'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AccountDeletionComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDeletionComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load deletion status on init', () => {
    mockAuthService.getAccountDeletionStatus.and.returnValue(of(mockDeletionStatus));
    
    component.ngOnInit();
    
    expect(mockAuthService.getAccountDeletionStatus).toHaveBeenCalled();
    expect(component.deletionStatus()).toEqual(mockDeletionStatus);
    expect(component.isLoading()).toBe(false);
  });

  it('should request account deletion', () => {
    component.password.set('password123');
    mockAuthService.requestAccountDeletion.and.returnValue(of({ success: true }));
    mockAuthService.getAccountDeletionStatus.and.returnValue(of(mockDeletionStatus));
    
    component.requestDeletion();
    
    expect(mockAuthService.requestAccountDeletion).toHaveBeenCalledWith('password123');
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should cancel account deletion', () => {
    component.deletionStatus.set(mockDeletionStatus);
    mockAuthService.cancelAccountDeletion.and.returnValue(of({ success: true }));
    mockAuthService.getAccountDeletionStatus.and.returnValue(of({ isPending: false }));
    
    component.cancelDeletion();
    
    expect(mockAuthService.cancelAccountDeletion).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should handle request deletion error', () => {
    component.password.set('wrongpassword');
    const error = { message: 'Invalid password' };
    mockAuthService.requestAccountDeletion.and.returnValue(throwError(() => error));
    
    component.requestDeletion();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should handle cancel deletion error', () => {
    const error = { message: 'Cancel failed' };
    mockAuthService.cancelAccountDeletion.and.returnValue(throwError(() => error));
    
    component.cancelDeletion();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should not request deletion with empty password', () => {
    component.password.set('');
    
    component.requestDeletion();
    
    expect(mockAuthService.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it('should calculate days remaining correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    component.deletionStatus.set({
      isPending: true,
      requestedAt: new Date(),
      scheduledDeletionAt: futureDate
    });
    
    const daysRemaining = component.getDaysRemaining();
    
    expect(daysRemaining).toBeGreaterThanOrEqual(4);
    expect(daysRemaining).toBeLessThanOrEqual(5);
  });
});




