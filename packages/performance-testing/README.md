# 📊 Performance Testing Framework

Comprehensive performance benchmarking suite for TripAlfa's critical payment, booking, database, and API gateway services.

## Overview

This framework provides:

- **Automated Benchmarks**: Vitest-based benchmarking for critical paths
- **Regression Detection**: Automatic detection of performance regressions
- **Baseline Tracking**: Historical baseline comparisons
- **CI/CD Integration**: GitHub Actions workflow for automated testing
- **Report Generation**: Multiple report formats (console, JSON, Markdown)

## Benchmarked Services

### 1. **Payment Service** (`src/benchmarks/payment.bench.ts`)

Critical financial transaction benchmarks:

| Benchmark | Target | Threshold |
|-----------|--------|-----------|
| Payment Validation | 500ms | ±10% |
| Payment Processing | 800ms | ±12% |
| Refund Processing | 600ms | ±12% |
| Wallet Operations | 300ms | ±10% |
| Currency Conversion | 150ms | ±5% |
| Multi-Currency Reconciliation | 1000ms | ±15% |
| Transaction History Query | 200ms | ±5% |
| Dispute Processing | 1500ms | ±20% |
| Payment Audit Trail | 250ms | ±5% |

### 2. **Booking Service** (`src/benchmarks/booking.bench.ts`)

Flight and hotel booking orchestration:

| Benchmark | Target | Threshold |
|-----------|--------|-----------|
| Flight Search | 3000ms | ±20% |
| Booking Creation | 2000ms | ±15% |
| Hotel Rate Fetch | 5000ms | ±25% |
| Hotel Hold Creation | 1500ms | ±15% |
| Itinerary Assembly | 800ms | ±10% |
| Multi-City Orchestration | 4000ms | ±15% |
| Price Update | 500ms | ±10% |
| Booking Modification | 1200ms | ±15% |
| Cancellation Processing | 1000ms | ±15% |
| Rebooking Orchestration | 3000ms | ±20% |
| Trip History Query | 400ms | ±5% |

### 3. **Database** (`src/benchmarks/database.bench.ts`)

Query performance and data access patterns:

| Benchmark | Target | Threshold |
|-----------|--------|-----------|
| SELECT Single Record | 50ms | ±5% |
| SELECT with Joins | 100ms | ±5% |
| INSERT Multiple Records | 200ms | ±10% |
| UPDATE Batch | 150ms | ±10% |
| DELETE with Cascade | 250ms | ±15% |
| Complex Aggregation | 300ms | ±10% |
| Transaction Commit | 100ms | ±5% |
| Connection Pool Acquire | 5ms | ±10% |
| Prepared Statement Execution | 30ms | ±5% |
| Full Text Search | 500ms | ±20% |
| Index Scan | 75ms | ±5% |

### 4. **API Gateway** (`src/benchmarks/api.bench.ts`)

Request routing, authentication, and response handling:

| Benchmark | Target | Threshold |
|-----------|--------|-----------|
| JWT Authentication | 50ms | ±10% |
| Rate Limiting Check | 10ms | ±5% |
| Route Matching | 5ms | ±10% |
| Request Validation | 100ms | ±10% |
| Error Response | 20ms | ±5% |
| Successful Response | 150ms | ±10% |
| CORS Preflight | 5ms | ±10% |
| API Key Verification | 30ms | ±10% |
| Request Logging | 5ms | ±10% |

## Quick Start

### Run All Benchmarks

```bash
# From workspace root
npm run bench --workspace=@tripalfa/performance-testing

# Or from the package directory
cd packages/performance-testing
pnpm bench
```

### Run Specific Service Benchmarks

```bash
# Payment service only
pnpm perf:payment

# Booking service only
pnpm perf:booking

# Database benchmarks only
pnpm perf:database

# API Gateway benchmarks only
pnpm perf:api
```

### Watch Mode (Live Development)

```bash
# Watch benchmarks as you modify them
pnpm bench:watch

# Or with UI
pnpm bench:ui
```

### Generate Reports

```bash
# Console output (default)
pnpm report

# JSON report
pnpm report:json

# Markdown report (auto-saved)
pnpm report:md

# Compare against baseline
pnpm report:compare

# Strict mode (fail if regressions)
pnpm report:strict
```

### Baseline Management

```bash
# Initialize first baseline
pnpm baseline:init

# Reset baseline to current results
pnpm baseline:reset
```

## Report Interpretation

### Performance Metrics

Each benchmark provides:

- **Mean**: Average execution time (primary metric)
- **Median**: Middle value (less affected by outliers)
- **Min/Max**: Best and worst observed times
- **StdDev**: Standard deviation (consistency indicator)
- **Ops/sec**: Operations per second (throughput)
- **Samples**: Number of iterations run

### Regression Severity

Regressions are classified by slowdown:

- 🔴 **CRITICAL**: >30% slower than baseline
- 🟠 **HIGH**: >20% slower than baseline
- 🟡 **MEDIUM**: >10% slower than baseline

### Recommendations

Common issues and solutions:

- **High Variance** (red flag 🚩): Inconsistent results suggest environmental issues
  - Solution: Increase sample size or isolate from other processes
- **Threshold Exceeded**: Performance outside acceptable range
  - Solution: Investigate code changes, optimize bottlenecks
- **Regression Detected**: Performance degraded vs baseline
  - Solution: Identify problematic changes, profile with DevTools

## CI/CD Integration

### Automatic Testing on Pull Requests

The GitHub Actions workflow automatically:

1. ✅ Runs all benchmarks on PR submission
2. 📊 Compares results against main branch baseline
3. 💬 Comments on PR with performance report
4. 🔴 Fails if critical regressions detected
5. 📁 Uploads benchmark results as artifacts

### View Results

- **In PR Comments**: Performance summary appears automatically
- **In Artifacts**: Full results available in Actions artifacts
- **In Reports**: `benchmark-results/report.md` generated

## Development Guidelines

### Adding New Benchmarks

1. **Create benchmark file** in `src/benchmarks/`
2. **Follow naming convention**: `feature.bench.ts`
3. **Define thresholds** in `/src/types.ts`
4. **Add package script** to `package.json`
5. **Document expectations** in benchmark comments

Example:

```typescript
import { describe, bench, expect } from 'vitest';

describe('My Feature Benchmarks', () => {
  bench('operation name', () => {
    // Setup (not counted in time)
    const data = { /* ... */ };

    // Benchmark runs multiple times automatically
    const result = myFunction(data);

    // Verify correctness
    expect(result).toBeDefined();
  });
});
```

### Performance Tuning Process

1. **Establish Baseline**: Run benchmarks before changes
2. **Make Changes**: Implement optimization
3. **Run Again**: Compare results
4. **Iterate**: Refine until threshold met
5. **Commit**: Record baseline with changes

## Configuration

### Threshold Configuration (`src/types.ts`)

```typescript
thresholds: {
  'benchmark-name': {
    expectedMs: 500,      // Expected mean time
    allowedDeviation: 10,  // Percentage deviation allowed
    maxMs: 600            // Hard limit (optional)
  }
}
```

### Regression Threshold

Default: 10% (change to `regressionThreshold` in config)

### Sample Size

Controlled by Vitest. Increase runs with: `--reporter=verbose`

## Common Tasks

### Check if PR degraded performance

```bash
npm run report:compare --workspace=@tripalfa/performance-testing
```

### Debug slow benchmark

```bash
# Run with profiling info
pnpm bench:watch

# Use Vitest UI to visualize
pnpm bench:ui
```

### Compare two runs

```bash
# Manually load a previous result
pnpm report --baseline benchmark-results/previous.json
```

### Add new service to CI/CD

1. Create `src/benchmarks/service.bench.ts`
2. Add thresholds to `src/types.ts`
3. Add package script: `"perf:service": "vitest bench --run src/benchmarks/service.bench.ts"`
4. Workflow auto-detects on next push

## Troubleshooting

### High Variance in Results

**Cause**: System load, environment noise  
**Solution**:

- Run on dedicated machine
- Increase sample size: `sample: 1000`
- Check for background processes

### Threshold Exceeded

**Cause**: Legitimate slowdown or false high variance  
**Solution**:

- Profile code with DevTools
- Review recent commits
- Consider adjusting thresholds if justified

### Baseline Mismatch

**Cause**: Comparing against outdated baseline  
**Solution**:

- Run `pnpm baseline:init`
- Merge main before PR testing

### CI/CD Failures

**Cause**: Critical regression detected  
**Solution**:

- Review Changes since last baseline
- Run `pnpm report:compare` locally
- Either optimize code or justify threshold change

## Performance Best Practices

### When Adding Features

1. Establish baseline benchmark
2. Implement with performance in mind
3. Verify no regressions before PR
4. Document performance impact

### For Critical Paths

1. Set conservative thresholds
2. Monitor regularly (weekly)
3. Profile under production-like load
4. Test with realistic data volumes

### Testing Environment

- Use same Node.js version as production
- Disable background processes
- Use consistent machine/cloud resources
- Run during low-activity times

## Monitoring Over Time

Results are automatically tracked and stored. Review:

- **Monthly**: Identify trending degradations
- **Quarterly**: Review threshold relevance
- **Annually**: Assess framework effectiveness

## Additional Resources

- [Vitest Benchmarking Docs](https://vitest.dev/guide/benchmark.html)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [TripAlfa README](../../README.md)

## Support

For issues or questions:

- Review this documentation
- Check benchmark output for hints
- Profile with Node.js DevTools
- Consult team performance guidelines
