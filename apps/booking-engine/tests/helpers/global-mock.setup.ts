/**
 * Global test setup that adds API mocks for all tests.
 * This runs before each test and provides default mock responses.
 */
import { test as setup } from "@playwright/test";

setup("global-api-mocks", async ({ page }) => {
  // Mock auth endpoints
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

  await page.route("**/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Reset email sent" }),
    });
  });

  // Mock user endpoints
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
});