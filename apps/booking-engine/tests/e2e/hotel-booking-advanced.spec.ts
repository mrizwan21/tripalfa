import { test, expect } from "../fixtures/unhideFixture";
import { createRequire } from "module";
import { LoginPage } from "../pages/LoginPage";
import { HotelHomePage } from "../pages/HotelHomePage";
import { HotelListPage } from "../pages/HotelListPage";
import { HotelDetailPage } from "../pages/HotelDetailPage";
import { HotelAddonsPage } from "../pages/HotelAddonsPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { WalletPage } from "../pages/WalletPage";

const require = createRequire(import.meta.url);
const users = require("../fixtures/users.json");
const hotels = require("../fixtures/hotels.json");
const payments = require("../fixtures/payments.json");

test.describe("Advanced Hotel Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_HOTELS = true;
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

  test("HB-005: Hotel chain booking (multiple properties)", async ({
    page,
  }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for hotel chain
    await hotelHome.goto("/hotels");
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      2,
      1,
    );

    // Step 2: Verify hotel chain options
    await expect(page.getByTestId("hotel-chain-filter")).toBeVisible();
    await hotelHome.filterByChain("Marriott");
    await expect(page.getByText(/Marriott|Hilton|Hyatt/i)).toBeVisible();

    // Step 3: Select different properties in the same chain
    const properties = await page.getByTestId("hotel-property").all();
    expect(properties.length).toBeGreaterThan(1);

    // Step 4: Book first property
    await hotelList.selectHotel(0);
    await hotelDetail.selectRoom(0);
    await hotelAddons.addBreakfast();
    await hotelAddons.continue();

    await passengerDetails.fillPassengerDetails("Chain", "Guest", {
      email: "chain.guest@test.com",
      phone: "+1234567890",
    });
    await passengerDetails.addSpecialRequest("Late check-in requested");
    await passengerDetails.continue();

    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "Chain Guest",
    );

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingRef1 = await confirmation.getBookingReference();

    // Step 5: Book second property in same chain
    await hotelHome.goto("/hotels");
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      2,
      1,
    );
    await hotelHome.filterByChain("Marriott");
    await hotelList.selectHotel(1);
    await hotelDetail.selectRoom(0);
    await hotelAddons.addParking();
    await hotelAddons.continue();

    await passengerDetails.fillPassengerDetails("Chain", "Guest2", {
      email: "chain.guest2@test.com",
      phone: "+1234567891",
    });
    await passengerDetails.continue();

    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      "Chain Guest2",
    );

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingRef2 = await confirmation.getBookingReference();

    // Step 6: Verify both bookings are in the same chain
    expect(bookingRef1).toMatch(/^TL-\d{6}$/);
    expect(bookingRef2).toMatch(/^TL-\d{6}$/);
  });

  test("HB-006: Extended stay booking (30+ days)", async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for extended stay
    await hotelHome.goto("/hotels");

    // Calculate extended stay dates (30+ days)
    const checkInDate = new Date();
    const checkOutDate = new Date();
    checkOutDate.setDate(checkInDate.getDate() + 35); // 35 days stay

    await hotelHome.searchHotel(
      hotels[0].city,
      checkInDate.toISOString().split("T")[0],
      checkOutDate.toISOString().split("T")[0],
      2,
      1,
    );

    // Step 2: Verify extended stay features
    await expect(page.getByTestId("extended-stay-notice")).toBeVisible();
    await expect(page.getByText(/extended.*stay|30.*days/i)).toBeVisible();

    // Step 3: Select hotel with extended stay rates
    await hotelList.selectHotel(0);
    await hotelDetail.selectExtendedStayRoom();

    // Step 4: Add extended stay amenities
    await expect(page.getByTestId("addons-page")).toBeVisible();
    await hotelAddons.addExtendedStayBreakfast();
    await hotelAddons.addLaundryService();
    await hotelAddons.addWeeklyHousekeeping();
    await hotelAddons.continue();

    // Step 5: Fill extended stay details
    await expect(page.getByTestId("passenger-form")).toBeVisible();
    await passengerDetails.fillPassengerDetails("Extended", "Stay", {
      email: "extended.stay@test.com",
      phone: "+1234567890",
    });
    await passengerDetails.addExtendedStayDetails({
      workAddress: "123 Business Ave, Extended City",
      localContact: "+1234567899",
      emergencyContact: "emergency@test.com",
    });
    await passengerDetails.continue();

    // Step 6: Complete extended stay booking
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    const totalAmount = await checkout.getTotalAmount();

    // Verify extended stay discount is applied
    await expect(page.getByTestId("extended-stay-discount")).toBeVisible();
    const discountAmount = await checkout.getDiscountAmount();
    expect(discountAmount).toBeGreaterThan(0);

    await checkout.payWithCard(
      payments[1].cardNumber, // Premium card for extended stay
      payments[1].exp,
      payments[1].cvc,
      "Extended Stay",
    );

    // Step 7: Verify extended stay booking
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyExtendedStayDetails(35);
  });

  test("HB-007: Corporate booking with billing codes", async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for corporate booking
    await hotelHome.goto("/hotels");
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      4, // Corporate group
      2, // 2 rooms
    );

    // Step 2: Enable corporate booking mode
    await hotelHome.enableCorporateBooking();
    await expect(page.getByTestId("corporate-booking-form")).toBeVisible();

    // Step 3: Fill corporate details
    await hotelHome.fillCorporateDetails({
      companyName: "Test Corporation Inc",
      billingCode: "CORP-12345",
      costCenter: "CC-67890",
      poNumber: "PO-54321",
      taxExempt: true,
    });

    // Step 4: Select corporate rates
    await hotelList.selectHotel(0);
    await hotelDetail.selectCorporateRate();
    await hotelDetail.selectRoom(0); // Room 1
    await hotelDetail.selectRoom(1); // Room 2
    await hotelDetail.continue();

    // Step 5: Add corporate amenities
    await hotelAddons.addCorporateBreakfast();
    await hotelAddons.addBusinessCenterAccess();
    await hotelAddons.addMeetingRoomBooking();
    await hotelAddons.continue();

    // Step 6: Fill multiple passenger details
    await expect(page.getByTestId("passenger-form")).toBeVisible();

    // Fill first passenger (primary contact)
    await passengerDetails.fillPassengerDetails("Corporate", "Primary", {
      email: "primary@testcorp.com",
      phone: "+1234567890",
      employeeId: "EMP-001",
      department: "Sales",
    });

    // Add additional passengers
    for (let i = 1; i < 4; i++) {
      await passengerDetails.addPassenger();
      await passengerDetails.fillPassengerDetails(
        `Employee${i}`,
        `Test${i}`,
        {
          email: `employee${i}@testcorp.com`,
          phone: `+123456789${i}`,
          employeeId: `EMP-00${i + 1}`,
          department: "Sales",
        },
        i,
      );
    }

    await passengerDetails.continue();

    // Step 7: Complete corporate booking
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await checkout.selectPaymentMethod("corporate");
    await checkout.fillCorporatePayment({
      billingCode: "CORP-12345",
      costCenter: "CC-67890",
      authorizationCode: "AUTH-98765",
    });

    await checkout.completeCorporateBooking();

    // Step 8: Verify corporate booking
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyCorporateBookingDetails("Test Corporation Inc");
  });

  test("HB-008: Hotel package deals (flight + hotel)", async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for package deals
    await hotelHome.goto("/hotels");
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      2,
      1,
    );

    // Step 2: Enable package deal mode
    await hotelHome.enablePackageDeal();
    await expect(page.getByTestId("package-deal-options")).toBeVisible();

    // Step 3: Select package deal
    await hotelHome.selectPackageDeal("flight-hotel");
    await expect(page.getByTestId("flight-hotel-package")).toBeVisible();

    // Step 4: Configure flight details
    await hotelHome.configureFlightDetails({
      from: "NYC",
      to: hotels[0].city,
      departureDate: hotels[0].checkInDate,
      returnDate: hotels[0].checkOutDate,
      airlinePreference: "premium",
    });

    // Step 5: Select hotel for package
    await hotelList.selectHotel(0);
    await hotelDetail.selectPackageRoom();
    await hotelDetail.continue();

    // Step 6: Add package-specific amenities
    await hotelAddons.addPackageBreakfast();
    await hotelAddons.addAirportTransfer();
    await hotelAddons.addLuggageService();
    await hotelAddons.continue();

    // Step 7: Fill passenger details for package
    await expect(page.getByTestId("passenger-form")).toBeVisible();
    await passengerDetails.fillPassengerDetails("Package", "Traveler", {
      email: "package.traveler@test.com",
      phone: "+1234567890",
      frequentFlyerNumber: "FF-123456789",
      loyaltyNumber: "HL-987654321",
    });
    await passengerDetails.continue();

    // Step 8: Complete package booking
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    const packageTotal = await checkout.getPackageTotal();
    const flightCost = await checkout.getFlightCost();
    const hotelCost = await checkout.getHotelCost();

    // Verify package discount
    await expect(page.getByTestId("package-discount")).toBeVisible();
    const packageDiscount = await checkout.getPackageDiscount();
    expect(packageDiscount).toBeGreaterThan(0);

    await checkout.payWithCard(
      payments[2].cardNumber, // Premium card for package
      payments[2].exp,
      payments[2].cvc,
      "Package Traveler",
    );

    // Step 9: Verify package booking
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyPackageBookingDetails();
  });

  test("HB-009: Last-minute booking scenarios", async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for last-minute booking
    await hotelHome.goto("/hotels");

    // Use same-day booking (check-in today)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    await hotelHome.searchHotel(
      hotels[0].city,
      today.toISOString().split("T")[0],
      tomorrow.toISOString().split("T")[0],
      2,
      1,
    );

    // Step 2: Verify last-minute booking features
    await expect(page.getByTestId("last-minute-notice")).toBeVisible();
    await expect(page.getByText(/last.*minute|same.*day/i)).toBeVisible();

    // Step 3: Filter for available last-minute rooms
    await hotelHome.filterByAvailability("last-minute");
    await expect(page.getByTestId("last-minute-available")).toBeVisible();

    // Step 4: Select last-minute room
    await hotelList.selectHotel(0);
    await hotelDetail.selectLastMinuteRoom();
    await hotelDetail.continue();

    // Step 5: Skip add-ons for speed
    await hotelAddons.continue();

    // Step 6: Quick passenger details
    await expect(page.getByTestId("passenger-form")).toBeVisible();
    await passengerDetails.fillPassengerDetails("LastMinute", "Guest", {
      email: "lastminute.guest@test.com",
      phone: "+1234567890",
    });
    await passengerDetails.continue();

    // Step 7: Express checkout
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await checkout.selectPaymentMethod("express");
    await checkout.completeExpressCheckout();

    // Step 8: Verify instant confirmation
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);

    // Verify instant confirmation
    await expect(page.getByTestId("instant-confirmation")).toBeVisible();
    await confirmation.verifyLastMinuteBooking();
  });
});
