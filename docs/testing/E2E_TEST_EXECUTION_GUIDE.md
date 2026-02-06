# E2E Test Execution Guide

## Overview

This guide provides instructions for running, debugging, and maintaining the end-to-end (E2E) test suite for the TripAlfa booking engine. The E2E tests use **Playwright** to automate user interactions and validate critical booking flows.

## Prerequisites

### System Requirements
- Node.js 18+ installed
- npm 9+ or yarn 4+
- macOS, Linux, or Windows with WSL2

### Environment Setup
1. Navigate to the booking-engine directory:
   ```bash
   cd apps/booking-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

4. Create a `.env.test` file with test configuration:
   ```bash
   BASE_URL=http://localhost:3002
   API_URL=http://localhost:3003
   TEST_USER_EMAIL=testuser1@example.com
   TEST_USER_PASSWORD=Test@123
   ```

## Running E2E Tests

### Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run a single test file
npx playwright test tests/e2e/flight-booking.spec.ts

# Run tests matching a pattern
npx playwright test -g "FB-001"

# Run tests in a specific project (browser)
npx playwright test --project=chromium
```

### Test Execution Options

```bash
# Run tests with parallel workers
npx playwright test --workers=4

# Run tests serially (one at a time)
npx playwright test --workers=1

# Run tests with verbose output
npx playwright test --reporter=verbose

# Generate HTML report
npx playwright test --reporter=html

# Run with tracing enabled
npx playwright test --trace=on
```

## Test Categories

### 1. Flight Booking Tests (`flight-booking.spec.ts`)

**Location**: `tests/e2e/flight-booking.spec.ts`

**Test Cases**:
- **FB-001**: Complete flight booking with card payment (Happy Path)
- **FB-002**: Complete flight booking with wallet payment
- **FB-003**: Flight booking - Payment failure handling
- **FB-004**: Flight booking - Validation errors
- **FB-005**: Flight booking - Round trip with multiple passengers

**Status**: 
- ✅ FB-001: PASSING
- ⏳ FB-002 to FB-005: In Progress (Selector fixes needed)

**Running Flight Tests**:
```bash
npx playwright test tests/e2e/flight-booking.spec.ts
npx playwright test tests/e2e/flight-booking.spec.ts -g "FB-001"
```

### 2. Hotel Booking Tests (`hotel-booking.spec.ts`)

**Location**: `tests/e2e/hotel-booking.spec.ts`

**Test Cases**:
- **HB-001**: Complete hotel booking with card payment (Happy Path)
- **HB-002**: Hotel booking with wallet payment
- **HB-003**: Hotel booking - Insufficient wallet balance
- **HB-004**: Hotel booking - Multiple rooms

**Status**: In Progress (Selector fixes needed)

### 3. Booking Management Tests (`booking-management.spec.ts`)

**Location**: `tests/e2e/booking-management.spec.ts`

**Test Cases**:
- **BM-001**: View booking list
- **BM-002**: Search and filter bookings
- **BM-003**: Cancel booking

**Status**: In Progress

### 4. Wallet Operations Tests (`wallet.spec.ts`)

**Location**: `tests/e2e/wallet.spec.ts`

**Test Cases**:
- **WO-001**: View wallet balance
- **WO-002**: Top-up wallet
- **WO-003**: Use wallet for payment

**Status**: In Progress

### 5. Payment Processing Tests (`payment.spec.ts`, `payment-errors.spec.ts`)

**Location**: `tests/e2e/payment.spec.ts`, `tests/e2e/payment-errors.spec.ts`

**Test Cases**:
- **PP-001**: Card payment success
- **PP-002**: Card payment declined
- **PP-003**: Wallet payment processing

**Status**: In Progress

### 6. Error Scenario Tests

**Validation Errors** (`validation-errors.spec.ts`)
- Invalid passenger details
- Invalid search parameters
- Past date search

**Payment Errors** (`payment-errors.spec.ts`)
- Card payment declined
- Insufficient wallet balance

**Timeout Errors** (`timeout-errors.spec.ts`)
- Search timeout handling
- Booking confirmation timeout

**Network Errors** (`network-errors.spec.ts`)
- Network disconnection during booking
- API unreachable scenarios

**Status**: In Progress

### 7. Smoke Tests (`booking-engine.smoke.spec.ts`)

**Location**: `tests/e2e/booking-engine.smoke.spec.ts`

**Test Cases**:
- Homepage loads and displays main elements

**Status**: ✅ PASSING

## Debugging Tests

### Enable UI Mode for Interactive Debugging

```bash
npm run test:e2e:ui
```

This opens an interactive test runner where you can:
- Step through tests line by line
- Inspect DOM elements
- View network requests
- Replay failed tests

### Debug Mode with Inspector

```bash
npm run test:e2e:debug
```

This starts the Playwright Inspector which allows:
- Step into/out of test code
- Set breakpoints
- Inspect variables
- Execute code in console

### Headed Mode to See Browser

```bash
npm run test:e2e:headed
```

Runs tests with the browser visible, useful for visual debugging.

### View Test Reports

```bash
npm run test:e2e:report
```

Opens HTML report showing:
- Test results and timing
- Failed test details
- Screenshots of failures
- Video recordings
- Trace files for debugging

## Troubleshooting

### Common Issues

#### 1. **Tests Timeout**

**Symptom**: Tests fail with "Timeout exceeded" error

**Solutions**:
- Increase timeout in `playwright.config.ts`:
  ```typescript
  timeout: 90000, // 90 seconds instead of 60
  ```
- Check if the dev server is running:
  ```bash
  curl http://localhost:3002
  ```
- Run tests serially to reduce system load:
  ```bash
  npx playwright test --workers=1
  ```

#### 2. **Selector Not Found**

**Symptom**: Tests fail with "locator.click: No matching element" error

**Solutions**:
- Use Playwright Inspector to find correct selector:
  ```bash
  npm run test:e2e:debug
  ```
- Check if `data-testid` attributes exist in frontend code
- Update page objects with correct selectors:
  ```typescript
  // tests/pages/FlightHomePage.ts
  async searchFlight(from: string, to: string, date: string) {
    await this.getByTestId('flight-from').fill(from); // Update selector
  }
  ```

#### 3. **Tests Pass Locally but Fail in CI**

**Symptom**: Tests work on local machine but fail in CI/CD

**Solutions**:
- Ensure same Node.js version in CI
- Check for hardcoded localhost URLs
- Verify test data setup is complete
- Run with verbose logging:
  ```bash
  npx playwright test --reporter=verbose
  ```

#### 4. **Flaky Tests (Intermittent Failures)**

**Symptom**: Tests sometimes pass, sometimes fail randomly

**Solutions**:
- Avoid `page.waitForTimeout()` - use `waitFor()` instead:
  ```typescript
  // Bad
  await page.waitForTimeout(5000);
  
  // Good
  await this.getByTestId('element').waitFor();
  ```
- Use stable selectors (`data-testid` instead of CSS selectors)
- Check for race conditions in test code
- Run tests multiple times to identify patterns:
  ```bash
  npx playwright test --repeat-each=5
  ```

#### 5. **Dev Server Not Starting**

**Symptom**: Error "Failed to connect to WebServer"

**Solutions**:
- Start dev server manually:
  ```bash
  npm run dev
  ```
- Check if port 3002 is already in use:
  ```bash
  lsof -i :3002
  ```
- Kill process using the port and try again

### Get Help

1. **View Playwright Docs**: https://playwright.dev/docs/intro
2. **Check Test Reports**: `npm run test:e2e:report`
3. **View Test Traces**: Use `npx playwright show-trace` with trace file
4. **Review Test Code**: Check `tests/e2e/*.spec.ts` files

## Test Data Management

### Test Fixtures

Test data is stored in `tests/fixtures/`:
- `users.json` - Test user accounts
- `flights.json` - Flight search parameters
- `hotels.json` - Hotel search parameters
- `bookings.json` - Booking test data
- `payments.json` - Payment test data

### Using Fixtures in Tests

```typescript
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test('FB-001: Flight booking', async ({ page }) => {
  // Use fixture data
  await flightHome.searchFlight(
    flights[0].from,
    flights[0].to,
    flights[0].departureDate
  );
});
```

### Updating Test Data

1. Locate the fixture file in `tests/fixtures/`
2. Update the JSON data as needed
3. Run tests to verify changes work
4. Commit updated fixtures with code changes

## Page Objects

The test suite uses the **Page Object Model** pattern for maintainability.

### Available Page Objects

Located in `tests/pages/`:
- `BasePage.ts` - Base class for all pages
- `LoginPage.ts` - Login page interactions
- `FlightHomePage.ts` - Flight search form
- `FlightListPage.ts` - Flight results display
- `FlightDetailPage.ts` - Flight details modal
- `HotelDetailPage.ts` - Hotel details modal
- `PassengerDetailsPage.ts` - Passenger information form
- `BookingCheckoutPage.ts` - Checkout process
- `BookingConfirmationPage.ts` - Booking confirmation
- `BookingManagementPage.ts` - Booking list/management
- `WalletPage.ts` - Wallet operations
- `WalletTopUpPage.ts` - Wallet top-up form
- `WalletTransferPage.ts` - Wallet transfers

### Creating/Updating Page Objects

```typescript
// tests/pages/CustomPage.ts
import { BasePage } from './BasePage';

export class CustomPage extends BasePage {
  async performAction() {
    await this.getByTestId('element-id').click();
  }

  async verifyElement() {
    await expect(this.getByTestId('element-id')).toBeVisible();
  }
}
```

## Continuous Integration

### GitHub Actions

Tests can be integrated into GitHub Actions:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### ✅ Do's

- Use `data-testid` attributes for element selection
- Write descriptive test names
- Use Page Objects to encapsulate UI interactions
- Test critical user flows end-to-end
- Keep tests independent and isolated
- Use fixtures for test data
- Add comments for complex test logic
- Run tests regularly during development

### ❌ Don'ts

- Don't use CSS selectors or XPath if possible
- Don't hard-code test data in tests
- Don't create interdependent tests
- Don't use `waitForTimeout()` for timing
- Don't test implementation details
- Don't run tests in parallel if they share state
- Don't ignore flaky tests - investigate and fix them

## Performance Optimization

### Parallel Execution

Run tests in parallel to speed up test suite:

```bash
# Use default worker count
npx playwright test

# Use specific worker count
npx playwright test --workers=8
```

### Reduce Timeouts

Optimize timeouts for faster feedback:

```typescript
// playwright.config.ts
timeout: 45000, // Reduce from 60000ms
actionTimeout: 10000, // Reduce from 15000ms
```

### Optimize Test Data

- Use lightweight test fixtures
- Avoid creating unnecessary test data
- Clean up data after each test

## Reporting

### HTML Report

```bash
npm run test:e2e:report
```

Shows:
- Pass/fail status
- Execution time
- Screenshots and videos
- Test details

### JSON Report

```bash
npx playwright test --reporter=json > results.json
```

Useful for integrating with other tools.

## Maintenance

### Regular Tasks

1. **Update Selectors** - When UI changes
2. **Review Flaky Tests** - Investigate intermittent failures
3. **Update Fixtures** - Keep test data current
4. **Monitor Performance** - Track test execution time
5. **Add New Tests** - As features are added

### Version Updates

Keep Playwright updated:

```bash
npm update @playwright/test
npx playwright install
```

## Contact & Support

For questions or issues with E2E tests:
1. Check Playwright documentation: https://playwright.dev
2. Review test logs and reports
3. Consult test code and page objects
4. Ask the development team

---

**Last Updated**: February 5, 2026  
**Test Framework**: Playwright 1.58.1  
**Browser Target**: Chromium (Phase 1)  
**Status**: Phase 1 - Active Development
