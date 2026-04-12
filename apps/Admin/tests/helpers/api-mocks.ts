/**
 * Shared Playwright route interceptors for B2B Admin E2E tests.
 *
 * Import `mockAdminApi` in test files that need to block real HTTP calls.
 * Every intercepted route returns a minimal JSON payload that is enough for
 * the page to render without errors.
 */
import type { Page } from "@playwright/test";

/** Register common API mock routes on the given page. */
export async function mockAdminApi(page: Page) {
  // Auth
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "mock_admin_jwt_token_tripalfa",
        data: {
          token: "mock_admin_jwt_token_tripalfa",
          user: {
            id: "admin_001",
            email: "admin@tripalfa.com",
            name: "Test Admin",
            role: "ADMIN",
            permissions: ["*"],
          },
        },
      }),
    });
  });

  // Bookings list
  await page.route("**/bookings**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      }),
    });
  });

  // Users list
  await page.route("**/users**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  // Finance / wallet
  await page.route("**/(finance|wallet|currencies)**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  // Suppliers
  await page.route("**/suppliers**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  // Rules
  await page.route("**/rules**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  // System health / organizations
  await page.route("**/(system|health|organizations)**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "healthy", data: [] }),
    });
  });
}
