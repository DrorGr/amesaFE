import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '@core/services/translation.service';
import { RegistrationFormService } from '../../../user/services/registration-form.service';


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
              <p class="text-2xl md:text-2xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
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
                  <p class="text-base md:text-sm font-semibold text-gray-900 dark:text-white">{{ translate(step.title) }}</p>
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
          <!-- Quick Registration Options -->
          @if (currentStep() === 1) {
            <div class="mb-8">
              <h2 class="text-4xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                {{ translate('register.quickRegistration') }}
              </h2>
              <p class="text-2xl md:text-xl text-gray-600 dark:text-gray-400 mb-10 text-center">
                {{ translate('register.quickRegistrationDesc') }}
              </p>

              <!-- Social Registration Buttons -->
              <div class="space-y-4 mb-8">
                <button
                  (click)="registerWithGoogle()"
                  (keydown.enter)="registerWithGoogle()"
                  (keydown.space)="registerWithGoogle(); $event.preventDefault()"
                  [disabled]="isLoading()"
                  [attr.aria-label]="translate('auth.continueWithGoogle')"
                  class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] focus:outline-none">
                  <svg class="w-8 h-8 mr-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {{ translate('auth.continueWithGoogle') }}
                </button>

                <button
                  (click)="registerWithMeta()"
                  (keydown.enter)="registerWithMeta()"
                  (keydown.space)="registerWithMeta(); $event.preventDefault()"
                  [disabled]="isLoading()"
                  [attr.aria-label]="translate('auth.continueWithMeta')"
                  class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px] focus:outline-none">
                  <svg class="w-8 h-8 mr-6" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {{ translate('auth.continueWithMeta') }}
                </button>

                <button
                  (click)="registerWithApple()"
                  [disabled]="isLoading()"
                  class="w-full flex items-center justify-center px-8 py-6 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 min-h-[80px]">
                  <svg class="w-8 h-8 mr-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  {{ translate('auth.continueWithApple') }}
                </button>
              </div>

              <!-- Divider -->
              <div class="relative mb-8">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-base">
                  <span class="px-4 py-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">{{ translate('auth.or') }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Step 1: Personal Details -->
          @if (currentStep() === 1) {
            <div>
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('register.personalDetails') }}
              </h2>
              <p class="text-2xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8">
                {{ translate('register.personalDetailsDesc') }}
              </p>

              <form [formGroup]="personalDetailsForm" (ngSubmit)="onPersonalDetailsSubmit()" class="space-y-6">
                <!-- Username -->
                <div>
                  <label 
                    for="username"
                    class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.username') }} <span class="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    formControlName="username"
                    [attr.aria-label]="translate('register.username')"
                    [attr.aria-required]="true"
                    [attr.aria-invalid]="usernameError() ? 'true' : 'false'"
                    [attr.aria-describedby]="usernameError() ? 'username-error' : (usernameSuggestions().length > 0 ? 'username-suggestions' : null)"
                    [class]="usernameError() ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
                    class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 focus:outline-none"
                    [placeholder]="translate('register.usernamePlaceholder')">
                  @if (usernameError()) {
                    <p 
                      id="username-error"
                      class="mt-2 text-sm text-red-600 dark:text-red-400"
                      role="alert"
                      [attr.aria-live]="'polite'">
                      {{ translate('register.usernameExists') }}
                    </p>
                  }
                  @if (usernameSuggestions().length > 0) {
                    <div id="username-suggestions" class="mt-2">
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
                    <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {{ translate('register.firstName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      formControlName="firstName"
                      autocomplete="given-name"
                      [class.border-red-500]="shouldShowError('firstName', personalDetailsForm)"
                      [class.dark:border-red-500]="shouldShowError('firstName', personalDetailsForm)"
                      class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      [placeholder]="translate('register.firstNamePlaceholder')">
                    @if (shouldShowError('firstName', personalDetailsForm)) {
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {{ getErrorMessage('firstName', personalDetailsForm) }}
                      </p>
                    }
                  </div>
                  <div>
                    <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {{ translate('register.lastName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      formControlName="lastName"
                      autocomplete="family-name"
                      [class.border-red-500]="shouldShowError('lastName', personalDetailsForm)"
                      [class.dark:border-red-500]="shouldShowError('lastName', personalDetailsForm)"
                      class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      [placeholder]="translate('register.lastNamePlaceholder')">
                    @if (shouldShowError('lastName', personalDetailsForm)) {
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {{ getErrorMessage('lastName', personalDetailsForm) }}
                      </p>
                    }
                  </div>
                </div>

                <!-- ID Number -->
                <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.idNumber') }}
                  </label>
                  <input
                    type="text"
                    formControlName="idNumber"
                    autocomplete="off"
                    class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    [placeholder]="translate('register.idNumberPlaceholder')">
                </div>

                <!-- Gender & Date of Birth -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {{ translate('register.gender') }} <span class="text-red-500">*</span>
                    </label>
                    <select formControlName="gender" autocomplete="sex" class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                      <option value="">{{ translate('register.selectGender') }}</option>
                      <option value="male">{{ translate('register.male') }}</option>
                      <option value="female">{{ translate('register.female') }}</option>
                      <option value="other">{{ translate('register.other') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {{ translate('register.dateOfBirth') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      formControlName="dateOfBirth"
                      autocomplete="bday"
                      [class.border-red-500]="shouldShowError('dateOfBirth', personalDetailsForm)"
                      [class.dark:border-red-500]="shouldShowError('dateOfBirth', personalDetailsForm)"
                      class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200">
                    @if (shouldShowError('dateOfBirth', personalDetailsForm)) {
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {{ getErrorMessage('dateOfBirth', personalDetailsForm) }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Address (Optional) -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {{ translate('register.address') }} ({{ translate('register.optional') }})
                  </h3>
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {{ translate('register.country') }}
                      </label>
                      <input
                        type="text"
                        formControlName="country"
                        autocomplete="country-name"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                        [placeholder]="translate('register.countryPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {{ translate('register.city') }}
                      </label>
                      <input
                        type="text"
                        formControlName="city"
                        autocomplete="address-level2"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                        [placeholder]="translate('register.cityPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {{ translate('register.street') }}
                      </label>
                      <input
                        type="text"
                        formControlName="street"
                        autocomplete="street-address"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                        [placeholder]="translate('register.streetPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {{ translate('register.houseNumber') }}
                      </label>
                      <input
                        type="text"
                        formControlName="houseNumber"
                        autocomplete="address-line1"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                        [placeholder]="translate('register.houseNumberPlaceholder')">
                    </div>
                    <div>
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {{ translate('register.zipCode') }}
                      </label>
                      <input
                        type="text"
                        formControlName="zipCode"
                        autocomplete="postal-code"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                        [placeholder]="translate('register.zipCodePlaceholder')">
                    </div>
                  </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-end pt-6">
                  <button
                    type="submit"
                    [disabled]="personalDetailsForm.invalid"
                    class="px-12 py-6 text-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]">
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
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.email') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    [class.border-red-500]="shouldShowError('email', communicationForm)"
                    [class.dark:border-red-500]="shouldShowError('email', communicationForm)"
                    class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    [placeholder]="translate('register.emailPlaceholder')">
                  @if (shouldShowError('email', communicationForm)) {
                    <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                      {{ getErrorMessage('email', communicationForm) }}
                    </p>
                  }
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
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.phone') }} <span class="text-red-500">*</span>
                  </label>
                  @for (phone of phoneNumbers(); track $index) {
                    <div class="flex items-center space-x-2 mb-2">
                      <input
                        type="tel"
                        [(ngModel)]="phoneNumbers()[$index]"
                        autocomplete="tel"
                        class="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 flex-1"
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
                    class="px-12 py-6 text-2xl font-bold text-blue-600 bg-transparent border-2 border-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 min-h-[80px]">
                    {{ translate('register.previousStep') }}
                  </button>
                  <button
                    type="submit"
                    [disabled]="communicationForm.invalid"
                    class="px-12 py-6 text-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]">
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
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.password') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      formControlName="password"
                      autocomplete="new-password"
                      [class.border-red-500]="shouldShowError('password', passwordForm)"
                      [class.dark:border-red-500]="shouldShowError('password', passwordForm)"
                      class="w-full px-4 py-3 md:px-3 md:py-2 pr-12 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      [placeholder]="translate('register.passwordPlaceholder')">
                    <button
                      type="button"
                      (click)="showPassword.set(!showPassword())"
                      (keydown.enter)="showPassword.set(!showPassword()); $event.preventDefault()"
                      (keydown.space)="showPassword.set(!showPassword()); $event.preventDefault()"
                      [attr.aria-label]="showPassword() ? translate('auth.hidePassword') : translate('auth.showPassword')"
                      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none p-1">
                      @if (showPassword()) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      }
                    </button>
                  </div>
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
                      <label class="block text-base md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {{ translate('register.confirmPassword') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      [type]="showConfirmPassword() ? 'text' : 'password'"
                      formControlName="confirmPassword"
                      autocomplete="new-password"
                      [class.border-red-500]="shouldShowError('confirmPassword', passwordForm)"
                      [class.dark:border-red-500]="shouldShowError('confirmPassword', passwordForm)"
                      class="w-full px-4 py-3 md:px-3 md:py-2 pr-12 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      [placeholder]="translate('register.confirmPasswordPlaceholder')">
                    <button
                      type="button"
                      (click)="showConfirmPassword.set(!showConfirmPassword())"
                      (keydown.enter)="showConfirmPassword.set(!showConfirmPassword()); $event.preventDefault()"
                      (keydown.space)="showConfirmPassword.set(!showConfirmPassword()); $event.preventDefault()"
                      [attr.aria-label]="showConfirmPassword() ? translate('auth.hidePassword') : translate('auth.showPassword')"
                      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none p-1">
                      @if (showConfirmPassword()) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      }
                    </button>
                  </div>
                  @if (shouldShowError('confirmPassword', passwordForm)) {
                    <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                      {{ getErrorMessage('confirmPassword', passwordForm) }}
                    </p>
                  }
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between pt-6">
                  <button
                    type="button"
                    (click)="goToPreviousStep()"
                    class="px-12 py-6 text-2xl font-bold text-blue-600 bg-transparent border-2 border-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 min-h-[80px]">
                    {{ translate('register.previousStep') }}
                  </button>
                  <button
                    type="submit"
                    [disabled]="passwordForm.invalid"
                    class="px-12 py-6 text-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]">
                    {{ translate('register.createAccount') }}
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
  private registrationFormService = inject(RegistrationFormService);

  // Delegate to service
  currentStep = this.registrationFormService.currentStep;
  usernameError = this.registrationFormService.usernameError;
  usernameSuggestions = this.registrationFormService.usernameSuggestions;
  emailVerified = this.registrationFormService.emailVerified;
  phoneNumbers = this.registrationFormService.phoneNumbers;
  passwordStrength = this.registrationFormService.passwordStrength;
  isLoading = this.registrationFormService.isLoading;
  
  // Password visibility toggles
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  
  // Helper method to check if field should show error (touched or dirty)
  shouldShowError(controlName: string, formGroup: FormGroup): boolean {
    const control = formGroup.get(controlName);
    return !!(control && (control.touched || control.dirty) && control.invalid);
  }
  
  // Helper method to get error message for a field
  getErrorMessage(controlName: string, formGroup: FormGroup): string {
    const control = formGroup.get(controlName);
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) {
      return this.translate('register.fieldRequired');
    }
    if (control.errors['email']) {
      return this.translate('register.invalidEmail');
    }
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return this.translate('register.minLength').replace('{0}', requiredLength.toString());
    }
    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return this.translate('register.maxLength').replace('{0}', requiredLength.toString());
    }
    if (control.errors['mismatch']) {
      return this.translate('register.passwordsDoNotMatch');
    }
    
    return this.translate('register.invalidField');
  }
  
  translate(key: string): string {
    return this.registrationFormService.translate(key);
  }

  steps = [
    { id: 1, title: 'register.personalDetails' },
    { id: 2, title: 'register.communication' },
    { id: 3, title: 'register.password' }
  ];

  // Forms from service
  personalDetailsForm = this.registrationFormService.personalDetailsForm;
  communicationForm = this.registrationFormService.communicationForm;
  passwordForm = this.registrationFormService.passwordForm;
  // Social Registration Methods - delegate to service
  async registerWithGoogle() {
    await this.registrationFormService.registerWithGoogle();
  }

  async registerWithMeta() {
    await this.registrationFormService.registerWithMeta();
  }

  async registerWithApple() {
    await this.registrationFormService.registerWithApple();
  }

  // Form submission - delegate to service
  onPersonalDetailsSubmit() {
    this.registrationFormService.onPersonalDetailsSubmit();
  }

  selectUsernameSuggestion(suggestion: string) {
    this.registrationFormService.selectUsernameSuggestion(suggestion);
  }

  onCommunicationSubmit() {
    this.registrationFormService.onCommunicationSubmit();
  }

  async onPasswordSubmit() {
    await this.registrationFormService.onPasswordSubmit();
  }

  addPhoneNumber() {
    this.registrationFormService.addPhoneNumber();
  }

  removePhoneNumber(index: number) {
    this.registrationFormService.removePhoneNumber(index);
  }

  goToPreviousStep() {
    this.registrationFormService.goToPreviousStep();
  }
}
