import { BasePage } from './BasePage';

export class BookingManagementPage extends BasePage {
  async filterByService(service: string) {
    await this.getByTestId('service-filter').selectOption(service);
  }
  async searchByReference(ref: string) {
    await this.getByTestId('booking-search').fill(ref);
    await this.getByTestId('search-button').click();
  }
  async sortByDate() {
    await this.getByTestId('sort-date').click();
  }
  async selectBooking(index: number = 0) {
    await this.getByTestId(`booking-row-${index}`).click();
    await this.waitForNavigation();
  }
}
