import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemoryMonitorService {
  private monitoringInterval?: number;
  private componentCounts = new Map<string, number>();
  private cachedDomCount: number | null = null;
  private cachedComponentCount: number | null = null;
  private lastDomQueryTime: number = 0;
  private readonly DOM_CACHE_TTL = 30000; // Cache DOM queries for 30 seconds
  
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }
    
    this.monitoringInterval = window.setInterval(() => {
      // #region agent log
      const memory = (performance as any).memory;
      const memoryInfo = memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      } : null;
      
      // Cache expensive DOM queries - only update every 30 seconds
      const now = Date.now();
      if (!this.cachedDomCount || (now - this.lastDomQueryTime) > this.DOM_CACHE_TTL) {
        // Use more efficient query: count using document.body.getElementsByTagName('*').length
        // This is faster than querySelectorAll('*') for large DOMs
        const allElements = document.body?.getElementsByTagName('*');
        this.cachedDomCount = allElements ? allElements.length : 0;
        
        // Cache component count (less expensive but still cache it)
        const componentElements = document.querySelectorAll('[ng-version], app-root');
        this.cachedComponentCount = componentElements.length;
        
        this.lastDomQueryTime = now;
      }
      
      const domNodeCount = this.cachedDomCount;
      const componentCount = this.cachedComponentCount || 0;
      
      // Memory monitoring logic can be added here if needed
    }, 5000); // Every 5 seconds (but DOM queries cached for 30 seconds)
  }
  
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }
  
  trackComponent(componentName: string): void {
    const count = this.componentCounts.get(componentName) || 0;
    this.componentCounts.set(componentName, count + 1);
  }
  
  untrackComponent(componentName: string): void {
    const count = this.componentCounts.get(componentName) || 0;
    if (count > 0) {
      this.componentCounts.set(componentName, count - 1);
    }
  }
  
  getComponentCounts(): Map<string, number> {
    return new Map(this.componentCounts);
  }
}

