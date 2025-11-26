import { test, expect } from '@playwright/test';
import { CookieConsentPage } from '../helpers/page-objects/cookie-consent-page';

test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('banner appears on first visit', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    
    // Wait for banner to appear
    await page.waitForTimeout(1000);
    
    const isVisible = await cookiePage.isBannerVisible();
    expect(isVisible).toBe(true);
  });

  test('banner does not appear after consent is given', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    
    // Set consent in localStorage
    await cookiePage.setConsentInStorage({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
      marketing: false,
      functional: true
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const isVisible = await cookiePage.isBannerVisible();
    expect(isVisible).toBe(false);
  });

  test('Accept All flow saves consent and hides banner', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Verify banner is visible
    expect(await cookiePage.isBannerVisible()).toBe(true);
    
    // Click Accept All
    await cookiePage.acceptAll();
    
    // Verify banner is hidden
    expect(await cookiePage.isBannerVisible()).toBe(false);
    
    // Verify consent is saved
    const consent = await cookiePage.getConsentFromStorage();
    expect(consent).toBeTruthy();
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(true);
    expect(consent.functional).toBe(true);
    expect(consent.essential).toBe(true);
  });

  test('Reject All flow saves only essential cookies and hides banner', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Verify banner is visible
    expect(await cookiePage.isBannerVisible()).toBe(true);
    
    // Click Reject All
    await cookiePage.rejectAll();
    
    // Verify banner is hidden
    expect(await cookiePage.isBannerVisible()).toBe(false);
    
    // Verify only essential cookies are enabled
    const consent = await cookiePage.getConsentFromStorage();
    expect(consent).toBeTruthy();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
    expect(consent.functional).toBe(false);
  });

  test('Customize flow opens preferences modal', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click Customize
    await cookiePage.openCustomize();
    
    // Verify preferences modal is visible
    expect(await cookiePage.isPreferencesModalVisible()).toBe(true);
  });

  test('Customize flow allows toggling categories and saving', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Open preferences
    await cookiePage.openCustomize();
    expect(await cookiePage.isPreferencesModalVisible()).toBe(true);
    
    // Toggle analytics
    await cookiePage.toggleCategory('analytics');
    
    // Toggle marketing
    await cookiePage.toggleCategory('marketing');
    
    // Save preferences
    await cookiePage.savePreferences();
    
    // Verify modal is closed
    expect(await cookiePage.isPreferencesModalVisible()).toBe(false);
    
    // Verify banner is hidden
    expect(await cookiePage.isBannerVisible()).toBe(false);
    
    // Verify consent is saved
    const consent = await cookiePage.getConsentFromStorage();
    expect(consent).toBeTruthy();
  });

  test('footer link opens preferences modal', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    
    // Set consent so banner is not visible
    await cookiePage.setConsentInStorage({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Click footer link
    await cookiePage.openFromFooter();
    
    // Verify preferences modal is visible
    expect(await cookiePage.isPreferencesModalVisible()).toBe(true);
  });

  test('consent persists across page reloads', async ({ page }) => {
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Accept all cookies
    await cookiePage.acceptAll();
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify banner does not reappear
    expect(await cookiePage.isBannerVisible()).toBe(false);
    
    // Verify consent still exists
    const consent = await cookiePage.getConsentFromStorage();
    expect(consent).toBeTruthy();
    expect(consent.analytics).toBe(true);
  });

  test('mobile responsiveness - banner displays correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Verify banner is visible on mobile
    expect(await cookiePage.isBannerVisible()).toBe(true);
    
    // Verify buttons are touch-friendly (check for min-height)
    const acceptButton = cookiePage.acceptAllButton;
    const buttonBox = await acceptButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // Touch-friendly minimum
  });

  test('mobile responsiveness - preferences modal displays as full-screen on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const cookiePage = new CookieConsentPage(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Open preferences
    await cookiePage.openCustomize();
    await page.waitForTimeout(500);
    
    // Verify modal is visible
    expect(await cookiePage.isPreferencesModalVisible()).toBe(true);
    
    // On mobile, modal should take full screen
    const modal = cookiePage.preferencesModal;
    const modalBox = await modal.boundingBox();
    const viewport = page.viewportSize();
    
    if (modalBox && viewport) {
      // Modal should be close to viewport size on mobile
      expect(modalBox.width).toBeGreaterThan(viewport.width * 0.9);
    }
  });
});



