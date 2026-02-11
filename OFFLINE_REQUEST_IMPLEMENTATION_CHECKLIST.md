# Offline Request Management - Implementation Checklist

## Epic: Offline Booking Request Management System

**Status:** ✅ Core System Ready for Integration

**Created:** February 10, 2026

---

## 🏛️ Architecture Note - Centralized API Gateway

**All offline request APIs are routed through the centralized API Gateway** for:
- ✅ Consistent authentication (JWT validation)
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ Request logging and tracking
- ✅ Response transformation
- ✅ Single point of access

**Gateway Base URL:** `http://localhost:3001/api/offline-requests`

**Key References:**
- [Gateway Integration Guide](./docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md) - Complete integration details
- [Gateway Routing Reference](./GATEWAY_ROUTING_REFERENCE.md) - Quick reference and code examples

---

## Phase 1: Backend Infrastructure ✅ COMPLETED

### Database Setup
- [x] Prisma models added to schema.prisma
  - [x] OfflineChangeRequest model
  - [x] OfflineRequestAuditLog model
  - [x] OfflineRequestNotificationQueue model
- [x] Database migration created
  - [x] Migration SQL file: `migrations/001_add_offline_request_management/migration.sql`
  - [x] All indexes created
  - [x] Foreign keys configured
- [x] Neon PostgreSQL compatible (using JSONB for complex data)

### TypeScript Types
- [x] Created comprehensive type definitions in `packages/shared-types/types/offline-request.ts`
  - [x] Enums (OfflineRequestStatus, OfflineRequestType, etc.)
  - [x] Request/Response types
  - [x] Payload types for all operations
  - [x] Queue and statistics types
- [x] Updated `packages/shared-types/types/index.ts` to export new types

### Service Layer
- [x] Created `offlineRequestService.ts` with core business logic
  - [x] `createRequest()` - Create new offline request
  - [x] `getRequestById()` - Retrieve request by ID
  - [x] `getRequestByRef()` - Retrieve request by reference number
  - [x] `getRequestsByBooking()` - Get requests for a booking
  - [x] `getCustomerRequests()` - Get customer's requests with pagination
  - [x] `getStaffQueue()` - Get pending queue (staff view)
  - [x] `submitPricing()` - Staff submits new pricing
  - [x] `approveRequest()` - Customer approves pricing
  - [x] `rejectRequest()` - Customer rejects pricing
  - [x] `recordPayment()` - Record payment transaction
  - [x] `completeRequest()` - Mark request as completed
  - [x] `cancelRequest()` - Cancel request
  - [x] `addInternalNote()` - Add staff notes
  - [x] `getAuditLog()` - Retrieve audit trail
  - [x] Private helper methods for formatting and audit logging

### API Layer
- [x] Created `offlineRequestController.ts` with 13 route handlers
  - [x] `createOfflineRequest()` - POST endpoint
  - [x] `getOfflineRequest()` - GET by ID endpoint
  - [x] `getOfflineRequestByRef()` - GET by reference endpoint
  - [x] `getCustomerRequests()` - GET customer requests endpoint
  - [x] `getStaffQueue()` - GET queue endpoint
  - [x] `submitPricing()` - PUT pricing endpoint
  - [x] `approveRequest()` - PUT approve endpoint
  - [x] `rejectRequest()` - PUT reject endpoint
  - [x] `recordPayment()` - POST payment endpoint
  - [x] `completeRequest()` - PUT complete endpoint
  - [x] `cancelRequest()` - PUT cancel endpoint
  - [x] `addInternalNote()` - POST notes endpoint
  - [x] `getAuditLog()` - GET audit endpoint

### Routes
- [x] Created `offlineRequestRoutes.ts` with all endpoints
  - [x] POST /api/offline-requests - Create request
  - [x] GET /api/offline-requests/queue - Staff queue
  - [x] GET /api/offline-requests/customer/my-requests - Customer requests
  - [x] GET /api/offline-requests/ref/:requestRef - Get by reference
  - [x] GET /api/offline-requests/:id - Get by ID
  - [x] PUT /api/offline-requests/:id/pricing - Submit pricing
  - [x] PUT /api/offline-requests/:id/approve - Approve request
  - [x] PUT /api/offline-requests/:id/reject - Reject request
  - [x] POST /api/offline-requests/:id/payment - Record payment
  - [x] PUT /api/offline-requests/:id/complete - Complete request
  - [x] PUT /api/offline-requests/:id/cancel - Cancel request
  - [x] POST /api/offline-requests/:id/notes - Add notes
  - [x] GET /api/offline-requests/:id/audit - Get audit log

### App Integration
- [x] Updated `services/booking-service/src/app.ts`
  - [x] Imported offlineRequestRoutes
  - [x] Registered routes at `/api/offline-requests`
  - [x] Applied rate limiting to endpoints

---

## Phase 2: Frontend Integration (B2B Admin) ⏳ PENDING

### Admin Dashboard Components
- [ ] Create OfflineRequestQueue component
  - [ ] Paginated list of pending requests
  - [ ] Priority sorting (urgent → low)
  - [ ] Status filtering
  - [ ] Quick actions (open, approve, cancel)
  - [ ] Search by request reference

- [ ] Create OfflineRequestDetail component
  - [ ] Display original booking details
  - [ ] Show requested changes
  - [ ] Display current pricing
  - [ ] Pricing submission form
  - [ ] Internal notes section
  - [ ] Audit log timeline

- [ ] Create PricingForm component
  - [ ] Base fare input
  - [ ] Taxes input
  - [ ] Markup input
  - [ ] Supplier reference input
  - [ ] Automatic total calculation
  - [ ] Price difference display

- [ ] Create ApprovalModal component
  - [ ] Display price breakdown
  - [ ] Approve/Reject buttons
  - [ ] Rejection reason input
  - [ ] Payment options for price difference

### Admin Dashboard Pages
- [ ] `/admin/offline-requests` - Queue dashboard
  - [ ] Queue overview statistics
  - [ ] Paginated request list
  - [ ] Filter and search
  - [ ] Bulk actions (assign to staff, priority change)

- [ ] `/admin/offline-requests/:id` - Request detail page
  - [ ] Full request details
  - [ ] Pricing form (if pending_staff)
  - [ ] Timeline view
  - [ ] Document viewer

### State Management
- [ ] Create Redux slice for offline requests
  - [ ] Actions for CRUD operations
  - [ ] Selectors for queue, detail, list
  - [ ] Async thunks for API calls
  - [ ] Error handling

### Notifications
- [ ] Add notification badge for new requests
- [ ] Show request status in user notifications
- [ ] Push notifications for request updates (if config enabled)

---

## Phase 3: Frontend Integration (Booking Engine) ⏳ PENDING

### Customer Booking Modifications
- [ ] Create OfflineChangeRequestModal
  - [ ] Request type selection
  - [ ] New itinerary input (flight/hotel specific)
  - [ ] Change reason textarea
  - [ ] Priority selection
  - [ ] Submission form validation

- [ ] Create MyOfflineRequests component
  - [ ] List customer's offline requests
  - [ ] Status badges with colors
  - [ ] Price difference display
  - [ ] Action buttons based on status

- [ ] Create RequestApprovalModal
  - [ ] Display current pricing
  - [ ] Show price difference
  - [ ] Approve/Reject buttons
  - [ ] Payment method selection
  - [ ] Wallet balance check

### Booking Flow Integration
- [ ] Add "Request Change" button to booking detail
  - [ ] Only show when API-based change not available
  - [ ] Quick action to trigger modal

- [ ] Add offline requests tab to booking detail
  - [ ] Show all related requests
  - [ ] Status indicators
  - [ ] Quick approval action

- [ ] Order history page updates
  - [ ] Link to related offline requests
  - [ ] Show request status with booking

---

## Phase 4: Notification Service Integration ⏳ PENDING

### Email Templates
- [ ] offline_request_created.html
  - [ ] Include request reference
  - [ ] Booking details
  - [ ] Change requested
  - [ ] Link to dashboard

- [ ] offline_request_priced.html
  - [ ] New pricing breakdown
  - [ ] Price difference highlighted
  - [ ] Approval link/button
  - [ ] Deadline for approval

- [ ] offline_request_approved.html
  - [ ] Confirmation message
  - [ ] Next steps
  - [ ] Payment link (if needed)

- [ ] offline_request_completed.html
  - [ ] Final confirmation
  - [ ] New documents attached/linked
  - [ ] Next flight/hotel details
  - [ ] Contact support link

### SMS Templates
- [ ] SMS for urgent requests (high priority)
- [ ] SMS for price approval needed
- [ ] SMS for request completed

### In-App Notifications
- [ ] Render offline request notifications in notification center
- [ ] Show unread count badge
- [ ] Deep links to relevant pages

---

## Phase 5: Document Generation Integration ⏳ PENDING

### New Document Generation Methods
- [ ] `generateReissuedETicket()`
  - [ ] Compare old vs new flight details
  - [ ] Generate new ticket number
  - [ ] Include amendment notice
  - [ ] Brand with TripAlfa logo

- [ ] `generateReissuedHotelVoucher()`
  - [ ] Update hotel booking dates
  - [ ] New voucher number
  - [ ] Amendment notice
  - [ ] Updated terms & conditions

- [ ] `generateAmendmentInvoice()`
  - [ ] Original booking amount
  - [ ] Adjustment line item
  - [ ] New total amount
  - [ ] Payment method used

### Document Storage
- [ ] Upload generated documents to storage (S3/GCS)
- [ ] Create document URLs for email delivery
- [ ] Track document versions with request reference

---

## Phase 6: Payment Integration ⏳ PENDING

### Payment Processing
- [ ] Handle positive price differences
  - [ ] Charge customer wallet
  - [ ] Process credit card if needed
  - [ ] Create payment record

- [ ] Handle negative price differences
  - [ ] Credit customer wallet
  - [ ] Create refund transaction
  - [ ] Update balance

### Wallet Integration
- [ ] Check wallet balance before approval
- [ ] Process wallet charge on payment record
- [ ] Handle insufficient balance scenario
- [ ] Provide fallback payment method

### Payment Reconciliation
- [ ] Link payment to offline request
- [ ] Update payment status when completed
- [ ] Reconcile with supplier payments
- [ ] Track profit/loss per request

---

## Phase 7: Testing ⏳ PENDING

### Unit Tests
- [ ] Test offlineRequestService.ts
  - [ ] Each service method
  - [ ] Error cases
  - [ ] Business logic validation
  - [ ] State transitions

- [ ] Test offlineRequestController.ts
  - [ ] Request validation
  - [ ] Response formatting
  - [ ] Authorization checks
  - [ ] Error handling

### Integration Tests
- [ ] API endpoint tests
  - [ ] Happy path for each endpoint
  - [ ] Error cases
  - [ ] Permission checks
  - [ ] Rate limiting

- [ ] Database tests
  - [ ] Create/read/update operations
  - [ ] Foreign key relationships
  - [ ] Index performance

- [ ] E2E tests
  - [ ] Complete workflow: create → approve → payment → complete
  - [ ] Rejection workflow
  - [ ] Cancellation workflow
  - [ ] Multiple requests for same booking

### Load Testing
- [ ] Test queue endpoint with 1000+ requests
- [ ] Test concurrent payment processing
- [ ] Test pagination performance

---

## Phase 8: Deployment & Monitoring ⏳ PENDING

### Pre-Production
- [ ] Load test on staging environment
- [ ] Data migration strategy from test data
- [ ] Backup & recovery procedures
- [ ] Performance baseline establishment

### Production Deployment
- [ ] Deploy database migration on Neon
- [ ] Deploy service updates
- [ ] Deploy admin UI updates
- [ ] Deploy booking engine updates
- [ ] Deployment rollback plan

### Monitoring & Alerts
- [ ] Monitor request processing time
- [ ] Track approval/rejection rates
- [ ] Monitor payment success rate
- [ ] Alert on queue buildup (>100 pending)
- [ ] Alert on processing failures
- [ ] Track SLA metrics

### Logging
- [ ] Log all state transitions
- [ ] Log pricing changes
- [ ] Log payment transactions
- [ ] User action audit trail
- [ ] Error logging with context

---

## Phase 9: Post-Deployment ⏳ PENDING

### Staff Training
- [ ] Create staff documentation
- [ ] Record demo video
- [ ] Hold training session
- [ ] Create FAQ document

### Customer Communication
- [ ] Update FAQ on website
- [ ] Send announcement email
- [ ] Update help center
- [ ] Create tutorial video

### Ongoing Maintenance
- [ ] Monitor SLA targets (2-4 hour resolution)
- [ ] Analyze request patterns
- [ ] Optimize pricing workflow
- [ ] Gather user feedback
- [ ] Plan next improvements

---

## Dependencies & Integration Points

### Internal Services
- **Booking Service** ✅ - Core integration point
- **Notification Service** ⏳ - Email/SMS/Push notifications
- **Document Generation Service** ⏳ - E-tickets, vouchers, invoices
- **Payment Service** ⏳ - Process payments for price differences
- **User Service** ⏳ - Customer/staff authentication & authorization
- **Wallet Service** ⏳ - Process wallet charges/credits

### External Systems
- **Neon Database** ✅ - PostgreSQL hosting
- **Supplier APIs** ⏳ - Hotelston, Innstant, Duffel, Amadeus
- **Email Service** ⏳ - SendGrid/Mailjet
- **SMS Service** ⏳ - Twilio
- **Push Notification Service** ⏳ - OneSignal/Firebase
- **Document Storage** ⏳ - AWS S3/Google Cloud Storage

---

## Environment Variables Required

```env
# Database (Neon)
DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Notification Service
NOTIFICATION_SERVICE_URL="http://localhost:3005"
MAILJET_API_KEY="xxx"
MAILJET_API_SECRET="xxx"

# Payment Service
PAYMENT_SERVICE_URL="http://localhost:3006"
STRIPE_API_KEY="xxx"

# Document Storage
AWS_S3_BUCKET="tripalfa-documents"
AWS_REGION="us-east-1"

# Feature Flags
ENABLE_OFFLINE_REQUESTS="true"
OFFLINE_REQUEST_SLA_HOURS="4"
```

---

## Success Criteria

- [x] Core API fully functional
- [x] Database schema created and migrated
- [ ] Admin dashboard with queue management
- [ ] Customer interface for creating requests
- [ ] Approval workflow fully implemented
- [ ] Payment processing integrated
- [ ] Document generation working
- [ ] Notification system sending alerts
- [ ] Unit test coverage > 80%
- [ ] E2E tests covering all workflows
- [ ] Average processing time < 4 hours
- [ ] Staff satisfaction > 4.5/5
- [ ] Customer satisfaction > 4.0/5

---

## Timeline Estimate

- **Phase 1 (Backend):** ✅ 2-3 days (COMPLETED)
- **Phase 2 (Admin UI):** 5-7 days
- **Phase 3 (Customer UI):** 4-6 days
- **Phase 4 (Notifications):** 2-3 days
- **Phase 5 (Documents):** 2-3 days
- **Phase 6 (Payments):** 2-3 days
- **Phase 7 (Testing):** 3-4 days
- **Phase 8 (Deployment):** 1-2 days
- **Phase 9 (Training):** 1-2 days

**Total Estimate:** 23-33 days from start to deployment

**Current Status:** 2-3 days completed (Backend ready)
**Remaining:** ~21-30 days for full system

---

## Decision Log

### DB Schema Decisions ✅
- Used JSONB for flexible nested data (flights/hotels need different structures)
- Simple index strategy on key query fields
- Foreign keys with CASCADE delete for audit logs

### API Design Decisions ✅
- RESTful endpoints with clear status transitions
- Separate endpoints for each operation (not PATCH for multiple fields)
- Rate limiting on all endpoints (100 req/15min default)

### Notification Triggers ✅
- Auto-notify staff when request created
- Auto-notify customer when pricing submitted
- Manual notification on approval/rejection
- Auto-notify on completion with documents

### Type System ✅
- Centralized types in shared-types package
- Separate request/response types
- Use enums for fixed value sets
- Optional fields with ? for nullable data

---

## Known Limitations & Future Enhancements

### Current Limitations
1. Single supplier reference per request (could be multi-option in future)
2. No re-pricing after rejection (customer must create new request)
3. No automatic refund for negative price differences
4. No bulk operations on queue

### Planned Future Enhancements
1. WebSocket support for real-time queue updates
2. AI-assisted pricing recommendations
3. Multi-option pricing (multiple suppliers)
4. Automatic refund processing
5. Bulk operations (batch approve, assign to staff)
6. Request grouping by passenger
7. Historical pricing analysis
8. Staff performance metrics dashboard
9. Customer satisfaction surveys
10. Integration with supplier systems for automated pricing

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Backend Lead | - | 2026-02-10 | ✅ APPROVED |
| DevOps | - | - | ⏳ PENDING |
| QA Lead | - | - | ⏳ PENDING |
| Product Manager | - | - | ⏳ PENDING |

---

**Last Updated:** February 10, 2026
**Version:** 1.0 - Initial Implementation Plan
