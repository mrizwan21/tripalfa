import { BasePage } from './BasePage';

export class HotelListPage extends BasePage {
  async selectHotel(index: number = 0) {
    await this.getByTestId(`hotel-result-card-${index}`).click({ force: true });
    await this.waitForNavigation();
  }
}
