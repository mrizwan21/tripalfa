import { BasePage } from "./BasePage";

export class HotelAddonsPage extends BasePage {
  async addBreakfast() {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId("breakfast-addon").click({ force: true });
  }

  async addParking() {
    await this.getByTestId("parking-addon").click({ force: true });
  }

  async addUpgrade() {
    await this.getByTestId("room-upgrade-addon").click({ force: true });
  }

  async continue() {
    await this.getByTestId("continue-button").click({ force: true });
    await this.waitForNavigation();
  }
}
