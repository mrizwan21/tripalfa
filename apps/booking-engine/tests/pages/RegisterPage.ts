import type { Page } from "@playwright/test";

/** Page Object Model for the /register route. */
export class RegisterPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get firstNameInput() {
    return this.page.locator('input[name="firstName"]');
  }

  get lastNameInput() {
    return this.page.locator('input[name="lastName"]');
  }

  get emailInput() {
    return this.page.locator('input[name="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]');
  }

  get confirmPasswordInput() {
    return this.page.locator('input[name="confirmPassword"]');
  }

  get termsCheckbox() {
    return this.page.locator('input[name="terms"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get loginLink() {
    return this.page.getByRole("link", { name: /login|sign in/i });
  }

  get errorMessage() {
    return this.page.locator('[role="alert"], .text-red-500, .text-destructive').first();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/register");
    await this.emailInput.waitFor({ state: "visible" });
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string; // kept for API compatibility but field is not in the form
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    // Register.tsx does not have a confirmPassword input field
    // The form has a required "I agree to Terms" checkbox — must be checked before submit
    await this.termsCheckbox.check();
    await this.submitButton.click();
  }
}
