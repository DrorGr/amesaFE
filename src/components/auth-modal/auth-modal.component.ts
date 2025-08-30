import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-content">
        <div class="p-8">
          <!-- Header -->
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-black text-gray-900">
              {{ mode() === 'login' ? translate('auth.signIn') : translate('auth.createAccount') }}
            </h2>
            <button 
              (click)="close.emit()"
              class="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 transform p-1">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            @if (mode() === 'register') {
              <div>
                <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">{{ translate('auth.fullName') }}</label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="name"
                  name="name"
                  required
                  class="input-field">
              </div>
            }
            
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">{{ translate('auth.email') }}</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                required
                class="input-field">
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">{{ translate('auth.password') }}</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                class="input-field">
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn-primary text-lg py-4 disabled:bg-blue-400 disabled:transform-none disabled:shadow-none">
              @if (isLoading) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ translate('auth.processing') }}
                </span>
              } @else {
                {{ mode() === 'login' ? translate('auth.signIn') : translate('auth.createAccount') }}
              }
            </button>
          </form>

          <!-- Toggle Mode -->
          <div class="mt-8 text-center">
            <p class="text-sm text-gray-600">
              {{ mode() === 'login' ? translate('auth.dontHaveAccount') : translate('auth.alreadyHaveAccount') }}
              <button
                type="button"
                (click)="toggleMode()"
                class="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors duration-200">
                {{ mode() === 'login' ? translate('auth.signUp') : translate('auth.signIn') }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AuthModalComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  
  mode = input.required<'login' | 'register'>();
  close = output<void>();
  success = output<void>();

  name = '';
  email = '';
  password = '';
  isLoading = false;

  async onSubmit() {
    this.isLoading = true;
    
    try {
      let result: boolean;
      
      if (this.mode() === 'login') {
        result = await this.authService.login(this.email, this.password);
      } else {
        result = await this.authService.register(this.name, this.email, this.password);
      }
      
      if (result) {
        this.success.emit();
        this.resetForm();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleMode() {
    this.resetForm();
    if (this.mode() === 'login') {
      // Switch to register - this would need to be handled by parent
    } else {
      // Switch to login - this would need to be handled by parent
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  private resetForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.isLoading = false;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}