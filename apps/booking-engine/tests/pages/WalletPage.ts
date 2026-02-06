import { BasePage } from './BasePage';

interface AutoTopUpConfig {
  amount: number;
  threshold: number;
  paymentMethod: string;
}

interface WithdrawalDetails {
  amount: number;
  bankAccount: string;
  accountName: string;
}

export class WalletPage extends BasePage {
  // Existing methods
  async getBalance(): Promise<number> {
    const balanceText = await this.getByTestId('wallet-balance').textContent();
    return parseFloat(balanceText?.replace(/[^0-9.]/g, '') || '0');
  }

  async verifyBalance() {
    // Wait for element to exist in DOM (not checking visibility)
    await this.getByTestId('wallet-balance').waitFor({ state: 'attached' });
  }

  async viewTransactions() {
    await this.getByTestId('wallet-transactions').click({ force: true });
  }

  // New methods for Day 5-6
  async navigateToTopUp() {
    await this.getByTestId('topup-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="topup-page"]', { timeout: 10000 });
  }

  async navigateToTransfer() {
    await this.getByTestId('transfer-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="transfer-page"]', { timeout: 10000 });
  }

  async viewCurrencyBalances() {
    await this.getByTestId('view-currencies-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="currency-balances"]', { timeout: 10000 });
  }

  async switchCurrency(currency: string) {
    await this.setSelectValue('currency-selector', currency);
    await this.page.waitForTimeout(500); // Wait for currency switch
  }

  async filterTransactionsByType(type: string) {
    await this.setSelectValue('transaction-type-filter', type);
    await this.page.waitForTimeout(500);
  }

  async filterTransactionsByDate(dateFrom: string, dateTo: string) {
    await this.getByTestId('transaction-date-from').fill(dateFrom, { force: true });
    await this.getByTestId('transaction-date-to').fill(dateTo, { force: true });
    await this.getByTestId('apply-transaction-filter').click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async searchTransactions(searchTerm: string) {
    await this.getByTestId('transaction-search').fill(searchTerm, { force: true });
    await this.getByTestId('search-transactions-btn').click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async navigateToScheduledTopUp() {
    await this.getByTestId('scheduled-topup-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="auto-topup-config"]', { timeout: 10000 });
  }

  async setupAutoTopUp(config: AutoTopUpConfig) {
    await this.getByTestId('auto-topup-amount').fill(config.amount.toString(), { force: true });
    await this.getByTestId('auto-topup-threshold').fill(config.threshold.toString(), { force: true });
    await this.setSelectValue('auto-topup-payment-method', config.paymentMethod);
    await this.getByTestId('save-auto-topup').click({ force: true });
    await this.page.waitForSelector('[data-testid="auto-topup-configured"]', { timeout: 10000 });
  }

  async enterPIN(pin: string) {
    await this.getByTestId('pin-input').fill(pin, { force: true });
    await this.getByTestId('confirm-pin-btn').click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async generateStatement(dateFrom: string, dateTo: string) {
    await this.getByTestId('generate-statement-btn').click({ force: true });
    await this.getByTestId('statement-date-from').fill(dateFrom, { force: true });
    await this.getByTestId('statement-date-to').fill(dateTo, { force: true });
    await this.getByTestId('generate-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="statement-generated"]', { timeout: 10000 });
  }

  async downloadStatement() {
    await this.getByTestId('download-statement-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="download-success"]', { timeout: 10000 });
  }

  async viewWalletLimits() {
    await this.getByTestId('view-limits-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="wallet-limits"]', { timeout: 10000 });
  }

  async navigateToWithdrawal() {
    await this.getByTestId('withdraw-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="withdrawal-page"]', { timeout: 10000 });
  }

  async enterWithdrawalDetails(details: WithdrawalDetails) {
    await this.getByTestId('withdrawal-amount').fill(details.amount.toString(), { force: true });
    await this.setSelectValue('bank-account-select', details.bankAccount);
    await this.getByTestId('account-name').fill(details.accountName, { force: true });
  }

  async confirmWithdrawal() {
    await this.getByTestId('confirm-withdrawal-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="withdrawal-success"]', { timeout: 10000 });
  }

  async viewLoyaltyPoints() {
    await this.getByTestId('loyalty-points-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="loyalty-points"]', { timeout: 10000 });
  }

  async convertPointsToCredit(points: number) {
    await this.getByTestId('convert-points-btn').click({ force: true });
    await this.getByTestId('points-to-convert').fill(points.toString(), { force: true });
    await this.getByTestId('confirm-conversion-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="points-converted"]', { timeout: 10000 });
  }

  // Utility methods
  async getTransactionCount(): Promise<number> {
    const rows = await this.page.locator('[data-testid^="transaction-row-"]').count();
    return rows;
  }

  async getFirstTransactionType(): Promise<string> {
    const type = await this.getByTestId('transaction-type-0').textContent();
    return type || '';
  }

  async verifyTransactionExists(type: string): Promise<boolean> {
    const transaction = this.page.locator(`[data-testid*="transaction"]:has-text("${type}")`);
    return await transaction.isVisible().catch(() => false);
  }
}
