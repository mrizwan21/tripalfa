import { BasePage } from './BasePage';

export class BookingManagementPage extends BasePage {
  async filterByService(service: string) {
    await this.getByTestId('service-filter').selectOption(service, { force: true });
  }
  async searchByReference(ref: string) {
    await this.getByTestId('booking-search').fill(ref, { force: true });
    await this.getByTestId('search-button').click({ force: true });
  }
  async sortByDate() {
    await this.getByTestId('sort-date').click({ force: true });
  }
  async selectBooking(index: number = 0) {
    await this.getByTestId(`booking-row-${index}`).click({ force: true });
    await this.waitForNavigation();
  }

  async viewBookingDetails(bookingReference: string) {
    await this.getByText(bookingReference).click({ force: true });
    await this.page.waitForSelector('[data-testid="booking-detail-page"]', { timeout: 10000 });
  }

  async viewBookingDetailsFromList(index: number = 0) {
    await this.getByTestId(`booking-card-${index}`).click({ force: true });
    await this.page.waitForSelector('[data-testid="booking-detail-page"]', { timeout: 10000 });
  }
}
