# CRM Service Backend API Documentation

## Overview

The CRM Service provides RESTful APIs for all Twenty CRM modules integrated into
TripAlfa's B2B admin platform. All 12 new services (Phases 1 & 2) have complete
backend implementations with KYC integration hooks.

**Service Location:** `/services/crm-service/`  
**Base URL:** `http://localhost:3015/api/crm`  
**Port:** 3015  
**Status:** ✅ Implemented & Ready

---

## API Endpoints Overview

### Phase 1 Services (7 Endpoints)

| Service | Base Route | Methods | Status |
|---------|-----------|---------|--------|
| Tasks | `/tasks` | GET, POST, PUT, PATCH, DELETE | ✅ Complete |
| Calendar | `/calendar` | GET, POST, PUT, DELETE | ✅ Complete |
| Notes | `/notes` | GET, POST, PATCH, DELETE | ✅ Complete |
| Opportunities | `/opportunities` | GET, POST, PATCH | ✅ Complete |
| Workflows | `/workflows` | GET, POST, PATCH | ✅ Complete |
| Integrations | `/integrations` | GET, POST, DELETE | ✅ Complete |
| Documents | `/documents` | GET, POST, DELETE | ✅ Complete |

### Phase 2 Services (5 Endpoints - KYC Integrated)

<!-- cspell:ignore Blocklist -->
| Service | Base Route | Methods | KYC Coupling |
|---------|-----------|---------|-------------|
| Blocklist | `/blocklist` | GET, POST, DELETE | ⭐⭐⭐⭐⭐ |
| Favorites | `/favorites` | GET, POST, DELETE | ⭐⭐⭐⭐ |
| Contact Forms | `/contact-forms` | GET, POST, PATCH | ⭐⭐⭐⭐⭐ |
| Duplicates | `/duplicates` | GET, POST | ⭐⭐⭐⭐ |
| Dashboard Sync | `/dashboard-sync` | GET | ⭐⭐⭐⭐ |

---

## Detailed API Specifications

### 1. Tasks Management

Base: `/api/crm/tasks`

#### GET /api/crm/tasks
List all tasks with optional filters

**Query Parameters:**
- `status` (optional): Filter by status (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedTo` (optional): Filter by assigned user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Task Title",
      "description": "Description",
      "status": "TODO",
      "priority": "HIGH",
      "assignedTo": "user-id",
      "dueDate": "2026-04-15T09:00:00Z",
      "tags": ["urgent", "client"],
      "createdAt": "2026-03-30T10:00:00Z",
      "updatedAt": "2026-03-30T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST /api/crm/tasks
Create a new task

**Request Body:**
```json
{
  "title": "Required - Task title",
  "description": "Optional",
  "priority": "MEDIUM",
  "dueDate": "2026-04-15T09:00:00Z",
  "assignedTo": "user-id",
  "tags": ["tag1", "tag2"]
}
```

#### PUT /api/crm/tasks/:id
Update task details

#### PATCH /api/crm/tasks/:id/status
Update task status

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

#### DELETE /api/crm/tasks/:id
Delete a task

---

### 2. Calendar Management

Base: `/api/crm/calendar`

#### GET /api/crm/calendar
List calendar events with date filtering

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `type`: Event type (MEETING, CALL, REMINDER, etc.)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Meeting Title",
      "type": "MEETING",
      "startTime": "2026-04-15T09:00:00Z",
      "endTime": "2026-04-15T10:00:00Z",
      "attendees": [
        {
          "userId": "user-id",
          "name": "John Doe",
          "rsvp": "ACCEPTED"
        }
      ],
      "createdAt": "2026-03-30T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST /api/crm/calendar
Create calendar event

**Request Body:**
```json
{
  "title": "Required - Event title",
  "type": "MEETING",
  "startTime": "2026-04-15T09:00:00Z",
  "endTime": "2026-04-15T10:00:00Z",
  "attendees": [
    {
      "userId": "user-id",
      "name": "Name",
      "rsvp": "PENDING"
    }
  ]
}
```

---

### 3. Notes & Comments

Base: `/api/crm/notes`

#### GET /api/crm/notes
List notes with filters

**Query Parameters:**
- `type`: INTERNAL, SHARED, CONFIDENTIAL
- `relatedTo`: Filter by related entity ID
- `pinnedOnly`: Boolean

#### POST /api/crm/notes
Create a note

**Request Body:**
```json
{
  "content": "Note content",
  "type": "INTERNAL",
  "relatedTo": {
    "type": "CONTACT",
    "id": "entity-id"
  },
  "tags": ["tag1"]
}
```

#### POST /api/crm/notes/:id/comments
Add comment to note

**Request Body:**
```json
{
  "author": "user-id",
  "text": "Comment text"
}
```

#### PATCH /api/crm/notes/:id/pin
Toggle note pin status for team

---

### 4. Opportunities Pipeline

Base: `/api/crm/opportunities`

#### GET /api/crm/opportunities
List opportunities with metrics

**Response includes:**
- `data`: Array of opportunities
- `metrics`: { count, totalValue, expectedValue }

#### POST /api/crm/opportunities
Create opportunity

**Request Body:**
```json
{
  "name": "Opportunity name",
  "companyId": "company-id",
  "value": 50000,
  "probability": 0.6,
  "owner": "user-id"
}
```

#### PATCH /api/crm/opportunities/:id/stage
Update opportunity stage in pipeline

**Request Body:**
```json
{
  "stage": "PROPOSAL"
}
```

---

### 5. Workflow Automation

Base: `/api/crm/workflows`

#### GET /api/crm/workflows
List workflows

#### POST /api/crm/workflows
Create workflow

**Request Body:**
```json
{
  "name": "Workflow name",
  "description": "Optional",
  "triggers": [
    {
      "type": "ON_BOOKING_CREATED",
      "condition": "optional"
    }
  ],
  "actions": [
    {
      "type": "SEND_EMAIL",
      "config": { "template": "welcome" }
    }
  ]
}
```

#### PATCH /api/crm/workflows/:id/publish
Publish draft workflow to active

---

### 6. Connected Accounts (Integrations)

Base: `/api/crm/integrations`

#### GET /api/crm/integrations
List connected accounts

#### POST /api/crm/integrations/authorize
Start OAuth authorization flow

**Request Body:**
```json
{
  "provider": "GMAIL"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "account-id", "status": "CONNECTING" },
  "oauthUrl": "https://oauth.provider.com/..."
}
```

#### POST /api/crm/integrations/:id/sync
Trigger manual sync

#### DELETE /api/crm/integrations/:id
Disconnect account

---

### 7. Documents & Attachments

Base: `/api/crm/documents`

#### GET /api/crm/documents
List documents

**Query Parameters:**
- `accessLevel`: PUBLIC, INTERNAL, CONFIDENTIAL

#### POST /api/crm/documents
Upload document

**Request Body:**
```json
{
  "name": "document.pdf",
  "fileType": "application/pdf",
  "size": 1024,
  "uploadedBy": "user-id",
  "accessLevel": "INTERNAL"
}
```

#### POST /api/crm/documents/:id/download
Record download event

#### DELETE /api/crm/documents/:id
Delete document

---

## Phase 2: KYC-Integrated Services

### 8. Blocklist Management ⭐ KYC Critical

Base: `/api/crm/blocklist`

#### GET /api/crm/blocklist
List blocked entries

**Query Parameters:**
- `reason`: FRAUD, KYC_FAILED, COMPLIANCE, etc.
- `severity`: LOW, MEDIUM, HIGH, CRITICAL
- `kycRelated`: Boolean (filter by KYC-related blocks)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "reason": "KYC_FAILED",
      "severity": "HIGH",
      "status": "ACTIVE",
      "kycSubmissionId": "kyc-id",
      "blockedAt": "2026-03-30T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST /api/crm/blocklist
Add entry to blocklist

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "optional",
  "reason": "KYC_FAILED",
  "severity": "HIGH",
  "kycSubmissionId": "kyc-submission-id"
}
```

**KYC Integration Event:**
- ON_CREATE: Auto-propagate to KYC service if `kycSubmissionId` provided
- Auto-link to contact records with matching email
- Trigger duplicate account detection

#### POST /api/crm/blocklist/:id/appeal
Submit appeal for contested block

#### DELETE /api/crm/blocklist/:id
Remove from blocklist (requires approval)

---

### 9. Favorites & Collections

Base: `/api/crm/favorites`

#### GET /api/crm/favorites
List favorite items

**Query Parameters:**
- `folderId`: Filter by folder
- `type`: CONTACT, COMPANY, BOOKING, KYC_APPLICANT

#### POST /api/crm/favorites
Add item to favorites

**Request Body:**
```json
{
  "entityId": "entity-id",
  "type": "KYC_APPLICANT",
  "name": "Display name",
  "priority": "URGENT",
  "folderId": "folder-id",
  "tags": ["pending-review", "urgent"]
}
```

**KYC Integration:**
- Type: KYC_APPLICANT enables special filtering
- Priority: AUTO set to URGENT if KYC status is PENDING
- Tags: Auto-populated with KYC submission stage

#### GET /api/crm/favorites/folders
List favorite folders

#### POST /api/crm/favorites/folders
Create new folder

**Request Body:**
```json
{
  "name": "Folder name",
  "description": "Optional"
}
```

---

### 10. Contact Capture Forms ⭐ KYC Critical

Base: `/api/crm/contact-forms`

#### GET /api/crm/contact-forms
List contact forms

**Query Parameters:**
- `status`: ACTIVE, DRAFT, ARCHIVED

#### POST /api/crm/contact-forms
Create lead capture form

**Request Body:**
```json
{
  "name": "Partner Application Form",
  "description": "Optional description",
  "fields": [
    {
      "name": "companyName",
      "type": "TEXT",
      "required": true
    },
    {
      "name": "email",
      "type": "EMAIL",
      "required": true
    }
  ],
  "kycAutoTrigger": true
}
```

#### POST /api/crm/contact-forms/:id/submit
Submit form response

**Request Body:**
```json
{
  "formData": {
    "companyName": "TechCorp",
    "email": "contact@techcorp.com"
  }
}
```

**KYC Integration Event:**
- IF kycAutoTrigger=true:
  - Create contact record
  - Create KYC submission with pre-filled data
  - Link contact.kycSubmissionId
  - Return KYC submission ID to client

#### PATCH /api/crm/contact-forms/:id/kyc-trigger
Toggle auto-KYC triggering

**Request Body:**
```json
{
  "enable": true
}
```

---

### 11. Duplicate Detection & Merge

Base: `/api/crm/duplicates`

#### GET /api/crm/duplicates
List potential duplicates

**Query Parameters:**
- `status`: PENDING, MERGED, REJECTED, MANUAL_REVIEW
- `confidenceLevel`: LOW, MEDIUM, HIGH, CRITICAL

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "match-id",
      "recordA": {
        "id": "contact-1",
        "name": "John Doe",
        "email": "john@example.com",
        "type": "CONTACT"
      },
      "recordB": {
        "id": "kyc-submission-001",
        "name": "John Doe",
        "email": "john@example.com",
        "type": "KYC_SUBMISSION"
      },
      "matchScore": 0.92,
      "confidenceLevel": "CRITICAL",
      "matchFields": [
        { "field": "name", "similarity": 1.0 },
        { "field": "email", "similarity": 1.0 }
      ],
      "status": "PENDING"
    }
  ],
  "count": 1
}
```

#### POST /api/crm/duplicates/detect
Trigger duplicate detection algorithm

#### POST /api/crm/duplicates/:id/reject
Mark match as false positive

#### POST /api/crm/duplicates/merge
Merge two records

**Request Body:**
```json
{
  "matchId": "match-id",
  "preference": "A"
}
```

**KYC Integration:**
- IF both records are KYC_SUBMISSION type:
  - Consolidate documents
  - Keep highest verification state
  - Create audit log for compliance
  - Emit KYC_DUPLICATE_MERGED event

---

### 12. Real-Time Dashboard Sync

Base: `/api/crm/dashboard-sync`

#### GET /api/crm/dashboard-sync
Get current dashboard metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "kycMetrics": {
      "totalSubmissions": 247,
      "verifiedCount": 189,
      "rejectedCount": 32,
      "pendingCount": 26,
      "verificationRate": 0.765
    },
    "systemMetrics": {
      "apiLatency": 45,
      "syncStatus": "SYNCED",
      "lastSyncTime": "2026-03-30T10:15:00Z",
      "uptime": 0.9998
    }
  }
}
```

#### GET /api/crm/dashboard-sync/kyc-history
Get 30-day KYC metrics history

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-03-01T00:00:00Z",
      "verified": 42,
      "pending": 18,
      "rejected": 8
    },
    ...
  ]
}
```

#### GET /api/crm/dashboard-sync/recent-activities
Get recent activity feed

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity-id",
      "type": "KYC_VERIFIED",
      "title": "KYC Verified",
      "description": "Acme Corp verified",
      "timestamp": "2026-03-30T10:14:00Z",
      "severity": "INFO"
    }
  ]
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Server Error

---

## Authentication & Authorization

All endpoints should implement:
- JWT token validation via middleware
- Role-based access control (RBAC)
- Audit logging for all mutations
- KYC data isolation by organization

---

## KYC Integration Points

### Event Hooks

**When KYC is Created:**
```
POST /api/crm/contact-forms/:id/submit
→ CREATE Contact
→ CREATE KYC Submission
→ EVENT: KYC_SUBMISSION_CREATED
```

**When KYC is Verified:**
```
KYC Service: status = VERIFIED
→ EVENT: KYC_VERIFIED
→ Update related contact: status = ACTIVE
→ UPDATE Dashboard metrics
```

**When KYC is Rejected:**
```
KYC Service: status = REJECTED
→ EVENT: KYC_REJECTED
→ POST /api/crm/blocklist (auto-block)
→ Update related contact: status = INACTIVE
→ UPDATE Dashboard metrics
```

**When Duplicate Detected:**
```
Duplicate Detection Algorithm triggers
→ IF type = KYC_SUBMISSION:
  →MarkAs: CRITICAL confidence
  →Emit: EVENT: KYC_DUPLICATE_DETECTED
```

---

## Implementation Status

✅ **All 12 Services:** Fully implemented  
✅ **Mock Database:** In-memory storage for development  
✅ **TypeScript:** Type-safe implementations  
✅ **Error Handling:** Consistent error patterns  
✅ **Route Registration:** All endpoints registered in main service  

## Next Steps

- [ ] PostgreSQL database integration (replace in-memory)
- [ ] Prisma schema definition
- [ ] KYC event middleware setup
- [ ] Unit tests for all endpoints
- [ ] Integration with API Gateway
- [ ] Rate limiting & throttling
- [ ] Caching layer (Redis)
- [ ] WebSocket support for real-time dashboard

---

**Last Updated:** March 30, 2026  
**Service Status:** ✅ Ready for Integration Testing
