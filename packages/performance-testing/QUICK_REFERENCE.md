# Performance Testing - Quick Reference Card

## Essential Commands

```bash
# Run all benchmarks
npm run bench --workspace=@tripalfa/performance-testing

# Watch mode (for development)
pnpm bench:watch -w @tripalfa/performance-testing

# Generate reports
pnpm report                    # Console output + Markdown file
pnpm report:json             # JSON format
pnpm report:compare          # Vs baseline
pnpm report:strict           # Fail if regressions (CI use)

# Individual service benchmarks
pnpm perf:payment
pnpm perf:booking
pnpm perf:database
pnpm perf:api

# Baseline management
pnpm baseline:init          # Create initial baseline
pnpm baseline:reset         # Reset to latest
```

## Report Interpretation

| Symbol | Meaning | Action |
|--------|---------|--------|
| 🔴 | Critical (>30% slower) | Fix before merge |
| 🟠 | High (>20% slower) | Track for optimization |
| 🟡 | Medium (>10% slower) | Monitor |
| ✅ | No regressions | Proceed |
| ⚠️ | Threshold exceeded | Review variance |

## Metrics at a Glance

| Service | Files | Benchmarks | Key Metric |
|---------|-------|-----------|-----------|
| Payment | `payment.bench.ts` | 9 | Validation: 500ms |
| Booking | `booking.bench.ts` | 11 | Search: 3000ms |
| Database | `database.bench.ts` | 11 | Query: 50-100ms |
| API | `api.bench.ts` | 9 | Auth: 50ms |

## File Locations

```
packages/performance-testing/
├── src/benchmarks/          # All benchmark tests
├── src/monitoring/          # Regression detection
├── src/cli/                 # Report generation
├── src/types.ts             # Configuration & types
├── vitest.config.ts         # Vitest setup
├── README.md                # Full documentation
└── benchmark-results/       # Output directory
```

## GitHub Actions

- **Trigger**: Every PR to main/develop and push to main
- **Process**: Run benchmarks → Compare vs baseline → Comment report
- **Failure**: Critical regressions (>30%) fail the check
- **Artifacts**: Results stored for 30 days

## Baseline Workflow

1. **Initial Setup**: `pnpm baseline:init` (creates baseline.json)
2. **Before Change**: Review baseline performance
3. **After Change**: Run `pnpm report:compare`
4. **If Better**: Update baseline with new results
5. **If Worse**: Optimize code or adjust thresholds

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| High variance | System load | Close apps, run isolated |
| Baseline mismatch | Outdated baseline | `pnpm baseline:init` |
| CI failure | Regression detected | Review changes, optimize |
| Timeout | Long benchmarks | Increase `timeout-minutes` |

## Configuration Points

**Performance Thresholds**: `src/types.ts` (DEFAULT_PERF_CONFIG)  
**Benchmark Iterations**: `vitest.config.ts` (warmupIterations, iterations)  
**CI Regression Threshold**: `src/cli/generate-report.ts` (regressionThreshold)  
**Report Format**: Individual `pnpm report:*` scripts

---

## Performance SLOs (Service Level Objectives)

| Operation | Target | Warning |
|-----------|--------|---------|
| Payment validation | 500ms | >550ms |
| Payment processing | 800ms | >896ms |
| Flight search | 3000ms | >3450ms |
| Booking confirmation | 2000ms | >2300ms |
| Database query | 50-100ms | >105ms |
| API gateway auth | 50ms | >55ms |
| Hotel rate fetch | 5000ms | >6250ms |

## When to Run Benchmarks

✅ **Before merging** performance-related changes  
✅ **After database** schema changes  
✅ **When adding** new API endpoints  
✅ **During code** review for critical services  
✅ **Weekly** as part of quality gates  
✅ **When debugging** reported slowness  

## Optimization Checklist

- [ ] Run baseline before making changes
- [ ] Profile code with DevTools
- [ ] Apply targeted optimizations
- [ ] Run benchmarks again locally
- [ ] Verify regression is resolved
- [ ] Update baseline with improved version
- [ ] Document optimization in commit message

## Emergency Response

**If Critical Regression Detected**:
1. Don't merge to main
2. Run `pnpm perf:<service>` to identify benchmark
3. Review recent commits affecting that path
4. Profile with Chrome DevTools
5. Optimize and retest
6. Update baseline only after confirmed fix

---

Last Updated: December 2024  
Framework Status: ✅ Production Ready
