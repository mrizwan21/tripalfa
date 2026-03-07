/**
 * Custom Playwright fixtures for the Booking Engine test suite.
 *
 * Usage:
 *   import { test, expect } from "../../fixtures/test.fixture";
 */
import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { FlightSearchPage } from "../pages/FlightSearchPage";
import { HotelSearchPage } from "../pages/HotelSearchPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { WalletPage } from "../pages/WalletPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { BookingDetailPage } from "../pages/BookingDetailPage";
import { LoyaltyPage } from "../pages/LoyaltyPage";

/**
 * Intercepts all fetch/XHR requests and fulfils them with a fast 503, so pages
 * reach "networkidle" quickly without needing a real backend.  Individual tests
 * that want a specific response should register their own page.route() AFTER
 * this fixture runs — Playwright's LIFO handler order means the later (more
 * specific) handler always wins.
 */
async function stubApiCalls(page: Page): Promise<void> {
  await page.route("**", async (route) => {
    const resourceType = route.request().resourceType();
    if (resourceType === "fetch" || resourceType === "xhr") {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "no-backend" }),
      });
    }
    return route.continue();
  });
}

type BookingEngineFixtures = {
  loginPage: LoginPage;
  flightSearchPage: FlightSearchPage;
  hotelSearchPage: HotelSearchPage;
  bookingManagementPage: BookingManagementPage;
  walletPage: WalletPage;
  dashboardPage: DashboardPage;
  profilePage: ProfilePage;
  bookingDetailPage: BookingDetailPage;
  loyaltyPage: LoyaltyPage;
  /** Navigate to a route and wait for network to be idle. */
  goto: (path: string) => Promise<void>;
};

export const test = base.extend<BookingEngineFixtures>({
  // Override page to stub all fetch/XHR calls so pages load fast without a real backend.
  // Individual tests may register more-specific page.route() handlers that take precedence.
  page: async ({ page }, use) => {
    await stubApiCalls(page);
    await use(page);
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  flightSearchPage: async ({ page }, use) => {
    await use(new FlightSearchPage(page));
  },
  hotelSearchPage: async ({ page }, use) => {
    await use(new HotelSearchPage(page));
  },
  bookingManagementPage: async ({ page }, use) => {
    await use(new BookingManagementPage(page));
  },
  walletPage: async ({ page }, use) => {
    await use(new WalletPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  bookingDetailPage: async ({ page }, use) => {
    await use(new BookingDetailPage(page));
  },
  loyaltyPage: async ({ page }, use) => {
    await use(new LoyaltyPage(page));
  },
  goto: async ({ page }, use) => {
    await use(async (path: string) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    });
  },
});

export { expect } from "@playwright/test";
