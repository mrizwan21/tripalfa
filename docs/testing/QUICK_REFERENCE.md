# E2E Testing - Quick Reference Card

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/booking-engine
npm install
npx playwright install

# Run all tests
npm run test:e2e

# Run specific test
npx playwright test -g "FB-001"

# View results
npm run test:e2e:report
```

## 📁 Key Files & Locations

| Item | Location | Files |
|------|----------|-------|
| **E2E Tests** | `apps/booking-engine/tests/e2e/` | 12 .spec.ts files |
| **Page Objects** | `apps/booking-engine/tests/pages/` | 19 .ts files |
| **Test Data** | `apps/booking-engine/tests/fixtures/` | 7 .json files |
| **Helpers** | `apps/booking-engine/tests/helpers/` | 5 .ts files |
| **Config** | `apps/booking-engine/` | playwright.config.ts |
| **API Tests** | `services/booking-service/src/__tests__/integration/e2e/` | 4 test files |
| **Documentation** | `docs/testing/` | 4 guides |

## 🧪 Test Commands

```bash
# All tests
npm run test:e2e

# Specific test file
npx playwright test tests/e2e/flight-booking.spec.ts

# Tests matching pattern
npx playwright test -g "FB-001"

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed (see browser)
npm run test:e2e:headed

# View report
npm run test:e2e:report

# Single worker (serial)
npx playwright test --workers=1

# Multiple workers (parallel)
npx playwright test --workers=8

# Verbose output
npx playwright test --reporter=verbose
```

## 🎯 Test Categories

| Category | File | Tests | Status |
|----------|------|-------|--------|
| Smoke | booking-engine.smoke.spec.ts | 1 | ✅ |
| Flight Booking | flight-booking.spec.ts | 5 | 🟡 1/5 ✅ |
| Hotel Booking | hotel-booking.spec.ts | 4 | 🟡 |
| Booking Mgmt | booking-management.spec.ts | 3 | 🟡 |
| Wallet | wallet.spec.ts | 1 | 🟡 |
| Payment | payment.spec.ts | 2 | 🟡 |
| Payment Errors | payment-errors.spec.ts | 2 | 🟡 |
| Validation | validation-errors.spec.ts | 3 | 🟡 |
| Timeouts | timeout-errors.spec.ts | 2 | 🟡 |
| Network | network-errors.spec.ts | 1 | 🟡 |
| Real API | flight-booking-real-api.spec.ts | 2 | 🟡 |

## 📖 Documentation Links

- **[E2E Test Execution Guide](E2E_TEST_EXECUTION_GUIDE.md)** - How to run & debug tests
- **[Test Data Management Guide](TEST_DATA_MANAGEMENT_GUIDE.md)** - Fixture & seeding
- **[Implementation Summary](E2E_TESTING_IMPLEMENTATION_SUMMARY.md)** - Status & architecture
- **[Phase 1 Deliverables](PHASE_1_DELIVERABLES.md)** - What was built

## 🐛 Debugging

### 1. Interactive UI Mode
```bash
npm run test:e2e:ui
```
- Click to step through tests
- Inspect DOM elements
- View network requests

### 2. Debug Mode
```bash
npm run test:e2e:debug
```
- Playwright Inspector opens
- Set breakpoints in code
- Execute code in console

### 3. Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```
- Watch test execution
- See what's happening visually
- Fast feedback

### 4. View Reports
```bash
npm run test:e2e:report
```
- HTML report with screenshots
- Video recordings
- Trace files for debugging

## 🔍 Common Issues

| Issue | Solution |
|-------|----------|
| **Test times out** | Increase timeout: `timeout: 90000` in config |
| **Element not found** | Use `npm run test:e2e:debug` to find correct selector |
| **Slow tests** | Run in parallel: `--workers=8` |
| **Flaky tests** | Use `waitFor()` instead of `waitForTimeout()` |
| **Dev server fails** | Ensure port 3002 is free: `lsof -i :3002` |
| **Storage state fails** | Delete `tests/fixtures/storageState.json` and regenerate |

## 📝 Using Fixtures in Tests

```typescript
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');
const flights = require('../fixtures/flights.json');

test('Flight booking', async ({ page }) => {
  // Use fixture data
  const email = users.testUser1.email;
  const flight = flights.domesticFlight;
});
```

## 🔨 Fixing a Test

### Step 1: Identify the Problem
```bash
npm run test:e2e -g "test-name"
# Check error message and screenshot
```

### Step 2: Debug the Issue
```bash
npx playwright test tests/e2e/test.spec.ts --debug
# Use inspector to find correct element
```

### Step 3: Update Page Object
```typescript
// tests/pages/PageName.ts
async someAction() {
  await this.getByTestId('correct-selector').click(); // Update selector
}
```

### Step 4: Run Test Again
```bash
npx playwright test tests/e2e/test.spec.ts -g "test-name"
```

## 📊 Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { FlightListPage } from '../pages/FlightListPage';

const users = require('../fixtures/users.json');

test.describe('Flight Booking', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
  });

  test('FB-001: Complete booking', async ({ page }) => {
    // Test implementation
    const flightList = new FlightListPage(page);
    await expect(flightList.getByTestId('flight-results')).toBeVisible();
  });
});
```

## 🌐 Accessing Different Parts

```typescript
// Navigate
await page.goto('/flights');

// Wait for element
await page.getByTestId('element').waitFor();

// Click
await page.getByTestId('button').click();

// Fill text
await page.getByTestId('input').fill('value');

// Get text
const text = await page.getByTestId('element').textContent();

// Verify
await expect(page.getByTestId('element')).toBeVisible();
```

## ⚡ Performance Tips

1. **Use parallel workers**
   ```bash
   npx playwright test --workers=4
   ```

2. **Run subset of tests**
   ```bash
   npx playwright test -g "FB-" # Run all FB tests
   ```

3. **Skip slow tests during dev**
   ```typescript
   test.skip('slow test', async ({ page }) => {
     // Skipped
   });
   ```

4. **Use `waitFor()` not `waitForTimeout()`**
   ```typescript
   // Bad
   await page.waitForTimeout(5000);
   
   // Good
   await page.getByTestId('element').waitFor();
   ```

## 🔐 Environment Variables

Create `.env.test` in `apps/booking-engine/`:

```bash
BASE_URL=http://localhost:3002
API_URL=http://localhost:3003
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123
```

## 📦 Page Objects Available

| Page | Selector Prefix | Methods |
|------|-----------------|---------|
| BasePage | - | getByTestId, goto, waitForPageLoad |
| LoginPage | login- | login, verifyForm |
| FlightHomePage | flight- | searchFlight, searchRoundTrip |
| FlightListPage | flight- | selectFlight, getFlightDetails |
| HotelDetailPage | hotel- | selectRoom, getPrice |
| PaymentPage | payment- | fillCardDetails, submitPayment |
| BookingCheckoutPage | checkout- | reviewBooking, confirmBooking |
| WalletPage | wallet- | getBalance, topUpWallet |

## 🎓 Learning Resources

- **Playwright Docs**: https://playwright.dev
- **Test Examples**: `apps/booking-engine/tests/e2e/*.spec.ts`
- **Page Objects**: `apps/booking-engine/tests/pages/*.ts`
- **Full Guides**: `docs/testing/*.md`

## ✅ Before Committing Code

- [ ] Run tests locally: `npm run test:e2e`
- [ ] Fix any failing tests
- [ ] Add new tests for new features
- [ ] Update page objects if UI changes
- [ ] Run linting: `npm run lint`
- [ ] Commit test code with feature code

## 🆘 Need Help?

1. Check [E2E_TEST_EXECUTION_GUIDE.md](E2E_TEST_EXECUTION_GUIDE.md) - Troubleshooting section
2. Review test examples: `tests/e2e/*.spec.ts`
3. Use debug mode: `npm run test:e2e:debug`
4. Check Playwright docs: https://playwright.dev

---

**Version**: Phase 1  
**Last Updated**: February 5, 2026  
**Status**: Active Development
