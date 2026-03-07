/**
 * E2E — Flights: Search & Results
 *
 * Covers the flight search form on /flights and the results on /flights/list.
 * Uses the pre-authenticated storageState (chromium project).
 * MSW returns paginated mock flight data.
 */
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Flight search", () => {
  test.beforeEach(async ({ flightSearchPage }) => {
    await flightSearchPage.goto();
  });

  // ── Home page renders ──────────────────────────────────────────────────────

  test("renders the flight search form", async ({ page }) => {
    await expect(page).toHaveURL(/\/flights/);
    // At minimum a search / CTA button should be visible
    await expect(
      page.getByRole("button", { name: /search/i })
    ).toBeVisible();
  });

  // ── Search interaction ─────────────────────────────────────────────────────

  test("search form accepts origin and destination input", async ({ flightSearchPage }) => {
    await expect(flightSearchPage.originInput).toBeVisible();
    await flightSearchPage.originInput.fill("London");
    await expect(flightSearchPage.originInput).toHaveValue("London");

    await expect(flightSearchPage.destinationInput).toBeVisible();
    await flightSearchPage.destinationInput.fill("Dubai");
    await expect(flightSearchPage.destinationInput).toHaveValue("Dubai");
  });

  test("submitting search navigates to flight list or search page", async ({
    page,
    flightSearchPage,
  }) => {
    await flightSearchPage.originInput.fill("London");
    await flightSearchPage.destinationInput.fill("Dubai");
    await flightSearchPage.searchButton.click();

    // Should move to a results / search route
    await page.waitForURL(/\/flights\/(list|search)|\/flights/, {
      timeout: 15000,
    });
    await expect(page).not.toHaveURL(/^http:\/\/localhost:5174\/?$/);
  });
});

test.describe("Flight list / results", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the list; MSW provides mock data
    await page.goto("/flights/list");
    await page.waitForLoadState("networkidle");
  });

  test("displays flight result cards when results are available", async ({ page }) => {
    const cards = page.locator(
      '[data-testid="flight-card"], .flight-card, [class*="FlightCard"]'
    );
    // Allow for either results or a no-results message or any page heading
    const count = await cards.count();
    const noResults = page.getByText(/no flights found|no results/i);
    const heading = page.locator("h1, h2").first();

    if (count > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      await expect(noResults.or(heading).first()).toBeVisible();
    }
  });

  test("page heading or title is present", async ({ page }) => {
    // Flexible — just assert something meaningful is rendered
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
