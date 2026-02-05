import { BasePage } from './BasePage';

export class BookingDetailPage extends BasePage {
  async verifyDetails() {
    await this.getByTestId('booking-detail').waitFor();
  }
}
