import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { WalletPage } from '../pages/WalletPage';
import { WalletTopUpPage } from '../pages/WalletTopUpPage';
import { WalletTransferPage } from '../pages/WalletTransferPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const payments = require('../fixtures/payments.json');
const wallets = require('../fixtures/wallets.json');

test.describe('Wallet Management - Day 5-6 Enhanced Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable test mode for mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_WALLET = true;
    });
  });

  test('WL-001: View wallet balance and transaction history', async ({ page }) => {
    const walletPage = new WalletPage(page);

    // Navigate to wallet
    await walletPage.goto('/wallet');
    
    // Verify balance is displayed
    await walletPage.verifyBalance();
    const balance = await walletPage.getBalance();
    expect(balance).toBeGreaterThanOrEqual(0);
    
    // View transactions
    await walletPage.viewTransactions();
    
    // Verify transaction list is visible
    await expect(page.getByTestId('transaction-list')).toBeVisible();
    await expect(page.getByTestId('transaction-row-0')).toBeVisible();
  });

  test('WL-002: Wallet top-up with credit card', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const topUpPage = new WalletTopUpPage(page);

    await walletPage.goto('/wallet');
    
    // Get initial balance
    const initialBalance = await walletPage.getBalance();
    
    // Navigate to top-up
    await walletPage.navigateToTopUp();
    
    // Perform top-up
    const topUpAmount = 100;
    await topUpPage.topUp(
      topUpAmount, 
      payments[0].cardNumber, 
      payments[0].exp, 
      payments[0].cvc
    );
    
    // Verify success
    await expect(page.getByTestId('topup-success')).toBeVisible();
    
    // Verify balance updated
    await walletPage.goto('/wallet');
    const newBalance = await walletPage.getBalance();
    expect(newBalance).toBe(initialBalance + topUpAmount);
  });

  test('WL-003: Wallet top-up with declined card handling', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const topUpPage = new WalletTopUpPage(page);

    await walletPage.goto('/wallet');
    await walletPage.navigateToTopUp();
    
    // Attempt top-up with declined card
    await topUpPage.topUp(
      100, 
      payments[1].cardNumber, // Decline card
      payments[1].exp, 
      payments[1].cvc
    );
    
    // Verify error message
    await expect(page.getByTestId('payment-error')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('declined');
  });

  test('WL-004: Wallet transfer between users', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const transferPage = new WalletTransferPage(page);

    await walletPage.goto('/wallet');
    
    // Get initial balance
    const initialBalance = await walletPage.getBalance();
    
    // Navigate to transfer
    await walletPage.navigateToTransfer();
    
    // Perform transfer
    const transferAmount = 50;
    await transferPage.transfer(transferAmount, 'EUR');
    
    // Verify success
    await expect(page.getByTestId('transfer-success')).toBeVisible();
    
    // Verify balance updated
    await walletPage.goto('/wallet');
    const newBalance = await walletPage.getBalance();
    expect(newBalance).toBe(initialBalance - transferAmount);
  });

  test('WL-005: Multi-currency wallet operations', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const transferPage = new WalletTransferPage(page);

    await walletPage.goto('/wallet');
    
    // View currency balances
    await walletPage.viewCurrencyBalances();
    await expect(page.getByTestId('currency-balances')).toBeVisible();
    
    // Switch currency
    await walletPage.switchCurrency('EUR');
    await expect(page.getByTestId('current-currency')).toContainText('EUR');
    
    // Transfer with currency conversion
    await walletPage.navigateToTransfer();
    await transferPage.transferWithConversion(100, 'USD', 'EUR');
    
    // Verify conversion success
    await expect(page.getByTestId('conversion-success')).toBeVisible();
  });

  test('WL-006: Wallet payment for flight booking', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const checkout = new BookingCheckoutPage(page);

    await walletPage.goto('/wallet');
    
    // Ensure sufficient balance
    const balance = await walletPage.getBalance();
    expect(balance).toBeGreaterThan(200); // Minimum for booking
    
    // Navigate to checkout with wallet payment
    await checkout.goto('/checkout');
    
    // Select wallet as payment method
    await checkout.selectPaymentMethod('wallet');
    
    // Verify wallet balance displayed
    await expect(page.getByTestId('wallet-balance-display')).toBeVisible();
    
    // Complete payment
    await checkout.completeWalletPayment();
    
    // Verify payment success
    await expect(page.getByTestId('payment-success')).toBeVisible();
    
    // Verify balance deducted
    await walletPage.goto('/wallet');
    const newBalance = await walletPage.getBalance();
    expect(newBalance).toBeLessThan(balance);
  });

  test('WL-007: Insufficient wallet balance handling', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const checkout = new BookingCheckoutPage(page);
    const topUpPage = new WalletTopUpPage(page);

    // Use low balance wallet
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_WALLET_LOW_BALANCE = true;
    });

    await walletPage.goto('/wallet');
    const balance = await walletPage.getBalance();
    expect(balance).toBeLessThan(50); // Low balance
    
    // Attempt to pay for expensive booking
    await checkout.goto('/checkout');
    await checkout.selectPaymentMethod('wallet');
    
    // Verify insufficient balance warning
    await expect(page.getByTestId('insufficient-balance')).toBeVisible();
    
    // Option to top-up should be available
    await expect(page.getByTestId('topup-option')).toBeVisible();
  });

  test('WL-008: Wallet refund processing from cancelled booking', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const bookingMgmt = new BookingManagementPage(page);

    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();
    
    // Navigate to bookings
    await bookingMgmt.goto('/bookings');
    await bookingMgmt.selectBooking(0);
    
    // Cancel booking with wallet refund
    await page.getByTestId('cancel-booking-btn').click({ force: true });
    await page.getByTestId('refund-to-wallet').click({ force: true });
    await page.getByTestId('confirm-cancellation-btn').click({ force: true });
    
    // Verify refund success
    await expect(page.getByTestId('refund-success')).toBeVisible();
    
    // Verify wallet balance updated
    await walletPage.goto('/wallet');
    await expect(page.getByTestId('refund-transaction')).toBeVisible();
  });

  test('WL-009: Wallet transaction filtering and search', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    await walletPage.viewTransactions();
    
    // Filter by transaction type
    await walletPage.filterTransactionsByType('topup');
    await expect(page.getByTestId('filter-active')).toContainText('Top-up');
    
    // Filter by date range
    await walletPage.filterTransactionsByDate('2026-01-01', '2026-12-31');
    await expect(page.getByTestId('date-filter-active')).toBeVisible();
    
    // Search transactions
    await walletPage.searchTransactions('booking');
    await expect(page.getByTestId('search-results')).toBeVisible();
  });

  test('WL-010: Wallet scheduled top-up setup', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    
    // Navigate to scheduled top-up
    await walletPage.navigateToScheduledTopUp();
    
    // Set up auto top-up
    await walletPage.setupAutoTopUp({
      amount: 200,
      threshold: 50,
      paymentMethod: payments[0].cardNumber
    });
    
    // Verify setup success
    await expect(page.getByTestId('auto-topup-configured')).toBeVisible();
    await expect(page.getByTestId('auto-topup-amount')).toContainText('200');
  });

  test('WL-011: Wallet security - PIN verification', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const transferPage = new WalletTransferPage(page);

    await walletPage.goto('/wallet');
    await walletPage.navigateToTransfer();
    
    // Attempt transfer
    await transferPage.transfer(50, 'USD');
    
    // Verify PIN prompt
    await expect(page.getByTestId('pin-prompt')).toBeVisible();
    
    // Enter PIN
    await walletPage.enterPIN('1234');
    
    // Verify transfer completes after PIN
    await expect(page.getByTestId('transfer-success')).toBeVisible();
  });

  test('WL-012: Wallet statement generation and download', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    await walletPage.viewTransactions();
    
    // Generate statement
    await walletPage.generateStatement('2026-01-01', '2026-12-31');
    
    // Verify statement generated
    await expect(page.getByTestId('statement-generated')).toBeVisible();
    
    // Download statement
    await walletPage.downloadStatement();
    
    // Verify download success
    await expect(page.getByTestId('download-success')).toBeVisible();
  });

  test('WL-013: Wallet limits and restrictions', async ({ page }) => {
    const walletPage = new WalletPage(page);
    const topUpPage = new WalletTopUpPage(page);

    await walletPage.goto('/wallet');
    
    // View limits
    await walletPage.viewWalletLimits();
    await expect(page.getByTestId('wallet-limits')).toBeVisible();
    await expect(page.getByTestId('max-balance')).toBeVisible();
    await expect(page.getByTestId('daily-topup-limit')).toBeVisible();
    
    // Attempt to exceed daily limit
    await walletPage.navigateToTopUp();
    await topUpPage.topUp(10000, payments[0].cardNumber, payments[0].exp, payments[0].cvc);
    
    // Verify limit error
    await expect(page.getByTestId('limit-exceeded')).toBeVisible();
  });

  test('WL-014: Wallet to bank account withdrawal', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    
    // Navigate to withdrawal
    await walletPage.navigateToWithdrawal();
    
    // Enter withdrawal details
    await walletPage.enterWithdrawalDetails({
      amount: 100,
      bankAccount: '****1234',
      accountName: 'Test User'
    });
    
    // Confirm withdrawal
    await walletPage.confirmWithdrawal();
    
    // Verify withdrawal success
    await expect(page.getByTestId('withdrawal-success')).toBeVisible();
    await expect(page.getByTestId('withdrawal-pending')).toBeVisible();
  });

  test('WL-015: Wallet loyalty points integration', async ({ page }) => {
    const walletPage = new WalletPage(page);

    await walletPage.goto('/wallet');
    
    // View loyalty points
    await walletPage.viewLoyaltyPoints();
    await expect(page.getByTestId('loyalty-points')).toBeVisible();
    
    // Convert points to wallet credit
    await walletPage.convertPointsToCredit(1000);
    
    // Verify conversion success
    await expect(page.getByTestId('points-converted')).toBeVisible();
    await expect(page.getByTestId('credit-added')).toBeVisible();
  });
});
