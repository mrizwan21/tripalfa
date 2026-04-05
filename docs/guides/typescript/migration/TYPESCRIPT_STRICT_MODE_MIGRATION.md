# TypeScript Strict Mode Migration Guide

## Current State

The TripAlfa project currently has TypeScript strict mode disabled (`"strict": false`) in the main `tsconfig.json`.
This was likely done to allow for gradual development but reduces type safety
and increases the risk of runtime errors.

## Migration Strategy

### Phase 1: Enable Basic Strictness (Immediate)

✅ **Completed**: Enabled `"noImplicitAny": true` in main `tsconfig.json`

This catches untyped parameters and improves type safety without breaking existing properly-typed code.

### Phase 2: Create Strict Configuration for New Code

✅ **Completed**: Created `tsconfig.strict.json` with full strict mode enabled

New services and packages should extend this configuration:

```json
{
  "extends": "../../tsconfig.strict.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Phase 3: Gradual Service Migration

Migrate services one by one in this order:

1. **New services** - Use strict config from start
2. **Core services** (auth, booking, payment) - High priority
3. **Business services** (company, KYC, wallet) - Medium priority
4. **Admin services** (b2b-admin, rule-engine) - Lower priority

### Phase 4: Enable Strict Mode Globally

Once all services are migrated, update main `tsconfig.json` to `"strict": true`.

## Common Issues and Fixes

### 1. Implicit 'any' Types

**Error**: `Parameter 'x' implicitly has an 'any' type`

**Fix**: Add explicit type annotations

```typescript
// Before
function processUser(user) {
  return user.id;
}

// After
function processUser(user: User): string {
  return user.id;
}
```

### 2. Null/Undefined Checks

**Error**: `Object is possibly 'null'` or `Object is possibly 'undefined'`

**Fix**: Add null checks or use optional chaining

```typescript
// Before
const name = user.profile.name;

// After
const name = user?.profile?.name ?? 'Unknown';
```

### 3. Function Type Compatibility

**Error**: `Type '(x: string) => void' is not assignable to type '(x: string | number) => void'`

**Fix**: Use proper function signatures or type assertions

```typescript
// Before
const handler: (x: string | number) => void = (x: string) => console.log(x);

// After
const handler: (x: string | number) => void = (x: string | number) => console.log(x);
```

### 4. Uninitialized Properties

**Error**: `Property 'x' has no initializer and is not definitely assigned in constructor`

**Fix**: Initialize properties or use definite assignment assertion

```typescript
// Before
class User {
  private name: string;

  constructor() {
    // name not initialized
  }
}

// After (Option 1 - Initialize)
class User {
  private name: string = '';

  constructor() {}
}

// After (Option 2 - Definite assignment)
class User {
  private name!: string;

  constructor() {}
}
```

## Migration Commands

### Check Current Type Errors

```bash
npx tsc --noEmit --strict
```

### Check Specific Service

```bash
cd services/auth-service
npx tsc --noEmit --project tsconfig.json --strict
```

### Generate Migration Report

```bash
# Create a script to identify all type errors
npx tsc --noEmit --strict --listFiles | grep -E "error TS[0-9]+" > type-errors-report.txt
```

## Service-Specific Migration Steps

### 1. Update Service tsconfig.json

```json
{
  "extends": "../../tsconfig.strict.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 2. Fix Type Errors Incrementally

```bash
# Run in service directory
npx tsc --noEmit  # Check errors
# Fix errors file by file
```

### 3. Update Package Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:strict": "tsc --noEmit --strict",
    "build": "tsc"
  }
}
```

### 4. Add CI Validation

Add to GitHub Actions workflow:

```yaml
- name: Type Check
  run: npm run type-check:strict
```

## Benefits of Strict Mode

### 1. **Reduced Runtime Errors**

- Catch type mismatches at compile time
- Prevent `undefined` or `null` access errors
- Ensure function parameter compatibility

### 2. **Better Code Quality**

- Explicit type annotations improve readability
- Self-documenting code
- Easier refactoring

### 3. **Improved Developer Experience**

- Better IDE autocompletion
- Accurate type inference
- Early error detection

### 4. **Production Reliability**

- Fewer type-related bugs in production
- More predictable runtime behavior
- Easier debugging

## Monitoring Migration Progress

### Dashboard Metrics

- **Type Error Count**: Total TypeScript errors across codebase
- **Service Coverage**: Percentage of services using strict mode
- **File Coverage**: Percentage of files with strict types

### Success Criteria

- [ ] Zero type errors in CI pipeline
- [ ] All new code uses strict configuration
- [ ] 80% of existing code migrated
- [ ] All critical services (auth, booking, payment) migrated

## Rollback Plan

If migration causes issues:

1. Revert service `tsconfig.json` to extend base config without strict
2. Add `// @ts-ignore` comments for critical blocking issues (temporary)
3. Create issues for each type error to fix later

## Timeline

- **Week 1-2**: Enable `noImplicitAny`, create strict config
- **Week 3-4**: Migrate 2-3 core services
- **Week 5-8**: Migrate remaining services
- **Week 9-10**: Enable strict mode globally, clean up `@ts-ignore`

## Resources

- [TypeScript Strict Mode Documentation](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [Strict Mode Benefits](https://blog.logrocket.com/typescript-strict-mode/)

---

_Last Updated: $(date)_  
_Owner: Engineering Team_  
_Status: In Progress_
