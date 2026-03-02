# FX Integration - Canonical Guide

**Status:** ✅ Consolidated Reference  
**Last Updated:** March 1, 2026

---

## Overview

This is the single source of truth for TripAlfa FX integration.

It covers:

- Setup and configuration
- Environment variables
- Run commands
- Validation checklist
- Troubleshooting
- Production readiness

---

## Scope

The FX integration enables currency conversion and advanced FX workflows for booking and wallet flows.

Core outcomes:

- Stable FX rate lookup and conversion flow
- Verified test execution path
- Operational commands for local validation

---

## Historical Phase 2 Summary

The previous Phase 2 completion report has been consolidated into this canonical document.

### Delivered in Phase 2

- Expanded supported currencies from **7 to 36**
- Added FX caching with TTL for faster repeated lookups
- Added analytics endpoints for conversion and fee visibility
- Added advanced and expansion-focused FX test suites

### Key Validation Metrics (Phase 2)

- Currency expansion: **7 → 36**
- Test coverage snapshot: **87 tests passing** across integration, advanced, and expansion suites
- Performance snapshot: cached rate reads in low milliseconds; cold reads remained within acceptable API bounds
- Type safety and static checks: no blocking TypeScript errors at completion

### Core Files from Phase 2 (Reference)

- `scripts/mock-wallet-api.ts` (currency map, caching, analytics behavior)
- `scripts/test-fx-integration.ts` (integration validation)
- `scripts/test-fx-advanced.ts` (load, edge, verbose checks)
- `scripts/test-fx-currency-expansion.ts` (36-currency coverage)

### Notes

- Historical phase details are retained here to preserve context while keeping a strict single-file FX documentation model.

---

## Setup

### Prerequisites

- Node.js and workspace dependencies installed
- Required services available in local/dev environment
- Valid environment configuration

### Environment Variables

Use your workspace environment files and ensure the FX-related values are present.

Recommended checks:

- API credentials are loaded from environment files
- No hardcoded secrets in source files
- Local and CI values are aligned

---

## Runbook

### Local Validation Commands

```bash
# Type check
npx tsc -p tsconfig.json --noEmit

# Run advanced FX test suite
npm run test:fx:advanced:edge

# Optional: run related API orchestrator tests
npm run test:api:wallet:orchestrator
```

### Expected Outcome

- Commands complete successfully
- FX test output indicates pass status
- No regressions in related orchestrator workflows

---

## Verification Checklist

- [x] FX integration docs consolidated into one canonical file
- [x] Redundant FX integration docs removed
- [x] References to removed FX docs cleaned up
- [x] Core FX validation command documented
- [x] Deployment readiness criteria documented

---

## Troubleshooting

### Tests fail intermittently

- Re-run with clean local state
- Confirm dependent services are running
- Validate environment variables are loaded

### Environment issues

- Verify `.env` values and secret sources
- Ensure no stale shell variables override intended values

### Build/type errors

- Run workspace typecheck first
- Address root type errors before re-running FX tests

---

## Production Readiness

Before promoting:

1. Run typecheck and FX tests in CI
2. Validate monitoring/alerting for FX-related failures
3. Confirm rollback path for FX config changes

Readiness indicators:

- Consistent green test results
- No critical lint/type violations
- Configuration and secrets verified

---

## Canonical Reference Policy

`FX_INTEGRATION_INDEX.md` is the canonical FX integration document.

If future FX documentation is added, it should be merged into this file or linked from this file only when strictly necessary.
