import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Critical paths that must work
 * These tests run on every commit
 */
test.describe('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Amesa|Home/i);
  });

  test('user can view houses', async ({ page }) => {
    await page.goto('/');
    // Look for house cards or house grid
    const houseElements = page.locator('.house-card, [data-testid="house-card"], .house-grid');
    await expect(houseElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('user can navigate to login', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Login"), button:has-text("Login")');
    await expect(page).toHaveURL(/login/i);
  });
});















