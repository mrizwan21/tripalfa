import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import users from '../fixtures/users.json';
import payments from '../fixtures/payments.json';

import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import hotels from '../fixtures/hotels.json';

test('Card payment declined', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const hotelHome = new HotelHomePage(page);
  const hotelList = new HotelListPage(page);
  const hotelDetail = new HotelDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await hotelHome.goto('/hotels');
  await hotelHome.searchHotel(hotels[0].city, hotels[0].adults, hotels[0].rooms, hotels[0].nights);
  await hotelList.selectHotel(0);
  await hotelDetail.selectRoom();
  await passengerDetails.fillPassengerDetails('Decline', 'Card');
  await checkout.payWithCard(payments[1].cardNumber, payments[1].exp, payments[1].cvc);
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('booking-ref')).not.toBeVisible();
  await bookingMgmt.goto('/bookings');
  // Optionally check that no new booking appears
});

import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import flights from '../fixtures/flights.json';

test('Insufficient wallet balance', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[1].email, users[1].password);
  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('Low', 'Balance');
  await checkout.payWithWallet();
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('booking-ref')).not.toBeVisible();
  await bookingMgmt.goto('/bookings');
  // Optionally check that no new booking appears
});
