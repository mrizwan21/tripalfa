import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("domcontentloaded");
  }

  get summaryCards() {
    return this.page.locator('[data-testid*="summary"], .card, [class*="card"]');
  }

  get totalBookingsStat() {
    return this.page.getByText(/total bookings|my bookings|reservations/i).first();
  }

  get recentBookings() {
    return this.page.locator('[data-testid*="recent"], [class*="recent"]');
  }

  get walletSection() {
    return this.page.getByText(/wallet|balance/i).first();
  }

  get documentsSection() {
    return this.page.getByText(/documents|files/i).first();
  }

  get newBookingLink() {
    return this.page.getByRole("link", { name: /new booking|book/i }).first();
  }
}
