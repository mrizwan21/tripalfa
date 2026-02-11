# Phase 5: Document Generation System
## Planning & Architecture Document

**Status**: 🟢 IN PROGRESS  
**Phase Duration**: 5-7 days (estimated)  
**Target Completion**: 1 week from start  
**Dependencies**: Phase 4 (Notification System) ✅ Complete

---

## 1. Phase Overview

### What We're Building
A comprehensive document generation and management system that enables:
- Automatic PDF generation for booking confirmations, invoices, and receipts
- Template management with Handlebars/EJS templating
- Email delivery with attachments
- Document versioning and retention policies
- Scheduled and on-demand generation
- S3/cloud storage for documents
- User document portal/history

### Business Value
- ✅ Professional booking confirmations sent automatically
- ✅ Invoice/receipt generation for financial records
- ✅ Audit trail with document versioning
- ✅ Self-service document download for users
- ✅ Compliance with payment processor requirements
- ✅ Improved customer experience with organized documents

### High-Level Architecture
```
Booking Confirmation Event
        ↓
Document Generation Service
        ├── Template Engine (Handlebars)
        ├── PDF Renderer (Puppeteer/wkhtmltopdf)
        └── Content Generator (booking data → template context)
        ↓
Document Storage & Versioning
        ├── Database (metadata + retention rules)
        ├── Cloud Storage (S3/Azure Blob)
        └── Document Repository (versioning)
        ↓
Distribution Channels
        ├── Email (via Notification System)
        ├── User Portal (download links)
        ├── Admin Portal (view/resend)
        └── API (programmatic access)
        ↓
Audit & Compliance
        ├── Access Logs
        ├── Modification History
        └── Retention Enforcement
```

---

## 2. Detailed Scope

### 2.1 Document Types (Phase 5)

**Type 1: Booking Confirmation** (REQUIRED)
- Triggered: When booking status = confirmed
- Content: Trip details, dates, costs, confirmation number
- Recipients: Customer, admin
- Format: PDF + HTML preview

**Type 2: Invoice** (REQUIRED)
- Triggered: When payment received
- Content: Itemized costs, payment method, invoice number, date
- Recipients: Customer, accounting
- Format: PDF + HTML preview

**Type 3: Receipt** (REQUIRED)
- Triggered: Immediately after payment
- Content: Transaction summary, reference ID, timestamp
- Recipients: Customer
- Format: PDF only

**Type 4: Offline Request Confirmation** (OPTIONAL - Phase 5 Stretch)
- Triggered: When offline request approved
- Content: Request details, approval notes, next steps
- Recipients: Customer
- Format: PDF + HTML preview

### 2.2 Core Features

**Feature 1: Template Management**
- Store HTML/Handlebars templates in database
- Support for email-safe and PDF-ready templates
- Preview capability (generate sample document)
- Template versioning (track changes over time)
- Ability to link templates to document types

**Feature 2: PDF Generation**
- Convert HTML → PDF using Puppeteer or similar
- Support custom fonts, colors, images
- Preserve formatting across browsers
- Handle dynamic data injection
- Optimize file size
- Page breaks/pagination

**Feature 3: Storage & Versioning**
- Store generated documents in S3/blob storage
- Keep metadata in database (timestamp, user, status)
- Version history (retrieve old versions)
- Retention policies (auto-delete after X days)
- Access audit logs

**Feature 4: Distribution**
- Email integration (via Notification System from Phase 4)
- User portal for document downloads
- Admin ability to resend/regenerate
- Optional scheduled delivery
- Webhook notifications on generation completion

**Feature 5: User Portal**
- List all documents (booking confirmations, invoices, receipts)
- Filter by type and date range
- Download as PDF
- Print-friendly view
- Search by booking/invoice number

---

## 3. Technical Implementation Plan

### 3.1 Backend Service Architecture

**New Service: Document Generation Service**
Location: `services/document-service/`

**Key Components:**
1. **DocumentController** - REST API endpoints
2. **DocumentService** - Business logic orchestration
3. **TemplateProvider** - Load and manage templates
4. **PDFGenerator** - HTML → PDF conversion
5. **StorageProvider** - S3/cloud storage interface
6. **VersionManager** - Document versioning
7. **DistributionService** - Email/webhook delivery

**Database Models (Prisma):**
```prisma
model DocumentTemplate {
  id String @id @default(cuid())
  name String // "Booking Confirmation", "Invoice"
  type DocumentType // enum
  format DocumentFormat // HTML, PDF, both
  content String @db.Text // Handlebars template
  version Int @default(1)
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documents Document[]
  @@unique([name, type, version])
}

model Document {
  id String @id @default(cuid())
  type DocumentType
  status GenerationStatus // pending, generated, failed, sent
  userId String
  bookingId String? // optional
  invoiceId String? // optional
  templateId String
  template DocumentTemplate @relation(fields: [templateId], references: [id])
  storagePath String? // S3 path
  metadata Json // { booking_ref, invoice_num, etc }
  content String? @db.Text // HTML before PDF
  fileUrl String? // public download link
  generatedAt DateTime?
  sentAt DateTime?
  expiresAt DateTime? // retention
  accessedAt DateTime? // audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documentAccess DocumentAccess[]
}

model DocumentAccess {
  id String @id @default(cuid())
  documentId String
  document Document @relation(fields: [documentId], references: [id])
  userId String
  action String // view, download, print, email-resent
  ipAddress String?
  userAgent String?
  timestamp DateTime @default(now())
}

model DocumentRetention {
  id String @id @default(cuid())
  documentType DocumentType
  retentionDays Int // days to keep
  autoDelete Boolean @default(true)
  createdAt DateTime @default(now())
}

enum DocumentType {
  BOOKING_CONFIRMATION
  INVOICE
  RECEIPT
  OFFLINE_REQUEST_CONFIRMATION
}

enum GenerationStatus {
  PENDING
  GENERATED
  FAILED
  SENT
  ARCHIVED
}

enum DocumentFormat {
  HTML
  PDF
  BOTH
}
```

### 3.2 API Endpoints (Document Service)

**Template Management (Admin):**
```
GET    /document-service/templates                    - List templates
GET    /document-service/templates/:id                - Get single template
POST   /document-service/templates                    - Create template
PATCH  /document-service/templates/:id                - Update template
GET    /document-service/templates/:id/preview        - Generate preview
DELETE /document-service/templates/:id                - Deactivate template
```

**Document Generation:**
```
POST   /document-service/generate                     - Generate document
GET    /document-service/:id                          - Get document metadata
GET    /document-service/:id/download                 - Download PDF
GET    /document-service/:id/html                     - Get HTML preview
DELETE /document-service/:id                          - Delete document
```

**User Portal:**
```
GET    /document-service/my-documents                 - List user's documents
GET    /document-service/my-documents/:type           - List by type
GET    /document-service/my-documents/search          - Search documents
```

**Admin Operations:**
```
POST   /document-service/:id/resend                   - Resend document email
POST   /document-service/bulk-generate                - Generate for multiple bookings
GET    /document-service/access-logs                  - Audit trail
```

### 3.3 Frontend Components

**New Components (Document Portal):**

1. **DocumentPortal.tsx** (400 lines)
   - Lists user's documents
   - Filters and search
   - Download buttons
   - Print preview

2. **DocumentCard.tsx** (180 lines)
   - Individual document display
   - Type-specific icons
   - Download/print actions
   - Date created/expires info

3. **TemplateManager.tsx** (450 lines) - Admin only
   - CRUD for templates
   - Handlebars syntax helper
   - Preview generator
   - Version history viewer

4. **DocumentPreview.tsx** (250 lines)
   - Render HTML preview
   - Print-friendly CSS
   - Full-screen mode
   - Share link

### 3.4 Integration Points

**With Booking Service:**
- Listen for booking confirmation events
- Generate document automatically
- Send via Notification System

**With Notification System (Phase 4):**
- Use existing email infrastructure
- Send document as attachment
- Track delivery status

**With Admin Portal (Phase 2):**
- Add Document Portal tab
- Template management section
- Bulk generation dashboard

**With User Portal (Future):**
- My Documents section
- Download history
- Print receipts

---

## 4. Technology Stack

### Backend
- **PDF Generation**: Puppeteer (headless Chrome) or wkhtmltopdf
  - Alternative: pdf-lib for simpler PDFs
- **Template Engine**: Handlebars.js
- **Storage**: AWS S3 or Azure Blob Storage (or local for dev)
- **Image Processing**: Sharp (optimize images in PDFs)
- **Cron Jobs**: node-cron or BullMQ (scheduled generation)
- **Email**: Reuse Notification System from Phase 4

### Frontend
- **PDF Viewer**: react-pdf or pdfjs-dist (previews)
- **Document Icon Library**: Lucide React (file icons)
- **Date Formatting**: date-fns library
- **State Management**: React Query (document caching)

### Infrastructure
- **Execution Environment**: Node.js (same as current)
- **Process Management**: PM2 (for document service)
- **Queuing**: BullMQ (for async document generation)
- **Monitoring**: Existing Sentry/logging

---

## 5. Implementation Roadmap

### Day 1: Database & Backend Setup (6-8 hours)
**Tasks:**
- [ ] Update Prisma schema with document models
- [ ] Run migration: `npm run db:migrate`
- [ ] Generate Prisma client: `npm run db:generate`
- [ ] Create document-service boilerplate
- [ ] Setup DocumentController with endpoints
- [ ] Create DocumentService class
- [ ] Implement TemplateProvider

**Deliverables:**
- Database fully migrated
- 3 model classes created
- API structure in place

**Validation:**
- TypeScript compiles: `npx tsc`
- No schema errors: `npx prisma validate`

---

### Day 2: PDF Generation & Templates (6-8 hours)
**Tasks:**
- [ ] Install Puppeteer + dependencies
- [ ] Create PDFGenerator class
- [ ] Build Handlebars template system
- [ ] Create 3 default templates (confirmation, invoice, receipt)
- [ ] Test template rendering with sample data
- [ ] Implement preview endpoint
- [ ] Add error handling for failed PDFs

**Deliverables:**
- PDF generation working end-to-end
- 3 production-ready templates
- Template preview working

**Validation:**
- Generate sample PDF: works locally
- Template syntax: valid Handlebars
- File output: correct size/format

---

### Day 3: Storage & Versioning (5-6 hours)
**Tasks:**
- [ ] Setup S3 SDK (or local fallback)
- [ ] Create StorageProvider interface
- [ ] Implement upload/download functions
- [ ] Add document versioning logic
- [ ] Create version history retrieval
- [ ] Implement retention policy enforcement
- [ ] Add cleanup jobs (delete expired)

**Deliverables:**
- Document storage fully functional
- Versioning working
- Retention policies enforced

**Validation:**
- Upload test file to S3
- Retrieve specific version
- Cleanup job executes correctly

---

### Day 4: Distribution & Notifications (5-6 hours)
**Tasks:**
- [ ] Create DistributionService class
- [ ] Integrate with Phase 4 Notification System
- [ ] Send documents as email attachments
- [ ] Add webhook triggers for generation complete
- [ ] Implement resend/regenerate functionality
- [ ] Create audit logging
- [ ] Add access tracking

**Deliverables:**
- Email delivery working
- Webhook integration complete
- Audit trail functional

**Validation:**
- Email received with attachment
- Webhook triggered on generation
- Access logs recording correctly

---

### Day 5: User Portal & Admin UI (7-8 hours)
**Tasks:**
- [ ] Create DocumentPortal.tsx component
- [ ] Build document listing with filters
- [ ] Implement search functionality
- [ ] Add download/print actions
- [ ] Create viewing details modal
- [ ] Add admin template manager
- [ ] Implement template preview generator
- [ ] Create retention policy UI

**Deliverables:**
- User portal fully functional
- Admin template management working
- All UI flows complete

**Validation:**
- List documents: working
- Download PDF: successful
- Template preview: renders correctly

---

### Day 6: Testing & Integration (6-8 hours)
**Tasks:**
- [ ] Create integration test suite (12+ tests)
- [ ] Test document generation workflow
- [ ] Test email delivery pipeline
- [ ] Test versioning and retention
- [ ] Test user portal functionality
- [ ] Test admin operations
- [ ] Performance testing (generate 100 docs)
- [ ] Security testing (access control)

**Deliverables:**
- Test suite with 12+ passing tests
- Performance benchmarks documented
- Security validation complete

**Validation:**
- All tests passing: `npm run test:documents`
- No SQL injection vulnerabilities
- Access control enforced

---

### Day 7: Documentation & Deployment (4-5 hours)
**Tasks:**
- [ ] Write API documentation
- [ ] Create user guide for portal
- [ ] Write admin configuration guide
- [ ] Document template syntax helper
- [ ] Create troubleshooting guide
- [ ] Setup deployment scripts
- [ ] Create runbooks for operations

**Deliverables:**
- Complete documentation
- Deployment-ready code
- Operations runbooks

**Validation:**
- Documentation complete
- Deployment successful to staging
- Team can follow runbook

---

## 6. Success Criteria

### Code Quality (Must Have)
- ✅ Zero TypeScript compilation errors
- ✅ 100% type coverage (no `any` types)
- ✅ 12+ integration tests (all passing)
- ✅ ESLint compliance (clean lint)
- ✅ JSDoc comments on all public methods
- ✅ Error handling on all async operations

### Functional Requirements (Must Have)
- ✅ PDF generation working end-to-end
- ✅ Email delivery with attachment working
- ✅ Document versioning working
- ✅ User portal showing documents
- ✅ Admin template management functional
- ✅ Retention policies enforced
- ✅ Search and filter working

### Performance (Should Have)
- ✅ PDF generation < 2 seconds per document
- ✅ S3 upload < 1 second
- ✅ List documents query < 500ms
- ✅ Portal loads in < 1 second
- ✅ Can generate 100 docs in < 5 minutes

### Security (Must Have)
- ✅ Access control enforced (users see own docs only)
- ✅ No SQL injection vectors
- ✅ File uploads validated
- ✅ S3 access logged
- ✅ Download links authenticated
- ✅ Sensitive data not logged

### Coverage (Nice to Have)
- ✅ All CRUD operations tested
- ✅ Error scenarios handled
- ✅ Edge cases covered (large files, special chars)
- ✅ Integration with Phase 4 working

---

## 7. Risk & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Puppeteer memory usage | Service crashes on high load | Medium | Implement queue, memory limits, worker pool |
| S3 upload failures | Documents not stored | Low | Retry logic, fallback to local storage, alerts |
| Template syntax errors | Documents generate incorrectly | Medium | Template validation, preview before save |
| Email delivery failures | Users don't receive docs | Medium | Use Notification System (already tested), retry queue |
| File path traversal | Security vulnerability | Low | Validate paths, use UUIDs, S3 only |
| Large file storage | High S3 costs | Medium | Compression, retention policies, cleanup jobs |
| Concurrent generation | Race conditions | Low | Database locks, unique constraints |

---

## 8. File Structure (New Files)

```
services/document-service/
├── src/
│   ├── controllers/
│   │   └── DocumentController.ts
│   ├── services/
│   │   ├── DocumentService.ts
│   │   ├── TemplateProvider.ts
│   │   ├── PDFGenerator.ts
│   │   ├── StorageProvider.ts
│   │   ├── VersionManager.ts
│   │   └── DistributionService.ts
│   ├── models/
│   │   ├── Document.ts
│   │   ├── DocumentTemplate.ts
│   │   └── types.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   └── documentRoutes.ts
│   ├── jobs/
│   │   ├── generateDocumentJob.ts
│   │   ├── cleanupExpiredJob.ts
│   │   └── retentionJob.ts
│   ├── utils/
│   │   ├── templateValidator.ts
│   │   ├── storageConfig.ts
│   │   └── logger.ts
│   ├── templates/
│   │   ├── booking-confirmation.hbs
│   │   ├── invoice.hbs
│   │   └── receipt.hbs
│   └── index.ts
├── tests/
│   ├── integration/
│   │   ├── document-generation.test.ts
│   │   ├── template-management.test.ts
│   │   ├── storage.test.ts
│   │   ├── distribution.test.ts
│   │   └── versioning.test.ts
│   └── unit/
│       ├── PDFGenerator.test.ts
│       ├── TemplateProvider.test.ts
│       └── VersionManager.test.ts
├── package.json
└── tsconfig.json

apps/booking-engine/src/
├── pages/
│   └── DocumentPortal.tsx
├── components/
│   ├── DocumentPortal.tsx
│   ├── DocumentCard.tsx
│   ├── DocumentPreview.tsx
│   └── TemplateManager.tsx
└── __tests__/
    └── documents.test.tsx

apps/b2b-admin/src/
├── pages/
│   └── DocumentManagement.tsx
├── components/
│   ├── TemplateManager.tsx
│   └── BulkDocumentGenerator.tsx
└── __tests__/
    └── documents.test.tsx

database/prisma/
└── migrations/
    └── add_document_system/
        └── migration.sql
```

---

## 9. Success Metrics

### Immediate (End of Phase 5)
- Document generation: 100% uptime in staging
- Email delivery: 99.5% success rate
- User portal: < 1 second load time
- PDF quality: Professional appearance, all data visible
- Test coverage: 92%+ of critical paths

### Post-Launch (2 weeks)
- All users can access their documents
- Document downloads: 95%+ success rate
- Support tickets related to docs: < 5
- Email delivery complaints: 0

### Long-term (1 month)
- User satisfaction: > 4.5/5 on portal usability
- Average documents per user: > 3
- Repeat download rate: > 40%
- Portal traffic: Increasing

---

## 10. Next Steps

**Immediate Action Items:**
1. [ ] Get team alignment on Phase 5 scope
2. [ ] Setup document-service boilerplate
3. [ ] Begin Day 1 tasks
4. [ ] Create daily standup template

**Pre-Implementation Checklist:**
- [ ] S3 bucket created and configured
- [ ] Puppeteer dependencies available
- [ ] Notification System (Phase 4) validated and tested
- [ ] Database access verified
- [ ] .env template updated with new variables

---

**Ready to begin Day 1 implementation?** 🚀

Let me know if you'd like me to start with:
1. **Database setup** - Migrate Prisma schema
2. **Backend boilerplate** - Create service structure
3. **Implementation details** - Specific task assignments

Or if you'd prefer to adjust the scope first.
