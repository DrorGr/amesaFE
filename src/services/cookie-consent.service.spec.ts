import { TestBed } from '@angular/core/testing';
import { CookieConsentService } from './cookie-consent.service';
import { LoggingService } from './logging.service';
import { UserPreferencesService } from './user-preferences.service';
import { CookieConsent, DEFAULT_COOKIE_CONSENT } from '../interfaces/cookie-consent.interface';

describe('CookieConsentService', () => {
  let service: CookieConsentService;
  let userPreferencesService: jasmine.SpyObj<UserPreferencesService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Create spies
    userPreferencesService = jasmine.createSpyObj('UserPreferencesService', ['getPreferences', 'updatePrivacy']);
    loggingService = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);

    // Setup user preferences mock
    userPreferencesService.getPreferences.and.returnValue({
      privacy: {
        cookieConsent: false,
        analyticsTracking: false,
        performanceTracking: false,
        marketingTracking: false,
        personalizedAds: false,
        dataSharing: false,
        locationTracking: false,
        historyRetention: 90,
        autoDeleteOldData: false,
        profileVisibility: 'private' as const,
        showActivity: false,
        showWinnings: false
      },
      version: '1.0.0',
      lastUpdated: new Date(),
      syncEnabled: true,
      appearance: {} as any,
      localization: {} as any,
      accessibility: {} as any,
      notifications: {} as any,
      interaction: {} as any,
      lottery: {} as any,
      performance: {} as any
    });

    TestBed.configureTestingModule({
      providers: [
        CookieConsentService,
        { provide: UserPreferencesService, useValue: userPreferencesService },
        { provide: LoggingService, useValue: loggingService }
      ]
    });

    service = TestBed.inject(CookieConsentService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for hasConsent() initially', () => {
    expect(service.hasConsent()).toBe(false);
  });

  it('should return null for getConsent() initially', () => {
    expect(service.getConsent()).toBeNull();
  });

  it('should return true for shouldShowBanner() initially', () => {
    expect(service.shouldShowBanner()).toBe(true);
  });

  it('should save consent to localStorage', () => {
    service.setConsent({
      analytics: true,
      marketing: false,
      functional: true
    });

    const stored = localStorage.getItem('amesa_cookie_consent');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(false);
    expect(parsed.functional).toBe(true);
    expect(parsed.essential).toBe(true); // Always true
  });

  it('should retrieve consent from localStorage', () => {
    const consent: CookieConsent = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
      marketing: false,
      functional: true
    };
    localStorage.setItem('amesa_cookie_consent', JSON.stringify(consent));

    // Create new service instance to test loading
    const newService = new CookieConsentService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CookieConsentService,
        { provide: UserPreferencesService, useValue: userPreferencesService },
        { provide: LoggingService, useValue: loggingService }
      ]
    });
    
    const loadedService = TestBed.inject(CookieConsentService);
    const retrieved = loadedService.getConsent();
    
    expect(retrieved).toBeTruthy();
    expect(retrieved?.analytics).toBe(true);
    expect(retrieved?.marketing).toBe(false);
    expect(retrieved?.functional).toBe(true);
  });

  it('should enable all categories when acceptAll() is called', () => {
    service.acceptAll();

    const consent = service.getConsent();
    expect(consent).toBeTruthy();
    expect(consent?.analytics).toBe(true);
    expect(consent?.marketing).toBe(true);
    expect(consent?.functional).toBe(true);
    expect(consent?.essential).toBe(true);
    expect(service.hasConsent()).toBe(true);
    expect(service.shouldShowBanner()).toBe(false);
  });

  it('should only enable essential cookies when rejectAll() is called', () => {
    service.rejectAll();

    const consent = service.getConsent();
    expect(consent).toBeTruthy();
    expect(consent?.essential).toBe(true);
    expect(consent?.analytics).toBe(false);
    expect(consent?.marketing).toBe(false);
    expect(consent?.functional).toBe(false);
    expect(service.hasConsent()).toBe(true);
    expect(service.shouldShowBanner()).toBe(false);
  });

  it('should clear non-essential consents when revokeConsent() is called', () => {
    service.acceptAll();
    service.revokeConsent();

    const consent = service.getConsent();
    expect(consent).toBeTruthy();
    expect(consent?.essential).toBe(true);
    expect(consent?.analytics).toBe(false);
    expect(consent?.marketing).toBe(false);
    expect(consent?.functional).toBe(false);
  });

  it('should return false for shouldShowBanner() after consent is given', () => {
    service.acceptAll();
    expect(service.shouldShowBanner()).toBe(false);
  });

  it('should sync with UserPreferencesService when consent is set', () => {
    service.acceptAll();
    expect(userPreferencesService.updatePrivacy).toHaveBeenCalledWith(
      jasmine.objectContaining({ cookieConsent: true })
    );
  });

  it('should sync with UserPreferencesService when consent is revoked', () => {
    service.acceptAll();
    userPreferencesService.updatePrivacy.calls.reset();
    
    service.rejectAll();
    expect(userPreferencesService.updatePrivacy).toHaveBeenCalledWith(
      jasmine.objectContaining({ cookieConsent: false })
    );
  });

  it('should ensure essential cookies are always true', () => {
    service.setConsent({
      analytics: false,
      marketing: false,
      functional: false,
      essential: false as any // Try to set to false
    });

    const consent = service.getConsent();
    expect(consent?.essential).toBe(true); // Should always be true
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('amesa_cookie_consent', 'invalid json');
    
    const newService = new CookieConsentService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CookieConsentService,
        { provide: UserPreferencesService, useValue: userPreferencesService },
        { provide: LoggingService, useValue: loggingService }
      ]
    });
    
    const loadedService = TestBed.inject(CookieConsentService);
    expect(loadedService.getConsent()).toBeNull();
  });

  it('should clear consent when clearConsent() is called', () => {
    service.acceptAll();
    expect(service.hasConsent()).toBe(true);

    service.clearConsent();
    expect(service.hasConsent()).toBe(false);
    expect(localStorage.getItem('amesa_cookie_consent')).toBeNull();
  });
});

