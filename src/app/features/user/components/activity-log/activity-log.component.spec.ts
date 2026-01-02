import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ActivityLogComponent } from './activity-log.component';
import { AnalyticsService } from '@core/services/analytics.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { AuthService } from '@core/services/auth.service';

describe('ActivityLogComponent', () => {
  let component: ActivityLogComponent;
  let fixture: ComponentFixture<ActivityLogComponent>;
  let mockAnalyticsService: jasmine.SpyObj<AnalyticsService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockLocaleService: jasmine.SpyObj<LocaleService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockActivity = {
    items: [
      {
        id: '1',
        userId: 'user1',
        activityType: 'login',
        timestamp: new Date(),
        details: {}
      }
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    const analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['getActivity']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const localeServiceSpy = jasmine.createSpyObj('LocaleService', ['formatDate']);
    localeServiceSpy.formatDate.and.returnValue('Jan 1, 2024');
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 'user1' } as any);

    await TestBed.configureTestingModule({
      imports: [
        ActivityLogComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityLogComponent);
    component = fixture.componentInstance;
    mockAnalyticsService = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockLocaleService = TestBed.inject(LocaleService) as jasmine.SpyObj<LocaleService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load activity on init', () => {
    mockAnalyticsService.getActivity.and.returnValue(of(mockActivity));
    
    component.ngOnInit();
    
    expect(mockAnalyticsService.getActivity).toHaveBeenCalled();
    expect(component.activityData()).toEqual(mockActivity);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle load error', () => {
    const error = { message: 'Failed to load activity' };
    mockAnalyticsService.getActivity.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.isLoading()).toBe(false);
  });

  it('should apply filters', () => {
    mockAnalyticsService.getActivity.and.returnValue(of(mockActivity));
    component.filters.set({ activityType: 'login' });
    
    component.applyFilters();
    
    expect(mockAnalyticsService.getActivity).toHaveBeenCalled();
  });

  it('should navigate to next page', () => {
    component.pagination.set({ page: 1, limit: 20, total: 40, totalPages: 2 });
    mockAnalyticsService.getActivity.and.returnValue(of(mockActivity));
    
    component.nextPage();
    
    expect(mockAnalyticsService.getActivity).toHaveBeenCalled();
  });

  it('should not display PII (IP address or user agent)', () => {
    const activityWithPII = {
      items: [
        {
          id: '1',
          userId: 'user1',
          activityType: 'login',
          timestamp: new Date(),
          details: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          }
        }
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    };
    
    mockAnalyticsService.getActivity.and.returnValue(of(activityWithPII));
    component.ngOnInit();
    
    // Verify that PII is not exposed in the component
    const activity = component.activityData()?.items[0];
    expect(activity?.details).not.toHaveProperty('ipAddress');
    expect(activity?.details).not.toHaveProperty('userAgent');
  });
});








