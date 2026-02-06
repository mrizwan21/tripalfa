import { BasePage } from './BasePage';

export class BookingConfirmationPage extends BasePage {
  async verifyConfirmation() {
    await this.getByTestId('booking-confirmation').waitFor();
  }

  async getBookingReference(): Promise<string> {
    return await this.getByTestId('booking-reference').textContent() || '';
  }

  async verifyHotelDetails() {
    await this.getByTestId('hotel-details').waitFor();
  }
}
