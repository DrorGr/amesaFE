import { Injectable } from '@angular/core';

/**
 * Focus Trap Service
 * Manages focus trapping in modals and other overlay components
 * Ensures keyboard navigation stays within the trapped element
 */
@Injectable({
  providedIn: 'root'
})
export class FocusTrapService {
  private trappedElements: HTMLElement[] = [];
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private keydownListener?: (event: KeyboardEvent) => void;

  /**
   * Trap focus within an element
   * @param element - Element to trap focus within
   */
  trapFocus(element: HTMLElement): void {
    // Save previous active element for restoration
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Add to trapped elements stack
    this.trappedElements.push(element);

    // Get all focusable elements within the trapped element
    this.updateFocusableElements(element);

    // Focus the first focusable element
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    } else {
      // If no focusable elements, focus the container itself
      element.setAttribute('tabindex', '-1');
      element.focus();
    }

    // Add keyboard event listener for tab trapping
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.handleTabKey(event, element);
      } else if (event.key === 'Escape') {
        // Allow escape to close modal (handled by component)
        return;
      }
    };

    document.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Release focus trap
   */
  releaseFocus(): void {
    // Remove keyboard event listener
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = undefined;
    }

    // Remove from trapped elements stack
    this.trappedElements.pop();

    // Restore focus to previous element if available
    this.restoreFocus();
  }

  /**
   * Restore focus to the previously active element
   */
  restoreFocus(): void {
    if (this.previousActiveElement && document.contains(this.previousActiveElement)) {
      // Check if element is still focusable
      if (this.isFocusable(this.previousActiveElement)) {
        this.previousActiveElement.focus();
      } else {
        // If not focusable, try to find a focusable parent or sibling
        const focusable = this.findFocusableNearby(this.previousActiveElement);
        if (focusable) {
          focusable.focus();
        }
      }
    } else {
      // If previous element is not available, focus body
      document.body.focus();
    }

    this.previousActiveElement = null;
  }

  /**
   * Update list of focusable elements within trapped element
   */
  private updateFocusableElements(element: HTMLElement): void {
    // Get all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(
      element.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });

    // Set first and last focusable elements
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Handle Tab key press to trap focus
   */
  private handleTabKey(event: KeyboardEvent, element: HTMLElement): void {
    // If no focusable elements, prevent default
    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const currentFocus = document.activeElement as HTMLElement;
    const isShiftPressed = event.shiftKey;

    // If current focus is not within the trapped element, focus first element
    if (!element.contains(currentFocus)) {
      event.preventDefault();
      if (this.firstFocusableElement) {
        this.firstFocusableElement.focus();
      }
      return;
    }

    // Find current focus index
    const currentIndex = this.focusableElements.indexOf(currentFocus);

    if (isShiftPressed) {
      // Shift + Tab: move to previous element
      if (currentIndex === 0 || currentIndex === -1) {
        // If at first element or not found, wrap to last
        event.preventDefault();
        if (this.lastFocusableElement) {
          this.lastFocusableElement.focus();
        }
      }
      // Otherwise, let browser handle normal tab navigation
    } else {
      // Tab: move to next element
      if (currentIndex === this.focusableElements.length - 1 || currentIndex === -1) {
        // If at last element or not found, wrap to first
        event.preventDefault();
        if (this.firstFocusableElement) {
          this.firstFocusableElement.focus();
        }
      }
      // Otherwise, let browser handle normal tab navigation
    }
  }

  /**
   * Check if element is focusable
   */
  private isFocusable(element: HTMLElement): boolean {
    if (element.tabIndex < 0) {
      return false;
    }

    if (element.hasAttribute('disabled')) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    return true;
  }

  /**
   * Find a focusable element nearby the given element
   */
  private findFocusableNearby(element: HTMLElement): HTMLElement | null {
    // Try parent
    let current: HTMLElement | null = element.parentElement;
    while (current) {
      if (this.isFocusable(current)) {
        return current;
      }
      current = current.parentElement;
    }

    // Try siblings
    let sibling: HTMLElement | null = element.previousElementSibling as HTMLElement;
    while (sibling) {
      if (this.isFocusable(sibling)) {
        return sibling;
      }
      sibling = sibling.previousElementSibling as HTMLElement;
    }

    sibling = element.nextElementSibling as HTMLElement;
    while (sibling) {
      if (this.isFocusable(sibling)) {
        return sibling;
      }
      sibling = sibling.nextElementSibling as HTMLElement;
    }

    return null;
  }

  /**
   * Get current trapped element (if any)
   */
  getCurrentTrappedElement(): HTMLElement | null {
    return this.trappedElements.length > 0 
      ? this.trappedElements[this.trappedElements.length - 1] 
      : null;
  }

  /**
   * Check if focus is currently trapped
   */
  isFocusTrapped(): boolean {
    return this.trappedElements.length > 0;
  }
}


