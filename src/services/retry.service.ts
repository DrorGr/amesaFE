import { Injectable } from '@angular/core';
import { Observable, throwError, timer, EMPTY } from 'rxjs';
import { retryWhen, mergeMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RetryService {
  /**
   * Retry an observable with exponential backoff
   * @param source The observable to retry
   * @param maxRetries Maximum number of retry attempts (default: 3)
   * @param initialDelay Initial delay in milliseconds (default: 1000)
   * @param shouldRetry Optional function to determine if error should be retried
   */
  retryWithBackoff<T>(
    source: Observable<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    shouldRetry?: (error: any) => boolean
  ): Observable<T> {
    return source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            // Check if we should retry this error
            if (shouldRetry && !shouldRetry(error)) {
              return throwError(() => error); // Don't retry, throw immediately
            }

            // Check if we've exceeded max retries
            if (index >= maxRetries) {
              return throwError(() => error);
            }

            // Calculate delay with exponential backoff
            const delay = initialDelay * Math.pow(2, index);
            
            // Retry after delay
            return timer(delay);
          })
        )
      )
    );
  }

  /**
   * Check if error is a network error (5xx, timeout, connection errors)
   */
  isNetworkError(error: any): boolean {
    // Check for HTTP status codes
    const status = error?.status || error?.error?.status || error?.error?.error?.status;
    
    // 5xx server errors should be retried
    if (status >= 500 && status < 600) {
      return true;
    }

    // Network errors (no status code)
    if (!status) {
      // Check for common network error messages
      const message = (error?.message || error?.error?.message || '').toLowerCase();
      if (message.includes('network') || 
          message.includes('timeout') || 
          message.includes('connection') ||
          message.includes('failed to fetch')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Retry only on network errors (5xx, timeout, connection errors)
   * Don't retry on 4xx client errors
   */
  retryOnNetworkError<T>(
    source: Observable<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Observable<T> {
    return this.retryWithBackoff(
      source,
      maxRetries,
      initialDelay,
      (error) => this.isNetworkError(error)
    );
  }
}

