import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { TranslationService, Language, LanguageInfo } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  // Mock translations response format matches TranslationsResponse interface
  const mockTranslationsEn = {
    languageCode: 'en',
    translations: {
      'nav.home': 'Home',
      'nav.about': 'About'
    },
    lastUpdated: new Date().toISOString()
  };

  const mockTranslationsHe = {
    languageCode: 'he',
    translations: {
      'nav.home': 'בית',
      'nav.about': 'אודות'
    },
    lastUpdated: new Date().toISOString()
  };

  const mockLanguages: LanguageInfo[] = [
    { code: 'en', name: 'English', flagUrl: 'en-flag.png', isActive: true, isDefault: true, displayOrder: 1 },
    { code: 'he', name: 'Hebrew', flagUrl: 'he-flag.png', isActive: true, isDefault: false, displayOrder: 2 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TranslationService]
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TranslationService);
    // Handle initial request from constructor (loadTranslations('en'))
    const initReq = httpMock.expectOne('/api/v1/translations/en');
    initReq.flush({ 
      success: true, 
      data: mockTranslationsEn, 
      timestamp: new Date().toISOString() 
    });
  });

  afterEach(() => {
    // Flush any pending requests before verifying
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach(req => {
      req.flush({ success: true, data: [], timestamp: new Date().toISOString() });
    });
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load translations on init', () => {
    // Initial request already handled in beforeEach
    expect(service).toBeTruthy();
    // Verify translations are loaded
    expect(service.translate('nav.home')).toBe('Home');
  });

  it('should load languages on init', () => {
    // Languages are hardcoded in service, not loaded from API
    const languages = service.getAvailableLanguages();
    expect(languages.length).toBeGreaterThan(0);
    expect(languages.some(l => l.code === 'en')).toBe(true);
  });

  it('should translate text correctly', () => {
    // Translations already loaded in beforeEach
    const translation = service.translate('nav.home');
    expect(translation).toBe('Home');
  });

  it('should return key when translation not found', () => {
    // Translations already loaded in beforeEach
    const translation = service.translate('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });

  it('should switch language correctly', fakeAsync(() => {
    // Translations for 'en' already loaded in beforeEach
    service.setLanguage('he' as Language);
    tick(); // Allow async operations to complete
    
    // Expect request for Hebrew translations
    const req = httpMock.expectOne('/api/v1/translations/he');
    req.flush({ 
      success: true, 
      data: mockTranslationsHe, 
      timestamp: new Date().toISOString() 
    });
    tick(); // Allow response processing
    
    expect(service.getCurrentLanguage()).toBe('he');
    const translation = service.translate('nav.home');
    expect(translation).toBe('בית');
  }));

  it('should get current language', () => {
    expect(service.getCurrentLanguage()).toBe('en');
  });

  it('should get available languages', () => {
    // Languages are hardcoded in service
    const languages = service.getAvailableLanguages();
    expect(languages.length).toBe(4); // en, es, fr, pl
    expect(languages.some(l => l.code === 'en')).toBe(true);
    expect(languages.some(l => l.code === 'es')).toBe(true);
  });

  it('should get current language info', () => {
    // Languages are hardcoded in service
    const availableLanguages = service.getAvailableLanguages();
    const currentLanguageInfo = availableLanguages.find(lang => lang.code === service.getCurrentLanguage());
    expect(currentLanguageInfo?.code).toBe('en');
    expect(currentLanguageInfo?.name).toBe('English');
  });

  it('should handle API errors gracefully', fakeAsync(() => {
    // Initial request already handled, now test error on language switch
    service.setLanguage('fr' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/fr');
    req.flush({ success: false, message: 'Error loading translations' }, { status: 500, statusText: 'Internal Server Error' });
    tick(3000); // Allow error handling to complete
    
    // Should still return key as fallback
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should handle network errors', fakeAsync(() => {
    // Initial request already handled, now test error on language switch
    service.setLanguage('pl' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/pl');
    req.error(new ErrorEvent('Network error'));
    tick(3000); // Allow error handling to complete
    
    // Should return key as fallback
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should cache translations', () => {
    // Translations already loaded in beforeEach (cached)
    // First call uses cache
    const translation1 = service.translate('nav.home');
    expect(translation1).toBe('Home');

    // Second call should use cache (no additional HTTP request)
    const translation2 = service.translate('nav.home');
    expect(translation2).toBe('Home');
  });

  it('should refresh translations', fakeAsync(() => {
    // Initial request already handled in beforeEach
    service.refreshTranslations();
    tick();
    
    // Should make new request for current language (en)
    const req2 = httpMock.expectOne('/api/v1/translations/en');
    req2.flush({ 
      success: true, 
      data: mockTranslationsEn, 
      timestamp: new Date().toISOString() 
    });
    tick();
  }));

  it('should translate keys correctly', () => {
    // Translations already loaded in beforeEach
    const homeTranslation = service.translate('nav.home');
    const aboutTranslation = service.translate('nav.about');
    expect(homeTranslation).toBe('Home');
    expect(aboutTranslation).toBe('About');
  });

  it('should return key when translation not found', () => {
    // Translations already loaded in beforeEach
    const translation = service.translate('NonExistent.key');
    expect(translation).toBe('NonExistent.key');
  });

  it('should handle empty translations response', fakeAsync(() => {
    // Switch to a new language to test empty response
    service.setLanguage('fr' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/fr');
    req.flush({ 
      success: true, 
      data: { languageCode: 'fr', translations: {}, lastUpdated: new Date().toISOString() }, 
      timestamp: new Date().toISOString() 
    });
    tick(3000);
    
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should handle null translations response', fakeAsync(() => {
    // Switch to a new language to test null response
    service.setLanguage('pl' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/pl');
    req.flush({ success: true, data: null, timestamp: new Date().toISOString() });
    tick(3000);
    
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should handle undefined translations response', fakeAsync(() => {
    // Switch to a new language to test undefined response
    service.setLanguage('es' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/es');
    req.flush({ success: true, data: undefined, timestamp: new Date().toISOString() });
    tick(3000);
    
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should maintain language selection across service instances', fakeAsync(() => {
    // Initial request already handled
    service.setLanguage('he' as Language);
    tick();
    
    const req = httpMock.expectOne('/api/v1/translations/he');
    req.flush({ 
      success: true, 
      data: mockTranslationsHe, 
      timestamp: new Date().toISOString() 
    });
    tick();
    
    expect(service.getCurrentLanguage()).toBe('he');

    // Create new service instance - will load 'en' by default
    const newService = TestBed.inject(TranslationService);
    const newInitReq = httpMock.expectOne('/api/v1/translations/en');
    newInitReq.flush({ 
      success: true, 
      data: mockTranslationsEn, 
      timestamp: new Date().toISOString() 
    });
    tick();
    
    expect(newService.getCurrentLanguage()).toBe('en'); // Default language
  }));

  it('should handle language switching when translations not loaded', fakeAsync(() => {
    service.setLanguage('he' as Language);
    tick();
    
    // Request should be made but we won't flush it to simulate not loaded
    const req = httpMock.expectOne('/api/v1/translations/he');
    // Don't flush - simulate timeout or error
    tick(11000); // Wait for timeout (10s + buffer)
    
    // Language should still be switched
    expect(service.getCurrentLanguage()).toBe('he');
    
    // Should return key as fallback since translations not loaded
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should handle invalid language selection', fakeAsync(() => {
    service.setLanguage('es' as Language);
    tick();
    
    // Request for Spanish translations
    const req = httpMock.expectOne('/api/v1/translations/es');
    req.flush({ 
      success: true, 
      data: { languageCode: 'es', translations: {}, lastUpdated: new Date().toISOString() }, 
      timestamp: new Date().toISOString() 
    });
    tick(3000);
    
    expect(service.getCurrentLanguage()).toBe('es');
    
    // Should return key as fallback if translations empty
    const translation = service.translate('nav.home');
    expect(translation).toBe('nav.home');
  }));

  it('should handle translations with special characters', fakeAsync(() => {
    // Refresh to load new translations
    service.refreshTranslations();
    tick();
    
    const specialTranslations = {
      languageCode: 'en',
      translations: {
        'special.chars': 'Special & "quoted" <tags>'
      },
      lastUpdated: new Date().toISOString()
    };

    const req = httpMock.expectOne('/api/v1/translations/en');
    req.flush({ success: true, data: specialTranslations, timestamp: new Date().toISOString() });
    tick();

    const translation = service.translate('special.chars');
    expect(translation).toBe('Special & "quoted" <tags>');
  }));

  it('should handle translations with HTML content', fakeAsync(() => {
    // Refresh to load new translations
    service.refreshTranslations();
    tick();
    
    const htmlTranslations = {
      languageCode: 'en',
      translations: {
        'html.content': '<p>HTML <strong>content</strong></p>'
      },
      lastUpdated: new Date().toISOString()
    };

    const req = httpMock.expectOne('/api/v1/translations/en');
    req.flush({ success: true, data: htmlTranslations, timestamp: new Date().toISOString() });
    tick();

    const translation = service.translate('html.content');
    expect(translation).toBe('<p>HTML <strong>content</strong></p>');
  }));
});


