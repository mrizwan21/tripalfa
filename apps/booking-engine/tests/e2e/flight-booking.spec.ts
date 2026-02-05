import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { FlightAddonsPage } from '../pages/FlightAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import users from '../fixtures/users.json';
import flights from '../fixtures/flights.json';

test('Complete flight booking as registered user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const flightAddons = new FlightAddonsPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const confirmation = new BookingConfirmationPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await flightAddons.addBaggage();
  await flightAddons.continue();
  await passengerDetails.fillPassengerDetails('John', 'Doe');
  await checkout.payWithWallet();
  await confirmation.verifyConfirmation();
  await bookingMgmt.goto('/bookings');
  // Verify booking appears in management
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
});
