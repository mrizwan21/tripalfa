/**
 * E2E — B2B Admin Auth: Forgot Password
 *
 * Tests for the /auth/forgot-password page.
 */
import { test, expect } from "@playwright/test";

test.describe("Forgot password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/forgot-password");
  });

  test("renders the email input and submit button", async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("renders a back-to-login link", async ({ page }) => {
    const link = page.getByRole("link", { name: /back|login|sign in/i });
    await expect(link).toBeVisible();
  });

  test("back-to-login navigates to /auth/login", async ({ page }) => {
    const link = page.getByRole("link", { name: /back|login|sign in/i });
    await link.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
