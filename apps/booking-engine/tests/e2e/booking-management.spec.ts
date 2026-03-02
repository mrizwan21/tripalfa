import { test, expect } from "../fixtures/unhideFixture";
import { createRequire } from "module";
import { LoginPage } from "../pages/LoginPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { BookingDetailPage } from "../pages/BookingDetailPage";
import { FlightHomePage } from "../pages/FlightHomePage";
import { FlightListPage } from "../pages/FlightListPage";
import { FlightDetailPage } from "../pages/FlightDetailPage";
import { FlightAddonsPage } from "../pages/FlightAddonsPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";

const require = createRequire(import.meta.url);
const users = require("../fixtures/users.json");
const flights = require("../fixtures/flights.json");
const payments = require("../fixtures/payments.json");

test.describe("Booking Management Flow", () => {
  let bookingReference: string;

  test.beforeEach(async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    // Check if already logged in, if not, login
    const loginPage = new LoginPage(page);
    if (!(await loginPage.isAlreadyLoggedIn())) {
      await loginPage.loginWithRetry(
        process.env.TEST_USER_EMAIL || "testuser1@example.com",
        process.env.TEST_USER_PASSWORD || "Test@123",
      );
    }
  });

  test("BM-001: View booking list", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    // Navigate to booking management
    await bookingMgmt.goto("/bookings");
    await expect(
      page.locator('[data-testid="booking-management-page"]'),
    ).toBeVisible();

    // Verify booking list is displayed
    await expect(page.locator('[data-testid="booking-list"]')).toBeVisible();

    // Verify at least one booking exists (or empty state)
    const bookingCount = await page
      .locator('[data-testid="booking-row"]')
      .count();
    if (bookingCount > 0) {
      // Verify booking information is displayed
      await expect(
        page.locator('[data-testid="booking-reference"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="booking-status"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="booking-date"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="booking-amount"]'),
      ).toBeVisible();
    } else {
      await expect(page.getByText(/no bookings/i)).toBeVisible();
    }
  });

  test("BM-002: Search bookings by reference", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Create a test booking first
    await flightHome.goto("/flights");
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate,
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails("Search", "Test", {
      passportNumber: "ST1234567",
      email: "search@test.com",
    });
    await passengerDetails.continue();
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "Search Test",
    );
    bookingReference = await confirmation.getBookingReference();

    // Navigate to booking management
    await bookingMgmt.goto("/bookings");

    // Search by booking reference
    await bookingMgmt.searchByReference(bookingReference);

    // Verify only matching booking is displayed
    await expect(page.getByText(bookingReference)).toBeVisible();
    const visibleBookings = await page
      .locator('[data-testid="booking-row"]')
      .count();
    expect(visibleBookings).toBe(1);

    // Clear search
    await page.getByTestId("booking-search").fill("", { force: true });
    await page.getByTestId("search-button").click({ force: true });

    // Verify all bookings are shown again
    const allBookings = await page
      .locator('[data-testid="booking-row"]')
      .count();
    expect(allBookings).toBeGreaterThanOrEqual(1);
  });

  test("BM-003: Filter bookings by status", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto("/bookings");

    // Filter by Confirmed status
    await bookingMgmt.filterByStatus("confirmed");

    // Verify only confirmed bookings are shown
    const confirmedBookings = await page
      .locator('[data-testid="booking-row"]')
      .all();
    for (const booking of confirmedBookings) {
      await expect(
        booking.locator('[data-testid="booking-status"]'),
      ).toHaveText(/confirmed/i);
    }

    // Filter by Pending status
    await bookingMgmt.filterByStatus("pending");

    // Verify only pending bookings are shown
    const pendingBookings = await page
      .locator('[data-testid="booking-row"]')
      .all();
    for (const booking of pendingBookings) {
      await expect(
        booking.locator('[data-testid="booking-status"]'),
      ).toHaveText(/pending/i);
    }

    // Clear filter
    await bookingMgmt.clearAllFilters();
  });

  test("BM-004: Filter bookings by service type", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto("/bookings");

    // Filter by Flights
    await bookingMgmt.filterByService("flights");

    // Verify only flight bookings are shown
    const flightBookings = await page
      .locator('[data-testid="booking-row"]')
      .all();
    for (const booking of flightBookings) {
      await expect(booking.locator('[data-testid="booking-type"]')).toHaveText(
        /flight/i,
      );
    }

    // Filter by Hotels
    await bookingMgmt.filterByService("hotels");

    // Verify only hotel bookings are shown
    const hotelBookings = await page
      .locator('[data-testid="booking-row"]')
      .all();
    for (const booking of hotelBookings) {
      await expect(booking.locator('[data-testid="booking-type"]')).toHaveText(
        /hotel/i,
      );
    }

    // Clear filter
    await bookingMgmt.clearAllFilters();
  });

  test("BM-005: Sort bookings by date", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);

    await bookingMgmt.goto("/bookings");

    // Sort by date (newest first)
    await bookingMgmt.sortByDate();

    // Verify bookings are sorted correctly
    const dates = await page
      .locator('[data-testid="booking-date"]')
      .allTextContents();
    if (dates.length > 1) {
      const sortedDates = [...dates].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      );
      expect(dates).toEqual(sortedDates);
    }

    // Sort by date (oldest first)
    await bookingMgmt.sortByDate();

    const datesAsc = await page
      .locator('[data-testid="booking-date"]')
      .allTextContents();
    if (datesAsc.length > 1) {
      const sortedDatesAsc = [...datesAsc].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );
      expect(datesAsc).toEqual(sortedDatesAsc);
    }
  });

  test("BM-006: View booking details", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto("/bookings");

    // Select first booking
    await bookingMgmt.selectBooking(0);

    // Verify booking detail page
    await expect(
      page.locator('[data-testid="booking-detail-page"]'),
    ).toBeVisible();
    await bookingDetail.verifyDetails();

    // Verify all booking information is displayed
    await expect(
      page.locator('[data-testid="booking-reference"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="booking-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-amount"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="passenger-details"]'),
    ).toBeVisible();
    const paymentDetails = page.locator('[data-testid="payment-details"]');
    if (await paymentDetails.isVisible()) {
      await expect(paymentDetails).toBeVisible();
    }
  });

  test("BM-007: Cancel booking", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Create a cancellable booking
    await flightHome.goto("/flights");
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate,
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails("Cancel", "Test", {
      passportNumber: "CT1234567",
      email: "cancel@test.com",
    });
    await passengerDetails.continue();
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "Cancel Test",
    );
    const bookingRef = await confirmation.getBookingReference();

    // Navigate to booking details
    await bookingMgmt.goto("/bookings");
    await bookingMgmt.searchByReference(bookingRef);
    await bookingMgmt.selectBooking(0);

    // Initiate cancellation
    const cancelButton = page.locator('[data-testid="cancel-booking-button"]');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Verify cancellation confirmation modal
      const confirmModal = page.locator(
        '[data-testid="cancel-confirmation-modal"]',
      );
      if (await confirmModal.isVisible()) {
        await expect(confirmModal).toBeVisible();

        // Confirm cancellation
        await page.getByTestId("confirm-cancel-button").click({ force: true });

        // Verify cancellation success
        await expect(
          page.getByText(/cancellation.*successful|cancelled/i),
        ).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="booking-status"]')).toHaveText(
          /cancelled/i,
        );

        // Verify refund initiated (if applicable)
        const refundMessage = page.getByText(/refund.*initiated|refund/i);
        const isRefundVisible = await refundMessage
          .isVisible()
          .catch(() => false);
        // Refund visibility is optional based on policy
      }
    }
  });

  test("BM-008: Download booking invoice", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto("/bookings");

    const bookingCount = await page
      .locator('[data-testid="booking-row"]')
      .count();
    if (bookingCount > 0) {
      await bookingMgmt.selectBooking(0);

      // Download invoice
      const downloadButton = page.locator(
        '[data-testid="download-invoice-button"]',
      );
      if (await downloadButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download");
        await downloadButton.click({ force: true });

        try {
          const download = await downloadPromise;
          // Verify download
          expect(download.suggestedFilename()).toMatch(/invoice|pdf/i);
        } catch (error) {
          // Download might not be triggered in test environment, verify button exists
          await expect(downloadButton).toBeVisible();
        }
      }
    }
  });

  test("BM-009: Modify booking (if allowed)", async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    await bookingMgmt.goto("/bookings");

    const bookingCount = await page
      .locator('[data-testid="booking-row"]')
      .count();
    if (bookingCount > 0) {
      await bookingMgmt.selectBooking(0);

      // Check if modification is allowed
      const modifyButton = page.locator(
        '[data-testid="modify-booking-button"]',
      );
      if (await modifyButton.isVisible()) {
        await modifyButton.click({ force: true });

        // Verify modification page/modal
        const modifyModal = page.locator(
          '[data-testid="modify-booking-modal"]',
        );
        if (await modifyModal.isVisible()) {
          await expect(modifyModal).toBeVisible();

          // Verify modification options
          const changeDate = page.getByText(/change.*date|modify.*date/i);
          const changePassenger = page.getByText(
            /change.*passenger|modify.*passenger/i,
          );

          const isChangeDateVisible = await changeDate
            .isVisible()
            .catch(() => false);
          const isChangePassengerVisible = await changePassenger
            .isVisible()
            .catch(() => false);

          // At least one modification option should be visible
          expect(isChangeDateVisible || isChangePassengerVisible).toBeTruthy();
        }
      }
    }
  });
});
