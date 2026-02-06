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
    // Reduced timeout from 60000 to 30000ms for faster failure feedback
    // This is a fallback method - prefer waitForURL when possible
    await this.page.waitForNavigation({ timeout: 30000 });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Set select element value using JavaScript (bypasses option validation)
   * Useful for hidden form elements where selectOption() times out
   * @param selector Can be a data-testid string or a CSS selector
   * @param value The value to select
   */
  async setSelectValue(selector: string, value: string) {
    // First try as data-testid, if it contains dots or looks like a name attribute, use CSS selector
    let locator;
    if (selector.includes('.') || selector.includes('[')) {
      // Assume it's a CSS selector or name attribute
      if (selector.startsWith('[')) {
        locator = this.page.locator(selector);
      } else {
        // Try name attribute selector
        locator = this.page.locator(`select[name="${selector}"]`);
      }
    } else {
      // Assume it's a data-testid
      locator = this.page.locator(`[data-testid="${selector}"]`);
    }

    await locator.evaluate(
      (element, val) => {
        if (element instanceof HTMLSelectElement) {
          element.value = val;
          // Trigger change event
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      value
    );
  }
}

