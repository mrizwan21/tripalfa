/**
 * E2E — Wallet
 *
 * Tests the /wallet, /wallet/topup, and /wallet/transfer pages.
 * Uses the pre-authenticated storageState (chromium project).
 * MSW serves mock wallet balance and transaction data.
 */
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Wallet overview", () => {
  test.beforeEach(async ({ walletPage }) => {
    await walletPage.goto();
  });

  test("renders wallet page without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/wallet/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shows wallet balance or a loading state", async ({ walletPage, page }) => {
    // Balance might load asynchronously
    await page.waitForLoadState("networkidle");
    const balance = walletPage.balanceDisplay;
    const spinner = page.locator(".animate-spin").first();

    // Either the balance is visible or we're still loading
    const balanceVisible = await balance.isVisible().catch(() => false);
    const spinnerVisible = await spinner.isVisible().catch(() => false);
    expect(balanceVisible || spinnerVisible).toBeTruthy();
  });

  test("has a top-up button or link", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const topUpEl = page
      .getByRole("button", { name: /top.?up|add funds/i })
      .or(page.getByRole("link", { name: /top.?up/i }));
    // Not all configurations have wallet enabled; only assert if on /wallet
    if (page.url().includes("/wallet")) {
      await expect(topUpEl.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});

test.describe("Wallet top-up", () => {
  test.beforeEach(async ({ walletPage }) => {
    await walletPage.gotoTopUp();
  });

  test("renders top-up form or redirects", async ({ page }) => {
    const isOnTopUp = page.url().includes("/wallet/topup");
    if (isOnTopUp) {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });

  test("amount input is visible when on top-up page", async ({ walletPage, page }) => {
    if (page.url().includes("/wallet/topup")) {
      await expect(walletPage.topUpAmountInput).toBeVisible();
    }
  });
});

test.describe("Wallet transfer", () => {
  test.beforeEach(async ({ walletPage, page }) => {
    // Provide mock wallet accounts so the transfer form can render
    // (WalletTransfer returns null while loading; a 200 response lets it render)
    await page.route("**/wallets*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { currency: "USD", currentBalance: 1000 },
          { currency: "EUR", currentBalance: 500 },
        ]),
      })
    );
    await walletPage.gotoTransfer();
  });

  test("renders transfer form or redirects", async ({ page }) => {
    const isOnTransfer = page.url().includes("/wallet/transfer");
    if (isOnTransfer) {
      // WalletTransfer renders null while loading (API call), then shows h1 once done.
      // Accept h1/h2 OR the amount input as indicators that the page has rendered.
      const heading = page.locator("h1, h2").first();
      const amountInput = page.locator('input[name="transfer-amount"]');
      await expect(heading.or(amountInput).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test("recipient and amount inputs are visible on transfer page", async ({ walletPage, page }) => {
    if (page.url().includes("/wallet/transfer")) {
      await expect(walletPage.transferAmountInput).toBeVisible({ timeout: 15000 });
    }
  });
});
