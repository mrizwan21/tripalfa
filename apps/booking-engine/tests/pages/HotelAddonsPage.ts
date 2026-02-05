import { BasePage } from './BasePage';

export class HotelAddonsPage extends BasePage {
  async addUpgrade() {
    await this.getByTestId('room-upgrade-addon').click();
  }
  async continue() {
    await this.getByTestId('continue-button').click();
    await this.waitForNavigation();
  }
}
