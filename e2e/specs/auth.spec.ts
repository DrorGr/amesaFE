import { test, expect } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/auth-page';
import { testUsers } from '../helpers/test-data/test-users';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    const authPage = new AuthPage(page);

    // Register
    await authPage.gotoRegister();
    await authPage.register(testUsers.validUser);

    // Should redirect to login or home
    await expect(page).toHaveURL(/login|home|dashboard/i);

    // Login
    await authPage.gotoLogin();
    await authPage.login(testUsers.validUser.email, testUsers.validUser.password);

    // Should be logged in
    expect(await authPage.isLoggedIn()).toBe(true);
  });

  test('user cannot login with invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();
    await authPage.login(testUsers.invalidUser.email, testUsers.invalidUser.password);

    // Should show error message
    await expect(authPage.errorMessage).toBeVisible();
  });

  test('user can logout', async ({ page }) => {
    const authPage = new AuthPage(page);

    // Login first
    await authPage.gotoLogin();
    await authPage.login(testUsers.validUser.email, testUsers.validUser.password);
    expect(await authPage.isLoggedIn()).toBe(true);

    // Logout
    await page.click('button:has-text("Logout"), button:has-text("Sign Out")');

    // Should be logged out
    expect(await authPage.isLoggedIn()).toBe(false);
  });
});






