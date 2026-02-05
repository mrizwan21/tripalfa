import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import users from '../fixtures/users.json';

import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import flights from '../fixtures/flights.json';

test('Network disconnection during booking', async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
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
