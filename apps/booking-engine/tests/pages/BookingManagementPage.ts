import type { Page } from "@playwright/test";

/** Page Object Model for the /bookings and /bookings/:id routes. */
export class BookingManagementPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get bookingRows() {
    return this.page.locator('[data-testid="booking-row"], [class*="BookingCard"], tr[data-booking-id]');
  }

  get searchInput() {
    return this.page.locator('input[placeholder*="search" i], input[aria-label*="search" i]').first();
  }

  get statusFilter() {
    return this.page.locator('select[name="status"], [aria-label*="status" i]').first();
  }

  get emptyState() {
    return this.page.getByText(/no bookings|you have no/i);
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .animate-spin').first();
  }

  // Booking detail page elements
  get bookingReference() {
    return this.page.locator('[data-testid="booking-ref"], [class*="reference"]').first();
  }

  get cancelBookingButton() {
    return this.page.getByRole("button", { name: /cancel booking/i });
  }

  get downloadTicketButton() {
    return this.page.getByRole("button", { name: /download|ticket|voucher/i });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/bookings");
    await this.page.waitForLoadState("networkidle");
  }

  async waitForBookings() {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }

  async openBookingById(id: string) {
    await this.page.goto(`/bookings/${id}`);
    await this.page.waitForLoadState("networkidle");
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }
}
