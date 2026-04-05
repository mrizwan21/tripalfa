# KYC Test Suite - Quick Start

> **Status:** ✅ Configuration Complete - Ready to Run Tests

All test configuration issues have been fixed. Here's how to run your KYC tests locally.

---

## 🚀 Quick Start

### Install Dependencies

```bash
cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node"
npm install
# OR
pnpm install
```

### Run Backend Tests (KYC Service)

```bash
# Unit & Integration Tests
npm run test --workspace=@tripalfa/kyc-service

# Watch Mode
npm run test:watch --workspace=@tripalfa/kyc-service

# With Coverage
npm run test:coverage --workspace=@tripalfa/kyc-service
```

### Run Frontend Tests (B2B Admin)

```bash
# Unit & API Tests Only
npm run test --workspace=@tripalfa/b2b-admin -- kycApi.test.ts

# Watch Mode
npm run test:watch --workspace=@tripalfa/b2b-admin

# All tests with coverage
npm run test -- --coverage --workspace=@tripalfa/b2b-admin
```

### Run E2E Tests (Playwright)

```bash
# First, start the app
npm run dev --workspace=@tripalfa/b2b-admin

# In another terminal, run E2E tests
npm run test:e2e --workspace=@tripalfa/b2b-admin

# Or with UI
npm run test:e2e:ui --workspace=@tripalfa/b2b-admin

# Or headed mode (watch in real browser)
npm run test:e2e:headed --workspace=@tripalfa/b2b-admin
```

---

## 📊 Test Files & Expected Results

### Backend Tests

#### Unit Tests: `kyc.service.spec.ts`

```bash
npm run test --workspace=@tripalfa/kyc-service -- kyc.service.spec.ts

Expected Output:
✓ 20+ tests passing
✓ All service methods tested
✓ Mocking working correctly
```

**What it tests:**

- `submitKYC()` - Submission logic
- `approveKYC()` - Approval workflow
- `rejectKYC()` - Rejection workflow
- `getKYCStatus()` - Status retrieval
- `exportKYCData()` - CSV/JSON export
- All edge cases and validations

#### Integration Tests: `kyc.api.spec.ts`

```bash
npm run test --workspace=@tripalfa/kyc-service -- kyc.api.spec.ts

Expected Output:
✓ 25+ tests passing
✓ All API endpoints tested
✓ HTTP status codes validated
✓ Error handling verified
```

**What it tests:**

- All KYC API endpoints
- Request/response formats
- Pagination
- Error responses

### Frontend Tests

#### API Client Tests: `kycApi.test.ts`

```bash
npm run test --workspace=@tripalfa/b2b-admin -- kycApi.test.ts

Expected Output:
✓ 20+ tests passing
✓ API methods working
✓ Error handling correct
```

**What it tests:**

- Frontend API service methods
- Request construction
- Response handling
- Error transformation

#### E2E Tests: `kyc-flows.spec.ts`

```bash
# Start app first
npm run dev --workspace=@tripalfa/b2b-admin &

# Then run E2E
npm run test:e2e --workspace=@tripalfa/b2b-admin

Expected Output:
✓ 30+ tests passing
✓ All user flows working
✓ UI interactions verified
```

**What it tests:**

- KYC submission flow (8 tests)
- Status checking (7 tests)
- Admin dashboard (12 tests)
- Navigation (2 tests)

---

## 🔧 Test Configuration Fixed

### ✅ What was fixed:

1. **Created** `apps/b2b-admin/src/__tests__/setup.ts`
   - localStorage mock
   - window.matchMedia mock
   - Proper cleanup after each test

2. **Created** `services/kyc-service/vitest.config.ts`
   - Node environment for backend
   - Proper test file patterns
   - Coverage configuration

3. **Created** `services/kyc-service/src/__tests__/setup.ts`
   - Mock console methods
   - Proper cleanup

4. **Updated** `apps/b2b-admin/vitest.config.ts`
   - Exclude E2E tests from unit test runs
   - Proper setupFiles path

5. **Updated** `services/kyc-service/package.json`
   - Added test scripts
   - Added testing dependencies

---

## 🎯 Test Execution Order

### Option 1: Run Everything

```bash
# Run all tests in the monorepo
npm test

# This will fail on wallet-service (known issue) but KYC tests will run
```

### Option 2: Run KYC Tests Only

```bash
# Backend tests
npm run test --workspace=@tripalfa/kyc-service

# Frontend tests
npm run test --workspace=@tripalfa/b2b-admin -- kyc

# Then E2E (requires app running)
npm run dev --workspace=@tripalfa/b2b-admin &
npm run test:e2e --workspace=@tripalfa/b2b-admin
```

### Option 3: Recommended Development Flow

```bash
# Terminal 1: Watch backend tests
npm run test:watch --workspace=@tripalfa/kyc-service

# Terminal 2: Watch frontend tests
npm run test:watch --workspace=@tripalfa/b2b-admin

# Terminal 3: Run app
npm run dev --workspace=@tripalfa/b2b-admin

# Terminal 4: Run E2E tests (after app is running)
npm run test:e2e --workspace=@tripalfa/b2b-admin
```

---

## 📋 Pre-Test Checklist

Before running tests, ensure:

- [ ] Node.js 18+ installed: `node --version`
- [ ] Dependencies installed: `npm install` or `pnpm install`
- [ ] No other apps running on port 3011 (KYC service)
- [ ] No other apps running on port 5173 (B2B Admin frontend)
- [ ] Proper environment variables set in `.env`

---

## 🔍 Troubleshooting

### Issue: Tests not found

```bash
# Solution: Install dependencies
npm install

# Clear cache
npm run test -- --clearCache
```

### Issue: Port already in use

```bash
# Kill process
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev --workspace=@tripalfa/b2b-admin -- --port 5174
```

### Issue: E2E tests timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds

# Run with more verbose output
npm run test:e2e --workspace=@tripalfa/b2b-admin -- --verbose
```

### Issue: Setup file not found

```bash
# Ensure file exists
ls apps/b2b-admin/src/__tests__/setup.ts

# If not, create it again
npm install
```

---

## ✨ Test Summary

| Layer       | Framework          | Count   | Status       |
| ----------- | ------------------ | ------- | ------------ |
| Unit        | Vitest             | 20+     | ✅ Ready     |
| Integration | Vitest + Supertest | 25+     | ✅ Ready     |
| Frontend    | Vitest             | 20+     | ✅ Ready     |
| E2E         | Playwright         | 30+     | ✅ Ready     |
| **Total**   | -                  | **95+** | **✅ Ready** |

---

## 🎓 Environment Variables

Ensure your `.env` file has:

```bash
# KYC Service
KYC_SERVICE_PORT=3011
JWT_SECRET=test-secret-key
DATABASE_URL_CORE=postgresql://postgres:postgres@localhost:5432/tripalfa_core

# B2B Admin
VITE_API_URL=http://localhost:3000
VITE_KYC_SERVICE_URL=http://localhost:3011
```

---

## 📚 More Resources

- [Full Testing Guide](./KYC_TESTING_GUIDE.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [KYC Integration Guide](./KYC_INTEGRATION_GUIDE.html)

---

## 🎉 Ready to Test!

All configuration is complete. Your test suite is ready to run!

**Start with:**

```bash
npm run test --workspace=@tripalfa/kyc-service
```

Then watch the terminal for results. 🚀
