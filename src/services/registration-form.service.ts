import { Injectable, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RegistrationFormService {
  private authService: AuthService;
  private captchaService: CaptchaService;
  private toastService: ToastService;
  private translationService: TranslationService;
  private router: Router;
  private fb: FormBuilder;

  // Form state
  private _currentStep = signal<number>(1);
  private _isLoading = signal<boolean>(false);
  private _passwordStrength = signal<boolean[]>([false, false, false, false, false]);
  private _usernameError = signal<boolean>(false);
  private _usernameSuggestions = signal<string[]>([]);
  private _emailVerified = signal<boolean>(false);
  private _phoneNumbers = signal<string[]>(['']);
  private _passportFrontImage = signal<File | null>(null);
  private _passportBackImage = signal<File | null>(null);
  private _showFaceCapture = signal<boolean>(false);
  private _isIdentityValidated = signal<boolean>(false);

  // Forms
  personalDetailsForm: FormGroup;
  communicationForm: FormGroup;
  passwordForm: FormGroup;
  identityForm: FormGroup;

  // Readonly signals
  currentStep = this._currentStep.asReadonly();
  isLoading = this._isLoading.asReadonly();
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
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.identityForm = this.fb.group({
      passportIdNumber: ['', Validators.required]
    });

    // Watch password changes for strength indicator
    this.passwordForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  // Step navigation
  goToNextStep(): void {
    this._currentStep.set(this._currentStep() + 1);
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
    const strength = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    this._passwordStrength.set(strength);
  }

  // Username validation
  async checkUsernameAvailability(): Promise<void> {
    const username = this.personalDetailsForm.get('username')?.value;
    if (!username) return;

    // Simulate API call
    setTimeout(() => {
      // Mock: assume some usernames are taken
      const takenUsernames = ['john', 'jane', 'admin', 'user', 'test'];
      if (takenUsernames.includes(username.toLowerCase())) {
        this._usernameError.set(true);
        this.generateUsernameSuggestions(username);
      } else {
        this._usernameError.set(false);
        this._usernameSuggestions.set([]);
        this.goToNextStep();
      }
    }, 500);
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
  onPersonalDetailsSubmit(): void {
    if (this.personalDetailsForm.valid) {
      this.checkUsernameAvailability();
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

      const result = await this.authService.register(registerData).toPromise();

      if (result?.success) {
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

