import { BasePage } from './BasePage';

export class FlightDetailPage extends BasePage {
  async selectFlight() {
    await this.getByTestId('book-now-button').click();
    await this.waitForNavigation();
  }
}
