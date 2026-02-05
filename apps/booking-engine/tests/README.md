# Booking Engine E2E Test Guide

## Configuration

### Phase 1 Optimizations
The Playwright configuration has been optimized for Phase 1 testing with the following enhancements:

- **Conservative Timeouts**: Reduced timeouts for faster feedback (expect: 10s, action: 15s, navigation: 30s)
- **Single Browser Focus**: Chromium-only testing for faster execution and reliable results
- **Setup Project**: Dedicated setup project runs before tests for better isolation
- **Comprehensive Reporting**: HTML and JSON reports generated automatically
- **Standardized Environment**: Consistent viewport (1280x720) and error handling

### Environment Variables
Create a `.env.test` file in the `apps/booking-engine/` directory with the following variables:

```bash
# Application URLs
BASE_URL=http://localhost:3002
API_URL=http://localhost:3003

# Database Configuration
DATABASE_URL=postgresql://neondb_owner:password@localhost:5432/neondb_test

# Payment Service Keys (Test Mode)
STRIPE_TEST_KEY=sk_test_your_stripe_test_key_here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# External Service Sandbox Credentials
HOTELSTON_SANDBOX_URL=https://api.test.hotelston.com
HOTELSTON_SANDBOX_KEY=your_hotelston_sandbox_key_here
DUFFEL_SANDBOX_URL=https://api.duffel.com
DUFFEL_SANDBOX_KEY=your_duffel_sandbox_key_here

# Test User Credentials
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123
```

## Prerequisites
- Node.js (v18+ recommended)
- All dependencies installed: `npm install` (at repo root)
- Test database configured and running
- Environment variables set in `.env.test`
- Application servers running (frontend on port 3002, API on port 3003)

## Running E2E Tests

### Basic Commands
- Run all E2E tests: `npm run test:e2e`
- Run Playwright UI mode: `npm run test:e2e:ui`
- Run a specific test file: `npx playwright test tests/e2e/flight-booking.spec.ts`
- Debug a test: `npm run test:e2e:debug`
- Headed mode: `npm run test:e2e:headed`
- Show HTML report: `npm run test:e2e:report`

### Advanced Commands
- List all tests: `npx playwright test --list`
- Run tests in specific project: `npx playwright test --project=chromium`
- Run with custom config: `npx playwright test --config=playwright.config.ts`
- Generate code for new tests: `npx playwright codegen http://localhost:3002`

### Phased Browser Rollout
- **Phase 1**: Chromium only (current implementation)
- **Phase 2**: Add Firefox and WebKit browsers
- **Phase 3**: Add Mobile Chrome and Mobile Safari

## Expected Output

### Successful Test Run
```
Running 10 tests using 1 worker
✓  1 [chromium] › tests/e2e/auth.spec.ts:10:5 › User Authentication › should login successfully (2.3s)
✓  2 [chromium] › tests/e2e/booking.spec.ts:15:7 › Flight Booking › should complete booking flow (4.1s)
...

10 passed (12.5s)
```

### Report Generation
- HTML Report: `playwright-report/index.html`
- JSON Results: `test-results/results.json`
- Screenshots/Videos: `test-results/` (on failure)

## Debugging Failed Tests
- Screenshots and videos are saved in `test-results/`
- Use Playwright Trace Viewer: `npx playwright show-trace test-results/trace.zip`
- Enable inspector: `npx playwright test --debug`
- Check browser console logs in trace viewer

## Troubleshooting

### Slow Tests
- **Worker Optimization**: Reduce workers if tests compete for resources
- **Timeout Issues**: Check network connectivity and server response times
- **Database Bottlenecks**: Ensure test database is properly indexed

### Flaky Tests
- **Timeout Adjustments**: Phase 1 timeouts are conservative; increase if needed
- **Race Conditions**: Add proper wait conditions instead of fixed delays
- **Network Issues**: Check for unstable connections affecting external API calls

### Server Connection Issues
- **Port Conflicts**: Ensure ports 3002 (frontend) and 3003 (API) are available
- **Startup Time**: Wait for servers to fully initialize before running tests
- **CORS Issues**: Verify API allows requests from test environment

### Database Connection Failures
- **Connection String**: Verify `DATABASE_URL` in `.env.test` is correct
- **Database State**: Ensure test database is running and accessible
- **Migration Issues**: Run database migrations before starting tests

## CI/CD Integration
- (Deferred to Phase 2)
- JUnit reporter configuration is ready for CI pipelines
- WebServer auto-startup will be enabled in CI environments

---

## Test Structure
- `tests/e2e/` - End-to-end test specifications
- `tests/helpers/` - Shared utilities and setup functions
- `tests/fixtures/` - Test data and storage states
- `playwright-report/` - HTML test reports
- `test-results/` - Screenshots, videos, and JSON results
