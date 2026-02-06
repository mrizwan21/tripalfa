import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';

import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test('Network disconnection during booking', async ({ page, context }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Enable test mode for mock flight data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  // Use storage state for authentication - don't re-login
  await page.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('Net', 'Down');
  await context.setOffline(true);
  await checkout.payWithWallet();
  await expect(page.getByTestId('error-message')).toBeVisible();
  await context.setOffline(false);
  // Optionally retry booking and verify success
  await bookingMgmt.goto('/bookings');
});
