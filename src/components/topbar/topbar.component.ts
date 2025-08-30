import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  template: `
    <nav class="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-2xl font-bold text-blue-600">HomeLotto</h1>
            </div>
          </div>

          <!-- Navigation -->
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-8">
              <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Lotteries
              </a>
              <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                How It Works
              </a>
              <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Winners
              </a>
            </div>
          </div>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            @if (currentUser(); as user) {
              <!-- Authenticated User -->
              <div class="flex items-center space-x-4">
                <span class="text-gray-700 text-sm">Welcome, {{ user.name }}</span>
                <button
                  (click)="logout()"
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Logout
                </button>
              </div>
            } @else {
              <!-- Guest User -->
              <div class="flex items-center space-x-3">
                <button
                  (click)="openAuthModal('login')"
                  class="text-blue-600 hover:text-blue-700 px-4 py-2 text-sm font-medium transition-colors">
                  Sign In
                </button>
                <button
                  (click)="openAuthModal('register')"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
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