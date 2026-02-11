import { test, expect } from '@playwright/test';
import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';

test.describe('Complete Hotel Booking Journey E2E', () => {
  test('Hotel booking, payment, notifications, voucher, reminders', async ({ page }) => {
    // Step 1: Search and select hotel
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const bookingMgmt = new BookingManagementPage(page);

    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel('Dubai', '2026-03-01', '2026-03-05', 2, 1);
    await expect(page.getByTestId('hotel-results')).toBeVisible();
    await hotelList.selectHotel(0);
    await hotelDetail.selectRoom();
    await passengerDetails.fillPassengerDetails('John', 'Doe');
    await passengerDetails.fillBillingAddress('123 Main St', 'New York', '10001', 'US');
    await passengerDetails.continue();
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.payWithWallet();
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toBeTruthy();

    // Step 2: Notification - booking_created (in-app)
    await page.goto('/notifications');
    await expect(page.locator('text=Hotel booking created')).toBeVisible();

    // Step 3: Payment notification (email, SMS, in-app)
    await expect(page.locator('text=Payment received')).toBeVisible();

    // Step 4: Booking confirmed notification (email, SMS, in-app)
    await expect(page.locator('text=Hotel booking confirmed')).toBeVisible();

    // Step 5: Receive hotel voucher via email (simulated)
    await expect(page.locator('text=Voucher issued')).toBeVisible();

    // Step 6: Receive check-in reminder 1 day before (simulated)
    await expect(page.locator('text=Check-in reminder')).toBeVisible();

    // Step 7: Receive check-out reminder on check-out day (simulated)
    await expect(page.locator('text=Check-out reminder')).toBeVisible();

    // Step 8: Notification center unread count
    const unreadBadge = page.locator('.rounded-full').first();
    await expect(unreadBadge).toBeVisible();

    // Step 9: Mark notifications as read
    const markAllRead = page.locator('button:has-text("Mark all as read")');
    if (await markAllRead.isVisible()) {
      await markAllRead.click();
      await expect(unreadBadge).not.toBeVisible();
    }

    // Step 10: View booking in management
    await bookingMgmt.goto('/bookings');
    await bookingMgmt.filterByService('hotel');
    await expect(page.getByTestId('booking-row-0')).toBeVisible();
    await expect(page.locator(`text=${bookingReference}`)).toBeVisible();
  });

  test('Hotel booking with payment failure and retry', async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Setup for payment failure
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_PAYMENT_FAIL = true;
    });

    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel('Paris', '2026-04-01', '2026-04-03', 1, 1);
    await hotelList.selectHotel(0);
    await hotelDetail.selectRoom();
    await passengerDetails.fillPassengerDetails('Jane', 'Smith');
    await passengerDetails.continue();

    // Payment fails
    await checkout.payWithCard('4000000000000002', '12/26', '123', 'Jane Smith');
    await expect(page.locator('text=Payment failed')).toBeVisible();

    // Receive payment failed notification
    await page.goto('/notifications');
    await expect(page.locator('text=Payment failed')).toBeVisible();

    // Retry with valid card
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_PAYMENT_FAIL = false;
    });

    await checkout.payWithCard('4111111111111111', '12/26', '123', 'Jane Smith');
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
  });
});