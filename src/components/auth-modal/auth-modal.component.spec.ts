import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { AuthModalComponent } from './auth-modal.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

describe('AuthModalComponent', () => {
  let component: AuthModalComponent;
  let fixture: ComponentFixture<AuthModalComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'register',
      'logout',
      'getCurrentUser'
    ]);

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');

    await TestBed.configureTestingModule({
      imports: [
        AuthModalComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login mode', () => {
    expect(component.isLoginMode()).toBeTrue();
    expect(component.isRegisterMode()).toBeFalse();
  });

  it('should switch to register mode', () => {
    component.switchToRegister();
    
    expect(component.isLoginMode()).toBeFalse();
    expect(component.isRegisterMode()).toBeTrue();
  });

  it('should switch to login mode', () => {
    component.switchToRegister();
    component.switchToLogin();
    
    expect(component.isLoginMode()).toBeTrue();
    expect(component.isRegisterMode()).toBeFalse();
  });

  it('should display login form by default', () => {
    fixture.detectChanges();
    
    const loginForm = fixture.debugElement.query(By.css('[data-testid="login-form"]'));
    const registerForm = fixture.debugElement.query(By.css('[data-testid="register-form"]'));
    
    expect(loginForm).toBeTruthy();
    expect(registerForm).toBeFalsy();
  });

  it('should display register form when in register mode', () => {
    component.switchToRegister();
    fixture.detectChanges();
    
    const loginForm = fixture.debugElement.query(By.css('[data-testid="login-form"]'));
    const registerForm = fixture.debugElement.query(By.css('[data-testid="register-form"]'));
    
    expect(loginForm).toBeFalsy();
    expect(registerForm).toBeTruthy();
  });

  it('should handle login form submission', async () => {
    const mockResponse = { success: true, token: 'mock-token', user: { id: 1, email: 'test@example.com' } };
    mockAuthService.login.and.returnValue(Promise.resolve(mockResponse));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    await component.onLogin();
    
    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(component.errorMessage()).toBe('');
  });

  it('should handle login form validation errors', async () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });
    
    await component.onLogin();
    
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Please fill in all fields');
  });

  it('should handle login API errors', async () => {
    const mockError = { status: 401, error: { message: 'Invalid credentials' } };
    mockAuthService.login.and.returnValue(Promise.reject(mockError));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    await component.onLogin();
    
    expect(component.errorMessage()).toContain('Invalid email or password');
  });

  it('should handle login network errors', async () => {
    const mockError = { status: 0, statusText: 'Unknown Error' };
    mockAuthService.login.and.returnValue(Promise.reject(mockError));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    await component.onLogin();
    
    expect(component.errorMessage()).toContain('Network error. Please check your connection');
  });

  it('should handle register form submission', async () => {
    const mockResponse = { success: true, message: 'Registration successful' };
    mockAuthService.register.and.returnValue(Promise.resolve(mockResponse));
    
    component.registerForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email'
    });
    
    await component.onRegister();
    
    expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email'
    }));
    expect(component.errorMessage()).toBe('');
  });

  it('should handle register form validation errors', async () => {
    component.registerForm.patchValue({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      authProvider: 'Email'
    });
    
    await component.onRegister();
    
    expect(mockAuthService.register).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Please fill in all fields');
  });

  it('should handle register API errors', async () => {
    const mockError = { status: 400, error: { message: 'Email already exists' } };
    mockAuthService.register.and.returnValue(Promise.reject(mockError));
    
    component.registerForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email'
    });
    
    await component.onRegister();
    
    expect(component.errorMessage()).toContain('Email already exists');
  });

  it('should handle register network errors', async () => {
    const mockError = { status: 0, statusText: 'Unknown Error' };
    mockAuthService.register.and.returnValue(Promise.reject(mockError));
    
    component.registerForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email'
    });
    
    await component.onRegister();
    
    expect(component.errorMessage()).toContain('Network error. Please check your connection');
  });

  it('should clear error message when form values change', () => {
    component.errorMessage.set('Test error');
    
    component.loginForm.patchValue({ email: 'new@example.com' });
    component.onFormChange();
    
    expect(component.errorMessage()).toBe('');
  });

  it('should clear error message when switching modes', () => {
    component.errorMessage.set('Test error');
    
    component.switchToRegister();
    
    expect(component.errorMessage()).toBe('');
  });

  it('should display error messages', () => {
    component.errorMessage.set('Test error message');
    fixture.detectChanges();
    
    const errorElement = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
    expect(errorElement.nativeElement.textContent).toContain('Test error message');
  });

  it('should hide error messages when empty', () => {
    component.errorMessage.set('');
    fixture.detectChanges();
    
    const errorElement = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
    expect(errorElement).toBeFalsy();
  });

  it('should display loading state during login', async () => {
    mockAuthService.login.and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    const loginPromise = component.onLogin();
    
    expect(component.isLoading()).toBeTrue();
    
    await loginPromise;
    
    expect(component.isLoading()).toBeFalse();
  });

  it('should display loading state during registration', async () => {
    mockAuthService.register.and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));
    
    component.registerForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      authProvider: 'Email'
    });
    
    const registerPromise = component.onRegister();
    
    expect(component.isLoading()).toBeTrue();
    
    await registerPromise;
    
    expect(component.isLoading()).toBeFalse();
  });

  it('should disable submit button when loading', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    
    const loginButton = fixture.debugElement.query(By.css('[data-testid="login-button"]'));
    if (loginButton) {
      expect(loginButton.nativeElement.disabled).toBeTrue();
    }
    
    component.switchToRegister();
    fixture.detectChanges();
    
    const registerButton = fixture.debugElement.query(By.css('[data-testid="register-button"]'));
    if (registerButton) {
      expect(registerButton.nativeElement.disabled).toBeTrue();
    }
  });

  it('should display form validation errors', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: '123'
    });
    
    fixture.detectChanges();
    
    const emailError = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
    const passwordError = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
    
    if (emailError) {
      expect(emailError.nativeElement.textContent).toContain('Please enter a valid email');
    }
    
    if (passwordError) {
      expect(passwordError.nativeElement.textContent).toContain('Password must be at least 6 characters');
    }
  });

  it('should handle password confirmation validation', () => {
    component.switchToRegister();
    
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different123'
    });
    
    fixture.detectChanges();
    
    const confirmPasswordError = fixture.debugElement.query(By.css('[data-testid="confirm-password-error"]'));
    
    if (confirmPasswordError) {
      expect(confirmPasswordError.nativeElement.textContent).toContain('Passwords do not match');
    }
  });

  it('should translate form labels and buttons', () => {
    fixture.detectChanges();
    
    expect(mockTranslationService.translate).toHaveBeenCalledWith('auth.login');
    expect(mockTranslationService.translate).toHaveBeenCalledWith('auth.register');
    expect(mockTranslationService.translate).toHaveBeenCalledWith('auth.email');
    expect(mockTranslationService.translate).toHaveBeenCalledWith('auth.password');
  });

  it('should handle form reset', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.resetForms();
    
    expect(component.loginForm.value.email).toBe('');
    expect(component.loginForm.value.password).toBe('');
    expect(component.registerForm.value.username).toBe('');
    expect(component.registerForm.value.email).toBe('');
    expect(component.registerForm.value.password).toBe('');
    expect(component.registerForm.value.firstName).toBe('');
    expect(component.registerForm.value.lastName).toBe('');
  });

  it('should emit close event when close button is clicked', () => {
    spyOn(component.closeModal, 'emit');
    
    const closeButton = fixture.debugElement.query(By.css('[data-testid="close-button"]'));
    if (closeButton) {
      closeButton.nativeElement.click();
      expect(component.closeModal.emit).toHaveBeenCalled();
    }
  });

  it('should emit close event when backdrop is clicked', () => {
    spyOn(component.closeModal, 'emit');
    
    const backdrop = fixture.debugElement.query(By.css('[data-testid="modal-backdrop"]'));
    if (backdrop) {
      backdrop.nativeElement.click();
      expect(component.closeModal.emit).toHaveBeenCalled();
    }
  });

  it('should not emit close event when modal content is clicked', () => {
    spyOn(component.closeModal, 'emit');
    
    const modalContent = fixture.debugElement.query(By.css('[data-testid="modal-content"]'));
    if (modalContent) {
      modalContent.nativeElement.click();
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }
  });
});


