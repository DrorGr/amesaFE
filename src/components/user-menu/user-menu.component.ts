import { Component, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { TranslationService } from '../../services/translation.service';
import { AccessibilityMenuComponent } from '../accessibility-menu/accessibility-menu.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthModalComponent, AccessibilityMenuComponent],
  template: `
    <div class="relative" #userMenuContainer>
      @if (!currentUser()) {
        <!-- Login Button -->
        <button
          (click)="openAuthModal()"
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
          {{ translate('nav.signIn') }}
        </button>
      } @else {
        <!-- Welcome Button with Hamburger -->
        <button
          (click)="toggleDropdown()"
          class="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md">
          <span>{{ translate('nav.welcome') }} {{ getUserFirstName() }}</span>
          <svg 
            class="w-4 h-4 transition-transform duration-200" 
            [class.rotate-90]="isDropdownOpen()"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        
        <!-- Dropdown Menu -->
        @if (isDropdownOpen()) {
          <!-- Backdrop for mobile -->
          <div 
            class="fixed inset-0 z-40 md:hidden" 
            (click)="closeDropdown()">
          </div>
          
          <!-- Dropdown Menu -->
          <div class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-y-auto">
            <div class="py-2">
              <!-- Settings -->
              <button 
                (click)="navigateToSettings()" 
                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {{ translate('userMenu.settings') }}
              </button>
              
              <!-- History -->
              <button 
                (click)="navigateToHistory()" 
                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ translate('userMenu.history') }}
              </button>
              
              <!-- Accessibility -->
              <app-accessibility-menu (close)="closeDropdown()"></app-accessibility-menu>
              
              <!-- Notifications -->
              <button 
                (click)="openNotifications()" 
                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {{ translate('userMenu.notifications') }}
              </button>
              
              <!-- Divider -->
              <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              
              <!-- Logout -->
              <button 
                (click)="handleLogout()" 
                class="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                {{ translate('userMenu.logout') }}
              </button>
            </div>
          </div>
        }
      }
    </div>

    <!-- Auth Modal -->
    @if (showAuthModal) {
      <app-auth-modal 
        [mode]="authMode" 
        (close)="closeAuthModal()"
        (success)="onAuthSuccess()"
        (modeChange)="onModeChange($event)">
      </app-auth-modal>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  @ViewChild('userMenuContainer', { static: false }) userMenuContainer?: ElementRef;
  
  currentUser = this.authService.getCurrentUser();
  isDropdownOpen = signal(false);
  showAuthModal = false;
  authMode: 'login' | 'register' = 'login';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isDropdownOpen()) return;
    
    const target = event.target as HTMLElement;
    const container = this.userMenuContainer?.nativeElement;
    
    if (container && !container.contains(target)) {
      this.closeDropdown();
    }
  }
  
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }

  getUserFirstName(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    // Try to get firstName from UserDto if available
    const userDto = this.authService.getCurrentUserDto()();
    if (userDto?.firstName) {
      return userDto.firstName;
    }
    
    // Fallback to name (might be full name, try to extract first name)
    const name = user.name || '';
    return name.split(' ')[0] || name;
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  openAuthModal(): void {
    this.authMode = 'login';
    this.showAuthModal = true;
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
  }

  onAuthSuccess(): void {
    this.showAuthModal = false;
    this.closeDropdown();
  }

  onModeChange(mode: 'login' | 'register'): void {
    this.authMode = mode;
  }

  navigateToSettings(): void {
    this.router.navigate(['/member-settings']);
    this.closeDropdown();
  }

  navigateToHistory(): void {
    this.router.navigate(['/lottery/entries/history']);
    this.closeDropdown();
  }

  openNotifications(): void {
    // Navigate to member settings with notifications tab
    this.router.navigate(['/member-settings'], { queryParams: { tab: 'notifications' } });
    this.closeDropdown();
  }

  handleLogout(): void {
    this.authService.logout();
    this.closeDropdown();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

