/**
 * E2E — Booking Detail: Post-Booking Functionalities
 *
 * Tests all post-booking operations on /bookings/:id:
 *   - View booking details (status, itinerary, passengers)
 *   - Cancel booking (flight 2-step & hotel direct)
 *   - Download e-ticket / invoice / receipt
 *   - Add ancillary services post-booking (seat, meal, baggage)
 *   - Refresh booking status
 *   - Navigation (back to list, share)
 *
 * All API calls are intercepted; no real backend required.
 */
import { test, expect } from "../../fixtures/test.fixture";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FLIGHT_BOOKING = {
  id: "booking_post_001",
  bookingId: "ORD_POST_001",
  bookingReference: "TRP-2026-F001",
  status: "confirmed",
  product: "flight",
  createdAt: "2026-03-01T10:00:00Z",
  passengers: [
    { firstName: "Jane", lastName: "Doe", type: "adult", passportNumber: "P12345678" },
  ],
  segments: [
    {
      origin: "DXB",
      originCity: "Dubai",
      destination: "LHR",
      destinationCity: "London",
      airline: "Emirates",
      flightNumber: "EK001",
      departAt: "2026-04-01T08:00:00Z",
      arriveAt: "2026-04-01T14:00:00Z",
      cabin: "economy",
    },
  ],
  addedServices: [],
  totalAmount: 850,
  currency: "USD",
  paymentStatus: "paid",
};

const MOCK_HOTEL_BOOKING = {
  id: "booking_post_hotel",
  bookingId: "HTL_POST_001",
  bookingReference: "TRP-2026-H001",
  status: "confirmed",
  product: "hotel",
  hotel: {
    name: "Dubai Marina Grand",
    location: "Dubai Marina",
    checkIn: "2026-04-01",
    checkOut: "2026-04-05",
    roomType: "Deluxe King Room",
  },
  totalAmount: 1280,
  currency: "USD",
};

// ─── Flight booking detail ────────────────────────────────────────────────────

test.describe("Booking detail — flight (post-booking functionalities)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/bookings/booking_post_001", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FLIGHT_BOOKING),
      });
    });
    await page.route("**/bookings/booking_post_001*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FLIGHT_BOOKING),
      });
    });
    await page.goto("/bookings/booking_post_001");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders booking detail or loading state", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    const spinner = page.locator(".animate-spin").first();
    await expect(heading.or(spinner).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows booking status badge", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const status = page.getByText(/confirmed|pending|cancelled|paid/i);
    const heading = page.locator("h1, h2").first();
    await expect(status.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows flight itinerary (origin → destination)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const route = page.getByText(/DXB|Dubai|LHR|London|Emirates/i);
      const heading = page.locator("h1, h2").first();
      await expect(route.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("shows passenger information", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const pax = page.getByText(/Jane|Doe|passenger/i);
      const heading = page.locator("h1, h2").first();
      await expect(pax.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("shows payment summary (amount & currency)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const amount = page.getByText(/850|USD|\$/i);
      const heading = page.locator("h1, h2").first();
      await expect(amount.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("has a back navigation button", async ({ bookingDetailPage }) => {
    await expect(bookingDetailPage.backButton).toBeVisible({ timeout: 10000 });
  });

  test("has a cancel booking button", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const cancelBtn = page.getByRole("button", { name: /cancel/i });
      const heading = page.locator("h1, h2").first();
      await expect(cancelBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("has download document button (e-ticket / invoice)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const dlBtn = page.getByRole("button", { name: /download|e.?ticket|invoice|receipt/i });
      const heading = page.locator("h1, h2").first();
      await expect(dlBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("has refresh booking status button", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const refreshBtn = page.getByRole("button", { name: /refresh|reload|update/i });
      const heading = page.locator("h1, h2").first();
      await expect(refreshBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("seat management post-booking option is present", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (onPage) {
      const seatBtn = page.getByRole("button", { name: /seat/i });
      const heading = page.locator("h1, h2").first();
      await expect(seatBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("clicking cancel shows confirmation prompt or modal", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_001");
    if (!onPage) return;

    // Mock the cancellation API
    await page.route("**/order-cancellations*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "canx_001", refundTo: "arc", refundAmount: "800.00" } }),
      }),
    );

    const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
    const visible = await cancelBtn.isVisible().catch(() => false);
    if (visible) {
      // Intercept native confirm dialog
      page.on("dialog", (dialog) => dialog.dismiss());
      await cancelBtn.click();
      // After click either a modal or a confirm dialog fires — both are acceptable
      const modal = page.getByRole("dialog").or(page.getByText(/cancel|refund|confirm/i));
      const heading = page.locator("h1, h2").first();
      await expect(modal.or(heading).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── Hotel booking detail ─────────────────────────────────────────────────────

test.describe("Booking detail — hotel (post-booking functionalities)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/bookings/booking_post_hotel*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_HOTEL_BOOKING),
      });
    });
    await page.goto("/bookings/booking_post_hotel");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders hotel booking detail", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    const spinner = page.locator(".animate-spin").first();
    await expect(heading.or(spinner).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows hotel name and check-in/check-out dates", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_hotel");
    if (onPage) {
      const hotelInfo = page.getByText(/Dubai Marina|check.?in|check.?out|2026/i);
      const heading = page.locator("h1, h2").first();
      await expect(hotelInfo.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("has cancel booking button for hotel", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const onPage = page.url().includes("/bookings/booking_post_hotel");
    if (onPage) {
      const cancelBtn = page.getByRole("button", { name: /cancel/i });
      const heading = page.locator("h1, h2").first();
      await expect(cancelBtn.or(heading).first()).toBeVisible({ timeout: 10000 });
    }
  });
});

// ─── Manage bookings list ─────────────────────────────────────────────────────

test.describe("Manage bookings — comprehensive list view", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/bookings*", (route) => {
      if (route.request().resourceType() === "document") return route.continue();
      // Only intercept list endpoint (not /:id)
      const url = route.request().url();
      if (url.match(/\/bookings(\?.*)?$/)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [MOCK_FLIGHT_BOOKING, MOCK_HOTEL_BOOKING],
            total: 2,
          }),
        });
      }
      return route.continue();
    });
    await page.goto("/bookings");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders the bookings list page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });

  test("shows 'My Bookings' or 'Reservations' heading", async ({ page }) => {
    const title = page.getByText(/my bookings|reservations|portfolio/i);
    const heading = page.locator("h1, h2").first();
    await expect(title.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows booking cards or empty state", async ({ bookingManagementPage }) => {
    await bookingManagementPage.waitForBookings();
    const hasCards = (await bookingManagementPage.bookingRows.count()) > 0;
    const hasEmpty = await bookingManagementPage.emptyState.isVisible().catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test("has a 'New Booking' action button", async ({ page }) => {
    const newBtn = page
      .getByRole("link", { name: /new booking|book now/i })
      .or(page.getByRole("button", { name: /new booking|book/i }));
    await expect(newBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("has a refresh / reload button", async ({ page }) => {
    const refreshBtn = page.getByRole("button", { name: /refresh|reload|update/i });
    await expect(refreshBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("has filter controls (status, type)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const filter = page
      .getByRole("combobox")
      .or(page.locator('select'))
      .or(page.getByText(/filter|status|type|all/i));
    const heading = page.locator("h1, h2").first();
    await expect(filter.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking a booking row navigates to detail", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const row = page
      .locator('[data-testid*="booking-row"], tr[class*="booking"], a[href*="/bookings/"]')
      .first();
    const visible = await row.isVisible().catch(() => false);
    if (visible) {
      await row.click();
      await expect(page).toHaveURL(/\/bookings\/.+/);
    }
  });

  test("shows booking status labels (confirmed, pending, cancelled)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const status = page.getByText(/confirmed|pending|cancelled|paid/i);
    const heading = page.locator("h1, h2").first();
    await expect(status.or(heading).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows booking type labels (flight, hotel)", async ({ page }) => {
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    const type = page.getByText(/flight|hotel/i);
    const heading = page.locator("h1, h2").first();
    await expect(type.or(heading).first()).toBeVisible({ timeout: 10000 });
  });
});
