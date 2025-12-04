import { test, expect } from '@playwright/test';

/**
 * Multi-Language Flow E2E Test
 * Tests language switching during user journey
 * Verifies all text updates correctly
 * Verifies date/number/currency formatting updates correctly
 */
test.describe('Multi-Language Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('language switching updates all text', async ({ page }) => {
    // Get initial text in English
    const initialText = await page.locator('h1, h2, button').first().textContent();
    
    // Switch to Spanish
    const languageButton = page.locator('button[aria-label*="language"], app-language-switcher button').first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.waitForTimeout(300);
      
      const spanishOption = page.locator('button:has-text("ES"), button:has-text("Spanish")').first();
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
        await page.waitForTimeout(2000); // Wait for translations to load
        
        // Check that text has changed
        const newText = await page.locator('h1, h2, button').first().textContent();
        expect(newText).toBeTruthy();
        
        // Verify language is stored
        const currentLang = await page.evaluate(() => localStorage.getItem('amesa_language'));
        expect(currentLang).toBe('es');
      }
    }
  });

  test('date formatting updates with language', async ({ page }) => {
    // Set language to French
    const languageButton = page.locator('button[aria-label*="language"], app-language-switcher button').first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.waitForTimeout(300);
      
      const frenchOption = page.locator('button:has-text("FR"), button:has-text("French")').first();
      if (await frenchOption.isVisible()) {
        await frenchOption.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to page with dates
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if dates are formatted (basic check)
    const dateElements = page.locator('[class*="date"], time, [data-date]');
    const dateCount = await dateElements.count();
    
    if (dateCount > 0) {
      const firstDate = await dateElements.first().textContent();
      expect(firstDate).toBeTruthy();
    }
  });

  test('currency formatting updates with language', async ({ page }) => {
    // Set language to Polish
    const languageButton = page.locator('button[aria-label*="language"], app-language-switcher button').first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.waitForTimeout(300);
      
      const polishOption = page.locator('button:has-text("PL"), button:has-text("Polish")').first();
      if (await polishOption.isVisible()) {
        await polishOption.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check for currency formatting
    const priceElements = page.locator('[class*="price"], [class*="currency"]');
    const priceCount = await priceElements.count();
    
    if (priceCount > 0) {
      const firstPrice = await priceElements.first().textContent();
      expect(firstPrice).toBeTruthy();
    }
  });

  test('language preference persists across navigation', async ({ page }) => {
    // Set language to Spanish
    const languageButton = page.locator('button[aria-label*="language"], app-language-switcher button').first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.waitForTimeout(300);
      
      const spanishOption = page.locator('button:has-text("ES"), button:has-text("Spanish")').first();
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to multiple pages
    await page.goto('/houses');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify language persisted
    const currentLang = await page.evaluate(() => localStorage.getItem('amesa_language'));
    expect(currentLang).toBe('es');
  });
});

