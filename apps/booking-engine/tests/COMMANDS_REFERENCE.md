# Test Commands Reference

Quick reference for all test-related commands in the Booking Engine application.

## 🚀 Quick Commands

```bash
# Start development environment with tests watch mode
npm run dev

# Run all tests once
npm run test -- --run

# Run all tests in watch mode
npm run test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test -- --coverage

# Show Vitest UI
npm run test -- --ui
```

## 📊 Test Execution

### All Tests

| Command                              | Description                       |
| ------------------------------------ | --------------------------------- |
| `npm run test`                       | Run all tests in watch mode       |
| `npm run test -- --run`              | Run all tests once (single run)   |
| `npm run test -- --reporter=verbose` | Run all tests with verbose output |
| `npm run test -- --reporter=dot`     | Run all tests with minimal output |

### Unit Tests

| Command                                                      | Description                   |
| ------------------------------------------------------------ | ----------------------------- |
| `npm run test -- src/__tests__/components`                   | Run all component unit tests  |
| `npm run test -- src/__tests__/components/ui/Toast.test.tsx` | Run Toast component tests     |
| `npm run test -- src/__tests__/pages`                        | Run all page-level tests      |
| `npm run test -- src/__tests__/pages/Notifications.test.tsx` | Run Notifications page tests  |
| `npm run test -- -t "should render"`                         | Run tests matching pattern    |
| `npm run test -- -t "Toast"`                                 | Run tests for Toast component |

### Integration Tests

| Command                                                                     | Description                 |
| --------------------------------------------------------------------------- | --------------------------- |
| `npm run test -- src/__tests__/integration`                                 | Run all integration tests   |
| `npm run test -- src/__tests__/integration/NotificationsAPI.test.tsx`       | Run API mocking tests       |
| `npm run test -- src/__tests__/integration/NotificationsWithPopup.test.tsx` | Run popup interaction tests |

### Performance Tests

| Command                                                                 | Description                         |
| ----------------------------------------------------------------------- | ----------------------------------- |
| `npm run test -- src/__tests__/performance --run`                       | Run all performance tests           |
| `npm run test -- src/__tests__/performance/Notifications.perf.test.tsx` | Run Notifications performance tests |
| `npm run test -- -t "should render 100 items"`                          | Run specific benchmark              |

### E2E Tests

| Command                                               | Description                        |
| ----------------------------------------------------- | ---------------------------------- |
| `npm run test:e2e`                                    | Run all E2E tests                  |
| `npm run test:e2e -- --headed`                        | Run E2E tests with browser visible |
| `npm run test:e2e -- --debug`                         | Run E2E tests in debug mode        |
| `npm run test:e2e -- --ui`                            | Run E2E tests in UI mode           |
| `npm run test:e2e -- tests/e2e/notifications.spec.ts` | Run specific E2E file              |
| `npm run test:e2e -- -g "should display"`             | Run E2E tests matching pattern     |
| `npm run test:e2e -- --project=chromium`              | Run on specific browser            |
| `npm run test:e2e -- --project=firefox`               | Run on Firefox                     |
| `npm run test:e2e -- --project=webkit`                | Run on WebKit                      |

## 📈 Coverage Reports

| Command                                                  | Description                     |
| -------------------------------------------------------- | ------------------------------- |
| `npm run test -- --coverage`                             | Generate coverage report        |
| `npm run test -- --coverage --reporter=html`             | Generate HTML coverage report   |
| `npm run test -- --coverage --reporter=lcov`             | Generate LCOV coverage format   |
| `npm run test -- --coverage src/pages/Notifications.tsx` | Coverage for specific file      |
| `npm run test -- --coverage --thresholds.lines=80`       | Coverage with minimum threshold |

## 🔍 Watch & Debug Modes

| Command                                            | Description                             |
| -------------------------------------------------- | --------------------------------------- |
| `npm run test -- --watch`                          | Run tests in watch mode (default)       |
| `npm run test -- --ui`                             | Run tests with interactive UI           |
| `npm run test -- --reporter=verbose --no-coverage` | Verbose output without coverage         |
| `npm run test -- --inspect-brk`                    | Run with Node debugger                  |
| `npm run test:e2e -- --debug`                      | Run E2E tests with Playwright Inspector |

## 🧪 Filter & Select

| Command                                           | Description                     |
| ------------------------------------------------- | ------------------------------- |
| `npm run test -- -t "notifications"`              | Run tests matching string       |
| `npm run test -- -t "^Toast"`                     | Run tests matching regex        |
| `npm run test -- -t "Notifications" --watch`      | Watch tests matching pattern    |
| `npm run test -- src/__tests__/integration --run` | Run integration tests once      |
| `npm run test -- --grep="should.*render"`         | Run tests matching grep pattern |

## 📋 Listing & Information

| Command                                                 | Description          |
| ------------------------------------------------------- | -------------------- |
| `npm run test -- --list-tests`                          | List all test files  |
| `npm run test -- --list-tests src/__tests__/components` | List component tests |
| `npx playwright test --list`                            | List all E2E tests   |
| `npm run test -- --version`                             | Show Vitest version  |

## 🔧 Configuration & Options

| Command                                     | Description                |
| ------------------------------------------- | -------------------------- |
| `npm run test -- --config=vitest.config.ts` | Use specific config file   |
| `npm run test -- --run --threads=2`         | Limit parallel threads     |
| `npm run test -- --run --no-threads`        | Disable parallel execution |
| `npm run test -- --run --shard=1/2`         | Run test shard 1 of 2      |
| `npm run test -- --run --bail`              | Stop on first failure      |
| `npm run test -- --run --bail=2`            | Stop after 2 failures      |

## 📊 Reporting

| Command                                          | Description                         |
| ------------------------------------------------ | ----------------------------------- |
| `npm run test -- --reporter=verbose`             | Verbose console reporting           |
| `npm run test -- --reporter=dot`                 | Dotted progress reporting           |
| `npm run test -- --reporter=html`                | Generate HTML report                |
| `npm run test -- --reporter=json > results.json` | Export results to JSON              |
| `npm run test -- --reporter=tap`                 | TAP (Test Anything Protocol) format |
| `npm run test -- --reporter=junit`               | JUnit XML format (for CI)           |

## 🎬 E2E Specific Options

| Command                                            | Description                      |
| -------------------------------------------------- | -------------------------------- |
| `npm run test:e2e -- --headed`                     | See browser while tests run      |
| `npm run test:e2e -- --debug`                      | Step through tests interactively |
| `npm run test:e2e -- --ui`                         | Interactive UI mode              |
| `npm run test:e2e -- --trace on`                   | Record trace for debugging       |
| `npx playwright show-trace trace.zip`              | View recorded trace              |
| `npm run test:e2e -- --video=on`                   | Record video of tests            |
| `npm run test:e2e -- --screenshot=only-on-failure` | Take screenshots on failure      |

## 🔄 Continuous Integration

| Command                                                                | Description                   |
| ---------------------------------------------------------------------- | ----------------------------- |
| `npm run test -- --run --coverage`                                     | Full test suite with coverage |
| `npm run test -- --run --reporter=junit --outputFile=test-results.xml` | JUnit format for CI           |
| `npm run test:e2e -- --project=chromium --project=firefox`             | Multi-browser E2E             |
| `npm run test -- --run --bail`                                         | Stop on first failure         |
| `npm run test -- --run --reporter=tap`                                 | TAP format for CI systems     |

## 💡 Common Workflows

### Development

```bash
# Start watching tests while developing
npm run test -- --watch

# Watch specific component while developing
npm run test -- src/__tests__/components/ui/Toast.test.tsx --watch

# Run tests with UI for better visibility
npm run test -- --ui
```

### Before Commit

```bash
# Run all tests once to verify
npm run test -- --run --coverage

# Run linting and formatting
npm run lint && npm run format
```

### Pull Request Review

```bash
# Full test suite with coverage report
npm run test -- --run --coverage

# All E2E tests in headed mode for verification
npm run test:e2e -- --headed

# Performance regression check
npm run test -- src/__tests__/performance --run
```

### Performance Analysis

```bash
# Run performance tests with detailed output
npm run test -- src/__tests__/performance --run --reporter=verbose

# Profile specific operation
npm run test -- -t "should filter 1000 items" --run

# Generate performance baseline
npm run test -- src/__tests__/performance --baseline
```

### Debugging Failed Tests

```bash
# Debug specific test
npm run test -- -t "specific test name" --inspect-brk

# Debug E2E test
npm run test:e2e -- -g "test name" --debug

# Run with trace
npm run test:e2e -- --trace on --headed
```

## 📝 Notes

- All commands run from `apps/booking-engine/` workspace
- Use `npm run` prefix when running from workspace
- For root-level runs, adjust path to `--workspace=@tripalfa/booking-engine`
- E2E tests require the application to be running (`npm run dev`)
- Some commands require specific timeout values - increase if needed

## Related Files

- [README.md](./README.md) - Comprehensive testing guide
- [vitest.config.ts](../vitest.config.ts) - Vitest configuration
- [playwright.config.ts](../playwright.config.ts) - Playwright configuration
- [tsconfig.json](../tsconfig.json) - TypeScript configuration

---

**Last Updated:** 2024
**Maintained By:** Development Team
