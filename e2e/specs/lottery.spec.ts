import { test, expect } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/auth-page';
import { LotteryPage } from '../helpers/page-objects/lottery-page';
import { testUsers } from '../helpers/test-data/test-users';

test.describe('Lottery Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.validUser.email, testUsers.validUser.password);
  });

  test('user can browse houses', async ({ page }) => {
    const lotteryPage = new LotteryPage(page);

    await lotteryPage.gotoHouses();
    const houseCount = await lotteryPage.getHouseCount();
    expect(houseCount).toBeGreaterThan(0);
  });

  test('user can view house details', async ({ page }) => {
    const lotteryPage = new LotteryPage(page);

    await lotteryPage.gotoHouses();
    await lotteryPage.gotoHouseDetails();

    // Should show house details
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('user can add house to favorites', async ({ page }) => {
    const lotteryPage = new LotteryPage(page);

    await lotteryPage.gotoHouses();
    await lotteryPage.gotoHouseDetails();
    await lotteryPage.addToFavorites();

    // Should show success message or update favorite button
    await expect(page.locator('.success, [data-testid="favorite-button"]')).toBeVisible();
  });

  test('user can purchase tickets', async ({ page }) => {
    const lotteryPage = new LotteryPage(page);

    await lotteryPage.gotoHouses();
    await lotteryPage.gotoHouseDetails();
    await lotteryPage.purchaseTickets(2);

    // Should show confirmation or redirect to payment
    await expect(page.locator('text=/confirm|payment|checkout/i')).toBeVisible();
  });
});










