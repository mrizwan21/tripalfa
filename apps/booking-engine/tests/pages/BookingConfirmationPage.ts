import { BasePage } from './BasePage';

export class BookingConfirmationPage extends BasePage {
  async verifyConfirmation() {
    await this.getByTestId('booking-confirmation').waitFor();
  }
}
