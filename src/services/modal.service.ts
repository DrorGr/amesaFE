import { Injectable, ComponentRef, ViewContainerRef, Type, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Modal Configuration Interface
 */
export interface ModalConfig {
  /** Close modal on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close modal on escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom CSS classes */
  customClass?: string;
  /** Animation type */
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down';
  /** Data to pass to modal component */
  data?: any;
  /** Enable focus trap */
  focusTrap?: boolean;
  /** Z-index for stacking */
  zIndex?: number;
}

/**
 * Modal Reference
 */
export class ModalRef<T = any> {
  private closeSubject = new Subject<T | undefined>();
  public onClose: Observable<T | undefined> = this.closeSubject.asObservable();

  constructor(
    private componentRef: ComponentRef<any>,
    private backdropElement: HTMLElement,
    private config: ModalConfig
  ) {}

  /**
   * Close the modal with optional result
   */
  close(result?: T): void {
    this.closeSubject.next(result);
    this.closeSubject.complete();
    this.destroy();
  }

  /**
   * Dismiss the modal (close without result)
   */
  dismiss(): void {
    this.close();
  }

  /**
   * Get modal component instance
   */
  getComponentInstance(): any {
    return this.componentRef.instance;
  }

  private destroy(): void {
    // Animate out
    const modalElement = this.componentRef.location.nativeElement;
    const backdropElement = this.backdropElement;

    // Add exit animation
    modalElement.classList.add('modal-exit');
    backdropElement.classList.add('backdrop-exit');

    // Wait for animation to complete
    setTimeout(() => {
      this.componentRef.destroy();
      if (backdropElement && backdropElement.parentNode) {
        backdropElement.parentNode.removeChild(backdropElement);
      }
    }, 300);
  }
}

/**
 * Modal Service
 * Manages modal lifecycle, stacking, and focus management
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modals: ModalRef[] = [];
  private baseZIndex = 1000;

  /**
   * Open a modal
   */
  open<T>(
    component: Type<any>,
    config: ModalConfig = {}
  ): ModalRef<T> {
    // Default configuration
    const defaultConfig: ModalConfig = {
      closeOnBackdrop: true,
      closeOnEscape: true,
      showCloseButton: true,
      size: 'md',
      animation: 'scale',
      focusTrap: true,
      zIndex: this.baseZIndex + this.modals.length * 10,
      ...config
    };

    // Create backdrop
    const backdrop = this.createBackdrop(defaultConfig);
    document.body.appendChild(backdrop);

    // Create modal container
    const modalContainer = this.createModalContainer(defaultConfig);
    backdrop.appendChild(modalContainer);

    // Create component dynamically (simplified - would need proper ViewContainerRef in real implementation)
    // This is a placeholder for the actual component creation logic
    const componentRef = this.createComponent(component, modalContainer, defaultConfig);

    // Create modal reference
    const modalRef = new ModalRef(componentRef, backdrop, defaultConfig);

    // Setup event listeners
    this.setupEventListeners(modalRef, backdrop, modalContainer, defaultConfig);

    // Add to stack
    this.modals.push(modalRef);

    // Focus trap setup
    if (defaultConfig.focusTrap) {
      this.setupFocusTrap(modalContainer);
    }

    // Trigger entrance animation
    setTimeout(() => {
      backdrop.classList.add('backdrop-enter');
      modalContainer.classList.add('modal-enter');
    }, 10);

    return modalRef;
  }

  /**
   * Close the topmost modal
   */
  closeTop(): void {
    if (this.modals.length > 0) {
      const topModal = this.modals[this.modals.length - 1];
      topModal.close();
      this.modals.pop();
    }
  }

  /**
   * Close all modals
   */
  closeAll(): void {
    this.modals.forEach(modal => modal.close());
    this.modals = [];
  }

  /**
   * Get number of open modals
   */
  getOpenModalsCount(): number {
    return this.modals.length;
  }

  private createBackdrop(config: ModalConfig): HTMLElement {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: ${config.zIndex};
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Add dark mode support
    if (document.documentElement.classList.contains('dark')) {
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }

    return backdrop;
  }

  private createModalContainer(config: ModalConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = `modal-container modal-${config.size} ${config.customClass || ''}`;
    
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full'
    };

    container.style.cssText = `
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Apply size
    const maxWidth = {
      sm: '384px',
      md: '448px',
      lg: '512px',
      xl: '576px',
      full: '95vw'
    };
    container.style.maxWidth = maxWidth[config.size!];

    // Dark mode support
    if (document.documentElement.classList.contains('dark')) {
      container.style.background = '#1f2937';
      container.style.color = 'white';
    }

    return container;
  }

  private createComponent(
    component: Type<any>,
    container: HTMLElement,
    config: ModalConfig
  ): any {
    // Simplified placeholder - in real implementation, would use:
    // const componentRef = this.viewContainerRef.createComponent(component);
    // For now, returning a mock object
    return {
      instance: {},
      location: { nativeElement: container },
      destroy: () => {}
    };
  }

  private setupEventListeners(
    modalRef: ModalRef,
    backdrop: HTMLElement,
    container: HTMLElement,
    config: ModalConfig
  ): void {
    // Close on backdrop click
    if (config.closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          modalRef.close();
        }
      });
    }

    // Close on escape key
    if (config.closeOnEscape) {
      const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          modalRef.close();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    }
  }

  private setupFocusTrap(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    setTimeout(() => firstElement.focus(), 100);

    // Trap focus
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', trapFocus);
  }
}

/**
 * Base Modal Component Interface
 * Your modal components should implement this
 */
export interface ModalComponent<T = any> {
  /** Data passed to the modal */
  data?: T;
  /** Modal reference for closing */
  modalRef?: ModalRef;
}

