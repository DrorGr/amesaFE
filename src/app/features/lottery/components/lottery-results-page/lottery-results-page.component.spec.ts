import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { LotteryResultsPageComponent } from './lottery-results-page.component';
import { LotteryResultsService, LotteryResult } from '../../services/lottery-results.service';
import { TranslationService } from '@core/services/translation.service';

describe('LotteryResultsPageComponent', () => {
  let component: LotteryResultsPageComponent;
  let fixture: ComponentFixture<LotteryResultsPageComponent>;
  let mockLotteryResultsService: jasmine.SpyObj<LotteryResultsService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const mockResults: LotteryResult[] = [
    {
      id: '1',
      lotteryId: 'lottery-1',
      drawId: 'draw-1',
      winnerTicketNumber: 'TICKET-001',
      winnerUserId: 'user-1',
      prizePosition: 1,
      prizeType: 'House',
      prizeValue: 500000,
      prizeDescription: 'Winner of Test House',
      qrCodeData: 'qr-data-1',
      qrCodeImageUrl: 'qr-image-1',
      isVerified: true,
      isClaimed: true,
      claimedAt: '2024-01-01T00:00:00Z',
      resultDate: '2024-01-01T00:00:00Z',
      houseTitle: 'Test House',
      houseAddress: '123 Test Street',
      winnerName: 'Test User',
      winnerEmail: 'test@example.com'
    },
    {
      id: '2',
      lotteryId: 'lottery-2',
      drawId: 'draw-2',
      winnerTicketNumber: 'TICKET-002',
      winnerUserId: 'user-2',
      prizePosition: 2,
      prizeType: 'Cash',
      prizeValue: 50000,
      prizeDescription: 'Second place cash prize',
      qrCodeData: 'qr-data-2',
      isVerified: true,
      isClaimed: false,
      resultDate: '2024-01-02T00:00:00Z',
      houseTitle: 'Test House 2',
      houseAddress: '456 Test Avenue',
      winnerName: 'Test User 2',
      winnerEmail: 'test2@example.com'
    }
  ];

  beforeEach(async () => {
    const lotteryResultsServiceSpy = jasmine.createSpyObj('LotteryResultsService', [
      'getLotteryResults',
      'getLotteryResult',
      'validateQRCode',
      'claimPrize',
      'createPrizeDelivery',
      'getScratchCards',
      'scratchCard',
      'updateFilter',
      'clearError',
      'getPrizePositionText',
      'getPrizePositionColor',
      'formatCurrency',
      'formatDate'
    ], {
      results: jasmine.createSpy().and.returnValue(mockResults),
      loading: jasmine.createSpy().and.returnValue(false),
      error: jasmine.createSpy().and.returnValue(null),
      winnersByPosition: jasmine.createSpy().and.returnValue({
        first: 1,
        second: 1,
        third: 0
      })
    });

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');

    await TestBed.configureTestingModule({
      imports: [
        LotteryResultsPageComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: LotteryResultsService, useValue: lotteryResultsServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LotteryResultsPageComponent);
    component = fixture.componentInstance;
    mockLotteryResultsService = TestBed.inject(LotteryResultsService) as jasmine.SpyObj<LotteryResultsService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;

    // Setup mock return values
    mockLotteryResultsService.getLotteryResults.and.returnValue(of({
      results: mockResults,
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }));

    mockLotteryResultsService.getPrizePositionText.and.returnValue('1st Place');
    mockLotteryResultsService.getPrizePositionColor.and.returnValue('text-yellow-600 bg-yellow-100');
    mockLotteryResultsService.formatCurrency.and.returnValue('$500,000.00');
    mockLotteryResultsService.formatDate.and.returnValue('January 1, 2024');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load results on init', () => {
    component.ngOnInit();
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  });

  it('should display results when loaded', () => {
    fixture.detectChanges();
    
    const resultCards = fixture.debugElement.queryAll(By.css('[data-testid="result-card"]'));
    expect(resultCards.length).toBe(2);
  });

  it('should display loading state', () => {
    mockLotteryResultsService.loading.and.returnValue(true);
    fixture.detectChanges();
    
    const loadingElement = fixture.debugElement.query(By.css('[data-testid="loading"]'));
    expect(loadingElement).toBeTruthy();
  });

  it('should display error state', () => {
    mockLotteryResultsService.error.and.returnValue('Test error message');
    fixture.detectChanges();
    
    const errorElement = fixture.debugElement.query(By.css('[data-testid="error"]'));
    expect(errorElement).toBeTruthy();
  });

  it('should display empty state when no results', () => {
    mockLotteryResultsService.results.and.returnValue([]);
    fixture.detectChanges();
    
    const emptyElement = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
    expect(emptyElement).toBeTruthy();
  });

  it('should apply filters when filter values change', () => {
    component.filters.fromDate = '2024-01-01';
    component.applyFilters();
    
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fromDate: '2024-01-01',
        pageNumber: 1
      })
    );
  });

  it('should clear filters', () => {
    component.filters.fromDate = '2024-01-01';
    component.filters.prizePosition = 1;
    
    component.clearFilters();
    
    expect(component.filters.fromDate).toBeUndefined();
    expect(component.filters.prizePosition).toBeUndefined();
    expect(component.filters.pageNumber).toBe(1);
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  });

  it('should navigate to next page', () => {
    component.filters.pageNumber = 1;
    component.nextPage();
    
    expect(component.filters.pageNumber).toBe(2);
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  });

  it('should navigate to previous page', () => {
    component.filters.pageNumber = 2;
    component.previousPage();
    
    expect(component.filters.pageNumber).toBe(1);
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  });

  it('should go to specific page', () => {
    component.goToPage(3);
    
    expect(component.filters.pageNumber).toBe(3);
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  });

  it('should show QR code modal', () => {
    const result = mockResults[0];
    component.showQRCode(result, new Event('click'));
    
    expect(component.selectedResult()).toEqual(result);
  });

  it('should close QR code modal', () => {
    component.showQRCode(mockResults[0], new Event('click'));
    component.closeQRModal();
    
    expect(component.selectedResult()).toBeNull();
  });

  it('should download QR code', () => {
    const result = mockResults[0];
    spyOn(document, 'createElement').and.returnValue({
      href: '',
      download: '',
      click: jasmine.createSpy()
    } as any);
    
    // Use the component's internal method to set selected result
    (component as any)._selectedResult.set(result);
    component.downloadQRCode();
    
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('should display winner statistics', () => {
    fixture.detectChanges();
    
    const firstPlaceElement = fixture.debugElement.query(By.css('[data-testid="first-place-count"]'));
    const secondPlaceElement = fixture.debugElement.query(By.css('[data-testid="second-place-count"]'));
    const thirdPlaceElement = fixture.debugElement.query(By.css('[data-testid="third-place-count"]'));
    
    expect(firstPlaceElement.nativeElement.textContent).toContain('1');
    expect(secondPlaceElement.nativeElement.textContent).toContain('1');
    expect(thirdPlaceElement.nativeElement.textContent).toContain('0');
  });

  it('should display prize position badges correctly', () => {
    fixture.detectChanges();
    
    const badges = fixture.debugElement.queryAll(By.css('[data-testid="prize-position-badge"]'));
    expect(badges.length).toBe(2);
    
    expect(badges[0].nativeElement.textContent).toContain('1st Place');
    expect(badges[1].nativeElement.textContent).toContain('2nd Place');
  });

  it('should display claim status correctly', () => {
    fixture.detectChanges();
    
    const claimStatuses = fixture.debugElement.queryAll(By.css('[data-testid="claim-status"]'));
    expect(claimStatuses.length).toBe(2);
    
    expect(claimStatuses[0].nativeElement.textContent).toContain('Claimed');
    expect(claimStatuses[1].nativeElement.textContent).toContain('Unclaimed');
  });

  it('should handle filter debouncing', fakeAsync(() => {
    component.onFilterChange();
    tick(600); // Wait for debounce timeout
    fixture.detectChanges();
    expect(mockLotteryResultsService.getLotteryResults).toHaveBeenCalled();
  }));

  it('should display pagination when multiple pages', () => {
    mockLotteryResultsService.getLotteryResults.and.returnValue(of({
      results: mockResults,
      totalCount: 25,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false
    }));
    
    component.ngOnInit();
    fixture.detectChanges();
    
    const paginationElement = fixture.debugElement.query(By.css('[data-testid="pagination"]'));
    expect(paginationElement).toBeTruthy();
  });

  it('should handle API errors gracefully', () => {
    mockLotteryResultsService.getLotteryResults.and.returnValue(throwError(() => new Error('API Error')));
    
    component.ngOnInit();
    
    expect(component.error()).toContain('Failed to load lottery results');
  });

  it('should translate text using translation service', () => {
    fixture.detectChanges();
    
    expect(mockTranslationService.translate).toHaveBeenCalledWith('lotteryResults.title');
    expect(mockTranslationService.translate).toHaveBeenCalledWith('lotteryResults.subtitle');
  });
});


