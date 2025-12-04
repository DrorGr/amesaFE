import { Injectable, ErrorHandler, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

/**
 * Interface for error information structure
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  stack?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Service for comprehensive error handling, logging, and user notification.
 * Provides centralized error management with different severity levels.
 * 
 * @example
 * ```typescript
 * constructor(private errorHandler: ErrorHandlingService) {}
 * 
 * handleError(error: Error) {
 *   this.errorHandler.handleError(error, 'critical');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService implements ErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;
  private toastService = inject(ToastService);

  /**
   * Handles global Angular errors
   * @param error - The error to handle
   */
  handleError(error: any): void {
    // Filter out NG0203 errors (inject() must be called from an injection context)
    // These are often transient initialization errors that don't need user notification
    if (error?.message?.includes('NG0203') || 
        error?.message?.includes('inject() must be called from an injection context') ||
        error?.code === 'NG0203') {
      // Silently log to console only, don't show toast
      console.warn('NG0203: Service injection context error (handled silently):', error);
      return;
    }
    
    const errorInfo = this.createErrorInfo(error, 'medium');
    this.logError(errorInfo);
    this.notifyUser(errorInfo);
  }

  /**
   * Handles custom application errors with specified severity
   * @param error - The error to handle
   * @param severity - The severity level of the error
   * @param userId - Optional user ID for context
   */
  handleCustomError(error: Error | HttpErrorResponse, severity: ErrorInfo['severity'] = 'medium', userId?: string): void {
    const errorInfo = this.createErrorInfo(error, severity, userId);
    this.logError(errorInfo);
    this.notifyUser(errorInfo);
  }

  /**
   * Creates structured error information from various error types
   * @param error - The error object
   * @param severity - The severity level
   * @param userId - Optional user ID
   * @returns Structured error information
   */
  private createErrorInfo(error: any, severity: ErrorInfo['severity'], userId?: string): ErrorInfo {
    let message = 'An unknown error occurred';
    let code: string | undefined;
    let stack: string | undefined;

    if (error instanceof HttpErrorResponse) {
      message = error.message || `HTTP Error: ${error.status} ${error.statusText}`;
      code = error.status.toString();
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
      stack = error.stack;
    }

    return {
      message,
      code,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack,
      userId,
      severity
    };
  }

  /**
   * Logs error information to console and internal log
   * @param errorInfo - The error information to log
   */
  private logError(errorInfo: ErrorInfo): void {
    // Add to internal log
    this.errorLog.unshift(errorInfo);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(errorInfo.severity);
    logMethod(`[${errorInfo.severity.toUpperCase()}] ${errorInfo.message}`, errorInfo);

    // In production, you might want to send to external logging service
    if (this.shouldSendToExternalService(errorInfo)) {
      this.sendToExternalService(errorInfo);
    }
  }

  /**
   * Notifies user about the error based on severity
   * @param errorInfo - The error information
   */
  private notifyUser(errorInfo: ErrorInfo): void {
    switch (errorInfo.severity) {
      case 'critical':
        this.showCriticalError(errorInfo);
        break;
      case 'high':
        this.showHighSeverityError(errorInfo);
        break;
      case 'medium':
        this.showMediumSeverityError(errorInfo);
        break;
      case 'low':
        // Low severity errors might not need user notification
        break;
    }
  }

  /**
   * Shows critical error notification
   * @param errorInfo - The error information
   */
  private showCriticalError(errorInfo: ErrorInfo): void {
    console.error('CRITICAL ERROR:', errorInfo);
    // Show error toast with longer duration for critical errors
    this.toastService.error(
      errorInfo.message || 'A critical error occurred. Please refresh the page or contact support.',
      6000
    );
  }

  /**
   * Shows high severity error notification
   * @param errorInfo - The error information
   */
  private showHighSeverityError(errorInfo: ErrorInfo): void {
    console.error('HIGH SEVERITY ERROR:', errorInfo);
    // Show error toast
    this.toastService.error(
      errorInfo.message || 'An error occurred. Please try again.',
      5000
    );
  }

  /**
   * Shows medium severity error notification
   * @param errorInfo - The error information
   */
  private showMediumSeverityError(errorInfo: ErrorInfo): void {
    console.warn('MEDIUM SEVERITY ERROR:', errorInfo);
    // Show warning toast for medium severity errors
    this.toastService.warning(
      errorInfo.message || 'Something went wrong. Please check your input.',
      4000
    );
  }

  /**
   * Gets appropriate console log method based on severity
   * @param severity - The error severity
   * @returns Console log method
   */
  private getLogMethod(severity: ErrorInfo['severity']) {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      case 'low':
        return console.log;
      default:
        return console.log;
    }
  }

  /**
   * Determines if error should be sent to external service
   * @param errorInfo - The error information
   * @returns True if should send to external service
   */
  private shouldSendToExternalService(errorInfo: ErrorInfo): boolean {
    // Only send high and critical errors to external service
    return errorInfo.severity === 'high' || errorInfo.severity === 'critical';
  }

  /**
   * Sends error to external logging service
   * @param errorInfo - The error information
   */
  private sendToExternalService(errorInfo: ErrorInfo): void {
    // In a real application, you would send this to your logging service
    // like Sentry, LogRocket, or your own API
    console.log('Sending to external service:', errorInfo);
  }

  /**
   * Gets recent error log
   * @param limit - Maximum number of errors to return
   * @returns Array of recent errors
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Gets errors by severity
   * @param severity - The severity level to filter by
   * @returns Array of errors with specified severity
   */
  getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Clears the error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Gets error statistics
   * @returns Object with error counts by severity
   */
  getErrorStatistics(): { [key in ErrorInfo['severity']]: number } {
    const stats = { low: 0, medium: 0, high: 0, critical: 0 };
    
    this.errorLog.forEach(error => {
      stats[error.severity]++;
    });
    
    return stats;
  }
}
