import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.getByTestId('login-email').fill(email);
    await this.getByTestId('login-password').fill(password);
    await this.getByTestId('login-submit').click();
    await this.waitForNavigation();
    await expect(this.page).toHaveURL(/dashboard|home/);
  }
}
