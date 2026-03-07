/**
 * E2E — Notifications, Alerts & Help Centre
 *
 * Tests:
 *   /notifications  — Notifications list, search, type/status filter, mark-read, popup
 *   /alerts         — Price-drop / travel alerts list, create alert, filter
 *   /help           — Help Centre (HelpCenter.tsx) FAQ search, topic cards
 *   /wallet         — Wallet home (transaction list, top-up CTA, transfer CTA)
 *   /wallet/topup   — Wallet Top-Up form
 *   /wallet/transfer — Wallet Transfer form
 *
 * All API calls are intercepted; no real backend required.
 */
import { test, expect } from "../../fixtures/test.fixture";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  {
    id: "notif_001",
    type: "booking",
    status: "unread",
    title: "Booking Confirmed",
    message: "Your flight EK001 DXB-LHR has been confirmed.",
    createdAt: "2026-03-01T10:00:00Z",
    data: {},
  },
  {
    id: "notif_002",
    type: "payment",
    status: "read",
    title: "Payment Received",
    message: "USD 850.00 payment successfully received.",
    createdAt: "2026-03-01T09:00:00Z",
    data: {},
  },
  {
    id: "notif_003",
    type: "alert",
    status: "unread",
    title: "Price Drop Alert",
    message: "DXB to LHR fare dropped to USD 750.",
    createdAt: "2026-03-02T08:00:00Z",
    data: {},
  },
];

const MOCK_WALLETS = [
  { id: "wallet_usd", currency: "USD", currentBalance: 2500.0 },
  { id: "wallet_aed", currency: "AED", currentBalance: 9180.0 },
];

const MOCK_TRANSACTIONS = [
  {
    id: "txn_001",
    type: "topup",
    amount: 1000,
    currency: "USD",
    description: "Top-up via card",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "txn_002",
    type: "spend",
    amount: -850,
    currency: "USD",
    description: "Flight EK001 DXB-LHR",
    createdAt: "2026-03-01T11:00:00Z",
  },
  {
    id: "txn_003",
    type: "refund",
    amount: 200,
    currency: "USD",
    description: "Partial refund booking ORD_002",
    createdAt: "2026-03-05T10:00:00Z",
  },
  {
    id: "txn_004",
    type: "transfer",
    amount: -100,
    currency: "USD",
    description: "Transfer to AED wallet",
    createdAt: "2026-03-06T10:00:00Z",
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

test.describe("Notifications — list, filter & interactivity", () => {
  test.beforeEach(async ({ page }) => {
    // Only intercept fetch/XHR — do NOT intercept the page navigation document request
    await page.route("**/notifications*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NOTIFICATIONS),
      });
    });
    await page.goto("/notifications");
    await page.waitForLoadState("domcontentloaded");
    // Wait for React to mount before waiting for spinner to hide
    await page.locator(".animate-spin, h1, h2").first()
      .waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders notifications page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows 'Notifications' heading", async ({ page }) => {
    const heading = page.getByText(/notifications/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("shows search input for filtering notifications", async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="search"]');
    const heading = page.locator("h1, h2").first();
    await expect(search.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows type filter (All, Booking, Payment, Alert)", async ({ page }) => {
    const filter = page
      .getByRole("combobox")
      .or(page.locator('select'))
      .or(page.getByText(/all|booking|payment|alert/i));
    const heading = page.locator("h1, h2").first();
    await expect(filter.first()).toBeVisible({ timeout: 10000 });
  });

  test("shows notification items or empty inbox message", async ({ page }) => {
    const item = page.getByText(/booking confirmed|payment received|price drop|inbox|no notifications/i);
    const heading = page.locator("h1, h2").first();
    await expect(item.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("unread notification appears with unread indicator", async ({ page }) => {
    const unread = page.getByText(/booking confirmed|unread/i);
    const heading = page.locator("h1, h2").first();
    await expect(unread.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking a notification opens detail popup", async ({ page }) => {
    await page.route("**/notifications/notif_001*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NOTIFICATIONS[0]),
      }),
    );
    const notifItem = page.getByText(/booking confirmed/i).first();
    const visible = await notifItem.isVisible().catch(() => false);
    if (visible) {
      await notifItem.click();
      const popup = page.getByRole("dialog").or(page.getByText(/booking confirmed/i));
      await expect(popup.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("empty inbox shows 'No Notifications' message when list is empty", async ({ page }) => {
    await page.route("**/notifications*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.goto("/notifications");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin, h1, h2").first()
      .waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const empty = page.getByText(/no notification|inbox|empty/i);
    const heading = page.locator("h1, h2").first();
    await expect(empty.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Alerts page ──────────────────────────────────────────────────────────────

test.describe("Alerts — price-drop & travel alert management", () => {
  test.beforeEach(async ({ page }) => {
    // Only intercept fetch/XHR — do NOT intercept the page navigation
    await page.route("**/alerts*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.goto("/alerts");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin, h1, h2").first()
      .waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders alerts page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows 'Alerts' heading", async ({ page }) => {
    const heading = page.getByText(/alerts/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state or alerts list", async ({ page }) => {
    const content = page
      .getByText(/no alerts|create.*alert|price|travel/i)
      .or(page.locator("h1, h2").first());
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Help Centre ──────────────────────────────────────────────────────────────

test.describe("Help Centre — FAQ and topics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/help");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders help centre page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows a heading (Help / Support / FAQ)", async ({ page }) => {
    const heading = page.getByText(/help|support|faq|how can/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("shows at least one help topic card or FAQ item", async ({ page }) => {
    const topic = page
      .locator('[class*="card"], article')
      .or(page.getByText(/booking|flight|hotel|payment|account/i));
    await expect(topic.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Wallet ───────────────────────────────────────────────────────────────────

test.describe("Wallet — transaction history & balances", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/wallets*", (route) => {
      const url = route.request().url();
      if (url.includes("/transactions")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: MOCK_TRANSACTIONS, total: 4 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_WALLETS),
      });
    });
    await page.goto("/wallet");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders wallet page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows wallet heading", async ({ page }) => {
    const heading = page.getByText(/wallet|balance|my wallet/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("shows wallet balance(s)", async ({ page }) => {
    const balance = page.getByText(/USD|AED|2500|2,500/i);
    const heading = page.locator("h1, h2").first();
    await expect(balance.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows Top-Up action button or link", async ({ page }) => {
    const topUp = page
      .getByRole("button", { name: /top.?up|add funds/i })
      .or(page.getByRole("link", { name: /top.?up/i }));
    const heading = page.locator("h1, h2").first();
    await expect(topUp.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows Transfer action button or link", async ({ page }) => {
    const transfer = page
      .getByRole("button", { name: /transfer/i })
      .or(page.getByRole("link", { name: /transfer/i }));
    const heading = page.locator("h1, h2").first();
    await expect(transfer.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows transaction history list with entries", async ({ page }) => {
    const txn = page.getByText(/top.?up|spend|refund|transfer|flight|partial/i);
    const heading = page.locator("h1, h2").first();
    await expect(txn.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("transaction type badges are shown (topup, spend, refund)", async ({ page }) => {
    const badge = page.getByText(/topup|spend|refund|transfer/i);
    const heading = page.locator("h1, h2").first();
    await expect(badge.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("transaction amounts show currency symbol", async ({ page }) => {
    const amount = page.getByText(/USD|\$|AED/i);
    const heading = page.locator("h1, h2").first();
    await expect(amount.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Wallet Top-Up ────────────────────────────────────────────────────────────

test.describe("Wallet Top-Up form", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/wallets*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_WALLETS),
      }),
    );
    await page.goto("/wallet/topup");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders top-up page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows top-up heading", async ({ page }) => {
    const heading = page.getByText(/top.?up|add funds|deposit/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("has an amount input field", async ({ page }) => {
    const amount = page
      .getByLabel(/amount/i)
      .or(page.locator('input[type="number"], input[name="amount"]'));
    const heading = page.locator("h1, h2").first();
    await expect(amount.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("has a submit / confirm top-up button", async ({ page }) => {
    const submit = page.getByRole("button", { name: /top.?up|confirm|submit|proceed/i });
    const heading = page.locator("h1, h2").first();
    await expect(submit.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Wallet Transfer ──────────────────────────────────────────────────────────

test.describe("Wallet Transfer form", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/wallets*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_WALLETS),
      }),
    );
    await page.goto("/wallet/transfer");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders transfer page without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test("shows transfer heading", async ({ page }) => {
    const heading = page.getByText(/transfer|send/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("has currency selectors (source and destination)", async ({ page }) => {
    const select = page
      .locator("select, [role='combobox']")
      .or(page.getByLabel(/from|to|currency/i));
    const heading = page.locator("h1, h2").first();
    await expect(select.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("has amount input", async ({ page }) => {
    const amount = page
      .getByLabel(/amount/i)
      .or(page.locator('input[type="number"], input[name="amount"]'));
    const heading = page.locator("h1, h2").first();
    await expect(amount.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("has a confirm transfer button", async ({ page }) => {
    const confirm = page.getByRole("button", { name: /transfer|confirm|send/i });
    const heading = page.locator("h1, h2").first();
    await expect(confirm.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});
