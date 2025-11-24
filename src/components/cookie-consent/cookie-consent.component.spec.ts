import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieConsentComponent } from './cookie-consent.component';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { TranslationService } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';
import { signal } from '@angular/core';
import { CookieConsent } from '../../interfaces/cookie-consent.interface';
import { Subject } from 'rxjs';

describe('CookieConsentComponent', () => {
  let component: CookieConsentComponent;
  let fixture: ComponentFixture<CookieConsentComponent>;
  let cookieConsentService: jasmine.SpyObj<CookieConsentService>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let mobileDetectionService: jasmine.SpyObj<MobileDetectionService>;

  beforeEach(async () => {
    // Create spies
    const openPreferencesSubject = new Subject<void>();
    
    cookieConsentService = jasmine.createSpyObj('CookieConsentService', [
      'shouldShowBanner',
      'getConsent',
      'acceptAll',
      'rejectAll',
      'setConsent',
      'openPreferences'
    ]);
    
    // Set up properties that can't be spied
    Object.defineProperty(cookieConsentService, 'consent', {
      get: () => signal<CookieConsent | null>(null),
      configurable: true
    });
    
    Object.defineProperty(cookieConsentService, 'openPreferences$', {
      get: () => openPreferencesSubject.asObservable(),
      configurable: true
    });

    translationService = jasmine.createSpyObj('TranslationService', ['translate']);
    translationService.translate.and.returnValue('Test Translation');

    mobileDetectionService = jasmine.createSpyObj('MobileDetectionService', ['isMobile']);
    mobileDetectionService.isMobile = signal(false);

    // Setup default return values
    cookieConsentService.shouldShowBanner.and.returnValue(true);
    cookieConsentService.getConsent.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        { provide: CookieConsentService, useValue: cookieConsentService },
        { provide: TranslationService, useValue: translationService },
        { provide: MobileDetectionService, useValue: mobileDetectionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show banner when shouldShowBanner() returns true', () => {
    cookieConsentService.shouldShowBanner.and.returnValue(true);
    fixture.detectChanges();
    
    expect(component.isVisible()).toBe(true);
  });

  it('should not show banner when consent exists', () => {
    const consent: CookieConsent = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
      marketing: false,
      functional: true
    };
    
    cookieConsentService.shouldShowBanner.and.returnValue(false);
    cookieConsentService.getConsent.and.returnValue(consent);
    Object.defineProperty(cookieConsentService, 'consent', {
      get: () => signal(consent),
      configurable: true
    });
    
    fixture.detectChanges();
    
    expect(component.isVisible()).toBe(false);
  });

  it('should call acceptAll() when Accept All button is clicked', () => {
    cookieConsentService.shouldShowBanner.and.returnValue(true);
    fixture.detectChanges();
    
    const acceptButton = fixture.nativeElement.querySelector('button:contains("Accept All")');
    if (acceptButton) {
      acceptButton.click();
      expect(cookieConsentService.acceptAll).toHaveBeenCalled();
    }
  });

  it('should call rejectAll() when Reject All button is clicked', () => {
    cookieConsentService.shouldShowBanner.and.returnValue(true);
    fixture.detectChanges();
    
    const rejectButton = fixture.nativeElement.querySelector('button:contains("Reject All")');
    if (rejectButton) {
      rejectButton.click();
      expect(cookieConsentService.rejectAll).toHaveBeenCalled();
    }
  });

  it('should open preferences modal when Customize is clicked', () => {
    cookieConsentService.shouldShowBanner.and.returnValue(true);
    fixture.detectChanges();
    
    component.customize();
    expect(component.isPreferencesOpen()).toBe(true);
  });

  it('should render preferences modal with toggles', () => {
    component.openPreferences();
    fixture.detectChanges();
    
    expect(component.isPreferencesOpen()).toBe(true);
    // Check for toggle switches
    const toggles = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('should render mobile view when isMobile() returns true', () => {
    mobileDetectionService.isMobile = signal(true);
    fixture.detectChanges();
    
    expect(component.isMobile()).toBe(true);
  });

  it('should render desktop view when isMobile() returns false', () => {
    mobileDetectionService.isMobile = signal(false);
    fixture.detectChanges();
    
    expect(component.isMobile()).toBe(false);
  });

  it('should translate text using TranslationService', () => {
    component.translate('cookieConsent.banner.title');
    expect(translationService.translate).toHaveBeenCalledWith('cookieConsent.banner.title');
  });

  it('should have ARIA labels on modal', () => {
    component.openPreferences();
    fixture.detectChanges();
    
    const modal = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(modal).toBeTruthy();
    expect(modal.getAttribute('aria-modal')).toBe('true');
  });

  it('should close preferences modal when backdrop is clicked', () => {
    component.openPreferences();
    fixture.detectChanges();
    
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop, [class*="inset-0"]');
    if (backdrop) {
      component.onBackdropClick({ target: backdrop, currentTarget: backdrop } as any);
      expect(component.isPreferencesOpen()).toBe(false);
    }
  });

  it('should not close modal when clicking modal content', () => {
    component.openPreferences();
    fixture.detectChanges();
    
    const content = fixture.nativeElement.querySelector('.modal-content, [class*="rounded"]');
    if (content) {
      component.onBackdropClick({ target: content, currentTarget: content.parentElement } as any);
      expect(component.isPreferencesOpen()).toBe(true);
    }
  });

  it('should save preferences when Save button is clicked', () => {
    component.openPreferences();
    component.preferences = {
      analytics: true,
      marketing: false,
      functional: true
    };
    fixture.detectChanges();
    
    component.savePreferences();
    expect(cookieConsentService.setConsent).toHaveBeenCalledWith({
      analytics: true,
      marketing: false,
      functional: true
    });
    expect(component.isPreferencesOpen()).toBe(false);
  });

  it('should load current preferences when opening preferences modal', () => {
    const consent: CookieConsent = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
      marketing: false,
      functional: true
    };
    
    cookieConsentService.getConsent.and.returnValue(consent);
    component.openPreferences();
    
    expect(component.preferences.analytics).toBe(true);
    expect(component.preferences.marketing).toBe(false);
    expect(component.preferences.functional).toBe(true);
  });
});

