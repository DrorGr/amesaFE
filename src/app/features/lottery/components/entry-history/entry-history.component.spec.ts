import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

import { EntryHistoryComponent } from './entry-history.component';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { AuthService } from '@core/services/auth.service';
import { RealtimeService } from '@core/services/realtime.service';
import { LocaleService } from '@core/services/locale.service';

describe('EntryHistoryComponent', () => {
  let component: EntryHistoryComponent;
  let fixture: ComponentFixture<EntryHistoryComponent>;
  let mockLotteryService: jasmine.SpyObj<LotteryService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRealtimeService: jasmine.SpyObj<RealtimeService>;
  let mockLocaleService: jasmine.SpyObj<LocaleService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockHistory = {
    items: [
      {
        id: '1',
        ticketNumber: 'T001',
        houseId: 'house1',
        houseTitle: 'Test House',
        purchaseDate: new Date(),
        purchasePrice: 100,
        status: 'active',
        isWinner: false
      }
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const lotteryServiceSpy = jasmine.createSpyObj('LotteryService', ['getTicketHistory']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate', 'translateWithParams']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    translationServiceSpy.translateWithParams.and.returnValue('Translated text');
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 'user1' } as any);
    
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeService', ['getConnectionState']);
    realtimeServiceSpy.getConnectionState.and.returnValue(of(HubConnectionState.Connected));
    
    const localeServiceSpy = jasmine.createSpyObj('LocaleService', ['formatDate', 'formatCurrency']);
    localeServiceSpy.formatDate.and.returnValue('Jan 1, 2024');
    localeServiceSpy.formatCurrency.and.returnValue('$100.00');
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        EntryHistoryComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: LotteryService, useValue: lotteryServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: RealtimeService, useValue: realtimeServiceSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntryHistoryComponent);
    component = fixture.componentInstance;
    mockLotteryService = TestBed.inject(LotteryService) as jasmine.SpyObj<LotteryService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRealtimeService = TestBed.inject(RealtimeService) as jasmine.SpyObj<RealtimeService>;
    mockLocaleService = TestBed.inject(LocaleService) as jasmine.SpyObj<LocaleService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load history on init', async () => {
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    await component.ngOnInit();
    
    expect(mockLotteryService.getTicketHistory).toHaveBeenCalled();
    expect(component.historyData()).toEqual(mockHistory);
  });

  it('should apply filters', async () => {
    component.filters.status = 'active';
    component.filters.startDate = '2024-01-01';
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    component.applyFilters();
    
    expect(mockLotteryService.getTicketHistory).toHaveBeenCalled();
  });

  it('should clear filters', async () => {
    component.filters.status = 'active';
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    component.clearFilters();
    
    expect(component.filters.status).toBeUndefined();
    expect(mockLotteryService.getTicketHistory).toHaveBeenCalled();
  });

  it('should navigate to next page', async () => {
    component.historyData.set({ ...mockHistory, hasNext: true });
    component.filters.page = 1;
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    component.nextPage();
    
    expect(component.filters.page).toBe(2);
  });

  it('should navigate to previous page', async () => {
    component.filters.page = 2;
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    component.previousPage();
    
    expect(component.filters.page).toBe(1);
  });

  it('should start polling when SignalR is disconnected', () => {
    mockRealtimeService.getConnectionState.and.returnValue(of(HubConnectionState.Disconnected));
    mockLotteryService.getTicketHistory.and.returnValue(of(mockHistory));
    
    component.ngOnInit();
    
    expect(mockRealtimeService.getConnectionState).toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    
    expect(component).toBeTruthy();
  });
});








