# E2E Testing Quick Start & Execution Guide

**Date**: February 5, 2026  
**Purpose**: Quick reference for running E2E tests and validation

---

## Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npm install
```

### 2. Verify Environment
```bash
# Check .env.test exists
ls -la apps/booking-engine/.env.test

# Check database connection
echo "DATABASE_URL: $(grep DATABASE_URL apps/booking-engine/.env.test)"
```

### 3. Run Frontend E2E Tests
```bash
cd apps/booking-engine

# Option A: Run all tests (Headless)
npm run test:e2e

# Option B: Run with UI mode (Interactive)
npm run test:e2e:ui

# Option C: Run with visible browser
npm run test:e2e:headed

# Option D: Debug mode
npm run test:e2e:debug
```

### 4. View Results
```bash
# View HTML report
npm run test:e2e:report
```

---

## Test Categories

### Happy Path Tests (User Flows)

```bash
# Individual test files
npx playwright test tests/e2e/flight-booking.spec.ts
npx playwright test tests/e2e/hotel-booking.spec.ts
npx playwright test tests/e2e/booking-management.spec.ts
npx playwright test tests/e2e/wallet.spec.ts
npx playwright test tests/e2e/payment.spec.ts
```

### Error Scenario Tests

```bash
# Run all error tests
npm run test:e2e:errors

# Individual error tests
npx playwright test tests/e2e/payment-errors.spec.ts
npx playwright test tests/e2e/validation-errors.spec.ts
npx playwright test tests/e2e/timeout-errors.spec.ts
npx playwright test tests/e2e/network-errors.spec.ts
```

### Smoke Tests

```bash
npx playwright test tests/e2e/booking-engine.smoke.spec.ts
```

### Real API Integration

```bash
npx playwright test tests/e2e/flight-booking-real-api.spec.ts
```

---

## Backend API Tests

### Setup
```bash
cd services/booking-service
npm install
```

### Run Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E API tests
npm run test:integration:e2e

# Coverage report
npm run test:coverage
```

---

## Debugging

### View Test Report
```bash
cd apps/booking-engine
npm run test:e2e:report
```

### Debug a Specific Test
```bash
npx playwright test tests/e2e/flight-booking.spec.ts --debug
```

### Show HTML Report in Browser
```bash
# After running tests
npx playwright show-report playwright-report
```

### View Test Traces
```bash
npx playwright show-trace test-results/trace.zip
```

---

## Validation Checklist

### ✅ Environment Setup
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.test` file exists and has all variables
- [ ] Database URL is accessible
- [ ] Playwright browsers installed

### ✅ Frontend Tests (11 specs, 100+ tests)
- [ ] Flight booking tests pass
- [ ] Hotel booking tests pass
- [ ] Booking management tests pass
- [ ] Wallet operation tests pass
- [ ] Payment tests pass
- [ ] Error scenario tests pass
- [ ] All tests complete in <10 minutes

### ✅ Backend Tests (6 test files)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E API tests pass
- [ ] All 10 API endpoints covered

### ✅ Page Objects (19 files)
- [ ] All extend BasePage
- [ ] All use data-testid selectors
- [ ] No test assertions in classes
- [ ] TypeScript type safety verified

### ✅ Test Data Management
- [ ] Database seeding works
- [ ] Cleanup functions work
- [ ] No data conflicts in parallel runs
- [ ] Authentication state persists

### ✅ External Services
- [ ] Stripe sandbox configured
- [ ] Hotelston sandbox configured
- [ ] Duffel sandbox configured
- [ ] Tests can run offline with mocks

### ✅ Documentation
- [ ] README.md is accurate
- [ ] COVERAGE.md reflects current state
- [ ] TEST_DATA.md is complete
- [ ] No outdated information

---

## Expected Results

### Successful Frontend Test Run
```
✓ 11 test files
✓ 100+ test cases
✓ 100% pass rate
✓ Execution time: <10 minutes
✓ HTML report: playwright-report/index.html
✓ No flaky tests detected
```

### Successful Backend Test Run
```
✓ 6 test files (4 E2E + 2 unit)
✓ 20+ test cases
✓ 100% pass rate
✓ All API endpoints covered
✓ Coverage report generated
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all E2E tests headless |
| `npm run test:e2e:ui` | Run tests with interactive UI |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | View HTML test report |
| `npm run test:e2e:errors` | Run error scenario tests |
| `npx playwright test --list` | List all tests |
| `npx playwright test [spec.ts]` | Run specific test file |
| `npx playwright codegen localhost:3002` | Generate test code |

---

## Troubleshooting

### Tests Won't Start
```bash
# Check if development server is running
lsof -i :3002

# Start dev server if needed
cd apps/booking-engine
npm run dev
```

### Database Connection Error
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Check if database is accessible
psql postgresql://neondb_owner:password@localhost:5432/neondb_test -c "SELECT 1"
```

### Test Timeout
```bash
# Check server response times
curl -I http://localhost:3002

# Increase timeout in playwright.config.ts if needed
# timeout: 60000 (already optimized for Phase 1)
```

### Flaky Tests
- Check network connectivity
- Verify test database is clean
- Check for concurrent test conflicts
- Review test traces in test-results/

### Browser Not Found
```bash
# Install Playwright browsers
npx playwright install
```

---

## CI/CD Integration Preview

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Performance Baseline

| Metric | Target | Phase 1 Status |
|--------|--------|---|
| Total Execution | <10 min | ⏳ TBD |
| Per Test Avg | <5s | ⏳ TBD |
| Setup Time | <30s | ✅ Optimized |
| Report Generation | <5s | ✅ HTML + JSON |
| Parallel Workers | 4+ | ✅ Configured |

---

## Files Reference

| Category | Location | Count |
|----------|----------|-------|
| E2E Tests | `apps/booking-engine/tests/e2e/` | 11 |
| Page Objects | `apps/booking-engine/tests/pages/` | 19 |
| Fixtures | `apps/booking-engine/tests/fixtures/` | 7 |
| Helpers | `apps/booking-engine/tests/helpers/` | 7 |
| Backend Tests | `services/booking-service/src/__tests__/` | 6 |
| Documentation | `docs/` and `tests/` | 5 |

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Jest Docs**: https://jestjs.io
- **Supertest Docs**: https://github.com/visionmedia/supertest
- **Prisma Docs**: https://www.prisma.io

---

## Support

### For Questions:
1. Check [E2E_TESTING_INFRASTRUCTURE_VALIDATION.md](./E2E_TESTING_INFRASTRUCTURE_VALIDATION.md)
2. Review [E2E_IMPLEMENTATION_SUMMARY.md](./E2E_IMPLEMENTATION_SUMMARY.md)
3. Check test README at `apps/booking-engine/tests/README.md`

### For Issues:
1. Check test traces: `test-results/`
2. Review screenshots: `test-results/[test-name]-1/`
3. Check videos: `test-results/[test-name]-1/`
4. Enable debug: `npm run test:e2e:debug`

---

**Last Updated**: February 5, 2026  
**Status**: Ready for Test Execution
