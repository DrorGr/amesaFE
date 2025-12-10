import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Cookie Consent Banner
 * Provides methods to interact with cookie consent UI elements
 */
export class CookieConsentPage {
  constructor(private page: Page) {}

  // Banner elements
  get banner(): Locator {
    return this.page.locator('app-cookie-consent').locator('text=We use cookies').locator('..').first();
  }

  get acceptAllButton(): Locator {
    return this.page.locator('button:has-text("Accept All")').first();
  }

  get rejectAllButton(): Locator {
    return this.page.locator('button:has-text("Reject All")').first();
  }

  get customizeButton(): Locator {
    return this.page.locator('button:has-text("Customize")').first();
  }

  // Preferences modal elements
  get preferencesModal(): Locator {
    return this.page.locator('[role="dialog"]').filter({ hasText: 'Cookie Preferences' });
  }

  get preferencesTitle(): Locator {
    return this.page.locator('h2:has-text("Cookie Preferences")');
  }

  get analyticsToggle(): Locator {
    return this.page.locator('input[type="checkbox"]').filter({ hasText: 'Analytics' }).first();
  }

  get marketingToggle(): Locator {
    return this.page.locator('input[type="checkbox"]').filter({ hasText: 'Marketing' }).first();
  }

  get functionalToggle(): Locator {
    return this.page.locator('input[type="checkbox"]').filter({ hasText: 'Functional' }).first();
  }

  get savePreferencesButton(): Locator {
    return this.page.locator('button:has-text("Save Preferences")');
  }

  get cancelButton(): Locator {
    return this.page.locator('button[aria-label*="Cancel"], button:has-text("Cancel")').first();
  }

  get closeButton(): Locator {
    return this.page.locator('button[aria-label*="Cancel"], svg[viewBox="0 0 24 24"]').first();
  }

  // Footer link
  get footerCookiePreferencesLink(): Locator {
    return this.page.locator('footer button:has-text("Cookie Preferences"), footer a:has-text("Cookie Preferences")');
  }

  /**
   * Check if banner is visible
   */
  async isBannerVisible(): Promise<boolean> {
    try {
      return await this.banner.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if preferences modal is visible
   */
  async isPreferencesModalVisible(): Promise<boolean> {
    try {
      return await this.preferencesModal.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Click Accept All button
   */
  async acceptAll(): Promise<void> {
    await this.acceptAllButton.click();
    await this.page.waitForTimeout(500); // Wait for animation
  }

  /**
   * Click Reject All button
   */
  async rejectAll(): Promise<void> {
    await this.rejectAllButton.click();
    await this.page.waitForTimeout(500); // Wait for animation
  }

  /**
   * Click Customize button to open preferences
   */
  async openCustomize(): Promise<void> {
    await this.customizeButton.click();
    await this.page.waitForTimeout(500); // Wait for modal to open
  }

  /**
   * Open preferences modal from footer link
   */
  async openFromFooter(): Promise<void> {
    await this.footerCookiePreferencesLink.click();
    await this.page.waitForTimeout(500); // Wait for modal to open
  }

  /**
   * Toggle a specific cookie category
   */
  async toggleCategory(category: 'analytics' | 'marketing' | 'functional'): Promise<void> {
    const toggle = category === 'analytics' 
      ? this.analyticsToggle 
      : category === 'marketing' 
      ? this.marketingToggle 
      : this.functionalToggle;
    
    await toggle.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Save preferences
   */
  async savePreferences(): Promise<void> {
    await this.savePreferencesButton.click();
    await this.page.waitForTimeout(500); // Wait for modal to close
  }

  /**
   * Close preferences modal
   */
  async closePreferences(): Promise<void> {
    await this.closeButton.click();
    await this.page.waitForTimeout(500); // Wait for modal to close
  }

  /**
   * Get consent from localStorage
   */
  async getConsentFromStorage(): Promise<any> {
    return await this.page.evaluate(() => {
      const stored = localStorage.getItem('amesa_cookie_consent');
      return stored ? JSON.parse(stored) : null;
    });
  }

  /**
   * Clear consent from localStorage (for testing)
   */
  async clearConsent(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('amesa_cookie_consent');
    });
  }

  /**
   * Set consent in localStorage (for testing)
   */
  async setConsentInStorage(consent: any): Promise<void> {
    await this.page.evaluate((consentData) => {
      localStorage.setItem('amesa_cookie_consent', JSON.stringify(consentData));
    }, consent);
  }

  /**
   * Check if consent exists in localStorage
   */
  async hasConsent(): Promise<boolean> {
    const consent = await this.getConsentFromStorage();
    return consent !== null;
  }
}
























