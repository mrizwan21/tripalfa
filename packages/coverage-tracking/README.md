# 📊 Unit Test Coverage Tracking

Comprehensive test coverage monitoring for TripAlfa's 12 microservices, 2 applications, and 9 shared packages. Automatically detects coverage regressions and integrates with GitHub Actions for CI/CD.

## Features

✨ **Automated Coverage Tracking** - Monitor coverage per service in real-time  
✨ **Regression Detection** - Fail PRs with critical coverage drops  
✨ **Baseline Comparison** - Track coverage trends over time  
✨ **Multi-Format Reports** - Console, JSON, Markdown output  
✨ **Service-Level Thresholds** - Custom requirements per service  
✨ **CI/CD Integration** - GitHub Actions automation  
✨ **Statistical Analysis** - Overall, per-service, per-file metrics  

## Quick Start

### Installation

```bash
# Dependencies already included in workspace
npm install

# Install coverage provider if needed
pnpm add -D @vitest/coverage-v8
```

### Run Coverage Reports

```bash
# Generate coverage for all services
npm run coverage --workspace=@tripalfa/coverage-tracking

# Watch mode
pnpm coverage:watch

# Interactive UI
pnpm coverage:ui

# Generate reports
pnpm coverage:report              # Console + Markdown
pnpm coverage:compare             # Compare against baseline
pnpm coverage:baseline            # Create/update baseline
```

## Coverage Targets by Service

| Service | Statements | Branches | Functions | Lines | Allowed Degradation |
|---------|------------|----------|-----------|-------|------------------|
| **Payment** | 85% | 80% | 85% | 85% | ±2% |
| **Booking** | 82% | 78% | 82% | 82% | ±2% |
| **Notification** | 80% | 75% | 80% | 80% | ±2% |
| **Wallet** | 85% | 80% | 85% | 85% | ±2% |
| **KYC** | 80% | 75% | 80% | 80% | ±2% |
| **API Gateway** | 78% | 70% | 78% | 78% | ±2% |
| **Booking Engine** | 75% | 65% | 75% | 75% | ±2% |
| **B2B Admin** | 72% | 62% | 72% | 72% | ±2% |
| **Shared Packages** | 88% | 85% | 88% | 88% | ±2% |

## Understanding Coverage Metrics

### **Statements**

- Percentage of code statements executed by tests
- **Highest Priority** - Most reliable metric
- Target: 80-88% depending on service

### **Branches**

- Percentage of conditional branches (if/else, ternary, etc.) tested
- **Most Challenging** - Requires testing all paths
- Target: 60-85% depending on service

### **Functions**

- Percentage of functions that are called by tests
- **Quality Indicator** - Shows public API coverage
- Target: 75-88%

### **Lines**

- Percentage of lines of code executed
- **Total Picture** - Complementary to statements
- Target: 75-88%

## Report Interpretation

### Standard Report

```
📊 COVERAGE TRACKING REPORT
📅 2024-12-19T10:30:00Z
Status: ✅ PASSING

📈 SERVICE COVERAGE SUMMARY
──────────────────────────────────────────────────────────

payment-service
  Statements: 85.2%
  Branches:   80.1%
  Functions:  85.4%
  Lines:      85.3%

📈 COVERAGE STATISTICS

STATEMENTS
  Overall: 82.1%
  Lowest:  booking-engine (75.3%)
  Highest: shared-database (88.9%)
```

### Regression Severity

- 🔴 **CRITICAL** (>5% drop) - Must fix before merge
- 🟠 **HIGH** (3-5% drop) - Should address
- 🟡 **MEDIUM** (1-3% drop) - Track for improvement

## GitHub Actions Integration

### Automatic Testing on PRs

The workflow automatically:

1. ✅ Runs full test suite with coverage
2. 📊 Compares against main branch baseline
3. 💬 Comments coverage report on PR
4. 🔴 Fails if critical regressions detected
5. 📁 Stores results for historical tracking

### View Results

- **In PR Comments**: Coverage summary with service breakdown
- **In Artifacts**: Full coverage reports (30-day retention)
- **On Dashboard**: Overall project coverage trends

## Configuration

### Thresholds (`src/types.ts`)

Adjust per-service targets:

```typescript
'payment-service': {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85,
  allowedDegradation: 2,  // Can drop 2% without warning
}
```

### Vitest Config (`vitest.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['json', 'text', 'html'],
  thresholds: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  }
}
```

## Adding Tests

### Test File Structure

```typescript
// src/payment.test.ts
import { describe, it, expect } from 'vitest';
import { validatePayment } from './payment';

describe('Payment Validation', () => {
  it('should validate valid payments', () => {
    const result = validatePayment({
      amount: 100,
      currency: 'USD',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid payments', () => {
    const result = validatePayment({
      amount: -100,
      currency: 'XXX',
    });
    expect(result.valid).toBe(false);
  });
});
```

### Coverage Tips

1. **Test Happy Paths First** - Ensure core logic is tested
2. **Add Edge Cases** - Test boundary conditions
3. **Test Error Paths** - Validate error handling
4. **Use Mocks Sparingly** - Real tests catch more issues
5. **Aim for Branch Coverage** - More difficult but more realistic

## Workflow: Improving Coverage

### 1. Identify Low Coverage

```bash
pnpm coverage:report
# Find services with <75% coverage
```

### 2. Target Specific Service

```bash
# Run coverage for payment-service only
pnpm coverage --workspace=@tripalfa/payment-service

# Check coverage report
cat coverage-results/index.html  # Open in browser
```

### 3. Write Missing Tests

```typescript
// Identify uncovered lines from report
// Add tests to increase %
it('should handle edge case X', () => {
  // test code
});
```

### 4. Verify Improvement

```bash
pnpm coverage
pnpm coverage:report

# Check that service's coverage improved
```

### 5. Commit with Baseline Update

```bash
git add -A
git commit -m "feat: improve payment-service coverage to 87%"
# Baseline automatically updates on merge to main
```

## Common Issues

### High Variance in Results

**Problem**: Coverage fluctuates between runs  
**Cause**: Non-deterministic tests, flaky code  
**Solution**:

- Fix flaky tests first
- Use consistent test data
- Avoid timing-dependent assertions

### Coverage Not Improving

**Problem**: Hard to increase from 75% to 80%  
**Cause**: Uncoverable code (error paths, deprecated code)  
**Solution**:

- Focus on important paths first
- Use `/* c8 ignore */` for genuinely untestable code
- Consider architectural changes

### CI/CD Failures

**Problem**: PR fails due to coverage regression  
**Cause**: Tests removed or broken  
**Solution**:

- Run `pnpm coverage` locally before pushing
- Check report for regressions
- Add tests before removing existing ones

## Best Practices

### For Developers

✅ **Always** run coverage locally before PR  
✅ **Aim** for >80% on critical services  
✅ **Focus** on branches (hardest to test)  
✅ **Document** why untestable code exists  
✅ **Review** coverage reports in CI  

### For Code Review

✅ Check coverage changes in PR comments  
✅ Question coverage decreases  
✅ Ask about tested edge cases  
✅ Verify critical paths are covered  

### For Leadership

✅ Track coverage trends monthly  
✅ Set realistic improvement goals  
✅ Celebrate coverage improvements  
✅ Use data to prioritize quality work  

## Performance Optimization

### Faster Coverage Runs

```bash
# Don't collect coverage everywhere
pnpm vitest run src/payment.test.ts

# Then collect coverage for specific service
pnpm coverage --workspace=@tripalfa/payment-service
```

### Parallel Testing

```bash
# Vitest runs tests in parallel by default
# Use `--threads false` if concurrency issues
```

## Monitoring Over Time

### Weekly Checks

```bash
# Ensure coverage isn't trending down
pnpm coverage:report
# Compare to previous week
```

### Monthly Analysis

- Review coverage by service
- Identify services with declining coverage
- Plan coverage improvement tasks
- Celebrate reaching new milestones

### Quarterly Goals

- Set coverage targets for next quarter
- Allocate time for test improvements
- Review effectiveness of existing tests

## CI/CD Integration

### GitHub Actions Workflow

Location: `.github/workflows/coverage.yml`

**Triggers**:

- Every PR to main/develop
- Daily schedule (trends)
- Manual dispatch option

**Actions**:

1. Install dependencies
2. Run test suite with coverage
3. Generate coverage report
4. Compare against baseline
5. Comment on PR
6. Upload artifacts
7. Update baseline on merge

### Local Workaround

```bash
# Test coverage locally before PR
pnpm coverage && pnpm coverage:compare

# If regression, fix and re-test
npm run test  # Fix tests
pnpm coverage:baseline  # Update baseline
```

## Troubleshooting

### Coverage File Not Found

```bash
# Ensure tests exist and run
npm test --workspace=@tripalfa/payment-service

# Check vitest is configured
cat vitest.config.ts
```

### Baseline Mismatch

```bash
# Reset baseline to current
pnpm coverage:baseline
```

### Report Generation Failed

```bash
# Check coverage output directory exists
mkdir -p coverage-results

# Rebuild and retry
pnpm coverage:report
```

## Next Steps

1. ✅ Run baseline coverage: `pnpm coverage`
2. ✅ Generate initial report: `pnpm coverage:report`
3. ✅ Establish baseline: `pnpm coverage:baseline`
4. ✅ Set up CI/CD workflow
5. ✅ Review with team
6. ✅ Start improving coverage systematically

## Support

- See `types.ts` for configuration options
- Check individual service `vitest.config.ts` files
- Review `.github/workflows/coverage.yml` for CI/CD
- Consult [Vitest Coverage Docs](https://vitest.dev/guide/coverage)

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready
