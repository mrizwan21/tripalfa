import { Page, Locator } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForElement(selector: string) {
    return this.page.waitForSelector(selector, { timeout: 30000 });
  }

  async waitForNavigation() {
    await this.page.waitForNavigation({ timeout: 60000 });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}
