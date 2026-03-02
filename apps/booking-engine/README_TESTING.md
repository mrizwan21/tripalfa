# Booking Engine Testing with Backend Services

## Overview

This guide explains how to run booking engine tests with the actual backend services instead of mock servers.

## Prerequisites

Before running tests, ensure you have:

1. **Backend Services Running**: The booking engine service must be running on port 3003
2. **Database Setup**: Test database must be configured and seeded
3. **Environment Variables**: Proper API keys and configuration set

## Quick Start

### 1. Start Backend Services

```bash
# Navigate to the booking engine service directory
cd services/booking-service

# Start the backend service in test mode
npm run dev:test
```

### 2. Start Frontend in Test Mode

```bash
# Navigate to the booking engine directory
cd apps/booking-engine

# Start the frontend in test mode
npm run dev:test
```

### 3. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test files
npm run test:e2e -- tests/e2e/flight-booking.spec.ts

# Run tests with UI mode for debugging
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug
```

## Test Configuration

### Environment Variables

The `.env.test` file contains configuration for testing with real backend services:

```bash
# Test Mode Flag - Set to false for REAL API testing
VITE_TEST_MODE=false

# Application URLs
BASE_URL=http://localhost:5174
VITE_API_BASE_URL=http://localhost:3003
API_URL=http://localhost:3003

# Real Duffel Sandbox API (via backend proxy)
DUFFEL_API_URL=https://api.duffel.com
DUFFEL_ENV=test

# Test User Credentials
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123

# Enhanced Test Configuration - REAL API MODE
TEST_MODE_FLIGHTS=false
TEST_MODE_HOTELS=true
TEST_TIMEOUT=120000
TEST_RETRY_COUNT=2
```

### Backend Service Configuration

Ensure the backend service is configured with:

- **Port**: 3003
- **Database URL**: `postgresql://postgres:password@localhost:5432/tripalfa_test`
- **Node Environment**: `test`
- **API Keys**: Duffel API key and other external service credentials

## Test Execution

### Using Playwright Test Runner

The tests use Playwright for E2E testing and automatically:

1. **Start Backend Services**: Via global setup in `tests/helpers/global.setup.ts`
2. **Wait for Services**: Ensures backend is ready before running tests
3. **Setup Database**: Runs migrations and seeds test data
4. **Run Tests**: Executes all E2E tests against real backend services
5. **Cleanup**: Stops services and cleans up after tests

### Manual Test Execution

If you prefer to run services manually:

```bash
# Terminal 1: Start backend service
cd services/booking-service
npm run dev:test

# Terminal 2: Start frontend
cd apps/booking-engine
npm run dev:test

# Terminal 3: Run tests
cd apps/booking-engine
npm run test:e2e
```

## Available Test Commands

### E2E Tests

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:modules` - Run module-specific tests
- `npm run test:e2e:errors` - Run error handling tests
- `npm run test:e2e:ui` - Run tests with UI mode
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:headed` - Run tests in headed mode
- `npm run test:e2e:smoke` - Run smoke tests only
- `npm run test:e2e:ci` - Run tests optimized for CI

### Unit Tests

- `npm run test` - Run unit tests with Vitest
- `npm run test -- --coverage` - Run tests with coverage
- `npm run test -- --watch` - Run tests in watch mode

## Troubleshooting

### Backend Service Not Starting

1. **Check Port Conflicts**:

   ```bash
   lsof -ti:3003 | xargs kill -9
   ```

2. **Verify Database Connection**:

   ```bash
   # Check if test database exists
   psql -h localhost -U postgres -d tripalfa_test -c "SELECT version();"
   ```

3. **Check Environment Variables**:
   Ensure all required environment variables are set in the backend service

### Tests Failing

1. **Check Backend Health**:

   ```bash
   curl http://localhost:3003/health
   ```

2. **Check Frontend Health**:

   ```bash
   curl http://localhost:5174
   ```

3. **Verify Test Data**:
   Ensure test database is properly seeded with required test data

4. **Check API Keys**:
   Verify that external service API keys (Duffel, etc.) are properly configured

### Database Issues

1. **Reset Test Database**:

   ```bash
   cd services/booking-service
   npm run db:reset:test
   ```

2. **Run Migrations**:

   ```bash
   npm run db:migrate
   ```

3. **Seed Test Data**:

   ```bash
   npm run db:seed:test
   ```

## Test Data

### Test Users

- Email: `testuser1@example.com`
- Password: `Test@123`

### Test Options

- Timeout: 120 seconds for complex operations
- Retry count: 2 for flaky tests
- Test mode: Disabled (uses real APIs)

## External Services

The tests use real external services:

- **Duffel API**: For flight bookings (sandbox environment)
- **Hotel APIs**: For hotel searches and bookings
- **Payment Gateways**: For payment processing
- **Notification Services**: For email/SMS notifications

Ensure these services are accessible and have proper API keys configured in the backend service.

## CI/CD Integration

For CI/CD pipelines:

```bash
# Set environment variables
export NODE_ENV=test
export VITE_TEST_MODE=false
export DATABASE_URL=postgresql://postgres:password@localhost:5432/tripalfa_test

# Start backend service
npm run dev:test &

# Wait for service to be ready
sleep 10

# Run tests
npm run test:e2e:ci

# Stop service
pkill -f "npm run dev:test"
```

## Support

For issues with testing:

1. Check that backend services are running
2. Verify database connectivity and test data
3. Ensure external service API keys are configured
4. Check service logs for errors
5. Run tests in debug mode for detailed error information
