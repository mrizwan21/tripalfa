# Test Server Bootstrap Implementation

## Overview

This document describes the server bootstrap mechanism implemented to resolve integration test connection failures.

**Problem Solved**: Notification API integration tests assume a live service on `localhost:3001` without bootstrapping a test server, causing connection failures.

**Solution**: Automatic HTTP server bootstrap with ephemeral port assignment, global URL registration, and proper cleanup.

---

## Architecture

### Components

1. **test-server.ts** - HTTP Server Bootstrap Utility
   - Manages test server lifecycle (start/stop)
   - Assigns ephemeral port (avoids conflicts)
   - Exposes URL to test files via global namespace
   - Handles connection cleanup and timeouts

2. **global-setup.ts** - Jest Global Setup Hook
   - Runs once before all test suites
   - Starts test HTTP server with Express app
   - Stores URL in `globalThis.TEST_API_URL`
   - Sets environment variable `BOOKING_SERVICE_API`
   - Seeds test data and authenticates users

3. **global-teardown.ts** - Jest Global Teardown Hook
   - Runs once after all test suites
   - Stops test HTTP server gracefully
   - Closes all active connections
   - Cleans up test data and resources
   - Clears global test URL

4. **Notification Test Files** - Updated API Base URL
   - `notificationAPI.integration.test.ts`
   - `notificationService.integration.test.ts`
   - `notificationRetryMechanism.test.ts`
   - `notificationAnalytics.test.ts`
   - All now use `getTestApiUrl()` helper function
   - Fallback chain: globalThis → env var → throw error

---

## How It Works

### Startup Flow

```
Jest Starts
    ↓
Read jest.config.ts globalSetup setting
    ↓
Run global-setup.ts
    ├─ Call testServer.start(0)
    │  └─ Express app listens on auto-assigned port
    ├─ Get assigned port (e.g., 53847)
    ├─ Set globalThis.TEST_API_URL = "http://localhost:53847/api"
    ├─ Set process.env.BOOKING_SERVICE_API = URL
    ├─ Setup test environment & seed data
    └─ All tests now ready
    ↓
Test Suites Run
    ├─ Tests import API_BASE_URL via getTestApiUrl()
    ├─ getTestApiUrl() checks globalThis.TEST_API_URL
    ├─ axios.post(`${API_BASE_URL}/notifications`, ...)
    └─ Requests routed to running test server
    ↓
All Tests Complete
    ↓
Run global-teardown.ts
    ├─ Call teardownTestEnvironment()
    ├─ Call testServer.stop()
    │  ├─ Gracefully close server
    │  ├─ Destroy active connections
    │  └─ Force close after timeout
    ├─ Clear globalThis.TEST_API_URL
    └─ Exit
```

### Test Data Isolation

Each test run:
1. Uses database with `TEST_DB_RESET=true` flag (fresh schema)
2. Seeds test data via `setupTestEnvironment()`
3. Tracks created resources in `testDataTracker`
4. Cleans up all data in `teardownTestEnvironment()`
5. No cross-test contamination

---

## Configuration

### Jest Configuration (jest.config.ts)

```typescript
export default {
  // ... other config ...
  globalSetup: process.env.INTEGRATION_DB === 'true' 
    ? '<rootDir>/tests/integration/global-setup.ts' 
    : undefined,
  globalTeardown: process.env.INTEGRATION_DB === 'true' 
    ? '<rootDir>/tests/integration/global-teardown.ts' 
    : undefined,
  testTimeout: process.env.INTEGRATION_DB === 'true' 
    ? 60000 
    : 10000
};
```

### Running Tests

```bash
# Start test server automatically, run tests, cleanup
npm run test:integration

# With custom database reset
INTEGRATION_DB=true TEST_DB_RESET=true npm run test:integration

# Watch mode (server starts once, tests re-run)
npm run test:watch:integration
```

---

## API Usage

### In Test Files

```typescript
/**
 * Get test API URL from global setup
 */
function getTestApiUrl(): string {
  // Check global test URL (set by global-setup.ts)
  if (typeof globalThis !== 'undefined' && (globalThis as any).TEST_API_URL) {
    return (globalThis as any).TEST_API_URL;
  }
  // Fall back to environment variable
  if (process.env.BOOKING_SERVICE_API) {
    return process.env.BOOKING_SERVICE_API;
  }
  throw new Error('TEST_API_URL not available...');
}

const API_BASE_URL = getTestApiUrl();

describe('Notification API', () => {
  it('should create notification', async () => {
    // API_BASE_URL is now dynamically resolved
    // e.g., "http://localhost:53847/api"
    const response = await axios.post(`${API_BASE_URL}/notifications`, {
      // ...
    });
    expect(response.status).toBe(201);
  });
});
```

---

## Benefits

✅ **No Manual Server Management**
- Test server starts automatically
- No need for separate terminal/process

✅ **Port Conflict Prevention**
- Ephemeral port assignment (OS-assigned)
- Multiple test runs can run in parallel

✅ **Clean Test Data**
- Fresh database per test run
- Test resources tracked and cleaned
- No data leakage between runs

✅ **Proper Cleanup**
- All connections closed gracefully
- Timeout-based force closure backup
- Resources released after test suite

✅ **Transparent to Tests**
- Tests use familiar axios HTTP calls
- No in-process modifications needed
- Familiar testing patterns

✅ **Error Handling**
- Fails fast on setup errors
- Cleanup on startup failure
- Meaningful error messages

---

## Troubleshooting

### Test URL Not Available

**Error**: `TEST_API_URL not available. Test server may not have been bootstrapped`

**Solution**:
1. Verify jest.config.ts has `globalSetup` configured
2. Check `INTEGRATION_DB=true` environment variable is set
3. Look for jest setup errors in test output

### Port Already in Use

**Error**: Test server fails to start (rare with ephemeral ports)

**Solution**:
1. Kill any existing processes on conflicting ports
2. Check OS port range: `netstat -an | grep LISTEN`
3. Restart test runner

### Test Timeout

**Error**: Tests timeout but requests succeeded

**Solution**:
1. Increase `testTimeout` in jest.config.ts
2. Check network latency to test server
3. Review test logic for synchronous waits

### Cleanup Failures

**Error**: Resources not cleaned up between runs

**Solution**:
1. Check `testDataTracker` is used correctly
2. Verify `teardownTestEnvironment()` is called
3. Check database connection in setup.ts

---

## Files Modified

| File | Changes |
|------|---------|
| `test-server.ts` | **New** - Test HTTP server bootstrap utility |
| `global-setup.ts` | **Updated** - Added testServer.start() |
| `global-teardown.ts` | **Updated** - Added testServer.stop() |
| `notificationAPI.integration.test.ts` | **Updated** - Use getTestApiUrl() |
| `notificationService.integration.test.ts` | **Updated** - Use getTestApiUrl() |
| `notificationRetryMechanism.test.ts` | **Updated** - Use getTestApiUrl() |
| `notificationAnalytics.test.ts` | **Updated** - Use getTestApiUrl() |
| `run-notification-tests.sh` | **Updated** - Document server bootstrap |

---

## Next Steps

1. Run integration tests: `npm run test:integration`
2. Verify test output shows server startup/shutdown
3. Monitor for any connection timeouts
4. Use `TEST_DB_RESET=true` for clean runs
5. Consider implementing additional providers (SMS, Push) as endpoints are added

---

## References

- Jest Global Setup/Teardown: https://jestjs.io/docs/configuration#globalsetup
- Express Server Lifecycle: https://expressjs.com/en/api/app.html#app.listen
- Ephemeral Port Range: System-assigned (OS handles conflicts)

