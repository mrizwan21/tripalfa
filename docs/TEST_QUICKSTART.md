# Quick Start - E2E Testing

## One-Command Execution

```bash
# Run all tests in autonomous YOLO mode
pnpm test:e2e:yolo
```

## Common Commands

```bash
# All tests (sequential)
pnpm test:e2e:all

# All tests (parallel - faster)
pnpm test:e2e:parallel

# Specific module
pnpm test:e2e:module --module=auth

# Debug mode
pnpm test:e2e:debug

# View report
pnpm test:e2e:report
```

## Shell Script

```bash
# All tests
./tools/scripts/e2e-test-run.sh all

# YOLO mode
./tools/scripts/e2e-test-run.sh yolo

# Specific module
./tools/scripts/e2e-test-run.sh module auth

# Debug
./tools/scripts/e2e-test-run.sh debug
```

## Modules

- `auth` - Authentication
- `flights` - Flight booking
- `hotels` - Hotel booking
- `bookings` - Booking management
- `profile` - User profile
- `dashboard` - Dashboard
- `loyalty` - Loyalty program
- `wallet` - Wallet
- `navigation` - Navigation
- `forms` - Forms
- `components` - Components
- `api` - API integration

## Reports

Reports are automatically generated at:
- HTML: `apps/booking-engine/playwright-report/index.html`
- JSON: `apps/booking-engine/test-results/result.json`

## Requirements

- Node.js >= 18
- pnpm >= 10
- Playwright browsers installed

```bash
# Install browsers (first time only)
pnpm exec playwright install
```
