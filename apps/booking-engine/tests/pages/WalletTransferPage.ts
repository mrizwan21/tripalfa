import { BasePage } from './BasePage';

export class WalletTransferPage extends BasePage {
  async transfer(amount: number, toCurrency: string) {
    await this.getByTestId('transfer-amount').fill(amount.toString());
    await this.getByTestId('transfer-currency').selectOption(toCurrency);
    await this.getByTestId('transfer-submit').click();
    await this.waitForNavigation();
  }
}
