import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload routes after a short delay to not block initial load
    const delay = this.getPreloadDelay(route);
    
    if (delay > 0) {
      return timer(delay).pipe(
        switchMap(() => load())
      );
    }
    
    return load();
  }

  private getPreloadDelay(route: Route): number {
    // Preload high-priority routes immediately
    const highPriorityRoutes = ['about', 'faq', 'help'];
    if (highPriorityRoutes.includes(route.path || '')) {
      return 0;
    }

    // Preload medium-priority routes after 2 seconds
    const mediumPriorityRoutes = ['sponsorship', 'partners', 'how-it-works'];
    if (mediumPriorityRoutes.includes(route.path || '')) {
      return 2000;
    }

    // Preload low-priority routes after 5 seconds
    const lowPriorityRoutes = ['register', 'member-settings', 'promotions', 'responsible-gambling'];
    if (lowPriorityRoutes.includes(route.path || '')) {
      return 5000;
    }

    // Default delay for unknown routes
    return 3000;
  }
}
