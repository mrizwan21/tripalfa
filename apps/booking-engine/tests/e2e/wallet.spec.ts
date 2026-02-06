import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { WalletPage } from '../pages/WalletPage';
import { WalletTopUpPage } from '../pages/WalletTopUpPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const payments = require('../fixtures/payments.json');

test('Wallet top-up and usage', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_WALLET = true;
  });

  const walletPage = new WalletPage(page);
  const topUpPage = new WalletTopUpPage(page);
  const checkout = new BookingCheckoutPage(page);

  // Navigate directly to wallet without login - test mode provides mock wallet
  await walletPage.goto('/wallet');
  await walletPage.verifyBalance();
  await topUpPage.topUp(100, payments[0].cardNumber, payments[0].exp, payments[0].cvc);
  await walletPage.verifyBalance();
  await walletPage.viewTransactions();
  // Use wallet for booking payment (reuse booking flow as needed)
  // ...
});
