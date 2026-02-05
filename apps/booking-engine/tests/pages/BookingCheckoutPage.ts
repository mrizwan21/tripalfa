import { BasePage } from './BasePage';

export class BookingCheckoutPage extends BasePage {
  async payWithWallet() {
    await this.getByTestId('wallet-payment-option').click();
    await this.getByTestId('pay-now-button').click();
    await this.waitForNavigation();
  }
  async payWithCard(cardNumber: string, exp: string, cvc: string) {
    await this.getByTestId('card-payment-option').click();
    await this.getByTestId('card-number').fill(cardNumber);
    await this.getByTestId('card-expiry').fill(exp);
    await this.getByTestId('card-cvc').fill(cvc);
    await this.getByTestId('pay-now-button').click();
    await this.waitForNavigation();
  }
}
