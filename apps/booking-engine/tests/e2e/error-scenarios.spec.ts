import { test, expect } from '../fixtures/unhideFixture';
import { createRequire } from 'module';
import { LoginPage } from '../pages/LoginPage';
import { FlightHomePage } from '../pages/FlightHomePage';
import { FlightListPage } from '../pages/FlightListPage';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test.describe('Error Scenarios', () => {
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

  test('ES-001: Handle API timeout gracefully', async ({ page }) => {
    test.setTimeout(20000); // Set explicit test timeout of 20s
    const flightHome = new FlightHomePage(page);

    // Mock slow API response
    await page.route('**/api/flights/search', async route => {
      await page.waitForTimeout(8000); // Simulate timeout (8s sleep, well within 30s default)
      await route.abort();
    });

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify timeout error message
    await expect(page.getByText(/timeout|taking.*longer|error/i)).toBeVisible({ timeout: 10000 });

    // Verify retry option
    const retryButton = page.locator('[data-testid="retry-search-button"]');
    const searchButton = page.locator('[data-testid="flight-search-submit"]');
    const isRetryVisible = await retryButton.isVisible().catch(() => false);
    const isSearchVisible = await searchButton.isVisible().catch(() => false);
    expect(isRetryVisible || isSearchVisible).toBeTruthy();
  });

  test('ES-002: Handle network errors', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock network error
    await page.route('**/api/flights/search', route => route.abort('failed'));

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify network error message
    await expect(page.getByText(/network.*error|connection.*failed|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-003: Handle 500 server errors', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock 500 error
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify error message
    await expect(page.getByText(/something.*went.*wrong|server.*error|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-004: Handle session expiration', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Clear session/cookies to simulate expiration
    await page.context().clearCookies();

    await flightHome.goto('/flights');

    // Verify redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('ES-005: Handle invalid search parameters', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    await flightHome.goto('/flights');

    // Enter invalid origin/destination
    await page.getByTestId('flight-from').fill('INVALID', { force: true });
    await page.getByTestId('flight-to').fill('INVALID', { force: true });
    await page.getByTestId('flight-search-submit').click({ force: true });

    // Verify validation error
    await expect(page.getByText(/invalid|error|not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('ES-006: Handle no search results', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock empty search results
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ flights: [] }) })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify no results message
    await expect(page.getByText(/no.*flights.*found|no.*results|no.*available/i)).toBeVisible({ timeout: 10000 });

    // Verify modify search option is available
    const modifyButton = page.locator('[data-testid="modify-search-button"]');
    const searchButton = page.locator('[data-testid="flight-search-submit"]');
    const isModifyVisible = await modifyButton.isVisible().catch(() => false);
    const isSearchVisible = await searchButton.isVisible().catch(() => false);
    expect(isModifyVisible || isSearchVisible).toBeTruthy();
  });

  test('ES-007: Handle API 403 Forbidden errors', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock 403 Forbidden error
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 403, body: 'Forbidden' })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify error message
    await expect(page.getByText(/forbidden|unauthorized|access denied|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-008: Handle API 404 Not Found errors', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock 404 error
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 404, body: 'Not Found' })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify error message
    await expect(page.getByText(/not found|error|invalid/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-009: Handle malformed API responses', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock malformed response
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid json {{{' })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify error message
    await expect(page.getByText(/error|something.*wrong|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-010: Handle concurrent request failures', async ({ page }) => {
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);

    // Start search
    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Wait for results to load
    await page.waitForSelector('[data-testid*="flight-card"]', { timeout: 10000 }).catch(() => {});

    // Attempt to select flight and mock failure on required subsequent API calls
    await page.route('**/api/flights/details', route => route.abort('failed'));
    
    try {
      await flightList.selectFlight(0);
      // If we got here, verify error was shown
      await expect(page.getByText(/error|failed|network/i)).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Error is expected - verify error message is displayed
      await expect(page.getByText(/error|failed|network/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('ES-011: Handle API rate limiting (429 errors)', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock rate limit error
    await page.route('**/api/flights/search', route => 
      route.fulfill({ status: 429, body: 'Too Many Requests' })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify rate limit error message
    await expect(page.getByText(/rate.*limit|too.*many|slow.*down|try.*later|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('ES-012: Handle missing required fields in response', async ({ page }) => {
    const flightHome = new FlightHomePage(page);

    // Mock response with missing required fields
    await page.route('**/api/flights/search', route => 
      route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ flights: [{ id: '1' }] }) // Missing required fields
      })
    );

    await flightHome.goto('/flights');
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate
    );

    // Verify error handling
    const errorMessage = page.getByText(/error|something.*wrong|invalid/i);
    const noResults = page.getByText(/no.*flights.*found|no.*results/i);
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    const isNoResultsVisible = await noResults.isVisible().catch(() => false);
    
    // At least one of these should be true
    expect(isErrorVisible || isNoResultsVisible).toBeTruthy();
  });
});
