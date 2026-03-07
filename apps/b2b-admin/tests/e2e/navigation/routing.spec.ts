/**
 * E2E — B2B Admin: Navigation & Routing
 *
 * Smoke tests for main navigation, protected routes, and module accessibility.
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Authenticated navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
  });

  test("/ loads the dashboard without error", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main, #root").first()).toBeVisible();
  });

  test("/analytics loads without error", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("/notifications loads without error", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("/branding loads without error", async ({ page }) => {
    await page.goto("/branding");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("/inventory loads without error", async ({ page }) => {
    await page.goto("/inventory");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("/documents loads without error", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });
});

test.describe("Auth gate — unauthenticated access", () => {
  test("accessing /bookings without auth redirects to login", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("http://localhost:5177/bookings");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url.includes("/auth/login") || url.includes("/auth")).toBeTruthy();
    await context.close();
  });
});
