import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';
import { NavigationService } from '../../services/navigation.service';

interface UserRegistration {
  // Basic Account
  username: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address?: {
    country: string;
    city: string;
    street: string;
    houseNumber: string;
    zipCode: string;
  };
  
  // Communication
  email: string;
  phoneNumbers: string[];
  
  // Security
  password: string;
  confirmPassword: string;
  
  // Premium Account (Identity Validation)
  passportIdNumber?: string;
  passportFrontImage?: File;
  passportBackImage?: File;
  faceImage?: File;
  isIdentityValidated?: boolean;
}

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-48 md:h-64">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Registration" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-4xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('register.heroTitle') }}
              </h1>
              <p class="text-lg md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('register.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Progress Indicator -->
        <div class="mb-12">
          <div class="flex items-center justify-center space-x-4">
            @for (step of steps; track step.id; let i = $index) {
              <div class="flex items-center">
                <div 
                  [class]="currentStep() >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'"
                  class="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300">
                  {{ step.id }}
                </div>
                <div class="ml-3 text-center">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ translate(step.title) }}</p>
                </div>
              </div>
              @if (i < steps.length - 1) {
                <div 
                  [class]="currentStep() > step.id ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  class="w-12 h-1 mx-4 transition-all duration-300">
                </div>
              }
            }
          </div>
        </div>

        <!-- Registration Form -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <!-- Step 1: Personal Details -->
          @if (currentStep() === 1) {
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('register.personalDetails') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                {{ translate('register.personalDetailsDesc') }}
              </p>

              <form [formGroup]="personalDetailsForm" (ngSubmit)="onPersonalDetailsSubmit()" class="space-y-6">
                <!-- Username -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.username') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="username"
                    [class]="usernameError() ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'"
                    class="input-field"
                    [placeholder]="translate('register.usernamePlaceholder')">
                  @if (usernameError()) {
                    <p class="mt-2 text-sm text-red-600 dark:text-red-400">
                      {{ translate('register.usernameExists') }}
                    </p>
                  }
                  @if (usernameSuggestions().length > 0) {
                    <div class="mt-2">
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ translate('register.suggestedUsernames') }}:</p>
                      <div class="flex flex-wrap gap-2">
                        @for (suggestion of usernameSuggestions(); track suggestion) {
                          <button
                            type="button"
                            (click)="selectUsernameSuggestion(suggestion)"
                            class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            {{ suggestion }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- First Name & Last Name -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.firstName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      formControlName="firstName"
                      class="input-field"
                      [placeholder]="translate('register.firstNamePlaceholder')">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.lastName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      formControlName="lastName"
                      class="input-field"
                      [placeholder]="translate('register.lastNamePlaceholder')">
                  </div>
                </div>

                <!-- ID Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.idNumber') }}
                  </label>
                  <input
                    type="text"
                    formControlName="idNumber"
                    class="input-field"
                    [placeholder]="translate('register.idNumberPlaceholder')">
                </div>

                <!-- Gender & Date of Birth -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.gender') }} <span class="text-red-500">*</span>
                    </label>
                    <select formControlName="gender" class="input-field">
                      <option value="">{{ translate('register.selectGender') }}</option>
                      <option value="male">{{ translate('register.male') }}</option>
                      <option value="female">{{ translate('register.female') }}</option>
                      <option value="other">{{ translate('register.other') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.dateOfBirth') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      formControlName="dateOfBirth"
                      class="input-field">
                  </div>
                </div>

                <!-- Address (Optional) -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('register.address') }} ({{ translate('register.optional') }})
                  </h3>
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('register.country') }}
                      </label>
                      <input
                        type="text"
                        formControlName="country"
                        class="input-field"
                        [placeholder]="translate('register.countryPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('register.city') }}
                      </label>
                      <input
                        type="text"
                        formControlName="city"
                        class="input-field"
                        [placeholder]="translate('register.cityPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('register.street') }}
                      </label>
                      <input
                        type="text"
                        formControlName="street"
                        class="input-field"
                        [placeholder]="translate('register.streetPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('register.houseNumber') }}
                      </label>
                      <input
                        type="text"
                        formControlName="houseNumber"
                        class="input-field"
                        [placeholder]="translate('register.houseNumberPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('register.zipCode') }}
                      </label>
                      <input
                        type="text"
                        formControlName="zipCode"
                        class="input-field"
                        [placeholder]="translate('register.zipCodePlaceholder')">
                    </div>
                  </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-end pt-6">
                  <button
                    type="submit"
                    [disabled]="personalDetailsForm.invalid"
                    class="btn-primary">
                    {{ translate('register.nextStep') }}
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- Step 2: Communication Methods -->
          @if (currentStep() === 2) {
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('register.communicationMethods') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                {{ translate('register.communicationMethodsDesc') }}
              </p>

              <form [formGroup]="communicationForm" (ngSubmit)="onCommunicationSubmit()" class="space-y-6">
                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.email') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    class="input-field"
                    [placeholder]="translate('register.emailPlaceholder')">
                  @if (emailVerified()) {
                    <p class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      {{ translate('register.emailVerified') }}
                    </p>
                  }
                </div>

                <!-- Phone Numbers -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.phone') }} <span class="text-red-500">*</span>
                  </label>
                  @for (phone of phoneNumbers(); track $index) {
                    <div class="flex items-center space-x-2 mb-2">
                      <input
                        type="tel"
                        [(ngModel)]="phoneNumbers()[$index]"
                        class="input-field flex-1"
                        [placeholder]="translate('register.phonePlaceholder')">
                      @if (phoneNumbers().length > 1) {
                        <button
                          type="button"
                          (click)="removePhoneNumber($index)"
                          class="p-2 text-red-600 hover:text-red-800 transition-colors">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      }
                    </div>
                  }
                  @if (phoneNumbers().length < 3) {
                    <button
                      type="button"
                      (click)="addPhoneNumber()"
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                      {{ translate('register.addAnother') }}
                    </button>
                  }
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between pt-6">
                  <button
                    type="button"
                    (click)="goToPreviousStep()"
                    class="btn-outline">
                    {{ translate('register.previousStep') }}
                  </button>
                  <button
                    type="submit"
                    [disabled]="communicationForm.invalid"
                    class="btn-primary">
                    {{ translate('register.nextStep') }}
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- Step 3: Password -->
          @if (currentStep() === 3) {
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('register.createPassword') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                {{ translate('register.createPasswordDesc') }}
              </p>

              <form [formGroup]="passwordForm" (ngSubmit)="onPasswordSubmit()" class="space-y-6">
                <!-- Password -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.password') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    formControlName="password"
                    class="input-field"
                    [placeholder]="translate('register.passwordPlaceholder')">
                  <!-- Password Strength Indicator -->
                  <div class="mt-2">
                    <div class="flex space-x-1">
                      @for (strength of passwordStrength(); track $index) {
                        <div 
                          [class]="strength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
                          class="h-2 flex-1 rounded-full transition-colors duration-300">
                        </div>
                      }
                    </div>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {{ translate('register.passwordRequirements') }}
                    </p>
                  </div>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.confirmPassword') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    formControlName="confirmPassword"
                    class="input-field"
                    [placeholder]="translate('register.confirmPasswordPlaceholder')">
                  @if (passwordForm.get('confirmPassword')?.touched && passwordForm.get('confirmPassword')?.errors?.['mismatch']) {
                    <p class="mt-2 text-sm text-red-600 dark:text-red-400">
                      {{ translate('register.passwordsDoNotMatch') }}
                    </p>
                  }
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between pt-6">
                  <button
                    type="button"
                    (click)="goToPreviousStep()"
                    class="btn-outline">
                    {{ translate('register.previousStep') }}
                  </button>
                  <button
                    type="submit"
                    [disabled]="passwordForm.invalid"
                    class="btn-primary">
                    {{ translate('register.createAccount') }}
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- Step 4: Identity Validation (Premium) -->
          @if (currentStep() === 4) {
            <div>
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('register.identityValidation') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                {{ translate('register.identityValidationDesc') }}
              </p>

              <!-- Privacy Notice -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                <div class="flex items-start">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      {{ translate('register.privacyNotice') }}
                    </h3>
                    <p class="text-blue-700 dark:text-blue-300">
                      {{ translate('register.privacyNoticeDesc') }}
                    </p>
                  </div>
                </div>
              </div>

              <form [formGroup]="identityForm" (ngSubmit)="onIdentitySubmit()" class="space-y-6">
                <!-- Passport/ID Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ translate('register.passportIdNumber') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="passportIdNumber"
                    class="input-field"
                    [placeholder]="translate('register.passportIdNumberPlaceholder')">
                </div>

                <!-- Document Upload -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.passportFront') }} <span class="text-red-500">*</span>
                    </label>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onFileSelected($event, 'front')"
                        class="hidden"
                        #frontFileInput>
                      <button
                        type="button"
                        (click)="frontFileInput.click()"
                        class="text-blue-600 hover:text-blue-800 font-medium">
                        {{ translate('register.uploadImage') }}
                      </button>
                      @if (passportFrontImage()) {
                        <p class="mt-2 text-sm text-green-600 dark:text-green-400">
                          {{ translate('register.imageUploaded') }}
                        </p>
                      }
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ translate('register.passportBack') }} <span class="text-red-500">*</span>
                    </label>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onFileSelected($event, 'back')"
                        class="hidden"
                        #backFileInput>
                      <button
                        type="button"
                        (click)="backFileInput.click()"
                        class="text-blue-600 hover:text-blue-800 font-medium">
                        {{ translate('register.uploadImage') }}
                      </button>
                      @if (passportBackImage()) {
                        <p class="mt-2 text-sm text-green-600 dark:text-green-400">
                          {{ translate('register.imageUploaded') }}
                        </p>
                      }
                    </div>
                  </div>
                </div>

                <!-- Validate Details Button -->
                @if (canValidateDetails()) {
                  <div class="text-center">
                    <button
                      type="button"
                      (click)="validateDetails()"
                      class="btn-primary">
                      {{ translate('register.validateDetails') }}
                    </button>
                  </div>
                }

                <!-- Face Capture -->
                @if (showFaceCapture()) {
                  <div class="text-center">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {{ translate('register.faceCapture') }}
                    </h3>
                    <button
                      type="button"
                      (click)="captureFace()"
                      class="btn-primary">
                      {{ translate('register.captureFace') }}
                    </button>
                  </div>
                }

                <!-- Navigation Buttons -->
                <div class="flex justify-between pt-6">
                  <button
                    type="button"
                    (click)="goToPreviousStep()"
                    class="btn-outline">
                    {{ translate('register.previousStep') }}
                  </button>
                  <button
                    type="submit"
                    [disabled]="!isIdentityValidated()"
                    class="btn-primary">
                    {{ translate('register.completeRegistration') }}
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class RegistrationPageComponent {
  private translationService = inject(TranslationService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);

  currentStep = signal(1);
  usernameError = signal(false);
  usernameSuggestions = signal<string[]>([]);
  emailVerified = signal(false);
  phoneNumbers = signal<string[]>(['']);
  passwordStrength = signal<boolean[]>([false, false, false, false, false]);
  passportFrontImage = signal<File | null>(null);
  passportBackImage = signal<File | null>(null);
  isIdentityValidated = signal(false);
  showFaceCapture = signal(false);

  steps = [
    { id: 1, title: 'register.personalDetails' },
    { id: 2, title: 'register.communication' },
    { id: 3, title: 'register.password' },
    { id: 4, title: 'register.identityValidation' }
  ];

  personalDetailsForm: FormGroup;
  communicationForm: FormGroup;
  passwordForm: FormGroup;
  identityForm: FormGroup;

  constructor() {
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

  translate(key: string): string {
    return this.translationService.translate(key);
  }

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

  updatePasswordStrength(password: string) {
    const strength = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    this.passwordStrength.set(strength);
  }

  onPersonalDetailsSubmit() {
    if (this.personalDetailsForm.valid) {
      // Check username availability
      this.checkUsernameAvailability();
    }
  }

  checkUsernameAvailability() {
    const username = this.personalDetailsForm.get('username')?.value;
    // Simulate API call
    setTimeout(() => {
      // Mock: assume some usernames are taken
      const takenUsernames = ['john', 'jane', 'admin', 'user', 'test'];
      if (takenUsernames.includes(username.toLowerCase())) {
        this.usernameError.set(true);
        this.generateUsernameSuggestions(username);
      } else {
        this.usernameError.set(false);
        this.usernameSuggestions.set([]);
        this.currentStep.set(2);
      }
    }, 500);
  }

  generateUsernameSuggestions(username: string) {
    const suggestions = [
      `${username}123`,
      `${username}_2024`,
      `${username}user`,
      `${username}official`
    ];
    this.usernameSuggestions.set(suggestions);
  }

  selectUsernameSuggestion(suggestion: string) {
    this.personalDetailsForm.patchValue({ username: suggestion });
    this.usernameError.set(false);
    this.usernameSuggestions.set([]);
  }

  onCommunicationSubmit() {
    if (this.communicationForm.valid) {
      // Simulate email verification
      this.emailVerified.set(true);
      this.currentStep.set(3);
    }
  }

  onPasswordSubmit() {
    if (this.passwordForm.valid) {
      this.currentStep.set(4);
    }
  }

  onIdentitySubmit() {
    if (this.identityForm.valid && this.isIdentityValidated()) {
      // Complete registration
      this.completeRegistration();
    }
  }

  addPhoneNumber() {
    if (this.phoneNumbers().length < 3) {
      this.phoneNumbers.set([...this.phoneNumbers(), '']);
    }
  }

  removePhoneNumber(index: number) {
    const phones = this.phoneNumbers();
    phones.splice(index, 1);
    this.phoneNumbers.set(phones);
  }

  onFileSelected(event: any, type: 'front' | 'back') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'front') {
        this.passportFrontImage.set(file);
      } else {
        this.passportBackImage.set(file);
      }
    }
  }

  canValidateDetails(): boolean {
    return !!(this.identityForm.get('passportIdNumber')?.value && 
              this.passportFrontImage() && 
              this.passportBackImage());
  }

  validateDetails() {
    // Simulate Regula validation
    setTimeout(() => {
      this.showFaceCapture.set(true);
    }, 1000);
  }

  captureFace() {
    // Simulate face capture and validation
    setTimeout(() => {
      this.isIdentityValidated.set(true);
    }, 2000);
  }

  completeRegistration() {
    // Navigate to success page or login
    this.navigationService.navigateTo('home');
  }

  goToPreviousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }
}
