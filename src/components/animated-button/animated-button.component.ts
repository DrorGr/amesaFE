import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from '../../services/animation.service';

/**
 * Animated Button Component
 * A reusable button with ripple effect and loading state
 * 
 * Usage:
 * <app-animated-button 
 *   [label]="'Click Me'" 
 *   [variant]="'primary'" 
 *   [loading]="isLoading"
 *   (clicked)="handleClick()">
 * </app-animated-button>
 */
@Component({
  selector: 'app-animated-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      #btn
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
      (mouseenter)="onHover()"
    >
      @if (loading) {
        <span class="inline-flex items-center">
          <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loadingText || 'Loading...' }}
        </span>
      } @else {
        @if (icon && iconPosition === 'left') {
          <span class="mr-2" [innerHTML]="icon"></span>
        }
        <span>{{ label }}</span>
        @if (icon && iconPosition === 'right') {
          <span class="ml-2" [innerHTML]="icon"></span>
        }
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    button {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    button:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    button:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class AnimatedButtonComponent {
  @Input() label: string = 'Button';
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText: string = '';
  @Input() fullWidth: boolean = false;
  @Input() rounded: boolean = true;
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() rippleEffect: boolean = true;
  @Input() hoverAnimation: 'lift' | 'scale' | 'bounce' | 'none' = 'lift';

  @Output() clicked = new EventEmitter<MouseEvent>();

  private animationService = inject(AnimationService);

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-4';
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl'
    };

    // Variant classes
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-600',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-600',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-600',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-300 dark:bg-yellow-600 dark:hover:bg-yellow-500',
      info: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-300 dark:bg-cyan-700 dark:hover:bg-cyan-600',
      dark: 'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700',
      light: 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 focus:ring-gray-200 dark:bg-gray-100 dark:hover:bg-gray-200'
    };

    // Border radius
    const roundedClass = this.rounded ? 'rounded-lg' : 'rounded-none';

    // Full width
    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.variant]} ${roundedClass} ${widthClass}`;
  }

  handleClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      return;
    }

    const button = event.currentTarget as HTMLElement;

    // Apply ripple effect
    if (this.rippleEffect) {
      this.animationService.ripple(event, button);
    }

    this.clicked.emit(event);
  }

  onHover() {
    if (this.disabled || this.loading || this.hoverAnimation === 'none') {
      return;
    }

    // Additional hover animations can be triggered here
    // Currently using CSS transitions, but can add programmatic animations
  }
}

