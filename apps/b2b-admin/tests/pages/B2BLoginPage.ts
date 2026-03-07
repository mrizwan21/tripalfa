import type { Page } from "@playwright/test";

/** Page Object Model for /auth/login in the B2B Admin. */
export class B2BLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get emailInput() {
    return this.page.locator('input[name="email"], input[type="email"]').first();
  }

  get passwordInput() {
    return this.page.locator('input[name="password"], input[type="password"]').first();
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /forgot.?password/i });
  }

  get errorMessage() {
    return this.page.locator('[role="alert"], .text-red-500, .text-destructive').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/auth/login");
    await this.emailInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForRedirect(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), {
      timeout: 15000,
    });
  }
}
