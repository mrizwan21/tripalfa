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
 * Intercepts all fetch/XHR requests and returns mock data for common endpoints.
 * Individual tests can override with specific page.route() handlers.
 * Uses LIFO ordering - later handlers take precedence.
 */
async function stubApiCalls(page: Page): Promise<void> {
  // Mock auth/login - returns success with tokens
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "mock_jwt_token_12345",
        refreshToken: "mock_refresh_token_67890",
        user: { id: "user_123", email: "test@tripalfa.com", name: "Test User", role: "customer" },
      }),
    });
  });

  // Mock auth/register
  await page.route("**/auth/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "mock_jwt_token_reg_12345",
        refreshToken: "mock_refresh_token_reg_67890",
        user: { id: "user_new", email: "newuser@tripalfa.com", name: "New User", role: "customer" },
      }),
    });
  });

  // Mock auth/forgot-password
  await page.route("**/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Reset email sent" }),
    });
  });

  // Mock user endpoints (profile, preferences, etc.)
  await page.route("**/user/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: {}, meta: {} }),
    });
  });

  // Mock bookings list
  await page.route("**/api/bookings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "booking_post_001",
            bookingRef: "BK-2026-001",
            status: "CONFIRMED",
            type: "FLIGHT",
            createdAt: new Date().toISOString(),
            origin: "DXB",
            destination: "LHR",
            passengers: [{ name: "Jane Doe" }],
            payment: { amount: 850, currency: "USD" },
          },
          {
            id: "booking_post_002",
            bookingRef: "BK-2026-002",
            status: "CONFIRMED",
            type: "HOTEL",
            createdAt: new Date().toISOString(),
            hotelName: "Grand Hyatt Dubai",
            checkIn: "2026-06-01",
            checkOut: "2026-06-05",
            payment: { amount: 1200, currency: "USD" },
          },
        ],
        meta: { totalItems: 2 },
      }),
    });
  });

  // Mock individual booking detail - flight
  await page.route("**/api/bookings/booking_post_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "booking_post_001",
          bookingRef: "BK-2026-001",
          status: "CONFIRMED",
          type: "FLIGHT",
          createdAt: "2026-05-15T10:00:00Z",
          passengers: [
            { name: "Jane Doe", email: "jane.doe@example.com", type: "adult" }
          ],
          flights: [
            {
              origin: "DXB",
              destination: "LHR",
              originCity: "Dubai",
              destinationCity: "London",
              airline: "Emirates",
              flightNumber: "EK001",
              departureTime: "2026-06-01T10:00:00Z",
              arrivalTime: "2026-06-01T15:00:00Z",
            }
          ],
          payment: {
            amount: 850,
            currency: "USD",
            status: "PAID",
          },
        },
      }),
    });
  });

  // Mock individual booking detail - hotel
  await page.route("**/api/bookings/booking_post_002", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "booking_post_002",
          bookingRef: "BK-2026-002",
          status: "CONFIRMED",
          type: "HOTEL",
          createdAt: "2026-05-15T10:00:00Z",
          hotelName: "Grand Hyatt Dubai",
          checkIn: "2026-06-01",
          checkOut: "2026-06-05",
          roomType: "Deluxe Room",
          guests: [{ name: "John Smith" }],
          payment: {
            amount: 1200,
            currency: "USD",
            status: "PAID",
          },
        },
      }),
    });
  });

  // Mock any other booking detail endpoints
  await page.route("**/api/bookings/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "booking_123",
          bookingRef: "BK-2026-001",
          status: "CONFIRMED",
          type: "FLIGHT",
          passengers: [{ name: "Test Passenger" }],
          flights: [{ origin: "DXB", destination: "LHR" }],
          payment: { amount: 850, currency: "USD" },
        },
      }),
    });
  });

  // Default API response for other endpoints
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], meta: { totalItems: 0 } }),
    });
  });

  // Default: return empty successful responses for other calls
  await page.route("**", async (route) => {
    const resourceType = route.request().resourceType();
    if (resourceType === "fetch" || resourceType === "xhr") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], meta: { totalItems: 0 } }),
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
