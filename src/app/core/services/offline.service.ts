import { Injectable, signal } from '@angular/core';
import { fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private requestQueue: QueuedRequest[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  // Signal for online/offline state
  public isOnline = signal<boolean>(navigator.onLine);

  constructor() {
    // Monitor online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
      of(navigator.onLine)
    ).subscribe(isOnline => {
      this.isOnline.set(isOnline);
      
      if (isOnline && this.requestQueue.length > 0) {
        console.log(`[OfflineService] Back online, processing ${this.requestQueue.length} queued requests`);
        this.processQueue();
      }
    });
  }

  /**
   * Queue a request for retry when online
   */
  queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): string {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      retries: 0
    };

    this.requestQueue.push(queuedRequest);
    console.log(`[OfflineService] Queued request: ${queuedRequest.method} ${queuedRequest.url}`);
    
    // If online, try to process immediately
    if (this.isOnline()) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  /**
   * Remove a request from the queue
   */
  removeRequest(requestId: string): void {
    this.requestQueue = this.requestQueue.filter(req => req.id !== requestId);
  }

  /**
   * Process queued requests when back online
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline() || this.requestQueue.length === 0) {
      return;
    }

    const requestsToProcess = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requestsToProcess) {
      if (request.retries >= this.maxRetries) {
        console.warn(`[OfflineService] Max retries reached for ${request.method} ${request.url}`);
        continue;
      }

      try {
        // Wait for retry delay before processing
        if (request.retries > 0) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }

        request.retries++;
        const success = await this.executeRequest(request);

        if (!success) {
          // Re-queue if failed
          this.requestQueue.push(request);
        }
      } catch (error) {
        console.error(`[OfflineService] Error processing queued request:`, error);
        // Re-queue if error
        this.requestQueue.push(request);
      }
    }
  }

  /**
   * Execute a queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<boolean> {
    try {
      const options: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        }
      };

      if (request.data && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        options.body = JSON.stringify(request.data);
      }

      const response = await fetch(request.url, options);
      return response.ok;
    } catch (error) {
      console.error(`[OfflineService] Request execution failed:`, error);
      return false;
    }
  }

  /**
   * Get queued requests count
   */
  getQueuedCount(): number {
    return this.requestQueue.length;
  }

  /**
   * Clear all queued requests
   */
  clearQueue(): void {
    this.requestQueue = [];
  }
}

