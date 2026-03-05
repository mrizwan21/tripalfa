# 📊 Coverage Tracking - Quick Reference

## Essential Commands

```bash
# Run tests with coverage for all services
npm test -- --coverage

# Run coverage specifically
npm run coverage --workspace=@tripalfa/coverage-tracking

# Generate reports
pnpm coverage:report              # Console + Markdown
pnpm coverage:compare             # vs baseline
pnpm coverage:strict              # Fail if regressions
pnpm coverage:baseline            # Create/update baseline

# Watch mode
pnpm coverage:watch

# Interactive UI
pnpm coverage:ui
```

## Coverage Targets

| Service | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| Payment | 85% | 80% | 85% | 85% |
| Booking | 82% | 78% | 82% | 82% |
| Wallet | 85% | 80% | 85% | 85% |
| KYC | 80% | 75% | 80% | 80% |
| Notification | 80% | 75% | 80% | 80% |
| API Gateway | 78% | 70% | 78% | 78% |
| Booking Engine | 75% | 65% | 75% | 75% |
| B2B Admin | 72% | 62% | 72% | 72% |
| Shared | 88% | 85% | 88% | 88% |

## Report Interpretation

| Symbol | Meaning | Action |
|--------|---------|--------|
| 🔴 | Critical (>5% drop) | Fix before merge |
| 🟠 | High (3-5% drop) | Should address |
| 🟡 | Medium (1-3% drop) | Track improvement |
| ✅ | No regression | Proceed |

## Metrics Explained

- **Statements**: % of code lines executed (primary metric)
- **Branches**: % of if/else paths tested (hardest to achieve)
- **Functions**: % of functions called by tests
- **Lines**: % of total lines covered

## File Locations

```
packages/coverage-tracking/
├── src/
│   ├── types.ts              # Configuration & thresholds
│   ├── monitor.ts            # Regression detection
│   └── cli/
│       └── generate-report.ts # Report generation
├── vitest.config.ts          # Coverage setup
├── tsconfig.json
├── README.md                 # Full documentation
└── package.json
```

## GitHub Actions

- **Triggers**: Every PR + daily schedule
- **Actions**: Runs tests → Reports coverage → Comments PR
- **Failure**: Critical regressions (>5% drop)
- **Artifacts**: Results stored 30 days

## Baseline Workflow

1. **Initial**: `pnpm coverage:baseline`
2. **Before Changes**: Review baseline stats
3. **After Changes**: Run `pnpm coverage:compare`
4. **If Good**: Merge PR
5. **Automatic**: Baseline updates on main merge

## Service Coverage Breakdown

### Critical Services (≥85%)
- Payment Service
- Wallet Service

### Core Services (≥80%)
- Booking Service
- KYC Service
- Notification Service

### Secondary Services (≥75%)
- API Gateway
- Booking Engine

### Administrative (≥70%)
- B2B Admin App

### Infrastructure (≥88%)
- Shared Packages

## Improving Coverage

### Step 1: Identify Gaps
```bash
pnpm coverage:report
# Check which services are below target
```

### Step 2: Focus on High-Impact Areas
- Critical/core services first
- Test error paths
- Test edge cases

### Step 3: Write Tests
```typescript
it('should handle edge case', () => {
  // test code
});
```

### Step 4: Verify
```bash
pnpm coverage:report
# Check improvement
```

### Step 5: Commit
```bash
git commit -m "test: improve payment coverage to 87%"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Coverage not updating | Run `npm test --coverage` first |
| Baseline mismatch | `pnpm coverage:baseline` |
| False positives | Use `/* c8 ignore */` comments |
| Slow runs | Exclude node_modules, dist |

## Best Practices

✅ Always run `pnpm coverage:report` before PR  
✅ Focus on branches (hardest to test)  
✅ Test happy + error paths  
✅ Document untestable code  
✅ Celebrate reaching milestones  
✅ Review coverage in code review  

## When to Add Tests

- 🔴 Critical payment/booking logic
- 🔴 Security-related code
- 🟠 Public API methods
- 🟠 Business logic
- 🟡 Utility functions
- 🟢 Simple getters/setters (optional)

## Performance Tips

- Run coverage only when needed
- Use `--coverage-exclude` for irrelevant files
- Test in parallel (default)
- Increase test timeout if needed

## Strategic Coverage Goals

| Quarter | Goal |
|---------|------|
| Q1 2026 | Establish baseline, 75% minimum |
| Q2 2026 | 80% for critical, 75% for core |
| Q3 2026 | 85% for critical, 80% for core |
| Q4 2026 | 85% critical, 80% core, 75% others |

---

Last Updated: December 2024  
Framework Status: ✅ Production Ready
