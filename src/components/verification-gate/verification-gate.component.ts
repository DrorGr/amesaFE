import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verification-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
  `
})
export class VerificationGateComponent implements OnInit {
  private verificationService = inject(IdentityVerificationService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Input: whether verification is required (from feature flag)
  isVerificationRequired = input<boolean>(false);
  
  // Output: emitted when user tries to perform action but is not verified
  blocked = output<void>();

  isVerified = signal(false);
  isLoading = signal(true);

  ngOnInit() {
    this.checkVerificationStatus();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  async checkVerificationStatus() {
    if (!this.isVerificationRequired()) {
      this.isLoading.set(false);
      return;
    }

    // Only check verification status if user is authenticated
    const user = this.authService.getCurrentUser()();
    if (!user || !user.isAuthenticated) {
      this.isLoading.set(false);
      this.isVerified.set(false);
      return;
    }

    try {
      const status = await firstValueFrom(this.verificationService.getVerificationStatus());
      this.isVerified.set(status?.verificationStatus === 'verified');
    } catch (error: any) {
      // Only log non-500 errors (500 errors are backend issues, not frontend bugs)
      // Suppress 500 errors to reduce console noise
      if (error?.status !== 500 && error?.error?.statusCode !== 500) {
        console.warn('Error checking verification status:', error);
      }
      // Default to not verified on any error
      this.isVerified.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToVerification() {
    this.router.navigate(['/member-settings'], { queryParams: { tab: 'verification' } });
  }

  goToSettings() {
    this.router.navigate(['/member-settings']);
  }

  /**
   * Check if action should be blocked
   */
  shouldBlock(): boolean {
    const user = this.authService.getCurrentUser()();
    if (!user || !user.isAuthenticated) {
      this.toastService.error(this.translate('auth.loginRequired'), 4000);
      this.blocked.emit();
      return true;
    }
    
    if (this.isVerificationRequired() && !this.isVerified()) {
      this.toastService.error(this.translate('auth.verificationRequired'), 4000);
      this.blocked.emit();
      return true;
    }
    
    return false;
  }
}

