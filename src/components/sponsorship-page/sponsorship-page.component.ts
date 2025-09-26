import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sponsorship-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-96 md:h-[500px]">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Community support" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-4xl md:text-6xl font-black mb-6 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('sponsor.heroTitle') }}
              </h1>
              <p class="text-xl md:text-2xl mb-8 leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('sponsor.heroSubtitle') }}
              </p>
              <button class="btn-primary text-2xl px-8 py-4 bg-white text-blue-600 hover:bg-gray-100">
                {{ translate('sponsor.becomeSponsor') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Why We Exist Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('sponsor.whyWeExist') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('sponsor.whyWeExistSubtitle') }}
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Homeless Shelters -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('sponsor.homelessShelters') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('sponsor.homelessSheltersDesc') }}
              </p>
            </div>

            <!-- Orphan Shelters -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('sponsor.orphanShelters') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('sponsor.orphanSheltersDesc') }}
              </p>
            </div>

            <!-- Animal Shelters -->
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('sponsor.animalShelters') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ translate('sponsor.animalSheltersDesc') }}
              </p>
            </div>
          </div>

          <!-- Mission Statement -->
          <div class="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-2xl p-8 md:p-12">
            <div class="text-center">
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {{ translate('sponsor.ourMission') }}
              </h3>
              <p class="text-2xl md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
                {{ translate('sponsor.missionStatement') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Property Ownership Circle Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('sponsor.propertyCircle') }}
            </h2>
            <div class="w-24 h-1 bg-emerald-600 mx-auto rounded-full mb-6"></div>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <p class="text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('sponsor.propertyCircleDesc1') }}
              </p>
              <p class="text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ translate('sponsor.propertyCircleDesc2') }}
              </p>
              <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6">
                <p class="text-emerald-800 dark:text-emerald-200 font-medium">
                  {{ translate('sponsor.propertyCircleHighlight') }}
                </p>
              </div>
            </div>
            <div class="relative">
              <img 
                src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg" 
                alt="Property ownership" 
                class="rounded-xl shadow-2xl">
              <div class="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <!-- Why Become a Sponsor Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('sponsor.whyBecomeSponsor') }}
            </h2>
            <div class="w-24 h-1 bg-orange-600 mx-auto rounded-full"></div>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Real Impact -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('sponsor.realImpact') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {{ translate('sponsor.realImpactDesc') }}
              </p>
            </div>

            <!-- Transparency -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('sponsor.transparency') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {{ translate('sponsor.transparencyDesc') }}
              </p>
            </div>

            <!-- Shared Purpose -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('sponsor.sharedPurpose') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {{ translate('sponsor.sharedPurposeDesc') }}
              </p>
            </div>

            <!-- Lasting Legacy -->
            <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {{ translate('sponsor.lastingLegacy') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {{ translate('sponsor.lastingLegacyDesc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- How Your Sponsorship Helps Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('sponsor.howSponsorshipHelps') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- For the Homeless -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {{ translate('sponsor.forHomeless') }}
                </h3>
              </div>
              <ul class="space-y-3 text-blue-700 dark:text-blue-300">
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.homelessBenefit1') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.homelessBenefit2') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.homelessBenefit3') }}
                </li>
              </ul>
            </div>

            <!-- For Orphans -->
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                  {{ translate('sponsor.forOrphans') }}
                </h3>
              </div>
              <ul class="space-y-3 text-emerald-700 dark:text-emerald-300">
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.orphansBenefit1') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.orphansBenefit2') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.orphansBenefit3') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.orphansBenefit4') }}
                </li>
              </ul>
            </div>

            <!-- For Animals -->
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-8">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-orange-800 dark:text-orange-200">
                  {{ translate('sponsor.forAnimals') }}
                </h3>
              </div>
              <ul class="space-y-3 text-orange-700 dark:text-orange-300">
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.animalsBenefit1') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.animalsBenefit2') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.animalsBenefit3') }}
                </li>
                <li class="flex items-center">
                  <svg class="w-5 h-5 mr-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ translate('sponsor.animalsBenefit4') }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Impact Statement -->
          <div class="mt-12 text-center">
            <p class="text-2xl md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
              {{ translate('sponsor.impactStatement') }}
            </p>
          </div>
        </section>

        <!-- Call to Action Section -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-blue-600 via-emerald-600 to-orange-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('sponsor.joinUsToday') }}
            </h2>
            <p class="text-xl mb-8 max-w-3xl mx-auto">
              {{ translate('sponsor.joinUsDescription') }}
            </p>
            <p class="text-2xl mb-8 max-w-4xl mx-auto">
              {{ translate('sponsor.togetherWeCan') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button class="btn-primary bg-white text-blue-600 hover:bg-gray-100 text-2xl px-8 py-4">
                {{ translate('sponsor.becomeSponsorNow') }}
              </button>
              <button class="btn-outline border-white text-white hover:bg-white hover:text-blue-600 text-2xl px-8 py-4">
                {{ translate('sponsor.learnMore') }}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class SponsorshipPageComponent {
  private translationService = inject(TranslationService);

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
