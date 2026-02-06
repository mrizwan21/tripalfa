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

  // New methods for Day 5-6 wallet integration
  async selectPaymentMethod(method: 'wallet' | 'card' | 'paypal' | 'bank') {
    await this.setSelectValue('payment-method', method);
    await this.page.waitForTimeout(500); // Wait for payment form to update
  }

  async completeWalletPayment() {
    // Select wallet payment method
    await this.selectPaymentMethod('wallet');
    
    // Verify wallet balance is displayed
    await this.page.waitForSelector('[data-testid="wallet-balance-display"]', { timeout: 10000 });
    
    // Click pay with wallet
    await this.getByTestId('pay-with-wallet-btn').click({ force: true });
    
    // Confirm payment in modal
    await this.getByTestId('confirm-wallet-payment').click({ force: true });
    
    // Wait for payment success
    await this.page.waitForSelector('[data-testid="payment-success"]', { timeout: 10000 });
  }

  async verifyWalletBalanceDisplayed(): Promise<number> {
    const balanceText = await this.getByTestId('wallet-balance-display').textContent();
    return parseFloat(balanceText?.replace(/[^0-9.]/g, '') || '0');
  }

  async verifyInsufficientBalanceWarning(): Promise<boolean> {
    const warning = await this.page.locator('[data-testid="insufficient-balance"]').isVisible();
    return warning;
  }

  async clickTopUpOption() {
    await this.getByTestId('topup-option').click({ force: true });
    await this.page.waitForSelector('[data-testid="topup-page"]', { timeout: 10000 });
  }

  async applyPromoCode(promoCode: string) {
    await this.getByTestId('promo-code-input').fill(promoCode, { force: true });
    await this.getByTestId('apply-promo-btn').click({ force: true });
    await this.page.waitForTimeout(1000); // Wait for discount to apply
  }

  async getDiscountAmount(): Promise<number> {
    const discountText = await this.getByTestId('discount-amount').textContent();
    return parseFloat(discountText?.replace(/[^0-9.]/g, '') || '0');
  }

  async getFinalAmount(): Promise<number> {
    const amountText = await this.getByTestId('final-amount').textContent();
    return parseFloat(amountText?.replace(/[^0-9.]/g, '') || '0');
  }

  async verifyPaymentSuccess(): Promise<boolean> {
    const success = await this.page.locator('[data-testid="payment-success"]').isVisible();
    return success;
  }

  async getBookingReference(): Promise<string> {
    const ref = await this.getByTestId('booking-reference').textContent();
    return ref || '';
  }
}
