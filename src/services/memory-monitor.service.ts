import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MemoryMonitorService {
  private monitoringInterval?: number;
  private componentCounts = new Map<string, number>();
  
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
      
      // Count DOM nodes
      const domNodeCount = document.querySelectorAll('*').length;
      
      // Count Angular components (approximate by counting app-* elements)
      const componentElements = document.querySelectorAll('[ng-version], app-root, app-*, [class*="ng-"]');
      const componentCount = componentElements.length;
      
      // Throttle memory logging to prevent ERR_INSUFFICIENT_RESOURCES
      try {
        fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'memory-monitor.service.ts:startMonitoring',message:'Memory monitoring',data:{memoryInfo,domNodeCount,componentCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      } catch (e) {
        // Silently ignore fetch errors to prevent console spam
      }
      // #endregion
    }, 5000); // Every 5 seconds
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

