import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { AdminNotificationsPage } from "../pages/AdminNotificationsPage";

test.describe("Payment & Refund Journey E2E", () => {
  test("Complete payment failure and retry flow", async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Start booking process
    await page.goto("/flights");
    await page.click("text=Book Flight");

    // Step 2: Proceed to checkout
    await checkout.proceedToCheckout();

    // Step 3: Simulate payment failure
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockPaymentFailure", {
          detail: { reason: "insufficient_funds" },
        }),
      );
    });

    // Step 4: Receive payment failed notification
    await expect(page.locator("text=Payment failed")).toBeVisible();
    await expect(page.locator("text=insufficient_funds")).toBeVisible();

    // Step 5: Retry payment with different method
    await checkout.selectPaymentMethod("credit_card");
    await checkout.completeBooking();

    // Step 6: Payment succeeds
    await expect(page.locator("text=Payment successful")).toBeVisible();

    // Step 7: Receive payment confirmation
    await expect(page.locator("text=Payment received")).toBeVisible();
  });

  test("Booking cancellation and refund processing", async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Create booking
    await page.goto("/flights");
    await page.click("text=Book Flight");
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Request cancellation
    await page.click("text=Cancel Booking");
    await page.fill('textarea[name="reason"]', "Customer request");
    await page.click("text=Submit Cancellation");

    // Step 3: Admin approves cancellation
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto("/admin/notifications");
    await adminNotifications.approveCancellation();

    // Step 4: Refund processed
    await expect(page.locator("text=Refund initiated")).toBeVisible();

    // Step 5: Customer receives refund notification
    await page.goto("/notifications");
    await expect(page.locator("text=Refund processed")).toBeVisible();

    // Step 6: Wallet credited
    await expect(page.locator("text=Wallet credited")).toBeVisible();

    // Step 7: Receive refund confirmation email
    await expect(page.locator("text=Refund confirmation sent")).toBeVisible();
  });

  test("Partial refund for amended booking", async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login("customer@test.com", "password");

    // Step 1: Create booking
    await page.goto("/flights");
    await page.click("text=Book Flight");
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Request amendment (reduce price)
    await page.click("text=Amend Booking");
    await page.selectOption('select[name="amendment_type"]', "price_reduction");
    await page.fill('input[name="new_price"]', "800");
    await page.click("text=Submit Amendment");

    // Step 3: Amendment approved
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("mockAmendmentApproval", {
          detail: { bookingId: "BK123456", refundAmount: 200 },
        }),
      );
    });

    // Step 4: Partial refund processed
    await expect(page.locator("text=Partial refund processed")).toBeVisible();

    // Step 5: Customer receives refund notification
    await page.goto("/notifications");
    await expect(page.locator("text=Refund of $200 processed")).toBeVisible();
  });
});
