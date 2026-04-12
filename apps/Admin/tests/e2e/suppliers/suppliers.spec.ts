/**
 * E2E — B2B Admin: Suppliers Module
 *
 * Covers: /suppliers, /suppliers/management, /suppliers/:id/gateway
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Suppliers list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/suppliers");
    await page.waitForLoadState("networkidle");
  });

  test("renders suppliers page without crashing", async ({ page }) => {
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("shows supplier cards, table, or empty-state", async ({ page }) => {
    const table = page.locator("table, [role='grid']");
    const empty = page.getByText(/no suppliers|no records/i);

    const tableVisible = await table.first().isVisible().catch(() => false);
    const emptyVisible = await empty.isVisible().catch(() => false);
    expect(tableVisible || emptyVisible).toBeTruthy();
  });
});

test.describe("Suppliers management", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/suppliers/management");
    await page.waitForLoadState("networkidle");
  });

  test("renders suppliers management page", async ({ page }) => {
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });
});
