import { BasePage } from './BasePage';

export class FlightHomePage extends BasePage {
  async searchFlight(from: string, to: string, adults: number, travelClass: string, date?: string) {
    await this.getByTestId('flight-from').fill(from);
    await this.getByTestId('flight-to').fill(to);
    await this.getByTestId('flight-adults').selectOption(adults.toString());
    await this.getByTestId('flight-class').selectOption(travelClass);
    if (date) {
      await this.getByTestId('flight-date').fill(date);
    }
    await this.getByTestId('flight-search-submit').click();
    await this.waitForNavigation();
  }
}
