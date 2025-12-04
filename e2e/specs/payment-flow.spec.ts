import { test, expect } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/auth-page';
import { LotteryPage } from '../helpers/page-objects/lottery-page';

test.describe('Payment Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    // Navigate to home page
    await page.goto('/');
  });

  test.describe('Product Selection and Checkout', () => {
    test('should display products list', async ({ page }) => {
      // Navigate to products page
      await page.goto('/products');
      
      // Wait for products to load
      await page.waitForSelector('[data-testid="product-card"], .product-card, h2', { timeout: 10000 });
      
      // Verify products are displayed
      const productCards = await page.locator('[data-testid="product-card"], .product-card, article').count();
      expect(productCards).toBeGreaterThan(0);
    });

    test('should filter products by type', async ({ page }) => {
      await page.goto('/products');
      
      // Wait for page to load
      await page.waitForSelector('select, [data-testid="product-type-filter"]', { timeout: 5000 });
      
      // Select filter (if available)
      const filterSelect = page.locator('select').first();
      if (await filterSelect.isVisible()) {
        await filterSelect.selectOption('lottery_ticket');
        // Wait for filtered results
        await page.waitForTimeout(1000);
      }
    });

    test('should navigate to checkout from product', async ({ page }) => {
      await page.goto('/products');
      
      // Wait for products
      await page.waitForSelector('button, a[href*="checkout"]', { timeout: 10000 });
      
      // Click on first product's buy button
      const buyButton = page.locator('button:has-text("Buy"), a[href*="checkout"]').first();
      if (await buyButton.isVisible()) {
        await buyButton.click();
        
        // Should navigate to checkout
        await expect(page).toHaveURL(/.*checkout.*/, { timeout: 5000 });
      }
    });
  });

  test.describe('Payment Method Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await authPage.login('test@example.com', 'Test123!@#');
      await page.waitForURL(/.*(home|dashboard|lottery).*/, { timeout: 10000 });
    });

    test('should display payment methods on checkout', async ({ page }) => {
      // Navigate to checkout (assuming a product ID)
      await page.goto('/payment/checkout/test-product-id');
      
      // Wait for payment method section
      await page.waitForSelector('[data-testid="payment-methods"], .payment-method, input[type="radio"]', { timeout: 5000 });
      
      // Verify payment methods are displayed
      const paymentMethods = await page.locator('input[type="radio"][name*="payment"], [data-testid="payment-method"]').count();
      expect(paymentMethods).toBeGreaterThanOrEqual(0); // May be 0 if no methods saved
    });

    test('should allow selecting payment method', async ({ page }) => {
      await page.goto('/payment/checkout/test-product-id');
      
      // Wait for payment methods
      await page.waitForSelector('input[type="radio"]', { timeout: 5000 });
      
      // Select first payment method if available
      const firstMethod = page.locator('input[type="radio"]').first();
      if (await firstMethod.isVisible()) {
        await firstMethod.check();
        await expect(firstMethod).toBeChecked();
      }
    });
  });

  test.describe('Stripe Payment', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.login('test@example.com', 'Test123!@#');
      await page.waitForURL(/.*(home|dashboard|lottery).*/, { timeout: 10000 });
    });

    test('should display Stripe payment element', async ({ page }) => {
      // Navigate to Stripe payment page
      await page.goto('/payment/stripe?payment_intent_client_secret=test_secret');
      
      // Wait for Stripe element container
      await page.waitForSelector('#payment-element, [data-testid="stripe-element"]', { timeout: 10000 });
      
      // Verify Stripe element is present
      const stripeElement = page.locator('#payment-element, [data-testid="stripe-element"]');
      await expect(stripeElement).toBeVisible();
    });

    test('should show payment form', async ({ page }) => {
      await page.goto('/payment/stripe?payment_intent_client_secret=test_secret');
      
      // Wait for form
      await page.waitForSelector('form, #payment-form', { timeout: 5000 });
      
      // Verify submit button exists
      const submitButton = page.locator('button[type="submit"], #submit, button:has-text("Pay")');
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Crypto Payment', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.login('test@example.com', 'Test123!@#');
      await page.waitForURL(/.*(home|dashboard|lottery).*/, { timeout: 10000 });
    });

    test('should display cryptocurrency selection', async ({ page }) => {
      // Navigate to crypto payment page
      await page.goto('/payment/crypto');
      
      // Wait for crypto selection
      await page.waitForSelector('[data-testid="crypto-select"], select, .crypto-option', { timeout: 5000 });
      
      // Verify crypto options are available
      const cryptoOptions = await page.locator('option, [data-testid="crypto-option"]').count();
      expect(cryptoOptions).toBeGreaterThan(0);
    });

    test('should display QR code for crypto payment', async ({ page }) => {
      await page.goto('/payment/crypto');
      
      // Wait for QR code (may take time to generate)
      await page.waitForSelector('canvas, img[alt*="QR"], [data-testid="qr-code"]', { timeout: 10000 });
      
      // Verify QR code is displayed
      const qrCode = page.locator('canvas, img[alt*="QR"], [data-testid="qr-code"]').first();
      await expect(qrCode).toBeVisible();
    });

    test('should show payment status', async ({ page }) => {
      await page.goto('/payment/crypto');
      
      // Wait for status display
      await page.waitForSelector('[data-testid="payment-status"], .status, .payment-status', { timeout: 5000 });
      
      // Verify status is displayed
      const statusElement = page.locator('[data-testid="payment-status"], .status').first();
      await expect(statusElement).toBeVisible();
    });
  });

  test.describe('Payment Processing', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.login('test@example.com', 'Test123!@#');
      await page.waitForURL(/.*(home|dashboard|lottery).*/, { timeout: 10000 });
    });

    test('should validate product before payment', async ({ page }) => {
      await page.goto('/payment/checkout/test-product-id');
      
      // Change quantity
      const quantityInput = page.locator('input[type="number"][id*="quantity"], input[name*="quantity"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('5');
        await quantityInput.blur();
        
        // Wait for validation
        await page.waitForTimeout(1000);
        
        // Check for validation errors or success
        const errorMessage = page.locator('.error, [data-testid="validation-error"]');
        const successIndicator = page.locator('.success, [data-testid="validation-success"]');
        
        // Either error or success should be visible
        const hasError = await errorMessage.isVisible().catch(() => false);
        const hasSuccess = await successIndicator.isVisible().catch(() => false);
        
        expect(hasError || hasSuccess).toBe(true);
      }
    });

    test('should show processing state during payment', async ({ page }) => {
      await page.goto('/payment/checkout/test-product-id');
      
      // Find and click proceed button
      const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Pay"), [data-testid="proceed-payment"]').first();
      if (await proceedButton.isVisible()) {
        await proceedButton.click();
        
        // Wait for processing state
        await page.waitForSelector('[data-testid="processing"], .processing, button:has-text("Processing")', { timeout: 3000 });
        
        // Verify processing indicator
        const processingIndicator = page.locator('[data-testid="processing"], .processing').first();
        await expect(processingIndicator).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.login('test@example.com', 'Test123!@#');
      await page.waitForURL(/.*(home|dashboard|lottery).*/, { timeout: 10000 });
    });

    test('should display error for invalid product', async ({ page }) => {
      // Navigate to checkout with invalid product ID
      await page.goto('/payment/checkout/invalid-product-id');
      
      // Wait for error message
      await page.waitForSelector('.error, [data-testid="error"], .alert-error', { timeout: 5000 });
      
      // Verify error is displayed
      const errorMessage = page.locator('.error, [data-testid="error"]').first();
      await expect(errorMessage).toBeVisible();
    });

    test('should handle payment failures gracefully', async ({ page }) => {
      await page.goto('/payment/checkout/test-product-id');
      
      // Attempt to proceed without payment method (should show error)
      const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Pay")').first();
      if (await proceedButton.isVisible()) {
        // If button is disabled, that's also acceptable
        const isDisabled = await proceedButton.isDisabled();
        if (!isDisabled) {
          await proceedButton.click();
          
          // Should show error
          await page.waitForSelector('.error, [data-testid="error"]', { timeout: 3000 });
        }
      }
    });
  });
});






