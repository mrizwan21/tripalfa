import type { Page } from "@playwright/test";

export class BookingDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(bookingId = "booking_123") {
    await this.page.goto(`/bookings/${bookingId}`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  get heading() {
    return this.page.locator("h1, h2").first();
  }

  get backButton() {
    return this.page
      .getByRole("link", { name: /back|bookings/i })
      .or(this.page.getByRole("button", { name: /back/i }))
      .first();
  }

  get cancelButton() {
    return this.page.getByRole("button", { name: /cancel/i }).first();
  }

  get downloadButton() {
    return this.page.getByRole("button", { name: /download|e-ticket|invoice/i }).first();
  }

  get statusBadge() {
    return this.page
      .locator('[data-testid*="status"], [class*="status"], [class*="badge"]')
      .first();
  }

  get seatSelectionButton() {
    return this.page.getByRole("button", { name: /seat|manage seat/i }).first();
  }

  get baggageButton() {
    return this.page.getByRole("button", { name: /baggage|luggage/i }).first();
  }

  get mealButton() {
    return this.page.getByRole("button", { name: /meal|food/i }).first();
  }

  get specialRequestButton() {
    return this.page.getByRole("button", { name: /special|request|assistance/i }).first();
  }

  get refreshButton() {
    return this.page.getByRole("button", { name: /refresh|reload|update/i }).first();
  }
}
