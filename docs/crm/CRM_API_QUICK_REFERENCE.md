# CRM API Quick Reference

## Base URL
```
http://localhost:3012/api/crm
```

## Authentication
All requests require `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 Contacts API

### List Contacts
```
GET /contacts?page=1&limit=20&status=lead&search=john
```

### Get Contact
```
GET /contacts/:id
```

### Create Contact
```
POST /contacts
Content-Type: application/json

{
  "email": "john@example.com",          // Required, must be unique
  "firstName": "John",                  // Optional
  "lastName": "Doe",                    // Optional
  "phone": "+1234567890",               // Optional
  "company": "ACME Corp",               // Optional
  "source": "website",                  // Optional
  "status": "lead",                     // Optional: lead|prospect|customer|inactive
  "metadata": { "tags": ["VIP"] }       // Optional
}
```

### Update Contact
```
PATCH /contacts/:id
Content-Type: application/json

{
  "status": "prospect",
  "phone": "+9876543210"
  // ... any fields to update
}
```

### Delete Contact
```
DELETE /contacts/:id
```

---

## 📌 Activities API

### List Activities
```
GET /activities?page=1&limit=20&status=pending&type=email&contactId=xxx
```

### Get Activity
```
GET /activities/:id
```

### Create Activity
```
POST /activities
Content-Type: application/json

{
  "contactId": "contact_id",           // Required
  "activityType": "email",             // Required: email|call|meeting|note|task
  "title": "Follow-up email",          // Required
  "description": "Sent proposal copy", // Optional
  "dueDate": "2025-04-05T10:00:00Z",   // Optional (ISO 8601)
  "metadata": { "duration": 15 }       // Optional
}
```

### Update Activity
```
PATCH /activities/:id
Content-Type: application/json

{
  "status": "completed",
  "description": "Call completed successfully"
  // Setting status to 'completed' auto-sets completedAt timestamp
}
```

### Delete Activity
```
DELETE /activities/:id
```

---

## 🎯 Campaigns API

### List Campaigns
```
GET /campaigns?page=1&limit=20&status=active&type=email
```

**Response includes engagement metrics:**
```json
{
  "id": "camp_1",
  "name": "Spring Sale",
  "status": "active",
  "stats": {
    "totalContacts": 500,
    "sent": 450,
    "opened": 225,
    "clicked": 112,
    "converted": 28
  },
  "openRate": 50,
  "clickRate": 24.89,
  "conversionRate": 6.22
}
```

### Get Campaign
```
GET /campaigns/:id
```

### Create Campaign
```
POST /campaigns
Content-Type: application/json

{
  "name": "Summer Promo",              // Required
  "description": "Summer offers",      // Optional
  "type": "email",                     // Required: email|sms|webinar|event|other
  "status": "draft",                   // Optional: draft|scheduled|active|completed|paused
  "startDate": "2025-06-01T00:00:00Z", // Optional
  "endDate": "2025-08-31T23:59:59Z",   // Optional
  "targetAudience": "All subscribers", // Optional
  "budget": "10000.00",                // Optional (Decimal as string)
  "metadata": { "channel": "email" }   // Optional
}
```

### Update Campaign
```
PATCH /campaigns/:id
Content-Type: application/json

{
  "status": "active",
  "budget": "12000.00"
}
```

### Delete Campaign
```
DELETE /campaigns/:id
```

### Add Contacts to Campaign
```
POST /campaigns/:id/contacts
Content-Type: application/json

{
  "contactIds": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "message": "Added 3 contacts to campaign",
  "count": 3
}
```

---

## 📊 Metrics API

### Get Dashboard Metrics
```
GET /metrics?range=month
```

**Query Parameters:**
- `range`: `week` | `month` (default) | `quarter`

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
      { "source": "referral", "count": 300 }
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

---

## 🔴 Error Responses

### 400 Bad Request
```json
{ "error": "email is required" }
```

### 401 Unauthorized
```json
{ "error": "Authorization header required" }
```

### 403 Forbidden
```json
{ "error": "Admin access required" }
```

### 404 Not Found
```json
{ "error": "Contact not found" }
```

### 409 Conflict
```json
{ "error": "Contact with this email already exists" }
```

### 500 Server Error
```json
{ "error": "Internal server error" }
```

---

## 📚 Common Use Cases

### Create a Contact and Add to Campaign
```javascript
// 1. Create contact
const contact = await fetch('/api/crm/contacts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: 'john@example.com',
    firstName: 'John',
    status: 'lead'
  })
});
const contactData = await contact.json();

// 2. Add to campaign
await fetch(`/api/crm/campaigns/${campaignId}/contacts`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    contactIds: [contactData.id]
  })
});
```

### Log Activity for Contact
```javascript
await fetch('/api/crm/activities', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    contactId: 'contact_id',
    activityType: 'email',
    title: 'Welcome email sent',
    status: 'completed',
    completedAt: new Date().toISOString()
  })
});
```

### Get Hot Leads (from Metrics)
```javascript
const metrics = await fetch('/api/crm/metrics?range=week', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await metrics.json();
console.log(`Hot leads this week: ${data.engagement.hotLeadsCount}`);
```

### Filter Contacts by Source
```javascript
const prospects = await fetch('/api/crm/contacts?status=prospect&source=referral', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await prospects.json();
```

---

## 🔄 Status Enums

### Contact Status
- `lead` - New unqualified lead
- `prospect` - Qualified sales opportunity
- `customer` - Converted customer
- `inactive` - No longer active

### Activity Status
- `pending` - Awaiting completion
- `completed` - Finished
- `cancelled` - Cancelled

### Activity Type
- `email` - Email communication
- `call` - Phone call
- `meeting` - In-person or video meeting
- `note` - Internal note
- `task` - Action item

### Campaign Status
- `draft` - Being prepared
- `scheduled` - Scheduled to start
- `active` - Currently running
- `completed` - Finished
- `paused` - Temporarily paused

### Campaign Type
- `email` - Email campaign
- `sms` - SMS/text campaign
- `webinar` - Webinar/event
- `event` - Physical/virtual event
- `other` - Other type

### Campaign Contact Status
- `pending` - Awaiting send
- `sent` - Email/message sent
- `opened` - Contact opened email
- `clicked` - Contact clicked link
- `converted` - Conversion/purchase
- `failed` - Send failed

---

## 💡 Tips & Best Practices

1. **Always paginate lists** - Use `page` and `limit` parameters
2. **Use filtering** - Reduce data transfer with status/type filters
3. **Cache metrics** - Dashboard metrics don't change frequently
4. **Batch operations** - Add multiple contacts to campaign in one call
5. **Handle errors** - Check status codes and error messages
6. **Use metadata** - Store custom data in JSON metadata fields
7. **Track activities** - Log all customer interactions
8. **Monitor hot leads** - Check metrics endpoint regularly for hot leads

---

## 🔗 Related Resources

- Full API Documentation: `docs/CRM_IMPLEMENTATION_GUIDE.md`
- Completion Summary: `docs/CRM_COMPLETION_SUMMARY.md`
- Database Schema: `database/prisma/schema.finance.prisma`
- Migration Reference: `database/migrations/crm-schema-finance.sql`
