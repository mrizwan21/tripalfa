import { test, expect } from "@playwright/test";
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

// This test assumes test data and mock APIs are available as in other E2E tests

test.describe("Complete User Journey E2E", () => {
  test("Flight booking, payment, notifications, supplier webhook, reminders", async ({
    page,
  }) => {
    // Step 1: Login (if required)
    // const login = new LoginPage(page);
    // await login.login('testuser', 'password');

    // Step 2: Search and select flight
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const bookingMgmt = new BookingManagementPage(page);

    await flightHome.goto("/flights");
    await flightHome.searchFlight("JFK", "LHR", 1, "Economy", "2026-03-01");
    await expect(page.getByTestId("flight-results")).toBeVisible();
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.addBaggage();
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails("John", "Doe", {
      passportNumber: "AB1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
    });
    await passengerDetails.fillBillingAddress(
      "123 Main St",
      "New York",
      "10001",
      "US",
    );
    await passengerDetails.continue();
    await expect(page.getByTestId("checkout-page")).toBeVisible();
    await checkout.payWithWallet();
    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toBeTruthy();

    // Step 3: Notification - booking_created (in-app)
    await page.goto("/notifications");
    await expect(page.locator("text=Booking created")).toBeVisible();

    // Step 4: Payment notification (email, SMS, in-app)
    await expect(page.locator("text=Payment received")).toBeVisible();

    // Step 5: Booking confirmed notification (email, SMS, in-app)
    await expect(page.locator("text=Booking confirmed")).toBeVisible();

    // Step 6: Simulate supplier webhook (schedule change)
    // This would be a backend mock or API call in real E2E
    // For demo, assume notification appears
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockSupplierWebhook", {
          detail: { type: "itinerary_change" },
        }),
      );
    });
    await expect(page.locator("text=Itinerary change")).toBeVisible();

    // Step 7: Scheduled reminders (simulate time advance or check presence)
    await expect(page.locator("text=Booking reminder")).toBeVisible();
    await expect(page.locator("text=Urgent reminder")).toBeVisible();

    // Step 8: Notification center unread count
    const unreadBadge = page.locator(".rounded-full").first();
    await expect(unreadBadge).toBeVisible();

    // Step 9: Mark notifications as read
    const markAllRead = page.locator('button:has-text("Mark all as read")');
    if (await markAllRead.isVisible()) {
      await markAllRead.click();
      await expect(unreadBadge).not.toBeVisible();
    }
  });
});
