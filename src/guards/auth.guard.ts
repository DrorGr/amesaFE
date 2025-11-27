import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser()();
    
    if (user && user.isAuthenticated) {
      return true;
    } else {
      // Show error toast and redirect to home page if not authenticated
      this.toastService.error('Please log in to access this page.', 4000);
      this.router.navigate(['/']);
      return false;
    }
  }
}
