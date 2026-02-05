import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  async register(email: string, password: string) {
    await this.getByTestId('register-email').fill(email);
    await this.getByTestId('register-password').fill(password);
    await this.getByTestId('register-submit').click();
    await this.waitForNavigation();
  }
}
