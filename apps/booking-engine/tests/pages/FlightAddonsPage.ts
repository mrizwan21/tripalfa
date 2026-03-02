import { BasePage } from "./BasePage";

export class FlightAddonsPage extends BasePage {
  async addBaggage() {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId("baggage-addon").click({ force: true });
  }

  async selectSeat(seatNumber: string) {
    await this.getByTestId(`seat-${seatNumber}`).click({ force: true });
  }

  async continue() {
    await this.getByTestId("continue-button").click({ force: true });
    // Wait for passenger details page to load
    await this.page.waitForSelector('[data-testid="passenger-form"]', {
      timeout: 10000,
    });
  }
}
