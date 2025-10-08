import { TestBed } from '@angular/core/testing';
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

  const mockLanguages = [
    { id: '1', code: 'en', name: 'English', flagUrl: 'en-flag.png', isActive: true },
    { id: '2', code: 'he', name: 'Hebrew', flagUrl: 'he-flag.png', isActive: true }
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
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load translations on init', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockTranslations });
  });

  it('should load languages on init', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockLanguages });
  });

  it('should translate text correctly', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    const translation = service.translate('nav.home');
    expect(translation).toBe('Home');
  });

  it('should return key when translation not found', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    const translation = service.translate('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });

  it('should switch language correctly', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    service.selectLanguage('he');
    expect(service.currentLanguage()).toBe('he');

    const translation = service.translate('nav.home');
    expect(translation).toBe('בית');
  });

  it('should get current language', () => {
    expect(service.currentLanguage()).toBe('en');
  });

  it('should get available languages', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    req.flush({ success: true, data: mockLanguages });

    const languages = service.getAvailableLanguages();
    expect(languages.length).toBe(2);
    expect(languages[0].code).toBe('en');
    expect(languages[1].code).toBe('he');
  });

  it('should get current language info', () => {
    const req = httpMock.expectOne('/api/v1/translations/languages');
    req.flush({ success: true, data: mockLanguages });

    const currentLanguageInfo = service.getCurrentLanguageInfo();
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
    req.flush({ success: true, data: mockTranslations });

    // First call should make HTTP request
    const translation1 = service.translate('nav.home');
    expect(translation1).toBe('Home');

    // Second call should use cache (no additional HTTP request)
    const translation2 = service.translate('nav.home');
    expect(translation2).toBe('Home');
  });

  it('should refresh translations', () => {
    const req1 = httpMock.expectOne('/api/v1/translations');
    req1.flush({ success: true, data: mockTranslations });

    service.refreshTranslations();

    const req2 = httpMock.expectOne('/api/v1/translations');
    req2.flush({ success: true, data: mockTranslations });
  });

  it('should get translations by category', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    const navTranslations = service.getTranslationsByCategory('Navigation');
    expect(navTranslations.length).toBe(2);
    expect(navTranslations[0].key).toBe('nav.home');
    expect(navTranslations[1].key).toBe('nav.about');
  });

  it('should return empty array for non-existent category', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    const translations = service.getTranslationsByCategory('NonExistent');
    expect(translations.length).toBe(0);
  });

  it('should handle empty translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: [] });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should handle null translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: null });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should handle undefined translations response', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: undefined });

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  });

  it('should maintain language selection across service instances', () => {
    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: mockTranslations });

    service.selectLanguage('he');
    expect(service.currentLanguage()).toBe('he');

    // Create new service instance
    const newService = TestBed.inject(TranslationService);
    expect(newService.currentLanguage()).toBe('he');
  });

  it('should handle language switching when translations not loaded', () => {
    service.selectLanguage('he');
    expect(service.currentLanguage()).toBe('he');

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should handle invalid language selection', () => {
    service.selectLanguage('invalid' as Language);
    expect(service.currentLanguage()).toBe('invalid');

    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home'); // Should return key as fallback
  });

  it('should handle translations with special characters', () => {
    const specialTranslations = [
      { id: '1', languageCode: 'en', key: 'special.chars', value: 'Special & "quoted" <tags>', category: 'Test', isActive: true }
    ];

    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: specialTranslations });

    const translation = service.translate('special.chars');
    expect(translation).toBe('Special & "quoted" <tags>');
  });

  it('should handle translations with HTML content', () => {
    const htmlTranslations = [
      { id: '1', languageCode: 'en', key: 'html.content', value: '<p>HTML <strong>content</strong></p>', category: 'Test', isActive: true }
    ];

    const req = httpMock.expectOne('/api/v1/translations');
    req.flush({ success: true, data: htmlTranslations });

    const translation = service.translate('html.content');
    expect(translation).toBe('<p>HTML <strong>content</strong></p>');
  });
});


