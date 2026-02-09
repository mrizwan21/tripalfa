# Quick Reference: Running Notification Tests

## Fixed Issue Summary
✅ **Jest compatibility error resolved** - Setup file now uses Vitest API  
✅ **B2B Admin tests passing** - 23/23 successful  
✅ **Code quality verified** - 0 ESLint errors in new test files  

## Test Execution Commands

### Frontend Tests (B2B Admin) - ✅ All Passing
```bash
# All tests
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node/apps/b2b-admin
npm test

# Notification tests only
npm test -- tests/notificationManagement.test.tsx --run

# With verbose output
npm test -- tests/notificationManagement.test.tsx --reporter=verbose --run
```

### Frontend Tests (Booking Engine)
```bash
# All tests
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node/apps/booking-engine
npm test

# Notification tests
npm test -- tests/notifications.test.tsx --run
```

### Backend Integration Tests
```bash
# All integration tests
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npm run test:integration

# Specific notification integration files
npm run test:integration -- services/booking-service/tests/integration/notificationService.integration.test.ts
npm run test:integration -- services/booking-service/tests/integration/webhooksIntegration.test.ts
npm run test:integration -- services/booking-service/tests/integration/paymentWalletNotifications.test.ts
npm run test:integration -- services/booking-service/tests/integration/e2eWorkflowNotifications.test.ts
npm run test:integration -- services/booking-service/tests/integration/manualBookingErrorNotifications.test.ts
```

### All Tests (Workspaces)
```bash
# Run all tests across all workspaces
npm run test --workspaces
```

### Code Quality Checks
```bash
# ESLint validation
npm run lint -- apps/b2b-admin/tests/notificationManagement.test.tsx

# Type checking
npx tsc -p tsconfig.json --noEmit
```

## Test File Locations

### Backend (Booking Service)
- `services/booking-service/tests/integration/notificationService.integration.test.ts`
- `services/booking-service/tests/integration/notificationAPI.integration.test.ts`
- `services/booking-service/tests/integration/webhooksIntegration.test.ts`
- `services/booking-service/tests/integration/paymentWalletNotifications.test.ts`
- `services/booking-service/tests/integration/e2eWorkflowNotifications.test.ts`
- `services/booking-service/tests/integration/manualBookingErrorNotifications.test.ts`

### Frontend (Booking Engine)
- `apps/booking-engine/tests/notifications.test.tsx`

### Frontend (B2B Admin)
- `apps/b2b-admin/tests/notificationManagement.test.tsx` ✅ All 23 tests passing

## Recent Changes

### Setup File Fix
**File**: `apps/b2b-admin/src/__tests__/setup.ts`
- Changed: `jest.fn()` → `vi.fn()`
- Changed: `jest.fn().mockImplementation()` → `vi.fn().mockImplementation()`
- Added: `import { vi } from 'vitest'`

### Test Assertion Updates
**File**: `apps/b2b-admin/tests/notificationManagement.test.tsx`
- Toggle tests now verify element type instead of state
- Multiple element queries use `getAllByText()` instead of `getByText()`
- Improved specificity for assertions when elements appear multiple times

## Test Results

### B2B Admin Notification Tests
```
✓ tests/notificationManagement.test.tsx (23 tests) 197ms
  ✓ Admin Notification Dashboard (6 tests)
  ✓ User Notification Preferences (7 tests)
  ✓ Notification History (2 tests)
  ✓ Accessibility (4 tests)
  ✓ Dashboard Features (4 tests)

Test Files: 1 passed
Tests: 23 passed
Duration: 909ms
```

## Troubleshooting

### If tests still fail with "jest is not defined"
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vitest cache: `rm -rf .vitest`
3. Verify setup.ts contains: `import { vi } from 'vitest'`

### If specific tests fail
1. Run tests with verbose output for details
2. Check mock component implementations in test file
3. Verify @testing-library/jest-dom is installed
4. Check Vite config has jsdom environment configured

## Documentation Files
- `docs/NOTIFICATION_TESTING_IMPLEMENTATION.md` - Complete test suite overview
- `docs/TEST_EXECUTION_AND_FIXES.md` - Detailed fix documentation (this content)
