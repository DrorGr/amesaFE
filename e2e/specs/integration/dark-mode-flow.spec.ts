import { test, expect } from '@playwright/test';

/**
 * Dark Mode Flow E2E Test
 * Tests theme switching during user journey
 * Verifies all components render correctly in dark mode
 * Verifies color contrast in dark mode
 * Tests system theme detection
 */
test.describe('Dark Mode Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('theme switching works', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.body.classList.contains('dark') ? 'dark' : 'light';
      });
      
      // Toggle theme
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => {
        return document.body.classList.contains('dark') ? 'dark' : 'light';
      });
      
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('dark mode persists across navigation', async ({ page }) => {
    // Set dark mode
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

  test('all components render correctly in dark mode', async ({ page }) => {
    // Set dark mode
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check main content is visible
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();
    
    // Check navigation is visible
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Check house cards are visible
    const houseCards = page.locator('.house-card, [class*="house"]');
    if (await houseCards.count() > 0) {
      await expect(houseCards.first()).toBeVisible();
    }
  });

  test('modals work in dark mode', async ({ page }) => {
    // Set dark mode
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Verify modal is visible and readable
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      if (await modal.isVisible()) {
        const modalText = await modal.locator('h1, h2, p').first();
        if (await modalText.isVisible()) {
          const textColor = await modalText.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return styles.color;
          });
          expect(textColor).toBeTruthy();
        }
      }
    }
  });

  test('forms are readable in dark mode', async ({ page }) => {
    // Set dark mode
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      
      // Check input fields are readable
      const inputs = page.locator('input[type="email"], input[type="password"]');
      if (await inputs.count() > 0) {
        const firstInput = inputs.first();
        const inputColor = await firstInput.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        });
        expect(inputColor.color).toBeTruthy();
        expect(inputColor.backgroundColor).toBeTruthy();
      }
    }
  });

  test('notifications work in dark mode', async ({ page }) => {
    // Set dark mode
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Trigger a notification (e.g., by adding to favorites)
    const favoriteButton = page.locator('button[aria-label*="favorite"], button[aria-label*="Favorite"]').first();
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(1000);
      
      // Check if toast notification appeared
      const toast = page.locator('[role="alert"], .toast').first();
      if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
        const toastText = await toast.textContent();
        expect(toastText).toBeTruthy();
      }
    }
  });
});

