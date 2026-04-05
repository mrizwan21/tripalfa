# CRM Implementation - API Endpoints Summary

## Overview
Successfully implemented full CRM functionality in the marketing-service with
database models in the Finance database. The system provides comprehensive
contact, activity, and campaign management capabilities.

## Database Models (Finance Schema)

### 1. `crm_contact`
Stores customer relationship contact information.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `email` (String, UNIQUE): Contact email address
- `firstName` (String, optional): Contact first name
- `lastName` (String, optional): Contact last name
- `phone` (String, optional): Contact phone number
- `company` (String, optional): Company name
- `status` (String, default: "lead"): lead, prospect, customer, inactive
- `source` (String, optional): Where the contact came from
- `lastInteractionAt` (DateTime, optional): Timestamp of last interaction
- `metadata` (Json, optional): Flexible metadata storage
- `createdAt` (DateTime): Record creation timestamp
- `updatedAt` (DateTime): Record update timestamp

**Indexes:**
- email (unique)
- status
- source

**Relations:**
- activities: One-to-many with crm_activity
- campaigns: Many-to-many with crm_campaign via crm_campaign_contact

### 2. `crm_activity`
Represents interactions and tasks related to contacts.

**Fields:**
- `id` (String, PK): Unique identifier
- `contactId` (String, FK): Reference to crm_contact
- `activityType` (String): email, call, meeting, note, task
- `title` (String): Activity title
- `description` (String, optional): Detailed description
- `dueDate` (DateTime, optional): When the activity is due
- `completedAt` (DateTime, optional): When activity was completed
- `status` (String, default: "pending"): pending, completed, cancelled
- `metadata` (Json, optional): Flexible metadata
- `createdAt` (DateTime): Record creation timestamp
- `updatedAt` (DateTime): Record update timestamp

**Indexes:**
- contactId (FK)
- activityType
- status

**Relations:**
- contact: Many-to-one with crm_contact (CASCADE DELETE)

### 3. `crm_campaign`
Represents marketing campaigns targeting contacts.

**Fields:**
- `id` (String, PK): Unique identifier
- `name` (String): Campaign name
- `description` (String, optional): Campaign description
- `status` (String, default: "draft"): draft, scheduled, active, completed, paused
- `type` (String): email, sms, webinar, event, other
- `startDate` (DateTime, optional): When campaign starts
- `endDate` (DateTime, optional): When campaign ends
- `targetAudience` (String, optional): Description of target audience
- `budget` (Decimal(12,2), optional): Campaign budget
- `metadata` (Json, optional): Flexible metadata
- `createdAt` (DateTime): Record creation timestamp
- `updatedAt` (DateTime): Record update timestamp

**Indexes:**
- status
- type

**Relations:**
- contacts: One-to-many with crm_campaign_contact

### 4. `crm_campaign_contact`
Junction table for many-to-many relationship between campaigns and contacts.

**Fields:**
- `id` (String, PK): Unique identifier
- `campaignId` (String, FK): Reference to crm_campaign
- `contactId` (String, FK): Reference to crm_contact
- `status` (String, default: "pending"): pending, sent, opened, clicked, converted, failed
- `engagement` (Json, optional): Engagement metrics
- `createdAt` (DateTime): Record creation timestamp
- `updatedAt` (DateTime): Record update timestamp

**Indexes:**
- campaignId, contactId (UNIQUE composite)
- campaignId
- contactId
- status

**Relations:**
- campaign: Many-to-one with crm_campaign (CASCADE DELETE)
- contact: Many-to-one with crm_contact (CASCADE DELETE)

## API Endpoints

### Contacts Management
All endpoints require authentication (`Authorization: Bearer <token>`)

#### GET `/api/crm/contacts`
List all contacts with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Records per page
- `status` (string, optional): Filter by status (lead, prospect, customer, inactive)
- `search` (string, optional): Search by email, firstName, lastName, or company

**Response:**
```json
{
  "data": [{
    "id": "cuid_1",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "company": "ACME Corp",
    "status": "prospect",
    "source": "website",
    "lastInteractionAt": "2025-03-30T14:00:00Z",
    "createdAt": "2025-03-01T10:00:00Z",
    "updatedAt": "2025-03-30T14:00:00Z"
  }],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### GET `/api/crm/contacts/:id`
Get specific contact with recent activities and campaign participation.

**Response:**
```json
{
  "id": "cuid_1",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "company": "ACME Corp",
  "status": "prospect",
  "source": "website",
  "activities": [
    {
      "id": "act_1",
      "activityType": "email",
      "title": "Follow-up email sent",
      "description": "Sent proposal",
      "dueDate": null,
      "completedAt": "2025-03-30T10:00:00Z",
      "status": "completed",
      "createdAt": "2025-03-30T10:00:00Z"
    }
  ],
  "campaigns": [
    {
      "id": "cc_1",
      "status": "sent",
      "engagement": { "opens": 1, "clicks": 0 },
      "campaign": {
        "id": "camp_1",
        "name": "Spring Sale 2025",
        "type": "email",
        "status": "active"
      }
    }
  ]
}
```

#### POST `/api/crm/contacts`
Create a new contact.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321",
  "company": "Tech Inc",
  "source": "referral",
  "status": "lead",
  "metadata": { "tags": ["VIP", "tech-sector"] }
}
```

**Response:** Created contact object (201)

#### PATCH `/api/crm/contacts/:id`
Update contact information.

**Request Body:** Any fields to update
```json
{
  "status": "customer",
  "lastInteractionAt": "2025-03-30T15:00:00Z"
}
```

**Response:** Updated contact object

#### DELETE `/api/crm/contacts/:id`
Delete a contact and all related activities (via CASCADE).

**Response:**
```json
{ "message": "Contact deleted successfully" }
```

### Activities Management

#### GET `/api/crm/activities`
List all activities with filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string, optional): pending, completed, cancelled
- `type` (string, optional): email, call, meeting, note, task
- `contactId` (string, optional): Filter by contact

**Response:**
```json
{
  "data": [{
    "id": "act_1",
    "contactId": "cuid_1",
    "activityType": "meeting",
    "title": "Sales call",
    "description": "Discussed pricing",
    "dueDate": "2025-04-05T10:00:00Z",
    "completedAt": null,
    "status": "pending",
    "contact": {
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2025-03-30T14:00:00Z"
  }],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

#### GET `/api/crm/activities/:id`
Get specific activity with contact details.

#### POST `/api/crm/activities`
Create a new activity.

**Request Body:**
```json
{
  "contactId": "cuid_1",
  "activityType": "call",
  "title": "Follow-up call",
  "description": "Check on proposal status",
  "dueDate": "2025-04-02T14:00:00Z",
  "metadata": { "duration": 15, "notes": "voicemail left" }
}
```

**Response:** Created activity object (201)

#### PATCH `/api/crm/activities/:id`
Update activity status or details.

**Request Body:**
```json
{
  "status": "completed",
  "description": "Call completed, discussion scheduled for next week"
}
```

**Note:** When marking status as "completed", `completedAt` is automatically set to current timestamp.

**Response:** Updated activity object

#### DELETE `/api/crm/activities/:id`
Delete an activity.

**Response:**
```json
{ "message": "Activity deleted successfully" }
```

### Campaigns Management

#### GET `/api/crm/campaigns`
List all campaigns with engagement metrics.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string, optional): draft, scheduled, active, completed, paused
- `type` (string, optional): email, sms, webinar, event, other

**Response:**
```json
{
  "data": [{
    "id": "camp_1",
    "name": "Spring Sale 2025",
    "description": "Email campaign for spring products",
    "type": "email",
    "status": "active",
    "startDate": "2025-03-25T00:00:00Z",
    "endDate": "2025-04-30T23:59:59Z",
    "targetAudience": "Active customers and prospects",
    "budget": "5000.00",
    "stats": {
      "totalContacts": 500,
      "sent": 450,
      "opened": 225,
      "clicked": 112,
      "converted": 28,
      "failed": 0
    },
    "openRate": 50,
    "clickRate": 24.89,
    "conversionRate": 6.22,
    "createdAt": "2025-03-20T10:00:00Z"
  }],
  "pagination": { "page": 1, "limit": 20, "total": 12, "pages": 1 }
}
```

#### GET `/api/crm/campaigns/:id`
Get campaign details with all contact engagement data.

**Response:** Campaign object with detailed contact-level engagement data

#### POST `/api/crm/campaigns`
Create a new campaign.

**Request Body:**
```json
{
  "name": "Summer Promotion 2025",
  "description": "Exclusive summer offers",
  "type": "email",
  "status": "draft",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "targetAudience": "All subscribers",
  "budget": "10000.00",
  "metadata": { "channel": "email", "variant": "A" }
}
```

**Response:** Created campaign object (201)

#### PATCH `/api/crm/campaigns/:id`
Update campaign details.

**Request Body:** Any fields to update
```json
{
  "status": "active",
  "budget": "12000.00"
}
```

**Response:** Updated campaign object

#### DELETE `/api/crm/campaigns/:id`
Delete campaign (all related campaign_contact records are cascade deleted).

**Response:**
```json
{ "message": "Campaign deleted successfully" }
```

#### POST `/api/crm/campaigns/:id/contacts`
Add contacts to a campaign.

**Request Body:**
```json
{
  "contactIds": ["cuid_1", "cuid_2", "cuid_3"]
}
```

**Response:**
```json
{
  "message": "Added 3 contacts to campaign",
  "count": 3
}
```

### CRM Metrics Dashboard

#### GET `/api/crm/metrics`
Get aggregated CRM metrics for dashboard.

**Query Parameters:**
- `range` (string, default: "month"): week, month, quarter

**Response:**
```json
{
  "contacts": {
    "total": 1250,
    "active": 450,
    "leads": 350,
    "newThisMonth": 85,
    "newLastMonth": 92,
    "bySource": [
      { "source": "website", "count": 400 },
      { "source": "referral", "count": 300 },
      { "source": "event", "count": 200 }
    ]
  },
  "campaigns": {
    "total": 15,
    "active": 3,
    "openRate": 45.2,
    "clickRate": 28.5,
    "conversionRate": 8.3
  },
  "activities": {
    "total": 3450,
    "pending": 120,
    "completed": 3250
  },
  "engagement": {
    "hotLeadsCount": 23,
    "avgEngagementScore": 7.5
  },
  "chartData": [
    {
      "date": "2025-03-24",
      "contacts": 12,
      "campaigns": 45,
      "activities": 120
    }
  ],
  "topCampaigns": [
    {
      "id": "camp_1",
      "name": "Spring Sale",
      "type": "email",
      "status": "active",
      "totalContacts": 500,
      "openRate": 52.0,
      "clickRate": 28.5,
      "conversionRate": 9.2
    }
  ]
}
```

## Implementation Details

### Database Migration
The CRM models have been added to `database/prisma/schema.finance.prisma` and
Prisma clients have been regenerated for all 4 databases.

### Service Changes
**Marketing Service** (`services/marketing-service`):
- Added new route files:
  - `src/routes/crm-contacts.ts` - Contact CRUD operations
  - `src/routes/crm-activities.ts` - Activity management
  - `src/routes/crm-campaigns.ts` - Campaign management
  - `src/routes/crm-metrics.ts` - Dashboard metrics (updated)
- Updated `src/index.ts` to register new routes under `/api/crm/*` paths
- All CRM routes require JWT authentication

### Authentication
All CRM endpoints require JWT token or internal API key in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Or for service-to-service calls:
```
Authorization: <INTERNAL_API_KEY>
```

## Frontend Integration

The B2B admin frontend (`apps/b2b-admin`) has CRM pages ready to use:
- `CRMDashboard` - Dashboard with metrics
- `ContactsPage` - Manage contacts
- `ActivityTimelinePage` - Activity timeline
- `CampaignsPage` - Campaign management
- `LeadsPage` - Lead management
- `VisitorAnalyticsPage` - Visitor analytics
- `EmailTemplatesPage` - Email templates
- `SettingsPage` - CRM settings

These pages can now make API calls to the new endpoints to display and manage CRM data.

## Testing the Implementation

### 1. Verify Services Start
```bash
npm run dev --workspace=@tripalfa/marketing-service
```

### 2. Test Contact Creation
```bash
curl -X POST http://localhost:3012/api/crm/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "company": "Test Corp",
    "source": "api",
    "status": "lead"
  }'
```

### 3. Test Contact List
```bash
curl -X GET "http://localhost:3012/api/crm/contacts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Test Metrics
```bash
curl -X GET "http://localhost:3012/api/crm/metrics?range=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Architecture

```
TripAlfa CRM System
├── Marketing Service (Node.js + Express)
│   ├── /api/crm/contacts/* - Contact management
│   ├── /api/crm/activities/* - Activity tracking
│   ├── /api/crm/campaigns/* - Campaign management
│   └── /api/crm/metrics - Dashboard metrics
├── Finance Database (PostgreSQL)
│   ├── crm_contact
│   ├── crm_activity
│   ├── crm_campaign
│   └── crm_campaign_contact
└── B2B Admin Frontend (React + Vite)
    └── CRM Module Pages
```

## Future Enhancements

1. **Email Integration** - Direct email sending from campaigns
2. **Webhooks** - Real-time event notifications
3. **Bulk Operations** - Batch import/export of contacts
4. **Automation Rules** - Automatic activity creation based on triggers
5. **Advanced Segmentation** - Dynamic audience targeting
6. **Analytics** - Deeper reporting and forecasting
7. **Integration** - CRM webhooks and third-party integrations
8. **Mobile App** - Native mobile client for CRM
