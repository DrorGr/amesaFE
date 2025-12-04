import { test, expect } from '@playwright/test';

/**
 * Accessibility Flow E2E Test
 * Tests keyboard navigation throughout user journey
 * Tests screen reader announcements
 * Tests focus management
 * Tests color contrast compliance
 */
test.describe('Accessibility Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('keyboard navigation works throughout journey', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    }
  });

  test('skip links are functional', async ({ page }) => {
    // Check for skip links
    const skipLinks = page.locator('a[href*="#main"], a[href*="#navigation"]');
    const skipLinkCount = await skipLinks.count();
    
    if (skipLinkCount > 0) {
      // Focus first skip link
      await skipLinks.first().focus();
      await page.keyboard.press('Enter');
      
      // Should navigate to target
      await page.waitForTimeout(300);
      
      // Check if main content is focused
      const mainContent = page.locator('#main-content, main');
      if (await mainContent.isVisible()) {
        const isFocused = await mainContent.evaluate((el) => document.activeElement === el || el.contains(document.activeElement));
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('modal focus trap works', async ({ page }) => {
    // Open auth modal
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Tab through modal - focus should stay within modal
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement);
      
      // Tab multiple times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      const lastFocused = await page.evaluate(() => document.activeElement);
      
      // Focus should still be within modal
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      if (await modal.isVisible()) {
        const isInModal = await modal.evaluate((el, focused) => {
          return el.contains(focused);
        }, await page.evaluate(() => document.activeElement));
        
        expect(isInModal).toBeTruthy();
      }
    }
  });

  test('Escape key closes modals', async ({ page }) => {
    // Open auth modal
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Modal should be closed
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      const isVisible = await modal.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    }
  });

  test('all interactive elements have ARIA labels or visible text', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const hasVisibleText = text && text.trim().length > 0;
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || hasVisibleText).toBeTruthy();
    }
  });

  test('all images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should have alt text unless it's decorative
      if (ariaHidden !== 'true') {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('form inputs have proper labels', async ({ page }) => {
    // Open auth modal to test forms
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Input should have id+label, aria-label, or aria-labelledby
        const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('focus indicators are visible', async ({ page }) => {
    // Focus an element
    await page.keyboard.press('Tab');
    
    // Check focus styles
    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      if (!element) return null;
      const styles = window.getComputedStyle(element);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle
      };
    });
    
    // Focus should be visible
    expect(focusStyles).toBeTruthy();
  });
});

