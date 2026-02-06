import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId('login-email').fill(email, { force: true });
    await this.getByTestId('login-password').fill(password, { force: true });
    await this.getByTestId('login-submit').click({ force: true });
    // Wait for dashboard URL instead of full page navigation
    // This is more reliable than waitForNavigation which can timeout
    await this.page.waitForURL(/\/(dashboard|flights|hotels)/, { timeout: 30000 });
    await expect(this.page).toHaveURL(/\/(dashboard|flights|hotels)/);
  }
}
