/**
 * E2E — B2B Admin: Finance Module
 *
 * Covers: /finance, /finance/currencies, /finance/reports/b2b, /finance/reports/b2c
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

const financeRoutes = [
  { name: "Finance overview", path: "/finance" },
  { name: "Currency list", path: "/finance/currencies" },
  { name: "B2B reports", path: "/finance/reports/b2b" },
  { name: "B2C reports", path: "/finance/reports/b2c" },
];

for (const { name, path } of financeRoutes) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminApi(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    });

    test(`renders ${name} page without crashing`, async ({ page }) => {
      await expect(page.locator("h1, h2, main").first()).toBeVisible();
    });
  });
}
