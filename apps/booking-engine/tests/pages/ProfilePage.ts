import type { Page } from "@playwright/test";

export class ProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/profile");
    await this.page.waitForLoadState("domcontentloaded");
  }

  get heading() {
    return this.page.locator("h1, h2").first();
  }

  get nameInput() {
    return this.page
      .locator(
        'input[name*="name" i], input[placeholder*="name" i], input[name="firstName"], input[name="lastName"]',
      )
      .first();
  }

  get emailInput() {
    return this.page.locator('input[type="email"], input[name*="email" i]').first();
  }

  get phoneInput() {
    return this.page
      .locator('input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i]')
      .first();
  }

  get saveButton() {
    return this.page.getByRole("button", { name: /save|update|submit/i }).first();
  }

  get logoutButton() {
    return this.page.getByRole("button", { name: /logout|sign out/i }).first();
  }

  get loyaltySection() {
    return this.page.getByText(/loyalty|points|tier/i).first();
  }

  get documentUploadInput() {
    // The avatar also has a hidden file input; target the documents-tab one specifically.
    return this.page
      .locator('#profile-doc-file, input[name="profile-doc-file"]')
      .or(this.page.locator('input[type="file"]:not(.hidden)'))
      .first();
  }

  get uploadButton() {
    return this.page.getByRole("button", { name: /upload/i }).first();
  }

  async uploadFile(file: string) {
    await this.page.route("**/flights/list*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await this.page.setInputFiles("input[name='profile-doc-file']", file);
  }
}
