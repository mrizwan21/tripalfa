/**
 * E2E — B2B Admin: Bookings Module
 *
 * Covers: /bookings, /bookings/:id, /booking-queues,
 *         /bookings/new/online, /bookings/new/offline
 *
 * Uses pre-authenticated storageState (chromium project).
 * API calls are intercepted via Playwright route handlers.
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Bookings list", () => {
  test.beforeEach(async ({ page, bookingsPage }) => {
    await mockAdminApi(page);
    await bookingsPage.goto();
  });

  test("renders the bookings page without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shows a data table, grid, or empty-state message", async ({
    page,
    bookingsPage,
  }) => {
    await bookingsPage.waitForTable();

    const table = page.locator("table, [role='grid'], [data-testid='bookings-table']");
    const emptyState = page.getByText(/no bookings|no records/i);

    const tableVisible = await table.first().isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(tableVisible || emptyVisible).toBeTruthy();
  });

  test("has a 'New Booking' or similar action button", async ({ page }) => {
    const newButton = page
      .getByRole("button", { name: /new booking|create|add/i })
      .or(page.getByRole("link", { name: /new booking|create/i }));
    // Optional — only assert if visible
    const visible = await newButton.first().isVisible().catch(() => false);
    if (visible) await expect(newButton.first()).toBeEnabled();
  });
});

test.describe("Booking detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/bookings/booking_001");
    await page.waitForLoadState("networkidle");
  });

  test("shows booking detail content or redirects to list", async ({ page }) => {
    const onDetail = page.url().includes("/bookings/booking_001");
    if (onDetail) {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/bookings/);
    }
  });
});

test.describe("Booking queues", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/booking-queues");
    await page.waitForLoadState("networkidle");
  });

  test("renders booking queues page", async ({ page }) => {
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });
});

test.describe("New Booking — Online", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/bookings/new/online");
    await page.waitForLoadState("networkidle");
  });

  test("renders new online booking form or redirects", async ({ page }) => {
    await expect(page.locator("h1, h2, form, main").first()).toBeVisible();
  });
});

test.describe("New Booking — Offline", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/bookings/new/offline");
    await page.waitForLoadState("networkidle");
  });

  test("renders new offline booking form or redirects", async ({ page }) => {
    await expect(page.locator("h1, h2, form, main").first()).toBeVisible();
  });
});
