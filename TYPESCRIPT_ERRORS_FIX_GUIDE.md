# Pre-Existing TypeScript Errors - Fix Guide

**Status**: Pre-existing, NOT caused by configuration cleanup  
**Severity**: Medium - Blocks `npm run build`  
**Root Cause**: Database schema changes not fully synced with service code

---

## Overview

The b2b-admin-service fails to compile due to schema mismatches. These errors existed before our configuration cleanup.

## Errors by File

### 1. `services/b2b-admin-service/src/routes/rules.ts` (Lines 807-813)

**Error**: Missing fields in CommissionSettlement type
```
Property 'bookingAmount' does not exist (line 807)
Property 'commissionAmount' does not exist (line 809-810)
Property 'settledAmount' does not exist (line 812-813)
```

**Location**:
```typescript
res.json({
  success: true,
  data: commissions.map((c) => ({
    ...c,
    baseAmount: c.baseAmount?.toNumber?.() ?? c.baseAmount,
    bookingAmount: c.bookingAmount?.toNumber?.() ?? c.bookingAmount,  // ← ERROR
    commissionAmount: c.commissionAmount?.toNumber?.() ?? c.commissionAmount,  // ← ERROR
``,
```

**Fix**:
Check `database/prisma/schema.prisma` for CommissionSettlement schema and update accordingly:

Option A: If fields exist in schema but weren't generated:
```bash
npm run db:generate
```

Option B: If fields don't exist in schema, remove the mapping:
```typescript
res.json({
  success: true,
  data: commissions.map((c) => ({
    ...c,
    amount: c.amount?.toNumber?.() ?? c.amount,
    // Remove: bookingAmount, commissionAmount, settledAmount
  })),
```

---

### 2. `services/b2b-admin-service/src/routes/supplier-payments.ts` (Multiple Lines)

**Errors**:
```
Objects cannot have property 'type' (line 93)
Objects cannot have property 'performedBy' (line 112)
Property 'type' does not exist on SupplierPayment (line 269)
```

**Example Location** (line 93):
```typescript
const payment = await prisma.supplierPayment.create({
  data: {
    type: "payout",  // ← ERROR: 'type' not a valid field
    amount,
    currency,
    // ...
  },
});
```

**Fix**:
Either:

A. Update schema to include these fields:
```prisma
model SupplierPayment {
  // Add these to schema.prisma if missing:
  type      String     // "payout" | "refund" | "adjustment"
  // ... other fields
}

model SupplierPaymentLog {
  // Add if missing:
  performedBy String?
  // ... other fields
}
```

B. Or map to correct field names if they exist with different names:
```typescript
const payment = await prisma.supplierPayment.create({
  data: {
    status: "pending",  // Use 'status' instead of 'type' if that's the right field
    amount,
    currency,
    // ...
  },
});
```

---

### 3. `services/b2b-admin-service/src/services/payment-gateway/stripe.ts` (Lines 27-28, 137)

**Errors**:
```
Expected type '"2023-10-16"' but got '"2024-04-10"' (line 27)
Property 'HttpClient' does not exist on Stripe (line 28)
Property 'object' cannot be in CustomerCreateSourceParams (line 137)
```

**Location** (line 27):
```typescript
// stripe-ts version mismatch
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",  // ← This version not recognized
  // ...
});
```

**Fix**:
Update to compatible Stripe API version:

```bash
# Check your Stripe package version
npm ls stripe

# Use supported API version (probably 2023-10-16 for your package)
```

Then update the code:
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",  // ← Use supported version
  // ...
});
```

---

## Step-by-Step Resolution

### Step 1: Regenerate Prisma Client
```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npm run db:generate
```
This sync's the TypeScript types with your current Prisma schema.

### Step 2: Check Prisma Schema for Missing Fields
```bash
# Open the schema
nano database/prisma/schema.prisma

# Look for these models:
# - CommissionSettlement
# - SupplierPayment
# - SupplierPaymentLog

# Compare with field names used in:
# - services/b2b-admin-service/src/routes/rules.ts
# - services/b2b-admin-service/src/routes/supplier-payments.ts
```

### Step 3: Update Error Files

**For rules.ts**: Add/remove fields from commission mapping  
**For supplier-payments.ts**: Use correct field names or update schema  
**For stripe.ts**: Update API version to supported one

### Step 4: Rebuild to Verify
```bash
npm run build
# Should pass if all errors are fixed
```

---

## Verification Checklist

- [ ] Run `npm run db:generate`
- [ ] Check `database/prisma/schema.prisma` for field definitions
- [ ] Update `rules.ts` field mappings
- [ ] Update `supplier-payments.ts` field usage
- [ ] Update `stripe.ts` API version
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` successfully
- [ ] Commit fixes with message: "fix: resolve service TypeScript schema mismatches"

---

## Reference Files

**Need to Review/Fix**:
- [services/b2b-admin-service/src/routes/rules.ts](../../services/b2b-admin-service/src/routes/rules.ts)
- [services/b2b-admin-service/src/routes/supplier-payments.ts](../../services/b2b-admin-service/src/routes/supplier-payments.ts)
- [services/b2b-admin-service/src/services/payment-gateway/stripe.ts](../../services/b2b-admin-service/src/services/payment-gateway/stripe.ts)

**Check**:
- [database/prisma/schema.prisma](../../database/prisma/schema.prisma)

---

## Impact Assessment

**Build Status**: ❌ Fails due to these errors  
**Runtime Impact**: Would fail if reached (property access on undefined)  
**Scope**: Only b2b-admin-service  
**Deployment Impact**: Cannot deploy b2b-admin-service until fixed  

---

## Communication

When committing these fixes:

```
git add services/b2b-admin-service/
git commit -m "fix: resolve b2b-admin-service TypeScript schema errors

- Fix CommissionSettlement field mapping (remove bookingAmount, commissionAmount, settledAmount)
- Update SupplierPayment field usage (use correct field names or extend schema)
- Update Stripe API version to supported version (2023-10-16)
- Regenerate Prisma client to ensure type consistency

Fixes build errors in:
- services/b2b-admin-service/src/routes/rules.ts
- services/b2b-admin-service/src/routes/supplier-payments.ts
- services/b2b-admin-service/src/services/payment-gateway/stripe.ts"
```

---

**Created**: March 3, 2026  
**Related To**: Configuration cleanup verification - pre-existing issues discovered during build test
