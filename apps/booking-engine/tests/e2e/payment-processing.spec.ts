import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { FlightAddonsPage } from '../pages/FlightAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { WalletPage } from '../pages/WalletPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');
const payments = require('../fixtures/payments.json');

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    // Check if already logged in, if not, login
    const loginPage = new LoginPage(page);
    if (!await loginPage.isAlreadyLoggedIn()) {
      await loginPage.loginWithRetry(
        process.env.TEST_USER_EMAIL || 'testuser1@example.com',
        process.env.TEST_USER_PASSWORD || 'Test@123'
      );
    }

    // Navigate to flight booking and reach checkout page
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);

    // Login and navigate to checkout
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails('Payment', 'Test', {
      passportNumber: 'PT1234567',
      email: 'payment@test.com',
    });
    await passengerDetails.continue();
  });

  test('PP-001: Card payment success', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Select card payment
    await checkout.selectPaymentMethod('card');
    await expect(page.locator('[data-testid="card-payment-form"]')).toBeVisible();

    // Enter valid card details
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Payment Test'
    );

    // Verify successful booking
    await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
    const bookingRef = await confirmation.getBookingReference();
    expect(bookingRef).toBeTruthy();

    // Verify payment confirmation
    await expect(page.getByText(/successful|confirmation/i)).toBeVisible();
  });

  test('PP-002: Card payment declined', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    // Attempt payment with declined card
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[1].cardNumber, // Stripe test card - declined
      payments[1].exp,
      payments[1].cvc,
      'Payment Test'
    );

    // Verify error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/declined|failed/i)).toBeVisible();

    // Verify user remains on checkout page
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();

    // Verify booking is NOT created
    await expect(page.locator('[data-testid="confirmation-page"]')).not.toBeVisible();

    // Verify user can retry
    await expect(page.locator('[data-testid="card-payment-form"]')).toBeVisible();
  });

  test('PP-003: Card payment - Insufficient funds', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    // Attempt payment with insufficient funds card
    await checkout.selectPaymentMethod('card');
    await page.getByTestId('card-number').fill('4000000000009995', { force: true });
    await page.getByTestId('card-expiry').fill('12/30', { force: true });
    await page.getByTestId('card-cvc').fill('123', { force: true });
    await page.getByTestId('card-holder-name').fill('Payment Test', { force: true });
    await page.getByTestId('pay-now-button').click({ force: true });

    // Verify specific error message
    await expect(page.getByText(/insufficient|funds|declined/i)).toBeVisible({ timeout: 5000 });

    // Verify user can try different payment method
    await checkout.selectPaymentMethod('wallet');
    await expect(page.locator('[data-testid="wallet-payment-form"]')).toBeVisible();
  });

  test('PP-004: Card payment - Invalid card number', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    await checkout.selectPaymentMethod('card');

    // Enter invalid card number
    await page.getByTestId('card-number').fill('1234567890123456', { force: true });
    await page.getByTestId('card-expiry').fill('12/30', { force: true });
    await page.getByTestId('card-cvc').fill('123', { force: true });
    await page.getByTestId('card-holder-name').fill('Payment Test', { force: true });
    await page.getByTestId('pay-now-button').click({ force: true });

    // Verify validation error
    await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('PP-005: Card payment - Expired card', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    await checkout.selectPaymentMethod('card');

    // Enter expired card
    await page.getByTestId('card-number').fill(payments[0].cardNumber, { force: true });
    await page.getByTestId('card-expiry').fill('12/20', { force: true }); // Expired date
    await page.getByTestId('card-cvc').fill('123', { force: true });
    await page.getByTestId('card-holder-name').fill('Payment Test', { force: true });
    await page.getByTestId('pay-now-button').click({ force: true });

    // Verify error message
    await expect(page.getByText(/expired|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('PP-006: Wallet payment success', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const walletPage = new WalletPage(page);

    // Navigate to wallet to check balance
    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();
    
    // Return to checkout
    await page.goBack();

    // Get booking amount
    const bookingAmount = await checkout.getTotalAmount();

    if (initialBalance >= bookingAmount) {
      // Pay with wallet
      await checkout.selectPaymentMethod('wallet');
      await expect(page.locator('[data-testid="wallet-balance-display"]')).toBeVisible();
      await checkout.completeWalletPayment();

      // Verify successful booking
      await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
      const bookingRef = await confirmation.getBookingReference();
      expect(bookingRef).toBeTruthy();

      // Verify wallet deduction
      await walletPage.goto('/wallet');
      const finalBalance = await walletPage.getBalance();
      expect(finalBalance).toBeLessThan(initialBalance);
    }
  });

  test('PP-007: Wallet payment - Insufficient balance', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);
    const walletPage = new WalletPage(page);

    // Check wallet balance
    await walletPage.goto('/wallet');
    const walletBalance = await walletPage.getBalance();
    
    // Return to checkout
    await page.goBack();

    const bookingAmount = await checkout.getTotalAmount();

    if (walletBalance < bookingAmount) {
      // Attempt wallet payment
      await checkout.selectPaymentMethod('wallet');

      // Verify insufficient balance message
      const insufficientBalance = await checkout.verifyInsufficientBalanceWarning();
      expect(insufficientBalance).toBeTruthy();

      // Verify top-up option is available
      await expect(page.locator('[data-testid="topup-option"]')).toBeVisible();

      // Verify alternative payment method is available
      await checkout.selectPaymentMethod('card');
      await expect(page.locator('[data-testid="card-payment-form"]')).toBeVisible();
    }
  });

  test('PP-008: Payment timeout handling', async ({ page }) => {
    test.setTimeout(20000); // Set explicit test timeout of 20s
    const checkout = new BookingCheckoutPage(page);

    // Mock slow payment gateway response
    await page.route('**/api/payments/process', async route => {
      await page.waitForTimeout(8000); // Simulate timeout (8s sleep, well within 30s default)
      await route.abort();
    });

    // Attempt payment
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Payment Test'
    );

    // Verify timeout error message
    await expect(page.getByText(/timeout|taking.*longer|error/i)).toBeVisible({ timeout: 10000 });

    // Verify retry option
    await expect(page.locator('[data-testid="pay-now-button"]')).toBeVisible();
  });

  test('PP-009: Payment - Network error handling', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    // Mock network error
    await page.route('**/api/payments/process', route => route.abort('failed'));

    // Attempt payment
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Payment Test'
    );

    // Verify network error message
    await expect(page.getByText(/network.*error|connection.*failed|error/i)).toBeVisible({ timeout: 10000 });

    // Verify retry option
    await expect(page.locator('[data-testid="pay-now-button"]')).toBeVisible();
  });

  test('PP-010: Payment method switching', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);

    // Start with card payment
    await checkout.selectPaymentMethod('card');
    await expect(page.locator('[data-testid="card-payment-form"]')).toBeVisible();

    // Switch to wallet
    await checkout.selectPaymentMethod('wallet');
    await expect(page.locator('[data-testid="wallet-payment-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-payment-form"]')).not.toBeVisible();

    // Switch back to card
    await checkout.selectPaymentMethod('card');
    await expect(page.locator('[data-testid="card-payment-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-payment-form"]')).not.toBeVisible();
  });

  test('PP-011: Save card for future use', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    await checkout.selectPaymentMethod('card');

    // Check "Save card" option
    const saveCardCheckbox = page.locator('[data-testid="save-card-checkbox"]');
    if (await saveCardCheckbox.isVisible()) {
      await saveCardCheckbox.check();
    }

    // Complete payment
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Payment Test'
    );

    // Verify successful booking
    await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
    const bookingRef = await confirmation.getBookingReference();
    expect(bookingRef).toBeTruthy();
  });

  test('PP-012: Payment with saved card', async ({ page }) => {
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    await checkout.selectPaymentMethod('card');

    // Check if saved cards are available
    const savedCardsSection = page.locator('[data-testid="saved-cards"]');
    if (await savedCardsSection.isVisible()) {
      // Select first saved card
      const savedCard = page.locator('[data-testid="saved-card-0"]');
      if (await savedCard.isVisible()) {
        await savedCard.click();
        
        // Enter CVV only
        await page.getByTestId('saved-card-cvv').fill('123', { force: true });
        
        // Complete payment
        await page.getByTestId('pay-now-button').click({ force: true });

        // Verify successful booking
        await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
      }
    } else {
      // If no saved cards, test with regular card payment
      await checkout.payWithCard(
        payments[0].cardNumber,
        payments[0].exp,
        payments[0].cvc,
        'Payment Test'
      );
      await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
    }
  });
});
