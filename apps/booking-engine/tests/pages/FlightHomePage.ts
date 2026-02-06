import { BasePage } from './BasePage';

export class FlightHomePage extends BasePage {
  async searchFlight(from: string, to: string, adults: number, travelClass: string, date?: string) {
    // Use 'force: true' to interact with hidden elements (bypasses visibility check)
    await this.getByTestId('flight-from').fill(from, { force: true });
    await this.getByTestId('flight-to').fill(to, { force: true });
    await this.getByTestId('flight-adults').selectOption(adults.toString(), { force: true });
    await this.getByTestId('flight-class').selectOption(travelClass, { force: true });
    if (date) {
      await this.getByTestId('flight-date').fill(date, { force: true });
    }
    await this.getByTestId('flight-search-submit').click({ force: true });
    await this.page.waitForURL('**/flights/list**', { timeout: 10000 });
  }

  async searchRoundTrip(from: string, to: string, departureDate: string, returnDate: string, adults: number, travelClass: string) {
    await this.getByTestId('flight-trip-type').selectOption('round-trip', { force: true });
    await this.getByTestId('flight-from').fill(from, { force: true });
    await this.getByTestId('flight-to').fill(to, { force: true });
    await this.getByTestId('flight-departure-date').fill(departureDate, { force: true });
    await this.getByTestId('flight-return-date').fill(returnDate, { force: true });
    await this.getByTestId('flight-adults').selectOption(adults.toString(), { force: true });
    await this.getByTestId('flight-class').selectOption(travelClass, { force: true });
    await this.getByTestId('flight-search-submit').click({ force: true });
    await this.waitForNavigation();
  }
}
