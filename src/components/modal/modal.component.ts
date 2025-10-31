import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from '../../services/animation.service';

/**
 * Reusable Modal Component
 * Can be used standalone or with ModalService
 * 
 * Usage:
 * <app-modal
 *   [isOpen]="showModal"
 *   [title]="'Confirm Action'"
 *   [size]="'md'"
 *   [closeOnBackdrop]="true"
 *   (close)="onModalClose()">
 *   <div modal-body>
 *     Your content here
 *   </div>
 *   <div modal-footer>
 *     <button (click)="closeModal()">Cancel</button>
 *     <button (click)="confirm()">Confirm</button>
 *   </div>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 z-50 backdrop-blur-sm bg-black/50 dark:bg-black/70 transition-opacity duration-300 animate-fadeIn"
        [class.opacity-100]="isOpen"
        (click)="onBackdropClick($event)"
        [@fadeIn]>
        
        <!-- Modal Container -->
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            
            <!-- Modal Content -->
            <div
              #modalContent
              [class]="modalClasses"
              class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all duration-300 animate-scaleIn"
              (click)="$event.stopPropagation()"
              role="dialog"
              aria-modal="true"
              [attr.aria-labelledby]="title ? 'modal-title' : null">
              
              <!-- Header -->
              @if (title || showCloseButton) {
                <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  @if (title) {
                    <h3 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ title }}
                    </h3>
                  }
                  
                  @if (showCloseButton) {
                    <button
                      type="button"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                      (click)="close()"
                      aria-label="Close modal">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  }
                </div>
              }
              
              <!-- Body -->
              <div class="p-6">
                <ng-content select="[modal-body]"></ng-content>
                @if (!hasBodyContent && description) {
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ description }}
                  </p>
                }
              </div>
              
              <!-- Footer -->
              @if (hasFooterContent || showDefaultButtons) {
                <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <ng-content select="[modal-footer]"></ng-content>
                  
                  @if (showDefaultButtons && !hasFooterContent) {
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors duration-200"
                      (click)="close()">
                      {{ cancelButtonText }}
                    </button>
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors duration-200"
                      (click)="confirm()">
                      {{ confirmButtonText }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }

    .animate-scaleIn {
      animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Smooth scrollbar for modal content */
    .overflow-y-auto::-webkit-scrollbar {
      width: 8px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.5);
      border-radius: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.7);
    }
  `]
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() closeOnBackdrop: boolean = true;
  @Input() closeOnEscape: boolean = true;
  @Input() showCloseButton: boolean = true;
  @Input() showDefaultButtons: boolean = false;
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() customClass: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  private animationService = inject(AnimationService);

  hasBodyContent = false;
  hasFooterContent = false;

  ngAfterContentInit() {
    // Check if custom content is provided
    // This would need proper content projection checking in production
  }

  get modalClasses(): string {
    const sizeClasses = {
      sm: 'sm:max-w-sm sm:w-full',
      md: 'sm:max-w-md sm:w-full',
      lg: 'sm:max-w-lg sm:w-full',
      xl: 'sm:max-w-xl sm:w-full',
      full: 'sm:max-w-[95vw] sm:w-full'
    };

    return `${sizeClasses[this.size]} ${this.customClass}`;
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.closeOnEscape && this.isOpen) {
      this.closeModal();
    }
  }

  closeModal() {
    this.close.emit();
  }

  confirm() {
    this.confirmed.emit();
    this.closeModal();
  }
}

