import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { FlightAddonsPage } from '../pages/FlightAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { BookingManagementPage } from '../pages/BookingManagementPage';
import { WalletPage } from '../pages/WalletPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');
const flightResults = require('../fixtures/flight-results.json');
const payments = require('../fixtures/payments.json');

test.describe('Advanced Flight Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
    });

    // Check if already logged in, if not, login
    const loginPage = new LoginPage(page);
    if (!await loginPage.isAlreadyLoggedIn()) {
      await loginPage.loginWithRetry(
        process.env.TEST_USER_EMAIL || 'testuser1@example.com',
        process.env.TEST_USER_PASSWORD || 'Test@123'
      );
    }
  });

  test('FB-006: Multi-city flight booking flow', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Navigate to multi-city search
    await flightHome.goto('/flights');
    await flightHome.selectTripType('multi-city');
    await expect(page.getByTestId('multi-city-form')).toBeVisible();

    // Step 2: Add first leg (NYC to LON)
    await flightHome.addMultiCityLeg(
      flights[0].from,
      flights[0].to,
      flights[0].departureDate,
      flights[0].adults,
      flights[0].class
    );

    // Step 3: Add second leg (LON to PAR)
    await flightHome.addMultiCityLeg(
      flights[0].to,
      'PAR',
      flights[0].returnDate,
      flights[0].adults,
      flights[0].class
    );

    // Step 4: Search for multi-city flights
    await flightHome.searchMultiCity();
    await expect(page.getByTestId('flight-results')).toBeVisible();
    await page.waitForTimeout(3000); // Wait for API response

    // Step 5: Select flights for each leg
    const flightCards = await page.getByTestId(/^flight-result-card-/).all();
    expect(flightCards.length).toBeGreaterThan(0);

    // Select first flight for leg 1
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Select first flight for leg 2
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Step 6: Add premium add-ons
    await expect(page.getByTestId('addons-page')).toBeVisible();
    await flightAddons.addPremiumBaggage(2);
    await flightAddons.selectPriorityBoarding();
    await flightAddons.selectTravelInsurance();
    await flightAddons.continue();

    // Step 7: Fill passenger details for multi-city
    await expect(page.getByTestId('passenger-form')).toBeVisible();
    await passengerDetails.fillPassengerDetails('John', 'MultiCity', {
      passportNumber: 'MC1234567',
      nationality: 'US',
      gender: 'Male',
      residencyCountry: 'US',
      dateOfBirth: '1985-06-15',
    });

    // Fill billing address
    await passengerDetails.fillBillingAddress('456 Multi St', 'New York', '10002', 'US');
    await passengerDetails.continue();

    // Step 8: Complete payment with premium card
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[1].cardNumber, // Premium card
      payments[1].exp,
      payments[1].cvc,
      'John MultiCity'
    );

    // Step 9: Verify multi-city booking confirmation
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyMultiCityDetails();
  });

  test('FB-007: Flight modification and cancellation', async ({ page }) => {
    const bookingMgmt = new BookingManagementPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Create a booking first
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightList.continue(); // Skip add-ons
    await flightList.fillPassengerDetails('Jane', 'Modify', {
      passportNumber: 'MD1234567',
      email: 'jane.modify@test.com',
    });
    await flightList.continue();
    await flightList.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Jane Modify'
    );
    const originalBookingRef = await confirmation.getBookingReference();

    // Step 2: Navigate to booking management
    await bookingMgmt.goto('/bookings');
    await expect(page.getByText(originalBookingRef)).toBeVisible();

    // Step 3: Modify flight date
    await bookingMgmt.modifyBooking(originalBookingRef);
    await expect(page.getByTestId('modification-page')).toBeVisible();

    // Change to new date
    const newDate = new Date(flights[0].departureDate);
    newDate.setDate(newDate.getDate() + 7);
    await bookingMgmt.changeFlightDate(newDate.toISOString().split('T')[0]);

    // Step 4: Handle modification fees
    await expect(page.getByTestId('modification-fees')).toBeVisible();
    const modificationFee = await bookingMgmt.getModificationFee();
    expect(modificationFee).toBeGreaterThan(0);

    // Step 5: Confirm modification
    await bookingMgmt.confirmModification();
    await expect(page.getByTestId('modification-confirmation')).toBeVisible();

    // Step 6: Test cancellation
    await bookingMgmt.goto('/bookings');
    await bookingMgmt.cancelBooking(originalBookingRef);
    await expect(page.getByTestId('cancellation-confirmation')).toBeVisible();

    // Verify cancellation policy
    const refundAmount = await bookingMgmt.getRefundAmount();
    expect(refundAmount).toBeGreaterThanOrEqual(0);
  });

  test('FB-008: Group booking (10+ passengers)', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for group booking
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      12, // Group of 12
      'economy',
      flights[0].departureDate
    );

    // Step 2: Verify group booking features
    await expect(page.getByTestId('group-booking-notice')).toBeVisible();
    await expect(page.getByText(/group.*booking/i)).toBeVisible();

    // Step 3: Select flight
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Step 4: Skip add-ons for group booking
    await flightAddons.continue();

    // Step 5: Fill details for all passengers
    await expect(page.getByTestId('passenger-form')).toBeVisible();

    // Fill first passenger
    await passengerDetails.fillPassengerDetails('Group', 'Leader', {
      passportNumber: 'GL1234567',
      email: 'group.leader@test.com',
      phone: '+1234567890',
    });

    // Add remaining passengers
    for (let i = 1; i < 12; i++) {
      await passengerDetails.addPassenger();
      await passengerDetails.fillPassengerDetails(`Passenger${i}`, `Group${i}`, {
        passportNumber: `PG${i}1234567`,
        email: `passenger${i}@test.com`,
        phone: `+123456789${i}`,
      }, i);
    }

    await passengerDetails.continue();

    // Step 6: Complete group booking payment
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[2].cardNumber, // Corporate card
      payments[2].exp,
      payments[2].cvc,
      'Group Leader'
    );

    // Step 7: Verify group booking confirmation
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyGroupBookingDetails(12);
  });

  test('FB-009: Business class premium features', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // Step 1: Search for business class
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      1,
      'business', // Business class
      flights[0].departureDate
    );

    // Step 2: Verify business class features
    await expect(page.getByTestId('business-class-notice')).toBeVisible();
    await expect(page.getByText(/business.*class/i)).toBeVisible();

    // Step 3: Select premium business flight
    await flightList.selectFlight(0);
    await flightDetail.selectBusinessClass();

    // Step 4: Add premium business add-ons
    await expect(page.getByTestId('addons-page')).toBeVisible();
    await flightAddons.addPremiumBaggage(3);
    await flightAddons.selectPriorityBoarding();
    await flightAddons.selectLoungeAccess();
    await flightAddons.selectTravelInsurance();
    await flightAddons.selectPremiumMeals();
    await flightAddons.continue();

    // Step 5: Fill premium passenger details
    await expect(page.getByTestId('passenger-form')).toBeVisible();
    await passengerDetails.fillPassengerDetails('Premium', 'Business', {
      passportNumber: 'PB1234567',
      nationality: 'US',
      gender: 'Female',
      residencyCountry: 'US',
      dateOfBirth: '1980-03-20',
      email: 'premium.business@test.com',
      phone: '+1234567890',
    });

    // Fill premium billing address
    await passengerDetails.fillBillingAddress('789 Premium Ave', 'New York', '10003', 'US');
    await passengerDetails.continue();

    // Step 6: Complete premium payment
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.selectPaymentMethod('card');
    await checkout.payWithCard(
      payments[3].cardNumber, // Premium card
      payments[3].exp,
      payments[3].cvc,
      'Premium Business'
    );

    // Step 7: Verify premium booking
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyPremiumFeatures();
  });

  test('FB-010: Loyalty program integration', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const walletPage = new WalletPage(page);

    // Step 1: Check loyalty status
    await walletPage.goto('/wallet');
    const loyaltyPoints = await walletPage.getLoyaltyPoints();
    expect(loyaltyPoints).toBeGreaterThan(0);

    // Step 2: Search for flight
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      1,
      'economy',
      flights[0].departureDate
    );

    // Step 3: Select flight
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();

    // Step 4: Add loyalty-based add-ons
    await expect(page.getByTestId('addons-page')).toBeVisible();
    await flightAddons.selectLoyaltyUpgrade();
    await flightAddons.addLoyaltyBaggage();
    await flightAddons.continue();

    // Step 5: Fill passenger details with loyalty info
    await expect(page.getByTestId('passenger-form')).toBeVisible();
    await passengerDetails.fillPassengerDetails('Loyalty', 'Member', {
      passportNumber: 'LM1234567',
      email: 'loyalty.member@test.com',
      phone: '+1234567890',
      loyaltyNumber: 'LM123456789',
    });
    await passengerDetails.continue();

    // Step 6: Use loyalty points for payment
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await checkout.selectPaymentMethod('loyalty');
    await checkout.useLoyaltyPoints(loyaltyPoints);

    // Step 7: Verify loyalty booking
    await expect(page.getByTestId('confirmation-page')).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    await confirmation.verifyLoyaltyBooking();

    // Step 8: Verify loyalty points updated
    await walletPage.goto('/wallet');
    const newLoyaltyPoints = await walletPage.getLoyaltyPoints();
    expect(newLoyaltyPoints).toBeLessThan(loyaltyPoints);
  });
});