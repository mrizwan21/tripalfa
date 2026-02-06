import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test('Invalid passenger details', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);

  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('', ''); // Invalid
  await expect(page.getByTestId('validation-error')).toBeVisible();
  await expect(page.getByTestId('validation-error')).toContainText('First name is required');
});

test('Invalid search parameters', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);

  await flightHome.goto('/flights');
  await flightHome.searchFlight('XXX', 'YYY', 1, 'economy');
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('No flights found');
});

test('Past date search', async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
  });

  const flightHome = new FlightHomePage(page);

  await flightHome.goto('/flights');
  const pastDate = '2020-01-01'; // Past date
  await flightHome.searchFlight('JFK', 'LHR', 1, 'economy', pastDate);
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('Invalid date');
});
