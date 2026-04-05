# Four-Database Architecture Testing Plan

## Overview

This document outlines a comprehensive testing strategy to validate the complete alignment and isolation of the four‑database architecture in the TripAlfa system. The plan covers five critical validation areas to ensure zero risk of query misquoting or cross‑database contamination.

## 1. Schema‑to‑Environment‑Variable‑to‑Database‑Instance Mapping Verification

### Objective

Validate that each Prisma schema file unambiguously maps to its intended environment variable and database instance, with no risk of cross‑database contamination.

### Test Cases

#### 1.1 Environment Variable Mapping

- [ ] Verify `CORE_DATABASE_URL` maps to `tripalfa_core` database
- [ ] Verify `LOCAL_DATABASE_URL` maps to `tripalfa_local` database
- [ ] Verify `OPS_DATABASE_URL` maps to `tripalfa_ops` database
- [ ] Verify `FINANCE_DATABASE_URL` maps to `tripalfa_finance` database

#### 1.2 Schema File Validation

- [ ] Confirm each `.prisma` file contains correct `datasource db.url` referencing the appropriate environment variable
- [ ] Verify generator `output` paths are distinct for each schema
- [ ] Validate no schema references models from other databases

#### 1.3 Cross‑Database Contamination Prevention

- [ ] Test that queries cannot accidentally target wrong database
- [ ] Verify environment variables are not interchangeable
- [ ] Confirm database names in URLs are distinct and non‑overlapping

### Test Methods

- Scripted validation of `.prisma` file contents
- Environment variable injection tests
- Connection string parsing and verification

## 2. Prisma Generators, Data Sources, and Relationships Testing

### Objective

Ensure all Prisma generators produce correct client code, data sources are properly isolated, and relationships within each schema are valid.

### Test Cases

#### 2.1 Generator Output Validation

- [ ] Verify `schema.core.prisma` generates client in `packages/shared-database/src/generated/core/`
- [ ] Verify `schema.local.prisma` generates client in `packages/shared-database/src/generated/local/`
- [ ] Verify `schema.ops.prisma` generates client in `packages/shared-database/src/generated/ops/`
- [ ] Verify `schema.finance.prisma` generates client in `packages/shared-database/src/generated/finance/`

#### 2.2 Data Source Isolation

- [ ] Confirm each generated client only contains models from its own schema
- [ ] Verify no model name collisions across databases
- [ ] Test that TypeScript types are properly namespaced

#### 2.3 Relationship Validation

- [ ] Validate all `@relation` fields reference models within same schema
- [ ] Test foreign key constraints are database‑local only
- [ ] Verify no cross‑database relationships exist

### Test Methods

- Prisma client generation and inspection
- TypeScript compilation checks
- Schema relationship analysis

## 3. Database Connection Scripts and Environment Variable Configuration

### Objective

Functionally validate that all database connection scripts work correctly with the four‑database architecture and environment variables are properly configured.

### Test Cases

#### 3.1 Connection Script Validation

- [ ] Test `database/prisma/run-seed.sh` seeds all four databases correctly
- [ ] Verify `database/prisma/seed-local.cjs` only targets local database
- [ ] Verify `database/prisma/seed-pg.cjs` handles all databases appropriately
- [ ] Test backup/restore scripts (`database/restore-backup.sh`) work per database

#### 3.2 Environment Configuration

- [ ] Validate `.env`, `.env.local.private`, `.env.example` have consistent variable names
- [ ] Test environment variable fallback chains work correctly
- [ ] Verify production vs development configuration differences

#### 3.3 Service‑Specific Configuration

- [ ] Check each service (booking-service, auth-service, wallet-service) uses correct database URLs
- [ ] Verify no service accidentally uses wrong database URL

### Test Methods

- Script execution with mocked environments
- Environment variable validation scripts
- Service startup and connection testing

## 4. Prisma Command Isolation Verification

### Objective

Rigorously verify that all `prisma db push`, `prisma migrate`, and client generation commands operate exclusively on their intended target databases.

### Test Cases

#### 4.1 Command Targeting Validation

- [ ] Test `prisma db push --schema schema.core.prisma` only affects `tripalfa_core`
- [ ] Test `prisma db push --schema schema.local.prisma` only affects `tripalfa_local`
- [ ] Test `prisma db push --schema schema.ops.prisma` only affects `tripalfa_ops`
- [ ] Test `prisma db push --schema schema.finance.prisma` only affects `tripalfa_finance`

#### 4.2 Migration Isolation

- [ ] Verify migrations in `database/prisma/migrations/` are database‑specific
- [ ] Test `prisma migrate dev --schema schema.core.prisma` only creates core migrations
- [ ] Validate migration history tables are per‑database

#### 4.3 Client Generation Isolation

- [ ] Confirm `prisma generate --schema schema.core.prisma` only generates core client
- [ ] Verify generated clients don't contain models from other schemas
- [ ] Test that running generate on one schema doesn't affect others

### Test Methods

- Dry‑run Prisma commands with verbose logging
- Database inspection before/after commands
- Schema diff analysis

## 5. Email‑Verification Fragment Integration Testing

### Objective

Confirm that the email‑verification fragment integrates correctly with the core schema without disrupting the core schema isolation.

### Test Cases

#### 5.1 Fragment Integration

- [ ] Verify `schema.email-verification.prisma` fragment is properly incorporated into `schema.core.prisma`
- [ ] Test that `EmailVerificationToken` model exists in core database
- [ ] Validate relationship `User ↔ EmailVerificationToken` works correctly

#### 5.2 Isolation Preservation

- [ ] Confirm email verification tables only exist in core database
- [ ] Verify no other databases reference email verification models
- [ ] Test that fragment doesn't introduce cross‑database dependencies

#### 5.3 Functional Validation

- [ ] Test B2B registration flow with email verification
- [ ] Verify token generation, validation, and expiration work
- [ ] Confirm integration doesn't break existing user authentication

### Test Methods

- Schema merging validation
- Integration testing of B2B registration flow
- Database inspection for table creation

## Implementation Strategy

### Phase 1: Analysis & Planning (Current)

- [x] Analyze current architecture and mappings
- [ ] Design comprehensive testing plan (this document)

### Phase 2: Test Script Development

- [ ] Create test scripts for schema‑to‑environment‑variable mapping verification
- [ ] Implement tests for Prisma generators and data source isolation
- [ ] Develop functional validation for database connection scripts
- [ ] Create rigorous verification for Prisma commands
- [ ] Test email‑verification fragment integration

### Phase 3: Execution & Validation

- [ ] Execute all tests in isolated environment
- [ ] Document test results and any issues found
- [ ] Provide recommendations for improvements

### Phase 4: Reporting & Integration

- [ ] Create final testing report
- [ ] Integrate tests into CI/CD pipeline
- [ ] Establish ongoing monitoring

## Success Criteria

1. **Zero Cross‑Database Contamination**: No query, migration, or operation affects unintended database
2. **Complete Environment Isolation**: Each database operates independently with its own configuration
3. **Correct Client Generation**: All Prisma clients contain only their intended models
4. **Functional Integrity**: All services work correctly with the four‑database architecture
5. **Email Verification Integration**: B2B registration flow works without breaking isolation

## Risk Mitigation

- **Test Isolation**: Run tests in dedicated test databases to avoid production impact
- **Incremental Validation**: Test each component independently before full integration
- **Rollback Plan**: Maintain ability to revert to single‑database architecture if critical issues found
- **Monitoring**: Implement database‑level monitoring to detect cross‑database queries

## Deliverables

1. Comprehensive test suite covering all five validation areas
2. Automated test scripts for CI/CD integration
3. Test execution report with pass/fail status
4. Recommendations for architecture improvements
5. Updated documentation reflecting validated architecture

## Timeline

- **Design Phase**: 1 day (completed)
- **Development Phase**: 2‑3 days
- **Execution Phase**: 1 day
- **Reporting Phase**: 0.5 day

## Next Steps

1. Update todo list to reflect testing plan
2. Begin implementation of test scripts
3. Execute tests in controlled environment
4. Document results and provide recommendations
