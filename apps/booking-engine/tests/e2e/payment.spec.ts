import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import users from '../fixtures/users.json' assert { type: 'json' };
import hotels from '../fixtures/hotels.json' assert { type: 'json' };
import flights from '../fixtures/flights.json' assert { type: 'json' };
import payments from '../fixtures/payments.json' assert { type: 'json' };

test('Card payment flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const hotelHome = new HotelHomePage(page);
  const hotelList = new HotelListPage(page);
  const hotelDetail = new HotelDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingManagement = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await hotelHome.goto('/hotels');
  await hotelHome.searchHotel(hotels[0].city, hotels[0].adults, hotels[0].rooms, hotels[0].nights);
  await hotelList.selectHotel(0);
  await hotelDetail.selectRoom();
  await passengerDetails.fillPassengerDetails('John', 'Doe');
  await checkout.payWithCard(payments[0].cardNumber, payments[0].exp, payments[0].cvc);
  await expect(page.getByTestId('booking-ref')).toBeVisible();
  await expect(page.getByTestId('success-message')).toBeVisible();
  await bookingManagement.goto('/bookings');
  await bookingManagement.filterByService('hotel');
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
});

test('Wallet payment flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flightHome = new FlightHomePage(page);
  const flightList = new FlightListPage(page);
  const flightDetail = new FlightDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingManagement = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await flightHome.goto('/flights');
  await flightHome.searchFlight(flights[0].from, flights[0].to, flights[0].adults, flights[0].class);
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails('Jane', 'Smith');
  await checkout.payWithWallet();
  await expect(page.getByTestId('booking-ref')).toBeVisible();
  await expect(page.getByTestId('success-message')).toBeVisible();
  await bookingManagement.goto('/bookings');
  await bookingManagement.filterByService('flight');
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
});
