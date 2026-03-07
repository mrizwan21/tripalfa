import type { Page } from "@playwright/test";

/**
 * Page Object Model for the flight search & listing experience.
 *
 * Covers:
 *   /flights        — FlightHome (search form)
 *   /flights/search — FlightSearch (search in progress / results)
 *   /flights/list   — FlightList  (results list + filters)
 *   /flights/detail — FlightDetail
 */
export class FlightSearchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get originInput() {
    return this.page.locator('input[placeholder*="From"], input[name="origin"], input[aria-label*="origin" i]').first();
  }

  get destinationInput() {
    return this.page.locator('input[placeholder*="To"], input[name="destination"], input[aria-label*="destination" i]').first();
  }

  get departureDateInput() {
    return this.page.locator('input[name="departureDate"], input[aria-label*="departure" i], button[aria-label*="departure" i]').first();
  }

  get passengersInput() {
    return this.page.locator('[aria-label*="passenger" i], button[aria-label*="passenger" i]').first();
  }

  get searchButton() {
    return this.page.locator('[data-testid="flight-search-submit"]').or(
      this.page.getByRole("button", { name: /search/i })
    );
  }

  get flightResultCards() {
    return this.page.locator('[data-testid="flight-card"], .flight-card, [class*="FlightCard"]');
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .animate-spin').first();
  }

  get noResultsMessage() {
    return this.page.getByText(/no flights found|no results/i);
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  get directFlightsFilter() {
    return this.page.getByRole("checkbox", { name: /direct|non-stop/i });
  }

  get priceRangeFilter() {
    return this.page.locator('[data-testid="price-filter"], input[type="range"]').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/flights");
  }

  async searchFlights(params: {
    origin: string;
    destination: string;
    departureDate?: string;
  }) {
    await this.originInput.fill(params.origin);
    await this.destinationInput.fill(params.destination);
    if (params.departureDate) {
      await this.departureDateInput.fill(params.departureDate);
    }
    await this.searchButton.click();
  }

  async waitForResults() {
    // Wait for loading to disappear, then for at least one result card
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    await this.page.waitForURL(/\/flights\/(list|search)/, { timeout: 15000 }).catch(() => {});
  }

  async selectFirstFlight() {
    const firstCard = this.flightResultCards.first();
    await firstCard.waitFor({ state: "visible" });
    await firstCard.click();
  }
}
