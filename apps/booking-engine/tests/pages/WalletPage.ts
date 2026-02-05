import { BasePage } from './BasePage';

export class WalletPage extends BasePage {
  async verifyBalance() {
    await this.getByTestId('wallet-balance').waitFor();
  }
  async viewTransactions() {
    await this.getByTestId('wallet-transactions').click();
  }
}
