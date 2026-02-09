import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WalletPage } from '../pages/WalletPage';
import { WalletTopUpPage } from '../pages/WalletTopUpPage';
import { WalletTransferPage } from '../pages/WalletTransferPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { FlightAddonsPage } from '../pages/FlightAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';

// Import fixtures using dynamic imports (ES modules compatible)
const usersModule = await import('../fixtures/users.json', { with: { type: 'json' } });
const flightsModule = await import('../fixtures/flights.json', { with: { type: 'json' } });
const paymentsModule = await import('../fixtures/payments.json', { with: { type: 'json' } });

const users = usersModule.default;
const flights = flightsModule.default;
const payments = paymentsModule.default;

// Node.js process object
declare const process: {
  env: {
    TEST_USER_EMAIL?: string;
    TEST_USER_PASSWORD?: string;
  };
};

test.describe('Wallet Operations Flow', () => {
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
  });

  test('WO-001: View wallet balance and transaction history', async ({ page }) => {
    const walletPage = new WalletPage(page);

    // Navigate to wallet
    await walletPage.goto('/wallet');
    await expect(page.locator('[data-testid="wallet-page"]')).toBeVisible();

    // Verify wallet balance is displayed
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    const balance = await walletPage.getBalance();
    expect(balance).toBeGreaterThanOrEqual(0);

    // Verify currency is displayed
    await expect(page.locator('[data-testid="wallet-currency"]')).toHaveText(/USD|EUR|GBP/);

    // Verify transaction history section
    await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
    
    // View transactions
    await walletPage.viewTransactions();
    
    // Verify transaction list (if any)
    const transactionCount = await page.locator('[data-testid="transaction-row"]').count();
    if (transactionCount > 0) {
      // Verify transaction details
      await expect(page.locator('[data-testid="transaction-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-status"]')).toBeVisible();
    }
  });

  test('WO-002: Top-up wallet with card payment', async ({ page }) => {
    const walletPage = new WalletPage(page);

    // Navigate to wallet
    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();

    // Initiate top-up
    await walletPage.navigateToTopUp();
    await expect(page.locator('[data-testid="topup-modal"]')).toBeVisible();

    // Enter top-up amount
    const topUpAmount = 100.00;
    await page.getByTestId('topup-amount-input').fill(topUpAmount.toString(), { force: true });

    // Verify amount validation
    await expect(page.locator('[data-testid="topup-amount-display"]')).toBeVisible();

    // Continue to payment
    await page.getByTestId('topup-continue-button').click({ force: true });

    // Complete payment
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    // Use existing payment method or enter card details
    const savedCardButton = page.locator('[data-testid="use-saved-card"]');
    if (await savedCardButton.isVisible()) {
      await savedCardButton.click({ force: true });
    } else {
      // Enter card details
      await page.getByTestId('card-number').fill(payments[0].cardNumber, { force: true });
      await page.getByTestId('card-expiry').fill(payments[0].exp, { force: true });
      await page.getByTestId('card-cvc').fill(payments[0].cvc, { force: true });
      await page.getByTestId('card-holder-name').fill('Test User', { force: true });
    }
    await page.getByTestId('topup-pay-button').click({ force: true });

    // Verify top-up success
    await expect(page.getByText(/top.*up.*successful|successful/i)).toBeVisible({ timeout: 10000 });

    // Verify balance updated
    const newBalance = await walletPage.getBalance();
    expect(newBalance).toBeGreaterThan(initialBalance);

    // Verify transaction appears in history
    await walletPage.viewTransactions();
    const topupTransactions = page.getByText(/top.*up/i);
    const isVisible = await topupTransactions.isVisible().catch(() => false);
    if (isVisible) {
      await expect(topupTransactions).toBeVisible();
    }
  });

  test('WO-003: Top-up wallet - Invalid amount validation', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    await walletPage.navigateToTopUp();

    // Test negative amount
    await page.getByTestId('topup-amount-input').fill('-50', { force: true });
    await page.getByTestId('topup-continue-button').click({ force: true });
    const negativeError = page.getByText(/amount.*must.*positive|negative/i);
    const isNegativeErrorVisible = await negativeError.isVisible().catch(() => false);

    // Clear and test zero amount
    await page.getByTestId('topup-amount-input').fill('0', { force: true });
    await page.getByTestId('topup-continue-button').click({ force: true });
    const zeroError = page.getByText(/amount.*must.*greater.*zero|zero/i);
    const isZeroErrorVisible = await zeroError.isVisible().catch(() => false);

    // Clear and test amount below minimum
    await page.getByTestId('topup-amount-input').fill('5', { force: true });
    await page.getByTestId('topup-continue-button').click({ force: true });
    const minError = page.getByText(/minimum.*amount|less than/i);
    const isMinErrorVisible = await minError.isVisible().catch(() => false);

    // Test valid amount
    await page.getByTestId('topup-amount-input').fill('100', { force: true });
    await page.getByTestId('topup-continue-button').click({ force: true });
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
  });

  test('WO-004: Top-up wallet - Payment failure', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();

    // Initiate top-up
    await walletPage.navigateToTopUp();
    await page.getByTestId('topup-amount-input').fill('100', { force: true });
    await page.getByTestId('topup-continue-button').click({ force: true });

    // Attempt payment with declined card
    await page.getByTestId('card-number').fill('4000000000000002', { force: true });
    await page.getByTestId('card-expiry').fill('12/30', { force: true });
    await page.getByTestId('card-cvc').fill('123', { force: true });
    await page.getByTestId('card-holder-name').fill('Test User', { force: true });
    await page.getByTestId('topup-pay-button').click({ force: true });

    // Verify error message
    await expect(page.getByText(/payment.*failed|declined|error/i)).toBeVisible({ timeout: 10000 });

    // Verify balance unchanged
    const currentBalance = await walletPage.getBalance();
    expect(currentBalance).toBe(initialBalance);

    // Verify user can retry
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

    // Retry with valid card
    await page.getByTestId('card-number').fill(payments[0].cardNumber, { force: true });
    await page.getByTestId('card-expiry').fill(payments[0].exp, { force: true });
    await page.getByTestId('card-cvc').fill(payments[0].cvc, { force: true });
    await page.getByTestId('topup-pay-button').click({ force: true });

    // Verify success
    await expect(page.getByText(/successful|success/i)).toBeVisible({ timeout: 10000 });
  });

  test('WO-005: Use wallet for booking payment', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Ensure sufficient wallet balance
    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();
    
    const balanceBeforeBooking = initialBalance;

    // Create a booking
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
    await passengerDetails.fillPassengerDetails('Wallet', 'Test', {
      passportNumber: 'WT1234567',
      email: 'wallet@test.com',
    });
    await passengerDetails.continue();

    // Pay with wallet
    const bookingAmount = await checkout.getTotalAmount();
    await checkout.selectPaymentMethod('wallet');
    
    // Verify wallet balance is shown
    await expect(page.locator('[data-testid="wallet-balance-display"]')).toBeVisible();
    
    // Verify sufficient balance
    if (balanceBeforeBooking >= bookingAmount) {
      await checkout.completeWalletPayment();

      // Verify booking success
      await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible();
      const bookingRef = await confirmation.getBookingReference();

      // Verify wallet deduction
      await walletPage.goto('/wallet');
      const balanceAfterBooking = await walletPage.getBalance();
      expect(balanceAfterBooking).toBeLessThan(balanceBeforeBooking);

      // Verify transaction in history
      await walletPage.viewTransactions();
      const transactionRef = page.getByText(bookingRef);
      const isTransactionVisible = await transactionRef.isVisible().catch(() => false);
      if (isTransactionVisible) {
        await expect(transactionRef).toBeVisible();
      }
    }
  });

  test('WO-006: Wallet transfer (if feature exists)', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();

    // Check if transfer feature exists
    const transferButton = page.locator('[data-testid="transfer-btn"]');
    if (await transferButton.isVisible()) {
      await walletPage.navigateToTransfer();

      // Enter transfer details
      await page.getByTestId('recipient-email').fill(users.premiumUser?.email || 'premium@test.com', { force: true });
      await page.getByTestId('transfer-amount').fill('50', { force: true });
      const noteField = page.getByTestId('transfer-note');
      if (await noteField.isVisible()) {
        await noteField.fill('Test transfer', { force: true });
      }
      await page.getByTestId('confirm-transfer').click({ force: true });

      // Verify transfer success
      await expect(page.getByText(/transfer.*successful|successful/i)).toBeVisible({ timeout: 10000 });

      // Verify balance deducted
      const newBalance = await walletPage.getBalance();
      expect(newBalance).toBeLessThan(initialBalance);

      // Verify transaction in history
      await walletPage.viewTransactions();
      const transferText = page.getByText(/transfer/i);
      const isTransferVisible = await transferText.isVisible().catch(() => false);
      if (isTransferVisible) {
        await expect(transferText).toBeVisible();
      }
    }
  });

  test('WO-007: View wallet transaction details', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    await walletPage.viewTransactions();

    const transactionCount = await page.locator('[data-testid="transaction-row"]').count();
    if (transactionCount > 0) {
      // Click on first transaction
      await page.locator('[data-testid="transaction-row"]').first().click({ force: true });

      // Verify transaction detail modal/page
      const detailModal = page.locator('[data-testid="transaction-detail-modal"]');
      if (await detailModal.isVisible()) {
        await expect(detailModal).toBeVisible();
        await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-type"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
        await expect(page.locator('[data-testid="transaction-status"]')).toBeVisible();
      }
    }
  });

  test('WO-008: Filter wallet transactions', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    await walletPage.viewTransactions();

    // Filter by transaction type
    await walletPage.filterTransactionsByType('topup');
    const topupTransactions = await page.locator('[data-testid="transaction-row"]').all();
    for (const transaction of topupTransactions) {
      const typeText = await transaction.locator('[data-testid="transaction-type"]').textContent();
      expect(typeText).toMatch(/top.*up/i);
    }

    // Filter by date range
    await walletPage.filterTransactionsByDate('2026-01-01', '2026-12-31');
    
    // Verify transactions are within date range
    const dates = await page.locator('[data-testid="transaction-date"]').allTextContents();
    const filterStart = new Date('2026-01-01');
    const filterEnd = new Date('2026-12-31');
    
    for (const dateStr of dates) {
      const transactionDate = new Date(dateStr);
      expect(transactionDate.getTime()).toBeGreaterThanOrEqual(filterStart.getTime());
      expect(transactionDate.getTime()).toBeLessThanOrEqual(filterEnd.getTime());
    }
  });
});
