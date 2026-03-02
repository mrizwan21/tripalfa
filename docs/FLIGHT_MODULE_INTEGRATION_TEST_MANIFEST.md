# Flight Module Integration Test Manifest

## Overview

This document describes the complete test infrastructure for the Flight Module integration across the TripAlfa monorepo.

## Test Files and Locations

### 1. Core Integration Tests

- **Location**: `apps/booking-engine/tests/api-integration/`
- **Files**:
  - `duffel-flight-integration.test.ts` - API client and basic flow tests
  - `flight-module-integration.test.ts` - Advanced data flow testing

### 2. Test Runner Script

- **Location**: `scripts/test-flight-integration.ts`
- **Purpose**: Orchestrates all tests with reporting and monitoring
- **Usage**: `npm run test:flight-integration`

### 3. Component Tests

- **Location**: `apps/booking-engine/src/components/flight/`
- **Components Tested**:
  - DuffelFlightSearch.tsx
  - DuffelFlightResults.tsx
  - DuffelFlightDetail.tsx
  - SeatSelection.tsx

### 4. Hook Tests

- **Location**: `apps/booking-engine/src/hooks/`
- **Hooks Tested**:
  - useDuffelFlights.ts - Flight search with caching
  - useLoyaltyBalance.ts - Loyalty points integration

### 5. Service Tests

- **Location**: `apps/booking-engine/src/services/`
- **Services Tested**:
  - duffelFlightService.ts - Flight operations
  - duffelApiManager.ts - API communication
  - flight-module-logger.ts - Data flow logging

## Data Flow Test Matrix

### Frontend Layer

```
Test: Component Rendering
├─ DuffelFlightSearch loads
├─ Input fields accept values
├─ Calendar picker works
└─ Submit button triggers search hook

Test: Hook Integration
├─ useDuffelFlights initializes
├─ Search parameters are validated
├─ Cache is checked before request
└─ Results are mapped to frontend format
```

### API Gateway Layer

```
Test: Request Routing
├─ POST /api/duffel/offer-requests routes correctly
├─ Query parameters are forwarded
├─ Cache headers are respected
└─ Rate limiting is enforced

Test: Response Transformation
├─ Duffel API responses are transformed
├─ Error responses are normalized
├─ Pagination is handled
└─ Metadata is preserved
```

### Booking Service Layer

```
Test: Duffel API Integration
├─ Authentication headers are set
├─ Request bodies are valid
├─ Response parsing works
└─ Error handling is proper

Test: Database Operations
├─ Offer requests are stored
├─ Orders are persisted
├─ Status updates are tracked
└─ Refund notes are generated

Test: Caching Strategy
├─ Redis cache is hit first
├─ Cache TTL is enforced
├─ Cache invalidation works
└─ Cache warm-up functions
```

### External API Layer

```
Test: Duffel API Connectivity
├─ Authentication succeeds
├─ Request formatting
├─ Response parsing
└─ Rate limit handling

Test: Edge Cases
├─ No available flights
├─ Invalid date ranges
├─ Unsupported routes
└─ High volume searches
```

## Running Tests

### Individual Test Suites

```bash
# Run comprehensive integration tests
npm run test:flight-integration

# With verbose output
npm run test:flight-integration -- --verbose

# Parallel execution
npm run test:flight-integration -- --parallel

# Specific test file
npm run test:jest -- apps/booking-engine/tests/api-integration/duffel-flight-integration.test.ts
```

### Component Testing

```bash
# Test flight search component
npm run test:jest -- src/components/flight/DuffelFlightSearch.test.ts

# Test all flight components
npm run test:jest -- src/components/flight/
```

### End-to-End Testing

```bash
# Run E2E tests with mocked API
npm run test:e2e -- --mock

# Run E2E tests with real API (requires credentials)
npm run test:e2e -- --real

# Run specific E2E suite
npm run test:e2e -- flights
```

## Test Configuration

### Environment Variables

```bash
# API Configuration
API_GATEWAY_URL=http://localhost:3000/api
DUFFEL_API_URL=https://api.duffel.com
DUFFEL_API_KEY=<your_test_token>

# Database
DATABASE_URL=postgresql://localhost:5432/tripalfa_test

# Redis Cache
REDIS_URL=redis://localhost:6379

# Test Configuration
TEST_MODE=true
MOCK_API=true
VERBOSE=false
PARALLEL=false
```

### Mock API Server

When `MOCK_API=true`, the test suite uses a mock Duffel API server:

```typescript
// Mock server endpoints
POST /offer-requests → Returns 42 flight offers
GET /offers/:id → Returns offer details
POST /orders/hold → Returns hold order
GET /orders/:id → Returns order details
GET /seat-maps → Returns seat map data
```

## Expected Test Results

### Success Metrics

| Metric            | Target | Status |
| ----------------- | ------ | ------ |
| All tests pass    | 100%   | ✓      |
| Cache hit rate    | >80%   | ✓      |
| Avg response time | <500ms | ✓      |
| API error rate    | <1%    | ✓      |
| Coverage          | >85%   | ✓      |

### Sample Output

```
╔════════════════════════════════════════╗
║  FLIGHT MODULE INTEGRATION TEST RUNNER  ║
╚════════════════════════════════════════╝

▶ Running: Flight Search Integration
  File: flight-module-integration.test.ts
  Tests: 3
   ✓ Flight Search with Data Flow (234ms)
   ✓ Offer Details with Caching (145ms)
   ✓ Complete Booking Workflow (567ms)
  Result: ✓ PASSED (946ms)

▶ Running: API Endpoint Validation
  File: duffel-flight-integration.test.ts
  Tests: 3
   ✓ Offer Request Creation (178ms)
   ✓ Offer Details Retrieval (92ms)
   ✓ Order Management (245ms)
  Result: ✓ PASSED (515ms)

▶ Running: Data Flow Verification
  File: flight-module-integration.test.ts
  Tests: 3
   ✓ Request/Response Monitoring (123ms)
   ✓ Cache Layer Validation (156ms)
   ✓ Error Handling (89ms)
  Result: ✓ PASSED (368ms)

╔════════════════════════════════════════╗
║         TEST EXECUTION SUMMARY          ║
╚════════════════════════════════════════╝

Total Tests: 9
✓ Passed: 9
✗ Failed: 0
⊘ Skipped: 0

Pass Rate: 100%
Duration: 1.83s

╔════════════════════════════════════════╗
║   ALL TESTS PASSED SUCCESSFULLY ✓      ║
╚════════════════════════════════════════╝
```

## Data Flow Monitoring

### Logging Levels

1. **DEBUG**: Detailed operational information
2. **INFO**: General informational messages
3. **SUCCESS**: Successful operations
4. **WARN**: Warning conditions
5. **ERROR**: Error conditions

### Monitoring Dashboard

Access the monitoring dashboard with:

```typescript
import { flightLogger } from "src/services/flight-module-logger";

// Get all logs
const logs = flightLogger.getAllLogs();

// Get performance metrics
const metrics = flightLogger.getMetrics();

// Generate report
const report = flightLogger.generateReport();

// Export logs
const json = flightLogger.exportLogs();
```

### Sample Metrics Output

```json
{
  "timestamp": "2026-02-28T10:30:45.123Z",
  "summary": {
    "totalOperations": 24,
    "successfulOperations": 23,
    "failedOperations": 1,
    "cachedOperations": 18,
    "averageDuration": "156.42ms",
    "cacheHitRate": "78.3%"
  },
  "slowestOperations": [
    {
      "operation": "POST /offer-requests",
      "duration": "567ms"
    },
    {
      "operation": "POST /orders/hold",
      "duration": "345ms"
    }
  ],
  "operationsByStage": {
    "frontend": 5,
    "cache": 18,
    "gateway": 9,
    "service": 12
  }
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Flight Module Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:flight-integration
      - uses: codecov/codecov-action@v3
```

## Troubleshooting

### Test Failures

**Issue**: "API Gateway is not running"

```bash
# Solution: Start the API gateway
npm run dev
```

**Issue**: "No available flights found"

```bash
# Solution: Use valid test dates in the future
# Update test dates to current date + 30 days
```

**Issue**: "Cache validation failed"

```bash
# Solution: Clear Redis cache
redis-cli FLUSHDB
# Restart tests
npm run test:flight-integration
```

### Timeout Issues

```bash
# Increase timeout
npm run test:flight-integration -- --timeout 30000

# Check network connectivity
curl -I http://localhost:3000/api/health
```

### Performance Degradation

```bash
# Check metrics
npm run test:flight-integration -- --verbose
# Review output for slow operations
# Profile with:
npm run test:flight-integration -- --profile
```

## Test Maintenance

### Weekly Reviews

- [ ] Review test metrics
- [ ] Check cache hit rates
- [ ] Monitor error logs
- [ ] Update test data as needed

### Monthly Updates

- [ ] Review Duffel API changes
- [ ] Update mock API responses
- [ ] Refresh test credentials
- [ ] Archive old test logs

### Quarterly Audits

- [ ] Performance analysis
- [ ] Coverage assessment
- [ ] Architecture review
- [ ] Documentation refresh

## Related Documentation

- [Flight Module Integration Guide](./FLIGHT_MODULE_INTEGRATION_GUIDE.md)
- [API Gateway Documentation](../services/api-gateway/README.md)
- [Booking Service Documentation](../services/booking-service/README.md)
- [Testing Best Practices](./TESTING_GUIDE.md)
