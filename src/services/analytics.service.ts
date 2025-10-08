import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface AnalyticsDto {
  id: string;
  eventType: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: any;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  page?: string;
}

export interface AnalyticsSummaryDto {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEvents: Array<{ eventName: string; count: number }>;
  topPages: Array<{ page: string; views: number }>;
  userEngagement: {
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserBreakdown: Array<{ browser: string; count: number }>;
  osBreakdown: Array<{ os: string; count: number }>;
}

export interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  eventName?: string;
  userId?: string;
  sessionId?: string;
  page?: string;
  limit?: number;
  offset?: number;
}

export interface TrackEventRequest {
  eventType: string;
  eventName: string;
  properties?: any;
  page?: string;
}

export interface UserBehaviorDto {
  userId: string;
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number;
  lastActiveAt: Date;
  favoritePages: Array<{ page: string; views: number }>;
  topEvents: Array<{ eventName: string; count: number }>;
  devicePreference: string;
  browserPreference: string;
}

export interface ConversionFunnelDto {
  step: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private apiService: ApiService) {}

  // Event Tracking
  trackEvent(eventData: TrackEventRequest): Observable<boolean> {
    return this.apiService.post('analytics/track', eventData).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error tracking event:', error);
        return throwError(() => error);
      })
    );
  }

  // Page View Tracking
  trackPageView(page: string, properties?: any): Observable<boolean> {
    return this.trackEvent({
      eventType: 'page_view',
      eventName: 'page_viewed',
      properties: {
        ...properties,
        page
      },
      page
    });
  }

  // User Action Tracking
  trackUserAction(action: string, properties?: any): Observable<boolean> {
    return this.trackEvent({
      eventType: 'user_action',
      eventName: action,
      properties
    });
  }

  // E-commerce Tracking
  trackPurchase(transactionId: string, value: number, currency: string, items: any[]): Observable<boolean> {
    return this.trackEvent({
      eventType: 'ecommerce',
      eventName: 'purchase',
      properties: {
        transactionId,
        value,
        currency,
        items
      }
    });
  }

  // Custom Event Tracking
  trackCustomEvent(eventName: string, properties?: any): Observable<boolean> {
    return this.trackEvent({
      eventType: 'custom',
      eventName,
      properties
    });
  }

  // Analytics Data Retrieval
  getAnalyticsSummary(params?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
  }): Observable<AnalyticsSummaryDto> {
    return this.apiService.get<AnalyticsSummaryDto>('analytics/summary', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch analytics summary');
      }),
      catchError(error => {
        console.error('Error fetching analytics summary:', error);
        return throwError(() => error);
      })
    );
  }

  getAnalyticsEvents(query?: AnalyticsQuery): Observable<{ events: AnalyticsDto[]; totalCount: number }> {
    return this.apiService.get<{ events: AnalyticsDto[]; totalCount: number }>('analytics/events', query).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch analytics events');
      }),
      catchError(error => {
        console.error('Error fetching analytics events:', error);
        return throwError(() => error);
      })
    );
  }

  getUserBehavior(userId: string): Observable<UserBehaviorDto> {
    return this.apiService.get<UserBehaviorDto>(`analytics/users/${userId}/behavior`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user behavior');
      }),
      catchError(error => {
        console.error('Error fetching user behavior:', error);
        return throwError(() => error);
      })
    );
  }

  getConversionFunnel(funnelName: string, params?: {
    startDate?: Date;
    endDate?: Date;
  }): Observable<ConversionFunnelDto[]> {
    return this.apiService.get<ConversionFunnelDto[]>(`analytics/funnels/${funnelName}`, params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch conversion funnel');
      }),
      catchError(error => {
        console.error('Error fetching conversion funnel:', error);
        return throwError(() => error);
      })
    );
  }

  // Real-time Analytics
  getRealTimeAnalytics(): Observable<{
    activeUsers: number;
    activeSessions: number;
    currentEvents: AnalyticsDto[];
  }> {
    return this.apiService.get<{
      activeUsers: number;
      activeSessions: number;
      currentEvents: AnalyticsDto[];
    }>('analytics/realtime').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch real-time analytics');
      }),
      catchError(error => {
        console.error('Error fetching real-time analytics:', error);
        return throwError(() => error);
      })
    );
  }

  // Export Analytics Data
  exportAnalyticsData(params?: {
    startDate?: Date;
    endDate?: Date;
    format?: 'csv' | 'json' | 'xlsx';
    eventType?: string;
  }): Observable<Blob> {
    return this.apiService.get<Blob>('analytics/export', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to export analytics data');
      }),
      catchError(error => {
        console.error('Error exporting analytics data:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility Methods
  generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    return { name: browserName, version: browserVersion };
  }

  getOSInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Windows') > -1) return 'Windows';
    if (userAgent.indexOf('Mac') > -1) return 'macOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('iOS') > -1) return 'iOS';
    return 'Unknown';
  }
}
