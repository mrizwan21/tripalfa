# API Integration Test Setup

This module provides comprehensive utilities for API integration testing in the Booking Engine E2E test suite.

## Overview

The API Integration Test module enables:
- **API Request/Response Interception** - Monitor and validate API calls
- **Authentication Management** - Handle tokens, sessions, and user authentication
- **Test Data Management** - Create and cleanup test data via API calls
- **API Mocking** - Mock external API responses for isolated testing
- **Response Validation** - Validate API response structures

## Quick Start

```typescript
import { test, expect } from '@playwright/test';
import { 
  ApiAuthManager, 
  ApiTestDataManager,
  ApiRequestInterceptor,
  flightMocks 
} from './api-integration';

test.describe('API Integration Tests', () => {
  let authManager: ApiAuthManager;
  let dataManager: ApiTestDataManager;
  let interceptor: ApiRequestInterceptor;

  test.beforeEach(async () => {
    authManager = new ApiAuthManager();
    dataManager = new ApiTestDataManager(authManager);
    interceptor = new ApiRequestInterceptor();
  });

  test('should search flights via API', async ({ page }) => {
    // Start intercepting requests
    await interceptor.start(page);
    
    // Authenticate
    await authManager.authenticate('test@example.com', 'password');
    
    // Mock flight search response
    await page.route('**/api/flights/search', async (route) => {
      await route.fulfill(flightMocks.searchSuccess(3));
    });
    
    // Perform search
    await page.goto('/flights');
    await page.fill('[data-testid="origin"]', 'JFK');
    await page.fill('[data-testid="destination"]', 'LAX');
    await page.click('[data-testid="search-button"]');
    
    // Verify API call was made
    const request = interceptor.findRequest('flights/search');
    expect(request).toBeDefined();
    expect(request?.method()).toBe('POST');
  });
});
```

## Module Structure

```
api-integration/
├── index.ts                    # Main exports
├── api-test-helpers.ts         # Core API testing utilities
├── api-auth.ts                 # Authentication management
├── api-test-data.ts            # Test data management
├── fixtures/
│   └── api-mocks.ts           # Predefined API mock responses
└── README.md                  # This file
```

## Core Components

### 1. API Test Helpers (`api-test-helpers.ts`)

#### ApiMockBuilder
Build mock API responses with a fluent interface:

```typescript
import { ApiMockBuilder } from './api-integration';

const mockResponse = new ApiMockBuilder()
  .withData({ offers: [] })
  .withStatus(200)
  .withDelay(100)
  .withHeaders({ 'X-Custom-Header': 'value' })
  .build();
```

#### ApiRequestInterceptor
Intercept and monitor API requests:

```typescript
import { ApiRequestInterceptor } from './api-integration';

const interceptor = new ApiRequestInterceptor();
await interceptor.start(page);

// Later in test
const request = interceptor.findRequest('flights/search');
const response = interceptor.findResponse('flights/search');
```

#### ApiResponseValidator
Validate API response structures:

```typescript
import { ApiResponseValidator } from './api-integration';

const response = await fetch('/api/bookings/123');
const data = await response.json();

const validation = ApiResponseValidator.validateBookingResponse(data);
expect(validation.valid).toBe(true);
```

### 2. API Authentication (`api-auth.ts`)

#### ApiAuthManager
Manage authentication tokens and sessions:

```typescript
import { ApiAuthManager } from './api-integration';

const authManager = new ApiAuthManager('http://localhost:3003');

// Authenticate
const tokens = await authManager.authenticate('user@example.com', 'password');

// Get auth headers for API calls
const headers = await authManager.getAuthHeaders();

// Check if token needs refresh
if (authManager.needsRefresh()) {
  await authManager.refreshToken();
}

// Logout
await authManager.logout();
```

#### PageAuthHelper
Handle authentication within Playwright pages:

```typescript
import { PageAuthHelper } from './api-integration';

const authHelper = new PageAuthHelper(page);

// Login via UI
await authHelper.loginViaUI('user@example.com', 'password');

// Set token directly
await authHelper.setAuthToken('my-token');

// Check authentication status
const isAuth = await authHelper.isAuthenticated();
```

### 3. API Test Data Management (`api-test-data.ts`)

#### ApiTestDataManager
Create and manage test data via API:

```typescript
import { ApiTestDataManager } from './api-integration';

const dataManager = new ApiTestDataManager(authManager);

// Create test user
const user = await dataManager.createTestUser({
  email: 'test@example.com',
  role: 'CUSTOMER'
});

// Create test booking
const booking = await dataManager.createTestBooking('default', {
  type: 'FLIGHT',
  status: 'CONFIRMED'
});

// Seed multiple bookings
const bookings = await dataManager.seedTestBookings('default', 5);

// Cleanup all test data
await dataManager.cleanupAll();
```

#### ApiTestDataFactory
Generate test data:

```typescript
import { ApiTestDataFactory } from './api-integration';

const card = ApiTestDataFactory.generateTestCard('success');
const address = ApiTestDataFactory.generateTestAddress();
const flightOffer = ApiTestDataFactory.generateTestFlightOffer();
```

### 4. API Mock Fixtures (`fixtures/api-mocks.ts`)

Predefined mock responses for common scenarios:

```typescript
import { 
  authMocks, 
  flightMocks, 
  hotelMocks, 
  walletMocks,
  paymentMocks,
  bookingMocks,
  healthMocks,
  networkErrorMocks 
} from './api-integration';

// Use in tests
await page.route('**/api/auth/login', async (route) => {
  await route.fulfill(authMocks.loginSuccess());
});

await page.route('**/api/flights/search', async (route) => {
  await route.fulfill(flightMocks.searchSuccess(5));
});

await page.route('**/api/wallet/balance', async (route) => {
  await route.fulfill(walletMocks.balanceSuccess(1000));
});
```

## API Endpoints Configuration

All API endpoints are centralized in `API_ENDPOINTS`:

```typescript
import { API_ENDPOINTS } from './api-integration';

// Access endpoints
API_ENDPOINTS.auth.login           // '/api/auth/login'
API_ENDPOINTS.bookings.create      // '/api/bookings'
API_ENDPOINTS.flights.search       // '/api/flights/search'
API_ENDPOINTS.hotels.search        // '/api/hotels/search'
API_ENDPOINTS.wallet.balance       // '/api/wallet/balance'
API_ENDPOINTS.payments.intent      // '/api/payments/intent'
```

## Environment Configuration

Configure via environment variables:

```bash
# API URLs
API_URL=http://localhost:3003
BOOKING_SERVICE_URL=http://localhost:3003

# Test User Credentials
TEST_USER_EMAIL=test.user@tripalfa.com
TEST_USER_PASSWORD=Test@1234
TEST_PREMIUM_EMAIL=premium.user@tripalfa.com
TEST_ADMIN_EMAIL=admin.user@tripalfa.com

# External Service Keys (for sandbox testing)
STRIPE_TEST_KEY=sk_test_...
DUFFEL_SANDBOX_KEY=duffel_test_...
```

## Best Practices

### 1. Test Isolation
Always cleanup test data after tests:

```typescript
test.afterEach(async () => {
  await dataManager.cleanupAll();
});
```

### 2. Mock External APIs
Mock external service calls to ensure test reliability:

```typescript
await page.route('**/api/external/**', async (route) => {
  await route.fulfill(externalServiceMocks.success());
});
```

### 3. Validate Responses
Always validate API response structures:

```typescript
const validation = ApiResponseValidator.validateBookingResponse(data);
expect(validation.valid).toBe(true);
expect(validation.errors).toHaveLength(0);
```

### 4. Use Retry Logic
For flaky API calls, use retry logic:

```typescript
const result = await retryApiCall(async () => {
  return await fetchApiData();
}, { maxRetries: 3 });
```

### 5. Monitor API Calls
Use the interceptor to verify API behavior:

```typescript
await interceptor.start(page);
// ... perform actions
const requests = interceptor.getRequests();
expect(requests).toHaveLength(expectedCount);
```

## Example Test Scenarios

### Flight Booking Flow

```typescript
test('complete flight booking flow', async ({ page }) => {
  const authManager = new ApiAuthManager();
  const dataManager = new ApiTestDataManager(authManager);
  
  // Setup
  await authManager.authenticate('test@example.com', 'password');
  await dataManager.createTestWallet('default', 2000);
  
  // Mock flight search
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill(flightMocks.searchSuccess(3));
  });
  
  // Execute booking flow
  await page.goto('/flights');
  await page.fill('[data-testid="origin"]', 'JFK');
  await page.fill('[data-testid="destination"]', 'LAX');
  await page.click('[data-testid="search-button"]');
  
  // Select flight
  await page.click('[data-testid="flight-offer-0"]');
  
  // Fill passenger details
  await page.fill('[data-testid="passenger-firstName"]', 'John');
  await page.fill('[data-testid="passenger-lastName"]', 'Doe');
  
  // Complete booking
  await page.click('[data-testid="complete-booking"]');
  
  // Verify success
  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
  
  // Cleanup
  await dataManager.cleanupAll();
});
```

### Error Handling Test

```typescript
test('handles payment failure gracefully', async ({ page }) => {
  // Mock payment failure
  await page.route('**/api/payments/confirm', async (route) => {
    await route.fulfill(paymentMocks.paymentDeclined());
  });
  
  // Execute payment
  await page.goto('/checkout');
  await page.click('[data-testid="pay-button"]');
  
  // Verify error message
  await expect(page.locator('[data-testid="payment-error"]')).toContainText('declined');
});
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check that test user credentials are correct
   - Verify API_URL environment variable is set
   - Ensure auth service is running

2. **Mock Not Working**
   - Verify URL pattern matches the actual request URL
   - Check that route is set up before navigation
   - Use `page.route()` before any actions that trigger requests

3. **Test Data Cleanup Failures**
   - Ensure admin credentials are configured for cleanup
   - Check that records were actually created (trackRecord called)
   - Verify cleanup API endpoints are accessible

### Debug Mode

Enable detailed logging:

```typescript
const interceptor = new ApiRequestInterceptor();
await interceptor.start(page);

// After test
interceptor.getRequests().forEach(req => {
  console.log(`${req.method()} ${req.url()}`);
});
```

## Contributing

When adding new features:
1. Add types to the appropriate interfaces
2. Export from `index.ts`
3. Add mocks to `fixtures/api-mocks.ts` if applicable
4. Update this README with examples
5. Add unit tests for new utilities

## Related Documentation

- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [Playwright Route Handling](https://playwright.dev/docs/network#handle-requests)
- [E2E Testing Guide](../README.md)
