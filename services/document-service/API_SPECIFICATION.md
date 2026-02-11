# Document Service - API Specification

## Service Overview

**Service Name:** Document Service  
**Base URL:** `http://localhost:3004`  
**Port:** 3004  
**Authentication:** Bearer Token (JWT)  
**Content Type:** application/json  

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `415 Unsupported Media Type` - Invalid content type
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req-12345",
    "timestamp": "2025-02-10T10:30:45.123Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DOCUMENT_TYPE",
    "message": "The specified document type is not supported",
    "details": { ... }
  },
  "meta": {
    "requestId": "req-12345",
    "timestamp": "2025-02-10T10:30:45.123Z"
  }
}
```

## Endpoints

### Health Check

```http
GET /health
```

**Description:** Check service health status

**Response:**
```json
{
  "status": "healthy",
  "service": "document-service",
  "version": "1.0.0",
  "timestamp": "2025-02-10T10:30:45.123Z"
}
```

---

## Document Endpoints

### Generate Document

```http
POST /documents/generate
Authorization: Bearer {token}
Content-Type: application/json
```

**Description:** Generate a new document from template

**Request Body:**
```json
{
  "type": "BOOKING_CONFIRMATION",
  "templateId": "tpl-123",
  "context": {
    "booking": {
      "id": "booking-123",
      "reference": "BK-001",
      "status": "confirmed",
      "startDate": "2026-02-15",
      "endDate": "2026-02-20",
      "destination": "Paris",
      "totalCost": 2500,
      "paxCount": 2,
      "passengers": [
        {
          "id": "pax-1",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "role": "primary"
        }
      ]
    },
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "company": {
      "name": "TripAlfa",
      "address": "123 Travel St, New York, NY 10001",
      "phone": "+1-800-TRIPS",
      "email": "support@tripalfa.com",
      "website": "https://tripalfa.com"
    },
    "metadata": {
      "language": "en",
      "timezone": "UTC",
      "currency": "USD"
    }
  },
  "format": "PDF",
  "async": false,
  "notify": true,
  "notificationEmail": "user@example.com"
}
```

**Parameters:**
- `type` (string, required): Document type (BOOKING_CONFIRMATION, INVOICE, ITINERARY, RECEIPT, AMENDMENT)
- `templateId` (string, optional): Custom template ID (uses default if not specified)
- `context` (object, required): Document context data
- `format` (string, optional): Output format (PDF, HTML, BOTH) - default: PDF
- `async` (boolean, optional): Generate asynchronously - default: false
- `notify` (boolean, optional): Send notification after generation - default: false
- `notificationEmail` (string, optional): Email for notification

**Response (201 Created):**
```json
{
  "success": true,
  "document": {
    "id": "doc-550e8400-e29b-41d4-a716-446655440000",
    "type": "BOOKING_CONFIRMATION",
    "templateId": "tpl-123",
    "userId": "user-123",
    "bookingId": "booking-123",
    "status": "GENERATED",
    "format": "PDF",
    "contentPath": "/uploads/documents/doc-550.pdf",
    "fileSize": 245632,
    "pageCount": 5,
    "generationTime": 2340,
    "createdAt": "2025-02-10T10:30:45.123Z",
    "updatedAt": "2025-02-10T10:30:47.456Z",
    "downloadUrl": "/documents/doc-550e8400-e29b-41d4-a716-446655440000/download",
    "previewUrl": "/documents/doc-550e8400-e29b-41d4-a716-446655440000/preview"
  }
}
```

---

### Get Document

```http
GET /documents/{id}
Authorization: Bearer {token}
```

**Description:** Retrieve document details

**Parameters:**
- `id` (string, required, path): Document ID

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "id": "doc-550e8400-e29b-41d4-a716-446655440000",
    "type": "BOOKING_CONFIRMATION",
    "status": "GENERATED",
    "format": "PDF",
    "contentPath": "/uploads/documents/doc-550.pdf",
    "fileSize": 245632,
    "pageCount": 5,
    "createdAt": "2025-02-10T10:30:45.123Z",
    "updatedAt": "2025-02-10T10:30:47.456Z",
    "downloadUrl": "/documents/doc-550e8400-e29b-41d4-a716-446655440000/download",
    "previewUrl": "/documents/doc-550e8400-e29b-41d4-a716-446655440000/preview"
  }
}
```

---

### List Documents

```http
GET /documents
Authorization: Bearer {token}
```

**Description:** List user's documents with pagination and filtering

**Query Parameters:**
- `page` (integer, optional): Page number - default: 1
- `pageSize` (integer, optional): Items per page - default: 20, max: 100
- `type` (string, optional): Filter by document type
- `status` (string, optional): Filter by status (GENERATED, SENT, FAILED, ARCHIVED)
- `startDate` (ISO8601, optional): Filter documents created after date
- `endDate` (ISO8601, optional): Filter documents created before date
- `sortBy` (string, optional): Sort field (createdAt, updatedAt, type) - default: createdAt
- `sortOrder` (string, optional): Sort order (asc, desc) - default: desc

**Response (200 OK):**
```json
{
  "success": true,
  "items": [
    {
      "id": "doc-550e8400-e29b-41d4-a716-446655440000",
      "type": "BOOKING_CONFIRMATION",
      "status": "GENERATED",
      "format": "PDF",
      "fileSize": 245632,
      "createdAt": "2025-02-10T10:30:45.123Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 150,
  "pages": 8
}
```

---

### Search Documents

```http
GET /documents/search
Authorization: Bearer {token}
```

**Description:** Full-text search over documents

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): Limit to document type
- `limit` (integer, optional): Result limit - default: 20

**Response (200 OK):**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc-550e8400-e29b-41d4-a716-446655440000",
      "type": "BOOKING_CONFIRMATION",
      "highlight": "Booking confirmation for order <mark>BK-001</mark>",
      "score": 0.95
    }
  ],
  "total": 1
}
```

---

### Download Document

```http
GET /documents/{id}/download
Authorization: Bearer {token}
```

**Description:** Download document file

**Parameters:**
- `id` (string, required, path): Document ID

**Query Parameters:**
- `format` (string, optional): Override format (pdf, html) - respects original if not specified

**Response (200 OK):** Binary file content with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="booking-confirmation-BK-001.pdf"
Content-Length: 245632
```

---

### Delete Document

```http
DELETE /documents/{id}
Authorization: Bearer {token}
```

**Description:** Delete a document (soft delete)

**Parameters:**
- `id` (string, required, path): Document ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### Archive Document

```http
PATCH /documents/{id}/archive
Authorization: Bearer {token}
```

**Description:** Archive a document for long-term storage

**Parameters:**
- `id` (string, required, path): Document ID

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "id": "doc-550e8400-e29b-41d4-a716-446655440000",
    "status": "ARCHIVED",
    "archivedAt": "2025-02-10T10:30:45.123Z"
  }
}
```

---

## Template Endpoints

### List Templates

```http
GET /templates
```

**Description:** List available document templates

**Query Parameters:**
- `type` (string, optional): Filter by document type
- `language` (string, optional): Filter by language - default: en
- `page` (integer, optional): Page number - default: 1
- `pageSize` (integer, optional): Items per page - default: 20

**Response (200 OK):**
```json
{
  "success": true,
  "templates": [
    {
      "id": "tpl-123",
      "name": "Standard Booking Confirmation",
      "type": "BOOKING_CONFIRMATION",
      "language": "en",
      "format": "HTML",
      "description": "Standard template for booking confirmations",
      "variables": ["booking.reference", "user.name", "company.name"],
      "isDefault": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 5
}
```

---

### Get Template

```http
GET /templates/{id}
```

**Description:** Get template details

**Response (200 OK):**
```json
{
  "success": true,
  "template": {
    "id": "tpl-123",
    "name": "Standard Booking Confirmation",
    "type": "BOOKING_CONFIRMATION",
    "content": "<html>{{booking.reference}}</html>",
    "variables": ["booking.reference", "user.name"],
    "format": "HTML",
    "language": "en"
  }
}
```

---

### Validate Template

```http
POST /templates/validate
Content-Type: application/json
```

**Description:** Validate template syntax and variables

**Request Body:**
```json
{
  "content": "<h1>{{booking.reference}}</h1>{{#each booking.passengers}}<p>{{this.name}}</p>{{/each}}"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "variables": ["booking.reference", "booking.passengers"]
}
```

**Response (200 OK - Invalid):**
```json
{
  "success": true,
  "valid": false,
  "errors": [
    {
      "line": 5,
      "column": 12,
      "message": "Unclosed {{#each}} block"
    }
  ],
  "variables": []
}
```

---

### Preview Template

```http
POST /templates/preview
Authorization: Bearer {token}
Content-Type: application/json
```

**Description:** Preview template rendering with sample data

**Request Body:**
```json
{
  "templateId": "tpl-123",
  "context": {
    "booking": {
      "reference": "BK-001",
      "destination": "Paris"
    },
    "user": {
      "name": "John Doe"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "html": "<h1>BK-001 - Paris</h1>",
  "length": 26,
  "renderTime": 45
}
```

---

### Create Template (Admin Only)

```http
POST /templates
Authorization: Bearer {admin-token}
Content-Type: application/json
```

**Description:** Create new document template

**Request Body:**
```json
{
  "name": "Premium Booking Confirmation",
  "type": "BOOKING_CONFIRMATION",
  "language": "en",
  "content": "<html>{{booking.reference}}</html>",
  "format": "HTML",
  "description": "Premium template for VIP customers",
  "isDefault": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "template": {
    "id": "tpl-550e8400-e29b-41d4-a716-446655440000",
    "name": "Premium Booking Confirmation",
    "type": "BOOKING_CONFIRMATION",
    "createdAt": "2025-02-10T10:30:45.123Z"
  }
}
```

---

### Update Template (Admin Only)

```http
PUT /templates/{id}
Authorization: Bearer {admin-token}
Content-Type: application/json
```

**Description:** Update template

**Request Body:**
```json
{
  "content": "<html>Updated content</html>",
  "description": "Updated template"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "template": { ... }
}
```

---

### Delete Template (Admin Only)

```http
DELETE /templates/{id}
Authorization: Bearer {admin-token}
```

**Description:** Delete template

**Response (204 No Content):**

---

## Statistics Endpoints

### Document Statistics

```http
GET /documents/stats/summary
Authorization: Bearer {token}
```

**Description:** Get user's document statistics

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "byType": {
      "BOOKING_CONFIRMATION": 75,
      "INVOICE": 50,
      "ITINERARY": 20,
      "RECEIPT": 5
    },
    "byStatus": {
      "GENERATED": 145,
      "SENT": 140,
      "ARCHIVED": 25
    },
    "averageGenerationTime": 2340,
    "totalFileSize": 5242880
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_DOCUMENT_TYPE` | 400 | Document type not supported |
| `INVALID_TEMPLATE` | 400 | Template syntax error |
| `MISSING_CONTEXT` | 400 | Required context fields missing |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Document already exists |
| `GENERATION_FAILED` | 500 | Document generation failed |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

- Default: 100 requests per minute per user
- Premium: 1000 requests per minute
- Headers:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1707132645
  ```

---

## WebSocket Events (Real-time Updates)

```javascript
// Connect to WebSocket
ws://localhost:3004/ws?token={token}

// Document generation started
{ "type": "document.generating", "documentId": "doc-123" }

// Document generation completed
{ "type": "document.generated", "documentId": "doc-123", "document": {...} }

// Document generation failed
{ "type": "document.failed", "documentId": "doc-123", "error": "..." }
```

---

## Changelog

### v1.0.0 (2025-02-10)
- Initial release
- Document generation from templates
- Document listing and retrieval
- Template management
- Statistics reporting

