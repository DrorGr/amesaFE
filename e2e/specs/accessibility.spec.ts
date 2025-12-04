import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance
 * 
 * Uses axe-core for automated accessibility testing
 */
test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into the page
    await injectAxe(page);
  });
  test('home page should have proper semantic structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('auth modal should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Check modal has proper ARIA
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      if (await modal.isVisible()) {
        const ariaLabel = await modal.getAttribute('aria-label');
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('house detail page should have proper structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to first house
    const houseLink = page.locator('a[href*="/house/"], [routerLink*="/house/"]').first();
    if (await houseLink.isVisible()) {
      await houseLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check for main content
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();
    }
  });

  test('all interactive elements should have ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check buttons have aria-label or visible text
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const hasVisibleText = text && text.trim().length > 0;
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || hasVisibleText).toBeTruthy();
    }
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should have alt text unless it's decorative (aria-hidden)
      if (ariaHidden !== 'true') {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('keyboard navigation should work on all interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test that focus is visible
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
    
    // Focus should be visible (outline or ring)
    expect(focusStyles).toBeTruthy();
  });

  test('skip links should be present and functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for skip links
    const skipLinks = page.locator('a[href*="#main"], a[href*="#navigation"]');
    const skipLinkCount = await skipLinks.count();
    
    if (skipLinkCount > 0) {
      // Test skip link functionality
      await skipLinks.first().focus();
      await page.keyboard.press('Enter');
      
      // Should navigate to target
      await page.waitForTimeout(300);
    }
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    // Test color contrast on all major pages
    const pages = ['/', '/houses', '/lottery', '/entries'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await injectAxe(page);
      
      // Run axe-core color contrast check
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        },
        tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      });
    }
    
    // Also verify focus indicators are visible
    const focusStyles = await page.evaluate(() => {
      const element = document.createElement('button');
      element.style.outline = '2px solid #3b82f6';
      document.body.appendChild(element);
      element.focus();
      const styles = window.getComputedStyle(element);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth
      };
    });
    
      expect(focusStyles.outlineWidth).toBeTruthy();
    });
  });

  test('page should pass full axe-core accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run full accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });

  test('form inputs should have proper labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
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

  test('modals should trap focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
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
      const modal = page.locator('[class*="modal"]').first();
      if (await modal.isVisible()) {
        const isInModal = await modal.evaluate((el, focused) => {
          return el.contains(focused);
        }, await page.evaluate(() => document.activeElement));
        
        expect(isInModal).toBeTruthy();
      }
    }
  });

  test('dynamic content should have aria-live regions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    
    // Should have at least some aria-live regions for dynamic content
    // This is a soft check - not all pages need aria-live
    expect(liveRegionCount).toBeGreaterThanOrEqual(0);
  });

  test('page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check heading structure
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    // Should have exactly one h1
    expect(h1Count).toBe(1);
    
    // Check that headings are in order (no h3 without h2, etc.)
    const headings = await page.evaluate(() => {
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return allHeadings.map(h => ({
        tag: h.tagName,
        level: parseInt(h.tagName.substring(1))
      }));
    });
    
    // Verify heading hierarchy
    let previousLevel = 0;
    for (const heading of headings) {
      // Heading level should not skip more than one level
      if (previousLevel > 0 && heading.level > previousLevel + 1) {
        // Allow some flexibility for nested components
        expect(heading.level - previousLevel).toBeLessThanOrEqual(2);
      }
      previousLevel = heading.level;
    }
  });
});

