import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService, Language, LanguageInfo } from '../../services/translation.service';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const mockLanguages: LanguageInfo[] = [
    { id: '1', code: 'en', name: 'English', flagUrl: 'en-flag.png', isActive: true },
    { id: '2', code: 'he', name: 'Hebrew', flagUrl: 'he-flag.png', isActive: true },
    { id: '3', code: 'ar', name: 'Arabic', flagUrl: 'ar-flag.png', isActive: true }
  ];

  beforeEach(async () => {
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', [
      'translate',
      'selectLanguage',
      'getAvailableLanguages',
      'getCurrentLanguageInfo'
    ], {
      currentLanguage: jasmine.createSpy().and.returnValue('en')
    });

    await TestBed.configureTestingModule({
      imports: [
        LanguageSwitcherComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;

    // Setup mock return values
    mockTranslationService.getAvailableLanguages.and.returnValue(mockLanguages);
    mockTranslationService.getCurrentLanguageInfo.and.returnValue(mockLanguages[0]);
    mockTranslationService.translate.and.returnValue('Translated text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display available languages', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    expect(languageButtons.length).toBe(3);
    
    expect(languageButtons[0].nativeElement.textContent).toContain('English');
    expect(languageButtons[1].nativeElement.textContent).toContain('Hebrew');
    expect(languageButtons[2].nativeElement.textContent).toContain('Arabic');
  });

  it('should display language flags', () => {
    fixture.detectChanges();
    
    const flagImages = fixture.debugElement.queryAll(By.css('[data-testid="language-flag"]'));
    expect(flagImages.length).toBe(3);
    
    expect(flagImages[0].nativeElement.src).toContain('en-flag.png');
    expect(flagImages[1].nativeElement.src).toContain('he-flag.png');
    expect(flagImages[2].nativeElement.src).toContain('ar-flag.png');
  });

  it('should highlight current language', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const currentLanguageButton = languageButtons[0];
    
    expect(currentLanguageButton.nativeElement.classList).toContain('bg-blue-100');
    expect(currentLanguageButton.nativeElement.classList).toContain('text-blue-800');
  });

  it('should not highlight non-current languages', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const nonCurrentLanguageButton = languageButtons[1];
    
    expect(nonCurrentLanguageButton.nativeElement.classList).not.toContain('bg-blue-100');
    expect(nonCurrentLanguageButton.nativeElement.classList).not.toContain('text-blue-800');
  });

  it('should call selectLanguage when language button is clicked', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const hebrewButton = languageButtons[1];
    
    hebrewButton.nativeElement.click();
    
    expect(mockTranslationService.selectLanguage).toHaveBeenCalledWith('he' as Language);
  });

  it('should display current language name', () => {
    fixture.detectChanges();
    
    const currentLanguageElement = fixture.debugElement.query(By.css('[data-testid="current-language"]'));
    expect(currentLanguageElement.nativeElement.textContent).toContain('English');
  });

  it('should display current language flag', () => {
    fixture.detectChanges();
    
    const currentFlagElement = fixture.debugElement.query(By.css('[data-testid="current-flag"]'));
    expect(currentFlagElement.nativeElement.src).toContain('en-flag.png');
  });

  it('should toggle dropdown when button is clicked', () => {
    fixture.detectChanges();
    
    const toggleButton = fixture.debugElement.query(By.css('[data-testid="language-toggle"]'));
    expect(component.isOpen()).toBeFalse();
    
    toggleButton.nativeElement.click();
    expect(component.isOpen()).toBeTrue();
    
    toggleButton.nativeElement.click();
    expect(component.isOpen()).toBeFalse();
  });

  it('should close dropdown when clicking outside', () => {
    fixture.detectChanges();
    
    component.isOpen.set(true);
    fixture.detectChanges();
    
    // Simulate clicking outside
    document.dispatchEvent(new Event('click'));
    
    expect(component.isOpen()).toBeFalse();
  });

  it('should not close dropdown when clicking inside', () => {
    fixture.detectChanges();
    
    component.isOpen.set(true);
    fixture.detectChanges();
    
    const dropdown = fixture.debugElement.query(By.css('[data-testid="language-dropdown"]'));
    dropdown.nativeElement.dispatchEvent(new Event('click'));
    
    expect(component.isOpen()).toBeTrue();
  });

  it('should close dropdown when language is selected', () => {
    fixture.detectChanges();
    
    component.isOpen.set(true);
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const hebrewButton = languageButtons[1];
    
    hebrewButton.nativeElement.click();
    
    expect(component.isOpen()).toBeFalse();
  });

  it('should handle empty languages list', () => {
    mockTranslationService.getAvailableLanguages.and.returnValue([]);
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    expect(languageButtons.length).toBe(0);
  });

  it('should handle undefined current language info', () => {
    mockTranslationService.getCurrentLanguageInfo.and.returnValue(undefined);
    fixture.detectChanges();
    
    const currentLanguageElement = fixture.debugElement.query(By.css('[data-testid="current-language"]'));
    expect(currentLanguageElement.nativeElement.textContent).toContain('Language');
  });

  it('should handle language selection with invalid language', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const hebrewButton = languageButtons[1];
    
    hebrewButton.nativeElement.click();
    
    expect(mockTranslationService.selectLanguage).toHaveBeenCalledWith('he' as Language);
  });

  it('should display language names correctly', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    
    expect(languageButtons[0].nativeElement.textContent).toContain('English');
    expect(languageButtons[1].nativeElement.textContent).toContain('Hebrew');
    expect(languageButtons[2].nativeElement.textContent).toContain('Arabic');
  });

  it('should handle language selection with current language', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const englishButton = languageButtons[0];
    
    englishButton.nativeElement.click();
    
    expect(mockTranslationService.selectLanguage).toHaveBeenCalledWith('en' as Language);
  });

  it('should update current language display when language changes', () => {
    fixture.detectChanges();
    
    // Change current language
    mockTranslationService.currentLanguage.and.returnValue('he');
    mockTranslationService.getCurrentLanguageInfo.and.returnValue(mockLanguages[1]);
    
    fixture.detectChanges();
    
    const currentLanguageElement = fixture.debugElement.query(By.css('[data-testid="current-language"]'));
    expect(currentLanguageElement.nativeElement.textContent).toContain('Hebrew');
    
    const currentFlagElement = fixture.debugElement.query(By.css('[data-testid="current-flag"]'));
    expect(currentFlagElement.nativeElement.src).toContain('he-flag.png');
  });

  it('should handle keyboard navigation', () => {
    fixture.detectChanges();
    
    const toggleButton = fixture.debugElement.query(By.css('[data-testid="language-toggle"]'));
    
    // Test Enter key
    toggleButton.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.isOpen()).toBeTrue();
    
    // Test Escape key
    toggleButton.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isOpen()).toBeFalse();
  });

  it('should handle focus events', () => {
    fixture.detectChanges();
    
    const toggleButton = fixture.debugElement.query(By.css('[data-testid="language-toggle"]'));
    
    toggleButton.nativeElement.dispatchEvent(new Event('focus'));
    expect(component.isOpen()).toBeFalse(); // Should not open on focus
    
    toggleButton.nativeElement.dispatchEvent(new Event('blur'));
    expect(component.isOpen()).toBeFalse();
  });

  it('should display correct number of languages', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    expect(languageButtons.length).toBe(mockLanguages.length);
  });

  it('should handle language selection with mouse events', () => {
    fixture.detectChanges();
    
    const languageButtons = fixture.debugElement.queryAll(By.css('[data-testid="language-button"]'));
    const hebrewButton = languageButtons[1];
    
    // Test mouse click
    hebrewButton.nativeElement.dispatchEvent(new MouseEvent('click'));
    
    expect(mockTranslationService.selectLanguage).toHaveBeenCalledWith('he' as Language);
  });

  it('should maintain accessibility attributes', () => {
    fixture.detectChanges();
    
    const toggleButton = fixture.debugElement.query(By.css('[data-testid="language-toggle"]'));
    const dropdown = fixture.debugElement.query(By.css('[data-testid="language-dropdown"]'));
    
    expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('false');
    expect(dropdown.nativeElement.getAttribute('role')).toBe('menu');
    
    component.isOpen.set(true);
    fixture.detectChanges();
    
    expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('true');
  });
});


