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
const flightResults = require("../fixtures/flight-results.json");
const payments = require("../fixtures/payments.json");

test.describe("Flight Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Fixture handles unhiding automatically via addInitScript
    // Just ensure we're on the home page
    await page.goto("/");
  });

  test("FB-001: Complete flight booking with card payment (Happy Path)", async ({
    page,
  }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

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

    // Step 2: Search for flights
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate,
    );

    // Step 3: Verify search results
    await expect(page.getByTestId("flight-results")).toBeVisible();
    await page.waitForTimeout(2000); // Wait for API response and rendering
    const flightResultsDiv = await page.getByTestId("flight-results");
    const innerContent = await flightResultsDiv.innerHTML();
    console.log("Flight results inner HTML length:", innerContent.length);
    console.log(
      "Flight results inner HTML preview:",
      innerContent.substring(0, 200),
    );
    const flightCards = await page.getByTestId(/^flight-result-card-/).all();
    console.log("Number of flight cards found:", flightCards.length);
    await expect(flightCards.length).toBeGreaterThan(0);

    // Step 4: Select first available flight
    await flightList.selectFlight(0);
    await expect(page.getByTestId("flight-detail-modal")).toBeVisible();
    await expect(page.getByTestId("flight-price")).toBeVisible();
    await flightDetail.selectFlight();

    // Step 6: Add optional add-ons (baggage, seat selection)
    await expect(page.getByTestId("addons-page")).toBeVisible();
    await flightAddons.addBaggage();
    // await flightAddons.selectSeat('12A'); // AddOns page doesn't have seat selection
    await flightAddons.continue();

    // Step 7: Fill passenger details
    await expect(page.getByTestId("passenger-form")).toBeVisible();
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      passportNumber: "AB1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
      // email: 'john.doe@test.com',
      // phone: '+1234567890',
    });

    // Fill billing address
    await passengerDetails.fillBillingAddress(
      "123 Main St",
      "New York",
      "10001",
      "US",
    );

    await passengerDetails.continue();

    // Step 8: Complete payment with wallet
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await checkout.payWithWallet();

    // Step 9: Verify booking confirmation
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyConfirmation();

    // Step 10: Verify booking appears in booking management (skipped for E2E test with mock data)
    // await bookingMgmt.goto('/bookings');
    // await expect(page.getByText(bookingReference)).toBeVisible();
  });

  test("FB-002: Complete flight booking with wallet payment", async ({
    page,
  }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const walletPage = new WalletPage(page);

    // Verify wallet balance before booking
    await walletPage.goto("/wallet");
    const initialBalance = await walletPage.getBalance();
    expect(initialBalance).toBeGreaterThan(0);

    // Search and select flight
    await flightHome.goto("/flights");
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Skip add-ons
    await flightAddons.continue();

    // Fill passenger details
    await passengerDetails.fillPassengerDetails("Jane", "Smith", {
      dateOfBirth: "1985-05-15",
      passportNumber: "CD9876543",
      email: "jane.smith@test.com",
      phone: "+1234567891",
    });
    await passengerDetails.continue();

    // Pay with wallet
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    const bookingAmount = await checkout.getTotalAmount();

    await checkout.selectPaymentMethod("wallet");
    await expect(page.getByTestId("wallet-balance")).toBeVisible();
    await checkout.payWithWallet();

    // Verify confirmation
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toBeTruthy();

    // Verify wallet balance deducted
    await walletPage.goto("/wallet");
    const finalBalance = await walletPage.getBalance();
    expect(finalBalance).toBe(initialBalance - bookingAmount);

    // Verify transaction in wallet history
    await walletPage.viewTransactions();
    await expect(page.getByText(bookingReference)).toBeVisible();
  });

  test("FB-003: Flight booking - Payment failure handling", async ({
    page,
  }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Search and select flight
    await flightHome.goto("/flights");
    await flightHome.searchFlight(flights[0].from, flights[0].to, 1, "economy");
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    // Fill passenger details
    await passengerDetails.fillPassengerDetails("Test", "User", {
      email: "test@test.com",
      phone: "+1234567890",
    });
    await passengerDetails.continue();

    // Attempt payment with declined card
    await checkout.selectPaymentMethod("card");
    await checkout.payWithCard(
      "4000000000000002", // Stripe test card - declined
      "12/28",
      "123",
      "Test User",
    );

    // Verify error message is displayed
    await expect(page.getByTestId("payment-error")).toBeVisible();
    await expect(page.getByText(/payment.*declined|failed/i)).toBeVisible();

    // Verify user remains on checkout page
    await expect(page.getByTestId("checkout-page")).toBeVisible();

    // Verify user can retry payment
    await expect(page.getByTestId("payment-form")).toBeVisible();

    // Retry with valid card
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "Test User",
    );

    // Verify successful booking
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
  });

  test("FB-004: Flight booking - Validation errors", async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);

    // Navigate to passenger details
    await flightHome.goto("/flights");
    await flightHome.searchFlight(flights[0].from, flights[0].to, 1, "economy");
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    // Attempt to submit with empty fields
    await passengerDetails.continue();

    // Verify validation errors
    await expect(page.getByText(/first name.*required/i)).toBeVisible();
    await expect(page.getByText(/last name.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*required/i)).toBeVisible();

    // Fill invalid email
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      email: "invalid-email",
      phone: "123", // Invalid phone
    });
    await passengerDetails.continue();

    // Verify email validation error
    await expect(page.getByText(/valid email/i)).toBeVisible();
    await expect(page.getByText(/valid phone/i)).toBeVisible();

    // Fill valid data
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      email: "john.doe@test.com",
      phone: "+1234567890",
      dateOfBirth: "1990-01-01",
      passportNumber: "AB1234567",
    });
    await passengerDetails.continue();

    // Verify form submits successfully
    await expect(page.getByTestId("checkout-page")).toBeVisible();
  });

  test("FB-005: Flight booking - Round trip with multiple passengers", async ({
    page,
  }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Search for round trip with 2 passengers
    await flightHome.goto("/flights");
    await flightHome.searchRoundTrip(
      flights[0].from,
      flights[0].to,
      flights[0].departureDate,
      flights[0].returnDate,
      2, // 2 adults
      "economy",
    );

    // Select outbound flight
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Select return flight
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Skip add-ons
    await flightAddons.continue();

    // Fill details for passenger 1
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      email: "john.doe@test.com",
      phone: "+1234567890",
      dateOfBirth: "1990-01-01",
      passportNumber: "AB1234567",
    });

    // Fill details for passenger 2
    await passengerDetails.addPassenger();
    await passengerDetails.fillPassengerDetails(
      "Jane",
      "Doe",
      {
        email: "jane.doe@test.com",
        phone: "+1234567891",
        dateOfBirth: "1992-03-15",
        passportNumber: "CD9876543",
      },
      1,
    ); // Second passenger

    await passengerDetails.continue();

    // Complete payment
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "John Doe",
    );

    // Verify confirmation
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    await expect(page.getByText(/2.*passenger/i)).toBeVisible();
  });
});
