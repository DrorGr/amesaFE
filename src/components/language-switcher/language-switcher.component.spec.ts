import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService, Language, LanguageInfo } from '../../services/translation.service';
import { MobileDetectionService } from '../../services/mobile-detection.service';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockMobileDetectionService: jasmine.SpyObj<MobileDetectionService>;

  const mockLanguages: LanguageInfo[] = [
    { code: 'en', name: 'English', flagUrl: 'en-flag.png', isActive: true, isDefault: true, displayOrder: 1 },
    { code: 'es', name: 'Spanish', flagUrl: 'es-flag.png', isActive: true, isDefault: false, displayOrder: 2 },
    { code: 'fr', name: 'French', flagUrl: 'fr-flag.png', isActive: true, isDefault: false, displayOrder: 3 }
  ];

  beforeEach(async () => {
    const currentLanguageSignal = signal<Language>('en');
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', [
      'translate',
      'setLanguage',
      'getAvailableLanguages'
    ], {
      getCurrentLanguage: currentLanguageSignal
    });

    const mobileDetectionServiceSpy = jasmine.createSpyObj('MobileDetectionService', [], {
      isMobile: signal(false)
    });

    await TestBed.configureTestingModule({
      imports: [
        LanguageSwitcherComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: MobileDetectionService, useValue: mobileDetectionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockMobileDetectionService = TestBed.inject(MobileDetectionService) as jasmine.SpyObj<MobileDetectionService>;

    // Setup mock return values
    mockTranslationService.getAvailableLanguages.and.returnValue(mockLanguages);
    mockTranslationService.translate.and.returnValue('Translated text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with dropdown closed', () => {
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should toggle dropdown when toggleDropdown is called', () => {
    expect(component.isDropdownOpen).toBe(false);
    
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(true);
    
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should call setLanguage when selectLanguage is called', () => {
    component.selectLanguage('es');
    
    expect(mockTranslationService.setLanguage).toHaveBeenCalledWith('es' as Language);
  });

  it('should close dropdown after language selection', () => {
    component.isDropdownOpen = true;
    component.selectLanguage('es');
    
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should have available languages', () => {
    expect(component.availableLanguages.length).toBeGreaterThan(0);
  });

  it('should have current language signal', () => {
    expect(component.currentLanguage).toBeDefined();
  });

  it('should get current language code', () => {
    // Mock current language signal returns 'en'
    expect(component.getCurrentLanguageCode()).toBe('EN');
  });

  it('should get current language flag', () => {
    const flag = component.getCurrentLanguageFlag();
    expect(flag).toBeDefined();
    // Should return flag URL from mock languages
    expect(flag).toBe('en-flag.png');
  });
});
