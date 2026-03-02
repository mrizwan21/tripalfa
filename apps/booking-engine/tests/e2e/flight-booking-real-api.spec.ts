import { test, expect } from "../fixtures/unhideFixture";
import { createRequire } from "module";
import { LoginPage } from "../pages/LoginPage";
import { FlightHomePage } from "../pages/FlightHomePage";
import { FlightListPage } from "../pages/FlightListPage";
import { FlightDetailPage } from "../pages/FlightDetailPage";
import { FlightAddonsPage } from "../pages/FlightAddonsPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { WalletPage } from "../pages/WalletPage";

const require = createRequire(import.meta.url);
const users = require("../fixtures/users.json");
const flights = require("../fixtures/flights.json");

test.describe("Flight Booking Flow - Real API Data", () => {
  test.beforeEach(async ({ page }) => {
    // Fixture handles unhiding automatically via addInitScript
    // Just navigate to flights page
    await page.goto("/flights");
  });

  test("FB-002: Complete flight booking with real API data, ancillaries, and seat selection", async ({
    page,
  }) => {
    // Use real API data (no test mode flag)
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const bookingMgmt = new BookingManagementPage(page);

    // Step 1: Navigate to flight search
    await flightHome.goto("/flights");
    await expect(page.getByTestId("flight-search-form")).toBeVisible();

    // Step 2: Search for flights with real data
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate,
    );

    // Step 3: Verify search results from real API
    await expect(page.getByTestId("flight-results")).toBeVisible();
    await page.waitForTimeout(5000); // Wait for real API response
    const flightCards = await page.getByTestId(/^flight-result-card-/).all();
    console.log("Number of flight cards found:", flightCards.length);
    await expect(flightCards.length).toBeGreaterThan(0);

    // Step 4: Select first available flight
    await flightList.selectFlight(0);
    await expect(page.getByTestId("flight-detail-modal")).toBeVisible();
    await expect(page.getByTestId("flight-price")).toBeVisible();
    await flightDetail.selectFlight();

    // Step 5: Handle ancillary services popup
    await expect(page.getByTestId("ancillary-popup")).toBeVisible();
    await page.getByTestId("confirm-ancillaries").click();

    // Step 6: Add comprehensive add-ons including seat selection
    await expect(page.getByTestId("addons-page")).toBeVisible();

    // Add baggage
    await flightAddons.addBaggage();

    // Select seats using the seat selection component
    await flightAddons.selectSeat("12A");

    // Continue to passenger details
    await flightAddons.continue();

    // Step 7: Fill passenger details
    await expect(page.getByTestId("passenger-form")).toBeVisible();
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      passportNumber: "AB1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
    });

    // Fill billing address
    await passengerDetails.fillBillingAddress(
      "123 Main St",
      "New York",
      "10001",
      "US",
    );

    // Additional seat selection if available in passenger details
    await passengerDetails.selectAdditionalSeat();

    await passengerDetails.continue();

    // Step 8: Complete payment with wallet
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await checkout.payWithWallet();

    // Step 9: Verify booking confirmation
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyConfirmation();

    // Step 10: Verify booking appears in user dashboard
    await bookingMgmt.goto("/bookings");
    await expect(page.getByText(bookingReference)).toBeVisible();

    // Step 11: Verify booking details in dashboard
    await bookingMgmt.viewBookingDetails(bookingReference);
    await expect(page.getByTestId("booking-detail-page")).toBeVisible();

    // Verify ancillary services are shown
    await expect(page.getByText("Seat Selection")).toBeVisible();
    await expect(page.getByText("Baggage")).toBeVisible();

    // Verify seat selection details
    await expect(page.getByText("12A")).toBeVisible();
  });

  test("FB-003: Verify booking management dashboard functionality", async ({
    page,
  }) => {
    const bookingMgmt = new BookingManagementPage(page);

    // Navigate to booking management
    await bookingMgmt.goto("/bookings");
    await expect(page.getByTestId("booking-management-page")).toBeVisible();

    // Verify booking list loads
    await page.waitForTimeout(2000);
    const bookingCards = await page.getByTestId(/^booking-card-/).all();
    console.log("Number of booking cards found:", bookingCards.length);

    if (bookingCards.length > 0) {
      // Test booking detail view
      await bookingMgmt.viewBookingDetailsFromList(0);

      // Verify booking detail page
      await expect(page.getByTestId("booking-detail-page")).toBeVisible();

      // Test seat selection functionality
      await page.getByTestId("seat-selection-button").click();
      await expect(page.getByTestId("seat-selection-modal")).toBeVisible();

      // Test ancillary services modification
      await page.getByTestId("modify-ancillaries-button").click();
      await expect(
        page.getByTestId("ancillary-modification-modal"),
      ).toBeVisible();
    }
  });
});
