import { test, expect } from "../fixtures/unhideFixture";
import { LoginPage } from "../pages/LoginPage";
import { HotelHomePage } from "../pages/HotelHomePage";
import { HotelListPage } from "../pages/HotelListPage";
import { HotelDetailPage } from "../pages/HotelDetailPage";
import { HotelAddonsPage } from "../pages/HotelAddonsPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";

test.describe("Hotel Hold Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode for hotels
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_HOTELS = true;
    });

    await page.goto("/");
  });

  test("HH-001: Hold a refundable hotel booking", async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Navigate to hotel search
    await hotelHome.goto("/hotels");

    // Step 2: Search for hotels in London for June 2026
    await hotelHome.searchHotel("London", "2026-06-15", "2026-06-20", 2, 1);

    // Step 3: Select first available hotel
    await hotelList.selectHotel(0);

    // Step 4: Select room type (ensuring it's refundable in test mode)
    await hotelDetail.selectRoom(0);

    // Step 5: Continue through addons
    await hotelAddons.continue();

    // Step 6: Fill guest details and verify Hold button
    await passengerDetails.fillPassengerDetails("Mark", "Holdman", {
      email: "mark.holdman@test.com",
      phone: "+1234567890",
    });

    // Verify "Hold Booking" button is visible (since room is refundable)
    const holdButton = page.getByRole("button", { name: /Hold Booking/i });
    await expect(holdButton).toBeVisible();

    // Step 7: Click Hold Booking
    await holdButton.click();

    // Step 8: Verify booking confirmation for Hold
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    await expect(page.getByText(/Hold Successful/i)).toBeVisible();

    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toBeDefined();

    // Verify voucher notice (should NOT be issued)
    await expect(
      page.getByText(/Voucher will be issued after payment/i),
    ).toBeVisible();
  });

  test("HH-002: Hold option not available for non-refundable hotel", async ({
    page,
  }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);

    // Step 1: Navigate to hotel search and search
    await hotelHome.goto("/hotels");

    // Set a flag or use a specific hotel that returns non-refundable in test mode if available
    // For this test, we might need to mock the search response or select a specific known non-refundable room
    // Assuming we can trigger this state via test scripts or query params
    await hotelHome.searchHotel("Paris", "2026-06-15", "2026-06-20", 2, 1);

    await hotelList.selectHotel(1); // Select a different hotel

    // Select a room known to be non-refundable
    await hotelDetail.selectRoom(1);
    await hotelAddons.continue();

    // Fill guest details
    await passengerDetails.fillPassengerDetails("No", "Hold", {
      email: "nohold@test.com",
      phone: "+1234567890",
    });

    // Verify "Hold Booking" button is NOT visible or replace with message
    const holdButton = page.getByRole("button", { name: /Hold Booking/i });
    await expect(holdButton).not.toBeVisible();
    await expect(
      page.getByText(/Hold option unavailable for non-refundable/i),
    ).toBeVisible();
  });
});
