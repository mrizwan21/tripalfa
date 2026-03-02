import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  async register(email: string, password: string) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId("register-email").fill(email, { force: true });
    await this.getByTestId("register-password").fill(password, { force: true });
    await this.getByTestId("register-submit").click({ force: true });
    await this.waitForNavigation();
  }
}
