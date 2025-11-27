import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { LotteryResultDetailComponent } from './lottery-result-detail.component';
import { LotteryResultsService, LotteryResult } from '../../services/lottery-results.service';
import { TranslationService } from '../../services/translation.service';

describe('LotteryResultDetailComponent', () => {
  let component: LotteryResultDetailComponent;
  let fixture: ComponentFixture<LotteryResultDetailComponent>;
  let mockLotteryResultsService: jasmine.SpyObj<LotteryResultsService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockActivatedRoute: any;

  const mockResult: LotteryResult = {
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
  };

  beforeEach(async () => {
    const lotteryResultsServiceSpy = jasmine.createSpyObj('LotteryResultsService', [
      'getLotteryResult',
      'validateQRCode',
      'claimPrize',
      'createPrizeDelivery',
      'getScratchCards',
      'scratchCard',
      'getPrizePositionText',
      'getPrizePositionColor',
      'formatCurrency',
      'formatDate'
    ], {
      loading: jasmine.createSpy().and.returnValue(false),
      error: jasmine.createSpy().and.returnValue(null)
    });

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');

    mockActivatedRoute = {
      params: of({ id: '1' })
    };

    await TestBed.configureTestingModule({
      imports: [
        LotteryResultDetailComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: LotteryResultsService, useValue: lotteryResultsServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LotteryResultDetailComponent);
    component = fixture.componentInstance;
    mockLotteryResultsService = TestBed.inject(LotteryResultsService) as jasmine.SpyObj<LotteryResultsService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;

    // Setup mock return values
    mockLotteryResultsService.getLotteryResult.and.returnValue(of(mockResult));
    mockLotteryResultsService.getPrizePositionText.and.returnValue('1st Place');
    mockLotteryResultsService.getPrizePositionColor.and.returnValue('text-yellow-600 bg-yellow-100');
    mockLotteryResultsService.formatCurrency.and.returnValue('$500,000.00');
    mockLotteryResultsService.formatDate.and.returnValue('January 1, 2024');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load result on init', () => {
    component.ngOnInit();
    expect(mockLotteryResultsService.getLotteryResult).toHaveBeenCalledWith('1');
  });

  it('should display result details when loaded', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    expect(component.result()).toEqual(mockResult);
    expect(component.loading()).toBeFalse();
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

  it('should toggle QR code reveal', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    
    expect(component.isSpinning()).toBeFalse();
    expect(component.isQRRevealed()).toBeFalse();
    
    component.toggleQRCode();
    
    expect(component.isSpinning()).toBeTrue();
    
    // Wait for animation to complete (2 seconds)
    tick(2000);
    
    expect(component.isSpinning()).toBeFalse();
    expect(component.isQRRevealed()).toBeTrue();
  }));

  it('should hide QR code when toggled again', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    
    // First reveal
    component.toggleQRCode();
    tick(2000);
    
    expect(component.isQRRevealed()).toBeTrue();
    
    // Toggle again to hide
    component.toggleQRCode();
    expect(component.isQRRevealed()).toBeFalse();
    expect(component.isSpinning()).toBeFalse();
  }));

  it('should display QR code after toggle', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    
    component.toggleQRCode();
    tick(2000);
    fixture.detectChanges();
    
    const qrCodeElement = fixture.debugElement.query(By.css('[data-testid="qr-code"]'));
    expect(qrCodeElement).toBeTruthy();
  }));

  it('should download QR code', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    spyOn(document, 'createElement').and.returnValue({
      href: '',
      download: '',
      click: jasmine.createSpy()
    } as any);
    
    component.downloadQRCode();
    
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('should display result information correctly', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const houseTitleElement = fixture.debugElement.query(By.css('[data-testid="house-title"]'));
    const houseAddressElement = fixture.debugElement.query(By.css('[data-testid="house-address"]'));
    const drawDateElement = fixture.debugElement.query(By.css('[data-testid="draw-date"]'));
    const winnerNameElement = fixture.debugElement.query(By.css('[data-testid="winner-name"]'));
    const winnerEmailElement = fixture.debugElement.query(By.css('[data-testid="winner-email"]'));
    const ticketNumberElement = fixture.debugElement.query(By.css('[data-testid="ticket-number"]'));
    const prizeValueElement = fixture.debugElement.query(By.css('[data-testid="prize-value"]'));
    const prizeDescriptionElement = fixture.debugElement.query(By.css('[data-testid="prize-description"]'));
    
    expect(houseTitleElement.nativeElement.textContent).toContain('Test House');
    expect(houseAddressElement.nativeElement.textContent).toContain('123 Test Street');
    expect(drawDateElement.nativeElement.textContent).toContain('January 1, 2024');
    expect(winnerNameElement.nativeElement.textContent).toContain('Test User');
    expect(winnerEmailElement.nativeElement.textContent).toContain('test@example.com');
    expect(ticketNumberElement.nativeElement.textContent).toContain('TICKET-001');
    expect(prizeValueElement.nativeElement.textContent).toContain('$500,000.00');
    expect(prizeDescriptionElement.nativeElement.textContent).toContain('Winner of Test House');
  });

  it('should display claim status correctly', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const claimStatusElement = fixture.debugElement.query(By.css('[data-testid="claim-status"]'));
    const claimedDateElement = fixture.debugElement.query(By.css('[data-testid="claimed-date"]'));
    
    expect(claimStatusElement.nativeElement.textContent).toContain('Claimed');
    expect(claimedDateElement.nativeElement.textContent).toContain('January 1, 2024');
  });

  it('should display unclaimed status correctly', () => {
    const unclaimedResult = { ...mockResult, isClaimed: false, claimedAt: undefined };
    mockLotteryResultsService.getLotteryResult.and.returnValue(of(unclaimedResult));
    
    component.ngOnInit();
    fixture.detectChanges();
    
    const claimStatusElement = fixture.debugElement.query(By.css('[data-testid="claim-status"]'));
    const claimedDateElement = fixture.debugElement.query(By.css('[data-testid="claimed-date"]'));
    
    expect(claimStatusElement.nativeElement.textContent).toContain('Unclaimed');
    expect(claimedDateElement).toBeFalsy();
  });

  it('should display prize position badge correctly', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const badgeElement = fixture.debugElement.query(By.css('[data-testid="prize-position-badge"]'));
    expect(badgeElement.nativeElement.textContent).toContain('1st Place');
  });

  it('should handle API errors gracefully', () => {
    mockLotteryResultsService.getLotteryResult.and.returnValue(throwError(() => new Error('API Error')));
    
    component.ngOnInit();
    
    expect(component.error()).toContain('Failed to load lottery result');
  });

  it('should translate text using translation service', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    expect(mockTranslationService.translate).toHaveBeenCalledWith('lotteryResults.resultDetails');
    expect(mockTranslationService.translate).toHaveBeenCalledWith('lotteryResults.resultDetailsSubtitle');
  });

  it('should display verification status', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const verificationElement = fixture.debugElement.query(By.css('[data-testid="verification-status"]'));
    expect(verificationElement.nativeElement.textContent).toContain('Verified');
  });

  it('should display unverified status', () => {
    const unverifiedResult = { ...mockResult, isVerified: false };
    mockLotteryResultsService.getLotteryResult.and.returnValue(of(unverifiedResult));
    
    component.ngOnInit();
    fixture.detectChanges();
    
    const verificationElement = fixture.debugElement.query(By.css('[data-testid="verification-status"]'));
    expect(verificationElement.nativeElement.textContent).toContain('Unverified');
  });

  it('should handle missing result ID', () => {
    mockActivatedRoute.params = of({});
    
    component.ngOnInit();
    
    expect(component.error()).toContain('Lottery Result ID is missing');
  });

  it('should display house image when available', () => {
    const resultWithImage = { ...mockResult, houseImageUrl: 'house-image.jpg' };
    mockLotteryResultsService.getLotteryResult.and.returnValue(of(resultWithImage));
    
    component.ngOnInit();
    fixture.detectChanges();
    
    const imageElement = fixture.debugElement.query(By.css('[data-testid="house-image"]'));
    expect(imageElement.nativeElement.src).toContain('house-image.jpg');
  });

  it('should display placeholder image when house image not available', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const imageElement = fixture.debugElement.query(By.css('[data-testid="house-image"]'));
    expect(imageElement.nativeElement.src).toContain('placeholder');
  });

  it('should display spin button when QR code not revealed', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const spinButton = fixture.debugElement.query(By.css('[data-testid="spin-button"]'));
    expect(spinButton).toBeTruthy();
  });

  it('should hide spin button when QR code is revealed', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    
    // Simulate QR code revealed by calling toggleQRCode and waiting
    component.toggleQRCode();
    tick(2000);
    fixture.detectChanges();
    
    const spinButton = fixture.debugElement.query(By.css('[data-testid="spin-button"]'));
    expect(spinButton).toBeFalsy();
  }));
});


