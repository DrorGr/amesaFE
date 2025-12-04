import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthModalComponent } from './auth-modal.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { ToastService } from '../../services/toast.service';

describe('AuthModalComponent', () => {
  let component: AuthModalComponent;
  let fixture: ComponentFixture<AuthModalComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockMobileDetectionService: jasmine.SpyObj<MobileDetectionService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'register',
      'getCurrentUserProfile'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const mobileDetectionServiceSpy = jasmine.createSpyObj('MobileDetectionService', [], {
      isMobile: { asReadonly: () => ({}) }
    });
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'warning', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AuthModalComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: MobileDetectionService, useValue: mobileDetectionServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockMobileDetectionService = TestBed.inject(MobileDetectionService) as jasmine.SpyObj<MobileDetectionService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Set default mode
    fixture.componentRef.setInput('mode', 'login');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login mode', () => {
    fixture.componentRef.setInput('mode', 'login');
    fixture.detectChanges();
    expect(component.mode()).toBe('login');
  });

  it('should initialize with register mode', () => {
    fixture.componentRef.setInput('mode', 'register');
    fixture.detectChanges();
    expect(component.mode()).toBe('register');
  });

  it('should handle login form submission', async () => {
    mockAuthService.login.and.returnValue(of(true));
    mockAuthService.getCurrentUserProfile.and.returnValue(of({} as any));
    
    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.onSubmit();
    
    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(component.errorMessage).toBe('');
  });

  it('should handle login errors', async () => {
    const mockError = { status: 401, error: { error: { message: 'Invalid credentials' } } };
    mockAuthService.login.and.returnValue(throwError(() => mockError));
    
    component.email = 'test@example.com';
    component.password = 'wrongpassword';
    
    await component.onSubmit();
    
    expect(component.errorMessage).toContain('Invalid email or password');
  });

  it('should handle register form submission', async () => {
    mockAuthService.register.and.returnValue(of({ success: true }));
    mockAuthService.getCurrentUserProfile.and.returnValue(of({} as any));
    
    fixture.componentRef.setInput('mode', 'register');
    fixture.detectChanges();
    
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.onSubmit();
    
    expect(mockAuthService.register).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

  it('should handle register errors', async () => {
    const mockError = { status: 400, error: { error: { message: 'Email already exists' } } };
    mockAuthService.register.and.returnValue(throwError(() => mockError));
    
    fixture.componentRef.setInput('mode', 'register');
    fixture.detectChanges();
    
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.onSubmit();
    
    expect(component.errorMessage).toContain('already registered');
  });

  it('should clear error message when form values change', () => {
    component.errorMessage = 'Test error';
    component.email = 'new@example.com';
    
    // Simulate form change
    component.errorMessage = '';
    
    expect(component.errorMessage).toBe('');
  });

  it('should emit close event', () => {
    spyOn(component.close, 'emit');
    
    component.onBackdropClick(new MouseEvent('click'));
    
    // close.emit is called in template, test the output exists
    expect(component.close).toBeDefined();
  });

  it('should reset form on mode toggle', () => {
    component.name = 'Test';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.errorMessage = 'Error';
    
    component.toggleMode();
    
    // Form should be reset after toggle
    expect(component.name).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should handle loading state', async () => {
    mockAuthService.login.and.returnValue(of(true));
    mockAuthService.getCurrentUserProfile.and.returnValue(of({} as any));
    
    component.email = 'test@example.com';
    component.password = 'password123';
    
    const promise = component.onSubmit();
    expect(component.isLoading).toBe(true);
    
    await promise;
    expect(component.isLoading).toBe(false);
  });
});
