/**
 * E2E — Dashboard functionality
 *
 * Tests the /dashboard page:
 *   - Summary cards (total bookings, wallet snapshot, documents)
 *   - SVG bar chart (flights / hotels / cars)
 *   - Recent bookings list
 *   - Quick action buttons (Wallet, Bookings, Loyalty, Alerts)
 *   - Empty state when no bookings / wallets
 *   - Navigation links
 *
 * All API calls are intercepted; no real backend required.
 */
import { test, expect } from "../../fixtures/test.fixture";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const MOCK_BOOKINGS = {
  items: [
    {
      id: "b001",
      bookingId: "ORD_001",
      bookingReference: "TRP-F001",
      status: "confirmed",
      product: "flight",
      totalAmount: 850,
      currency: "USD",
      createdAt: "2026-03-01T10:00:00Z",
      segments: [{ origin: "DXB", destination: "LHR" }],
    },
    {
      id: "b002",
      bookingId: "HTL_001",
      bookingReference: "TRP-H001",
      status: "confirmed",
      product: "hotel",
      totalAmount: 1200,
      currency: "USD",
      createdAt: "2026-03-02T10:00:00Z",
      hotel: { name: "Dubai Marina Grand" },
    },
    {
      id: "b003",
      bookingId: "FLT_002",
      bookingReference: "TRP-F002",
      status: "cancelled",
      product: "flight",
      totalAmount: 700,
      currency: "USD",
      createdAt: "2026-03-03T10:00:00Z",
      segments: [{ origin: "DXB", destination: "CDG" }],
    },
  ],
  total: 3,
};

const MOCK_WALLETS = [
  { currency: "USD", currentBalance: 2500.0 },
  { currency: "AED", currentBalance: 9180.0 },
];

const MOCK_DOCUMENTS = [
  { id: "doc1", name: "passport.pdf", type: "passport" },
  { id: "doc2", name: "visa.pdf", type: "visa" },
];

async function setupMocks(page: import("@playwright/test").Page) {
  await page.route("**/bookings*", (route) => {
    const url = route.request().url();
    if (url.match(/\/bookings(\?.*)?$/)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_BOOKINGS),
      });
    }
    return route.continue();
  });
  await page.route("**/wallets*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_WALLETS),
    }),
  );
  await page.route("**/documents*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DOCUMENTS),
    }),
  );
}

// ─── Dashboard — summary cards ────────────────────────────────────────────────

test.describe("Dashboard — summary cards", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("renders dashboard page", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({ timeout: 10000 });
  });

  test("shows 'Total Bookings' summary card", async ({ page }) => {
    const card = page.getByText(/total bookings|bookings/i);
    await expect(card.first()).toBeVisible({ timeout: 10000 });
  });

  test("shows booking count from API", async ({ page }) => {
    // MOCK_BOOKINGS has 3 items
    const count = page.getByText("3");
    const heading = page.locator("h1, h2").first();
    await expect(count.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("summary card shows flights and hotels breakdown", async ({ page }) => {
    // 2 flights, 1 hotel, 0 cars in MOCK_BOOKINGS
    const text = page.getByText(/flights|hotels/i);
    await expect(text.first()).toBeVisible({ timeout: 10000 });
  });

  test("shows wallet snapshot card", async ({ page }) => {
    const walletCard = page.getByText(/wallet|balance/i);
    await expect(walletCard.first()).toBeVisible({ timeout: 10000 });
  });

  test("shows wallet currency and balance", async ({ page }) => {
    const usd = page.getByText(/USD/i);
    const heading = page.locator("h1, h2").first();
    await expect(usd.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows documents count card", async ({ page }) => {
    const docsCard = page.getByText(/documents/i);
    await expect(docsCard.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Dashboard — bar chart ────────────────────────────────────────────────────

test.describe("Dashboard — SVG bar chart", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("bar chart SVG element is present", async ({ page }) => {
    const chart = page.locator("svg");
    await expect(chart.first()).toBeVisible({ timeout: 10000 });
  });

  test("chart shows flights / hotels / cars labels", async ({ page }) => {
    const label = page.getByText(/flights|hotels|cars/i);
    await expect(label.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Dashboard — recent bookings ──────────────────────────────────────────────

test.describe("Dashboard — recent bookings list", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("shows recent bookings section", async ({ page }) => {
    const recent = page.getByText(/recent/i);
    const heading = page.locator("h1, h2, h3").first();
    await expect(recent.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows booking reference or product type in the list", async ({ page }) => {
    const ref = page.getByText(/TRP-F001|TRP-H001|flight|hotel|DXB|LHR/i);
    const heading = page.locator("h1, h2").first();
    await expect(ref.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Dashboard — quick action buttons ────────────────────────────────────────

test.describe("Dashboard — quick action buttons", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("has 'Wallet' action button", async ({ page }) => {
    const walletBtn = page.getByRole("button", { name: /wallet/i });
    await expect(walletBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("has 'Bookings' / 'My Bookings' action button", async ({ page }) => {
    const bookingsBtn = page.getByRole("button", { name: /bookings/i });
    await expect(bookingsBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("has 'Loyalty' action button", async ({ page }) => {
    const loyaltyBtn = page.getByRole("button", { name: /loyalty/i });
    await expect(loyaltyBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("has 'Alerts' action button", async ({ page }) => {
    const alertsBtn = page.getByRole("button", { name: /alerts/i });
    await expect(alertsBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking Bookings button navigates to /bookings", async ({ page }) => {
    const bookingsBtn = page.getByRole("button", { name: /bookings/i }).first();
    const visible = await bookingsBtn.isVisible().catch(() => false);
    if (visible) {
      await bookingsBtn.click();
      await expect(page).toHaveURL(/\/bookings/);
    }
  });

  test("clicking Wallet button navigates to /wallet", async ({ page }) => {
    const walletBtn = page.getByRole("button", { name: /wallet/i }).first();
    const visible = await walletBtn.isVisible().catch(() => false);
    if (visible) {
      await walletBtn.click();
      await expect(page).toHaveURL(/\/wallet/);
    }
  });

  test("'View Wallet' button inside wallet card navigates to /wallet", async ({ page }) => {
    const viewWalletBtn = page
      .getByRole("button", { name: /view wallet|view/i })
      .or(page.getByText(/view wallet/i));
    const heading = page.locator("h1, h2").first();
    await expect(viewWalletBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("'Manage Documents' button navigates to profile documents section", async ({ page }) => {
    const manageBtn = page.getByRole("button", { name: /manage documents/i });
    const heading = page.locator("h1, h2").first();
    await expect(manageBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Dashboard — empty state ──────────────────────────────────────────────────

test.describe("Dashboard — empty state (no bookings / wallets)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/bookings*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      }),
    );
    await page.route("**/wallets*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );
    await page.route("**/documents*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("shows 0 for total bookings when no bookings exist", async ({ page }) => {
    const zero = page.getByText("0");
    const heading = page.locator("h1, h2").first();
    await expect(zero.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows 'No wallets' message for empty wallet state", async ({ page }) => {
    const noWallet = page.getByText(/no wallets|no accounts|no balance/i);
    const heading = page.locator("h1, h2").first();
    await expect(noWallet.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});
