import type { Page } from "@playwright/test";

/**
 * Page Object Model for the hotel search & listing experience.
 *
 * Covers:
 *   /hotels        — HotelHome (search form)
 *   /hotels/search — HotelSearch
 *   /hotels/list   — HotelList (results list + filters)
 *   /hotels/:id    — HotelDetail
 */
export class HotelSearchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get destinationInput() {
    return this.page.locator('[data-testid="hotel-city"], input[placeholder*="city" i], input[placeholder*="destination" i], input[name="destination"], input[aria-label*="destination" i]').first();
  }

  get checkInInput() {
    return this.page.locator('input[name="checkIn"], input[aria-label*="check.in" i], button[aria-label*="check.in" i]').first();
  }

  get checkOutInput() {
    return this.page.locator('input[name="checkOut"], input[aria-label*="check.out" i], button[aria-label*="check.out" i]').first();
  }

  get guestsInput() {
    return this.page.locator('[aria-label*="guest" i], input[name="guests"]').first();
  }

  get searchButton() {
    return this.page.locator('[data-testid="hotel-search-submit"]').or(
      this.page.getByRole("button", { name: /search/i })
    );
  }

  get hotelResultCards() {
    return this.page.locator('[data-testid="hotel-card"], .hotel-card, [class*="HotelCard"]');
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .animate-spin').first();
  }

  get noResultsMessage() {
    return this.page.getByText(/no hotels found|no results/i);
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  get starRatingFilter() {
    return this.page.locator('[data-testid="star-filter"]').first();
  }

  get priceRangeFilter() {
    return this.page.locator('input[type="range"]').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/hotels");
  }

  async searchHotels(params: {
    destination: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }) {
    await this.destinationInput.fill(params.destination);
    if (params.checkIn) await this.checkInInput.fill(params.checkIn);
    if (params.checkOut) await this.checkOutInput.fill(params.checkOut);
    await this.searchButton.click();
  }

  async waitForResults() {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    await this.page.waitForURL(/\/hotels\/(list|search)/, { timeout: 15000 }).catch(() => {});
  }

  async selectFirstHotel() {
    const firstCard = this.hotelResultCards.first();
    await firstCard.waitFor({ state: "visible" });
    await firstCard.click();
  }
}
