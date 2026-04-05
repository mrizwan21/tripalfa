# TripAlfa Database Quick Reference

## 🎯 Quick Start

```typescript
import { core, finance, ops, local } from '@/packages/shared-database';

// Test connection
await core.$connect();
await core.$disconnect();
```

## 📊 Database Map

| Database | Purpose | Tables | Use For |
|----------|---------|--------|---------|
| **core** | Main OLTP | 76 | Users, bookings, wallet, KYC, flights |
| **finance** | Financial | 26 | Invoices, suppliers, commissions, loyalty |
| **ops** | Operations | 26 | Notifications, rules, documents, CRM |
| **local** | Reference | 121 | Hotels, flights, countries, currencies |

## 🔑 Common Operations

### User & Auth (Core)
```typescript
const user = await core.user.findUnique({
  where: { email: 'test@example.com' },
  include: { role: true, company: true }
});
```

### Booking (Core)
```typescript
const bookings = await core.booking.findMany({
  where: { userId: user.id, status: 'confirmed' },
  include: {
    bookingSegments: true,
    bookingPassengers: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Hotel Search (Local)
```typescript
const hotels = await local.hotel_hotel.findMany({
  where: {
    iso2_country_code: 'US',
    stars: { gte: 3 }
  },
  include: {
    city: true,
    details: true,
    images: { where: { is_default: true } }
  }
});
```

### Invoice (Finance)
```typescript
const invoices = await finance.invoice.findMany({
  where: { userId: user.id },
  include: {
    invoice_line_item: true,
    credit_note: true
  }
});
```

### Notification (Ops)
```typescript
const notifications = await ops.notification.findMany({
  where: { userId: user.id, status: 'pending' },
  orderBy: { createdAt: 'desc' }
});
```

## 🔗 Relationships

```
Core: user → booking → booking_segment → duffel_flight
     └→ wallet_transaction → wallet_ledger
     └→ kyc_verification

Finance: supplier → supplier_product → supplier_product_mapping
        └→ commission_rule → commission_settlement
        └→ invoice → invoice_line_item

Ops: notification → user/booking
    └→ document → document_access
    └→ rule → rule_execution
```

## 📈 Indexes Added

- ✅ All foreign keys indexed (89% coverage)
- ✅ Composite indexes for common queries
- ✅ Partial indexes for active records
- ✅ Total: 488 indexes across all DBs

## 🚀 Performance Tips

1. **Always filter by indexed columns**: userId, status, createdAt
2. **Use composite indexes**: `(userId, status)` for user-specific queries
3. **Paginate results**: Use `take/skip` or cursor-based pagination
4. **Include only needed relations**: Avoid `include: { everything: true }`
5. **Use transactions** for atomic operations

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Relation does not exist" | Check database connection, table name casing |
| "Prisma client not found" | Run `pnpm --filter shared-database db-generate` |
| Slow query | Verify index exists: `\d+ table_name` in psql |
| Connection refused | Check PostgreSQL is running on port 5433 |

## 📚 Full Documentation

See `DATABASE_ANALYSIS_AND_INTEGRATION_GUIDE.md` for:
- Detailed examples
- Transaction patterns
- Error handling
- Monitoring queries
- Optimization strategies

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-04-01
