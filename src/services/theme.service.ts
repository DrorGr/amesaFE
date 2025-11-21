import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoggingService } from './logging.service';
import { ThemeMode } from '../interfaces/user-preferences.interface';

/**
 * Theme Service
 * Manages application theme based on user preferences and system settings
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private logger = inject(LoggingService);

  // Theme state
  private currentThemeSignal = signal<'light' | 'dark'>('light');
  private systemThemeSignal = signal<'light' | 'dark'>('light');
  private userThemeModeSignal = signal<ThemeMode>('auto');

  // Public computed properties
  public currentTheme = computed(() => this.currentThemeSignal());
  public systemTheme = computed(() => this.systemThemeSignal());
  public userThemeMode = computed(() => this.userThemeModeSignal());
  public isDarkMode = computed(() => this.currentTheme() === 'dark');
  public isLightMode = computed(() => this.currentTheme() === 'light');
  public isAutoMode = computed(() => this.userThemeMode() === 'auto');

  // CSS custom properties for dynamic theming
  private themeProperties = {
    light: {
      '--color-primary': '#3B82F6',
      '--color-primary-dark': '#2563EB',
      '--color-primary-light': '#60A5FA',
      '--color-secondary': '#10B981',
      '--color-secondary-dark': '#059669',
      '--color-secondary-light': '#34D399',
      '--color-background': '#FFFFFF',
      '--color-background-secondary': '#F9FAFB',
      '--color-background-tertiary': '#F3F4F6',
      '--color-text': '#111827',
      '--color-text-secondary': '#6B7280',
      '--color-text-tertiary': '#9CA3AF',
      '--color-border': '#E5E7EB',
      '--color-border-light': '#F3F4F6',
      '--color-error': '#EF4444',
      '--color-warning': '#F59E0B',
      '--color-success': '#10B981',
      '--color-info': '#3B82F6',
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
    dark: {
      '--color-primary': '#60A5FA',
      '--color-primary-dark': '#3B82F6',
      '--color-primary-light': '#93C5FD',
      '--color-secondary': '#34D399',
      '--color-secondary-dark': '#10B981',
      '--color-secondary-light': '#6EE7B7',
      '--color-background': '#111827',
      '--color-background-secondary': '#1F2937',
      '--color-background-tertiary': '#374151',
      '--color-text': '#F9FAFB',
      '--color-text-secondary': '#D1D5DB',
      '--color-text-tertiary': '#9CA3AF',
      '--color-border': '#374151',
      '--color-border-light': '#4B5563',
      '--color-error': '#F87171',
      '--color-warning': '#FBBF24',
      '--color-success': '#34D399',
      '--color-info': '#60A5FA',
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    }
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.setupSystemThemeListener();
    }

    this.logger.info('ThemeService initialized', {
      currentTheme: this.currentTheme(),
      userThemeMode: this.userThemeMode(),
      systemTheme: this.systemTheme()
    }, 'ThemeService');
  }

  /**
   * Initialize theme on service startup
   */
  private initializeTheme(): void {
    // Detect system theme
    this.detectSystemTheme();
    
    // Get user preference from localStorage
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        this.userThemeModeSignal.set(prefs.appearance?.theme || 'auto');
      } catch {
        this.userThemeModeSignal.set('auto');
      }
    }
    
    // Apply theme
    this.applyTheme();
  }

  /**
   * Detect system theme preference
   */
  private detectSystemTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeSignal.set(mediaQuery.matches ? 'dark' : 'light');
  }

  /**
   * Setup listener for system theme changes
   */
  private setupSystemThemeListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this.systemThemeSignal.set(e.matches ? 'dark' : 'light');
      this.logger.debug('System theme changed', { systemTheme: this.systemTheme() }, 'ThemeService');
      
      // Re-apply theme if in auto mode
      if (this.userThemeMode() === 'auto') {
        this.applyTheme();
      }
    });
  }

  /**
   * Update theme mode from external preference change
   */
  public updateThemeFromPreferences(themeMode: ThemeMode): void {
    if (themeMode !== this.userThemeMode()) {
      this.userThemeModeSignal.set(themeMode);
      this.applyTheme();
      this.logger.info('User theme preference changed', { themeMode }, 'ThemeService');
    }
  }

  /**
   * Apply the current theme to the document
   */
  private applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const resolvedTheme = this.resolveTheme();
    this.currentThemeSignal.set(resolvedTheme);

    // Apply theme class to document
    const htmlElement = document.documentElement;
    htmlElement.classList.remove('light', 'dark');
    htmlElement.classList.add(resolvedTheme);

    // Apply CSS custom properties
    this.applyCSSProperties(resolvedTheme);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(resolvedTheme);

    // Store theme in localStorage for faster initial load
    localStorage.setItem('amesa_current_theme', resolvedTheme);

    this.logger.debug('Theme applied', {
      resolvedTheme,
      userThemeMode: this.userThemeMode(),
      systemTheme: this.systemTheme()
    }, 'ThemeService');
  }

  /**
   * Resolve the actual theme based on user preference and system theme
   */
  private resolveTheme(): 'light' | 'dark' {
    const userMode = this.userThemeMode();
    
    switch (userMode) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'auto':
      default:
        return this.systemTheme();
    }
  }

  /**
   * Apply CSS custom properties for the theme
   */
  private applyCSSProperties(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const properties = this.themeProperties[theme];
    const root = document.documentElement;

    Object.entries(properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply additional user customizations from localStorage
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        if (prefs.appearance?.primaryColor) {
          root.style.setProperty('--color-primary', prefs.appearance.primaryColor);
        }
        if (prefs.appearance?.accentColor) {
          root.style.setProperty('--color-secondary', prefs.appearance.accentColor);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  private updateMetaThemeColor(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const themeColor = theme === 'dark' ? '#111827' : '#FFFFFF';
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', themeColor);
  }

  /**
   * Set theme mode (light, dark, auto)
   */
  public setThemeMode(mode: ThemeMode): void {
    this.userThemeModeSignal.set(mode);
    this.applyTheme();
    
    // Update localStorage
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    let prefs = { appearance: { theme: mode } };
    if (storedPrefs) {
      try {
        prefs = { ...JSON.parse(storedPrefs), appearance: { ...JSON.parse(storedPrefs).appearance, theme: mode } };
      } catch {
        // Use default if parsing fails
      }
    }
    localStorage.setItem('amesa_user_preferences', JSON.stringify(prefs));
  }

  /**
   * Toggle between light and dark mode
   */
  public toggleTheme(): void {
    const currentMode = this.userThemeMode();
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    this.setThemeMode(newMode);
  }

  /**
   * Set custom primary color
   */
  public setPrimaryColor(color: string): void {
    // Update localStorage
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    let prefs = { appearance: { primaryColor: color } };
    if (storedPrefs) {
      try {
        prefs = { ...JSON.parse(storedPrefs), appearance: { ...JSON.parse(storedPrefs).appearance, primaryColor: color } };
      } catch {
        // Use default if parsing fails
      }
    }
    localStorage.setItem('amesa_user_preferences', JSON.stringify(prefs));
    this.applyTheme(); // Re-apply to update CSS properties
  }

  /**
   * Set custom accent color
   */
  public setAccentColor(color: string): void {
    // Update localStorage
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    let prefs = { appearance: { accentColor: color } };
    if (storedPrefs) {
      try {
        prefs = { ...JSON.parse(storedPrefs), appearance: { ...JSON.parse(storedPrefs).appearance, accentColor: color } };
      } catch {
        // Use default if parsing fails
      }
    }
    localStorage.setItem('amesa_user_preferences', JSON.stringify(prefs));
    this.applyTheme(); // Re-apply to update CSS properties
  }

  /**
   * Get current theme colors
   */
  public getCurrentThemeColors(): Record<string, string> {
    const theme = this.currentTheme();
    return { ...this.themeProperties[theme] };
  }

  /**
   * Check if high contrast mode is enabled
   */
  public isHighContrastMode(): boolean {
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        return prefs.accessibility?.highContrast || false;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Apply high contrast styles
   */
  public applyHighContrast(enabled: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const htmlElement = document.documentElement;
    if (enabled) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }

    this.logger.info('High contrast mode toggled', { enabled }, 'ThemeService');
  }

  /**
   * Get theme for specific component or context
   */
  public getThemeForContext(context: 'modal' | 'tooltip' | 'dropdown' | 'card'): Record<string, string> {
    const baseTheme = this.getCurrentThemeColors();
    const currentTheme = this.currentTheme();

    // Context-specific theme adjustments
    switch (context) {
      case 'modal':
        return {
          ...baseTheme,
          '--modal-backdrop': currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          '--modal-background': baseTheme['--color-background'],
          '--modal-border': baseTheme['--color-border']
        };
      
      case 'tooltip':
        return {
          ...baseTheme,
          '--tooltip-background': currentTheme === 'dark' ? '#374151' : '#1F2937',
          '--tooltip-text': currentTheme === 'dark' ? '#F9FAFB' : '#FFFFFF',
          '--tooltip-arrow': currentTheme === 'dark' ? '#374151' : '#1F2937'
        };
      
      case 'dropdown':
        return {
          ...baseTheme,
          '--dropdown-background': baseTheme['--color-background'],
          '--dropdown-border': baseTheme['--color-border'],
          '--dropdown-shadow': baseTheme['--shadow-lg']
        };
      
      case 'card':
        return {
          ...baseTheme,
          '--card-background': baseTheme['--color-background-secondary'],
          '--card-border': baseTheme['--color-border-light'],
          '--card-shadow': baseTheme['--shadow-md']
        };
      
      default:
        return baseTheme;
    }
  }

  /**
   * Initialize theme from localStorage (for faster initial load)
   */
  public initializeFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const storedTheme = localStorage.getItem('amesa_current_theme') as 'light' | 'dark' | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      // Apply stored theme immediately for faster perceived performance
      document.documentElement.classList.add(storedTheme);
      this.currentThemeSignal.set(storedTheme);
      this.applyCSSProperties(storedTheme);
    }
  }

  /**
   * Get stored custom colors from localStorage
   */
  private getStoredCustomColors(): Record<string, string> {
    const storedPrefs = localStorage.getItem('amesa_user_preferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        return {
          primary: prefs.appearance?.primaryColor || '#3B82F6',
          accent: prefs.appearance?.accentColor || '#10B981'
        };
      } catch {
        return { primary: '#3B82F6', accent: '#10B981' };
      }
    }
    return { primary: '#3B82F6', accent: '#10B981' };
  }

  /**
   * Get theme summary for debugging
   */
  public getThemeSummary(): Record<string, any> {
    return {
      currentTheme: this.currentTheme(),
      userThemeMode: this.userThemeMode(),
      systemTheme: this.systemTheme(),
      isDarkMode: this.isDarkMode(),
      isAutoMode: this.isAutoMode(),
      isHighContrast: this.isHighContrastMode(),
      customColors: this.getStoredCustomColors()
    };
  }
}