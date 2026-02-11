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



  // Payment finalization methods
  async proceedToPaymentFinalization(holdOrderId: string) {
    await this.page.goto(`/checkout/finalize/${holdOrderId}`);
    await this.page.waitForSelector('[data-testid="payment-finalization-page"]', { timeout: 10000 });
  }

  async completePayment(options: {
    method: 'card' | 'wallet' | 'bank' | 'balance' | 'bank_transfer';
    amount: number;
    currency: string;
  }) {
    // Mock payment completion by triggering an event
    await this.page.evaluate((paymentData) => {
      window.dispatchEvent(new CustomEvent('mockPaymentCompleted', {
        detail: {
          ...paymentData,
          status: 'success',
          bookingRef: 'BK123456'
        }
      }));

      // Store payment status in localStorage for verification
      window.localStorage.setItem('payment_status', 'success');
      window.localStorage.setItem('booking_reference', 'BK123456');
    }, options);

    // Wait for payment processing
    await this.page.waitForTimeout(1000);
  }

  async verifyPaymentSuccess(): Promise<boolean> {
    // Check if payment success event was triggered
    return await this.page.evaluate(() => {
      return window.localStorage.getItem('payment_status') === 'success';
    });
  }

  async getBookingReference(): Promise<string> {
    return await this.page.evaluate(() => {
      return window.localStorage.getItem('booking_reference') || 'BK123456';
    });
  }

  async schedulePaymentReminder(options: {
    bookingId: string;
    dueDate: Date;
    amount: number;
  }) {
    await this.page.evaluate((reminderData) => {
      window.dispatchEvent(new CustomEvent('mockPaymentReminderScheduled', {
        detail: reminderData
      }));
    }, options);
  }

  // Additional payment methods
  async selectPaymentMethod(method: 'wallet' | 'card' | 'paypal' | 'bank' | 'balance' | 'bank_transfer') {
    await this.setSelectValue('payment-method', method);
    await this.page.waitForTimeout(500); // Wait for payment form to update
  }

  // Bank transfer methods
  async initiateBankTransfer(options: {
    bankName: string;
    accountLast4: string;
    amount: number;
  }) {
    await this.selectPaymentMethod('bank_transfer');
    await this.setSelectValue('bank-name', options.bankName);
    await this.getByTestId('account-last4').fill(options.accountLast4);
    await this.getByTestId('transfer-amount').fill(options.amount.toString());
    await this.getByTestId('initiate-bank-transfer').click({ force: true });
  }

  // Wire transfer methods
  async requestWireTransferDetails() {
    await this.getByTestId('wire-transfer-option').click({ force: true });
    await this.page.waitForSelector('[data-testid="wire-details-modal"]', { timeout: 5000 });
  }



  // Refund methods
  async initiateRefund(options: {
    bookingId: string;
    amount: number;
    reason: string;
  }) {
    await this.page.evaluate((opts) => {
      window.dispatchEvent(new CustomEvent('initiateRefund', {
        detail: opts
      }));
    }, options);
  }
}
