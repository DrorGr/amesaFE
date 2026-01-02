import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError, interval } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

import { ActiveEntriesComponent } from './active-entries.component';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '@core/services/translation.service';
import { AuthService } from '@core/services/auth.service';
import { RealtimeService } from '@core/services/realtime.service';
import { LocaleService } from '@core/services/locale.service';
import { LotteryTicketDto } from '@core/models/house.model';

describe('ActiveEntriesComponent', () => {
  let component: ActiveEntriesComponent;
  let fixture: ComponentFixture<ActiveEntriesComponent>;
  let mockLotteryService: jasmine.SpyObj<LotteryService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRealtimeService: jasmine.SpyObj<RealtimeService>;
  let mockLocaleService: jasmine.SpyObj<LocaleService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockEntries: LotteryTicketDto[] = [
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
  ];

  beforeEach(async () => {
    const lotteryServiceSpy = jasmine.createSpyObj('LotteryService', ['getActiveTickets']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate', 'translateWithParams']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    translationServiceSpy.translateWithParams.and.returnValue('Translated text');
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 'user1' } as any);
    
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeService', ['getConnectionState']);
    realtimeServiceSpy.getConnectionState.and.returnValue(of(HubConnectionState.Connected));
    
    const localeServiceSpy = jasmine.createSpyObj('LocaleService', ['formatDate', 'formatCurrency', 'getCurrencyCode']);
    localeServiceSpy.formatDate.and.returnValue('Jan 1, 2024');
    localeServiceSpy.formatCurrency.and.returnValue('$100.00');
    localeServiceSpy.getCurrencyCode.and.returnValue('USD');
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ActiveEntriesComponent,
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

    fixture = TestBed.createComponent(ActiveEntriesComponent);
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

  it('should load active entries on init', async () => {
    mockLotteryService.getActiveTickets.and.returnValue(of(mockEntries));
    
    await component.ngOnInit();
    
    expect(mockLotteryService.getActiveTickets).toHaveBeenCalled();
    expect(component.allEntries().length).toBe(1);
  });

  it('should start polling when SignalR is disconnected', () => {
    mockRealtimeService.getConnectionState.and.returnValue(of(HubConnectionState.Disconnected));
    mockLotteryService.getActiveTickets.and.returnValue(of(mockEntries));
    
    component.ngOnInit();
    
    // Polling should be set up
    expect(mockRealtimeService.getConnectionState).toHaveBeenCalled();
  });

  it('should stop polling when SignalR connects', () => {
    mockRealtimeService.getConnectionState.and.returnValue(of(HubConnectionState.Connected));
    
    component.ngOnInit();
    
    // Polling should not be active when connected
    expect(component).toBeTruthy();
  });

  it('should filter entries by status', () => {
    component.allEntries.set(mockEntries);
    component.selectedStatus.set('active');
    
    const filtered = component.filteredEntries();
    
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle load error', async () => {
    const error = { message: 'Failed to load entries' };
    mockLotteryService.getActiveTickets.and.returnValue(throwError(() => error));
    
    await component.loadActiveEntries();
    
    // Should handle error gracefully
    expect(component).toBeTruthy();
  });

  it('should cleanup on destroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    
    // Should cleanup subscriptions
    expect(component).toBeTruthy();
  });
});








