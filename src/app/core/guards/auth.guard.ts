import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser()();
    const userDto = this.authService.getCurrentUserDto()();
    
    if (user && user.isAuthenticated) {
      // Check if email is verified
      if (userDto && !userDto.emailVerified) {
        // Redirect to email verification page
        this.toastService.warning('Please verify your email before accessing this page.', 4000);
        this.router.navigate(['/verify-email'], {
          queryParams: { email: userDto.email }
        });
        return false;
      }
      return true;
    } else {
      // Show error toast and redirect to home page if not authenticated
      this.toastService.error('Please log in to access this page.', 4000);
      this.router.navigate(['/']);
      return false;
    }
  }
}
