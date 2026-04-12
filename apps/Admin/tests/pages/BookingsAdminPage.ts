import type { Page } from "@playwright/test";

/** Page Object Model for the /bookings module in B2B Admin. */
export class BookingsAdminPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get bookingRows() {
    return this.page.locator('tr[data-booking-id], [data-testid="booking-row"], tbody tr');
  }

  get searchInput() {
    return this.page.locator('input[placeholder*="search" i], input[aria-label*="search" i]').first();
  }

  get newBookingButton() {
    return this.page.getByRole("button", { name: /new booking|create booking/i });
  }

  get emptyState() {
    return this.page.getByText(/no bookings|no records/i);
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .animate-spin').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/bookings");
    await this.page.waitForLoadState("networkidle");
  }

  async waitForTable() {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }

  async openBookingById(id: string) {
    await this.page.goto(`/bookings/${id}`);
    await this.page.waitForLoadState("networkidle");
  }
}
