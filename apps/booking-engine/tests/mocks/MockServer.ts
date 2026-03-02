import { Page } from "@playwright/test";

declare global {
  interface Window {
    sentNotifications?: Array<Record<string, unknown>>;
    webhookEvents?: Array<Record<string, unknown>>;
    walletBalances?: Map<string, number>;
    holdOrderData?: Record<string, unknown> | null;
  }
}

export class MockServer {
  private page: Page;
  private baseUrl = "http://localhost:3004";

  constructor(page: Page) {
    this.page = page;
  }

  async start() {
    // Mock server should already be running, but we can add health check
    await this.page.waitForTimeout(100); // Brief wait for server to be ready

    // Set up event listeners for mock events
    await this.setupEventListeners();
  }

  private async setupEventListeners() {
    // Listen for payment completion events
    await this.page.exposeFunction(
      "handleMockPaymentCompleted",
      async (eventData: any) => {
        await this.handlePaymentCompleted(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockPaymentCompleted", (event: any) => {
        (window as any).handleMockPaymentCompleted(event.detail);
      });
    });

    // Listen for wallet credit events
    await this.page.exposeFunction(
      "handleMockWalletCredit",
      async (eventData: any) => {
        await this.handleWalletCredit(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockWalletCredit", (event: any) => {
        (window as any).handleMockWalletCredit(event.detail);
      });
    });

    // Listen for wallet debit events
    await this.page.exposeFunction(
      "handleMockWalletDebit",
      async (eventData: any) => {
        await this.handleWalletDebit(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockWalletDebit", (event: any) => {
        (window as any).handleMockWalletDebit(event.detail);
      });
    });

    // Listen for wallet transfer events
    await this.page.exposeFunction(
      "handleMockWalletTransfer",
      async (eventData: any) => {
        await this.handleWalletTransfer(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockWalletTransfer", (event: any) => {
        (window as any).handleMockWalletTransfer(event.detail);
      });
    });

    // Listen for low balance alert events
    await this.page.exposeFunction(
      "handleMockLowBalanceAlert",
      async (eventData: any) => {
        await this.handleLowBalanceAlert(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockLowBalanceAlert", (event: any) => {
        (window as any).handleMockLowBalanceAlert(event.detail);
      });
    });

    // Listen for hold order created events
    await this.page.exposeFunction(
      "handleMockHoldOrderCreated",
      async (eventData: any) => {
        await this.handleHoldOrderCreated(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockHoldOrderCreated", (event: any) => {
        (window as any).handleMockHoldOrderCreated(event.detail);
      });
    });

    // Listen for refund processed events
    await this.page.exposeFunction(
      "handleMockRefundProcessed",
      async (eventData: any) => {
        await this.handleRefundProcessed(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockRefundProcessed", (event: any) => {
        (window as any).handleMockRefundProcessed(event.detail);
      });
    });

    // Listen for bank transfer events
    await this.page.exposeFunction(
      "handleMockBankTransferCompleted",
      async (eventData: any) => {
        await this.handleBankTransferCompleted(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockBankTransferCompleted", (event: any) => {
        (window as any).handleMockBankTransferCompleted(event.detail);
      });
    });

    await this.page.exposeFunction(
      "handleMockBankTransferFailed",
      async (eventData: any) => {
        await this.handleBankTransferFailed(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockBankTransferFailed", (event: any) => {
        (window as any).handleMockBankTransferFailed(event.detail);
      });
    });

    // Listen for payment reminder events
    await this.page.exposeFunction(
      "handleMockPaymentReminderScheduled",
      async (eventData: any) => {
        await this.handlePaymentReminderScheduled(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockPaymentReminderScheduled", (event: any) => {
        (window as any).handleMockPaymentReminderScheduled(event.detail);
      });
    });

    await this.page.exposeFunction(
      "handleMockUrgentPaymentReminder",
      async (eventData: any) => {
        await this.handleUrgentPaymentReminder(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockUrgentPaymentReminder", (event: any) => {
        (window as any).handleMockUrgentPaymentReminder(event.detail);
      });
    });

    // Listen for time advance events
    await this.page.exposeFunction(
      "handleMockTimeAdvanced",
      async (eventData: any) => {
        await this.handleTimeAdvanced(eventData);
      },
    );

    await this.page.evaluate(() => {
      window.addEventListener("mockTimeAdvanced", (event: any) => {
        (window as any).handleMockTimeAdvanced(event.detail);
      });
    });
  }

  async stop() {
    // Clean up any test data if needed
    await this.clearNotifications();
  }

  // Payment gateway mocking
  async mockPaymentGateway(status: "success" | "failure" | "partial") {
    await this.page.route("**/stripe/payment_intents", async (route) => {
      const request = route.request();
      const body = request.postDataJSON();

      let responseStatus = "succeeded";
      if (status === "failure") {
        responseStatus = "failed";
      } else if (status === "partial") {
        responseStatus = "requires_payment_method"; // Simulate partial payment
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: `pi_${Math.random().toString(36).substr(2, 9)}`,
          status: responseStatus,
          amount: body.amount,
          currency: body.currency,
        }),
      });
    });
  }

  // Webhook endpoint mocking
  async mockWebhookEndpoint(
    type: string,
    options?: { simulateFailure?: boolean },
  ) {
    const webhookPath = `/webhooks/${type}`;
    await this.page.route(`**${webhookPath}`, async (route) => {
      if (options?.simulateFailure) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ received: true }),
        });
      }
    });
  }

  async mockWebhookWithSignature(signatureType: "valid" | "invalid") {
    await this.page.route("**/webhooks/payment*", async (route) => {
      const request = route.request();
      const headers = request.headers();

      // Simulate signature validation
      const isValidSignature = signatureType === "valid";

      if (isValidSignature) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ received: true, signature_valid: true }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid signature" }),
        });
      }
    });
  }

  // Wallet service mocking
  async mockWalletService() {
    await this.page.route("**/wallet/transactions", async (route) => {
      const request = route.request();
      const body = request.postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
          balance: 1000 + (body.type === "credit" ? body.amount : -body.amount),
          transaction: {
            ...body,
            id: `txn_${Math.random().toString(36).substr(2, 9)}`,
          },
        }),
      });
    });
  }

  // Notification service mocking
  async mockNotificationService() {
    await this.page.route("**/notifications/send", async (route) => {
      const request = route.request();
      const body = request.postDataJSON();

      // Store notification for later retrieval
      await this.page.evaluate((notification) => {
        if (!window.sentNotifications) {
          window.sentNotifications = [];
        }
        window.sentNotifications.push({
          ...notification,
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9),
        });
      }, body);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sent: true,
          notificationId: Math.random().toString(36).substr(2, 9),
        }),
      });
    });
  }

  // Get sent notifications
  async getSentNotifications(): Promise<any[]> {
    const notifications = await this.page.evaluate(() => {
      return window.sentNotifications || [];
    });
    return notifications;
  }

  // Clear notifications
  async clearNotifications() {
    await this.page.evaluate(() => {
      window.sentNotifications = [];
    });

    // Also clear on server side
    await this.page.request
      .post(`${this.baseUrl}/notifications/sent`, {
        data: { action: "clear" },
      })
      .catch(() => {}); // Ignore errors
  }

  // Bank transfer mocking
  async mockBankTransfer(status: "success" | "failure") {
    await this.page.route("**/bank/transfer/*", async (route) => {
      const url = route.request().url();
      const isComplete = url.includes("/complete/");
      const isFail = url.includes("/fail/");

      if (status === "success" && isComplete) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "completed" }),
        });
      } else if (status === "failure" && isFail) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "failed",
            error: "insufficient_funds",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "initiated" }),
        });
      }
    });
  }

  // Payment reminder mocking
  async mockPaymentReminder() {
    await this.page.route("**/payments/reminder*", async (route) => {
      const request = route.request();
      const url = request.url();

      if (url.includes("/urgent")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sent: true,
            reminderId: Math.random().toString(36).substr(2, 9),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            scheduled: true,
            reminderId: Math.random().toString(36).substr(2, 9),
          }),
        });
      }
    });
  }

  // Simulate webhook events
  async simulateWebhookEvent(type: string, data: any) {
    await this.page.evaluate(
      ({ webhookType, webhookData }) => {
        window.dispatchEvent(
          new CustomEvent("mockWebhookReceived", {
            detail: { type: webhookType, data: webhookData },
          }),
        );
      },
      { webhookType: type, webhookData: data },
    );
  }

  // Simulate wallet events
  async simulateWalletEvent(type: string, data: any) {
    await this.page.evaluate(
      ({ eventType, eventData }) => {
        window.dispatchEvent(
          new CustomEvent("mockWalletEvent", {
            detail: { type: eventType, data: eventData },
          }),
        );
      },
      { eventType: type, eventData: data },
    );
  }

  // Simulate bank transfer events
  async simulateBankTransferEvent(type: string, data: any) {
    await this.page.evaluate(
      ({ eventType, eventData }) => {
        window.dispatchEvent(
          new CustomEvent(`mockBankTransfer${eventType}`, {
            detail: eventData,
          }),
        );
      },
      { eventType: type, eventData: data },
    );
  }

  // Simulate payment reminder events
  async simulatePaymentReminderEvent(type: string, data: any) {
    await this.page.evaluate(
      ({ eventType, eventData }) => {
        window.dispatchEvent(
          new CustomEvent(`mockPaymentReminder${eventType}`, {
            detail: eventData,
          }),
        );
      },
      { eventType: type, eventData: data },
    );
  }

  // Simulate time advancement for scheduled events
  async simulateTimeAdvance(days: number) {
    await this.page.evaluate((daysToAdvance) => {
      window.dispatchEvent(
        new CustomEvent("mockTimeAdvanced", {
          detail: { days: daysToAdvance },
        }),
      );
    }, days);
  }

  // Get webhook events from server
  async getWebhookEvents(): Promise<any[]> {
    try {
      const response = await this.page.request.get(
        `${this.baseUrl}/webhooks/events`,
      );
      return response.json().then((data) => data.events || []);
    } catch {
      return [];
    }
  }

  // Get wallet balance
  async getWalletBalance(userId: string): Promise<number> {
    try {
      const response = await this.page.request.get(
        `${this.baseUrl}/wallet/balance/${userId}`,
      );
      const data = await response.json();
      return data.balance || 0;
    } catch {
      return 0;
    }
  }

  // Event handlers for mock events
  private async handlePaymentCompleted(eventData: any) {
    // Simulate payment received notification
    await this.sendNotification({
      type: "payment_received",
      channels: ["email", "sms", "in_app"],
      priority: "high",
      data: {
        amount: eventData.amount,
        currency: eventData.currency,
        bookingRef: eventData.bookingRef,
      },
    });

    // Simulate booking confirmed notification
    await this.sendNotification({
      type: "booking_confirmed",
      channels: ["email", "sms", "in_app"],
      data: {
        bookingRef: eventData.bookingRef,
      },
    });
  }

  private async handleWalletCredit(eventData: any) {
    // Simulate wallet credit notification
    await this.sendNotification({
      type: "wallet_credit",
      channels: ["email", "in_app"],
      data: {
        amount: eventData.amount,
        currency: eventData.currency || "USD",
        newBalance: eventData.newBalance,
      },
    });
  }

  private async handleWalletDebit(eventData: any) {
    // Simulate wallet debit notification
    await this.sendNotification({
      type: "wallet_debit",
      channels: ["email", "in_app"],
      data: {
        amount: eventData.amount,
        bookingId: eventData.bookingId,
        remainingBalance: eventData.remainingBalance,
      },
    });
  }

  private async handleWalletTransfer(eventData: any) {
    // Simulate wallet transfer notification
    await this.sendNotification({
      type: "wallet_transfer",
      channels: ["email", "in_app"],
      data: {
        amount: eventData.amount,
        toWalletId: eventData.toWalletId,
        remainingBalance: eventData.remainingBalance,
      },
    });
  }

  private async handleLowBalanceAlert(eventData: any) {
    // Simulate low balance alert notification
    await this.sendNotification({
      type: "low_balance_alert",
      channels: ["email", "sms", "in_app"],
      priority: "high",
      data: {
        currentBalance: eventData.currentBalance,
        threshold: eventData.threshold,
      },
    });
  }

  private async handleHoldOrderCreated(eventData: any) {
    // Store hold order data for later use
    await this.page.evaluate((holdOrder) => {
      window.holdOrderData = holdOrder;
    }, eventData);
  }

  private async handleRefundProcessed(eventData: any) {
    // Simulate refund notification
    await this.sendNotification({
      type: "refund_processed",
      channels: ["email", "in_app"],
      data: {
        amount: eventData.amount,
        reason: eventData.reason,
        bookingRef: eventData.bookingRef,
      },
    });
  }

  private async handleBankTransferCompleted(eventData: any) {
    // Simulate bank transfer completion notification
    await this.sendNotification({
      type: "bank_transfer_completed",
      channels: ["email", "in_app"],
      data: {
        reference: eventData.reference,
        amount: eventData.amount,
      },
    });
  }

  private async handleBankTransferFailed(eventData: any) {
    // Simulate bank transfer failure notification
    await this.sendNotification({
      type: "bank_transfer_failed",
      channels: ["email", "sms", "in_app"],
      priority: "high",
      data: {
        error: eventData.error,
        amount: eventData.amount,
      },
    });
  }

  private async handlePaymentReminderScheduled(eventData: any) {
    // Simulate payment reminder notification
    await this.sendNotification({
      type: "payment_reminder",
      channels: ["email", "in_app"],
      data: {
        bookingId: eventData.bookingId,
        dueDate: eventData.dueDate,
        amount: eventData.amount,
      },
    });
  }

  private async handleUrgentPaymentReminder(eventData: any) {
    // Simulate urgent payment reminder notification
    await this.sendNotification({
      type: "urgent_payment_reminder",
      channels: ["email", "sms", "in_app"],
      priority: "high",
      data: {
        bookingId: eventData.bookingId,
        dueDate: eventData.dueDate,
        amount: eventData.amount,
      },
    });
  }

  private async handleTimeAdvanced(eventData: any) {
    // Handle time advancement for scheduled events
    const days = eventData.days;
    // This could trigger scheduled reminders, etc.
    console.log(`Time advanced by ${days} days`);
  }

  // Helper method to send notifications
  private async sendNotification(notification: {
    type: string;
    channels: string[];
    priority?: string;
    data: any;
  }) {
    await this.page.evaluate((notif) => {
      if (!window.sentNotifications) {
        window.sentNotifications = [];
      }
      window.sentNotifications.push({
        ...notif,
        timestamp: new Date(),
        id: Math.random().toString(36).substr(2, 9),
      });
    }, notification);
  }

  // Reset all mock data
  async reset() {
    await this.clearNotifications();
    await this.page.evaluate(() => {
      window.sentNotifications = [];
      window.webhookEvents = [];
      window.walletBalances = new Map();
      window.holdOrderData = null;
    });
  }
}
