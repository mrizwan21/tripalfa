# Database Architecture Migration Guide

## Overview

This document provides a comprehensive guide for the migration from a single database architecture to a 4-database architecture in the TripAlfa project.

## Architecture Overview

### New 4-Database Architecture

The project now uses four separate databases, each serving a specific domain:

1. **tripalfa_core** - Core business operations
   - Users, bookings, wallet, KYC, userPreferences
   - Primary database for user-facing operations

2. **tripalfa_ops** - Operations and workflows
   - Notifications, rules, documents, disputes
   - Operational workflows and business rules

3. **tripalfa_local** - Static reference data
   - Hotels, airports, flights cache
   - Read-heavy static data

4. **tripalfa_finance** - Financial data
   - Invoices, campaigns, commissions, loyalty
   - Financial transactions and accounting

## Service Database Mappings

| Service                | Databases Used     | Purpose                                           |
| ---------------------- | ------------------ | ------------------------------------------------- |
| booking-service        | core, ops, local   | Booking operations, queue management, static data |
| b2b-admin-service      | core, ops, finance | Admin operations across all domains               |
| wallet-service         | core, finance      | Wallet management and financial operations        |
| payment-service        | core, finance      | Payment processing and financial records          |
| notification-service   | ops                | Notification workflows                            |
| rule-engine-service    | ops                | Business rule processing                          |
| kyc-service            | core               | User verification and KYC                         |
| company-service        | core, finance      | Company management and financial data             |
| auth-service           | core               | Authentication and user management                |
| marketing-service      | finance            | Marketing campaigns and financial tracking        |
| api-gateway            | core               | API routing and user data                         |
| booking-engine-service | core, local, ops   | Booking engine with static data and workflows     |

## Migration Steps Completed

### 1. Database Configuration Updates

- ✅ Updated `packages/shared-database/src/clients.ts` with 4 database clients
- ✅ Added proper type exports for each database
- ✅ Implemented production safety checks and SSL configuration
- ✅ Added singleton pattern for global instances

### 2. Service Database Updates

- ✅ Updated all service `database.ts` files with correct imports
- ✅ Replaced generic `prisma` imports with specific database clients
- ✅ Added proper type annotations and exports
- ✅ Maintained backwards compatibility with default exports

### 3. Route and Implementation Updates

- ✅ Updated `services/booking-service/src/routes/bookings.ts`
- ✅ Updated `services/booking-service/src/routes/liteapi.ts`
- ✅ Replaced all `prisma.` calls with appropriate database-specific calls
- ✅ Updated booking creation, queue operations, audit logs, invoices, payments

### 4. Environment Configuration

- ✅ Updated `.env` files with specific database URLs:
  - `CORE_DATABASE_URL`
  - `OPS_DATABASE_URL`
  - `LOCAL_DATABASE_URL`
  - `FINANCE_DATABASE_URL`

### 5. Migration Files

- ✅ All Prisma schema files properly configured:
  - `database/prisma/schema.core.prisma`
  - `database/prisma/schema.ops.prisma`
  - `database/prisma/schema.local.prisma`
  - `database/prisma/schema.finance.prisma`

## Code Changes Examples

### Before (Single Database)

```typescript
import { prisma } from "@tripalfa/shared-database";

// All operations used the same prisma client
const booking = await prisma.booking.create({...});
const queue = await prisma.bookingQueue.create({...});
```

### After (Multi-Database)

```typescript
import { coreDb, opsDb } from "@tripalfa/shared-database";

// Operations use appropriate database clients
const booking = await coreDb.booking.create({...});
const queue = await opsDb.bookingQueue.create({...});
```

## Benefits of the New Architecture

### 1. **Better Performance**

- Each service connects only to databases it needs
- Reduced connection overhead
- Optimized queries for specific domains

### 2. **Improved Security**

- Limited database access per service
- Reduced attack surface
- Better isolation of sensitive data

### 3. **Better Scalability**

- Each database can be scaled independently
- Different performance requirements per domain
- Better resource utilization

### 4. **Clearer Architecture**

- Explicit database routing
- Easier to understand data flow
- Better maintainability

### 5. **Production Safety**

- Services fail fast if required databases unavailable
- Better error handling and monitoring
- Clearer dependency management

## Testing and Verification

### Database Connection Testing

A comprehensive test script was created and executed to verify:

- ✅ All services can import their database clients
- ✅ All expected database clients are available
- ✅ No import errors or missing exports
- ✅ Proper type annotations

### Build Verification

- ✅ All services build successfully with new database architecture
- ✅ No TypeScript compilation errors
- ✅ Proper module resolution

## Environment Variables

### Required Environment Variables

```bash
# Core Database (required for most services)
CORE_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_core"

# Operations Database (required for ops services)
OPS_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_ops"

# Local Database (required for services needing static data)
LOCAL_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_local"

# Finance Database (required for financial services)
FINANCE_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_finance"

# Optional: Fallback database URL
DATABASE_URL="postgresql://user:pass@host:port/tripalfa_core"

# SSL Configuration (optional)
DB_SSL_REJECT_UNAUTHORIZED="true"  # For production SSL validation
```

### Development vs Production

- **Development**: Services can use fallback `DATABASE_URL` if specific URLs not set
- **Production**: Services fail fast if required database URLs not configured
- **SSL**: Enabled by default in production, can be controlled via environment variables

## Migration Checklist

- [x] Analyze current database architecture
- [x] Identify new database architecture requirements
- [x] Find all files referencing old database architecture
- [x] Update database configurations
- [x] Update service implementations
- [x] Update migration files
- [x] Update test files
- [x] Verify all changes are complete
- [x] Rebuild services to regenerate compiled files
- [x] Test database connections
- [x] Update documentation
- [ ] Monitor performance

## Next Steps

### 1. **Deploy to Staging**

- Deploy updated services to staging environment
- Verify database connections in staging
- Test end-to-end functionality

### 2. **Performance Monitoring**

- Monitor database connection performance
- Track query performance per database
- Observe resource utilization improvements

### 3. **Production Deployment**

- Deploy to production environment
- Monitor for any connection issues
- Verify all services function correctly

### 4. **Database Scaling**

- Consider independent scaling of each database
- Monitor performance metrics
- Optimize based on usage patterns

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure `@tripalfa/shared-database` exports are correct
   - Check TypeScript compilation
   - Verify service database.ts files

2. **Connection Issues**
   - Check environment variables are set correctly
   - Verify database URLs are accessible
   - Check SSL configuration

3. **Build Failures**
   - Ensure all services build successfully
   - Check TypeScript configuration
   - Verify module resolution

### Debug Commands

```bash
# Test database connections
node test-database-connections.js

# Build all services
pnpm -r build

# Check environment variables
echo $CORE_DATABASE_URL
echo $OPS_DATABASE_URL
echo $LOCAL_DATABASE_URL
echo $FINANCE_DATABASE_URL
```

## Conclusion

The migration to a 4-database architecture provides significant benefits in terms of performance, security, scalability, and maintainability. All services have been successfully updated and tested. The architecture is production-ready and follows best practices for microservices database design.

For any issues or questions regarding this migration, please refer to this documentation or consult the development team.
