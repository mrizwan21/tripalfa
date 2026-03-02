# Enhanced Playwright Configuration Guide

**Epic**: 99ed40b1-7f2a-4835-8eda-9976e060bb30  
**Spec**: d0e3e304-309a-40c0-8e50-cc7e6322d692  
**Date**: February 6, 2026

---

## Overview

This enhanced Playwright configuration provides a comprehensive testing infrastructure with environment-specific settings, advanced reporting, test categorization, and cross-browser testing capabilities.

## Files Created

### 1. Enhanced Configuration

- **`playwright.config.enhanced.ts`** - Main enhanced configuration file
  - Environment-specific timeouts (local, CI, staging, production)
  - Advanced reporting (HTML, JSON, JUnit, Allure-ready)
  - Test categorization and tagging support
  - Mobile and cross-browser testing
  - Visual regression testing support
  - Performance monitoring
  - Enhanced debugging capabilities

### 2. Environment Configuration Files

- **`.env.test.ci`** - CI/CD environment settings
- **`.env.test.staging`** - Staging environment settings

### 3. Test Utilities

- **`tests/helpers/test-categories.ts`** - Test categorization and tagging utilities
- **`tests/helpers/enhanced-test-utils.ts`** - Enhanced test utilities

### 4. Updated Package.json

- Added 12 new test scripts for enhanced testing workflows

---

## New Test Scripts

### Basic Enhanced Testing

```bash
# Run tests with enhanced configuration (local environment)
npm run test:e2e:enhanced

# Run smoke tests only
npm run test:e2e:smoke

# Run tests with specific tags
npm run test:e2e:tagged -- "@smoke"
npm run test:e2e:tagged -- "@flight"
npm run test:e2e:tagged -- "@critical"
```

### Environment-Specific Testing

```bash
# Run tests in CI environment
npm run test:e2e:ci

# Run tests in staging environment
npm run test:e2e:staging
```

### Cross-Browser Testing

```bash
# Run tests in Firefox
npm run test:e2e:firefox

# Run tests in WebKit (Safari)
npm run test:e2e:webkit

# Run tests in all browsers (Chrome, Firefox, Safari)
npm run test:e2e:cross-browser
```

### Mobile and Tablet Testing

```bash
# Run tests on mobile devices (Pixel 5, iPhone 12)
npm run test:e2e:mobile

# Run tests on tablet devices (iPad)
npm run test:e2e:tablet
```

### Visual Regression Testing

```bash
# Run visual regression tests
npm run test:e2e:visual
```

### Enhanced Reports

```bash
# View enhanced local report
npm run test:e2e:report:enhanced

# View CI report
npm run test:e2e:report:ci

# View staging report
npm run test:e2e:report:staging
```

---

## Test Categorization

### Available Tags

#### Priority Levels

- `@P0` - Critical (must pass)
- `@P1` - High (should pass)
- `@P2` - Medium (nice to have)
- `@P3` - Low (future consideration)

#### Test Categories

- `@smoke` - Smoke tests
- `@critical` - Critical path tests
- `@regression` - Regression tests

#### Feature Areas

- `@flight` - Flight booking tests
- `@hotel` - Hotel booking tests
- `@wallet` - Wallet operation tests
- `@payment` - Payment processing tests
- `@booking` - Booking management tests
- `@user` - User management tests
- `@auth` - Authentication tests

#### Test Types

- `@error` - Error scenario tests
- `@validation` - Validation tests
- `@timeout` - Timeout tests
- `@network` - Network error tests
- `@api` - API integration tests
- `@e2e` - End-to-end tests

#### Special Testing

- `@visual` - Visual regression tests
- `@a11y` - Accessibility tests
- `@performance` - Performance tests
- `@security` - Security tests

#### Environment

- `@local` - Local environment tests
- `@ci` - CI environment tests
- `@staging` - Staging environment tests
- `@prod` - Production environment tests

#### Browser

- `@chromium` - Chrome/Chromium tests
- `@firefox` - Firefox tests
- `@webkit` - Safari/WebKit tests
- `@mobile` - Mobile device tests
- `@tablet` - Tablet device tests

---

## Using Test Categories in Tests

### Example: Tagged Test

```typescript
import { test, expect } from "@playwright/test";
import { TEST_CATEGORIES, TEST_PRIORITY } from "../helpers/test-categories";

test(`FB-001: Complete flight booking @smoke @flight @P0 @critical`, async ({
  page,
}) => {
  // Test implementation
});
```

### Example: Using Enhanced Test Utilities

```typescript
import { test, expect } from "@playwright/test";
import {
  EnhancedTestContext,
  TestDataGenerator,
} from "../helpers/enhanced-test-utils";

test("enhanced test with performance monitoring", async ({
  page,
}, testInfo) => {
  const context = new EnhancedTestContext(page, testInfo);

  // Record action with timing
  await context.recordAction("Navigate to flights", async () => {
    await page.goto("/flights");
  });

  // Generate test data
  const email = TestDataGenerator.generateEmail("flight");
  const bookingRef = TestDataGenerator.generateBookingReference();

  // Collect memory usage
  await context.collectMemoryUsage();

  // Attach metrics to report
  await context.attachMetrics();
});
```

---

## Environment-Specific Configuration

### Local Development

```bash
# Uses .env.test by default
npm run test:e2e:enhanced
```

### CI/CD Pipeline

```bash
# Uses .env.test.ci
TEST_ENV=ci npm run test:e2e:ci
```

Features:

- Longer timeouts (90s per test)
- JUnit XML reporting
- 2 retries for flaky tests
- Parallel workers (2)
- Max 5 failures before stopping

### Staging Environment

```bash
# Uses .env.test.staging
TEST_ENV=staging npm run test:e2e:staging
```

Features:

- Extended timeouts (120s per test)
- Mobile device testing enabled
- Real API endpoints (no mocks)
- 4 parallel workers

---

## Performance Monitoring

The enhanced configuration includes automatic performance monitoring:

### Navigation Timings

- Tracks page load times
- Records navigation duration
- Identifies slow pages

### Action Timings

- Records action execution times
- Identifies slow interactions
- Helps optimize test performance

### Memory Usage

- Monitors JavaScript heap size
- Detects memory leaks
- Tracks memory consumption

### Viewing Performance Data

Performance metrics are automatically attached to test reports as JSON files.

---

## Advanced Reporting

### Report Types

1. **HTML Reports**
   - `playwright-report-local/` - Local environment
   - `playwright-report-ci/` - CI environment
   - `playwright-report-staging/` - Staging environment

2. **JSON Reports**
   - `test-results/results-local.json`
   - `test-results/results-ci.json`
   - `test-results/results-staging.json`

3. **JUnit XML** (CI only)
   - `test-results/junit-ci.xml`
   - Compatible with CI/CD systems

4. **Allure Reports** (optional)
   - Set `ALLURE_RESULTS_DIR` environment variable
   - Requires `allure-playwright` package

---

## Cross-Browser Testing

### Supported Browsers

- **Chromium** (Desktop Chrome) - Primary browser
- **Chromium High DPI** - High resolution displays
- **Firefox** - Mozilla Firefox
- **WebKit** - Apple Safari
- **Mobile Chrome** - Pixel 5
- **Mobile Safari** - iPhone 12
- **Tablet Chrome** - iPad (gen 7)

### Running Cross-Browser Tests

```bash
# All browsers
npm run test:e2e:cross-browser

# Specific browsers
npm run test:e2e:firefox
npm run test:e2e:webkit
npm run test:e2e:mobile
```

---

## Visual Regression Testing

### Setup

```bash
# Run visual tests
TEST_VISUAL=true npm run test:e2e:visual

# Update baselines
UPDATE_SNAPSHOTS=true npm run test:e2e:visual
```

### Configuration

- Threshold: 0.2 (20% pixel difference allowed)
- Max diff pixels: 100
- Snapshots stored in: `tests/snapshots/`

---

## Debugging Features

### Enhanced Debugging

```bash
# Debug mode with devtools
DEBUG_TESTS=true npm run test:e2e:enhanced

# Slow motion (ms per action)
SLOW_MO=1000 npm run test:e2e:enhanced

# Record network HAR
RECORD_HAR=true npm run test:e2e:enhanced
```

### Console and Network Monitoring

The enhanced utilities automatically collect:

- Console logs (errors, warnings)
- Network requests and responses
- Failed request tracking

---

## Best Practices

### 1. Use Test Tags

Always tag tests with appropriate categories:

```typescript
test("test name @smoke @flight @P0", async () => {
  // Test implementation
});
```

### 2. Use Enhanced Test Context

For performance-critical tests:

```typescript
const context = new EnhancedTestContext(page, testInfo);
await context.recordAction("action name", async () => {
  // Action
});
```

### 3. Generate Test Data

Use the test data generator for unique data:

```typescript
const email = TestDataGenerator.generateEmail();
const bookingRef = TestDataGenerator.generateBookingReference();
```

### 4. Environment-Specific Testing

Run tests in appropriate environments:

- Local: Development and debugging
- CI: Automated testing
- Staging: Pre-production validation

---

## Migration Guide

### From Original Configuration

The original `playwright.config.ts` remains unchanged. The enhanced configuration is additive:

1. **Keep existing tests** - They work with both configurations
2. **Use enhanced config** for new features:
   - Cross-browser testing
   - Mobile testing
   - Visual regression
   - Performance monitoring

3. **Gradual migration**:
   - Start with `npm run test:e2e:enhanced`
   - Add tags to existing tests
   - Use new utilities as needed

---

## Troubleshooting

### Common Issues

#### Tests timeout in CI

```bash
# Increase CI timeout
TEST_TIMEOUT=120000 npm run test:e2e:ci
```

#### Mobile tests fail

```bash
# Check mobile emulation
TEST_MOBILE=true npm run test:e2e:mobile -- --project=mobile-chrome
```

#### Visual regression fails

```bash
# Update baselines
UPDATE_SNAPSHOTS=true npm run test:e2e:visual
```

#### Environment variables not loading

```bash
# Verify .env file exists
ls -la .env.test.ci

# Load explicitly
export $(cat .env.test.ci | xargs)
```

---

## Summary

The enhanced Playwright configuration provides:

✅ **Environment-specific settings** - Local, CI, Staging, Production  
✅ **Advanced reporting** - HTML, JSON, JUnit, Allure  
✅ **Test categorization** - Tags for filtering and organization  
✅ **Cross-browser testing** - Chrome, Firefox, Safari  
✅ **Mobile testing** - Pixel 5, iPhone 12, iPad  
✅ **Visual regression** - Screenshot comparison  
✅ **Performance monitoring** - Navigation and action timings  
✅ **Enhanced debugging** - Network HAR, console logs  
✅ **Test utilities** - Data generation, retry analysis

---

**Next Steps**: Start using the enhanced configuration with `npm run test:e2e:enhanced`
