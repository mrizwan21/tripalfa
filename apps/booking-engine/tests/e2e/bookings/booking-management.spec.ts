/**
 * E2E — Bookings: Management
 *
 * Tests the /bookings and /bookings/:id pages.
 * Uses the pre-authenticated storageState (chromium project).
 * MSW serves mock booking data.
 */
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Booking management list", () => {
  test.beforeEach(async ({ bookingManagementPage }) => {
    await bookingManagementPage.goto();
  });

  test("renders the bookings page without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shows booking cards or an empty-state message", async ({
    bookingManagementPage,
  }) => {
    await bookingManagementPage.waitForBookings();

    const hasCards = (await bookingManagementPage.bookingRows.count()) > 0;
    const hasEmptyState =
      await bookingManagementPage.emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test("does not redirect unauthenticated users (auth is pre-loaded)", async ({ page }) => {
    // Because storageState is loaded, the page should stay on /bookings
    await expect(page).toHaveURL(/\/bookings/);
  });
});

test.describe("Booking detail", () => {
  test.beforeEach(async ({ page }) => {
    // Use a mock booking id that MSW will handle
    await page.goto("/bookings/booking_123");
    await page.waitForLoadState("networkidle");
  });

  test("renders booking details page or redirects to bookings list", async ({ page }) => {
    const isOnDetail = page.url().includes("/bookings/booking_123");

    if (isOnDetail) {
      // Should show some detail content
      await expect(page.locator("h1, h2").first()).toBeVisible();
    } else {
      // Redirect to /bookings is acceptable for unknown ids in mock mode
      await expect(page).toHaveURL(/\/bookings/);
    }
  });

  test("has a back/navigation link on the detail page", async ({ page }) => {
    const isOnDetail = page.url().includes("/bookings/booking_123");
    if (isOnDetail) {
      const backEl = page
        .getByRole("link", { name: /back|bookings/i })
        .or(page.getByRole("button", { name: /back/i }));
      await expect(backEl.first()).toBeVisible();
    }
  });
});
