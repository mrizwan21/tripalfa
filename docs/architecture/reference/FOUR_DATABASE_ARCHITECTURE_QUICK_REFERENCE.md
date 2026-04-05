# Four-Database Architecture - Quick Reference Card

## Architecture Overview

- **Four Databases**: tripalfa_local, tripalfa_core, tripalfa_ops, tripalfa_finance
- **Each Database**: Independent PostgreSQL instance with isolated schema
- **Prisma Setup**: 4 separate schemas generating isolated clients
- **Shared Module**: `@tripalfa/shared-database` exports all clients as factory functions

## Environment Variables

```bash
# Required in .env or .env.local
LOCAL_DATABASE_URL=postgresql://user:pass@localhost/tripalfa_local?schema=local
CORE_DATABASE_URL=postgresql://user:pass@localhost/tripalfa_core?schema=core
OPS_DATABASE_URL=postgresql://user:pass@localhost/tripalfa_ops?schema=ops
FINANCE_DATABASE_URL=postgresql://user:pass@localhost/tripalfa_finance?schema=finance
```

## Quick Commands

### Database Operations

```bash
# Migrate all databases
npm run db:migrate

# Migrate specific database
npm run db:migrate:local
npm run db:migrate:core
npm run db:migrate:ops
npm run db:migrate:finance

# Generate all Prisma clients
npm run db:generate

# Close all Prisma engines
npm run db:disconnect
```

### Running Tests

**All tests:**

```bash
bash tests/run-full-test-suite.sh
```

**Individual test suites:**

```bash
# Configuration validation
npx vitest run tests/database-config-validation.test.ts

# Schema integrity
npx vitest run tests/schema-integrity.test.ts

# Database isolation
npx vitest run tests/database-isolation.test.ts

# Email verification
npx vitest run tests/email-verification-integration.test.ts

# Migration commands
npx vitest run tests/migration-commands.test.ts

# Service config
npx vitest run tests/service-database-config.test.ts

# Prisma generators
npx vitest run tests/prisma-generator-isolation.test.ts
```

**With coverage:**

```bash
npx vitest run tests/*.test.ts --coverage
```

**Watch mode (development):**

```bash
npx vitest tests/prisma-generator-isolation.test.ts --watch
```

### Prisma Client Usage

**Import from shared module (correct):**

```typescript
import { coreDb, localDb, opsDb, financeDb } from '@tripalfa/shared-database';

// Use in services
const coreClient = coreDb();
const user = await coreClient.user.findUnique({ where: { id: 1 } });
```

**Direct imports (WRONG - don't do this):**

```typescript
// ❌ INCORRECT
import { PrismaClient } from '@prisma/client';

// ❌ INCORRECT
import * as coreDb from 'packages/shared-database/src/generated/core';
```

## File Locations

| Component                   | Path                                               |
| --------------------------- | -------------------------------------------------- |
| Core Schema                 | `database/prisma/schema.core.prisma`               |
| Local Schema                | `database/prisma/schema.local.prisma`              |
| Ops Schema                  | `database/prisma/schema.ops.prisma`                |
| Finance Schema              | `database/prisma/schema.finance.prisma`            |
| Email-Verification Fragment | `database/prisma/schema.email-verification.prisma` |
| Shared Database Module      | `packages/shared-database/src/`                    |
| Generated Clients - Core    | `packages/shared-database/src/generated/core/`     |
| Generated Clients - Local   | `packages/shared-database/src/generated/local/`    |
| Generated Clients - Ops     | `packages/shared-database/src/generated/ops/`      |
| Generated Clients - Finance | `packages/shared-database/src/generated/finance/`  |

## Model Locations

| Category           | Database    | Models                                   |
| ------------------ | ----------- | ---------------------------------------- |
| User Management    | **core**    | User, Company, Role, Permission          |
| Booking & Payment  | **core**    | Booking, Payment, Wallet, Order, Invoice |
| Reference Data     | **local**   | Currency, Country, Airport, Hotel        |
| Operations         | **ops**     | Notification, Dispute, Document, Channel |
| Finance            | **finance** | Commission, LoyaltyProgram, Settlement   |
| Email Verification | **core**    | emailVerificationToken                   |

## Common Troubleshooting

### Schema Compilation Errors

```bash
# Validate all schemas compile
npm run db:validate

# Regenerate clients
npm run db:generate

# Check for syntax errors
grep "^model\|^enum\|^type" database/prisma/schema.*.prisma
```

### Database Connection Issues

```bash
# Test individual database connection
npm run db:migrate:core -- --dry-run

# Check environment variables are loaded
echo $CORE_DATABASE_URL
echo $LOCAL_DATABASE_URL
```

### Prisma Client Version Mismatch

```bash
# Regenerate all clients to match installed @prisma/client
npm run db:generate

# Reinstall prisma
npm install @prisma/client@latest
npm run db:generate
```

### Tests Failing with "File not found"

```bash
# Ensure schema files exist
ls -la database/prisma/schema.*.prisma

# Ensure prisma clients are generated
ls -la packages/shared-database/src/generated/*/index.js

# Regenerate if missing
npm run db:generate
```

## Performance Tips

1. **Use factory functions** for multi-request patterns:

   ```typescript
   const db = coreDb();
   const user = await db.user.findMany();
   ```

2. **Batch database operations** when possible:

   ```typescript
   await Promise.all([coreDb().booking.findMany(), opsDb().notification.findMany()]);
   ```

3. **Use connection pooling** in production:
   - Set `?pgbouncer=true` in DATABASE_URL for production

## Pre-Deployment Validation

Before deploying, run:

```bash
# 1. Run all tests
bash tests/run-full-test-suite.sh

# 2. Build project
npm run build

# 3. Check TypeScript
npx tsc --noEmit

# 4. Lint code
npm run lint

# 5. Verify schemas compile
npm run db:validate
```

## Support Resources

- **Test Plan**: [docs/FOUR_DATABASE_ARCHITECTURE_TEST_PLAN.md](../docs/FOUR_DATABASE_ARCHITECTURE_TEST_PLAN.md)
- **Execution Guide**: [docs/FOUR_DATABASE_ARCHITECTURE_TESTING_EXECUTION.md](../docs/FOUR_DATABASE_ARCHITECTURE_TESTING_EXECUTION.md)
- **Architecture Guide**: [docs/BACKEND_SERVICES.md](../docs/BACKEND_SERVICES.md)
