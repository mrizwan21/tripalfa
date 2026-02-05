import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import users from '../fixtures/users.json' assert { type: 'json' };
import flights from '../fixtures/flights.json' assert { type: 'json' };

test('Invalid passenger details', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('', ''); // Invalid
  await expect(page.getByTestId('validation-error')).toBeVisible();
  await expect(page.getByTestId('validation-error')).toContainText('First name is required');
});

test('Invalid search parameters', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
  await flightHome.searchFlight('XXX', 'YYY', 1, 'economy');
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('No flights found');
});

test('Past date search', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
  const pastDate = '2020-01-01'; // Past date
  await flightHome.searchFlight('JFK', 'LHR', 1, 'economy', pastDate);
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('Invalid date');
});
