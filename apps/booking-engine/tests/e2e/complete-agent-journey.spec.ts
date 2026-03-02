import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { AdminNotificationsPage } from "../pages/AdminNotificationsPage";

test.describe("Complete Agent Manual Booking Journey E2E", () => {
  test("Agent creates manual flight booking with notifications", async ({
    page,
  }) => {
    // Step 1: Agent login (assuming agent role)
    const login = new LoginPage(page);
    await login.login("agent@test.com", "password");

    // Step 2: Navigate to booking management
    const bookingMgmt = new BookingManagementPage(page);
    await bookingMgmt.goto("/bookings");

    // Step 3: Create manual booking
    await bookingMgmt.createManualBooking();
    await bookingMgmt.fillManualFlightBooking({
      from: "JFK",
      to: "LHR",
      departureDate: "2026-03-15",
      returnDate: "2026-03-20",
      passengerName: "John Doe",
      passengerEmail: "john.doe@example.com",
      passengerPhone: "+1234567890",
      price: 1200,
      currency: "USD",
    });

    // Step 4: Send custom notification to customer
    await bookingMgmt.sendCustomNotification({
      type: "booking_request",
      title: "Flight Booking Request",
      message:
        "Your flight booking request has been submitted. We will confirm availability shortly.",
      channels: ["email", "sms"],
    });

    // Step 5: Customer receives notification (simulate customer view)
    // In real E2E, this would be a separate browser context or API check
    await page.goto("/notifications");
    await expect(page.locator("text=Flight Booking Request")).toBeVisible();

    // Step 6: Agent submits booking to supplier
    await bookingMgmt.submitToSupplier();
    await expect(
      page.locator("text=Booking submitted to supplier"),
    ).toBeVisible();

    // Step 7: Supplier receives notification (admin view)
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto("/admin/notifications");
    await expect(page.locator("text=New booking request")).toBeVisible();

    // Step 8: Agent adds ancillary service (SSR)
    await bookingMgmt.addAncillaryService({
      type: "extra_baggage",
      description: "Additional 20kg baggage",
      price: 100,
    });

    // Step 9: Customer receives SSR confirmation
    await page.goto("/notifications");
    await expect(page.locator("text=Extra baggage added")).toBeVisible();

    // Step 10: Agent creates amendment
    await bookingMgmt.createAmendment({
      type: "schedule_change",
      reason: "Customer requested earlier flight",
      newDeparture: "2026-03-16",
    });

    // Step 11: Customer receives amendment notification
    await expect(
      page.locator("text=Booking amendment requested"),
    ).toBeVisible();

    // Step 12: Supplier approves amendment (simulate)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockAmendmentApproval", {
          detail: { bookingId: "BK123456", amendmentId: "AMD001" },
        }),
      );
    });

    // Step 13: Customer receives approval notification
    await expect(page.locator("text=Amendment approved")).toBeVisible();

    // Step 14: Agent finalizes booking
    await bookingMgmt.finalizeBooking();
    await expect(page.locator("text=Booking finalized")).toBeVisible();

    // Step 15: Customer receives final confirmation
    await expect(page.locator("text=Booking confirmed")).toBeVisible();
  });

  test("Agent handles booking cancellation and refund", async ({ page }) => {
    const login = new LoginPage(page);
    const bookingMgmt = new BookingManagementPage(page);

    await login.login("agent@test.com", "password");
    await bookingMgmt.goto("/bookings");

    // Step 1: Customer requests cancellation
    await bookingMgmt.processCancellation("BK123456", "Customer request");

    // Step 2: Agent approves cancellation
    await bookingMgmt.approveCancellation();

    // Step 3: Refund processed
    await expect(page.locator("text=Refund initiated")).toBeVisible();

    // Step 4: Customer receives cancellation notification
    await page.goto("/notifications");
    await expect(page.locator("text=Booking cancelled")).toBeVisible();

    // Step 5: Customer receives refund notification
    await expect(page.locator("text=Refund processed")).toBeVisible();

    // Step 6: Wallet credited (if applicable)
    await expect(page.locator("text=Wallet credited")).toBeVisible();
  });

  test("Agent sends bulk notifications", async ({ page }) => {
    const login = new LoginPage(page);
    const adminNotifications = new AdminNotificationsPage(page);

    await login.login("agent@test.com", "password");
    await adminNotifications.goto("/admin/notifications");

    // Step 1: Select multiple customers
    await adminNotifications.selectCustomers([
      "customer1@test.com",
      "customer2@test.com",
    ]);

    // Step 2: Compose bulk notification
    await adminNotifications.composeBulkNotification({
      title: "Service Update",
      message:
        "We have updated our booking system. Please check your bookings.",
      type: "service_update",
      channels: ["email", "in_app"],
    });

    // Step 3: Send notification
    await adminNotifications.sendBulkNotification();

    // Step 4: Verify delivery status
    await expect(
      page.locator("text=Notifications sent successfully"),
    ).toBeVisible();

    // Step 5: Check delivery metrics
    const sentCount = await page.locator("text=2 notifications sent").count();
    expect(sentCount).toBeGreaterThan(0);
  });
});
