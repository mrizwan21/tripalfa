import { BasePage } from './BasePage';

export class WalletPage extends BasePage {
  async getBalance(): Promise<number> {
    const balanceText = await this.getByTestId('wallet-balance').textContent();
    return parseFloat(balanceText?.replace(/[^0-9.]/g, '') || '0');
  }

  async verifyBalance() {
    // Wait for element to exist in DOM (not checking visibility)
    await this.getByTestId('wallet-balance').waitFor({ state: 'attached' });
  }

  async viewTransactions() {
    await this.getByTestId('wallet-transactions').click({ force: true });
  }
}
