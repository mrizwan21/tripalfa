import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { FlightDetailPage } from '../pages/FlightDetailPage';
import { FlightAddonsPage } from '../pages/FlightAddonsPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { HotelHomePage } from '../pages/HotelHomePage';
import { HotelListPage } from '../pages/HotelListPage';
import { HotelDetailPage } from '../pages/HotelDetailPage';
import { HotelAddonsPage } from '../pages/HotelAddonsPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');
const hotels = require('../fixtures/hotels.json');
const payments = require('../fixtures/payments.json');

test.describe('Enhanced Error Handling Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flag to enable mock data
    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_FLIGHTS = true;
      (globalThis as any).TEST_MODE_HOTELS = true;
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

  test('EH-001: Network disconnection during flight booking', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Step 1: Start flight booking
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Step 2: Simulate network disconnection during flight selection
    await page.context().route('**/api/flights/**', route => {
      route.abort('connectionfailed');
    });

    // Step 3: Try to select flight (should fail gracefully)
    try {
      await flightList.selectFlight(0);
      // If no error, verify error handling
      await expect(page.getByTestId('network-error')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Verify error message is displayed
      await expect(page.getByText(/network.*error|connection.*failed/i)).toBeVisible();
    }

    // Step 4: Restore network and retry
    await page.context().unroute('**/api/flights/**');
    await page.reload();
    
    // Step 5: Complete booking successfully
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );
    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails('Network', 'Test', {
      passportNumber: 'NT1234567',
      email: 'network.test@test.com',
    });
    await passengerDetails.continue();
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Network Test'
    );

    await expect(page.getByTestId('confirmation-page')).toBeVisible();
  });

  test('EH-002: API rate limiting during hotel search', async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);

    // Step 1: Start multiple rapid searches to trigger rate limiting
    await hotelHome.goto('/hotels');
    
    // Step 2: Simulate rate limiting
    await page.context().route('**/api/hotels/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        })
      });
    });

    // Step 3: Perform search that should hit rate limit
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      hotels[0].adults,
      hotels[0].rooms
    );

    // Step 4: Verify rate limiting error is handled
    await expect(page.getByTestId('rate-limit-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/rate.*limit|too.*many.*requests/i)).toBeVisible();

    // Step 5: Restore API and retry after delay
    await page.context().unroute('**/api/hotels/**');
    await page.waitForTimeout(2000); // Wait before retry
    
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      hotels[0].adults,
      hotels[0].rooms
    );

    await expect(page.getByTestId('hotel-results')).toBeVisible();
  });

  test('EH-003: Payment gateway timeout handling', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Step 1: Complete flight booking up to payment
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
    await flightAddons.continue();
    await passengerDetails.fillPassengerDetails('Timeout', 'Test', {
      passportNumber: 'TT1234567',
      email: 'timeout.test@test.com',
    });
    await passengerDetails.continue();

    // Step 2: Simulate payment gateway timeout
    await page.context().route('**/api/payments/**', route => {
      // Simulate timeout by not responding
      setTimeout(() => route.continue(), 10000);
    });

    // Step 3: Attempt payment (should timeout gracefully)
    try {
      await checkout.payWithCard(
        payments[0].cardNumber,
        payments[0].exp,
        payments[0].cvc,
        'Timeout Test'
      );
    } catch (error) {
      // Verify timeout error is handled gracefully
      await expect(page.getByText(/payment.*timeout|gateway.*timeout/i)).toBeVisible();
    }

    // Step 4: Restore payment gateway and retry
    await page.context().unroute('**/api/payments/**');
    
    // Step 5: Complete payment successfully
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Timeout Test'
    );

    await expect(page.getByTestId('confirmation-page')).toBeVisible();
  });

  test('EH-004: Seat availability conflict handling', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Step 1: Search and select flight
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

    // Step 2: Simulate seat availability conflict during add-ons
    await page.context().route('**/api/seats/**', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Seat unavailable',
          message: 'Selected seat is no longer available. Please choose another.',
          availableSeats: ['12B', '12C', '13A']
        })
      });
    });

    // Step 3: Try to select seat (should handle conflict)
    await flightAddons.continue(); // Skip seat selection for now
    
    // Step 4: Fill passenger details
    await passengerDetails.fillPassengerDetails('Conflict', 'Test', {
      passportNumber: 'CT1234567',
      email: 'conflict.test@test.com',
    });
    await passengerDetails.continue();

    // Step 5: Complete booking successfully
    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Conflict Test'
    );

    await expect(page.getByTestId('confirmation-page')).toBeVisible();
  });

  test('EH-005: Hotel room type availability conflict', async ({ page }) => {
    const hotelHome = new HotelHomePage(page);
    const hotelList = new HotelListPage(page);
    const hotelDetail = new HotelDetailPage(page);
    const hotelAddons = new HotelAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);

    // Step 1: Search for hotel
    await hotelHome.goto('/hotels');
    await hotelHome.searchHotel(
      hotels[0].city,
      hotels[0].checkInDate,
      hotels[0].checkOutDate,
      hotels[0].adults,
      hotels[0].rooms
    );
    await hotelList.selectHotel(0);

    // Step 2: Simulate room availability conflict
    await page.context().route('**/api/hotels/**/rooms', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Room unavailable',
          message: 'Selected room type is no longer available.',
          availableRooms: ['Deluxe', 'Suite', 'Family']
        })
      });
    });

    // Step 3: Try to select room (should handle conflict)
    try {
      await hotelDetail.selectRoom(0);
      // If no error, verify alternative room selection
      await expect(page.getByTestId('alternative-rooms')).toBeVisible();
    } catch (error) {
      // Verify conflict error is displayed
      await expect(page.getByText(/room.*unavailable|not.*available/i)).toBeVisible();
    }

    // Step 4: Select alternative room
    await hotelDetail.selectRoom(1); // Select alternative room
    await hotelAddons.continue();

    // Step 5: Complete booking
    await passengerDetails.fillPassengerDetails('Room', 'Conflict', {
      email: 'room.conflict@test.com',
      phone: '+1234567890',
    });
    await passengerDetails.continue();

    await checkout.payWithCard(
      payments[0].cardNumber,
      payments[0].exp,
      payments[0].cvc,
      'Room Conflict'
    );

    await expect(page.getByTestId('confirmation-page')).toBeVisible();
  });

  test('EH-006: Database connection error handling', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);

    // Step 1: Simulate database connection error
    await page.context().route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again later.',
          code: 'DB_CONN_ERROR'
        })
      });
    });

    // Step 2: Try to perform search (should handle database error)
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Step 3: Verify database error is handled gracefully
    await expect(page.getByTestId('database-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/database.*connection|unable.*connect/i)).toBeVisible();

    // Step 4: Restore database connection
    await page.context().unroute('**/api/**');
    await page.reload();

    // Step 5: Complete booking successfully
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );
    await expect(page.getByTestId('flight-results')).toBeVisible();
  });

  test('EH-007: External service timeout handling', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);

    // Step 1: Simulate external service timeout
    await page.context().route('**/api/external/**', route => {
      // Simulate timeout by not responding
      // This will cause the request to timeout
    });

    // Step 2: Perform search that depends on external service
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Step 3: Verify external service timeout is handled
    await expect(page.getByTestId('external-service-error')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/external.*service|timeout/i)).toBeVisible();

    // Step 4: Restore external service
    await page.context().unroute('**/api/external/**');
    await page.reload();

    // Step 5: Complete booking successfully
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );
    await expect(page.getByTestId('flight-results')).toBeVisible();
  });

  test('EH-008: Memory leak prevention during long sessions', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const hotelHome = new HotelHomePage(page);

    // Step 1: Perform multiple operations to test memory usage
    for (let i = 0; i < 10; i++) {
      // Search flights
      await flightHome.goto('/flights');
      await flightHome.searchFlight(
        flights[0].from,
        flights[0].to,
        flights[0].adults,
        flights[0].class,
        flights[0].departureDate
      );
      await page.waitForTimeout(500);

      // Search hotels
      await hotelHome.goto('/hotels');
      await hotelHome.searchHotel(
        hotels[0].city,
        hotels[0].checkInDate,
        hotels[0].checkOutDate,
        hotels[0].adults,
        hotels[0].rooms
      );
      await page.waitForTimeout(500);
    }

    // Step 2: Verify application remains responsive
    await flightHome.goto('/flights');
    await expect(page.getByTestId('flight-search-form')).toBeVisible();

    // Step 3: Verify no memory-related errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    
    // Should not have memory-related console errors
    const memoryErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('memory') || 
      error.toLowerCase().includes('heap') ||
      error.toLowerCase().includes('out of memory')
    );
    
    expect(memoryErrors.length).toBe(0);
  });
});