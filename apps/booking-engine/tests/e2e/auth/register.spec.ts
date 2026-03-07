/**
 * E2E — Auth: Register
 *
 * Tests for the /register page.
 * MSW intercepts /api/auth/register — any submission with email + password succeeds.
 */
import { test, expect } from "@playwright/test";
import { RegisterPage } from "../../pages/RegisterPage";

test.describe("Register page", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  test("renders all registration form fields", async () => {
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test("renders link back to login page", async () => {
    await expect(registerPage.loginLink).toBeVisible();
  });

  // ── Successful registration ───────────────────────────────────────────────

  test("registers with valid data and redirects away from /register", async ({ page }) => {
    // Intercept the auth endpoint — MSW handler path mismatch means we use page.route()
    await page.route("**/auth/register", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mock_jwt_token_reg_12345",
          refreshToken: "mock_refresh_token_reg_67890",
          user: { id: "user_new", email: "newuser@tripalfa.com", name: "Test User", role: "customer" },
        }),
      });
    });

    await registerPage.register({
      firstName: "Test",
      lastName: "User",
      email: `newuser+${Date.now()}@tripalfa.com`,
      password: "Test@1234",
    });

    // After successful registration the app navigates to /login
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 15000,
    });
    await expect(page).not.toHaveURL(/\/register/);
  });

  // ── Form validation ─────────────────────────────────────────────────────

  test("stays on /register when submitted with empty fields", async ({ page }) => {
    await registerPage.submitButton.click();
    await expect(page).toHaveURL(/\/register/);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test("navigates to login page via link", async ({ page }) => {
    await registerPage.loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
