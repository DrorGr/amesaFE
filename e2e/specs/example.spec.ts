import { test, expect } from '@playwright/test';

/**
 * Example E2E test to verify Playwright setup
 * This test will be replaced with actual test scenarios
 */
test.describe('Example Test', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Amesa|Home/i);
  });
});




















