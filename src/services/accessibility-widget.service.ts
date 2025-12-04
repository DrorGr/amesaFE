import { Injectable, OnDestroy, signal } from '@angular/core';
import { TranslationService } from './translation.service';
import { LoggingService } from './logging.service';

export interface AccessibilitySettings {
  fontSize: number;
  contrast: 'normal' | 'high' | 'inverted';
  colorBlind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
  textSpacing: boolean;
  cursorSize: 'normal' | 'large' | 'extra-large';
  readingGuide: boolean;
  linkHighlight: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityWidgetService implements OnDestroy {
  private translationService: TranslationService;
  private logger: LoggingService;
  private mousemoveHandler?: (e: MouseEvent) => void;

  // State
  private _isOpen = signal<boolean>(false);
  private _mouseY = signal<number>(0);
  private _isHidden = signal<boolean>(false);

  // Default settings
  settings: AccessibilitySettings = {
    fontSize: 16,
    contrast: 'normal',
    colorBlind: 'none',
    reduceMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicator: false,
    textSpacing: false,
    cursorSize: 'normal',
    readingGuide: false,
    linkHighlight: false
  };

  // Readonly signals
  isOpen = this._isOpen.asReadonly();
  mouseY = this._mouseY.asReadonly();
  isHidden = this._isHidden.asReadonly();

  constructor(translationService: TranslationService, logger: LoggingService) {
    this.translationService = translationService;
    this.logger = logger;
    this.initialize();
  }

  private initialize(): void {
    // Load saved settings
    this.loadSettings();
    
    // Widgets should always appear on page refresh
    // Hidden state is only for current session
    this._isHidden.set(false);
    
    // Apply settings on load (this will conditionally add event listener if reading guide is enabled)
    this.applySettings();
  }

  private setupMouseTracking(): void {
    // Only add event listener if reading guide is enabled and listener doesn't exist
    if (this.settings.readingGuide && typeof window !== 'undefined' && !this.mousemoveHandler) {
      this.mousemoveHandler = (e: MouseEvent) => {
        this._mouseY.set(e.clientY);
      };
      window.addEventListener('mousemove', this.mousemoveHandler);
      this.logger.debug('Mouse tracking enabled for reading guide', undefined, 'AccessibilityWidgetService');
    } else if (!this.settings.readingGuide && this.mousemoveHandler) {
      // Remove listener when reading guide is disabled
      this.removeMouseTracking();
    }
  }

  private removeMouseTracking(): void {
    if (typeof window !== 'undefined' && this.mousemoveHandler) {
      window.removeEventListener('mousemove', this.mousemoveHandler);
      this.mousemoveHandler = undefined;
      this.logger.debug('Mouse tracking disabled', undefined, 'AccessibilityWidgetService');
    }
  }

  ngOnDestroy(): void {
    // Cleanup event listener to prevent memory leak
    // Note: This method won't be called automatically for root services,
    // but it's kept as a safety net in case the service is ever provided at component scope.
    // The real cleanup happens in removeMouseTracking() when reading guide is disabled.
    this.removeMouseTracking();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  toggleWidget(): void {
    this._isOpen.update(open => !open);
  }

  hideWidget(): void {
    this._isHidden.set(true);
    this._isOpen.set(false);
    // Only hide for current session, not permanently
    this.logger.info('Accessibility widget hidden for current session', undefined, 'AccessibilityWidgetService');
  }

  showWidget(): void {
    this._isHidden.set(false);
    this.logger.info('Accessibility widget shown', undefined, 'AccessibilityWidgetService');
  }

  showCloseButton(): boolean {
    return !this._isHidden();
  }

  applySettings(): void {
    if (typeof document === 'undefined') return;
    
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing accessibility classes
    body.className = body.className.replace(/accessibility-[\w-]+/g, '');
    
    // Apply font size to root element
    html.style.fontSize = `${this.settings.fontSize}px`;
    
    // Apply contrast settings
    if (this.settings.contrast === 'high') {
      body.classList.add('accessibility-high-contrast');
    } else if (this.settings.contrast === 'inverted') {
      body.classList.add('accessibility-inverted');
    }
    
    // Apply color blind filters
    if (this.settings.colorBlind !== 'none') {
      body.classList.add(`accessibility-${this.settings.colorBlind}`);
    }
    
    // Apply cursor size
    if (this.settings.cursorSize === 'large') {
      body.classList.add('accessibility-large-cursor');
    } else if (this.settings.cursorSize === 'extra-large') {
      body.classList.add('accessibility-extra-large-cursor');
    }
    
    // Apply text spacing
    if (this.settings.textSpacing) {
      body.classList.add('accessibility-text-spacing');
    }
    
    // Apply focus indicator
    if (this.settings.focusIndicator) {
      body.classList.add('accessibility-focus-indicator');
    }
    
    // Apply link highlight
    if (this.settings.linkHighlight) {
      body.classList.add('accessibility-link-highlight');
    }
    
    // Apply reduce motion
    if (this.settings.reduceMotion) {
      body.classList.add('accessibility-reduce-motion');
      // Also set CSS custom property for motion preference
      html.style.setProperty('--motion-preference', 'reduce');
    } else {
      html.style.removeProperty('--motion-preference');
    }
    
    // Manage mouse tracking for reading guide (conditional listener)
    this.setupMouseTracking();
    
    // Log applied settings for testing
    this.logger.debug('Accessibility settings applied', {
      fontSize: this.settings.fontSize,
      contrast: this.settings.contrast,
      colorBlind: this.settings.colorBlind,
      cursorSize: this.settings.cursorSize,
      readingGuide: this.settings.readingGuide,
      appliedClasses: Array.from(body.classList).filter(c => c.startsWith('accessibility-'))
    }, 'AccessibilityWidgetService');
    
    // Auto-save settings
    this.saveSettings();
  }

  toggleHighContrast(): void {
    this.settings.contrast = 'high';
    this.applySettings();
  }

  resetSettings(): void {
    this.settings = {
      fontSize: 16,
      contrast: 'normal',
      colorBlind: 'none',
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicator: false,
      textSpacing: false,
      cursorSize: 'normal',
      readingGuide: false,
      linkHighlight: false
    };
    this.applySettings();
  }

  saveSettings(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amesa-accessibility-settings', JSON.stringify(this.settings));
    }
  }

  loadSettings(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('amesa-accessibility-settings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
          this.logger.debug('Accessibility settings loaded', this.settings, 'AccessibilityWidgetService');
        } catch (e) {
          this.logger.warn('Failed to load accessibility settings', { error: e }, 'AccessibilityWidgetService');
        }
      }
    }
  }

  // Test method to verify all features
  testAllFeatures(): void {
    this.logger.info('Testing all accessibility features', undefined, 'AccessibilityWidgetService');
    
    // Test font size
    this.logger.debug('Testing font size changes', undefined, 'AccessibilityWidgetService');
    const originalFontSize = this.settings.fontSize;
    this.settings.fontSize = 20;
    this.applySettings();
    setTimeout(() => {
      this.settings.fontSize = originalFontSize;
      this.applySettings();
    }, 2000);
    
    // Test contrast modes
    this.logger.debug('Testing contrast modes', undefined, 'AccessibilityWidgetService');
    setTimeout(() => {
      this.settings.contrast = 'high';
      this.applySettings();
      setTimeout(() => {
        this.settings.contrast = 'inverted';
        this.applySettings();
        setTimeout(() => {
          this.settings.contrast = 'normal';
          this.applySettings();
        }, 2000);
      }, 2000);
    }, 3000);
    
    // Test color blind filters
    this.logger.debug('Testing color blind filters', undefined, 'AccessibilityWidgetService');
    setTimeout(() => {
      this.settings.colorBlind = 'protanopia';
      this.applySettings();
      setTimeout(() => {
        this.settings.colorBlind = 'deuteranopia';
        this.applySettings();
        setTimeout(() => {
          this.settings.colorBlind = 'tritanopia';
          this.applySettings();
          setTimeout(() => {
            this.settings.colorBlind = 'none';
            this.applySettings();
          }, 2000);
        }, 2000);
      }, 2000);
    }, 8000);
    
    // Test cursor sizes
    this.logger.debug('Testing cursor sizes', undefined, 'AccessibilityWidgetService');
    setTimeout(() => {
      this.settings.cursorSize = 'large';
      this.applySettings();
      setTimeout(() => {
        this.settings.cursorSize = 'extra-large';
        this.applySettings();
        setTimeout(() => {
          this.settings.cursorSize = 'normal';
          this.applySettings();
        }, 2000);
      }, 2000);
    }, 15000);
    
    // Test toggle features
    this.logger.debug('Testing toggle features', undefined, 'AccessibilityWidgetService');
    setTimeout(() => {
      this.settings.textSpacing = true;
      this.settings.focusIndicator = true;
      this.settings.linkHighlight = true;
      this.settings.readingGuide = true;
      this.applySettings();
      
      setTimeout(() => {
        this.settings.textSpacing = false;
        this.settings.focusIndicator = false;
        this.settings.linkHighlight = false;
        this.settings.readingGuide = false;
        this.applySettings();
        this.logger.info('All accessibility features tested', undefined, 'AccessibilityWidgetService');
      }, 3000);
    }, 20000);
  }
}


