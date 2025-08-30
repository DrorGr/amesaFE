import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  template: `
    <nav class="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-18">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-3xl font-bold text-gradient">HomeLotto</h1>
            </div>
          </div>

          <!-- Navigation -->
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-10">
              <a href="#" class="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                Lotteries
              </a>
              <a href="#" class="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                How It Works
              </a>
              <a href="#" class="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                Winners
              </a>
            </div>
          </div>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            @if (currentUser(); as user) {
              <!-- Authenticated User -->
              <div class="flex items-center space-x-4">
                <span class="text-gray-700 text-sm font-medium">Welcome, {{ user.name }}</span>
                <button
                  (click)="logout()"
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
                  Logout
                </button>
              </div>
            } @else {
              <!-- Guest User -->
              <div class="flex items-center space-x-3">
                <button
                  (click)="openAuthModal('login')"
                  class="text-blue-600 hover:text-blue-700 px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 transform">
                  Sign In
                </button>
                <button
                  (click)="openAuthModal('register')"
                  class="btn-primary text-sm">
                  Get Started
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>

    <!-- Auth Modal -->
    @if (showAuthModal) {
      <app-auth-modal 
        [mode]="authMode" 
        (close)="closeAuthModal()"
        (success)="onAuthSuccess()">
      </app-auth-modal>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TopbarComponent {
  private authService = inject(AuthService);
  
  showAuthModal = false;
  authMode: 'login' | 'register' = 'login';
  
  currentUser = this.authService.getCurrentUser();

  openAuthModal(mode: 'login' | 'register') {
    this.authMode = mode;
    this.showAuthModal = true;
  }

  closeAuthModal() {
    this.showAuthModal = false;
  }

  onAuthSuccess() {
    this.showAuthModal = false;
  }

  logout() {
    this.authService.logout();
  }
}