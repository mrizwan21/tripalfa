/**
 * Custom Playwright fixtures for the B2B Admin test suite.
 *
 * Usage:
 *   import { test, expect } from "../../fixtures/test.fixture";
 */
import { test as base } from "@playwright/test";
import { B2BLoginPage } from "../pages/B2BLoginPage";
import { BookingsAdminPage } from "../pages/BookingsAdminPage";
import { mockAdminApi } from "../helpers/api-mocks";

type B2BAdminFixtures = {
  loginPage: B2BLoginPage;
  bookingsPage: BookingsAdminPage;
  /** Navigate to a route, register API mocks, and wait for networkidle. */
  goto: (path: string) => Promise<void>;
};

export const test = base.extend<B2BAdminFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new B2BLoginPage(page));
  },
  bookingsPage: async ({ page }, use) => {
    await use(new BookingsAdminPage(page));
  },
  goto: async ({ page }, use) => {
    await use(async (path: string) => {
      await mockAdminApi(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    });
  },
});

export { expect } from "@playwright/test";
