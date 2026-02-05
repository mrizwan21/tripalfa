import { BasePage } from './BasePage';

export class HotelDetailPage extends BasePage {
  async selectRoom() {
    await this.getByTestId('select-room-button').click();
    await this.waitForNavigation();
  }
}
