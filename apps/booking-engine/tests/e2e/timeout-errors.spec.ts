import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test('Search timeout', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);

  await flightHome.goto('/flights');

  // Mock slow API
  await page.route('**/api/search*', route => route.fulfill({ status: 200 }));

  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await expect(page.getByTestId('loading')).toBeVisible();
  await page.waitForTimeout(35000);
  await expect(page.getByTestId('timeout-error')).toBeVisible();
  await expect(page.getByTestId('retry-button')).toBeVisible();
});

test('Booking confirmation timeout', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);

  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('John', 'Doe');

  // Mock slow confirmation API
  await page.route('**/api/bookings/confirm*', route => route.fulfill({ status: 200 }));

  await checkout.payWithWallet();
  await expect(page.getByTestId('loading')).toBeVisible();
  await page.waitForTimeout(35000);
  await expect(page.getByTestId('timeout-error')).toBeVisible();
});
