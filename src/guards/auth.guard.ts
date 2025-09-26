import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser()();
    
    if (user && user.isAuthenticated) {
      return true;
    } else {
      // Redirect to home page if not authenticated
      this.router.navigate(['/']);
      return false;
    }
  }
}
