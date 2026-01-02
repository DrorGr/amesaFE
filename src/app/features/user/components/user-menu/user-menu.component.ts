import { Component, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AuthModalService } from '@core/services/auth-modal.service';
import { TranslationService } from '@core/services/translation.service';
import { AccessibilityMenuComponent } from '../../../shared/components/accessibility-menu/accessibility-menu.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, AccessibilityMenuComponent],
  template: `
    <div class="relative" #userMenuContainer>
      @if (!currentUser()) {
        <!-- Login Button -->
        <button
          (click)="openAuthModal()"
          [attr.aria-label]="translate('nav.signIn')"
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md h-10 flex items-center justify-center">
          {{ translate('nav.signIn') }}
        </button>
      } @else {
        <!-- Welcome Button with Hamburger -->
        <button
          (click)="toggleDropdown()"
          [attr.aria-label]="translateWithParams('userMenu.userMenuButton', { name: getUserFirstName() })"
          [attr.aria-expanded]="isDropdownOpen()"
          class="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md h-10">
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
          <div 
            class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-y-auto"
            role="menu"
            [attr.aria-label]="translate('userMenu.userMenu')">
            <div class="py-2">
              <!-- Settings -->
              <button 
                (click)="navigateToSettings()" 
                [attr.aria-label]="translate('userMenu.settings')"
                role="menuitem"
                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {{ translate('userMenu.settings') }}
              </button>
              
              <!-- History -->
              <button 
                (click)="navigateToHistory()" 
                [attr.aria-label]="translate('userMenu.history')"
                role="menuitem"
                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ translate('userMenu.history') }}
              </button>
              
              <!-- Accessibility -->
              <app-accessibility-menu (close)="closeDropdown()"></app-accessibility-menu>
              
              <!-- Divider -->
              <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              
              <!-- Logout -->
              <button 
                (click)="handleLogout()" 
                [attr.aria-label]="translate('userMenu.logout')"
                role="menuitem"
                class="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                {{ translate('userMenu.logout') }}
              </button>
            </div>
          </div>
        }
      }
    </div>

  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private authModalService = inject(AuthModalService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  @ViewChild('userMenuContainer', { static: false }) userMenuContainer?: ElementRef;
  
  currentUser = this.authService.getCurrentUser();
  isDropdownOpen = signal(false);

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

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isDropdownOpen()) return;

    const menuItems = Array.from(
      this.userMenuContainer?.nativeElement.querySelectorAll('[role="menuitem"]') || []
    ) as HTMLElement[];

    if (menuItems.length === 0) return;

    const currentIndex = menuItems.findIndex(item => item === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        menuItems[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
        break;
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
    this.authModalService.open('login');
  }

  navigateToSettings(): void {
    this.router.navigate(['/member-settings']);
    this.closeDropdown();
  }

  navigateToHistory(): void {
    this.router.navigate(['/lottery/entries/history']);
    this.closeDropdown();
  }

  handleLogout(): void {
    this.authService.logout();
    this.closeDropdown();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  translateWithParams(key: string, params: Record<string, any>): string {
    return this.translationService.translateWithParams(key, params);
  }
}

