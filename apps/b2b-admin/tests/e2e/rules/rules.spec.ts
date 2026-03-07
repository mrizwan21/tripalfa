/**
 * E2E — B2B Admin: Rules Module
 *
 * Covers: /rules
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Rules list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/rules");
    await page.waitForLoadState("networkidle");
  });

  test("renders rules page without crashing", async ({ page }) => {
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });

  test("shows rules table, cards, or empty-state", async ({ page }) => {
    const table = page.locator("table, [role='grid'], [data-testid='rules-list']");
    const empty = page.getByText(/no rules|no records/i);

    const tableVisible = await table.first().isVisible().catch(() => false);
    const emptyVisible = await empty.isVisible().catch(() => false);
    expect(tableVisible || emptyVisible).toBeTruthy();
  });
});
