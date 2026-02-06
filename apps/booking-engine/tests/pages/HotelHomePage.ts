import { BasePage } from './BasePage';

export class HotelHomePage extends BasePage {
  async searchHotel(city: string, checkInDate: string, checkOutDate: string, adults: number, rooms: number) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId('hotel-city').fill(city, { force: true });
    await this.getByTestId('hotel-checkin-date').fill(checkInDate, { force: true });
    await this.getByTestId('hotel-checkout-date').fill(checkOutDate, { force: true });
    await this.getByTestId('hotel-adults').selectOption(adults.toString(), { force: true });
    await this.getByTestId('hotel-rooms').selectOption(rooms.toString(), { force: true });
    await this.getByTestId('hotel-search-submit').click({ force: true });
    await this.waitForNavigation();
  }
}
