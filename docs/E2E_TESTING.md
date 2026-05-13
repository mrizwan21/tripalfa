# E2E Testing Guide - TripAlfa

Autonomous end-to-end testing system with multi-agent support for parallel execution.

## Quick Start

```bash
# Run all tests (recommended)
pnpm test:e2e:all

# Run in YOLO mode (autonomous, no interruptions)
pnpm test:e2e:yolo

# Run specific module
pnpm test:e2e:module --module=auth
```

## Available Commands

```bash
# All tests
pnpm test:e2e:all              # Run all E2E tests
pnpm test:e2e:yolo             # YOLO mode - fully autonomous
pnpm test:e2e:parallel         # Parallel execution
pnpm test:e2e:sequential       # Sequential execution

# Module-specific
pnpm test:e2e:module --module=auth
pnpm test:e2e:module --module=flights
pnpm test:e2e:module --module=hotels

# Debug modes
pnpm test:e2e:debug            # Debug with UI
pnpm test:e2e:headed           # Run with visible browser
pnpm test:e2e:report           # Show last report

# CI/CD
pnpm test:e2e:ci               # CI mode with retries
pnpm test:e2e:staging          # Staging environment
```

## Test Modules

| Module | Description | Priority |
|--------|-------------|----------|
| `auth` | Authentication & Authorization | High |
| `flights` | Flight Search & Booking | High |
| `hotels` | Hotel Search & Booking | High |
| `bookings` | Booking Management | High |
| `profile` | User Profile | Medium |
| `dashboard` | Dashboard & Analytics | Medium |
| `loyalty` | Loyalty Program | Low |
| `wallet` | Wallet & Payments | Medium |
| `navigation` | Navigation & Routing | Medium |
| `forms` | Form Validation | Medium |
| `components` | Interactive Components | Low |
| `api` | API Integration | High |

## Multi-Agent Execution

### Autonomous Agent Mode

Run individual agents for specific modules:

```bash
# Single module agent
node tools/scripts/autonomous-agent.js auth

# All modules sequentially
node tools/scripts/autonomous-agent.js --all
```

### Parallel Executor

Run multiple agents in parallel:

```bash
node tools/scripts/parallel-agent-executor.js
```

### Orchestrator Mode

Centralized orchestration of all test agents:

```bash
node tools/scripts/e2e-orchestrator.js --all

# Specific modules
node tools/scripts/e2e-orchestrator.js auth flights hotels
```

## Configuration

### Environment Variables

```bash
# Base URL for tests
BASE_URL=http://localhost:5174

# Test mode
VITE_TEST_MODE=true

# CI/CD
CI=true
PLAYWRIGHT_WORKERS=4
```

### Custom Configuration

Edit `tools/scripts/e2e.config.js` to customize:
- Timeouts
- Parallelization settings
- Reporting options
- Module priorities

## Testing Modes

### Development Mode
```bash
pnpm test:e2e
```
- Runs against local dev server
- MSW mocks enabled
- No retries

### CI Mode
```bash
pnpm test:e2e:ci
```
- Runs in headless mode
- 2 retries on failure
- Optimized for CI/CD

### YOLO Mode
```bash
pnpm test:e2e:yolo
```
- Fully autonomous
- No human intervention
- Runs all tests without stopping
- Self-healing with retries

### Debug Mode
```bash
pnpm test:e2e:debug
```
- Interactive UI
- Step-through debugging
- Time travel debugging

## Test Structure

```\ntests/e2e/
├── auth/              # Authentication tests
│   ├── login.spec.ts
│   ├── register.spec.ts
│   └── forgot-password.spec.ts
├── flights/           # Flight booking tests
│   ├── flight-search.spec.ts
│   ├── flight-booking.spec.ts
│   └── flight-full-flow.spec.ts
├── hotels/            # Hotel booking tests
├── bookings/          # Booking management tests
├── profile/           # User profile tests
├── dashboard/         # Dashboard tests
├── loyalty/           # Loyalty program tests
├── wallet/            # Wallet tests
├── navigation/        # Navigation tests
├── forms/             # Form validation tests
├── components/        # Component tests
└── api/               # API integration tests
```

## Reports

Reports are generated automatically:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/result.json`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`

View reports:
```bash
pnpm test:e2e:report
```

## Troubleshooting

### Tests failing
```bash
# Run with debug output
DEBUG=pw:api pnpm test:e2e

# Run specific failing test
pnpm test:e2e -- tests/e2e/auth/login.spec.ts

# Increase timeout
TIMEOUT=60000 pnpm test:e2e
```

### Flaky tests
```bash
# Run with retries
pnpm test:e2e:ci

# Debug mode
pnpm test:e2e:debug
```

### Network issues
```bash
# Use mocked mode
pnpm test:e2e:mock

# Check dev server
pnpm dev:test
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Selectors**: Use data-testid for stable selectors
4. **Timeouts**: Set appropriate timeouts for slow operations
5. **Parallelization**: Use tags to group related tests

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: pnpm test:e2e:ci
  env:
    CI: true
    PLAYWRIGHT_WORKERS: 4
```

### GitLab CI
```yaml
e2e_tests:
  script:
    - pnpm test:e2e:ci
  artifacts:
    reports:
      - test-results/result.json
```

## Support

For issues or questions:
- Check existing issues in the repository
- Review Playwright documentation: https://playwright.dev
- See internal docs: `docs/testing/`
