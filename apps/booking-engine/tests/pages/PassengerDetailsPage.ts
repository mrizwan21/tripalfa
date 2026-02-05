import { BasePage } from './BasePage';

export class PassengerDetailsPage extends BasePage {
  async fillPassengerDetails(firstName: string, lastName: string) {
    await this.getByTestId('passenger-first-name').fill(firstName);
    await this.getByTestId('passenger-last-name').fill(lastName);
    await this.getByTestId('continue-button').click();
    await this.waitForNavigation();
  }
}
