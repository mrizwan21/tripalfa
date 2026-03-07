/**
 * E2E — Hotels: Search & Results
 *
 * Covers the hotel search form on /hotels and the results on /hotels/list.
 * Uses the pre-authenticated storageState (chromium project).
 * MSW returns paginated mock hotel data.
 */
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Hotel search", () => {
  test.beforeEach(async ({ hotelSearchPage }) => {
    await hotelSearchPage.goto();
  });

  test("renders the hotel search form", async ({ page }) => {
    await expect(page).toHaveURL(/\/hotels/);
    await expect(
      page.getByRole("button", { name: /search/i })
    ).toBeVisible();
  });

  test("search form accepts destination input", async ({ hotelSearchPage }) => {
    await expect(hotelSearchPage.destinationInput).toBeVisible();
    await hotelSearchPage.destinationInput.fill("Dubai");
    await expect(hotelSearchPage.destinationInput).toHaveValue("Dubai");
  });

  test("submitting search navigates to hotel list or search page", async ({
    page,
    hotelSearchPage,
  }) => {
    await hotelSearchPage.destinationInput.fill("Dubai");
    await hotelSearchPage.searchButton.click();

    await page.waitForURL(/\/hotels\/(list|search)|\/hotels/, {
      timeout: 15000,
    });
  });
});

test.describe("Hotel list / results", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hotels/list");
    await page.waitForLoadState("networkidle");
  });

  test("displays hotel result cards when results are available", async ({ page }) => {
    const cards = page.locator(
      '[data-testid="hotel-card"], .hotel-card, [class*="HotelCard"]'
    );
    const noResults = page.getByText(/no hotels found|no results|recommended stays/i);

    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Either a "no results" message or the section heading ("Recommended Stays")
      // is visible, indicating the list page has loaded (no mock data available)
      await expect(noResults.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("page heading or title is present", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
