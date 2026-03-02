import { test, expect } from "../fixtures/unhideFixture";
import { createRequire } from "module";
import { LoginPage } from "../pages/LoginPage";
import { HotelHomePage } from "../pages/HotelHomePage";
import { HotelListPage } from "../pages/HotelListPage";
import { HotelDetailPage } from "../pages/HotelDetailPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { FlightHomePage } from "../pages/FlightHomePage";
import { FlightListPage } from "../pages/FlightListPage";
import { FlightDetailPage } from "../pages/FlightDetailPage";

const require = createRequire(import.meta.url);
const users = require("../fixtures/users.json");
const hotels = require("../fixtures/hotels.json");
const flights = require("../fixtures/flights.json");
const payments = require("../fixtures/payments.json");

test("Card payment flow", async ({ page }) => {
  // Fixture handles unhiding automatically via addInitScript
  // Add test mode flag to enable mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_HOTELS = true;
  });

  const hotelHome = new HotelHomePage(page);
  const hotelList = new HotelListPage(page);
  const hotelDetail = new HotelDetailPage(page);
  const passengerDetails = new PassengerDetailsPage(page);
  const checkout = new BookingCheckoutPage(page);
  const bookingManagement = new BookingManagementPage(page);

  await hotelHome.goto("/hotels");
  await hotelHome.searchHotel(
    hotels[0].city,
    hotels[0].checkInDate,
    hotels[0].checkOutDate,
    hotels[0].adults,
    hotels[0].rooms,
  );
  await hotelList.selectHotel(0);
  await hotelDetail.selectRoom();
  await passengerDetails.fillPassengerDetails("John", "Doe");
  await checkout.payWithCard(
    payments[0].cardNumber,
    payments[0].exp,
    payments[0].cvc,
    payments[0].cardholderName,
  );
  await expect(page.getByTestId("booking-ref")).toBeVisible();
  await expect(page.getByTestId("success-message")).toBeVisible();
  await bookingManagement.goto("/bookings");
  await bookingManagement.filterByService("hotel");
  await expect(page.getByTestId("booking-row-0")).toBeVisible();
});

test("Wallet payment flow", async ({ page }) => {
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
  const bookingManagement = new BookingManagementPage(page);

  await flightHome.goto("/flights");
  await flightHome.searchFlight(
    flights[0].from,
    flights[0].to,
    flights[0].adults,
    flights[0].class,
  );
  await flightList.selectFlight(0);
  await flightDetail.selectFlight();
  await passengerDetails.fillPassengerDetails("Jane", "Smith");
  await checkout.payWithWallet();
  await expect(page.getByTestId("booking-ref")).toBeVisible();
  await expect(page.getByTestId("success-message")).toBeVisible();
  await bookingManagement.goto("/bookings");
  await bookingManagement.filterByService("flight");
  await expect(page.getByTestId("booking-row-0")).toBeVisible();
});
