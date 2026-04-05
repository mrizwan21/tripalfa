# TripAlfa Integration Testing Guide

## Overview

Integration tests verify that multiple services work together correctly in the local
deployment environment. These tests validate:

- Service-to-service communication
- API endpoints and contracts
- Database operations (both local PostgreSQL and static DB)
- Authentication and authorization flows
- External API integrations (Duffel, LiteAPI, Stripe)
- Cache consistency
- Error handling and resilience

---

## Running Integration Tests

### Prerequisites

Before running integration tests, ensure:

1. ✅ All services are running: `bash scripts/start-local-dev.sh`
2. ✅ Databases are initialized and accessible
3. ✅ Environment variables are properly configured in `.env.local`
4. ✅ External API keys are set (Duffel, LiteAPI, Stripe, etc.)

### Quick Start

```bash
# Run all integration tests
pnpm -r test:integration

# Run tests for specific service
pnpm --dir services/booking-service test:integration

# Run with coverage
pnpm -r test:integration --coverage

# Run specific test file
pnpm --dir services/booking-service test:integration -- search.test.ts

# Watch mode (re-run on file changes)
pnpm --dir services/booking-service test:integration -- --watch
```

---

## Test Categories

### 1. API Gateway Tests

**File:** `services/api-gateway/tests/integration/`

Tests verify the API Gateway correctly:

- Routes requests to appropriate backend services
- Handles authentication (JWT validation)
- Implements rate limiting
- Returns proper error responses
- Manages CORS policies

```bash
pnpm --dir services/api-gateway test:integration
```

### 2. Booking Service Tests

**File:** `services/booking-service/tests/integration/`

Tests verify booking functionality:

- Flight search through Duffel API
- Hotel search through LiteAPI
- Booking creation and management
- Price caching
- Database state management

```bash
pnpm --dir services/booking-service test:integration
```

### 3. User Service Tests

**File:** `services/user-service/tests/integration/`

Tests verify user management:

- User registration and login
- Profile management
- Preference persistence
- Authentication token generation

```bash
pnpm --dir services/user-service test:integration
```

### 4. Payment Service Tests

**File:** `services/payment-service/tests/integration/`

Tests verify payment processing:

- Stripe payment processing
- Payment status tracking
- Refund handling
- Invoice generation

```bash
pnpm --dir services/payment-service test:integration
```

### 5. Frontend Integration Tests

**File:** `apps/booking-engine/tests/integration/`

Tests verify frontend functionality:

- Page navigation and routing
- Form submission workflows
- API request/response handling
- Error boundaries and recovery

```bash
pnpm --dir apps/booking-engine test:integration
```

---

## Running Specific Test Scenarios

### Booking Flow Test

```bash
# Test complete booking flow: search → select → confirm → pay
pnpm --dir services/booking-service test:integration -- booking-flow.test.ts
```

### Authentication Test

```bash
# Test JWT token generation, validation, refresh
pnpm --dir services/user-service test:integration -- auth.test.ts
```

### Cache Invalidation Test

```bash
# Test cache hit/miss and TTL expiration
pnpm --dir services/booking-service test:integration -- cache.test.ts
```

### External API Test

```bash
# Test Duffel, LiteAPI integrations
pnpm --dir services/booking-service test:integration -- external-apis.test.ts
```

---

## Test Structure

### Example Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

describe('Booking Service Integration', () => {
  const API_URL = 'http://localhost:3001';

  beforeAll(async () => {
    // Setup: Create test user, auth tokens, etc.
  });

  afterAll(async () => {
    // Cleanup: Delete test data, close connections
  });

  it('should search for flights', async () => {
    const response = await axios.get(`${API_URL}/flights/search`, {
      params: {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2026-06-01',
      },
    });

    expect(response.status).toBe(200);
    expect(response.data.flights).toBeDefined();
    expect(Array.isArray(response.data.flights)).toBe(true);
  });

  it('should create a flight booking', async () => {
    const bookingData = {
      flightId: 'DUF123456',
      passengers: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
      payment: { method: 'stripe', token: 'tok_test_xyz' },
    };

    const response = await axios.post(`${API_URL}/bookings`, bookingData, {
      headers: { Authorization: 'Bearer ' + testToken },
    });

    expect(response.status).toBe(201);
    expect(response.data.bookingId).toBeDefined();
  });
});
```

---

## Common Integration Test Patterns

### 1. Service-to-Service Communication

```typescript
// Test that API Gateway can reach Booking Service
it('API Gateway routes to Booking Service', async () => {
  const response = await axios.get('http://localhost:3000/api/flights/search');
  expect(response.status).toBe(200);
});
```

### 2. Database Operations

```typescript
// Test that Booking Service persists to database
it('saves booking to cloud database', async () => {
  const booking = await createBooking(testData);
  const retrievedBooking = await queryDatabase(booking.id);
  expect(retrievedBooking.status).toBe('confirmed');
});
```

### 3. External API Integration

```typescript
// Test Duffel flight search integration
it('fetches real flights from Duffel', async () => {
  const flights = await searchFlights({
    origin: 'LHR',
    destination: 'JFK',
  });
  expect(flights.length).toBeGreaterThan(0);
});
```

### 4. Authentication Flow

```typescript
// Test JWT token generation and validation
it('generates and validates JWT token', async () => {
  const token = await generateToken(user);
  const decoded = verifyToken(token);
  expect(decoded.userId).toBe(user.id);
});
```

### 5. Error Handling

```typescript
// Test error boundaries and recovery
it('handles API failure gracefully', async () => {
  // Simulate Duffel API being down
  mockDuffelAPI.mockRejectedValue(new Error('API Error'));

  const result = await searchFlights(testData);
  expect(result.fallbackData).toBeDefined();
});
```

---

## Setting Up Test Data

### Database Seeding

```bash
# Seed static database with test data
pnpm exec prisma db seed

# Or seed specific tables
psql -h localhost -p 5433 -U postgres -d staticdatabase < scripts/seed-test-data.sql
```

### User Accounts

Create test users for different scenarios:

```bash
# Admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123",
    "role": "admin"
  }'

# Regular user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "test123",
    "role": "user"
  }'
```

### API Keys

Use test API keys for external services:

```dotenv
# .env.local
DUFFEL_API_KEY="test_key_xxxxxxxxxx"
DUFFEL_ENV="test"

LITEAPI_API_KEY="test_key_xxxxxxxxxx"

STRIPE_SECRET_KEY="sk_test_xxxxxxxxxx"
```

---

## Continuous Integration (CI) Integration Tests

For local CI testing, use the provided script:

```bash
# Run full integration test suite
bash scripts/test-integration.sh

# Run with specific profile
bash scripts/test-integration.sh --profile=fast
bash scripts/test-integration.sh --profile=comprehensive

# Generate test report
bash scripts/test-integration.sh --report=html
```

---

## Monitoring Test Execution

### View Test Output

```bash
# Stream logs while tests run
tail -f .logs/test-integration.log

# View failed test details
cat .reports/test-failures.json | jq '.'
```

### Test Reports

After tests complete, reports are available at:

- **HTML Report:** `.reports/test-report.html`
- **JSON Report:** `.reports/test-results.json`
- **Coverage Report:** `.reports/coverage/index.html`

Open reports in your browser:

```bash
open .reports/test-report.html
```

---

## Troubleshooting Integration Tests

### Service Not Responding

```bash
# Check if service is running
curl http://localhost:3001/health

# Check service logs
tail -f .logs/booking-service.log

# Restart service
pkill -f "booking-service"
pnpm --dir services/booking-service dev
```

### Database Connection Error

```bash
# Verify local PostgreSQL connection
psql "$DIRECT_DATABASE_URL" -c "SELECT 1;"

# Verify static database
psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT 1;"

# Check environment variables
echo $DIRECT_DATABASE_URL
echo $STATIC_DATABASE_URL
```

### External API Key Error

```bash
# Verify API keys in .env.local
grep -E "^(DUFFEL|LITEAPI|STRIPE|STRIPE_SECRET)" .env.local

# Test API connectivity
curl -H "Authorization: Bearer $DUFFEL_API_KEY" \
  https://api.duffel.com/air/offers
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Change port in .env.local
echo "BOOKING_SERVICE_PORT=3101" >> .env.local
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests' data.

```typescript
beforeEach(async () => {
  // Create fresh test data
  testUser = await createTestUser();
});

afterEach(async () => {
  // Clean up test data
  await deleteTestUser(testUser.id);
});
```

### 2. Realistic Test Data

Use realistic but clearly identifiable test data.

```typescript
const testData = {
  firstName: 'TEST_John',
  email: 'test.' + Date.now() + '@example.com',
  // ...
};
```

### 3. Timeout Configuration

Set appropriate timeouts for different operations.

```typescript
const { get } = axios.create({
  timeout: 30000, // 30 seconds for integration tests
});
```

### 4. Error Context

Include detailed error information in assertions.

```typescript
expect(
  response.status,
  `Expected 200 but got ${response.status}. Response: ${JSON.stringify(response.data)}`
).toBe(200);
```

### 5. Mock External Services

Mock unstable external APIs to prevent test flakiness.

```typescript
vi.mock('duffel-api', () => ({
  searchFlights: vi.fn().mockResolvedValue(mockFlights),
}));
```

---

## Quick Reference

| Command                                                | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| `pnpm -r test:integration`                             | Run all integration tests   |
| `pnpm --dir services/booking-service test:integration` | Run service tests           |
| `bash scripts/health-check.sh`                         | Verify services are running |
| `bash scripts/test-service-connectivity.sh`            | Test service communication  |
| `tail -f .logs/*.log`                                  | View service logs           |
| `open .reports/test-report.html`                       | View test report            |

---

## Next Steps

1. **Run Health Checks:** `bash scripts/health-check.sh`
2. **Start Services:** `bash scripts/start-local-dev.sh`
3. **Run Integration Tests:** `pnpm -r test:integration`
4. **View Test Report:** `open .reports/test-report.html`
5. **Debug Failures:** Check logs and modify tests as needed

---

**Last Updated:** March 5, 2026  
**Testing Framework:** Vitest  
**Service Communication:** localhost:{port}
