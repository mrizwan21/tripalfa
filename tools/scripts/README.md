# Multi-Agent E2E Testing System

Autonomous end-to-end testing system for TripAlfa with multi-agent parallel execution capabilities.

## Features

✅ **Multi-Agent Architecture** - Distributed test execution across multiple agents  
✅ **YOLO Mode** - Fully autonomous execution without human intervention  
✅ **Parallel Execution** - Run tests in parallel for faster feedback  
✅ **Module-Based** - Organized by functional modules  
✅ **Self-Healing** - Automatic retries and error recovery  
✅ **Comprehensive Reporting** - HTML, JSON, screenshots, videos, and traces  

## Quick Start

```bash
# Run all tests in YOLO mode (recommended)
pnpm test:e2e:yolo

# Run all tests sequentially
pnpm test:e2e:all

# Run tests in parallel
pnpm test:e2e:parallel

# Run specific module
pnpm test:e2e:module --module=auth
```

## Test Modules

| Module | Command | Description |
|--------|---------|-------------|
| Auth | `pnpm test:e2e:module --module=auth` | Authentication & Authorization |
| Flights | `pnpm test:e2e:module --module=flights` | Flight Search & Booking |
| Hotels | `pnpm test:e2e:module --module=hotels` | Hotel Search & Booking |
| Bookings | `pnpm test:e2e:module --module=bookings` | Booking Management |
| Profile | `pnpm test:e2e:module --module=profile` | User Profile Management |
| Dashboard | `pnpm test:e2e:module --module=dashboard` | Dashboard & Analytics |
| Loyalty | `pnpm test:e2e:module --module=loyalty` | Loyalty Program |
| Wallet | `pnpm test:e2e:module --module=wallet` | Wallet & Payments |
| Navigation | `pnpm test:e2e:module --module=navigation` | Navigation & Routing |
| Forms | `pnpm test:e2e:module --module=forms` | Form Validation |
| Components | `pnpm test:e2e:module --module=components` | Interactive Components |
| API | `pnpm test:e2e:module --module=api` | API Integration |

## Execution Modes

### YOLO Mode (Autonomous)
```bash
pnpm test:e2e:yolo
```
- Fully autonomous execution
- No human intervention required
- Self-healing with automatic retries
- Runs all modules sequentially

### Parallel Mode
```bash
pnpm test:e2e:parallel
```
- Executes multiple agents in parallel
- Faster execution time
- Resource intensive

### Sequential Mode
```bash
pnpm test:e2e:all
```
- Runs all tests one by one
- Safe and reliable
- Slower but more predictable

### Debug Mode
```bash
pnpm test:e2e:debug
```
- Interactive debugging
- Step-through execution
- Time-travel debugging

## Architecture

```
┌─────────────────────────────────────────┐
│         Test Orchestrator               │
│    (e2e-orchestrator.js)                │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Parallel Agent Executor            │
│  (parallel-agent-executor.js)           │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Test Agents                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │Auth│ │Flight│ │Hotel│ │...│ │...│   │
│  └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

## Scripts

| Script | Description |
|--------|-------------|
| `tools/scripts/e2e-test-runner.js` | Main test runner with multiple modes |
| `tools/scripts/e2e-orchestrator.js` | Orchestrates multiple test agents |
| `tools/scripts/parallel-agent-executor.js` | Parallel execution engine |
| `tools/scripts/autonomous-agent.js` | Single autonomous agent |
| `tools/scripts/e2e-test-run.sh` | Shell script wrapper |

## Configuration

Edit `tools/scripts/e2e.config.js` to customize:
- Timeouts
- Parallelization settings
- Reporting options
- Module priorities

## Reports

### Viewing Reports
```bash
pnpm test:e2e:report
```

### Report Locations
- **HTML Report**: `apps/booking-engine/playwright-report/index.html`
- **JSON Results**: `apps/booking-engine/test-results/result.json`
- **Screenshots**: `apps/booking-engine/test-results/screenshots/`
- **Videos**: `apps/booking-engine/test-results/videos/`
- **Traces**: `apps/booking-engine/test-results/traces/`

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

## Troubleshooting

### Install Browsers
```bash
pnpm exec playwright install
```

### Debug Specific Test
```bash
pnpm test:e2e:debug -- tests/e2e/auth/login.spec.ts
```

### Increase Timeout
```bash
TIMEOUT=60000 pnpm test:e2e
```

### View Test Output
```bash
pnpm test:e2e:headed
```

## Documentation

- [Quick Start Guide](docs/TEST_QUICKSTART.md)
- [Test Execution Plan](docs/TEST_EXECUTION_PLAN.md)
- [E2E Testing Guide](docs/E2E_TESTING.md)

## Requirements

- Node.js >= 18.0.0
- pnpm >= 10.0.0
- Playwright browsers

## Development

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Run tests
pnpm test:e2e:yolo
```

## License

Proprietary - TripAlfa
