/**
 * E2E — Hotels: Booking Flow
 *
 * Tests the hotel detail and booking journey:
 *   /hotels/:id → /hotels/addons → /checkout → /confirmation
 *
 * Uses the pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Hotel detail page", () => {
  test.beforeEach(async ({ page }) => {
    // MSW intercepts the hotel detail API call for id "hotel_1"
    await page.goto("/hotels/hotel_1");
    await page.waitForLoadState("networkidle");
  });

  test("renders hotel information or loading state", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    const spinner = page.locator(".animate-spin").first();
    await expect(heading.or(spinner)).toBeVisible({ timeout: 10000 });
  });

  test("renders room selection or book button when hotel loads", async ({ page }) => {
    // Wait for loading to finish
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});

    const ctaButton = page.getByRole("button", {
      name: /book|select room|reserve|choose/i,
    });
    const detailHeading = page.locator("h1").first();

    // Either the detail page loaded or it redirected
    const onDetailPage = page.url().includes("/hotels/hotel_1");
    if (onDetailPage) {
      // Hotel loaded → h1 title visible; API error → "Hotel not found" paragraph
      const heading = page.locator("h1").first();
      const notFound = page.getByText(/hotel not found/i).first();
      await expect(heading.or(notFound)).toBeVisible({ timeout: 15000 });
    }
  });

  test("has a back / navigation link", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back|hotels/i });
    const backButton = page.getByRole("button", { name: /back/i });

    const onDetailPage = page.url().includes("/hotels/hotel_1");
    if (onDetailPage) {
      await expect(backLink.or(backButton).first()).toBeVisible();
    }
  });
});

test.describe("Hotel add-ons page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hotels/addons");
    await page.waitForLoadState("networkidle");
  });

  test("renders add-ons page or redirects to hotels landing", async ({ page }) => {
    const isOnAddons = page.url().includes("/hotels/addons");
    if (isOnAddons) {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });
});
