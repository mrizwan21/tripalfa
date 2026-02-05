import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import { BookingDetailPage } from '../pages/BookingDetailPage';
import users from '../fixtures/users.json';

test('View and filter bookings', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const bookingMgmt = new BookingManagementPage(page);
  const bookingDetail = new BookingDetailPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await bookingMgmt.goto('/bookings');
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
  await bookingMgmt.filterByService('flights');
  await bookingMgmt.searchByReference('BK-');
  await bookingMgmt.sortByDate();
  await bookingMgmt.selectBooking(0);
  await bookingDetail.verifyDetails();
});
