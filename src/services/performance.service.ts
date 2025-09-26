import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RoutePerformance {
  route: string;
  loadTime: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private routePerformanceSubject = new BehaviorSubject<RoutePerformance[]>([]);
  public routePerformance$ = this.routePerformanceSubject.asObservable();

  private routeStartTimes = new Map<string, number>();

  startRouteLoad(route: string) {
    this.routeStartTimes.set(route, performance.now());
  }

  endRouteLoad(route: string) {
    const startTime = this.routeStartTimes.get(route);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      const currentPerformance = this.routePerformanceSubject.value;
      const newPerformance: RoutePerformance = {
        route,
        loadTime,
        timestamp: new Date()
      };
      
      this.routePerformanceSubject.next([...currentPerformance, newPerformance]);
      this.routeStartTimes.delete(route);
    }
  }

  getAverageLoadTime(route: string): number {
    const performances = this.routePerformanceSubject.value
      .filter(p => p.route === route);
    
    if (performances.length === 0) return 0;
    
    const totalTime = performances.reduce((sum, p) => sum + p.loadTime, 0);
    return totalTime / performances.length;
  }

  getSlowestRoutes(limit: number = 5): RoutePerformance[] {
    return this.routePerformanceSubject.value
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, limit);
  }
}
