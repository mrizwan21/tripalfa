# Offline Request Management - Developer Quick Reference

## Essential Reference

### npm Commands

```bash
# Install all workspaces
npm install

# Run complete system locally
npm run dev

# Run just booking-service
npm run dev --workspace=@tripalfa/booking-service

# Run integration tests
npm test -- offlineRequest.integration.test.ts

# Migrate database
npm run db:migrate
npm run db:generate

# Build & type check
npm run build
npx tsc -p tsconfig.json --noEmit

# Linting & formatting
npm run lint
npm run format
```

---

## Architecture Overview

```
Offline Request Flow:
┌─────────────────────────────────────────────────────────┐
│ offlineRequestController                                │
│ (API endpoints: POST, GET, PUT)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ offlineRequestService                                   │
│ (Business logic: state machine, validations)           │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Prisma DB │ │Audit     │ │Notify    │
    │(Offline  │ │Queue     │ │Queue     │
    │Request)  │ │(Logs)    │ │(Messages)│
    └──────────┘ └──────────┘ └──────────┘
```

---

## File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Controller | `services/booking-service/src/controllers/offlineRequestController.ts` | HTTP endpoints |
| Service | `services/booking-service/src/services/offlineRequestService.ts` | Business logic |
| Routes | `services/booking-service/src/routes/offlineRequestRoutes.ts` | Route configuration |
| Schema | `database/prisma/schema.prisma` | Data models |
| Migration | `database/prisma/migrations/001_add_offline_request_management/` | SQL migration |
| Tests | `services/booking-service/src/__tests__/integration/offlineRequest.integration.test.ts` | Integration tests |
| Types | `packages/shared-types/src/` | Shared type definitions |
| Docs | `OFFLINE_REQUEST_MIGRATION_GUIDE.md` | Complete system documentation |
| API Docs | `API_OFFLINE_REQUEST_DOCUMENTATION.md` | API endpoint reference |

---

## State Machine Quick Map

```
Request Lifecycle:

┌─────────────────────────────────────────────────────────┐
│ CREATE REQUEST                                          │
│ (Customer initiates)                                   │
└────────────────────────┬────────────────────────────────┘
                         │
                    PENDING_STAFF
                         │
                         ↓
        ┌────────────────────────────────┐
        │ SUBMIT PRICING (Staff)         │
        │ • Sets pricing                 │
        │ • Calculates difference        │
        │ • Notifies customer            │
        └────────────────────┬───────────┘
                             │
                    PENDING_CUSTOMER_APPROVAL
                             │
                             ├─ APPROVE (Intelligent Routing)
                             │  ├─ If price > 0 → PAYMENT_PENDING
                             │  │                    ↓
                             │  │         RECORD PAYMENT (Staff)
                             │  │                    ↓
                             │  │              COMPLETED ✓
                             │  │
                             │  └─ If price = 0 → COMPLETED ✓
                             │
                             └─ REJECT
                                    ↓
                                REJECTED (terminal)

Alternative: CANCEL at any time → CANCELLED (terminal)
```

---

## API Endpoints Summary

### Public Endpoints (Any User)

| Verb | Route | Purpose |
|------|-------|---------|
| POST | `/api/offline-requests` | Create request |
| GET | `/api/offline-requests/:id` | Get request |
| GET | `/api/offline-requests/ref/:requestRef` | Get by reference |
| PUT | `/api/offline-requests/:id/approve` | Approve pricing |
| PUT | `/api/offline-requests/:id/reject` | Reject pricing |
| GET | `/api/offline-requests/:id/audit` | View audit trail |

### Staff Endpoints (staff/admin only)

| Verb | Route | Purpose |
|------|-------|---------|
| PUT | `/api/offline-requests/:id/pricing` | Submit pricing |
| POST | `/api/offline-requests/:id/payment` | Record payment |
| PUT | `/api/offline-requests/:id/complete` | Mark complete |
| POST | `/api/offline-requests/:id/notes` | Add internal note |
| GET | `/api/offline-requests/queue` | View staff queue |

### Admin Endpoints

| Verb | Route | Purpose |
|------|-------|---------|
| GET | `/api/offline-requests/customer/my-requests` | View customer requests |

---

## Key Methods Reference

### Controller (`offlineRequestController.ts`)

```typescript
// Create request
createOfflineRequest(req, res)

// Retrieve functions
getOfflineRequest(req, res)
getOfflineRequestByRef(req, res)
getCustomerRequests(req, res)

// State transitions
submitPricing(req, res)
approveRequest(req, res)
rejectRequest(req, res)
recordPayment(req, res)

// Utilities
completeRequest(req, res)
cancelRequest(req, res)
addInternalNote(req, res)
getAuditLog(req, res)
```

### Service (`offlineRequestService.ts`)

```typescript
// Core operations
async createRequest(data)
async submitPricing(id, pricing)
async approveRequest(id, approver)
async rejectRequest(id, reason)
async recordPayment(id, payment)

// Supporting operations
async completeRequest(id)
async cancelRequest(id, reason)
async addInternalNote(id, note)
async updateTimeline(id, updates)

// Query operations
async getRequest(id)
async getByRef(requestRef)
async getCustomerRequests(customerId, bookingId, options?)
async getStaffQueue(status?, options?)

// Notifications
async notifyCustomer(requestId, type)
async notifyStaff(requestId, type)

// Audit
async logAction(requestId, action, actor, ...changes)
async getAuditLog(requestId, options?)
```

---

## Important Guards & Validations

### State Transition Guards

```typescript
// submitPricing
if (currentStatus !== 'PENDING_STAFF') 
  → throw StateConflictError

// approveRequest
if (currentStatus !== 'PENDING_CUSTOMER_APPROVAL')
  → throw StateConflictError

// rejectRequest
if (currentStatus !== 'PENDING_CUSTOMER_APPROVAL')
  → throw StateConflictError

// recordPayment
if (currentStatus !== 'PAYMENT_PENDING')
  → throw StateConflictError
```

### Authorization Guards

```typescript
// Customer can only:
- Create requests (for own booking)
- Approve/reject requests (for own requests)
- View own requests & audit logs

// Staff can only:
- Submit pricing
- Record payments
- Add internal notes
- View staff queue & all requests

// Ownership verification
verifyBookingOwnership(customerId, bookingId)
verifyOfflineRequestOwnership(customerId, requestId)
```

---

## Timeline Population

Request object tracks all important timestamps:

```typescript
timeline: {
  createdAt,              // Request created
  pricingSubmittedAt,     // Staff submitted pricing
  customerNotifiedAt,     // Customer notified of pricing
  customerApprovedAt,     // Customer approved
  paymentCompletedAt,     // Payment recorded
  documentsIssuedAt,      // New docs issued
  completedAt             // Request completed
}
```

---

## Notification Queue Integration

Notifications are queued async to avoid blocking:

```typescript
// Automatically created when:
- Pricing submitted → 'pricing_submitted'
- Request approved → 'request_approved'
- Request rejected → 'request_rejected'
- Payment completed → 'payment_completed'
- Request cancelled → 'request_cancelled'

// Queue fields:
{
  offlineRequestId,
  status: 'pending|sent|failed',
  notificationType,
  recipientIds: [],
  content: { ... },
  attemptCount: 0,
  maxAttempts: 5,
  nextRetryAt,
  lastError,
  sentAt,
  createdAt,
  updatedAt
}

// Retry strategy: exponential backoff
```

---

## Audit Log Structure

```typescript
// Created for every state change
{
  id,
  offlineRequestId,
  action: 'CREATED|PRICING_SUBMITTED|APPROVED|REJECTED|...',
  actorId,                // User ID who made the change
  actorType,              // 'customer'|'staff'|'system'
  oldValues: { ... },     // Previous state
  newValues: { ... },     // New state
  details: { ... },       // Additional context
  createdAt
}
```

---

## Database Connection

### Local Development

```bash
# Set .env in repo root
DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa"

# Run migrations
npm run db:migrate
npm run db:generate
```

### Neon Production

```bash
# Connection string format
postgresql://neondb_owner:npg_XXXX@ep-host-pooler.region.aws.neon.tech/neondb

# Already deployed
# See: .env (includes real connection string)
```

---

## Common Queries

### Get Request with All Relations

```typescript
const request = await prisma.offlineChangeRequest.findUnique({
  where: { id: requestId },
  include: {
    auditLogs: {
      orderBy: { createdAt: 'desc' }
    },
    notificationQueue: {
      where: { status: 'pending' }
    }
  }
});
```

### Queue Staff Tasks

```typescript
const queue = await prisma.offlineChangeRequest.findMany({
  where: {
    status: 'PENDING_STAFF',
    priority: { in: ['high', 'urgent'] }
  },
  orderBy: [
    { priority: 'desc' },
    { createdAt: 'asc' }
  ],
  take: 50
});
```

### Customer Request History

```typescript
const requests = await prisma.offlineChangeRequest.findMany({
  where: {
    bookingId: customerId,
    status: { in: ['COMPLETED', 'REJECTED'] }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Testing Guide

### Run All Tests

```bash
npm test -- offlineRequest.integration.test.ts
```

### Test Coverage

Tests cover:
1. ✅ Full workflow (PENDING_STAFF → COMPLETED)
2. ✅ Smart pricing routing (with/without payment)
3. ✅ Rejection workflow
4. ✅ Timeline population
5. ✅ Notification queueing
6. ✅ Audit log creation
7. ✅ Internal notes
8. ✅ State guards (invalid transitions)

### Running Specific Test

```bash
npm test -- offlineRequest.integration.test.ts -t "should complete workflow"
```

---

## Troubleshooting

### Problem: Type errors in controller

**Solution**: Use `getStringParam()` helper:
```typescript
const id = getStringParam(req.params.id);
```

### Problem: State transition fails

**Check**: 
1. Current request status
2. Valid next status in state machine
3. Required fields (e.g., pricing for submitPricing)

### Problem: Notification not sent

**Check**:
1. Notification queue has entry with `status: 'pending'`
2. Retry queue job is running
3. Check notification service logs

### Problem: Database migration failed

**Solution**:
```bash
# Rollback and retry
npm run db:migrate:rollback
npm run db:migrate
npm run db:generate
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# API
API_PORT=3000
API_HOST=0.0.0.0

# Notifications
NOTIFICATION_SERVICE_URL=http://localhost:3001
NOTIFICATION_QUEUE_RETRY_ATTEMPTS=5
NOTIFICATION_QUEUE_RETRY_DELAY=30000  # 30s

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

---

## Performance Considerations

### Indexes (Already Created)

- `idx_offline_request_booking` - booking lookups
- `idx_offline_request_status` - queue filtering
- `idx_offline_request_created` - time-based queries
- `idx_offline_request_ref` - reference lookups
- Similar indexes on audit and notification tables

### Query Optimization

```typescript
// ✅ Good - filters first, limits results
const requests = await prisma.offlineChangeRequest.findMany({
  where: { status: 'PENDING_STAFF' },
  take: 50
});

// ❌ Avoid - no filters
const requests = await prisma.offlineChangeRequest.findMany({
  take: 50
});
```

---

## Integration Checklist

- [ ] Database migrated to Neon
- [ ] Prisma client generated
- [ ] TypeScript compilation passes
- [ ] All 13 endpoints functional
- [ ] Integration tests passing
- [ ] Authentication middleware active
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Notifications queued
- [ ] Error handling complete
- [ ] Documentation deployed
- [ ] API docs generated
- [ ] Team trained on workflow

---

## Further Reading

- Full API Reference: `API_OFFLINE_REQUEST_DOCUMENTATION.md`
- Migration Details: `OFFLINE_REQUEST_MIGRATION_GUIDE.md`
- Architecture Overview: Check service source code comments
- Test Examples: `services/booking-service/src/__tests__/integration/offlineRequest.integration.test.ts`

---

## Support Channels

- **Issues**: Create issue with label `offline-requests`
- **Questions**: Ask in #offline-requests Slack channel
- **Escalation**: @request-management-team

---

**Last Updated**: 2024
**Version**: 1.0.0
