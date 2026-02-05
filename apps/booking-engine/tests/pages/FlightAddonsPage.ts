import { BasePage } from './BasePage';

export class FlightAddonsPage extends BasePage {
  async addBaggage() {
    await this.getByTestId('baggage-addon').click();
  }
  async continue() {
    await this.getByTestId('continue-button').click();
    await this.waitForNavigation();
  }
}
