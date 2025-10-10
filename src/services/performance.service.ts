import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private performanceMetrics = new Map<string, number>();

  constructor() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
  }

  // Mark performance timing
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  // Measure performance between two marks
  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        const duration = measure.duration;
        this.performanceMetrics.set(name, duration);
        return duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return 0;
      }
    }
    return 0;
  }

  // Get performance metric
  getMetric(name: string): number | undefined {
    return this.performanceMetrics.get(name);
  }

  // Get all metrics
  getAllMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.performanceMetrics.clear();
  }

  // Monitor Core Web Vitals
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.performanceMetrics.set('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.performanceMetrics.set('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.performanceMetrics.set('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  // Start route load timing
  startRouteLoad(url: string): void {
    this.mark(`route-start-${url}`);
  }

  // End route load timing
  endRouteLoad(url: string): void {
    this.mark(`route-end-${url}`);
    this.measure(`route-load-${url}`, `route-start-${url}`, `route-end-${url}`);
  }

  // Log performance metrics
  logMetrics(): void {
    console.group('Performance Metrics');
    this.performanceMetrics.forEach((value, key) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  // Check if performance is good
  isPerformanceGood(): boolean {
    const lcp = this.performanceMetrics.get('LCP');
    const fid = this.performanceMetrics.get('FID');
    const cls = this.performanceMetrics.get('CLS');

    return (
      (lcp === undefined || lcp < 2500) && // LCP < 2.5s
      (fid === undefined || fid < 100) &&  // FID < 100ms
      (cls === undefined || cls < 0.1)     // CLS < 0.1
    );
  }
}