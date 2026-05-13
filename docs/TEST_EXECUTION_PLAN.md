# Test Execution Plan

## Overview

This document outlines the multi-agent E2E testing strategy for TripAlfa, designed for autonomous execution in YOLO mode without human intervention.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 Test Orchestrator                          │
│  (tools/scripts/e2e-orchestrator.js)                       │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              Parallel Agent Executor                       │
│  (tools/scripts/parallel-agent-executor.js)                │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    Test Agents                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │ Auth │ │Flight│ │Hotel │ │Booking│ │Profile│            │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │Dash  │ │Loyalty│ │Wallet│ │Nav   │ │Forms │             │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
└────────────────────────────────────────────────────────────┘
```

## Test Modules

### Priority: HIGH
- **auth** - Authentication & Authorization
  - Login, Register, Forgot Password
  - Dependencies: None
  - Timeout: 30s

- **flights** - Flight Search & Booking
  - Flight Search, List, Booking, Full Flow, Multi-leg, Filters, Ancillaries
  - Dependencies: auth
  - Timeout: 60s

- **hotels** - Hotel Search & Booking
  - Hotel List, Search, Booking, Full Flow
  - Dependencies: auth
  - Timeout: 60s

- **bookings** - Booking Management
  - Booking Management, Detail, Documents
  - Dependencies: auth
  - Timeout: 45s

- **api** - API Integration
  - API Error Handling
  - Dependencies: None
  - Timeout: 30s

### Priority: MEDIUM
- **profile** - User Profile Management
  - Profile, Account Settings
  - Dependencies: auth
  - Timeout: 30s

- **dashboard** - Dashboard & Analytics
  - Dashboard Overview
  - Dependencies: auth
  - Timeout: 30s

- **wallet** - Wallet & Payments
  - Wallet Operations
  - Dependencies: auth
  - Timeout: 30s

- **navigation** - Navigation & Routing
  - Routing, Notifications, Alerts
  - Dependencies: None
  - Timeout: 30s

- **forms** - Form Validation
  - Form Validation
  - Dependencies: None
  - Timeout: 30s

### Priority: LOW
- **loyalty** - Loyalty Program
  - Loyalty Points & Tiers
  - Dependencies: auth
  - Timeout: 30s

- **components** - Interactive Components
  - Interactive Modals
  - Dependencies: None
  - Timeout: 30s

## Execution Modes

### 1. Sequential Mode
```bash
pnpm test:e2e:sequential
```
- Runs all modules one by one
- Safe and reliable
- Slower execution

### 2. Parallel Mode
```bash
pnpm test:e2e:parallel
```
- Runs 3 agents in parallel
- Faster execution
- Resource intensive

### 3. YOLO Mode
```bash
pnpm test:e2e:yolo
```
- Fully autonomous
- Self-healing with retries
- No human intervention
- Recommended for CI/CD

### 4. Module-Specific
```bash
pnpm test:e2e:module --module=auth
```
- Run specific module tests
- Good for development

## Agent Configuration

Each agent runs with:
- Isolated browser context
- Independent test data
- Automatic cleanup
- Screenshot on failure
- Video recording on failure
- Trace collection

### Retry Strategy
- Default retries: 1
- CI mode retries: 2
- YOLO mode retries: 2
- Timeout per test: 30-60s (module dependent)

## Execution Schedule

### Development
```bash
# Run before committing
pnpm test:e2e:smoke

# Run specific module
pnpm test:e2e:module --module=auth
```

### CI/CD Pipeline
```bash
# Full test suite
pnpm test:e2e:ci

# Or parallel execution
pnpm test:e2e:parallel
```

### Pre-deployment
```bash
# Complete validation
pnpm test:e2e:yolo
```

## Test Data Management

### Setup
- Each agent creates its own test data
- Data is tagged with unique test ID
- Automatic cleanup after test

### Isolation
- No shared state between agents
- Independent browser contexts
- Separate storage states

## Reporting

### Output Locations
- HTML Report: `apps/booking-engine/playwright-report/index.html`
- JSON Results: `apps/booking-engine/test-results/result.json`
- Screenshots: `apps/booking-engine/test-results/screenshots/`
- Videos: `apps/booking-engine/test-results/videos/`
- Traces: `apps/booking-engine/test-results/traces/`

### Viewing Reports
```bash
pnpm test:e2e:report
```

## Troubleshooting

### Common Issues

#### Test Timeout
```bash
# Increase timeout
TIMEOUT=60000 pnpm test:e2e:module --module=flights
```

#### Flaky Tests
```bash
# Run in CI mode with retries
pnpm test:e2e:ci
```

#### Missing Dependencies
```bash
# Install dependencies
pnpm install
```

#### Browser Issues
```bash
# Install browsers
pnpm exec playwright install
```

## Best Practices

1. **Run tests frequently** - Run smoke tests before committing
2. **Use appropriate mode** - Choose sequential for safety, parallel for speed
3. **Check reports** - Always review test reports for failures
4. **Isolate tests** - Each test should be independent
5. **Clean up** - Ensure tests clean up after themselves

## Monitoring

### Success Metrics
- Pass rate > 95%
- Execution time < 30 minutes
- Flaky tests < 2%

### Alerting
- CI/CD pipeline failures
- Test duration exceeding threshold
- Pass rate dropping below threshold

## Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: pnpm test:e2e:ci
```

### GitLab CI
```yaml
e2e:
  script:
    - pnpm test:e2e:ci
```

### Jenkins
```groovy
sh 'pnpm test:e2e:ci'
```

## Support

For issues:
1. Check test logs
2. Review trace files
3. Run in debug mode
4. Check documentation: `docs/E2E_TESTING.md`
