import { BasePage } from "./BasePage";

export class HotelDetailPage extends BasePage {
  async selectRoom(roomIndex: number = 0) {
    await this.getByTestId(`select-room-button-${roomIndex}`).click({
      force: true,
    });
  }

  async continue() {
    await this.getByTestId("continue-button").click({ force: true });
    await this.waitForNavigation();
  }
}
