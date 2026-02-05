import { BasePage } from './BasePage';

export class HotelHomePage extends BasePage {
  async searchHotel(city: string, adults: number, rooms: number, nights: number) {
    await this.getByTestId('hotel-city').fill(city);
    await this.getByTestId('hotel-adults').selectOption(adults.toString());
    await this.getByTestId('hotel-rooms').selectOption(rooms.toString());
    await this.getByTestId('hotel-nights').selectOption(nights.toString());
    await this.getByTestId('hotel-search-submit').click();
    await this.waitForNavigation();
  }
}
