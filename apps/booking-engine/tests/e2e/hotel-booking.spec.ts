import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import users from '../fixtures/users.json';
import hotels from '../fixtures/hotels.json';
import payments from '../fixtures/payments.json';

test('Complete hotel booking as registered user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const hotelHome = new HotelHomePage(page);
  const hotelList = new HotelListPage(page);
  const hotelDetail = new HotelDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const confirmation = new BookingConfirmationPage(page);
  const bookingMgmt = new BookingManagementPage(page);

  await loginPage.goto('/login');
  await loginPage.login(users[0].email, users[0].password);
  await hotelHome.goto('/hotels');
  await hotelHome.searchHotel(hotels[0].city, hotels[0].adults, hotels[0].rooms, hotels[0].nights);
  await hotelList.selectHotel(0);
  await hotelDetail.selectRoom();
  await passengerDetails.fillPassengerDetails('Jane', 'Smith');
  await checkout.payWithCard(payments[0].cardNumber, payments[0].exp, payments[0].cvc);
  await confirmation.verifyConfirmation();
  await bookingMgmt.goto('/bookings');
  await expect(page.getByTestId('booking-row-0')).toBeVisible();
});
