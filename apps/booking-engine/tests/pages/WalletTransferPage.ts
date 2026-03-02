import { BasePage } from "./BasePage";

export class WalletTransferPage extends BasePage {
  async transfer(amount: number, toCurrency: string) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId("transfer-amount").fill(amount.toString(), {
      force: true,
    });
    await this.setSelectValue("transfer-currency", toCurrency);
    await this.getByTestId("transfer-submit").click({ force: true });
    await this.waitForNavigation();
  }

  async transferWithConversion(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) {
    // Select source currency
    await this.setSelectValue("from-currency", fromCurrency);

    // Select target currency
    await this.setSelectValue("to-currency", toCurrency);

    // Enter amount
    await this.getByTestId("transfer-amount").fill(amount.toString(), {
      force: true,
    });

    // Wait for conversion rate to display
    await this.page.waitForSelector('[data-testid="conversion-rate"]', {
      timeout: 10000,
    });

    // Submit transfer
    await this.getByTestId("transfer-submit").click({ force: true });

    // Wait for conversion success
    await this.page.waitForSelector('[data-testid="conversion-success"]', {
      timeout: 10000,
    });
  }

  async transferToUser(amount: number, recipientEmail: string) {
    // Enter recipient
    await this.getByTestId("recipient-email").fill(recipientEmail, {
      force: true,
    });

    // Enter amount
    await this.getByTestId("transfer-amount").fill(amount.toString(), {
      force: true,
    });

    // Add transfer note
    await this.getByTestId("transfer-note").fill("Transfer to user", {
      force: true,
    });

    // Submit transfer
    await this.getByTestId("transfer-submit").click({ force: true });

    // Wait for success
    await this.page.waitForSelector('[data-testid="transfer-success"]', {
      timeout: 10000,
    });
  }

  async verifyTransferDetails(): Promise<{
    amount: number;
    recipient: string;
    status: string;
  }> {
    const amountText = await this.getByTestId(
      "transfer-amount-display",
    ).textContent();
    const recipientText =
      await this.getByTestId("transfer-recipient").textContent();
    const statusText = await this.getByTestId("transfer-status").textContent();

    return {
      amount: parseFloat(amountText?.replace(/[^0-9.]/g, "") || "0"),
      recipient: recipientText || "",
      status: statusText || "",
    };
  }

  async cancelTransfer() {
    await this.getByTestId("cancel-transfer-btn").click({ force: true });
    await this.page.waitForSelector('[data-testid="transfer-cancelled"]', {
      timeout: 10000,
    });
  }

  async scheduleTransfer(
    amount: number,
    currency: string,
    scheduledDate: string,
  ) {
    // Enable scheduled transfer
    await this.getByTestId("schedule-transfer-checkbox").click({ force: true });

    // Set scheduled date
    await this.getByTestId("scheduled-date").fill(scheduledDate, {
      force: true,
    });

    // Enter amount
    await this.getByTestId("transfer-amount").fill(amount.toString(), {
      force: true,
    });

    // Select currency
    await this.setSelectValue("transfer-currency", currency);

    // Submit scheduled transfer
    await this.getByTestId("schedule-transfer-submit").click({ force: true });

    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="transfer-scheduled"]', {
      timeout: 10000,
    });
  }
}
