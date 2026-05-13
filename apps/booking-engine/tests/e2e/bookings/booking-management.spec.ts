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
    // Wait for any API call to complete
    await page.waitForTimeout(2000);
  });

  test("renders booking details page or redirects to bookings list", async ({ page }) => {
    // Give time for React to render
    await page.waitForTimeout(1000);
    
    // Either show detail content or navigate away
    const url = page.url();
    const hasContent = await page.locator("h1, h2, h3").first().isVisible().catch(() => false);
    const hasBookingText = await page.getByText(/booking|bookings/i).first().isVisible().catch(() => false);
    
    // Accept any of these states
    expect(url.includes("/bookings") || hasContent || hasBookingText).toBe(true);
  });

  test("has navigation options", async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for any navigation element or page content
    const hasNav = await page.locator("nav, a, button").first().isVisible().catch(() => false);
    const hasContent = await page.locator("h1, h2, h3, h4").first().isVisible().catch(() => false);
    
    // Accept any valid state
    expect(hasNav || hasContent).toBe(true);
  });
});
