import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Toast Types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast Position
 */
export type ToastPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Toast Configuration
 */
export interface ToastConfig {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Toast position */
  position?: ToastPosition;
  /** Show close button */
  closeable?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon HTML */
  customIcon?: string;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Custom CSS class */
  customClass?: string;
}

/**
 * Toast Instance
 */
export interface Toast extends Required<ToastConfig> {
  id: string;
  createdAt: number;
  /** Animation state */
  state: 'entering' | 'visible' | 'exiting' | 'exited';
}

/**
 * Toast Service
 * Manages toast notifications with queue and auto-dismiss
 * 
 * Usage:
 * this.toastService.success('Operation completed!');
 * this.toastService.error('Something went wrong');
 * this.toastService.warning('Please review your input');
 * this.toastService.info('New features available');
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastSubject = new Subject<Toast[]>();
  private idCounter = 0;

  /** Observable of toast array */
  public toasts$: Observable<Toast[]> = this.toastSubject.asObservable();

  /** Default configuration */
  private defaultConfig: Partial<ToastConfig> = {
    type: 'info',
    duration: 5000,
    position: 'top-right',
    closeable: true,
    showIcon: true,
    customClass: ''
  };

  /** Maximum toasts to show at once */
  private maxToasts = 5;

  constructor() {
    // Initialize with empty array
    this.toastSubject.next([]);
  }

  /**
   * Show a success toast
   */
  success(message: string, config?: Partial<ToastConfig>): string {
    return this.show({
      ...config,
      message,
      type: 'success'
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, config?: Partial<ToastConfig>): string {
    return this.show({
      ...config,
      message,
      type: 'error',
      duration: config?.duration ?? 7000 // Errors stay longer
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, config?: Partial<ToastConfig>): string {
    return this.show({
      ...config,
      message,
      type: 'warning',
      duration: config?.duration ?? 6000
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, config?: Partial<ToastConfig>): string {
    return this.show({
      ...config,
      message,
      type: 'info'
    });
  }

  /**
   * Show a custom toast
   */
  show(config: ToastConfig): string {
    const toast: Toast = {
      ...this.defaultConfig,
      ...config,
      id: this.generateId(),
      createdAt: Date.now(),
      state: 'entering',
      // Ensure required fields have defaults
      message: config.message,
      type: config.type || 'info',
      duration: config.duration ?? this.defaultConfig.duration!,
      position: config.position || this.defaultConfig.position!,
      closeable: config.closeable ?? this.defaultConfig.closeable!,
      showIcon: config.showIcon ?? this.defaultConfig.showIcon!,
      customIcon: config.customIcon || '',
      actionText: config.actionText || '',
      onAction: config.onAction || (() => {}),
      customClass: config.customClass || ''
    };

    // Add to queue
    this.toasts.push(toast);

    // Enforce max toasts limit
    if (this.toasts.length > this.maxToasts) {
      const removed = this.toasts.shift();
      if (removed) {
        this.dismiss(removed.id);
      }
    }

    // Emit updated toasts
    this.toastSubject.next([...this.toasts]);

    // Change state to visible after entrance animation
    setTimeout(() => {
      toast.state = 'visible';
      this.toastSubject.next([...this.toasts]);
    }, 100);

    // Auto-dismiss
    if (toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }

    return toast.id;
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;

    // Start exit animation
    toast.state = 'exiting';
    this.toastSubject.next([...this.toasts]);

    // Remove after animation
    setTimeout(() => {
      toast.state = 'exited';
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.toastSubject.next([...this.toasts]);
    }, 300);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.forEach(toast => {
      toast.state = 'exiting';
    });
    this.toastSubject.next([...this.toasts]);

    setTimeout(() => {
      this.toasts = [];
      this.toastSubject.next([]);
    }, 300);
  }

  /**
   * Get toast by ID
   */
  getToast(id: string): Toast | undefined {
    return this.toasts.find(t => t.id === id);
  }

  /**
   * Get all active toasts
   */
  getToasts(): Toast[] {
    return [...this.toasts];
  }

  /**
   * Get toasts by position
   */
  getToastsByPosition(position: ToastPosition): Toast[] {
    return this.toasts.filter(t => t.position === position);
  }

  /**
   * Update max toasts limit
   */
  setMaxToasts(max: number): void {
    this.maxToasts = max;
  }

  /**
   * Update default configuration
   */
  setDefaultConfig(config: Partial<ToastConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
  }

  private generateId(): string {
    return `toast-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * Get icon HTML for toast type
   */
  getIconHtml(toast: Toast): string {
    if (toast.customIcon) {
      return toast.customIcon;
    }

    const icons = {
      success: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      error: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`,
      warning: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`,
      info: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`
    };

    return icons[toast.type];
  }

  /**
   * Get CSS classes for toast type
   */
  getTypeClasses(type: ToastType): string {
    const classes = {
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
      error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
    };

    return classes[type];
  }

  /**
   * Get CSS classes for toast position
   */
  getPositionClasses(position: ToastPosition): string {
    const classes = {
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4'
    };

    return classes[position];
  }
}

