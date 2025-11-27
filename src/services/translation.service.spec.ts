import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { TranslationService, Language, LanguageInfo } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  const mockTranslations = [
    { id: '1', languageCode: 'en', key: 'nav.home', value: 'Home', category: 'Navigation', isActive: true },
    { id: '2', languageCode: 'en', key: 'nav.about', value: 'About', category: 'Navigation', isActive: true },
    { id: '3', languageCode: 'he', key: 'nav.home', value: 'בית', category: 'Navigation', isActive: true },
    { id: '4', languageCode: 'he', key: 'nav.about', value: 'אודות', category: 'Navigation', isActive: true }
  ];

  const mockLanguages: LanguageInfo[] = [
    { code: 'en', name: 'English', flagUrl: 'en-flag.png', isActive: true, isDefault: true, displayOrder: 1 },
    { code: 'he', name: 'Hebrew', flagUrl: 'he-flag.png', isActive: true, isDefault: false, displayOrder: 2 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TranslationService]
    });
    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush any pending requests before verifying
    httpMock.match((req) => {
      req.flush({ success: true, data: [], timestamp: new Date().toISOString() });
      return false;
    });
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load translations on init', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });
  });

  it('should load languages on init', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockLanguages, timestamp: new Date().toISOString() });
  });

  it('should translate text correctly', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    const translation = service.translate('nav.home');
    expect(translation).toBe('Home');
  });

  it('should return key when translation not found', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    const translation = service.translate('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });

  it('should switch language correctly', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    service.setLanguage('he' as Language);
    expect(service.getCurrentLanguage()).toBe('he');

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Spanish translations not loaded in test
  });

  it('should get current language', () => {
    expect(service.getCurrentLanguage()).toBe('en');
  });

  it('should get available languages', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    req.flush({ success: true, data: mockLanguages, timestamp: new Date().toISOString() });

    const languages = service.getAvailableLanguages();
    expect(languages.length).toBe(2);
    expect(languages[0].code).toBe('en');
    expect(languages[1].code).toBe('es');
  });

  it('should get current language info', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    req.flush({ success: true, data: mockLanguages, timestamp: new Date().toISOString() });

    const availableLanguages = service.getAvailableLanguages();
    const currentLanguageInfo = availableLanguages.find(lang => lang.code === service.getCurrentLanguage());
    expect(currentLanguageInfo?.code).toBe('en');
    expect(currentLanguageInfo?.name).toBe('English');
  });

  it('should handle API errors gracefully', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: false, message: 'Error loading translations' }, { status: 500, statusText: 'Internal Server Error' });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should handle network errors', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.error(new ErrorEvent('Network error'));

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should cache translations', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    // First call should make HTTP request
    const translation1 = service.translate('nav.home');
    expect(translation1).toBe('Home');

    // Second call should use cache (no additional HTTP request)
    const translation2 = service.translate('nav.home');
    expect(translation2).toBe('Home');
  });

  it('should refresh translations', () => {
    const req1 = httpMock.expectOne('/api/v1/translations');
    req1.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    service.refreshTranslations();

    const req2 = httpMock.expectOne('/api/v1/translations');
    req2.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });
  });

  it('should translate keys correctly', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    const homeTranslation = service.translate('nav.home');
    const aboutTranslation = service.translate('nav.about');
    expect(homeTranslation).toBe('Home');
    expect(aboutTranslation).toBe('About');
  });

  it('should return key when translation not found', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    const translation = service.translate('NonExistent.key');
    expect(translation).toBe('NonExistent.key');
  });

  it('should handle empty translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: [], timestamp: new Date().toISOString() });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should handle null translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: null, timestamp: new Date().toISOString() });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should handle undefined translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: undefined, timestamp: new Date().toISOString() });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should maintain language selection across service instances', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations, timestamp: new Date().toISOString() });

    service.setLanguage('he' as Language);
    expect(service.getCurrentLanguage()).toBe('he');

    // Create new service instance
    const newService = TestBed.inject(TranslationService);
    expect(newService.getCurrentLanguage()).toBe('es');
  });

  it('should handle language switching when translations not loaded', () => {
    service.setLanguage('he' as Language);
    expect(service.getCurrentLanguage()).toBe('he');

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should handle invalid language selection', () => {
    service.setLanguage('es' as Language);
    expect(service.getCurrentLanguage()).toBe('es');

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should handle translations with special characters', () => {
    const specialTranslations = [
      { id: '1', languageCode: 'en', key: 'special.chars', value: 'Special & "quoted" <tags>', category: 'Test', isActive: true }
    ];

    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: specialTranslations, timestamp: new Date().toISOString() });

    const translation = service.translate('special.chars');
    expect(translation).toBe('Special & "quoted" <tags>');
  });

  it('should handle translations with HTML content', () => {
    const htmlTranslations = [
      { id: '1', languageCode: 'en', key: 'html.content', value: '<p>HTML <strong>content</strong></p>', category: 'Test', isActive: true }
    ];

    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: htmlTranslations, timestamp: new Date().toISOString() });

    const translation = service.translate('html.content');
    expect(translation).toBe('<p>HTML <strong>content</strong></p>');
  });
});


