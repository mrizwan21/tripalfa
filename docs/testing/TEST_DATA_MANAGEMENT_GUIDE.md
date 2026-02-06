# Test Data Management Guide

## Overview

This guide explains how to manage, create, and maintain test data for the E2E test suite. Test data includes user accounts, flight/hotel search parameters, bookings, payments, and other test fixtures used by Playwright tests.

## Test Data Architecture

### Directory Structure

```
apps/booking-engine/
├── tests/
│   ├── fixtures/                    # Test data files
│   │   ├── users.json              # Test user accounts
│   │   ├── flights.json            # Flight search parameters
│   │   ├── flight-results.json     # Sample flight results
│   │   ├── hotels.json             # Hotel search parameters
│   │   ├── bookings.json           # Booking test data
│   │   ├── payments.json           # Payment test data
│   │   ├── wallets.json            # Wallet test data
│   │   └── storageState.json       # Playwright authentication state
│   │
│   ├── helpers/                     # Test utilities
│   │   ├── db-seeding.ts           # Database seeding functions
│   │   ├── test-data-factory.ts    # Dynamic data generation
│   │   └── api-helpers.ts          # API test utilities
│   │
│   └── pages/                       # Page Objects
│       └── *.ts                     # Page object files
```

## Fixture Files

### 1. users.json

Contains test user accounts with different roles and permission levels.

**Location**: `tests/fixtures/users.json`

**Example**:
```json
{
  "testUser1": {
    "id": "user-001",
    "email": "testuser1@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "customer"
  },
  "testUser2": {
    "id": "user-002",
    "email": "testuser2@example.com",
    "password": "Test@123",
    "firstName": "Premium",
    "lastName": "User",
    "phone": "+1234567891",
    "role": "premium_customer"
  },
  "adminUser": {
    "id": "admin-001",
    "email": "admin@tripalfa.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567892",
    "role": "admin"
  }
}
```

**Usage in Tests**:
```typescript
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const users = require('../fixtures/users.json');

test('Login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto('/login');
  await loginPage.login(users.testUser1.email, users.testUser1.password);
});
```

### 2. flights.json

Contains flight search parameters used for testing flight booking flows.

**Location**: `tests/fixtures/flights.json`

**Example**:
```json
{
  "domesticFlight": {
    "from": "JFK",
    "to": "LAX",
    "departureDate": "2026-04-15",
    "returnDate": "2026-04-20",
    "passengers": 1,
    "travelClass": "economy",
    "price": 350.00,
    "airline": "Test Airways",
    "flightNumber": "TA123"
  },
  "internationalFlight": {
    "from": "JFK",
    "to": "LHR",
    "departureDate": "2026-04-10",
    "returnDate": "2026-04-20",
    "passengers": 2,
    "travelClass": "business",
    "price": 850.00,
    "airline": "Global Air",
    "flightNumber": "GA456"
  },
  "shortFlip": {
    "from": "BOS",
    "to": "NYC",
    "departureDate": "2026-04-15",
    "passengers": 1,
    "travelClass": "economy",
    "price": 150.00
  }
}
```

**Usage**:
```typescript
const flights = require('../fixtures/flights.json');

test('FB-001: Flight booking', async ({ page }) => {
  const flightHome = new FlightHomePage(page);
  await flightHome.searchFlight(
    flights.domesticFlight.from,
    flights.domesticFlight.to,
    flights.domesticFlight.departureDate
  );
});
```

### 3. hotels.json

Contains hotel search parameters for hotel booking tests.

**Location**: `tests/fixtures/hotels.json`

**Example**:
```json
{
  "luxuryHotel": {
    "destination": "New York",
    "checkInDate": "2026-04-15",
    "checkOutDate": "2026-04-20",
    "rooms": 1,
    "guests": 2,
    "pricePerNight": 350.00,
    "hotelName": "The Plaza",
    "address": "Fifth Avenue, New York"
  },
  "budgetHotel": {
    "destination": "Los Angeles",
    "checkInDate": "2026-04-15",
    "checkOutDate": "2026-04-17",
    "rooms": 1,
    "guests": 1,
    "pricePerNight": 80.00,
    "hotelName": "Budget Inn",
    "address": "Downtown LA"
  },
  "multiRoomHotel": {
    "destination": "San Francisco",
    "checkInDate": "2026-04-15",
    "checkOutDate": "2026-04-18",
    "rooms": 3,
    "guests": 6,
    "pricePerNight": 250.00,
    "hotelName": "Bay View Hotel"
  }
}
```

### 4. bookings.json

Contains expected booking data used for validation.

**Location**: `tests/fixtures/bookings.json`

**Example**:
```json
{
  "flightBooking": {
    "type": "flight",
    "reference": "BK123456",
    "status": "confirmed",
    "totalAmount": 350.00,
    "currency": "USD"
  },
  "hotelBooking": {
    "type": "hotel",
    "reference": "BK789012",
    "status": "confirmed",
    "totalAmount": 1750.00,
    "currency": "USD"
  }
}
```

### 5. payments.json

Contains payment test data and expected responses.

**Location**: `tests/fixtures/payments.json`

**Example**:
```json
{
  "validCard": {
    "cardNumber": "4242424242424242",
    "expiry": "12/25",
    "cvc": "123",
    "holderName": "Test User",
    "status": "success"
  },
  "declinedCard": {
    "cardNumber": "4000000000000002",
    "expiry": "12/25",
    "cvc": "123",
    "holderName": "Test User",
    "status": "declined",
    "errorMessage": "Card declined"
  },
  "invalidCard": {
    "cardNumber": "1234567890123456",
    "expiry": "01/25",
    "cvc": "000",
    "holderName": "Invalid User",
    "status": "invalid",
    "errorMessage": "Invalid card number"
  }
}
```

### 6. wallets.json

Contains wallet test data.

**Location**: `tests/fixtures/wallets.json`

**Example**:
```json
{
  "testWallet1": {
    "userId": "user-001",
    "balance": 1000.00,
    "currency": "USD"
  },
  "testWallet2": {
    "userId": "user-002",
    "balance": 500.00,
    "currency": "USD"
  },
  "lowBalanceWallet": {
    "userId": "user-003",
    "balance": 50.00,
    "currency": "USD"
  }
}
```

## Creating and Maintaining Test Data

### Adding New Test Data

1. **Identify the Fixture Type**
   - User accounts → `users.json`
   - Search parameters → `flights.json` or `hotels.json`
   - Booking data → `bookings.json`
   - Payment data → `payments.json`
   - Wallet data → `wallets.json`

2. **Add the Data**
   ```json
   {
     "newTestCase": {
       "field1": "value1",
       "field2": "value2"
     }
   }
   ```

3. **Use in Tests**
   ```typescript
   const data = require('../fixtures/file.json');
   test('New test', async ({ page }) => {
     // Use data.newTestCase
   });
   ```

4. **Commit to Version Control**
   ```bash
   git add tests/fixtures/file.json
   git commit -m "Add new test data for feature X"
   ```

### Updating Existing Test Data

1. **Locate the fixture file**
2. **Update the JSON structure**
   - Keep existing test data for backwards compatibility
   - Add new fields as needed
   - Update comments if structure changes

3. **Verify tests still pass**
   ```bash
   npm run test:e2e -g "affected-test-name"
   ```

4. **Document changes**
   - Add comment in the fixture file explaining changes
   - Update this guide if new fixture types are added

### Best Practices for Test Data

#### ✅ Do's
- Use realistic but clearly identifiable test data
- Include multiple scenarios (success, failure, edge cases)
- Use timezone-agnostic dates where possible
- Keep data organized and grouped by test scenario
- Document the purpose of each test data set
- Use consistent formatting (JSON style)
- Version control all fixture files
- Update fixtures when UI/API changes

#### ❌ Don'ts
- Don't use production data or customer information
- Don't hard-code sensitive information (use environment variables)
- Don't create unnecessarily large data sets
- Don't mix unrelated test cases in one fixture
- Don't use timestamps that will become invalid
- Don't update fixtures without updating tests
- Don't commit test data containing PII (personal identifiable information)

## Test Data Seeding

### Database Seeding

**Location**: `tests/helpers/db-seeding.ts`

**Purpose**: Populate test database with fixture data before tests run.

**Usage**:
```typescript
import { seedTestData, cleanupTestData } from '../helpers/db-seeding';

test.beforeAll(async () => {
  // Seed test data before all tests
  await seedTestData();
});

test.afterAll(async () => {
  // Clean up test data after all tests
  await cleanupTestData();
});
```

### Dynamic Test Data Generation

**Location**: `tests/helpers/test-data-factory.ts`

**Purpose**: Generate dynamic test data programmatically.

**Example**:
```typescript
import { TestDataFactory } from '../helpers/test-data-factory';

const factory = new TestDataFactory();

test('Dynamic test', async ({ page }) => {
  const randomUser = factory.generateUser();
  const randomBooking = factory.generateBooking(randomUser.id);
  
  // Use generated data
});
```

## Managing Storage State

### What is Storage State?

Playwright can save authentication state (cookies, localStorage) to a file and reuse it across tests.

**Location**: `tests/fixtures/storageState.json`

### Generating Storage State

1. Run setup project which generates authentication:
   ```bash
   npx playwright test --project=setup
   ```

2. Storage state is automatically saved to `tests/fixtures/storageState.json`

3. Tests use this storage state via Playwright configuration

### Updating Storage State

When authentication changes:
```bash
# Force regeneration
npx playwright test --project=setup --update-snapshots
```

## Environment Variables

Test environment variables are configured via `.env.test`:

```bash
# .env.test in apps/booking-engine/

# Application URLs
BASE_URL=http://localhost:3002
API_URL=http://localhost:3003

# Test Credentials
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123

# API Keys (if needed for integration tests)
STRIPE_TEST_KEY=sk_test_...
HOTELSTON_API_KEY=...

# Database (if using real DB for seeding)
DATABASE_URL=postgresql://user:password@localhost:5432/tripalfa_test
```

**Important**: Never commit sensitive information like real API keys. Use placeholder values and actual values only in CI/CD secrets.

## Common Test Data Scenarios

### Scenario 1: Successful Booking Flow
```json
{
  "user": "testUser1",           // Valid user
  "flight": "domesticFlight",    // Valid flight
  "payment": "validCard",         // Valid payment method
  "expectedResult": "success"
}
```

### Scenario 2: Payment Failure
```json
{
  "user": "testUser1",
  "flight": "domesticFlight",
  "payment": "declinedCard",      // Card that will be declined
  "expectedResult": "failure"
}
```

### Scenario 3: Insufficient Funds
```json
{
  "user": "testUser3",            // Low balance wallet
  "hotel": "luxuryHotel",         // Expensive hotel
  "paymentMethod": "wallet",
  "expectedResult": "insufficient_balance"
}
```

## Troubleshooting Test Data Issues

### Issue: "Test data fixture not found"

**Solution**: Verify the fixture file exists and path is correct
```bash
ls tests/fixtures/file.json
```

### Issue: "Invalid JSON in fixture file"

**Solution**: Validate JSON syntax
```bash
cat tests/fixtures/users.json | python -m json.tool
```

### Issue: "Test data changed between runs"

**Solution**: Ensure proper cleanup after tests
```typescript
test.afterEach(async () => {
  await cleanupTestData();
});
```

### Issue: "Stale test data causing flaky tests"

**Solution**: Reset test data before critical tests
```typescript
test.beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});
```

## Data Privacy and Security

### Guidelines

1. **Never use real customer data** - Only use synthetic test data
2. **No sensitive information** - Avoid real credit card numbers, SSNs, etc.
3. **Mask in reports** - If error messages contain data, sanitize them
4. **Secure storage** - Don't commit API keys or passwords
5. **Cleanup after tests** - Remove test data from any persistent storage

### Testing with Production-like Data

For performance testing or realistic scenarios:
1. Create anonymized production-like data
2. Use data generators to create volume
3. Store in separate test database
4. Never mix with real production data

## Test Data Maintenance Checklist

- [ ] Fixture files are valid JSON
- [ ] All fixture data is test/synthetic data
- [ ] Storage state is up-to-date
- [ ] Environment variables are correct
- [ ] Database seeding works reliably
- [ ] Cleanup removes all test data
- [ ] No hardcoded test data in tests
- [ ] Test data is documented
- [ ] Sensitive data is not committed
- [ ] Performance is acceptable for CI/CD

## Resources

- **Fixture Examples**: `apps/booking-engine/tests/fixtures/`
- **Helper Functions**: `apps/booking-engine/tests/helpers/`
- **Test Examples**: `apps/booking-engine/tests/e2e/*.spec.ts`
- **Playwright Docs**: https://playwright.dev/docs/test-fixtures

---

**Last Updated**: February 5, 2026  
**Status**: Phase 1 - Active Development  
**Maintained By**: Development Team
