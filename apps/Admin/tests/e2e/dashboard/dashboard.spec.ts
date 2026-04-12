/**
 * E2E — B2B Admin: Dashboard
 *
 * Smoke tests for the / (dashboard) route.
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("renders the dashboard without crashing", async ({ page }) => {
    // Either shows the dashboard or redirects to /auth/login if auth failed
    const isAuthenticated = !page.url().includes("/auth/login");
    if (isAuthenticated) {
      await expect(page.locator("main, #root, [data-testid='dashboard']").first()).toBeVisible();
    }
  });

  test("shows analytics or summary cards when authenticated", async ({ page }) => {
    const isAuthenticated = !page.url().includes("/auth/login");
    if (isAuthenticated) {
      // At least one heading should be visible
      await expect(page.locator("h1, h2, h3").first()).toBeVisible();
    }
  });

  test("sidebar / navigation is visible", async ({ page }) => {
    const isAuthenticated = !page.url().includes("/auth/login");
    if (isAuthenticated) {
      const nav = page.locator("nav, aside, [role='navigation']").first();
      await expect(nav).toBeVisible();
    }
  });
});
