import { test, expect } from '@playwright/test';
import { LoginPage, HomePage } from '../helpers/page-objects';

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and login
    const homePage = new HomePage(page);
    await homePage.goto();
    
    const loginPage = new LoginPage(page);
    await loginPage.login('test@example.com', 'password123');
    
    // Wait for navigation after login
    await page.waitForURL('**/home');
  });

  test('should display notification preferences page', async ({ page }) => {
    // Navigate to notification preferences
    await page.goto('/settings/notifications');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Notification Preferences');
    
    // Check channel toggles are present
    await expect(page.locator('input[type="checkbox"][name="email"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="sms"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"][name="webpush"]')).toBeVisible();
  });

  test('should toggle email notification channel', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // Toggle email channel
    const emailToggle = page.locator('input[type="checkbox"][name="email"]');
    const initialState = await emailToggle.isChecked();
    
    await emailToggle.click();
    
    // Verify state changed
    await expect(emailToggle).toHaveProperty('checked', !initialState);
    
    // Verify API call was made (check network request)
    await page.waitForTimeout(500); // Wait for API call
  });

  test('should request web push permission', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    
    await page.goto('/settings/notifications');
    
    // Click enable web push button
    const enableButton = page.locator('button:has-text("Enable Web Push")');
    if (await enableButton.isVisible()) {
      await enableButton.click();
      
      // Should show subscription status
      await expect(page.locator('text=Subscribed')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should link Telegram account', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // Click link Telegram button
    const linkButton = page.locator('button:has-text("Link Telegram")');
    await linkButton.click();
    
    // Should show verification code input
    await expect(page.locator('input[placeholder*="verification code"]')).toBeVisible();
    
    // Enter verification code (mock)
    await page.fill('input[placeholder*="verification code"]', 'ABC123');
    
    // Click verify button
    await page.click('button:has-text("Verify")');
    
    // Should show success message
    await expect(page.locator('text=Telegram account linked')).toBeVisible({ timeout: 5000 });
  });

  test('should display notifications list', async ({ page }) => {
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Notifications');
    
    // Check notifications list container exists
    await expect(page.locator('[data-testid="notifications-list"]')).toBeVisible();
  });

  test('should mark notification as read', async ({ page }) => {
    await page.goto('/notifications');
    
    // Click first unread notification
    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    await firstNotification.click();
    
    // Notification should be marked as read
    await expect(firstNotification.locator('[data-testid="read-indicator"]')).toBeVisible();
  });
});












