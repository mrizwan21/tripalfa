# Types Folder Cleanup Analysis

## Current State Assessment

The `types` folder contains three files:

1. **`overrides.d.ts`** - Contains module overrides for `@tripalfa/shared-types`, `@prisma/client`, and global `AuthPayload` interface
2. **`pg.d.ts`** - Simple module declaration for `pg` (PostgreSQL client)
3. **`shims.d.ts`** - Extensive collection of type shims for various third-party modules

## Analysis Results

### File Usage and Dependencies

**`overrides.d.ts`:**
- ✅ **ACTIVELY USED** - Contains critical type overrides for:
  - `@tripalfa/shared-types` module with `Adapter`, `FlightResult`, and `HotelResult` interfaces
  - `@prisma/client` with loosened typing for compatibility
  - Global `AuthPayload` interface for authentication
- Referenced in multiple services and packages
- Essential for type compatibility across the codebase

**`pg.d.ts`:**
- ❌ **REDUNDANT** - Contains only `declare module "pg";`
- **ISSUE**: The `pg` module already has proper TypeScript definitions via `@types/pg` package
- Multiple packages already install `@types/pg` as a dependency
- This file provides no additional value and creates redundancy

**`shims.d.ts`:**
- ⚠️ **PARTIALLY REDUNDANT** - Contains extensive type shims
- **ISSUE**: Many of these shims are for packages that already have proper TypeScript definitions
- Contains both useful shims and unnecessary ones
- Some shims may be masking missing proper type definitions

### Configuration Analysis

- The main `tsconfig.base.json` does NOT include the `types` folder
- Only `docs/tsconfig.json` includes `"./types/**/*.d.ts"` in its include path
- Most services use workspace references and proper package imports
- The types folder appears to be legacy configuration

## Cleanup Recommendations

### 1. Remove `pg.d.ts` (SAFE TO DELETE)
- **Reason**: Redundant with `@types/pg` package
- **Impact**: None - proper types already available
- **Action**: Delete file

### 2. Review and Clean `shims.d.ts` (PARTIAL CLEANUP)
- **Keep**: Shims for packages without proper TypeScript definitions
- **Remove**: Shims for packages that have `@types/*` packages available
- **Examples to remove**:
  - `joi` (has `@types/joi`)
  - `p-limit` (has `@types/p-limit`)
  - `cheerio` (has `@types/cheerio`)
  - `dotenv` (has `@types/dotenv`)
  - `uuid` (has `@types/uuid`)
  - `axios` (has `@types/axios`)
  - `jsonwebtoken` (has `@types/jsonwebtoken`)
  - `fastify` (has `@types/fastify`)
  - `compression` (has `@types/compression`)
  - `multer` (has `@types/multer`)
  - `helmet` (has `@types/helmet`)
  - `ioredis` (has `@types/ioredis`)
  - `node-fetch` (has `@types/node-fetch`)
  - `redis` (has `@types/redis`)

### 3. Keep `overrides.d.ts` (ESSENTIAL)
- **Reason**: Contains critical type overrides for the project
- **Impact**: Breaking changes if removed
- **Action**: Keep as-is

## Implementation Plan

1. **Phase 1**: Remove `pg.d.ts` immediately (safe)
2. **Phase 2**: Audit and clean `shims.d.ts` by removing redundant shims
3. **Phase 3**: Verify no compilation errors after cleanup
4. **Phase 4**: Consider moving remaining useful shims to appropriate packages

## Files to Keep
- `overrides.d.ts` - Essential for project type compatibility

## Files to Remove/Modify
- `pg.d.ts` - Delete entirely
- `shims.d.ts` - Clean up redundant shims, keep only necessary ones

## Verification Steps
1. Run TypeScript compilation after each change
2. Check for any "Could not find a declaration file" errors
3. Verify all services still compile successfully
4. Test runtime functionality to ensure no breaking changes