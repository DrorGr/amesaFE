import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, PagedResponse } from './api.service';

export interface PromotionDto {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableHouses?: string[];
  applicableUsers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionUsageDto {
  id: string;
  promotionId: string;
  userId: string;
  transactionId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  description: string;
  type: string;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: Date;
  endDate: Date;
  applicableHouses?: string[];
  applicableUsers?: string[];
}

export interface UpdatePromotionRequest {
  name?: string;
  description?: string;
  type?: string;
  value?: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableHouses?: string[];
  applicableUsers?: string[];
}

export interface ValidatePromotionRequest {
  code: string;
  userId: string;
  houseId?: string;
  amount: number;
}

export interface PromotionValidationResponse {
  isValid: boolean;
  promotion?: PromotionDto;
  discountAmount: number;
  message?: string;
  errorCode?: string;
}

export interface ApplyPromotionRequest {
  code: string;
  userId: string;
  houseId?: string;
  amount: number;
  transactionId: string;
}

export interface PromotionSearchParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  constructor(private apiService: ApiService) {}

  // Promotion Management
  getPromotions(params?: PromotionSearchParams): Observable<PagedResponse<PromotionDto>> {
    return this.apiService.get<PagedResponse<PromotionDto>>('promotions', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch promotions');
      }),
      catchError(error => {
        console.error('Error fetching promotions:', error);
        return throwError(() => error);
      })
    );
  }

  getPromotionById(id: string): Observable<PromotionDto> {
    return this.apiService.get<PromotionDto>(`promotions/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch promotion');
      }),
      catchError(error => {
        console.error('Error fetching promotion:', error);
        return throwError(() => error);
      })
    );
  }

  getPromotionByCode(code: string): Observable<PromotionDto> {
    return this.apiService.get<PromotionDto>(`promotions/code/${code}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch promotion');
      }),
      catchError(error => {
        console.error('Error fetching promotion:', error);
        return throwError(() => error);
      })
    );
  }

  createPromotion(promotionData: CreatePromotionRequest): Observable<PromotionDto> {
    return this.apiService.post<PromotionDto>('promotions', promotionData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create promotion');
      }),
      catchError(error => {
        console.error('Error creating promotion:', error);
        return throwError(() => error);
      })
    );
  }

  updatePromotion(id: string, updateData: UpdatePromotionRequest): Observable<PromotionDto> {
    return this.apiService.put<PromotionDto>(`promotions/${id}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update promotion');
      }),
      catchError(error => {
        console.error('Error updating promotion:', error);
        return throwError(() => error);
      })
    );
  }

  deletePromotion(id: string): Observable<boolean> {
    return this.apiService.delete(`promotions/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting promotion:', error);
        return throwError(() => error);
      })
    );
  }

  // Promotion Validation and Application
  validatePromotion(validationData: ValidatePromotionRequest): Observable<PromotionValidationResponse> {
    return this.apiService.post<PromotionValidationResponse>('promotions/validate', validationData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to validate promotion');
      }),
      catchError(error => {
        console.error('Error validating promotion:', error);
        return throwError(() => error);
      })
    );
  }

  applyPromotion(applicationData: ApplyPromotionRequest): Observable<PromotionValidationResponse> {
    return this.apiService.post<PromotionValidationResponse>('promotions/apply', applicationData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to apply promotion');
      }),
      catchError(error => {
        console.error('Error applying promotion:', error);
        return throwError(() => error);
      })
    );
  }

  // User Promotion History
  getUserPromotionHistory(userId: string): Observable<PromotionUsageDto[]> {
    return this.apiService.get<PromotionUsageDto[]>(`promotions/users/${userId}/history`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user promotion history');
      }),
      catchError(error => {
        console.error('Error fetching user promotion history:', error);
        return throwError(() => error);
      })
    );
  }

  // Available Promotions for User
  getAvailablePromotionsForUser(userId: string, houseId?: string): Observable<PromotionDto[]> {
    const params: any = { userId };
    if (houseId) params.houseId = houseId;

    return this.apiService.get<PromotionDto[]>('promotions/available', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch available promotions');
      }),
      catchError(error => {
        console.error('Error fetching available promotions:', error);
        return throwError(() => error);
      })
    );
  }

  // Promotion Usage Statistics
  getPromotionUsageStats(promotionId: string): Observable<{
    totalUsage: number;
    uniqueUsers: number;
    totalDiscount: number;
    averageDiscount: number;
    usageByDate: Array<{ date: string; count: number; discount: number }>;
  }> {
    return this.apiService.get(`promotions/${promotionId}/stats`).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          return {
            totalUsage: data.totalUsage,
            uniqueUsers: data.uniqueUsers,
            totalDiscount: data.totalDiscount,
            averageDiscount: data.averageDiscount,
            usageByDate: data.usageByDate
          };
        }
        throw new Error('Failed to fetch promotion usage stats');
      }),
      catchError(error => {
        console.error('Error fetching promotion usage stats:', error);
        return throwError(() => error);
      })
    );
  }

  // Promotion Analytics
  getPromotionAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
  }): Observable<{
    totalPromotions: number;
    activePromotions: number;
    totalUsage: number;
    totalDiscount: number;
    topPromotions: Array<{ promotion: PromotionDto; usage: number; discount: number }>;
    usageByType: Array<{ type: string; count: number; discount: number }>;
  }> {
    return this.apiService.get('promotions/analytics', params).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          return {
            totalPromotions: data.totalPromotions,
            activePromotions: data.activePromotions,
            totalUsage: data.totalUsage,
            totalDiscount: data.totalDiscount,
            topPromotions: data.topPromotions,
            usageByType: data.usageByType
          };
        }
        throw new Error('Failed to fetch promotion analytics');
      }),
      catchError(error => {
        console.error('Error fetching promotion analytics:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility Methods
  calculateDiscount(promotion: PromotionDto, amount: number): number {
    let discount = 0;

    if (promotion.minAmount && amount < promotion.minAmount) {
      return 0;
    }

    switch (promotion.type) {
      case 'percentage':
        discount = (amount * promotion.value) / 100;
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
          discount = promotion.maxDiscount;
        }
        break;
      case 'fixed':
        discount = promotion.value;
        break;
      case 'free_shipping':
        // This would be handled differently based on business logic
        discount = 0;
        break;
    }

    return Math.min(discount, amount);
  }

  isPromotionValid(promotion: PromotionDto, userId: string, houseId?: string): boolean {
    const now = new Date();
    
    // Check if promotion is active
    if (!promotion.isActive) return false;
    
    // Check date range
    if (now < promotion.startDate || now > promotion.endDate) return false;
    
    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) return false;
    
    // Check if user is applicable
    if (promotion.applicableUsers && !promotion.applicableUsers.includes(userId)) return false;
    
    // Check if house is applicable
    if (houseId && promotion.applicableHouses && !promotion.applicableHouses.includes(houseId)) return false;
    
    return true;
  }

  formatPromotionCode(code: string): string {
    return code.toUpperCase().replace(/\s+/g, '');
  }

  generatePromotionCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${cleanName}${randomSuffix}`;
  }
}
