# Document Service - REST API Controllers Implementation Guide

## Overview

This guide explains the REST API controllers implementation for the Document Service. Controllers handle HTTP requests, coordinate business logic, and return responses.

## Architecture

```
HTTP Request
    ↓
Routes (api-v1.ts)
    ↓
Middleware (auth, validation)
    ↓
Controllers (DocumentController, TemplateController, StatisticsController)
    ↓
Services (DocumentService, TemplateProvider, etc.)
    ↓
Database (Prisma)
```

## Controllers

### DocumentController

**Location:** `src/controllers/DocumentController.ts`

Handles all document-related operations.

#### Key Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `generateDocument()` | `POST /documents/generate` | Generate new document |
| `getDocument()` | `GET /documents/:id` | Retrieve document details |
| `listDocuments()` | `GET /documents` | List user's documents |
| `searchDocuments()` | `GET /documents/search` | Search documents |
| `downloadDocument()` | `GET /documents/:id/download` | Download document file |
| `previewDocument()` | `GET /documents/:id/preview` | Preview document |
| `archiveDocument()` | `PATCH /documents/:id/archive` | Archive document |
| `deleteDocument()` | `DELETE /documents/:id` | Delete document |

#### Example Usage

```typescript
// Generate document
POST /api/v1/documents/generate
Authorization: Bearer {token}
{
  "type": "BOOKING_CONFIRMATION",
  "context": { ... },
  "format": "PDF"
}

// List documents
GET /api/v1/documents?page=1&pageSize=20&type=BOOKING_CONFIRMATION
Authorization: Bearer {token}

// Download document
GET /api/v1/documents/{id}/download
Authorization: Bearer {token}
```

### TemplateController

**Location:** `src/controllers/TemplateController.ts`

Manages document templates.

#### Key Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `listTemplates()` | `GET /templates` | List templates |
| `getTemplate()` | `GET /templates/:id` | Get template details |
| `validateTemplate()` | `POST /templates/validate` | Validate syntax |
| `previewTemplate()` | `POST /templates/preview` | Preview rendering |
| `createTemplate()` | `POST /templates` | Create (admin) |
| `updateTemplate()` | `PUT /templates/:id` | Update (admin) |
| `deleteTemplate()` | `DELETE /templates/:id` | Delete (admin) |

#### Example Usage

```typescript
// List templates
GET /api/v1/templates?type=BOOKING_CONFIRMATION

// Validate template
POST /api/v1/templates/validate
{
  "content": "<h1>{{booking.reference}}</h1>"
}

// Preview template
POST /api/v1/templates/preview
Authorization: Bearer {token}
{
  "templateId": "tpl-123",
  "context": { "booking": { "reference": "BK-001" } }
}

// Create template (admin)
POST /api/v1/templates
Authorization: Bearer {admin-token}
{
  "name": "Custom Template",
  "type": "BOOKING_CONFIRMATION",
  "content": "..."
}
```

### StatisticsController

**Location:** `src/controllers/StatisticsController.ts`

Provides statistics and reporting endpoints.

#### Key Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getDocumentStatistics()` | `GET /documents/stats/summary` | User document stats |
| `getTemplateStatistics()` | `GET /templates/stats/summary` | Template stats |
| `getSystemStatistics()` | `GET /system/stats/summary` | System-wide stats (admin) |
| `getPerformanceMetrics()` | `GET /system/metrics/performance` | Performance metrics (admin) |
| `getAuditSummary()` | `GET /audit/summary` | Audit log summary (admin) |

## Middleware

### Authentication Middleware

**Location:** `src/middleware/auth.ts`

Handles JWT token validation.

```typescript
// Protect routes
router.post('/documents/generate', authenticateToken, controller.generateDocument);

// Require authentication
router.get('/documents', authenticateToken, controller.listDocuments);

// Require admin
router.post('/templates', requireAdmin, controller.createTemplate);
```

### Error Handler Middleware

**Location:** `src/middleware/error-handler.ts`

Handles errors and formats responses.

### Validation Middleware

**Location:** `src/utils/validation.ts`

Validates request bodies and parameters.

## Request/Response Format

### Success Response

```json
{
  "success": true,
  "document": { ... },
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
    "message": "Document type not supported",
    "details": { ... }
  }
}
```

## Authentication

### JWT Token

Required for authenticated endpoints.

**Format:** `Authorization: Bearer {token}`

**Payload:**
```json
{
  "userId": "user-123",
  "isAdmin": false,
  "iat": 1676000000,
  "exp": 1676086400
}
```

### Test Token (Development)

Use the `createTestToken()` utility:

```typescript
import { createTestToken } from '../middleware/auth';

const token = createTestToken('user-123', false);
// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## Error Handling

All errors are caught and formatted consistently.

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

**Error Codes:**
- `MISSING_TOKEN` - No auth token provided
- `INVALID_TOKEN` - Token invalid or expired
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Admin access required
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `GENERATION_FAILED` - Document generation failed

## Adding New Endpoints

### Step 1: Create Controller Method

```typescript
// DocumentController.ts
async newMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await this.documentService.someOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

### Step 2: Add Route

```typescript
// api-v1.ts
router.post(
  '/documents/new-endpoint',
  authenticateToken,
  (req: AuthRequest, res: Response, next: any) =>
    documentController.newMethod(req, res, next),
);
```

### Step 3: Add Tests

```typescript
// document-api.test.ts
it('should call new endpoint', async () => {
  const response = await request(app)
    .post('/api/v1/documents/new-endpoint')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ ... });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

## Best Practices

### 1. Error Handling

Always use try-catch and pass errors to `next()`:

```typescript
async method(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Implementation
  } catch (error) {
    next(error); // Passes to error handler
  }
}
```

### 2. Authorization Checks

Always verify user ownership before returning data:

```typescript
if (document.userId !== userId) {
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Access denied' }
  });
  return;
}
```

### 3. Logging

Log important operations:

```typescript
logger.info('Operation completed', { userId, documentId, status: 'success' });
logger.error('Operation failed', error, { userId, documentId });
```

### 4. Caching

Use cache for frequently accessed data:

```typescript
const cached = await cacheService.get(`document:${id}`);
if (cached) return res.json({ success: true, document: cached });

const data = await prisma.document.findUnique({ where: { id } });
await cacheService.set(`document:${id}`, data, 3600);
```

### 5. Validation

Validate all user input:

```typescript
if (!type) {
  return res.status(400).json({
    success: false,
    error: { code: 'MISSING_TYPE', message: 'Document type required' }
  });
}
```

## Testing Endpoints

### Using cURL

```bash
# Generate document
curl -X POST http://localhost:3004/api/v1/documents/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"type":"BOOKING_CONFIRMATION","context":{...}}'

# List documents
curl http://localhost:3004/api/v1/documents \
  -H "Authorization: Bearer {token}"

# Get statistics
curl http://localhost:3004/api/v1/documents/stats/summary \
  -H "Authorization: Bearer {token}"
```

### Using Postman

1. Create environment with `base_url` and `token` variables
2. Use {{base_url}} in requests
3. Set Authorization header to `Bearer {{token}}`
4. Test all endpoints

### Using Jest Tests

```bash
npm test --workspace=@tripalfa/document-service
```

## Troubleshooting

### 401 Unauthorized

**Cause:** Missing or invalid auth token

**Solution:** Check token is included and not expired

```bash
curl -H "Authorization: Bearer {token}" http://localhost:3004/api/v1/documents
```

### 403 Forbidden

**Cause:** Admin access required

**Solution:** Use admin token or check permissions

### 404 Not Found

**Cause:** Resource doesn't exist

**Solution:** Verify resource ID and check database

### 500 Internal Server Error

**Cause:** Server error during processing

**Solution:** Check server logs and error details

## Performance Optimization

### Pagination

Always paginate large result sets:

```typescript
const { page = 1, pageSize = 20 } = req.query;
const skip = (page - 1) * pageSize;

const [items, total] = await Promise.all([
  prisma.document.findMany({ skip, take: pageSize }),
  prisma.document.count()
]);
```

### Caching

Cache frequently accessed data:

```typescript
const cacheKey = `templates:${language}`;
const cached = await cacheService.get(cacheKey);
if (cached) return cached;

const templates = await getTemplates();
await cacheService.set(cacheKey, templates, 3600);
```

### Database Indexes

Use indexes for common queries:

```prisma
model Document {
  id         String  @id @default(uuid())
  userId     String  @index
  type       String  @index
  createdAt  DateTime @default(now()) @index
}
```

## Summary

The REST API controllers provide:
- ✅ Structured request handling
- ✅ Consistent error handling
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Logging and monitoring
- ✅ Caching optimization
- ✅ Database integration

For more details, see the test files and implementation comments in the code.
