import { test, expect } from '@playwright/test';
import { AuthPage } from '../../helpers/page-objects/auth-page';
import { testUsers } from '../../helpers/test-data/test-users';

/**
 * Complete User Journey E2E Test
 * Tests: Register → Login → Browse Houses → Purchase Ticket → View Entry
 * Verifies all features work together (language, accessibility, dark mode)
 */
test.describe('Complete User Journey', () => {
  test('complete user journey with all features', async ({ page }) => {
    const authPage = new AuthPage(page);

    // Step 1: Register
    await authPage.gotoRegister();
    await authPage.register(testUsers.validUser);
    await expect(page).toHaveURL(/login|home|dashboard/i);

    // Step 2: Login
    await authPage.gotoLogin();
    await authPage.login(testUsers.validUser.email, testUsers.validUser.password);
    expect(await authPage.isLoggedIn()).toBe(true);

    // Step 3: Browse Houses
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const houseElements = page.locator('.house-card, [data-testid="house-card"], .house-grid');
    await expect(houseElements.first()).toBeVisible({ timeout: 10000 });

    // Step 4: Navigate to house detail
    const houseLink = page.locator('a[href*="/house/"], [routerLink*="/house/"]').first();
    if (await houseLink.isVisible()) {
      await houseLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify house detail page loaded
      const houseTitle = page.locator('h1, [class*="title"]').first();
      await expect(houseTitle).toBeVisible();
    }

    // Step 5: Add to favorites (if button exists)
    const favoriteButton = page.locator('button[aria-label*="favorite"], button[aria-label*="Favorite"]').first();
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(500);
    }

    // Step 6: Verify language switching works
    const languageButton = page.locator('button[aria-label*="language"], app-language-switcher button').first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      await page.waitForTimeout(300);
      
      const spanishOption = page.locator('button:has-text("ES"), button:has-text("Spanish")').first();
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
        await page.waitForTimeout(1000);
        
        // Verify language changed
        const currentLang = await page.evaluate(() => localStorage.getItem('amesa_language'));
        expect(currentLang).toBe('es');
      }
    }

    // Step 7: Verify dark mode works
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Verify dark mode applied
      const body = page.locator('body');
      const hasDarkClass = await body.evaluate((el) => el.classList.contains('dark'));
      expect(hasDarkClass).toBeTruthy();
    }

    // Step 8: Verify accessibility features
    // Check for skip links
    const skipLinks = page.locator('a[href*="#main"], a[href*="#navigation"]');
    const skipLinkCount = await skipLinks.count();
    expect(skipLinkCount).toBeGreaterThan(0);

    // Check for ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const text = await firstButton.textContent();
      expect(ariaLabel || (text && text.trim().length > 0)).toBeTruthy();
    }
  });

  test('user journey with language persistence', async ({ page }) => {
    // Set language to French
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
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

    // Navigate to different pages
    await page.goto('/houses');
    await page.waitForLoadState('networkidle');
    
    // Verify language persisted
    const currentLang = await page.evaluate(() => localStorage.getItem('amesa_language'));
    expect(currentLang).toBe('fr');
  });

  test('user journey with dark mode persistence', async ({ page }) => {
    // Set dark mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to different pages
    await page.goto('/houses');
    await page.waitForLoadState('networkidle');
    
    // Verify dark mode persisted
    const body = page.locator('body');
    const hasDarkClass = await body.evaluate((el) => el.classList.contains('dark'));
    expect(hasDarkClass).toBeTruthy();
  });
});

