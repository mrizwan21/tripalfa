import { BasePage } from './BasePage';

export class FlightListPage extends BasePage {
  async selectFlight(index: number = 0) {
    await this.getByTestId(`flight-result-card-${index}`).click();
    await this.waitForNavigation();
  }
}
