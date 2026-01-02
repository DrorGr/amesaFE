import { Injectable, signal } from '@angular/core';

/**
 * Service for managing accessibility features and user preferences.
 * Handles high contrast mode, reduced motion preferences, and font size adjustments.
 * 
 * @example
 * ```typescript
 * constructor(private accessibilityService: AccessibilityService) {}
 * 
 * toggleHighContrast() {
 *   this.accessibilityService.toggleHighContrast();
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  /** Signal for high contrast mode state */
  private highContrastMode = signal<boolean>(false);
  
  /** Signal for reduced motion preference */
  private reducedMotion = signal<boolean>(false);
  
  /** Signal for current font size setting */
  private fontSize = signal<'small' | 'medium' | 'large'>('medium');

  constructor() {
    // Check for user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reducedMotion.set(true);
    }

    // Check for user's color scheme preferences
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.highContrastMode.set(true);
    }

    // Listen for changes in user preferences
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion.set(e.matches);
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.highContrastMode.set(e.matches);
    });
  }

  /**
   * Gets the current high contrast mode state as a readonly signal.
   * @returns Readonly signal containing the high contrast mode state
   */
  getHighContrastMode() {
    return this.highContrastMode.asReadonly();
  }

  /**
   * Gets the current reduced motion preference as a readonly signal.
   * @returns Readonly signal containing the reduced motion state
   */
  getReducedMotion() {
    return this.reducedMotion.asReadonly();
  }

  /**
   * Gets the current font size setting as a readonly signal.
   * @returns Readonly signal containing the font size setting
   */
  getFontSize() {
    return this.fontSize.asReadonly();
  }

  /**
   * Toggles the high contrast mode on/off.
   * @example
   * ```typescript
   * this.accessibilityService.toggleHighContrast();
   * ```
   */
  toggleHighContrast() {
    this.highContrastMode.set(!this.highContrastMode());
  }

  /**
   * Sets the font size for better readability.
   * @param size - The font size to set ('small', 'medium', or 'large')
   * @example
   * ```typescript
   * this.accessibilityService.setFontSize('large');
   * ```
   */
  setFontSize(size: 'small' | 'medium' | 'large') {
    this.fontSize.set(size);
  }

  /**
   * Generates CSS classes based on current accessibility settings.
   * @returns Space-separated string of CSS classes
   * @example
   * ```typescript
   * const classes = this.accessibilityService.getAccessibilityClasses();
   * // Returns: "high-contrast font-size-large" (if both are enabled)
   * ```
   */
  getAccessibilityClasses() {
    const classes: string[] = [];
    
    if (this.highContrastMode()) {
      classes.push('high-contrast');
    }
    
    if (this.reducedMotion()) {
      classes.push('reduced-motion');
    }
    
    classes.push(`font-size-${this.fontSize()}`);
    
    return classes.join(' ');
  }
}
