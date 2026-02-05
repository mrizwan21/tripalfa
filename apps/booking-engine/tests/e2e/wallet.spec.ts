import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WalletPage } from '../pages/WalletPage';
import { WalletTopUpPage } from '../pages/WalletTopUpPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import users from '../fixtures/users.json';
import payments from '../fixtures/payments.json';

test('Wallet top-up and usage', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const walletPage = new WalletPage(page);
  const topUpPage = new WalletTopUpPage(page);
  const checkout = new BookingCheckoutPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await walletPage.goto('/wallet');
  await walletPage.verifyBalance();
  await topUpPage.topUp(100, payments[0].cardNumber, payments[0].exp, payments[0].cvc);
  await walletPage.verifyBalance();
  await walletPage.viewTransactions();
  // Use wallet for booking payment (reuse booking flow as needed)
  // ...
});
