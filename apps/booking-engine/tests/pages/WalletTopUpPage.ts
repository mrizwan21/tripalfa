import { BasePage } from "./BasePage";

export class WalletTopUpPage extends BasePage {
  async topUp(amount: number, cardNumber: string, exp: string, cvc: string) {
    // Use 'force: true' for hidden elements
    await this.getByTestId("topup-amount").fill(amount.toString(), {
      force: true,
    });
    await this.getByTestId("card-number").fill(cardNumber, { force: true });
    await this.getByTestId("card-expiry").fill(exp, { force: true });
    await this.getByTestId("card-cvc").fill(cvc, { force: true });
    await this.getByTestId("topup-submit").click({ force: true });
    await this.waitForNavigation();
  }
}
