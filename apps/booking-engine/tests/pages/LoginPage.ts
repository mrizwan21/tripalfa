import type { Page } from "@playwright/test";

/** Page Object Model for the /login route. */
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get emailInput() {
    return this.page.locator('input[name="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get errorMessage() {
    // The login form renders errors inside a <p> with role="alert" or similar
    return this.page.locator('[role="alert"], .text-red-500, .text-destructive').first();
  }

  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /forgot.?password/i });
  }

  get registerLink() {
    // Login page text: "create a new account"
    return this.page.getByRole("link", { name: /register|sign up|create.*account/i });
  }

  get googleLoginButton() {
    return this.page.getByRole("button", { name: /google/i });
  }

  get facebookLoginButton() {
    return this.page.getByRole("button", { name: /facebook/i });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/login");
    await this.emailInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForRedirect(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });
  }
}
