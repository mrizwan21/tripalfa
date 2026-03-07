/**
 * E2E — B2B Admin Auth: Login
 *
 * Tests for the /auth/login page.
 * Playwright route interceptors mock the auth API endpoint.
 *
 * Uses the "auth" project (no pre-loaded storageState).
 */
import { test, expect } from "@playwright/test";
import { B2BLoginPage } from "../../pages/B2BLoginPage";

test.describe("B2B Admin login page", () => {
  let loginPage: B2BLoginPage;

  test.beforeEach(async ({ page }) => {
    // Intercept the login API so tests don't need a real backend
    await page.route("**/auth/login", async (route) => {
      const req = route.request();
      const body = req.postDataJSON() as { email?: string; password?: string };

      if (body?.email && body?.password) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "mock_admin_jwt_token_tripalfa",
            data: {
              token: "mock_admin_jwt_token_tripalfa",
              user: {
                id: "admin_001",
                email: body.email,
                name: "Test Admin",
                role: "ADMIN",
                permissions: ["*"],
              },
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid credentials" }),
        });
      }
    });

    loginPage = new B2BLoginPage(page);
    await loginPage.goto();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  test("renders email, password inputs and submit button", async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("renders forgot-password link", async () => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  // ── Form validation ─────────────────────────────────────────────────────

  test("stays on login page when submitted empty", async ({ page }) => {
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // ── Successful login ──────────────────────────────────────────────────────

  test("logs in with valid credentials and redirects away from login", async ({ page }) => {
    await loginPage.loginAndWaitForRedirect("admin@tripalfa.com", "Admin@1234");
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test("forgot-password link navigates to forgot-password page", async ({ page }) => {
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});
