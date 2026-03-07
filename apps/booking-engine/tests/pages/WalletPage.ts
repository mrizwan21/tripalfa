import type { Page } from "@playwright/test";

/** Page Object Model for the /wallet, /wallet/topup, and /wallet/transfer routes. */
export class WalletPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get balanceDisplay() {
    return this.page.locator('[data-testid="wallet-balance"], [class*="balance"]').first();
  }

  get topUpButton() {
    return this.page.getByRole("button", { name: /top.?up|add funds/i });
  }

  get transferButton() {
    return this.page.getByRole("button", { name: /transfer/i });
  }

  get transactionHistory() {
    return this.page.locator('[data-testid="transaction-list"], [class*="Transaction"]');
  }

  get loadingIndicator() {
    return this.page.locator('[data-testid="loading"], .animate-spin').first();
  }

  // Top-up page locators
  get topUpAmountInput() {
    return this.page.locator('input[name="topup-amount"]').first();
  }

  get topUpSubmitButton() {
    return this.page.getByRole("button", { name: /proceed|confirm|top.?up/i });
  }

  // Transfer page locators
  get transferRecipientInput() {
    return this.page.locator('select[name="transfer-from-currency"]').first();
  }

  get transferAmountInput() {
    return this.page.locator('input[name="transfer-amount"]').first();
  }

  get transferSubmitButton() {
    return this.page.getByRole("button", { name: /send|confirm transfer/i });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/wallet");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoTopUp() {
    await this.page.goto("/wallet/topup");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoTransfer() {
    await this.page.goto("/wallet/transfer");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForBalance() {
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await this.balanceDisplay.waitFor({ state: "visible", timeout: 10000 });
  }
}
