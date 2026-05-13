# Test Agents Guide - Complete Reference

## Quick Commands

### One-Click Execution
```bash
# Run everything (RECOMMENDED)
./RUN_AUTONOMOUS_TESTS.sh

# Or use CLI
node test-agents-cli.js run all
```

### Using pnpm
```bash
pnpm test:e2e:yolo          # YOLO mode (autonomous)
pnpm test:e2e:all           # Sequential
pnpm test:e2e:parallel      # Parallel
pnpm test:e2e:module --module=auth  # Specific module
pnpm test:e2e:debug         # Debug mode
pnpm test:e2e:report        # View report
```

### Using CLI Tool
```bash
node test-agents-cli.js run all
node test-agents-cli.js run yolo
node test-agents-cli.js run auth
node test-agents-cli.js run flights
node test-agents-cli.js status
node test-agents-cli.js report
```

## Test Modules Detail

### HIGH Priority Modules

#### 1. Authentication (auth)
- **Tests**: login.spec.ts, register.spec.ts, forgot-password.spec.ts
- **Coverage**: Login, registration, password recovery
- **Timeout**: 30s
- **Retries**: 1

#### 2. Flights (flights)
- **Tests**: 7 test files
- **Coverage**: Search, booking, full flow, multi-leg, filters, ancillaries
- **Timeout**: 60s
- **Retries**: 2

#### 3. Hotels (hotels)
- **Tests**: 4 test files
- **Coverage**: Search, booking, full flow
- **Timeout**: 60s
- **Retries**: 2

#### 4. Bookings (bookings)
- **Tests**: 3 test files
- **Coverage**: Management, details, documents
- **Timeout**: 45s
- **Retries**: 1

#### 5. API (api)
- **Tests**: api-error-handling.spec.ts
- **Coverage**: API integration, error handling
- **Timeout**: 30s
- **Retries**: 1

### MEDIUM Priority Modules

#### 6. Profile (profile)
- **Tests**: profile.spec.ts, account-settings.spec.ts
- **Coverage**: User profile, account settings
- **Timeout**: 30s

#### 7. Dashboard (dashboard)
- **Tests**: dashboard.spec.ts
- **Coverage**: Dashboard overview
- **Timeout**: 30s

#### 8. Wallet (wallet)
- **Tests**: wallet.spec.ts
- **Coverage**: Wallet operations
- **Timeout**: 30s

#### 9. Navigation (navigation)
- **Tests**: 3 test files
- **Coverage**: Routing, notifications
- **Timeout**: 30s

#### 10. Forms (forms)
- **Tests**: form-validation.spec.ts
- **Coverage**: Form validation
- **Timeout**: 30s

### LOW Priority Modules

#### 11. Loyalty (loyalty)
- **Tests**: loyalty.spec.ts
- **Coverage**: Loyalty points, tiers
- **Timeout**: 30s

#### 12. Components (components)
- **Tests**: interactive-modals.spec.ts
- **Coverage**: Interactive modals
- **Timeout**: 30s

## Execution Strategies

### 1. YOLO Mode (Recommended)
```bash
pnpm test:e2e:yolo
```
- Fully autonomous
- No interruptions
- Self-healing
- Best for: CI/CD, overnight runs

### 2. Parallel Mode
```bash
pnpm test:e2e:parallel
```
- 3 concurrent agents
- Faster execution
- Best for: Quick feedback

### 3. Sequential Mode
```bash
pnpm test:e2e:all
```
- One-by-one execution
- Safe and predictable
- Best for: Development, debugging

### 4. Debug Mode
```bash
pnpm test:e2e:debug
```
- Interactive UI
- Step-through
- Best for: Troubleshooting

## Docker Execution

### Run all tests
```bash
docker-compose --profile e2e up e2e-runner
```

### Run parallel
```bash
docker-compose --profile e2e-parallel up e2e-parallel
```

### Run specific module
```bash
MODULE_NAME=auth docker-compose --profile e2e-module up e2e-module
```

## CI/CD Integration

### GitHub Actions
Already configured in `.github/workflows/e2e-tests.yml`

### GitLab CI
```yaml
e2e_tests:
  script:
    - pnpm test:e2e:yolo
  artifacts:
    reports:
      - test-results/result.json
```

## Troubleshooting

### Tests failing
```bash
# Run in debug mode
pnpm test:e2e:debug

# Increase timeout
TIMEOUT=60000 pnpm test:e2e
```

### Browser issues
```bash
# Reinstall browsers
pnpm exec playwright install
```

### Missing dependencies
```bash
pnpm install
```

## Reports

### View HTML Report
```bash
pnpm test:e2e:report
```

### Report Locations
- HTML: `apps/booking-engine/playwright-report/index.html`
- JSON: `apps/booking-engine/test-results/result.json`
- Screenshots: `apps/booking-engine/test-results/screenshots/`
- Videos: `apps/booking-engine/test-results/videos/`

## Support

- Documentation: `docs/E2E_TESTING.md`
- Quick Start: `docs/TEST_QUICKSTART.md`
- Test Plan: `docs/TEST_EXECUTION_PLAN.md`
- Agent Assignment: `docs/AGENT_ASSIGNMENT.md`
