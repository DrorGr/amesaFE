import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';

interface UserProfile {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  idNumber: string;
  email: string;
  phoneNumbers: string[];
  isVerified: boolean;
  accountType: 'basic' | 'gold' | 'premium';
  joinDate: string;
  lastLogin: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  personalLink: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface StarReward {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'lottery_participation' | 'referral' | 'promotion' | 'achievement';
  isExpired: boolean;
}

@Component({
  selector: 'app-member-settings-page',
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
              alt="Member Settings" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-4xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ userProfile().firstName }} {{ translate('member.accountSettings') }}
              </h1>
              <p class="text-2xl md:text-2xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('member.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- User Profile Header (AM-79: Enhanced Layout) -->
        <div class="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <!-- Left: Avatar + User Info -->
            <div class="flex items-center space-x-6">
              <div class="relative">
                <div class="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-700">
                  <span class="text-3xl font-bold text-white">
                    {{ userProfile().firstName.charAt(0) }}{{ userProfile().lastName.charAt(0) }}
                  </span>
                </div>
                @if (userProfile().isVerified) {
                  <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-700">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                }
              </div>
              <div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  {{ userProfile().firstName }} {{ userProfile().lastName }}
                </h2>
                <div class="mb-3">
                  <span 
                    class="account-type-badge"
                    [class.account-type-gold]="userProfile().accountType === 'gold'"
                    [class.account-type-silver]="userProfile().accountType === 'premium'"
                    [class.account-type-basic]="userProfile().accountType === 'basic'">
                    {{ translate('member.' + userProfile().accountType) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {{ translate('member.memberSince') }}: {{ formatMemberSince(userProfile().joinDate) }}
                </p>
              </div>
            </div>
            <!-- Right: Last Login Info -->
            <div class="flex items-center gap-3 bg-white dark:bg-gray-900/50 rounded-xl px-6 py-4 shadow-sm">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ translate('member.lastLogin') }}
                </div>
                <div class="text-gray-900 dark:text-white font-semibold">
                  {{ userProfile().lastLogin }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-8">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-8 px-8" aria-label="Tabs">
              @for (tab of tabs; track tab.id) {
                <button
                  (click)="setActiveTab(tab.id)"
                  [class]="activeTab() === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                  <div class="flex items-center space-x-2">
                    <span class="text-2xl">{{ tab.icon }}</span>
                    <span>{{ translate(tab.title) }}</span>
                  </div>
                </button>
              }
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-8">
            <!-- General Info Tab -->
            @if (activeTab() === 'general') {
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {{ translate('member.generalInfo') }}
                </h3>

                <form [formGroup]="profileForm" (ngSubmit)="onProfileSubmit()" class="space-y-6">
                  <div class="grid md:grid-cols-2 gap-6">
                    <!-- First Name -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('member.firstName') }}
                      </label>
                      <input
                        type="text"
                        formControlName="firstName"
                        class="input-field"
                        [readonly]="!isEditingProfile()">
                    </div>

                    <!-- Last Name -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('member.lastName') }}
                      </label>
                      <input
                        type="text"
                        formControlName="lastName"
                        class="input-field"
                        [readonly]="!isEditingProfile()">
                    </div>

                    <!-- Gender -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('member.gender') }}
                      </label>
                      <select 
                        formControlName="gender" 
                        class="input-field"
                        [disabled]="!isEditingProfile()">
                        <option value="male">{{ translate('member.male') }}</option>
                        <option value="female">{{ translate('member.female') }}</option>
                        <option value="other">{{ translate('member.other') }}</option>
                      </select>
                    </div>

                    <!-- Date of Birth -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('member.dateOfBirth') }}
                      </label>
                      <input
                        type="date"
                        formControlName="dateOfBirth"
                        class="input-field"
                        [readonly]="!isEditingProfile()">
                    </div>

                    <!-- ID Number with Edit Button -->
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ translate('member.idNumber') }}
                      </label>
                      <input
                        type="text"
                        formControlName="idNumber"
                        class="input-field mb-3"
                        [readonly]="!isEditingProfile()">
                      
                      <!-- Edit Button Below ID Number (AM-80) -->
                      @if (!isEditingProfile()) {
                        <button
                          type="button"
                          (click)="startEdit()"
                          class="btn-primary">
                          {{ translate('member.editProfile') }}
                        </button>
                      }
                    </div>
                    
                    <!-- Email and Phone as Info List (AM-82) -->
                    <div class="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-4">
                        <!-- Email Info -->
                        <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                          <div class="flex items-center space-x-3">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ translate('member.email') }}</span>
                          </div>
                          <span class="text-sm text-gray-900 dark:text-white font-medium">{{ userProfile().email }}</span>
                        </div>
                        
                        <!-- Phone Numbers Info -->
                        <div class="py-3">
                          <div class="flex items-center space-x-3 mb-3">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ translate('member.phoneNumbers') }}</span>
                          </div>
                          <div class="space-y-2 ml-8">
                            @for (phone of userProfile().phoneNumbers; track $index) {
                              <div class="text-sm text-gray-900 dark:text-white font-medium">{{ phone }}</div>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex justify-between items-center pt-6">
                    <button
                      type="button"
                      (click)="changePassword()"
                      class="btn-outline">
                      {{ translate('member.changePassword') }}
                    </button>
                    @if (isEditingProfile()) {
                      <div class="flex space-x-3">
                        <button
                          type="button"
                          (click)="cancelEdit()"
                          class="btn-outline">
                          {{ translate('member.cancel') }}
                        </button>
                        <button
                          type="submit"
                          class="btn-primary">
                          {{ translate('member.saveChanges') }}
                        </button>
                      </div>
                    }
                  </div>
                </form>

                <!-- Verify Account Section -->
                @if (!userProfile().isVerified && (userProfile().accountType === 'gold' || userProfile().accountType === 'premium')) {
                  <div class="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div class="flex items-center">
                      <svg class="verify-icon text-yellow-600 dark:text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      <div>
                        <h4 class="text-2xl font-semibold text-yellow-800 dark:text-yellow-200">
                          {{ translate('member.verifyAccount') }}
                        </h4>
                        <p class="text-yellow-700 dark:text-yellow-300">
                          {{ translate('member.verifyAccountDesc') }}
                        </p>
                        <button
                          (click)="verifyAccount()"
                          class="mt-3 btn-primary">
                          {{ translate('member.startVerification') }}
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Promotions Tab -->
            @if (activeTab() === 'promotions') {
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {{ translate('member.promotions') }}
                </h3>

                <!-- Available Promotions -->
                <div class="space-y-6">
                  @for (promotion of userPromotions(); track promotion.id) {
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div class="flex items-center justify-between mb-4">
                        <div>
                          <h4 class="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                            {{ promotion.name }}
                          </h4>
                          <p class="text-blue-700 dark:text-blue-300">
                            {{ promotion.description }}
                          </p>
                        </div>
                        <div class="flex items-center space-x-2">
                          <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                            {{ translate('member.active') }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Personal Link -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {{ translate('member.personalLink') }}
                        </label>
                        <div class="flex items-center space-x-2">
                          <input
                            type="text"
                            [value]="promotion.personalLink"
                            class="input-field flex-1 bg-gray-50 dark:bg-gray-700"
                            readonly>
                          <button
                            (click)="copyToClipboard(promotion.personalLink)"
                            class="btn-primary">
                            {{ translate('member.copy') }}
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Visit Promotions Link -->
                <div class="mt-8 text-center">
                  <a href="#" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors">
                    {{ translate('member.visitPromotionsArea') }}
                  </a>
                </div>
              </div>
            }

            <!-- Settings Tab -->
            @if (activeTab() === 'settings') {
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {{ translate('member.settings') }}
                </h3>

                <div class="space-y-8">
                  <!-- Basic Settings -->
                  <div>
                    <h4 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      {{ translate('member.basicSettings') }}
                    </h4>
                    <div class="space-y-4">
                      <!-- Push Messages -->
                      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ translate('member.pushMessages') }}
                          </h5>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('member.pushMessagesDesc') }}
                          </p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            [(ngModel)]="settings.pushMessages"
                            class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <!-- Dark Mode -->
                      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ translate('member.darkMode') }}
                          </h5>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('member.darkModeDesc') }}
                          </p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            [(ngModel)]="settings.darkMode"
                            (change)="toggleDarkMode()"
                            class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <!-- Language -->
                      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ translate('member.language') }}
                          </h5>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('member.languageDesc') }}
                          </p>
                        </div>
                        <select
                          [(ngModel)]="settings.language"
                          (change)="changeLanguage()"
                          class="input-field w-32">
                          <option value="en">English</option>
                          <option value="pl">Polski</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Premium Settings -->
                  <div>
                    <h4 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      {{ translate('member.premiumSettings') }}
                    </h4>
                    <div class="space-y-4">
                      <!-- AI Description -->
                      <div class="flex items-center justify-between p-4 rounded-lg"
                           [class]="userProfile().accountType === 'basic' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'">
                        <div>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ translate('member.aiDescription') }}
                          </h5>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('member.aiDescriptionDesc') }}
                          </p>
                        </div>
                        <label class="relative inline-flex items-center"
                               [class]="userProfile().accountType === 'basic' ? 'cursor-not-allowed' : 'cursor-pointer'">
                          <input
                            type="checkbox"
                            [(ngModel)]="settings.aiDescription"
                            [disabled]="userProfile().accountType === 'basic'"
                            class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <!-- Be the First -->
                      <div class="flex items-center justify-between p-4 rounded-lg"
                           [class]="userProfile().accountType === 'basic' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'">
                        <div>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ translate('member.beTheFirst') }}
                          </h5>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ translate('member.beTheFirstDesc') }}
                          </p>
                        </div>
                        <label class="relative inline-flex items-center"
                               [class]="userProfile().accountType === 'basic' ? 'cursor-not-allowed' : 'cursor-pointer'">
                          <input
                            type="checkbox"
                            [(ngModel)]="settings.beTheFirst"
                            [disabled]="userProfile().accountType === 'basic'"
                            class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Stars Tab -->
            @if (activeTab() === 'stars') {
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {{ translate('member.stars') }}
                </h3>

                <!-- Stars Summary -->
                <div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-8 border border-yellow-200 dark:border-yellow-800">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                        {{ translate('member.totalStars') }}
                      </h4>
                      <p class="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
                        {{ totalStars() }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-yellow-700 dark:text-yellow-300">
                        {{ translate('member.activeStars') }}
                      </p>
                      <p class="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
                        {{ activeStars() }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Stars History -->
                <div class="space-y-4">
                  <h4 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ translate('member.starsHistory') }}
                  </h4>
                  
                  @for (star of userStars(); track star.id) {
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                         [class]="star.isExpired ? 'opacity-60' : ''">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                            <span class="text-yellow-600 dark:text-yellow-400 font-bold">⭐</span>
                          </div>
                          <div>
                            <h5 class="font-medium text-gray-900 dark:text-white">
                              {{ star.description }}
                            </h5>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              {{ star.date }}
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                            +{{ star.points }}
                          </p>
                          @if (star.isExpired) {
                            <p class="text-xs text-red-600 dark:text-red-400">
                              {{ translate('member.expired') }}
                            </p>
                          } @else {
                            <p class="text-xs text-green-600 dark:text-green-400">
                              {{ translate('member.active') }}
                            </p>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
    
    /* AM-77: Bigger font for info tabs */
    nav button span {
      font-size: 1.125rem !important;
      font-weight: 600 !important;
    }
    
    /* AM-75: Account Type - colored rectangles */
    .account-type-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 1.125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .account-type-gold {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      color: #78350F;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }
    
    .account-type-silver {
      background: linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%);
      color: #1F2937;
      box-shadow: 0 4px 15px rgba(156, 163, 175, 0.4);
    }
    
    .account-type-basic {
      background: linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%);
      color: #1E40AF;
      box-shadow: 0 4px 15px rgba(147, 197, 253, 0.4);
    }
    
    /* AM-83: Verify account - bigger triangle icon */
    .verify-icon {
      width: 2rem !important;
      height: 2rem !important;
    }
  `]
})
export class MemberSettingsPageComponent {
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  activeTab = signal('general');
  isEditingProfile = signal(false);
  copySuccess = signal(false);

  tabs = [
    { id: 'general', title: 'member.generalInfo', icon: '👤' },
    { id: 'promotions', title: 'member.promotions', icon: '🎁' },
    { id: 'settings', title: 'member.settings', icon: '⚙️' },
    { id: 'stars', title: 'member.stars', icon: '⭐' }
  ];

  userProfile = signal<UserProfile>({
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    dateOfBirth: '1990-01-15',
    idNumber: '123456789',
    email: 'john.doe@example.com',
    phoneNumbers: ['+1-555-0123', '+1-555-0456'],
    isVerified: false,
    accountType: 'gold',
    joinDate: '2024-01-15',
    lastLogin: '2024-12-19 14:30'
  });

  userPromotions = signal<Promotion[]>([
    {
      id: '1',
      name: 'Take a Part',
      description: 'Invite friends and earn rewards',
      personalLink: 'https://amesa.com/ref/johndoe123',
      isActive: true,
      startDate: '2024-01-15'
    }
  ]);

  userStars = signal<StarReward[]>([
    {
      id: '1',
      date: '2024-12-15',
      description: 'Lottery participation bonus',
      points: 50,
      type: 'lottery_participation',
      isExpired: false
    },
    {
      id: '2',
      date: '2024-12-10',
      description: 'Referral reward',
      points: 100,
      type: 'referral',
      isExpired: false
    },
    {
      id: '3',
      date: '2024-11-20',
      description: 'Promotion completion',
      points: 25,
      type: 'promotion',
      isExpired: false
    },
    {
      id: '4',
      date: '2024-10-15',
      description: 'Achievement unlocked',
      points: 75,
      type: 'achievement',
      isExpired: true
    }
  ]);

  settings = {
    pushMessages: true,
    darkMode: false,
    language: 'en',
    aiDescription: false,
    beTheFirst: true
  };

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: [this.userProfile().firstName, Validators.required],
      lastName: [this.userProfile().lastName, Validators.required],
      gender: [this.userProfile().gender, Validators.required],
      dateOfBirth: [this.userProfile().dateOfBirth, Validators.required],
      idNumber: [this.userProfile().idNumber]
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  startEdit() {
    this.isEditingProfile.set(true);
  }

  cancelEdit() {
    this.isEditingProfile.set(false);
    this.profileForm.patchValue({
      firstName: this.userProfile().firstName,
      lastName: this.userProfile().lastName,
      gender: this.userProfile().gender,
      dateOfBirth: this.userProfile().dateOfBirth,
      idNumber: this.userProfile().idNumber
    });
  }

  onProfileSubmit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      this.userProfile.set({
        ...this.userProfile(),
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        gender: formValue.gender,
        dateOfBirth: formValue.dateOfBirth,
        idNumber: formValue.idNumber
      });
      this.isEditingProfile.set(false);
    }
  }

  changePassword() {
    // Navigate to change password page or open modal
    console.log('Change password clicked');
  }

  verifyAccount() {
    // Navigate to identity verification
    this.router.navigate(['/register']);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  toggleDarkMode() {
    this.themeService.toggleTheme();
  }

  changeLanguage() {
    this.translationService.setLanguage(this.settings.language as 'en' | 'pl');
  }

  totalStars(): number {
    return this.userStars().reduce((total, star) => total + star.points, 0);
  }

  activeStars(): number {
    return this.userStars()
      .filter(star => !star.isExpired)
      .reduce((total, star) => total + star.points, 0);
  }

  // AM-76: Format Member Since date from "2024-01-15" to "January 2025"
  formatMemberSince(dateString: string): string {
    const date = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }
}
