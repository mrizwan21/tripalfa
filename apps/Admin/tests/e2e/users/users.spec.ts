/**
 * E2E — B2B Admin: Users Module
 *
 * Covers: /users, /users/b2b-companies
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

test.describe("Users list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
  });

  test("renders the users page without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shows user table, grid, or empty-state", async ({ page }) => {
    const table = page.locator("table, [role='grid'], [data-testid='users-table']");
    const emptyState = page.getByText(/no users|no records/i);

    const tableVisible = await table.first().isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    expect(tableVisible || emptyVisible).toBeTruthy();
  });
});

test.describe("B2B Companies list", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/users/b2b-companies");
    await page.waitForLoadState("networkidle");
  });

  test("renders B2B companies page", async ({ page }) => {
    await expect(page.locator("h1, h2, main").first()).toBeVisible();
  });
});
