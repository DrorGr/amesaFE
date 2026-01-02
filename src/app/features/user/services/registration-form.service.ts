import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CaptchaService } from '@core/services/captcha.service';
import { ToastService } from '@core/services/toast.service';
import { TranslationService } from '@core/services/translation.service';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationFormService implements OnDestroy {
  private authService: AuthService;
  private captchaService: CaptchaService;
  private toastService: ToastService;
  private translationService: TranslationService;
  private router: Router;
  private fb: FormBuilder;

  // Form state
  private _currentStep = signal<number>(1);
  private _isLoading = signal<boolean>(false);
  private _isCheckingUsername = signal<boolean>(false);
  private _passwordStrength = signal<boolean[]>([false, false, false, false, false]);
  private _usernameError = signal<boolean>(false);
  private _usernameSuggestions = signal<string[]>([]);
  private _emailVerified = signal<boolean>(false);
  
  // Debouncing for username checks
  private usernameCheckSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private _phoneNumbers = signal<string[]>(['']);
  private _passportFrontImage = signal<File | null>(null);
  private _passportBackImage = signal<File | null>(null);
  private _showFaceCapture = signal<boolean>(false);
  private _isIdentityValidated = signal<boolean>(false);
  
  // Form progress saving
  private readonly STORAGE_KEY = 'amesa_registration_progress';
  private readonly STORAGE_EXPIRY_HOURS = 24; // Save progress for 24 hours

  // Forms
  personalDetailsForm: FormGroup;
  communicationForm: FormGroup;
  passwordForm: FormGroup;
  identityForm: FormGroup;

  // Readonly signals
  currentStep = this._currentStep.asReadonly();
  isLoading = this._isLoading.asReadonly();
  isCheckingUsername = this._isCheckingUsername.asReadonly();
  passwordStrength = this._passwordStrength.asReadonly();
  usernameError = this._usernameError.asReadonly();
  usernameSuggestions = this._usernameSuggestions.asReadonly();
  emailVerified = this._emailVerified.asReadonly();
  phoneNumbers = this._phoneNumbers.asReadonly();
  passportFrontImage = this._passportFrontImage.asReadonly();
  passportBackImage = this._passportBackImage.asReadonly();
  showFaceCapture = this._showFaceCapture.asReadonly();
  isIdentityValidated = this._isIdentityValidated.asReadonly();

  constructor(
    authService: AuthService,
    captchaService: CaptchaService,
    toastService: ToastService,
    translationService: TranslationService,
    router: Router,
    fb: FormBuilder
  ) {
    this.authService = authService;
    this.captchaService = captchaService;
    this.toastService = toastService;
    this.translationService = translationService;
    this.router = router;
    this.fb = fb;

    // Initialize forms
    this.personalDetailsForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: [''],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      country: [''],
      city: [''],
      street: [''],
      houseNumber: [''],
      zipCode: ['']
    });

    this.communicationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.identityForm = this.fb.group({
      passportIdNumber: ['', Validators.required]
    });

    // Watch password changes for strength indicator
    this.passwordForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });

    // Setup debounced username availability check
    this.usernameCheckSubject.pipe(
      debounceTime(500), // 500ms debounce
      distinctUntilChanged(),
      switchMap(username => {
        this._isCheckingUsername.set(true);
        return this.authService.checkUsernameAvailability(username).pipe(
          catchError(error => {
            console.error('Username availability check failed:', error);
            this._isCheckingUsername.set(false);
            return [{ available: false, suggestions: [] }];
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this._isCheckingUsername.set(false);
        if (result.available) {
          this._usernameError.set(false);
          this._usernameSuggestions.set([]);
        } else {
          this._usernameError.set(true);
          this._usernameSuggestions.set(result.suggestions || []);
        }
      },
      error: (error) => {
        console.error('Username availability check error:', error);
        this._isCheckingUsername.set(false);
        this._usernameError.set(true);
      }
    });

    // Load saved progress on initialization
    this.loadProgress();
    
    // Save progress when forms change
    this.personalDetailsForm.valueChanges.subscribe(() => this.saveProgress());
    this.communicationForm.valueChanges.subscribe(() => this.saveProgress());
    this.passwordForm.valueChanges.subscribe(() => this.saveProgress());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Save progress when component is destroyed (user navigates away)
    this.saveProgress();
  }
  
  // Form progress saving methods
  private saveProgress(): void {
    try {
      const progress = {
        currentStep: this._currentStep(),
        personalDetails: this.personalDetailsForm.value,
        communication: this.communicationForm.value,
        // Note: We don't save passwords for security reasons
        phoneNumbers: this._phoneNumbers(),
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save registration progress:', error);
      // Fail silently - progress saving is not critical
    }
  }
  
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        return; // No saved progress
      }
      
      const progress = JSON.parse(saved);
      
      // Check if progress is expired (24 hours)
      const savedAt = new Date(progress.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > this.STORAGE_EXPIRY_HOURS) {
        // Progress expired, clear it
        this.clearProgress();
        return;
      }
      
      // Restore current step
      if (progress.currentStep && progress.currentStep >= 1 && progress.currentStep <= 3) {
        this._currentStep.set(progress.currentStep);
      }
      
      // Restore form values
      if (progress.personalDetails) {
        this.personalDetailsForm.patchValue(progress.personalDetails, { emitEvent: false });
      }
      
      if (progress.communication) {
        this.communicationForm.patchValue(progress.communication, { emitEvent: false });
      }
      
      // Restore phone numbers
      if (progress.phoneNumbers && Array.isArray(progress.phoneNumbers)) {
        this._phoneNumbers.set(progress.phoneNumbers);
      }
    } catch (error) {
      console.error('Failed to load registration progress:', error);
      // Clear corrupted data
      this.clearProgress();
    }
  }
  
  clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear registration progress:', error);
    }
  }

  // Step navigation
  goToNextStep(): void {
    this._currentStep.set(this._currentStep() + 1);
    this.saveProgress(); // Save progress when moving to next step
  }

  goToPreviousStep(): void {
    if (this._currentStep() > 1) {
      this._currentStep.set(this._currentStep() - 1);
    }
  }

  // Password validation
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  updatePasswordStrength(password: string): void {
    // Align with backend validation: 8-128 characters, uppercase, lowercase, digit, special character
    const strength = [
      password.length >= 8 && password.length <= 128, // Length: 8-128 characters
      /[A-Z]/.test(password), // Uppercase letter
      /[a-z]/.test(password), // Lowercase letter
      /\d/.test(password), // Digit
      /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) // Special character (matches backend regex)
    ];
    this._passwordStrength.set(strength);
  }

  // Username validation - triggers debounced API call
  checkUsernameAvailability(): void {
    const username = this.personalDetailsForm.get('username')?.value;
    if (!username || username.length < 3) {
      this._usernameError.set(false);
      this._usernameSuggestions.set([]);
      return;
    }

    // Trigger debounced check via subject
    this.usernameCheckSubject.next(username.trim().toLowerCase());
  }

  // Manual check (for form submission)
  async checkUsernameAvailabilitySync(): Promise<boolean> {
    const username = this.personalDetailsForm.get('username')?.value;
    if (!username || username.length < 3) {
      return false;
    }

    try {
      this._isCheckingUsername.set(true);
      const result = await firstValueFrom(
        this.authService.checkUsernameAvailability(username.trim())
      );
      this._isCheckingUsername.set(false);
      
      if (result.available) {
        this._usernameError.set(false);
        this._usernameSuggestions.set([]);
        return true;
      } else {
        this._usernameError.set(true);
        this._usernameSuggestions.set(result.suggestions || []);
        return false;
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      this._isCheckingUsername.set(false);
      this._usernameError.set(true);
      return false;
    }
  }

  generateUsernameSuggestions(username: string): void {
    const suggestions = [
      `${username}123`,
      `${username}_2024`,
      `${username}user`,
      `${username}official`
    ];
    this._usernameSuggestions.set(suggestions);
  }

  selectUsernameSuggestion(suggestion: string): void {
    this.personalDetailsForm.patchValue({ username: suggestion });
    this._usernameError.set(false);
    this._usernameSuggestions.set([]);
  }

  // Phone numbers
  addPhoneNumber(): void {
    if (this._phoneNumbers().length < 3) {
      this._phoneNumbers.set([...this._phoneNumbers(), '']);
    }
  }

  removePhoneNumber(index: number): void {
    const phones = this._phoneNumbers();
    phones.splice(index, 1);
    this._phoneNumbers.set(phones);
  }

  // File handling
  onFileSelected(event: any, type: 'front' | 'back'): void {
    const file = event.target.files[0];
    if (file) {
      if (type === 'front') {
        this._passportFrontImage.set(file);
      } else {
        this._passportBackImage.set(file);
      }
    }
  }

  // Identity validation
  canValidateDetails(): boolean {
    return !!(this.identityForm.get('passportIdNumber')?.value &&
      this._passportFrontImage() &&
      this._passportBackImage());
  }

  validateDetails(): void {
    // Simulate Regula validation
    setTimeout(() => {
      this._showFaceCapture.set(true);
    }, 1000);
  }

  captureFace(): void {
    // Simulate face capture and validation
    setTimeout(() => {
      this._isIdentityValidated.set(true);
    }, 2000);
  }

  // Form submission
  async onPersonalDetailsSubmit(): Promise<void> {
    if (this.personalDetailsForm.valid) {
      const isAvailable = await this.checkUsernameAvailabilitySync();
      if (isAvailable) {
        this.goToNextStep();
      } else {
        // Username error and suggestions already set by checkUsernameAvailabilitySync
        // Show error message
        const username = this.personalDetailsForm.get('username')?.value;
        if (this.translationService && this.toastService) {
          const message = this.translationService.translate('auth.usernameTaken') || 
                         `Username "${username}" is already taken. Please choose another.`;
          this.toastService.error(message);
        }
      }
    }
  }

  onCommunicationSubmit(): void {
    if (this.communicationForm.valid) {
      // Simulate email verification
      this._emailVerified.set(true);
      this.goToNextStep();
    }
  }

  async onPasswordSubmit(): Promise<void> {
    if (this.passwordForm.valid) {
      // Complete registration directly
      await this.completeRegistration();
    }
  }

  onIdentitySubmit(): void {
    if (this.identityForm.valid && this._isIdentityValidated()) {
      // Complete registration
      this.completeRegistration();
    }
  }

  // Social registration
  async registerWithGoogle(): Promise<void> {
    this._isLoading.set(true);
    try {
      const result = await this.authService.loginWithGoogle();
      if (result) {
        this.router.navigate(['/member-settings']);
      }
    } catch (error) {
      console.error('Google registration error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async registerWithMeta(): Promise<void> {
    this._isLoading.set(true);
    try {
      const result = await this.authService.loginWithMeta();
      if (result) {
        this.router.navigate(['/member-settings']);
      }
    } catch (error) {
      console.error('Meta registration error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async registerWithApple(): Promise<void> {
    this._isLoading.set(true);
    try {
      const result = await this.authService.loginWithApple();
      if (result) {
        this.router.navigate(['/member-settings']);
      }
    } catch (error) {
      console.error('Apple registration error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  // Complete registration
  async completeRegistration(): Promise<void> {
    if (!this.personalDetailsForm.valid || !this.communicationForm.valid || !this.passwordForm.valid) {
      this.toastService.error(this.translationService.translate('register.pleaseCompleteAllFields'), 3000);
      return;
    }

    this._isLoading.set(true);

    try {
      // Get CAPTCHA token
      let captchaToken: string | null = null;
      try {
        captchaToken = await this.captchaService.execute('register');
      } catch (error) {
        console.warn('CAPTCHA execution failed, continuing without token:', error);
        // Continue without CAPTCHA token - backend will handle gracefully
      }

      // Prepare registration data
      const registerData = {
        username: this.personalDetailsForm.get('username')?.value,
        email: this.communicationForm.get('email')?.value,
        password: this.passwordForm.get('password')?.value,
        firstName: this.personalDetailsForm.get('firstName')?.value,
        lastName: this.personalDetailsForm.get('lastName')?.value,
        dateOfBirth: this.personalDetailsForm.get('dateOfBirth')?.value,
        gender: this.personalDetailsForm.get('gender')?.value,
        phone: this._phoneNumbers()[0] || '',
        authProvider: 'email',
        captchaToken: captchaToken || undefined
      };

      const result = await firstValueFrom(this.authService.register(registerData));

      if (result?.success) {
        // Clear saved progress after successful registration
        this.clearProgress();
        
        if (result.requiresEmailVerification) {
          // Redirect to email verification page
          this.toastService.success(this.translationService.translate('register.verificationEmailSent'), 5000);
          this.router.navigate(['/verify-email'], {
            queryParams: { email: registerData.email }
          });
        } else {
          // OAuth user or already verified - redirect to dashboard
          this.toastService.success(this.translationService.translate('register.registrationSuccess'), 3000);
          this.router.navigate(['/member-settings']);
        }
      } else {
        this.toastService.error(this.translationService.translate('register.registrationFailed'), 3000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error codes
      const errorCode = error?.error?.error?.code || error?.error?.code;
      const errorMessage = error?.error?.error?.message || error?.error?.message;

      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        this.toastService.error(this.translationService.translate('auth.tooManyRegistrationAttempts'), 3000);
      } else if (errorCode === 'CAPTCHA_FAILED') {
        this.toastService.error(this.translationService.translate('auth.captchaFailed'), 3000);
      } else if (errorCode === 'VALIDATION_ERROR') {
        this.toastService.error(errorMessage || this.translationService.translate('register.validationError'), 3000);
      } else {
        this.toastService.error(errorMessage || this.translationService.translate('register.registrationFailed'), 3000);
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  // Translation helper
  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

