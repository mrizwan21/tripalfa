# Booking Engine E2E Test Guide

## Prerequisites
- Node.js (v18+ recommended)
- All dependencies installed: `npm install` (at repo root)
- Test database configured and running
- Environment variables set in `.env.test`

## Running E2E Tests
- Run all E2E tests: `npm run test:e2e`
- Run Playwright UI mode: `npm run test:e2e:ui`
- Run a specific test file: `npx playwright test tests/e2e/flight-booking.spec.ts`
- Debug a test: `npm run test:e2e:debug`
- Headed mode: `npm run test:e2e:headed`
- Show HTML report: `npm run test:e2e:report`

## Debugging Failed Tests
- Screenshots and videos are saved in `test-results/`
- Use Playwright Trace Viewer for step-by-step debugging
- Enable inspector: `npx playwright test --debug`

## CI/CD Integration
- (Deferred to Phase 2)

---
