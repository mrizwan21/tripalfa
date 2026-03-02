import { BasePage } from "./BasePage";

export class FlightListPage extends BasePage {
  async selectFlight(index: number = 0) {
    await this.getByTestId(`flight-result-card-${index}`).click({
      force: true,
    });
    // Wait for the flight detail modal to appear instead of navigation
    await this.page.waitForSelector('[data-testid="flight-detail-modal"]', {
      timeout: 5000,
    });
  }
}
