# Test Data Management Guide

## Overview

This guide documents the test data fixtures, seeding process, and cleanup procedures for the E2E and API integration tests.

## Table of Contents

1. [Test Data Fixtures](#test-data-fixtures)
2. [Fixture Structure](#fixture-structure)
3. [Test Data Factory](#test-data-factory)
4. [Database Seeding](#database-seeding)
5. [Data Cleanup](#data-cleanup)
6. [Best Practices](#best-practices)

---

## Test Data Fixtures

### Location

Test fixtures are stored in:
- **E2E Tests**: `apps/booking-engine/tests/fixtures/`
- **API Tests**: `services/booking-service/tests/fixtures/` (if needed)

### Available Fixtures

| Fixture File | Description | Usage |
|--------------|-------------|-------|
| `users.json` | Test user accounts | Authentication tests |
| `flights.json` | Flight search parameters | Flight booking tests |
| `hotels.json` | Hotel search parameters | Hotel booking tests |
| `payments.json` | Payment card details | Payment tests |
| `wallets.json` | Wallet test data | Wallet operation tests |
| `storageState.json` | Authentication state | Session persistence |

---

## Fixture Structure

### Users Fixture (`users.json`)

```json
[
  {
    "email": "testuser1@example.com",
    "password": "Test@123",
    "role": "user"
  },
  {
    "email": "guestuser@example.com",
    "password": "Guest@123",
    "role": "guest"
  },
  {
    "email": "lowbalance@example.com",
    "password": "Low@123",
    "role": "user",
    "walletBalance": 10
  }
]
```

**Fields**:
- `email`: User's email address
- `password`: User's password
- `role`: User role (user, admin, guest, agent)
- `walletBalance`: Initial wallet balance (optional)

### Flights Fixture (`flights.json`)

```json
[
  {
    "from": "JFK",
    "to": "LHR",
    "adults": 1,
    "class": "Economy",
    "departureDate": "2025-02-15",
    "returnDate": "2025-02-22",
    "expected": "success"
  }
]
```

**Fields**:
- `from`: Origin airport code (IATA)
- `to`: Destination airport code (IATA)
- `adults`: Number of adult passengers
- `class`: Travel class (Economy, Business, First)
- `departureDate`: Departure date (YYYY-MM-DD)
- `returnDate`: Return date for round-trip (YYYY-MM-DD)
- `expected`: Expected test outcome

### Hotels Fixture (`hotels.json`)

```json
[
  {
    "city": "Paris",
    "checkInDate": "2025-02-15",
    "checkOutDate": "2025-02-18",
    "adults": 2,
    "rooms": 1,
    "expected": "success"
  }
]
```

**Fields**:
- `city`: Destination city
- `checkInDate`: Check-in date (YYYY-MM-DD)
- `checkOutDate`: Check-out date (YYYY-MM-DD)
- `adults`: Number of guests
- `rooms`: Number of rooms
- `expected`: Expected test outcome

### Payments Fixture (`payments.json`)

```json
[
  {
    "cardNumber": "4242424242424242",
    "exp": "12/30",
    "cvc": "123",
    "cardholderName": "Test User",
    "type": "stripe-test"
  },
  {
    "cardNumber": "4000000000000002",
    "exp": "12/30",
    "cvc": "123",
    "cardholderName": "Test User",
    "type": "stripe-decline"
  }
]
```

**Fields**:
- `cardNumber`: Credit card number
- `exp`: Expiration date (MM/YY)
- `cvc`: Security code
- `cardholderName`: Name on card
- `type`: Card type for test scenarios

**Stripe Test Cards**:
| Card Number | Type | Behavior |
|-------------|------|----------|
| 4242424242424242 | Visa | Success |
| 4000000000000002 | Visa | Declined |
| 4000000000009995 | Visa | Insufficient funds |
| 4000002500003155 | Visa | 3D Secure required |

---

## Test Data Factory

### Location

`apps/booking-engine/tests/helpers/test-data-factory.ts`

### Usage

The Test Data Factory generates dynamic test data using realistic patterns:

```typescript
import { TestDataFactory } from '../helpers/test-data-factory';

// Generate a test user
const user = TestDataFactory.generateUser();

// Generate a flight booking
const booking = TestDataFactory.generateFlightBooking();

// Generate passenger details
const passenger = TestDataFactory.generatePassenger();

// Generate payment card
const card = TestDataFactory.generatePaymentCard('valid');
```

### Available Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateUser()` | Generate test user | User object |
| `generateFlightBooking()` | Generate flight booking | Booking object |
| `generateFlightSearch()` | Generate search params | Search params |
| `generateHotelSearch()` | Generate hotel search | Search params |
| `generatePassenger()` | Generate passenger details | Passenger object |
| `generateBillingAddress()` | Generate billing address | Address object |
| `generatePaymentCard()` | Generate payment card | Card object |
| `generateWalletTransaction()` | Generate transaction | Transaction object |
| `generateBookingScenario()` | Generate complete scenario | Scenario object |
| `generateUsers(count)` | Generate multiple users | User array |
| `generateBookingReference()` | Generate unique reference | String |

### Data Generators

The factory includes built-in data generators:

```typescript
// Generate realistic data
DataGenerator.firstName();      // "John", "Jane", etc.
DataGenerator.lastName();       // "Smith", "Johnson", etc.
DataGenerator.email();          // "test.user.1234567890.1234@tripalfa.com"
DataGenerator.phone();          // "+15551234567"
DataGenerator.passportNumber(); // "AB1234567"
DataGenerator.airportCode();    // "JFK", "LHR", etc.
DataGenerator.futureDate(30);   // "2025-03-15"
DataGenerator.bookingReference(); // "TL-123456"
DataGenerator.amount(100, 1000);  // 543.21
```

---

## Database Seeding

### E2E Test Seeding

E2E tests use mock data via `page.addInitScript()`:

```typescript
test.beforeEach(async ({ page }) => {
  // Enable test mode with mock data
  await page.addInitScript(() => {
    (globalThis as any).TEST_MODE_FLIGHTS = true;
    (globalThis as any).TEST_MODE_HOTELS = true;
  });
});
```

### API Test Seeding

API tests use the setup file for database seeding:

```typescript
// tests/integration/setup.ts
export async function setupTestEnvironment(): Promise<void> {
  // Generate test tokens
  authTokens.user = generateTestToken(TEST_CONFIG.testUser);
  authTokens.admin = generateTestToken(TEST_CONFIG.adminUser);

  // Verify API is running
  const response = await api.get('/health');
  if (response.status !== 200) {
    throw new Error('API health check failed');
  }
}
```

### Seeding Utilities

Create test data programmatically:

```typescript
// Helper to create a test booking
export async function createTestBooking(bookingData: any): Promise<any> {
  const response = await api
    .post('/api/bookings')
    .set(getAuthHeader())
    .send(bookingData);

  return response.body;
}

// Helper to cleanup test bookings
export async function cleanupTestBooking(bookingId: string): Promise<void> {
  await api
    .delete(`/api/bookings/${bookingId}`)
    .set(getAuthHeader());
}
```

---

## Data Cleanup

### Automatic Cleanup

Tests automatically cleanup data in `afterAll` and `afterEach` hooks:

```typescript
describe('Booking API Tests', () => {
  let testBookingId: string;

  afterAll(async () => {
    // Cleanup test data
    if (testBookingId) {
      await cleanupTestBooking(testBookingId);
    }
    await teardownTestEnvironment();
  });
});
```

### Manual Cleanup

For manual cleanup, use the provided helpers:

```bash
# Reset test database
cd services/booking-service
npm run test:integration -- --reset

# Cleanup specific test data
node scripts/cleanup-test-data.js
```

### Cleanup Best Practices

1. **Always cleanup in `afterAll`**:
   ```typescript
   afterAll(async () => {
     await cleanupTestData();
   });
   ```

2. **Use unique identifiers**:
   ```typescript
   const testId = `test-${Date.now()}-${Math.random()}`;
   ```

3. **Handle cleanup errors gracefully**:
   ```typescript
   try {
     await cleanupTestBooking(bookingId);
   } catch (error) {
     console.log('Cleanup failed, may already be deleted');
   }
   ```

---

## Best Practices

### 1. Use Test Data Factory

Always use the Test Data Factory for dynamic data:

```typescript
// ✅ Good
const user = TestDataFactory.generateUser();
const passenger = TestDataFactory.generatePassenger();

// ❌ Bad
const user = {
  email: 'test@example.com',
  password: 'password123'
};
```

### 2. Avoid Hardcoded Data

Use fixtures or factory methods:

```typescript
// ✅ Good
const flights = require('../fixtures/flights.json');
await flightHome.searchFlight(
  flights[0].from,
  flights[0].to,
  flights[0].adults,
  flights[0].class
);

// ❌ Bad
await flightHome.searchFlight('JFK', 'LHR', 1, 'economy');
```

### 3. Use Realistic Test Data

Generate data that matches production patterns:

```typescript
// ✅ Good
const passenger = {
  firstName: DataGenerator.firstName(),
  lastName: DataGenerator.lastName(),
  email: DataGenerator.email(),
  phone: DataGenerator.phone(),
  passportNumber: DataGenerator.passportNumber()
};

// ❌ Bad
const passenger = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  phone: '1234567890'
};
```

### 4. Isolate Test Data

Each test should use unique data:

```typescript
// ✅ Good
const testUser = TestDataFactory.generateUser({
  email: `test.${Date.now()}@example.com`
});

// ❌ Bad
const testUser = users[0]; // Shared across tests
```

### 5. Document Test Data Dependencies

```typescript
/**
 * Test: FB-001 - Complete flight booking
 * Data Dependencies:
 * - users.json[0]: Test user account
 * - flights.json[0]: Flight search parameters
 * - payments.json[0]: Valid payment card
 */
test('FB-001: Complete flight booking', async ({ page }) => {
  // Test implementation
});
```

### 6. Validate Test Data

Always validate data before using:

```typescript
// ✅ Good
const user = TestDataFactory.generateUser();
expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
expect(user.password.length).toBeGreaterThan(8);

// ❌ Bad
const user = TestDataFactory.generateUser();
// No validation
```

---

## Test Data Reference

### Airport Codes

Common airport codes used in tests:

| Code | Airport | City |
|------|---------|------|
| JFK | John F. Kennedy | New York |
| LHR | Heathrow | London |
| CDG | Charles de Gaulle | Paris |
| DXB | Dubai International | Dubai |
| LAX | Los Angeles International | Los Angeles |
| SFO | San Francisco International | San Francisco |
| ORD | O'Hare International | Chicago |
| FRA | Frankfurt Airport | Frankfurt |
| AMS | Amsterdam Schiphol | Amsterdam |
| SIN | Changi Airport | Singapore |

### Currency Codes

Supported currencies:

| Code | Currency |
|------|----------|
| USD | US Dollar |
| EUR | Euro |
| GBP | British Pound |
| AED | UAE Dirham |
| CAD | Canadian Dollar |
| AUD | Australian Dollar |

### User Roles

| Role | Permissions |
|------|-------------|
| user | Basic booking operations |
| admin | Full system access |
| guest | Limited read-only access |
| agent | Booking management |
| supervisor | Team management |
| manager | Department management |

---

## Maintenance

### Updating Fixtures

1. Edit the fixture file
2. Run tests to verify
3. Update documentation
4. Commit changes

### Adding New Fixtures

1. Create new fixture file in `tests/fixtures/`
2. Add TypeScript types if needed
3. Update Test Data Factory
4. Document in this guide

### Fixture Validation

```bash
# Validate JSON syntax
npx jsonlint apps/booking-engine/tests/fixtures/users.json

# Validate all fixtures
for file in apps/booking-engine/tests/fixtures/*.json; do
  npx jsonlint "$file"
done
```

---

**Last Updated**: 2026-02-05
**Maintained By**: Development Team
