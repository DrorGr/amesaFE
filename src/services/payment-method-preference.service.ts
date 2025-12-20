import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { PaymentService, PaymentMethodDto, UpdatePaymentMethodRequest } from './payment.service';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';

/**
 * PaymentMethodPreferenceService
 * Manages user's default payment method preference
 * - Caches payment methods for 5 minutes
 * - Provides sync access to default payment method
 * - Handles setting default payment method
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentMethodPreferenceService {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private translationService = inject(TranslationService);
  
  private defaultPaymentMethod = signal<PaymentMethodDto | null>(null);
  private cache: { data: PaymentMethodDto | null; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private defaultPaymentMethodChanged$ = new Subject<PaymentMethodDto | null>();
  
  /**
   * Get the user's default payment method
   * Checks cache first, then fetches from API if needed
   * @returns Default payment method or null if none available
   */
  async getDefaultPaymentMethod(): Promise<PaymentMethodDto | null> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      this.defaultPaymentMethod.set(this.cache.data);
      return this.cache.data;
    }
    
    // Fetch from API
    try {
      const methods = await firstValueFrom(this.paymentService.getPaymentMethods());
      const defaultMethod = methods.find(m => m.isDefault) || methods[0] || null;
      
      // Update cache
      this.cache = {
        data: defaultMethod,
        timestamp: Date.now()
      };
      
      this.defaultPaymentMethod.set(defaultMethod);
      return defaultMethod;
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      // Show user-friendly error message using translation key
      const errorMessage = this.translationService.translate('payment.methodPreference.loadError') || 
        'Failed to load payment methods. Please try again.';
      this.toastService.error(errorMessage, 4000);
      // Return null to allow fallback - calling code should handle null gracefully
      return null;
    }
  }
  
  /**
   * Set the default payment method
   * Updates API and clears cache to force refresh
   * @param methodId Payment method ID to set as default
   */
  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    try {
      // Update payment method to set as default
      const updateRequest: UpdatePaymentMethodRequest = {
        isDefault: true
      };
      
      await firstValueFrom(this.paymentService.updatePaymentMethod(methodId, updateRequest));
      
      // Clear cache to force refresh
      this.clearCache();
      
      // Refresh default payment method
      const updatedMethod = await this.getDefaultPaymentMethod();
      
      // Notify subscribers of the change
      this.defaultPaymentMethodChanged$.next(updatedMethod);
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      // Show user-friendly error message using translation key
      const errorMessage = this.translationService.translate('payment.methodPreference.setError') || 
        'Failed to set default payment method.';
      this.toastService.error(errorMessage, 4000);
      throw error;
    }
  }
  
  /**
   * Get default payment method synchronously (from signal)
   * Returns cached value if available, null otherwise
   * @returns Default payment method or null
   */
  getDefaultPaymentMethodSync(): PaymentMethodDto | null {
    return this.defaultPaymentMethod();
  }
  
  /**
   * Clear cached payment method (useful on logout)
   */
  clearCache(): void {
    this.cache = null;
    this.defaultPaymentMethod.set(null);
    this.defaultPaymentMethodChanged$.next(null);
  }
  
  /**
   * Invalidate cache when payment methods are updated elsewhere
   * Call this method when payment methods are created, updated, or deleted
   * to ensure cache stays in sync
   */
  invalidateCache(): void {
    this.clearCache();
    // Notify subscribers that cache was invalidated
    this.defaultPaymentMethodChanged$.next(null);
  }
  
  /**
   * Get observable for default payment method changes
   * Subscribe to this to be notified when the default payment method changes
   * @returns Observable that emits when default payment method changes
   */
  getDefaultPaymentMethodChanged$(): Observable<PaymentMethodDto | null> {
    return this.defaultPaymentMethodChanged$.asObservable();
  }
}

