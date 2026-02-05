import { BasePage } from './BasePage';

export class WalletTopUpPage extends BasePage {
  async topUp(amount: number, cardNumber: string, exp: string, cvc: string) {
    await this.getByTestId('topup-amount').fill(amount.toString());
    await this.getByTestId('card-number').fill(cardNumber);
    await this.getByTestId('card-expiry').fill(exp);
    await this.getByTestId('card-cvc').fill(cvc);
    await this.getByTestId('topup-submit').click();
    await this.waitForNavigation();
  }
}
