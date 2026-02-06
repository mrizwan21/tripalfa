import { BasePage } from './BasePage';

export class BookingCheckoutPage extends BasePage {
  async payWithWallet() {
    // Use 'force: true' for hidden elements
    // Click the "Complete Booking" button to show confirmation modal
    await this.getByTestId('complete-booking-button').click({ force: true });
    
    // In the confirmation modal, click "Confirm & Pay"
    await this.getByTestId('confirm-pay-button').click({ force: true });
    
    // Wait for the confirmation page to appear (client-side navigation)
    await this.page.waitForSelector('[data-testid="confirmation-page"]', { timeout: 10000 });
  }

  async payWithCard(cardNumber: string, exp: string, cvc: string, cardholderName: string) {
    await this.selectPaymentMethod('card');
    await this.getByTestId('card-number').fill(cardNumber, { force: true });
    await this.getByTestId('card-expiry').fill(exp, { force: true });
    await this.getByTestId('card-cvc').fill(cvc, { force: true });
    await this.getByTestId('card-holder-name').fill(cardholderName, { force: true });
    await this.getByTestId('pay-now-button').click({ force: true });
    await this.waitForNavigation();
  }

  async getTotalAmount(): Promise<number> {
    const amountText = await this.getByTestId('total-amount').textContent();
    return parseFloat(amountText?.replace(/[^0-9.]/g, '') || '0');
  }
}
