# Phase 3 Testing & Validation Plan

**Date**: April 3, 2026  
**Phase**: 3 - Database Optimization & Transactions  
**Testing Scope**: Connection pooling, transaction isolation, index performance, booking saga retry logic  

---

## Test Execution Plan

### Phase 3A: Configuration Validation

**Duration**: 15 minutes  
**Environment**: Development

```bash
# Test 1: Validate db-optimization.ts exports
npm run build --workspace=@tripalfa/shared-database
# Expected: No TypeScript errors, all functions export correctly

# Test 2: Validate configuration loading
node -e "
import { getDbConfig, getTransactionConfig, printDbConfiguration } from '@tripalfa/shared-database';
printDbConfiguration();
"
# Expected: Prints all 5 database configs with correct values

# Test 3: Validate environment variables
npm run validate:env:phase3
# Expected: No missing required variables, warnings for optional vars
```

### Phase 3B: Connection Pool Testing

**Duration**: 30 minutes  
**Environment**: Staging

#### Test 1: Pool Size Configuration

```bash
# Start services and monitor connection usage
npm run dev --workspace=@tripalfa/booking-engine-service &

# Query 1: Check current connection count
psql -d tripalfa_core -h staging-db -c "
SELECT datname, count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'tripalfa_core' 
GROUP BY datname;
"
# Expected: Should be <= CORE_DB_POOL_MAX (default: 20)

# Query 2: Check pool efficiency
psql -d tripalfa_core -h staging-db -c "
SELECT 
  sum(heap_blks_read) as disk_reads,
  sum(heap_blks_hit) as cache_hits,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
"
# Expected: Cache hit ratio > 90%
```

#### Test 2: Connection Timeout

```bash
# Simulate slow query to test timeout
psql -d tripalfa_core -h staging-db << 'EOF'
SET statement_timeout = '5000 ms';
SELECT * FROM bookings WHERE true;
-- Will timeout after 5 seconds
EOF
# Expected: Timeout error after configured duration
```

#### Test 3: Idle Connection Cleanup

```bash
# Check idle connections are cleaned up
sleep 90  # Wait longer than idle timeout (60s)

psql -d tripalfa_core -h staging-db -c "
SELECT count(*) as idle_connections 
FROM pg_stat_activity 
WHERE state = 'idle' AND datname = 'tripalfa_core';
"
# Expected: Idle connections should be < 5 (cleanup working)
```

---

### Phase 3C: Database Index Testing

**Duration**: 45 minutes  
**Environment**: Staging

#### Test 1: Index Creation & Usage

```sql
-- Verify all indexes created
SELECT indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename IN ('bookings', 'hotels', 'payments')
ORDER BY idx_scan DESC;

-- Expected: All 17 indexes present with increasing scans
```

#### Test 2: Query Performance Comparison

```bash
# Before index usage (force index skip for comparison)
SET enable_indexscan = OFF;
EXPLAIN ANALYZE 
SELECT * FROM bookings WHERE idempotency_key = '550e8400-e29b-41d4-a716-446655440000';
# Old: Seq Scan (500ms+)

# After index usage (normal)
SET enable_indexscan = ON;
EXPLAIN ANALYZE
SELECT * FROM bookings WHERE idempotency_key = '550e8400-e29b-41d4-a716-446655440000';
# New: Index Scan (50ms)
# Expected: 10x faster with index
```

#### Test 3: Batch Lookup Index

```bash
-- Test the critical N+1 elimination index
EXPLAIN ANALYZE
SELECT * FROM hotels 
WHERE (id = ANY(ARRAY['hotel-1', 'hotel-2', 'hotel-3'])) 
   OR (liteapi_id = ANY(ARRAY['liteapi-1', 'liteapi-2', 'liteapi-3']))
WHERE is_active = true;

-- Expected: Index Scan on idx_hotels_batch_lookup
-- Time: < 50ms (vs 500ms without index)
```

---

### Phase 3D: Transaction Isolation Testing

**Duration**: 60 minutes  
**Environment**: Staging

#### Test 1: SERIALIZABLE Isolation on Concurrent Bookings

```bash
#!/bin/bash
# Test concurrent booking creation with same idempotency key

IDEMPOTENCY_KEY="test-550e8400-e29b-41d4-a716-446655440000"

# Start two concurrent booking requests with same key
curl -X POST http://staging:3000/api/bookings \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{...}' &

curl -X POST http://staging:3000/api/bookings \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{...}' &

wait

# Check database - should have ONLY 1 booking created
psql -d tripalfa_core -c "
SELECT COUNT(*) FROM bookings WHERE idempotency_key = '$IDEMPOTENCY_KEY';
"
# Expected: 1 (not 2 - race condition prevented)
```

#### Test 2: Serialization Conflict Retry

```bash
# Simulate two transactions conflicting
psql -d tripalfa_core << 'EOF'
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
UPDATE bookings SET status = 'confirmed' WHERE id = 'booking-1';
-- In another terminal, update same row
-- Expected: Serialization Failure -> Client app retries
COMMIT;
EOF

# Monitor retry behavior in application logs
tail -f logs/booking-saga.log | grep "Serialization conflict"
# Expected: Log shows retry attempt and eventual success
```

#### Test 3: Isolation Level Validation

```bash
-- Verify booking saga uses SERIALIZABLE isolation
SELECT 
  pid, 
  usename, 
  state, 
  query,
  xact_isolation
FROM pg_stat_activity
WHERE query ILIKE '%bookings%'
AND datname = 'tripalfa_core';

-- Expected: xact_isolation = 'serializable'
```

---

### Phase 3E: Enhanced Booking Saga Testing

**Duration**: 90 minutes  
**Environment**: Staging

#### Test 1: Normal Booking Flow

```typescript
// Test successful booking creation
const result = await executeBookingSaga({
  idempotencyKey: 'test-booking-001',
  selectedOffers: ['offer-123'],
  passengers: [{
    id: 'pax-1',
    given_name: 'John',
    family_name: 'Doe',
    email: 'john@test.com',
    phone_number: '+14155552671',
    dateOfBirth: '1990-01-01'
  }]
});

// Expected Results:
// - result.success === true
// - result.bookingRef !== undefined
// - result.duffelOrder !== undefined
// - Database shows booking with status 'confirmed'
// - Execution time: < 5000ms
```

#### Test 2: Idempotency Test

```typescript
// First request
const result1 = await executeBookingSaga({
  idempotencyKey: 'test-booking-002',
  selectedOffers: ['offer-456'],
  passengers: [...]
});

// Identical second request (same idempotency key)
const result2 = await executeBookingSaga({
  idempotencyKey: 'test-booking-002',
  selectedOffers: ['offer-456'],
  passengers: [...]
});

// Expected Results:
// - result1.bookingRef === result2.bookingRef (same booking returned)
// - Only ONE booking created in database
// - result2.success === true (idempotent response)
// - No Duffel order created twice
```

#### Test 3: Retry on Serialization Conflict

```typescript
// Simulate high concurrency causing conflicts
const concurrentBookings = Array(10).fill(null).map((_, i) => 
  executeBookingSaga({
    idempotencyKey: `concurrent-${i}`,
    selectedOffers: ['offer-789'],
    passengers: [...]
  })
);

const results = await Promise.all(concurrentBookings);

// Expected Results:
// - All 10 results.success === true (no failed bookings)
// - Each has unique bookingRef
// - Some requests show retry attempts in logs
// - Total execution time: < 30000ms (30 seconds)
// - Retry rate: < 20% of total requests
```

#### Test 4: Compensation on Failure

```typescript
// Simulate Duffel API failure
// (Mock duffelClient.createOrder to throw error)

const result = await executeBookingSaga({
  idempotencyKey: 'test-fail-001',
  selectedOffers: ['offer-000'],
  passengers: [...]
});

// Expected Results:
// - result.success === false
// - result.error contains failure reason
// - Local booking status = 'failed' (compensation executed)
// - No orphaned Duffel orders
// - Database is in consistent state
```

#### Test 5: Retry With Backoff

```typescript
// Monitor retry behavior with exponential backoff
const startTime = Date.now();
const result = await executeBookingSaga({
  idempotencyKey: 'test-retry-backoff',
  selectedOffers: ['offer-111'],
  passengers: [...]
});
const endTime = Date.now();

// Expected Results:
// - If retried once: Total time = ~1000ms + actual execution
// - If retried twice: Total time = ~1000ms + 2000ms + actual execution
// - Backoff follows pattern: 1s, 2s, 4s (exponential)
// - Max total wait: ~7 seconds for 3 retries
```

---

### Phase 3F: Performance Baseline Testing

**Duration**: 120 minutes  
**Environment**: Staging with production-like load

#### Load Test Setup

```bash
# Run load test with k6
npm run test:load:hotel-search

# Configuration:
# - Duration: 5 minutes
# - VUs (Virtual Users): 100
# - Ramp-up: 30 seconds
# - Ramp-down: 30 seconds
```

#### Load Test Metrics

```
Expected Results (Phase 3 with indexes):

Response Time Percentiles:
- p50 (median): 200ms (down from 5000ms)
- p95 (95th): 500ms (down from 15000ms)
- p99 (99th): 1000ms (down from 30000ms)
- max: 3000ms (down from 60000ms)

Throughput:
- Requests/sec: 2500+ (up from 200)
- Success rate: 99.9%+ (down from 95%)
- Error rate: < 0.1%

Resource Utilization:
- CPU: 30-40%
- Memory: Normal levels  
- Database connections: < 20 (within pool max)
```

---

## Regression Testing

### Critical Flows to Regression Test

#### 1. Flight Search
```bash
# Should still work and be faster
npm run test:api:flight-search

# Expected:
# - Response time: < 2 seconds
# - No errors
# - Results match pre-optimization
```

#### 2. Hotel Search
```bash
# Should be 10x faster
npm run test:api:hotel-search

# Expected:
# - Response time: < 500ms (was 5s)
# - No errors
# - Results identical (just faster)
```

#### 3. Booking Creation
```bash
# Should handle concurrent requests better
npm run test:api:booking-create --concurrency=10

# Expected:
# - No duplicate bookings
# - All requests succeed
# - No race conditions
```

#### 4. Payment Processing
```bash
# Should prevent double-charging
npm run test:api:payment-process --concurrency=5

# Expected:
# - Each payment processed once
# - Consistent ledger
# - No balance errors
```

---

## Rollback Testing

### Verify Rollback Procedure Works

```bash
# Test 1: Index removal
DROP INDEX idx_bookings_idempotency_key;
-- System should still function (just slower)

# Test 2: Old booking saga still works
# git checkout main -- services/booking-engine-service/src/utils/booking-saga.ts
# npm run build
# Should compile and run (without retry logic)

# Test 3: Full rollback
# git revert HEAD
# npm run build
# npm run deploy:staging
# All tests should pass (with Phase 2 performance)
```

---

## Sign-Off Criteria

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Index Creation | ✅ | All 17 indexes created |
| Connection Pool | ✅ | Max connections not exceeded |
| Idempotency | ✅ | No duplicate bookings |
| Serialization | ✅ | No race conditions |
| Retry Logic | ✅ | Automatically retries on conflict |
| Performance | ✅ | 10x improvement on key queries |
| Load Test | ✅ | 2500+ req/s throughput |
| Regression | ✅ | All existing features work |
| Rollback | ✅ | Can revert in < 10 minutes |

---

## Success Criteria

- ✅ Index performance: 10x faster queries
- ✅ Booking saga: Zero duplicate bookings under concurrency
- ✅ Serialization conflicts: < 1% of transactions
- ✅ Load test: Handle 2500+ requests/second
- ✅ Regression: All existing tests pass
- ✅ Rollback: Can revert in < 10 minutes

---

**Phase 3 Testing**: Ready to Execute  
**Estimated Duration**: 6-8 hours total  
**Target Start Date**: April 4, 2026  

