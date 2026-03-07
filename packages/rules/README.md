# @tripalfa/rules

A comprehensive, production-ready Rules Engine package for TripAlfa. Centralizes all pricing, markup, commission, coupon, and loyalty management logic into a single, well-typed module.

## Overview

The `@tripalfa/rules` package consolidates rule management across multiple services, providing:

- **Rule Matching Engine** - Find applicable markup and commission rules based on context
- **Pricing Engine** - Calculate comprehensive pricing with all modifiers
- **Coupon Management** - Validate and apply discount coupons
- **Loyalty System** - Track customer loyalty points and tiers
- **Corporate Contracts** - Support enterprise discount contracts

## Features

### ✅ Rule Matching

- Context-based rule matching with caching support
- Priority-based rule evaluation
- Validity period checking
- Entity-specific restrictions (supplier, branch, user)

### ✅ Pricing Calculations

- Multi-step pricing with markup application
- Commission calculations
- Coupon and loyalty discount integration
- Corporate contract support
- Comprehensive price breakdown

### ✅ Coupon System

- Usage limit tracking (total and per-user)
- Date-based validity validation
- Amount-based restrictions
- User allowlisting/blocklisting
- Redemption recording

### ✅ Loyalty Management

- Points earning and redemption
- Tier-based benefits
- Automatic tier upgrades
- Transaction history tracking

### ✅ Type Safety

- 40+ TypeScript interfaces
- Full type coverage for all operations
- Zod-based validation

## Installation

```bash
npm install @tripalfa/rules
```

The package is automatically available in this monorepo via npm workspaces.

## Usage

### RuleMatchingEngine

```typescript
import { RuleMatchingEngine } from "@tripalfa/rules";

const ruleEngine = new RuleMatchingEngine(true); // Enable caching

// Find applicable markup rules
const markupRules = await ruleEngine.findApplicableMarkupRules({
  bookingType: "flight",
  companyId: "company-123",
  supplierId: "supplier-456",
  serviceDetails: {
    /* ... */
  },
});

// Find first applicable commission rule
const commissionRule = await ruleEngine.findFirstApplicableCommissionRule({
  bookingType: "hotel",
  companyId: "company-123",
});
```

### PricingEngine

```typescript
import { PricingEngine } from "@tripalfa/rules";

const pricingEngine = new PricingEngine();

// Calculate comprehensive pricing
const pricing = await pricingEngine.calculatePricing({
  bookingType: "flight",
  baseAmount: 1000,
  currency: "USD",
  companyId: "company-123",
  userId: "user-456",
  couponCode: "SUMMER2024",
});

console.log({
  baseAmount: pricing.baseAmount,
  markup: pricing.markup,
  discount: pricing.discount,
  commission: pricing.commission,
  totalAmount: pricing.totalAmount,
  breakdown: pricing.breakdown,
});
```

### Coupon Validation

```typescript
// Validate and apply coupon
const result = await pricingEngine.validateAndApplyCoupon(
  "SUMMER2024",
  "user-456",
  1500,
  "USD",
);

if (result.valid) {
  console.log(`Discount: ${result.discountAmount}`);
  // Record redemption
  await pricingEngine.recordCouponRedemption({
    couponId: result.coupon.id,
    userId: "user-456",
    bookingId: "booking-789",
    originalAmount: 1500,
    discountAmount: result.discountAmount,
    finalAmount: 1500 - result.discountAmount,
    currency: "USD",
  });
} else {
  console.log(`Error: ${result.errorMessage}`);
}
```

### Loyalty Management

```typescript
// Award loyalty points
await pricingEngine.awardLoyaltyPoints({
  userId: "user-456",
  bookingId: "booking-789",
  transactionType: "earn",
  points: 100,
  description: "Points earned from flight booking",
});

// Get customer loyalty
const loyalty = await pricingEngine.getCustomerLoyalty("user-456");
console.log({
  totalPoints: loyalty.totalPoints,
  currentTier: loyalty.currentTier.name,
  availablePoints: loyalty.availablePoints,
});
```

### Express Middleware

```typescript
import express from "express";
import {
  PricingEngine,
  createPricingCalculationMiddleware,
} from "@tripalfa/rules";

const app = express();
const pricingEngine = new PricingEngine();

// Use pricing middleware
app.post(
  "/calculate-price",
  createPricingCalculationMiddleware(pricingEngine),
  (req, res) => {
    res.json(req.pricing);
  },
);

// Use rule validation middleware
app.post("/rules/create", createRuleValidationMiddleware(), (req, res) => {
  // Create rule logic here
  res.json({ success: true });
});
```

## Type Definitions

### Core Types

```typescript
// Rule types
interface MarkupRule {
  id: string;
  name: string;
  code: string;
  priority: number;
  markupType: "percentage" | "fixed" | "multiplier";
  markupValue: number;
  applicableTo: string[];
  // ... more fields
}

// Pricing request/response
interface PricingCalculationRequest {
  bookingType: string;
  baseAmount: number;
  currency: string;
  couponCode?: string;
  // ... more fields
}

interface PricingCalculationResponse {
  baseAmount: number;
  markup: number;
  commission: number;
  discount: number;
  totalAmount: number;
  breakdown: PriceBreakdownItem[];
}

// Coupon types
interface DiscountCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validTo: string;
  // ... more fields
}

// Loyalty types
interface LoyaltyTier {
  name: string;
  tierLevel: number;
  discountPercentage: number;
  minPoints: number;
  maxPoints?: number;
  // ... more fields
}
```

See [src/types/](src/types/) for complete type definitions.

## API Reference

### RuleMatchingEngine

#### RuleMatchingEngine Methods

- `findApplicableMarkupRules(context: RuleMatchContext): Promise<MarkupRule[]>`
- `findApplicableCommissionRules(context: RuleMatchContext): Promise<CommissionRule[]>`
- `findFirstApplicableMarkupRule(context: RuleMatchContext): Promise<MarkupRule | null>`
- `findFirstApplicableCommissionRule(context: RuleMatchContext): Promise<CommissionRule | null>`
- `invalidateCache(ruleType?: 'markup' | 'commission'): void`
- `setCacheEnabled(enabled: boolean): void`
- `disconnect(): Promise<void>`

### PricingEngine

#### PricingEngine Methods

- `calculatePricing(request: PricingCalculationRequest): Promise<PricingCalculationResponse>`
- `validateAndApplyCoupon(code, userId, amount, currency): Promise<CouponValidationResult>`
- `recordCouponRedemption(data): Promise<void>`
- `awardLoyaltyPoints(data): Promise<void>`
- `getCustomerLoyalty(userId): Promise<CustomerLoyalty | null>`
- `disconnect(): Promise<void>`

## Error Handling

The package includes custom error classes for better error handling:

```typescript
import {
  RuleEngineError,
  RuleNotFoundError,
  InvalidCouponError,
  PricingCalculationError,
  LoyaltyError,
} from "@tripalfa/rules";

try {
  await pricingEngine.validateAndApplyCoupon("INVALID", "user-1", 100, "USD");
} catch (error) {
  if (error instanceof InvalidCouponError) {
    console.error(`Invalid coupon: ${error.message}`);
  }
}
```

## Consolidation Details

This package consolidates rule management code from:

1. **Rule Matching Engine** (from `apps/b2b-admin/src/services/booking-service/src/services/ruleMatchingEngine.ts`)
   - Context-based markup and commission rule matching
   - Caching support
   - Priority-based rule selection

2. **Pricing Engine** (from `apps/booking-engine/src/lib/price.ts`)
   - Comprehensive pricing calculations
   - Markup application
   - Commission calculations
   - Coupon validation
   - Loyalty discount integration
   - Corporate contract support

3. **Type Definitions** (from `packages/shared-types/types/pricing.d.ts`)
   - All pricing-related interfaces
   - Coupon and loyalty types
   - Corporate contract definitions

## Performance Considerations

- **Caching**: Rule matching engine supports optional caching with 5-minute TTL
- **Database Queries**: Uses Prisma for optimized database access
- **Lazy Loading**: Loyalty and contract data loaded only when needed

## Best Practices

1. **Reuse Engine Instances**: Create pricing and rule engines once and reuse

   ```typescript
   const pricingEngine = new PricingEngine();
   // Use across requests
   ```

2. **Enable Caching**: For high-traffic scenarios, enable rule caching

   ```typescript
   const ruleEngine = new RuleMatchingEngine(true);
   ```

3. **Handle Errors**: Use specific error types for better error handling

   ```typescript
   catch (error) {
     if (error instanceof InvalidCouponError) {
       // Handle coupon errors
     }
   }
   ```

4. **Disconnect Gracefully**: Close database connections on shutdown

   ```typescript
   process.on("SIGTERM", async () => {
     await pricingEngine.disconnect();
   });
   ```

## Testing

The package is fully typed and integrates with the existing Prisma schema. Test files can be added to `src/**/*.test.ts`.

## Migration from Old Code

If migrating from previous rule implementations:

1. Replace imports:

   ```typescript
   // Before
   import { RuleMatchingEngine } from "apps/b2b-admin/...";

   // After
   import { RuleMatchingEngine } from "@tripalfa/rules";
   ```

2. Update Prisma dependencies - ensure Prisma client is available

3. Update route handlers to use the unified `PricingEngine`

## Contributing

When adding new features:

1. Add types to appropriate file in `src/types/`
2. Implement service methods in `src/services/`
3. Add utilities to `src/utils/` if needed
4. Update middleware in `src/middleware/` for new endpoints
5. Update documentation

## License

MIT

## Related Packages

- `@tripalfa/notifications` - Notification management
- `@tripalfa/wallet` - Multi-currency wallet system
- `@tripalfa/shared-types` - Shared type definitions
