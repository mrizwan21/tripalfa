import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { HotelAddonsPage } from '../pages/HotelAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { WalletPage } from '../pages/WalletPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const hotels = require('../fixtures/hotels.json');
const payments = require('../fixtures/payments.json');

test.describe('Hotel Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Fixture handles unhiding automatically via addInitScript
    // Just add test mode flag and navigate to home
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_HOTELS = true;
    });
    
    await page.goto('/');
  });

  test('HB-001: Complete hotel booking with card payment (Happy Path)', async ({ page }) => {
    
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Navigate to hotel search
    await hotelHome.goto('/hotels');
    // Wait for the form to be attached to the DOM before asserting visibility
    await page.waitForSelector('[data-testid="hotel-search-form"]', { timeout: 20000 });
    await expect(page.getByTestId('hotel-search-form')).toBeVisible();

    // Step 2: Search for hotels
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      hotels[0].adults,
      hotels[0].rooms
    );

    // Step 3: Verify search results
    await expect(page.getByTestId('hotel-results')).toBeVisible();
    await expect((await page.getByTestId('hotel-card').all()).length).toBeGreaterThan(0);

    // Step 4: Select first available hotel
    await hotelList.selectHotel(0);

    // Step 5: Review hotel details
    await expect(page.getByTestId('hotel-detail-page')).toBeVisible();
    await expect(page.getByTestId('hotel-name')).toBeVisible();
    await expect(page.getByTestId('hotel-price')).toBeVisible();

    // Step 6: Select room type
    await hotelDetail.selectRoom(0);

    // Step 7: Add optional add-ons (breakfast, parking, etc.)
    await expect(page.getByTestId('hotel-addons-page')).toBeVisible();
    await hotelAddons.addBreakfast();
    await hotelAddons.addParking();
    await hotelAddons.continue();

    // Step 8: Fill guest details
    await expect(page.getByTestId('guest-form')).toBeVisible();
    await passengerDetails.fillPassengerDetails('Jane', 'Smith', {
      email: 'jane.smith@test.com',
      phone: '+1234567890',
    });
    await passengerDetails.addSpecialRequest('Late check-in requested');
    await passengerDetails.continue();

    // Step 9: Complete payment
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Jane Smith'
    );

    // Step 10: Verify booking confirmation
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^[A-Z0-9]{6}$/);
    await confirmation.verifyHotelDetails();
  });

  test('HB-002: Hotel booking with wallet payment', async ({ page }) => {
    
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const walletPage = new WalletPage(page);

    // Check wallet balance
    await walletPage.goto('/wallet');
    const initialBalance = await walletPage.getBalance();
    expect(initialBalance).toBeGreaterThan(0);

    // Search and select hotel
    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      2,
      1
    );
    await hotelList.selectHotel(0);
    await hotelDetail.selectRoom(0);
    await hotelAddons.continue();

    // Fill guest details
    await passengerDetails.fillPassengerDetails('John', 'Doe', {
      email: 'john.doe@test.com',
      phone: '+1234567890',
    });
    await passengerDetails.continue();

    // Pay with wallet
    const bookingAmount = await checkout.getTotalAmount();
    await checkout.selectPaymentMethod('wallet');
    await checkout.payWithWallet();

    // Verify confirmation
    await expect(page.getByTestId('confirmation-page')).toBeVisible();

    // Verify wallet deduction
    await walletPage.goto('/wallet');
    const finalBalance = await walletPage.getBalance();
    expect(finalBalance).toBe(initialBalance - bookingAmount);
  });

  test('HB-003: Hotel booking - Insufficient wallet balance', async ({ page }) => {
    
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const walletPage = new WalletPage(page);

    // Use user with low wallet balance - just navigate to wallet page
    // The test user from global setup should have low balance configured
    // No need to re-login - use storage state from playwright.config.ts

    // Check wallet balance
    await walletPage.goto('/wallet');
    const walletBalance = await walletPage.getBalance();

    // Search for expensive hotel
    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel(hotels[1].city, hotels[1].checkInDate, hotels[1].checkOutDate, 2, 1);
    await hotelList.selectHotel(0);
    await hotelDetail.selectRoom(0);
    await hotelAddons.continue();

    await passengerDetails.fillPassengerDetails('Test', 'User', {
      email: 'test@test.com',
      phone: '+1234567890',
    });
    await passengerDetails.continue();

    // Attempt wallet payment
    const bookingAmount = await checkout.getTotalAmount();

    if (bookingAmount > walletBalance) {
      await checkout.selectPaymentMethod('wallet');

      // Verify insufficient balance message
      await expect(page.getByText(/insufficient.*balance/i)).toBeVisible();
      await expect(page.getByTestId('pay-wallet-button')).toBeDisabled();

      // Switch to card payment
      await checkout.selectPaymentMethod('card');
      await checkout.payWithCard(
        payments[0].cardNumber,
        payments[0].exp,
        payments[0].cvc,
        'Test User'
      );

      // Verify successful booking
      await expect(page.getByTestId('confirmation-page')).toBeVisible();
    }
  });

  test('HB-004: Hotel booking - Multiple rooms', async ({ page }) => {
    
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Search for 2 rooms
    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      4, // 4 adults
      2  // 2 rooms
    );

    await hotelList.selectHotel(0);

    // Select room types for both rooms
    await hotelDetail.selectRoom(0); // Room 1
    await hotelDetail.selectRoom(1); // Room 2
    await hotelDetail.continue();

    await hotelAddons.continue();

    // Fill guest details
    await passengerDetails.fillPassengerDetails('John', 'Doe', {
      email: 'john.doe@test.com',
      phone: '+1234567890',
    });
    await passengerDetails.continue();

    // Complete payment
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'John Doe'
    );

    // Verify confirmation shows 2 rooms
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    await expect(page.getByText(/2.*room/i)).toBeVisible();
  });
});
