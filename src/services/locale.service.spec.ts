import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LocaleService } from './locale.service';
import { TranslationService } from './translation.service';
import { UserPreferencesService } from './user-preferences.service';
import { LoggingService } from './logging.service';

describe('LocaleService', () => {
  let service: LocaleService;
  let translationService: jasmine.SpyObj<TranslationService>;
  let userPreferencesService: jasmine.SpyObj<UserPreferencesService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', [], {
      getCurrentLanguage: jasmine.createSpy().and.returnValue(of('en'))
    });

    const userPreferencesServiceSpy = jasmine.createSpyObj('UserPreferencesService', [], {
      localization: signal({
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: 'US'
      })
    });

    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        LocaleService,
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: UserPreferencesService, useValue: userPreferencesServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy }
      ]
    });

    service = TestBed.inject(LocaleService);
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    userPreferencesService = TestBed.inject(UserPreferencesService) as jasmine.SpyObj<UserPreferencesService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get locale from language', () => {
    const locale = service.getLocaleFromLanguage('en');
    expect(locale).toBe('en-US');
    
    const localeEs = service.getLocaleFromLanguage('es');
    expect(localeEs).toBe('es-ES');
  });

  it('should format date', () => {
    const date = new Date('2024-01-15');
    const formatted = service.formatDate(date, 'short');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format number', () => {
    const formatted = service.formatNumber(1234.56);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format currency', () => {
    const formatted = service.formatCurrency(1234.56, 'USD');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
    expect(formatted).toContain('1');
  });

  it('should format time', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = service.formatTime(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should get currency code', () => {
    const currency = service.getCurrencyCode();
    expect(currency).toBeTruthy();
    expect(typeof currency).toBe('string');
  });

  it('should get locale summary', () => {
    const summary = service.getLocaleSummary();
    expect(summary).toBeTruthy();
    expect(summary['currentLocale']).toBeTruthy();
    expect(summary['currency']).toBeTruthy();
  });
});


