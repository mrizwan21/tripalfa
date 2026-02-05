# Static Data Migration Guide

This guide provides step-by-step instructions for migrating from scattered static data to the centralized static data package.

## Overview

The migration involves moving all static data from various locations to the centralized `packages/static-data/` package and updating all references to use the new centralized system.

## Pre-Migration Checklist

Before starting the migration:

1. **Backup your project**: Create a backup of your current project state
2. **Review current static data**: Identify all scattered static data locations
3. **Check TypeScript configuration**: Ensure proper path mapping is configured
4. **Update dependencies**: Make sure all packages are up to date

## Migration Steps

### Step 1: Update TypeScript Configuration

Ensure the TypeScript configuration includes the path mapping for the static data package:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@tripalfa/static-data": ["packages/static-data/src"]
    }
  }
}
```

### Step 2: Migrate Notification Types

**Old Location**: `apps/booking-engine/src/lib/notification-types.ts`

**Migration Steps**:
1. Remove the old file
2. Update all imports to use the centralized package

**Before**:
```typescript
import { MOCK_NOTIFICATIONS } from '../lib/notification-types';
```

**After**:
```typescript
import { MOCK_NOTIFICATIONS } from '@tripalfa/static-data';
```

### Step 3: Migrate B2B Admin Mock Data

**Old Locations**:
- `apps/b2b-admin/src/features/notifications/components/NotificationList.tsx`
- `apps/b2b-admin/src/features/suppliers/components/SupplierList.tsx`
- `apps/b2b-admin/src/features/suppliers/components/ApiVendorConfig.tsx`
- `apps/b2b-admin/src/features/suppliers/components/ContractList.tsx`

**Migration Steps**:
1. Remove all mock data arrays from components
2. Update imports to use centralized package
3. Update component logic to use centralized data

**Before**:
```typescript
const MOCK_DATA = [
  // ... notification data
];
```

**After**:
```typescript
import { MOCK_NOTIFICATIONS } from '@tripalfa/static-data';
```

### Step 4: Update Constants

**Old Location**: `apps/booking-engine/src/lib/constants.ts`

**Migration Steps**:
1. Move static arrays to centralized package (if needed)
2. Update imports in components

**Before**:
```typescript
import { FLIGHT_CLASSES } from '../lib/constants';
```

**After**:
```typescript
import { FLIGHT_CLASSES } from '@tripalfa/static-data';
```

### Step 5: Update API Module

**Old Location**: `apps/booking-engine/src/lib/api.ts`

**Migration Steps**:
1. Update static data fetcher functions to use centralized package
2. Remove any mock fallback logic

**Before**:
```typescript
export async function fetchAirports(query?: string) {
  try {
    const response = await getAirports({ query });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}
```

**After**:
```typescript
export async function fetchAirports(query?: string) {
  try {
    const response = await getAirports({ query });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}
```

### Step 6: Remove Duplicate Definitions

After all components have been updated:

1. Remove old static data files
2. Clean up any unused imports
3. Verify all references are using the centralized package

## Common Migration Patterns

### Pattern 1: Notification Types
```typescript
// Before
import { NotificationType, NotificationStatus } from '../lib/notification-types';

// After
import { NotificationType, NotificationStatus } from '@tripalfa/static-data';
```

### Pattern 2: Static Arrays
```typescript
// Before
import { FLIGHT_CLASSES } from '../lib/constants';

// After
import { FLIGHT_CLASSES } from '@tripalfa/static-data';
```

### Pattern 3: Mock Data
```typescript
// Before
const MOCK_SUPPLIERS = [
  // ... supplier data
];

// After
import { MOCK_SUPPLIERS } from '@tripalfa/static-data';
```

## Post-Migration Checklist

After completing the migration:

1. **Test all components**: Ensure all components are working correctly
2. **Verify TypeScript**: Check for any TypeScript errors
3. **Test build process**: Ensure the project builds successfully
4. **Run tests**: Execute all tests to verify functionality
5. **Performance check**: Verify caching is working as expected

## Troubleshooting

### Issue: TypeScript Cannot Find Module
**Solution**: Check that the path mapping in `tsconfig.json` is correct and that the package is properly built.

### Issue: Import Errors
**Solution**: Verify that all imports are using the correct syntax and that the package is properly exported.

### Issue: Build Failures
**Solution**: Ensure all static data files have been properly migrated and that there are no duplicate definitions.

## Best Practices

1. **Use the centralized package**: Always use `@tripalfa/static-data` for static data access
2. **Leverage caching**: Take advantage of the built-in caching mechanisms
3. **Handle errors gracefully**: Use try-catch blocks for data fetching
4. **Keep data consistent**: Ensure all components use the same data sources
5. **Document changes**: Update documentation when adding new static data

## Migration Complete

After completing all migration steps:

1. Remove all old static data files
2. Update any documentation that references old data locations
3. Celebrate your successful migration to a centralized static data system!

## Support

If you encounter any issues during migration:

1. Check the error messages carefully
2. Verify all imports and exports are correct
3. Ensure the package is properly built and linked
4. Consult the documentation for the static data package

For additional help, refer to the main documentation or contact the development team.