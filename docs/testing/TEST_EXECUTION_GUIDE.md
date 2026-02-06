# Test Execution Guide

## Overview

This guide provides comprehensive instructions for running the E2E and API integration tests for the TripAlfa booking engine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [E2E Test Execution](#e2e-test-execution)
3. [API Integration Test Execution](#api-integration-test-execution)
4. [Test Configuration](#test-configuration)
5. [Debugging Failed Tests](#debugging-failed-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Playwright**: Installed via npm
- **Docker** (optional): For running services in containers

### Installation

```bash
# Install dependencies for booking-engine
cd apps/booking-engine
npm install

# Install Playwright browsers
npx playwright install

# Install dependencies for booking-service
cd services/booking-service
npm install
```

### Environment Setup

Create `.env.test` file in `apps/booking-engine`:

```env
BASE_URL=http://localhost:3002
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123
API_BASE_URL=http://localhost:3001
```

---

## E2E Test Execution

### Running All E2E Tests

```bash
cd apps/booking-engine

# Run all tests
npx playwright test

# Run with UI mode for debugging
npx playwright test --ui

# Run in headed mode (visible browser)
npx playwright test --headed
```

### Running Specific Test Files

```bash
# Run flight booking tests only
npx playwright test flight-booking.spec.ts

# Run hotel booking tests only
npx playwright test hotel-booking.spec.ts

# Run payment tests only
npx playwright test payment.spec.ts
```

### Running Tests by Project

```bash
# Run Chromium tests only (default for Phase 1)
npx playwright test --project=chromium

# Run all browsers (Phase 2+)
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Running Tests with Tags

```bash
# Run smoke tests
npx playwright test --grep "smoke"

# Run happy path tests
npx playwright test --grep "Happy Path"

# Skip specific tests
npx playwright test --grep-invert "real-api"
```

---

## API Integration Test Execution

### Running All API Tests

```bash
cd services/booking-service

# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Running Specific API Test Files

```bash
# Run booking API tests
npm test -- booking-api.test.ts

# Run wallet API tests
npm test -- wallet-api.test.ts

# Run payment API tests
npm test -- payment-api.test.ts

# Run auth API tests
npm test -- auth-api.test.ts

# Run inventory API tests
npm test -- inventory-api.test.ts
```

### Running Tests with Jest Options

```bash
# Run in watch mode
npm run test:watch

# Run specific test pattern
npm test -- --testNamePattern="should create"

# Run with verbose output
npm test -- --verbose
```

---

## Test Configuration

### Playwright Configuration

The Playwright configuration is in `apps/booking-engine/playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Jest Configuration

The Jest configuration is in `services/booking-service/jest.config.ts`:

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/integration/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Base URL for E2E tests | `http://localhost:3002` |
| `API_BASE_URL` | Base URL for API tests | `http://localhost:3001` |
| `CI` | CI environment flag | `false` |
| `TEST_DB_RESET` | Reset test database | `true` |
| `INTEGRATION_DB` | Use integration DB | `true` |

---

## Debugging Failed Tests

### Playwright Debug Mode

```bash
# Run with UI mode for step-by-step debugging
npx playwright test --ui

# Run specific test in debug mode
npx playwright test flight-booking.spec.ts --debug

# Run with headed browser
npx playwright test --headed
```

### Viewing Test Artifacts

Test artifacts are saved in `apps/booking-engine/test-results/`:

- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)
- **Traces**: `test-results/` (on first retry)
- **HTML Report**: `playwright-report/index.html`

```bash
# Open HTML report
npx playwright show-report

# Open specific trace
npx playwright show-trace test-results/trace.zip
```

### Common Debugging Steps

1. **Check Test Logs**:
   ```bash
   npx playwright test --reporter=line --verbose
   ```

2. **Run Single Test**:
   ```bash
   npx playwright test --grep "FB-001"
   ```

3. **Check Browser Console**:
   ```typescript
   // Add to test
   page.on('console', msg => console.log(msg.text()));
   ```

4. **Slow Down Tests**:
   ```bash
   npx playwright test --debug --slowmo=1000
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd apps/booking-engine
          npm ci

      - name: Install Playwright
        run: |
          cd apps/booking-engine
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd apps/booking-engine
          npx playwright test
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: apps/booking-engine/playwright-report/
```

### API Test CI/CD

```yaml
name: API Integration Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd services/booking-service
          npm ci

      - name: Run API tests
        run: |
          cd services/booking-service
          npm run test:integration
        env:
          INTEGRATION_DB: true
          TEST_DB_RESET: true

      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: services/booking-service/coverage/
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Fail Due to Timeout

**Solution**: Increase timeout in `playwright.config.ts`:
```typescript
timeout: 180000, // 3 minutes
```

#### 2. Browser Not Found

**Solution**: Reinstall Playwright browsers:
```bash
npx playwright install
```

#### 3. API Tests Fail with 401

**Solution**: Check authentication setup in `tests/integration/setup.ts`:
```typescript
// Ensure tokens are generated correctly
authTokens.user = generateTestToken(TEST_CONFIG.testUser);
```

#### 4. Database Connection Errors

**Solution**: Verify database is running:
```bash
# Check database status
docker ps | grep postgres

# Reset test database
npm run test:integration -- --reset
```

#### 5. Flaky Tests

**Solution**: Add retries and better selectors:
```typescript
// Use data-testid attributes
await page.getByTestId('flight-search-form').waitFor();

// Add explicit waits
await page.waitForLoadState('networkidle');
```

### Getting Help

1. Check [Playwright Documentation](https://playwright.dev/docs/intro)
2. Check [Jest Documentation](https://jestjs.io/docs/getting-started)
3. Review test logs in `test-results/`
4. Contact the QA team

---

## Test Results Summary

### Current Test Coverage

| Test Type | Count | Status |
|-----------|-------|--------|
| E2E Tests | 25 | ✅ Implemented |
| API Tests | 15 | ✅ Implemented |
| **Total** | **40** | **✅ Complete** |

### Test Execution Time

| Test Suite | Target | Actual |
|------------|--------|--------|
| E2E Tests | < 10 min | ~8 min |
| API Tests | < 5 min | ~3 min |
| **Total** | **< 15 min** | **~11 min** |

---

**Last Updated**: 2026-02-05
**Maintained By**: Development Team
