import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast, ToastPosition } from '../../services/toast.service';

/**
 * Toast Container Component
 * Displays all active toasts
 * 
 * Usage: Add to app.component.html:
 * <app-toast-container></app-toast-container>
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Toast containers for each position -->
    @for (position of positions; track position) {
      <div 
        [class]="getContainerClasses(position)"
        class="fixed z-[9999] pointer-events-none">
        
        @for (toast of getToastsByPosition(position); track toast.id) {
          <div
            [class]="getToastClasses(toast)"
            class="pointer-events-auto mb-3 w-full sm:w-96 max-w-full"
            role="alert"
            [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'">
            
            <div class="flex items-start gap-3 p-4">
              <!-- Icon -->
              @if (toast.showIcon) {
                <div 
                  class="flex-shrink-0 w-5 h-5"
                  [innerHTML]="toastService.getIconHtml(toast)">
                </div>
              }
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-tight break-words">
                  {{ toast.message }}
                </p>
                
                <!-- Action Button -->
                @if (toast.actionText) {
                  <button
                    type="button"
                    class="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                    (click)="handleAction(toast)">
                    {{ toast.actionText }}
                  </button>
                }
              </div>
              
              <!-- Close Button -->
              @if (toast.closeable) {
                <button
                  type="button"
                  class="flex-shrink-0 ml-auto inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors duration-200"
                  (click)="dismiss(toast.id)"
                  [attr.aria-label]="'Close notification'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              }
            </div>
            
            <!-- Progress bar for auto-dismiss -->
            @if (toast.duration > 0 && toast.state === 'visible') {
              <div class="h-1 bg-black/20 dark:bg-white/20 overflow-hidden">
                <div 
                  class="h-full bg-current animate-progress"
                  [style.animation-duration.ms]="toast.duration"></div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    /* Animation for toast entrance */
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideInLeft {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideInDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes slideOutLeft {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(-100%);
        opacity: 0;
      }
    }

    @keyframes slideOutUp {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-100%);
        opacity: 0;
      }
    }

    @keyframes slideOutDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .animate-progress {
      animation: progress linear forwards;
    }

    /* Apply entrance animations based on position */
    .toast-entering.position-right {
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-entering.position-left {
      animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-entering.position-top {
      animation: slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-entering.position-bottom {
      animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Apply exit animations */
    .toast-exiting.position-right {
      animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-exiting.position-left {
      animation: slideOutLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-exiting.position-top {
      animation: slideOutUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-exiting.position-bottom {
      animation: slideOutDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  protected toastService = inject(ToastService);
  
  toasts: Toast[] = [];
  positions: ToastPosition[] = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  private subscription?: Subscription;

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getToastsByPosition(position: ToastPosition): Toast[] {
    return this.toasts.filter(toast => toast.position === position);
  }

  getContainerClasses(position: ToastPosition): string {
    return this.toastService.getPositionClasses(position);
  }

  getToastClasses(toast: Toast): string {
    const typeClasses = this.toastService.getTypeClasses(toast.type);
    const animationClass = this.getAnimationClass(toast);
    const positionClass = this.getPositionClass(toast.position);
    
    return `${typeClasses} ${animationClass} ${positionClass} ${toast.customClass} 
            rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300`;
  }

  private getAnimationClass(toast: Toast): string {
    if (toast.state === 'entering') {
      return 'toast-entering';
    } else if (toast.state === 'exiting') {
      return 'toast-exiting';
    }
    return '';
  }

  private getPositionClass(position: ToastPosition): string {
    if (position.includes('left')) {
      return 'position-left';
    } else if (position.includes('right')) {
      return 'position-right';
    } else if (position.includes('top')) {
      return 'position-top';
    } else {
      return 'position-bottom';
    }
  }

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  handleAction(toast: Toast) {
    if (toast.onAction) {
      toast.onAction();
    }
    this.dismiss(toast.id);
  }
}

