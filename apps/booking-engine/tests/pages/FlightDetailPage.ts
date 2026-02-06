import { BasePage } from './BasePage';

export class FlightDetailPage extends BasePage {
  async selectFlight() {
    await this.getByTestId('book-now-button').click({ force: true });
    // Wait for either ancillary popup or addons page
    try {
      await this.page.waitForSelector('[data-testid="confirm-ancillaries"]', { timeout: 2000 });
      // If ancillary popup appears, confirm it
      await this.getByTestId('confirm-ancillaries').click({ force: true });
    } catch (e) {
      // No ancillary popup, continue
    }
    // Wait for navigation to add-ons page
    await this.page.waitForSelector('[data-testid="addons-page"]', { timeout: 10000 });
  }
}
