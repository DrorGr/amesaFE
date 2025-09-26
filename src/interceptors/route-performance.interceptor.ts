import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PerformanceService } from '../services/performance.service';

@Injectable({
  providedIn: 'root'
})
export class RoutePerformanceInterceptor {
  constructor(
    private router: Router,
    private performanceService: PerformanceService
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart)
      )
      .subscribe((event: NavigationStart) => {
        this.performanceService.startRouteLoad(event.url);
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.performanceService.endRouteLoad(event.url);
      });
  }
}
