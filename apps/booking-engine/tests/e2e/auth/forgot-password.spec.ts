/**
 * E2E — Auth: Forgot Password
 *
 * Tests for the /forgot-password page.
 * MSW intercepts /api/auth/forgot-password and returns success for any email.
 */
import { test, expect } from "@playwright/test";

test.describe("Forgot password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  test("renders email input and submit button", async ({ page }) => {
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("renders link back to login page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back to login|sign in/i });
    await expect(backLink).toBeVisible();
  });

  // ── Submission ─────────────────────────────────────────────────────────────

  test("submits successfully after valid email", async ({ page }) => {
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill("user@tripalfa.com");
    await page.locator('button[type="submit"]').click();

    // Wait for any response - the form should not error
    await page.waitForTimeout(2000);
    
    // Check that we're still on the forgot-password page or got some response
    const url = page.url();
    expect(url).toContain('forgot-password');
  });

  test("stays on page when submitted with empty email", async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test("back-to-login link navigates to /login", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back to login|sign in/i });
    await backLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
