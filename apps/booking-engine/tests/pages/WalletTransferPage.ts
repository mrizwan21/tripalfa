import { BasePage } from './BasePage';

export class WalletTransferPage extends BasePage {
  async transfer(amount: number, toCurrency: string) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId('transfer-amount').fill(amount.toString(), { force: true });
    await this.getByTestId('transfer-currency').selectOption(toCurrency, { force: true });
    await this.getByTestId('transfer-submit').click({ force: true });
    await this.waitForNavigation();
  }
}
