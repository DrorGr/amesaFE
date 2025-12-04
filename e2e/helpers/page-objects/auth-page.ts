/**
 * Page Object Model for Authentication pages
 */

import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.usernameInput = page.locator('input[name="username"]');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")');
    this.registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up")');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error, .alert-error, [role="alert"]');
    this.successMessage = page.locator('.success, .alert-success');
  }

  async gotoLogin() {
    await this.page.goto('/login');
  }

  async gotoRegister() {
    await this.page.goto('/register');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register(user: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  }) {
    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(user.email);
    }
    if (await this.usernameInput.isVisible()) {
      await this.usernameInput.fill(user.username);
    }
    if (await this.firstNameInput.isVisible()) {
      await this.firstNameInput.fill(user.firstName);
    }
    if (await this.lastNameInput.isVisible()) {
      await this.lastNameInput.fill(user.lastName);
    }
    if (await this.passwordInput.isVisible()) {
      await this.passwordInput.fill(user.password);
    }
    await this.submitButton.click();
  }

  async isLoggedIn(): Promise<boolean> {
    // Check for logout button or user menu
    const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu');
    return (await logoutButton.isVisible()) || (await userMenu.isVisible());
  }
}



















