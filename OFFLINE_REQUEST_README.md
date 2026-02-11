# 🚀 Offline Booking Request Management System

> **Status:** ✅ Phase 1 Backend Infrastructure Complete  
> **Database:** Neon PostgreSQL  
> **API Framework:** Express.js + TypeScript  
> **Last Updated:** February 10, 2026

## 📋 What This System Does

The Offline Booking Request Management System enables customers to request booking modifications (flights and hotels) when API-based changes aren't available. Staff review, price, and approve changes manually, with full audit trails and notification support.

### Key Features

- 📝 **Request Creation** - Customers submit change requests with detailed itineraries
- 👥 **Staff Queue** - Organized queue with priority sorting
- 💰 **Pricing Workflow** - Staff submits new pricing with automatic difference calculation
- ✅ **Approval Process** - Customers approve/reject with optional payment
- 📄 **Document Generation** - Automatic re-issuance of E-tickets and vouchers
- 🔔 **Notifications** - Email, SMS, and in-app alerts at each stage
- 📊 **Audit Trail** - Complete history of all actions with actor information
- 💳 **Payment Integration** - Handle price differences through wallet or credit card

---

## 🏗️ Architecture

### Backend Infrastructure (✅ COMPLETE)

```
API Endpoints (13 total)
        ↓
Controllers (Request validation & routing)
        ↓
Services (Business logic & state machine)
        ↓
Database (Neon PostgreSQL)
        ↓
Audit Logs (Complete history)
```

### Data Models

1. **OfflineChangeRequest** - Main entity (34 fields including JSONB)
2. **OfflineRequestAuditLog** - Audit trail
3. **OfflineRequestNotificationQueue** - Notification queue

---

## 📚 Quick Links

### Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [OFFLINE_REQUEST_GATEWAY_INTEGRATION.md](./docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md) | **Central API Gateway routing & integration** | All Developers |
| [OFFLINE_REQUEST_API.md](./docs/OFFLINE_REQUEST_API.md) | Complete API documentation with examples | Developers, API Consumers |
| [OFFLINE_REQUEST_QUICK_START.md](./docs/OFFLINE_REQUEST_QUICK_START.md) | Setup, integration examples, troubleshooting | New Team Members |
| [OFFLINE_REQUEST_IMPLEMENTATION_CHECKLIST.md](./OFFLINE_REQUEST_IMPLEMENTATION_CHECKLIST.md) | Phase-by-phase implementation roadmap | Project Managers, Leads |
| [OFFLINE_REQUEST_IMPLEMENTATION_SUMMARY.md](./OFFLINE_REQUEST_IMPLEMENTATION_SUMMARY.md) | What's been completed and what's next | All Stakeholders |

### Code References

| File | Purpose |
|------|---------|
| `database/prisma/schema.prisma` | Database schema with all models |
| `database/prisma/migrations/001_add_offline_request_management/` | Database migration files |
| `packages/shared-types/types/offline-request.ts` | TypeScript type definitions |
| `services/booking-service/src/services/offlineRequestService.ts` | Business logic (600+ lines) |
| `services/booking-service/src/controllers/offlineRequestController.ts` | API handlers (420+ lines) |
| `services/booking-service/src/routes/offlineRequestRoutes.ts` | Route definitions |

---

## 🚀 Getting Started

### 1. Database Setup

Ensure your `DATABASE_URL` points to your Neon PostgreSQL database in `.env`:

```env
DATABASE_URL="postgresql://user:password@neon-hostname/database?sslmode=require"
```

Apply the migration:

```bash
npm run db:migrate
npm run db:generate
```

### 2. Start the Service

```bash
npm run dev --workspace=@tripalfa/booking-service
```

Health check:

```bash
curl http://localhost:3001/health
```

### 3. Test an Endpoint

```bash
# Create an offline request
curl -X POST http://localhost:3001/api/offline-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookingId":"123","bookingRef":"BK-2024-001","requestType":"flight_change","requestedChanges":{...}}'
```

See [OFFLINE_REQUEST_QUICK_START.md](./docs/OFFLINE_REQUEST_QUICK_START.md) for more examples.

---

## 📍 API Endpoints

**All endpoints are routed through the centralized API Gateway** for consistent authentication, rate limiting, and logging.

**Base URL:** `http://localhost:3001/api/offline-requests`

**Authentication:** All requests require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

See [Centralized Gateway Integration Guide](./docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md) for complete integration details.

### Create & Retrieve

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/` | Create offline request |
| `GET` | `/:id` | Get request by ID |
| `GET` | `/ref/:requestRef` | Get request by reference |
| `GET` | `/customer/my-requests` | Get customer's requests |
| `GET` | `/queue` | Get staff queue |

### Workflow (All Through Gateway)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PUT` | `/:id/pricing` | Staff submits pricing |
| `PUT` | `/:id/approve` | Customer approves |
| `PUT` | `/:id/reject` | Customer rejects |
| `POST` | `/:id/payment` | Record payment |
| `PUT` | `/:id/complete` | Mark as completed |
| `PUT` | `/:id/cancel` | Cancel request |

### Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/:id/notes` | Add internal note |
| `GET` | `/:id/audit` | Get audit log |

---

## 🔄 Request Workflow

```mermaid
sequenceDiagram
    participant Customer
    participant API
    participant Staff
    participant Database
    
    Customer->>API: Create offline request
    API->>Database: Save request (pending_staff)
    Database->>API: Return reference OCR-2024-001234
    
    Staff->>API: Get queue
    API->>Database: Query pending requests
    Database->>API: Return prioritized list
    
    Staff->>API: Submit pricing
    API->>Database: Update pricing_submitted status
    API->>Customer: Send notification
    
    Customer->>API: Approve pricing
    API->>Database: Update approved status
    API->>Customer: Request payment
    
    Customer->>API: Pay difference
    API->>Database: Record payment
    API->>Database: Update payment_pending status
    
    Staff->>API: Mark complete
    API->>Database: Generate documents
    API->>Customer: Send final notification
    API->>Database: Update completed status
```

---

## 📊 State Machine

```
pending_staff ──→ pricing_submitted ──→ pending_customer_approval
                                              │
                                              ├─→ approved ──→ payment_pending ──→ completed
                                              ├─→ rejected
                                              └─→ cancelled

Can cancel from: pending_staff, pricing_submitted, pending_customer_approval
```

---

## 👥 Status by Team

### ✅ Backend Team (Phase 1 - COMPLETE)

- [x] Database design and migration
- [x] Service layer implementation
- [x] API endpoints and controllers
- [x] Type definitions
- [x] API documentation

**Next:** Deploy to staging environment

### ⏳ Frontend Team (Phase 2-3 - UPCOMING)

- [ ] Admin dashboard for staff queue management
- [ ] Customer interface for creating requests
- [ ] Approval and payment workflows

**Start:** After backend deployment to staging

### ⏳ Integration Team (Phase 4-6 - UPCOMING)

- [ ] Notification service integration
- [ ] Document generation integration
- [ ] Payment service integration

**Start:** After frontend development

---

## 📈 Timeline

| Phase | Scope | Duration | Status |
|-------|-------|----------|--------|
| 1 | Backend Infrastructure | 2-3 days | ✅ COMPLETE |
| 2 | Admin Dashboard | 5-7 days | ⏳ PENDING |
| 3 | Customer Interface | 4-6 days | ⏳ PENDING |
| 4 | Notifications | 2-3 days | ⏳ PENDING |
| 5 | Documents | 2-3 days | ⏳ PENDING |
| 6 | Payments | 2-3 days | ⏳ PENDING |
| 7 | Testing | 3-4 days | ⏳ PENDING |
| 8 | Deployment | 1-2 days | ⏳ PENDING |
| 9 | Training | 1-2 days | ⏳ PENDING |

**Total Estimate:** 23-33 days from start to production

---

## 🔐 Security Features

- ✅ **Authentication** - JWT token or user ID required on all endpoints
- ✅ **Authorization** - Customers see only their requests; staff see queue
- ✅ **Rate Limiting** - 100 requests per 15 minutes (configurable)
- ✅ **Input Validation** - All payloads validated with TypeScript
- ✅ **Audit Trail** - Every action logged with actor and timestamp
- ✅ **Encryption at Rest** - Handled by Neon PostgreSQL

---

## 🧪 Testing

### Pre-built Routes for Testing

```bash
# Create request
curl -X POST http://localhost:3001/api/offline-requests \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Get queue
curl http://localhost:3001/api/offline-requests/queue

# View request
curl http://localhost:3001/api/offline-requests/{id}

# View audit log
curl http://localhost:3001/api/offline-requests/{id}/audit
```

### Unit Tests (Next Phase)

```bash
npm test -- services/offlineRequestService.test.ts
npm test -- controllers/offlineRequestController.test.ts
```

### E2E Tests (Next Phase)

```bash
npm run test:api:offline-requests
```

---

## 📋 Implementation Phases

### Phase 1: Backend ✅ COMPLETE
- [x] Database setup
- [x] Service layer
- [x] API endpoints
- [x] Type system
- [x] Documentation

**Files:** 
- `database/prisma/schema.prisma`
- `database/prisma/migrations/`
- `packages/shared-types/types/offline-request.ts`
- `services/booking-service/src/services/offlineRequestService.ts`
- `services/booking-service/src/controllers/offlineRequestController.ts`
- `services/booking-service/src/routes/offlineRequestRoutes.ts`

### Phase 2: Admin Dashboard 🎯
- [ ] Create components for request management
- [ ] Build staff queue interface
- [ ] Implement pricing form
- [ ] Add request detail page

### Phase 3: Customer Interface
- [ ] Build request creation modal
- [ ] Add approval workflow
- [ ] Implement payment selection

### Phase 4-6: Integrations
- [ ] Connect to notification service
- [ ] Add document generation
- [ ] Process payments

### Phase 7-9: Launch
- [ ] Testing and QA
- [ ] Production deployment
- [ ] Staff & customer training

---

## 🔍 Key Decisions

### Why JSONB for Itineraries?

Flights and hotels have different structures:
- **Flight:** Origin, destination, airline, cabin class, passengers
- **Hotel:** Hotel name, dates, rooms, board type

JSONB allows flexible storage without multiple tables.

### Why REST vs GraphQL?

Simpler endpoints, easier to document, better rate limiting, standard HTTP caching.

### Why Separate Request/Response Types?

Clearer API contracts, easier to extend without breaking changes.

---

## 🐛 Troubleshooting

### "Cannot find Prisma client"

```bash
npm run db:generate
```

### "Database connection failed"

Check your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:pass@neon-hostname/db?sslmode=require"
```

### "Rate limit exceeded"

Wait 15 minutes or increase limits in `config/security.ts`.

### "Unauthorized / No authentication"

Include JWT token in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

See [OFFLINE_REQUEST_QUICK_START.md](./docs/OFFLINE_REQUEST_QUICK_START.md#common-issues--solutions) for more.

---

## 📞 Support

### Documentation
- **Full API docs:** `docs/OFFLINE_REQUEST_API.md`
- **Quick start:** `docs/OFFLINE_REQUEST_QUICK_START.md`
- **Implementation plan:** `OFFLINE_REQUEST_IMPLEMENTATION_CHECKLIST.md`

### Files to Review
- **Types:** `packages/shared-types/types/offline-request.ts`
- **Service:** `services/booking-service/src/services/offlineRequestService.ts`
- **API:** `services/booking-service/src/controllers/offlineRequestController.ts`

### Questions?
- Check documentation first
- Review code comments (extensive)
- Check GitHub issues
- Contact backend team

---

## 🎯 Success Criteria

| Criterion | Target | Current | Status |
|-----------|--------|---------|--------|
| API Endpoints | 13 | 13 | ✅ |
| Service Methods | 14 | 14 | ✅ |
| Database Tables | 3 | 3 | ✅ |
| Type Definitions | 30+ | 50+ | ✅ |
| Code Coverage | 80% | TBD | 🔄 |
| Avg Processing Time | <4 hours | TBD | 🔄 |
| Staff Satisf. | 4.5/5 | TBD | 🔄 |
| Customer Satisf. | 4.0/5 | TBD | 🔄 |

---

## 📝 License & Credits

Part of TripAlfa - Booking & Travel Management Platform

Created: February 10, 2026  
Version: 1.0-beta  
Database: Neon PostgreSQL

---

## 🚀 Next Steps

### For Backend Teams
1. Deploy to staging environment
2. Run comprehensive test suite
3. Load test the queue endpoint
4. Set up monitoring and alerting

### For Frontend Teams
1. Review API documentation (`docs/OFFLINE_REQUEST_API.md`)
2. Set up TypeScript import for types
3. Begin admin dashboard development
4. Start booking engine integration

### For DevOps/Infra Teams
1. Configure Neon PostgreSQL backups
2. Set up monitoring dashboards
3. Configure auto-scaling policies
4. Plan high-availability setup

### For QA Teams
1. Review test strategy in implementation checklist
2. Prepare test cases
3. Set up test automation
4. Plan UAT environment

---

**Ready to build? Start with the [Quick Start Guide](./docs/OFFLINE_REQUEST_QUICK_START.md)!** 🎯
