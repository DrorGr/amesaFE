import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { LoggingService } from './logging.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let platformId: any;

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['info', 'debug']);
    
    // Mock localStorage
    let store: any = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy('matchMedia').and.returnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: jasmine.createSpy(),
        removeListener: jasmine.createSpy(),
        addEventListener: jasmine.createSpy(),
        removeEventListener: jasmine.createSpy(),
        dispatchEvent: jasmine.createSpy()
      })
    });

    // Mock document methods
    const mockHtmlElement = {
      classList: {
        remove: jasmine.createSpy('remove'),
        add: jasmine.createSpy('add')
      },
      style: {
        setProperty: jasmine.createSpy('setProperty')
      }
    };
    spyOnProperty(document, 'documentElement', 'get').and.returnValue(mockHtmlElement as any);
    
    const mockHead = {
      appendChild: jasmine.createSpy('appendChild'),
      querySelector: jasmine.createSpy('querySelector').and.returnValue(null)
    };
    spyOnProperty(document, 'head', 'get').and.returnValue(mockHead as any);

    platformId = 'browser';
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: LoggingService, useValue: mockLoggingService }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default theme as dark', () => {
    expect(service.currentTheme()).toBe('dark');
  });

  it('should have default user theme mode as dark', () => {
    expect(service.userThemeMode()).toBe('dark');
  });

  it('should set theme mode to light', () => {
    service.setThemeMode('light');
    expect(service.userThemeMode()).toBe('light');
    expect(service.currentTheme()).toBe('light');
  });

  it('should set theme mode to dark', () => {
    service.setThemeMode('dark');
    expect(service.userThemeMode()).toBe('dark');
    expect(service.currentTheme()).toBe('dark');
  });

  it('should set theme mode to auto', () => {
    service.setThemeMode('auto');
    expect(service.userThemeMode()).toBe('auto');
  });

  it('should toggle theme from light to dark', () => {
    service.setThemeMode('light');
    service.toggleTheme();
    expect(service.userThemeMode()).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    service.setThemeMode('dark');
    service.toggleTheme();
    expect(service.userThemeMode()).toBe('light');
  });

  it('should update theme from preferences', () => {
    service.updateThemeFromPreferences('dark');
    expect(service.userThemeMode()).toBe('dark');
  });

  it('should not update if theme mode is the same', () => {
    service.setThemeMode('light');
    const initialCallCount = mockLoggingService.info.calls.count();
    service.updateThemeFromPreferences('light');
    expect(mockLoggingService.info.calls.count()).toBe(initialCallCount);
  });

  it('should set primary color', () => {
    service.setPrimaryColor('#FF0000');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should set accent color', () => {
    service.setAccentColor('#00FF00');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should get current theme colors', () => {
    const colors = service.getCurrentThemeColors();
    expect(colors).toBeDefined();
    expect(colors['--color-primary']).toBeDefined();
    expect(colors['--color-background']).toBeDefined();
  });

  it('should check high contrast mode', () => {
    localStorage.setItem('amesa_user_preferences', JSON.stringify({
      accessibility: { highContrast: true }
    }));
    expect(service.isHighContrastMode()).toBe(true);
  });

  it('should return false for high contrast when not set', () => {
    expect(service.isHighContrastMode()).toBe(false);
  });

  it('should apply high contrast styles', () => {
    const htmlElement = document.documentElement;
    service.applyHighContrast(true);
    expect(htmlElement.classList.add).toHaveBeenCalledWith('high-contrast');
  });

  it('should remove high contrast styles', () => {
    const htmlElement = document.documentElement;
    service.applyHighContrast(false);
    expect(htmlElement.classList.remove).toHaveBeenCalledWith('high-contrast');
  });

  it('should get theme for modal context', () => {
    const theme = service.getThemeForContext('modal');
    expect(theme).toBeDefined();
    expect(theme['--modal-backdrop']).toBeDefined();
  });

  it('should get theme for tooltip context', () => {
    const theme = service.getThemeForContext('tooltip');
    expect(theme).toBeDefined();
    expect(theme['--tooltip-background']).toBeDefined();
  });

  it('should get theme for dropdown context', () => {
    const theme = service.getThemeForContext('dropdown');
    expect(theme).toBeDefined();
    expect(theme['--dropdown-background']).toBeDefined();
  });

  it('should get theme for card context', () => {
    const theme = service.getThemeForContext('card');
    expect(theme).toBeDefined();
    expect(theme['--card-background']).toBeDefined();
  });

  it('should initialize from storage', () => {
    localStorage.setItem('amesa_current_theme', 'dark');
    service.initializeFromStorage();
    expect(service.currentTheme()).toBe('dark');
  });

  it('should get theme summary', () => {
    const summary = service.getThemeSummary();
    expect(summary).toBeDefined();
    expect(summary['currentTheme']).toBeDefined();
    expect(summary['userThemeMode']).toBeDefined();
    expect(summary['systemTheme']).toBeDefined();
    expect(summary['isDarkMode']).toBeDefined();
    expect(summary['isAutoMode']).toBeDefined();
  });

  it('should compute isDarkMode correctly', () => {
    service.setThemeMode('dark');
    expect(service.isDarkMode()).toBe(true);
    expect(service.isLightMode()).toBe(false);
  });

  it('should compute isLightMode correctly', () => {
    service.setThemeMode('light');
    expect(service.isLightMode()).toBe(true);
    expect(service.isDarkMode()).toBe(false);
  });

  it('should compute isAutoMode correctly', () => {
    service.setThemeMode('auto');
    expect(service.isAutoMode()).toBe(true);
  });
});
