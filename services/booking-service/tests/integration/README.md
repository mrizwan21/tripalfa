# Booking Service API Integration Tests

This directory contains the API integration test suite for the booking-service microservice.

## Overview

The booking-service API integration tests verify the functionality of the booking REST API endpoints using real HTTP requests against a running service instance with an actual database.

## Key Features

- **Real Authentication**: Uses actual JWT tokens from user-service or generates valid tokens locally
- **Test Data Seeding**: Pre-seeded test users with known credentials
- **Proper Cleanup**: Comprehensive data cleanup to prevent test data leakage
- **Multi-Role Testing**: Supports testing with different user roles (admin, agent, customer, supervisor, manager)

## Test User Credentials

The following test users are seeded in the database for integration tests:

| Role | Email | Password |
|------|-------|----------|
| Admin | test.admin@tripalfa.com | TestAdmin@123 |
| Agent | test.agent@tripalfa.com | TestAgent@123 |
| Customer | test.customer@tripalfa.com | TestCustomer@123 |
| Supervisor | test.supervisor@tripalfa.com | TestSupervisor@123 |
| Manager | test.manager@tripalfa.com | TestManager@123 |

## Quick Start

### 1. Install Dependencies

```bash
cd services/booking-service
npm install
```

### 2. Set Up Environment Variables

Create a `.env.test` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/booking_service_test"

# JWT Secret (must match the one used by user-service)
JWT_SECRET="your-jwt-secret-key"

# User Service (optional - for real authentication)
USER_SERVICE_URL="http://localhost:3002"

# Test Configuration
INTEGRATION_DB=true
TEST_DB_RESET=true
```

### 3. Seed Test Data

```bash
# Seed test users and data
npm run test:seed

# Or reset and re-seed
npm run test:seed:reset
```

### 4. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run API integration tests only
npm run test:integration:api

# Run with watch mode
npm run test:watch:integration

# Run with coverage
npm run test:coverage
```

## Test Structure

```
tests/integration/
├── setup.ts              # Test environment setup, auth, and cleanup
├── seed.ts               # Database seeding script
├── global-setup.ts       # Jest global setup
├── global-teardown.ts    # Jest global teardown
├── booking-api.test.ts   # Booking API tests
├── auth-api.test.ts      # Authentication API tests
├── payment-api.test.ts   # Payment API tests
├── wallet-api.test.ts    # Wallet API tests
└── inventory-api.test.ts # Inventory API tests
```

## Writing Integration Tests

### Basic Test Structure

```typescript
import { api, setupTestEnvironment, teardownTestEnvironment, getAuthHeader, createTestBooking, testDataTracker } from './setup';

describe('Booking API', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('should create a booking', async () => {
    const bookingData = {
      type: 'flight',
      origin: 'JFK',
      destination: 'LHR',
      // ... other fields
    };

    const response = await api
      .post('/api/bookings')
      .set(getAuthHeader('admin'))
      .send(bookingData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    // The booking is automatically tracked for cleanup
  });
});
```

### Using Test Data Helpers

```typescript
import { createTestBooking, createTestCustomer, cleanupTestBooking, testDataTracker } from './setup';

// Create a test customer
const customer = await createTestCustomer({
  name: 'John Doe',
  email: 'john@example.com'
});

// Create a test booking (automatically tracked)
const booking = await createTestBooking({
  type: 'flight',
  customerId: customer.id
}, 'admin');

// Manual cleanup if needed
await cleanupTestBooking(booking.id);
```

### Testing Different Roles

```typescript
import { getAuthHeader } from './setup';

// Test as admin
const adminResponse = await api
  .get('/api/admin/bookings')
  .set(getAuthHeader('admin'));

// Test as agent
const agentResponse = await api
  .get('/api/bookings')
  .set(getAuthHeader('agent'));

// Test as customer
const customerResponse = await api
  .get('/api/my-bookings')
  .set(getAuthHeader('customer'));
```

## Data Cleanup

The test suite includes comprehensive cleanup mechanisms:

### Automatic Cleanup

- All created bookings are tracked in `testDataTracker`
- Related records (documents, notes, audit logs, etc.) are cleaned up
- Cleanup runs after each test suite (global teardown)

### Manual Cleanup

```typescript
import { cleanupTestBooking, cleanupTestCustomer, cleanupAllTestData } from './setup';

// Cleanup specific booking
await cleanupTestBooking(bookingId);

// Cleanup customer and their bookings
await cleanupTestCustomer(customerId);

// Cleanup all tracked test data
await cleanupAllTestData();
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT token validation | Required |
| `USER_SERVICE_URL` | URL for user-service authentication | http://localhost:3002 |
| `TEST_BASE_URL` | Base URL for booking-service | http://localhost:3001 |
| `INTEGRATION_DB` | Enable integration test mode | false |
| `TEST_DB_RESET` | Reset database before tests | false |

### Test Configuration

Modify `setup.ts` to change test behavior:

```typescript
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  testUsers: {
    // Add or modify test users
  }
};
```

## Troubleshooting

### Authentication Failures

If tests fail with 401 Unauthorized:

1. Verify JWT_SECRET matches between services
2. Run `npm run test:seed` to ensure test users exist
3. Check user-service is running (if using real auth)

### Database Connection Issues

If tests fail with database errors:

1. Verify DATABASE_URL is correct
2. Ensure PostgreSQL is running
3. Check database exists and is accessible

### Data Leakage Between Tests

If you see test data from previous runs:

1. Run `npm run test:seed:reset` to clear test data
2. Check that `TEST_DB_RESET=true` is set
3. Verify cleanup functions are being called

## Best Practices

1. **Always use test helpers**: Use `createTestBooking()`, `createTestCustomer()` instead of direct API calls
2. **Track manual creations**: If you create data manually, track it: `testDataTracker.track('bookings', id)`
3. **Use appropriate roles**: Test with the minimum required role for each endpoint
4. **Clean up in afterAll**: Always call `teardownTestEnvironment()` in afterAll
5. **Don't hardcode IDs**: Use the test data factories to generate unique IDs

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Booking Service Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: booking_service_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:seed
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/booking_service_test
          JWT_SECRET: test-secret
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/booking_service_test
          JWT_SECRET: test-secret
          INTEGRATION_DB: true
          TEST_DB_RESET: true
```

## API Endpoints Tested

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/hold` - Hold inventory
- `POST /api/bookings/:id/confirm` - Confirm booking

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details

### Inventory
- `POST /api/inventory` - Create inventory
- `GET /api/inventory` - List inventory
- `PUT /api/inventory/:id` - Update inventory

## Contributing

When adding new integration tests:

1. Use the existing test utilities from `setup.ts`
2. Follow the naming convention: `*.test.ts`
3. Add tests to the appropriate file or create a new one
4. Update this README with new endpoints or features
5. Ensure proper cleanup is implemented
