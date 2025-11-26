/**
 * Page Object Model for Lottery pages
 */

import { Page, Locator } from '@playwright/test';

export class LotteryPage {
  readonly page: Page;
  readonly houseCards: Locator;
  readonly favoriteButton: Locator;
  readonly ticketPurchaseButton: Locator;
  readonly ticketQuantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.houseCards = page.locator('.house-card, [data-testid="house-card"]');
    this.favoriteButton = page.locator('button:has-text("Favorite"), [data-testid="favorite-button"]');
    this.ticketPurchaseButton = page.locator('button:has-text("Buy Tickets"), button:has-text("Purchase")');
    this.ticketQuantityInput = page.locator('input[name="quantity"], input[name="ticketCount"]');
    this.addToCartButton = page.locator('button:has-text("Add to Cart")');
    this.checkoutButton = page.locator('button:has-text("Checkout")');
  }

  async gotoHouses() {
    await this.page.goto('/');
  }

  async gotoHouseDetails(houseId?: string) {
    if (houseId) {
      await this.page.goto(`/houses/${houseId}`);
    } else {
      // Click first house card
      await this.houseCards.first().click();
    }
  }

  async addToFavorites() {
    await this.favoriteButton.first().click();
  }

  async purchaseTickets(quantity: number = 1) {
    await this.ticketQuantityInput.fill(quantity.toString());
    await this.ticketPurchaseButton.click();
  }

  async getHouseCount(): Promise<number> {
    return await this.houseCards.count();
  }
}





