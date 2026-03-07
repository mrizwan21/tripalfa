import type { Page } from "@playwright/test";

export class LoyaltyPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/loyalty");
    await this.page.waitForLoadState("domcontentloaded");
  }

  get heading() {
    return this.page.locator("h1, h2").first();
  }

  get pointsDisplay() {
    return this.page.getByText(/points|balance/i).first();
  }

  get tierBadge() {
    return this.page.getByText(/bronze|silver|gold|platinum|diamond/i).first();
  }

  get redeemButton() {
    return this.page.getByRole("button", { name: /redeem/i }).first();
  }

  get historyButton() {
    return this.page.getByRole("button", { name: /history|transactions/i }).first();
  }

  get couponsSection() {
    return this.page.getByText(/coupons|vouchers/i).first();
  }
}
