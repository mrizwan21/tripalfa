import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import { BookingDetailPage } from '../pages/BookingDetailPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');

test('View and filter bookings', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_BOOKINGS = true;
  });

  const bookingMgmt = new BookingManagementPage(page);
  const bookingDetail = new BookingDetailPage(page);

  // Navigate directly without login - test mode provides mock bookings
  await bookingMgmt.goto('/bookings');
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
  await bookingMgmt.filterByService('flights');
  await bookingMgmt.searchByReference('BK-');
  await bookingMgmt.sortByDate();
  await bookingMgmt.selectBooking(0);
  await bookingDetail.verifyDetails();
});
