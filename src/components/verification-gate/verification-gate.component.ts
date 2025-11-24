import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IdentityVerificationService } from '../../services/identity-verification.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-verification-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVerificationRequired() && !isVerified()) {
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-6 mb-6">
        <div class="flex items-start">
          <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              {{ translate('lottery.verificationRequired') }}
            </h3>
            <p class="text-yellow-700 dark:text-yellow-300 mb-4">
              {{ translate('lottery.verificationRequiredDesc') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                (click)="goToVerification()"
                class="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors duration-200">
                {{ translate('lottery.completeVerification') }}
              </button>
              <button
                (click)="goToSettings()"
                class="px-6 py-3 bg-transparent border-2 border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 font-semibold rounded-lg transition-colors duration-200">
                {{ translate('lottery.goToVerification') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
    <ng-content></ng-content>
  `
})
export class VerificationGateComponent implements OnInit {
  private verificationService = inject(IdentityVerificationService);
  private translationService = inject(TranslationService);
  private router = inject(Router);

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

    try {
      const status = await this.verificationService.getVerificationStatus().toPromise();
      this.isVerified.set(status?.verificationStatus === 'verified');
    } catch (error) {
      console.error('Error checking verification status:', error);
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
    return this.isVerificationRequired() && !this.isVerified();
  }
}

