import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { WalletPage } from "../pages/WalletPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { AdminNotificationsPage } from "../pages/AdminNotificationsPage";

test.describe("Complete Wallet Management Journey E2E", () => {
  test("Customer funds wallet and receives notifications", async ({ page }) => {
    // Step 1: Customer login
    const login = new LoginPage(page);
    await login.login("customer@test.com", "password");

    // Step 2: Navigate to wallet
    const wallet = new WalletPage(page);
    await wallet.goto("/wallet");

    // Step 3: Add funds to wallet
    await wallet.addFunds({
      amount: 500,
      currency: "USD",
      paymentMethod: "credit_card",
    });

    // Step 4: Complete payment
    await wallet.completePayment();

    // Step 5: Receive funding confirmation notification
    await page.goto("/notifications");
    await expect(page.locator("text=Wallet funded successfully")).toBeVisible();

    // Step 6: Check wallet balance update
    await wallet.goto("/wallet");
    await expect(page.locator("text=Balance: $500.00")).toBeVisible();

    // Step 7: Receive balance update notification
    await expect(page.locator("text=Wallet balance updated")).toBeVisible();
  });

  test("Wallet payment during booking with balance notifications", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    const wallet = new WalletPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Start booking process
    await page.goto("/flights");
    await page.click("text=Book Flight");

    // Step 2: Proceed to checkout
    await checkout.proceedToCheckout();

    // Step 3: Select wallet payment
    await checkout.selectPaymentMethod("wallet");

    // Step 4: Complete booking with wallet payment
    await checkout.completeBooking();

    // Step 5: Receive booking confirmation
    await expect(page.locator("text=Booking confirmed")).toBeVisible();

    // Step 6: Check wallet balance deduction
    await wallet.goto("/wallet");
    await expect(page.locator("text=Balance: $300.00")).toBeVisible(); // Assuming $200 booking cost

    // Step 7: Receive payment deduction notification
    await page.goto("/notifications");
    await expect(
      page.locator("text=Payment processed from wallet"),
    ).toBeVisible();

    // Step 8: Receive low balance warning (if applicable)
    await expect(page.locator("text=Low wallet balance")).toBeVisible();
  });

  test("Wallet transaction history and notifications", async ({ page }) => {
    const login = new LoginPage(page);
    const wallet = new WalletPage(page);

    await login.login("customer@test.com", "password");
    await wallet.goto("/wallet");

    // Step 1: View transaction history
    await wallet.viewTransactionHistory();

    // Step 2: Verify transactions are listed
    await expect(page.locator("text=Funding")).toBeVisible();
    await expect(page.locator("text=Payment")).toBeVisible();

    // Step 3: Export transaction history
    await wallet.exportTransactions();

    // Step 4: Receive export notification
    await page.goto("/notifications");
    await expect(
      page.locator("text=Transaction history exported"),
    ).toBeVisible();
  });

  test("Wallet auto-recharge and notifications", async ({ page }) => {
    const login = new LoginPage(page);
    const wallet = new WalletPage(page);

    await login.login("customer@test.com", "password");
    await wallet.goto("/wallet");

    // Step 1: Set up auto-recharge
    await wallet.setupAutoRecharge({
      threshold: 100,
      amount: 200,
      enabled: true,
    });

    // Step 2: Simulate low balance trigger
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockLowBalance", {
          detail: { balance: 50, threshold: 100 },
        }),
      );
    });

    // Step 3: Receive auto-recharge notification
    await page.goto("/notifications");
    await expect(page.locator("text=Auto-recharge initiated")).toBeVisible();

    // Step 4: Check balance after auto-recharge
    await wallet.goto("/wallet");
    await expect(page.locator("text=Balance: $250.00")).toBeVisible(); // 50 + 200

    // Step 5: Receive recharge completion notification
    await expect(page.locator("text=Auto-recharge completed")).toBeVisible();
  });

  test("Wallet refund processing and notifications", async ({ page }) => {
    const login = new LoginPage(page);
    const wallet = new WalletPage(page);
    const adminNotifications = new AdminNotificationsPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Admin initiates refund (simulate admin action)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockRefundInitiated", {
          detail: { amount: 150, reason: "Booking cancellation" },
        }),
      );
    });

    // Step 2: Customer receives refund notification
    await page.goto("/notifications");
    await expect(page.locator("text=Refund processed")).toBeVisible();

    // Step 3: Check wallet balance update
    await wallet.goto("/wallet");
    await expect(page.locator("text=Balance: $400.00")).toBeVisible(); // Previous balance + refund

    // Step 4: View refund in transaction history
    await wallet.viewTransactionHistory();
    await expect(page.locator("text=Refund")).toBeVisible();

    // Step 5: Admin receives refund confirmation
    await adminNotifications.goto("/admin/notifications");
    await expect(page.locator("text=Refund completed")).toBeVisible();
  });

  test("Wallet security and fraud notifications", async ({ page }) => {
    const login = new LoginPage(page);
    const wallet = new WalletPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Simulate suspicious activity
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockSuspiciousActivity", {
          detail: { type: "unusual_transaction", amount: 1000 },
        }),
      );
    });

    // Step 2: Receive security alert
    await page.goto("/notifications");
    await expect(page.locator("text=Security Alert")).toBeVisible();

    // Step 3: Wallet temporarily locked
    await wallet.goto("/wallet");
    await expect(page.locator("text=Wallet temporarily locked")).toBeVisible();

    // Step 4: Complete verification process
    await wallet.verifyIdentity();

    // Step 5: Receive unlock notification
    await expect(page.locator("text=Wallet unlocked")).toBeVisible();

    // Step 6: Check wallet status
    await expect(page.locator("text=Wallet active")).toBeVisible();
  });
});
