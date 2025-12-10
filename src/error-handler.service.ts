import { Injectable, ErrorHandler, inject } from '@angular/core';
import { ToastService } from './services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);

  handleError(error: any): void {
    // Log error to console
    console.error('Global Error Handler:', error);

    // Extract error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Show user-friendly error message
    try {
      this.toastService.error(errorMessage, 5000);
    } catch (toastError) {
      // Fallback if toast service not available
      console.error('Error showing toast:', toastError);
    }

    // In production, you might want to send error to logging service
    // Example: this.loggingService.logError(error);
  }
}

