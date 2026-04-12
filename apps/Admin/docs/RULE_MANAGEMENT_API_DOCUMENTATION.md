# Rule Management System - API Documentation

This document provides comprehensive API documentation for the Rule Management System backend endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
   - [Rule Management](#rule-management)
   - [Analytics](#analytics)
   - [Audit Logs](#audit-logs)
   - [Categories](#categories)
5. [Request/Response Examples](#requestresponse-examples)
6. [Rate Limiting](#rate-limiting)
7. [Security Considerations](#security-considerations)

## Authentication

All endpoints require authentication using JWT tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Required Permissions

Each endpoint requires specific permissions:

- `rules.view` - View rules and analytics
- `rules.create` - Create new rules
- `rules.edit` - Update existing rules
- `rules.delete` - Delete rules
- `rules.analytics` - Access analytics data
- `rules.audit` - View audit logs
- `rules.categories.manage` - Manage rule categories

## Base URL

```
https://api.tripalfa.com/v1
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Rule name is required"
      }
    ]
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., duplicate name)
- `INTERNAL_ERROR` - Server error

## API Endpoints

### Rule Management

#### GET /api/rules

Retrieve a list of rules with filtering and pagination.

**Permissions:** `rules.view`

**Query Parameters:**

| Parameter   | Type   | Required | Description                                       |
| ----------- | ------ | -------- | ------------------------------------------------- |
| `category`  | string | No       | Filter by rule category                           |
| `status`    | string | No       | Filter by status (active, inactive, draft)        |
| `search`    | string | No       | Search in rule name and description               |
| `priority`  | number | No       | Filter by priority level                          |
| `page`      | number | No       | Page number (default: 1)                          |
| `limit`     | number | No       | Items per page (default: 20, max: 100)            |
| `sortBy`    | string | No       | Sort field (name, priority, createdAt, updatedAt) |
| `sortOrder` | string | No       | Sort order (asc, desc)                            |

**Response:**

```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "rule_123",
        "name": "High Priority Flight Booking",
        "description": "Rules for high priority flight bookings",
        "category": "flight",
        "conditions": {
          "type": "object",
          "properties": {
            "bookingType": { "const": "flight" },
            "priority": { "minimum": 5 }
          }
        },
        "actions": [
          {
            "type": "apply_discount",
            "value": 10,
            "currency": "USD"
          }
        ],
        "priority": 100,
        "isActive": true,
        "companyId": "comp_123",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /api/rules/:id

Retrieve a specific rule by ID.

**Permissions:** `rules.view`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rule_123",
    "name": "High Priority Flight Booking",
    "description": "Rules for high priority flight bookings",
    "category": "flight",
    "conditions": {
      "type": "object",
      "properties": {
        "bookingType": { "const": "flight" },
        "priority": { "minimum": 5 }
      }
    },
    "actions": [
      {
        "type": "apply_discount",
        "value": 10,
        "currency": "USD"
      }
    ],
    "priority": 100,
    "isActive": true,
    "companyId": "comp_123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/rules

Create a new rule.

**Permissions:** `rules.create`

**Request Body:**

```json
{
  "name": "High Priority Flight Booking",
  "description": "Rules for high priority flight bookings",
  "category": "flight",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "flight" },
      "priority": { "minimum": 5 }
    }
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 10,
      "currency": "USD"
    }
  ],
  "priority": 100,
  "isActive": true
}
```

**Validation Rules:**

- `name`: Required, 3-100 characters
- `category`: Required, must be valid category
- `conditions`: Required, valid JSON schema
- `actions`: Required, array of valid actions
- `priority`: Required, 1-1000
- `isActive`: Boolean

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rule_123",
    "name": "High Priority Flight Booking",
    "description": "Rules for high priority flight bookings",
    "category": "flight",
    "conditions": {
      "type": "object",
      "properties": {
        "bookingType": { "const": "flight" },
        "priority": { "minimum": 5 }
      }
    },
    "actions": [
      {
        "type": "apply_discount",
        "value": 10,
        "currency": "USD"
      }
    ],
    "priority": 100,
    "isActive": true,
    "companyId": "comp_123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/rules/:id

Update an existing rule.

**Permissions:** `rules.edit`

**Request Body:**

```json
{
  "name": "Updated Rule Name",
  "description": "Updated description",
  "category": "hotel",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "hotel" },
      "guestCount": { "minimum": 2 }
    }
  },
  "actions": [
    {
      "type": "apply_markup",
      "value": 5,
      "currency": "USD"
    }
  ],
  "priority": 200,
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rule_123",
    "name": "Updated Rule Name",
    "description": "Updated description",
    "category": "hotel",
    "conditions": {
      "type": "object",
      "properties": {
        "bookingType": { "const": "hotel" },
        "guestCount": { "minimum": 2 }
      }
    },
    "actions": [
      {
        "type": "apply_markup",
        "value": 5,
        "currency": "USD"
      }
    ],
    "priority": 200,
    "isActive": false,
    "companyId": "comp_123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:45:00Z"
  }
}
```

#### DELETE /api/rules/:id

Delete a rule.

**Permissions:** `rules.delete`

**Response:**

```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

#### PATCH /api/rules/:id/status

Update rule status (activate/deactivate).

**Permissions:** `rules.edit`

**Request Body:**

```json
{
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rule_123",
    "isActive": true,
    "updatedAt": "2024-01-16T14:45:00Z"
  }
}
```

### Analytics

#### GET /api/rules/:id/analytics

Get rule performance analytics.

**Permissions:** `rules.analytics`

**Query Parameters:**

| Parameter   | Type   | Required | Description                        |
| ----------- | ------ | -------- | ---------------------------------- |
| `startDate` | string | No       | Start date (YYYY-MM-DD)            |
| `endDate`   | string | No       | End date (YYYY-MM-DD)              |
| `timeframe` | string | No       | Timeframe (hour, day, week, month) |

**Response:**

```json
{
  "success": true,
  "data": {
    "ruleId": "rule_123",
    "totalExecutions": 1542,
    "successRate": 98.5,
    "averageExecutionTime": 45.2,
    "lastExecutedAt": "2024-01-16T14:45:00Z",
    "executionHistory": [
      {
        "timestamp": "2024-01-16T14:45:00Z",
        "executionTime": 42.1,
        "success": true
      }
    ],
    "performanceMetrics": {
      "p50": 35.2,
      "p95": 65.8,
      "p99": 120.5
    }
  }
}
```

#### GET /api/rules/analytics/summary

Get analytics summary for all rules.

**Permissions:** `rules.analytics`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRules": 25,
    "activeRules": 20,
    "inactiveRules": 5,
    "totalExecutions": 15420,
    "averageSuccessRate": 96.8,
    "topPerformingRules": [
      {
        "ruleId": "rule_123",
        "name": "High Priority Flight Booking",
        "executions": 1542,
        "successRate": 98.5
      }
    ],
    "categoryStats": {
      "flight": { "count": 8, "executions": 8500 },
      "hotel": { "count": 6, "executions": 4200 },
      "car": { "count": 4, "executions": 1800 },
      "package": { "count": 3, "executions": 920 },
      "payment": { "count": 2, "executions": 0 },
      "user": { "count": 1, "executions": 0 },
      "booking": { "count": 1, "executions": 0 }
    }
  }
}
```

### Audit Logs

#### GET /api/rules/:id/audit

Get audit log for a specific rule.

**Permissions:** `rules.audit`

**Query Parameters:**

| Parameter   | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `page`      | number | No       | Page number (default: 1)                     |
| `limit`     | number | No       | Items per page (default: 20, max: 100)       |
| `action`    | string | No       | Filter by action (created, updated, deleted) |
| `startDate` | string | No       | Start date filter                            |
| `endDate`   | string | No       | End date filter                              |

**Response:**

```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": "audit_123",
        "ruleId": "rule_123",
        "action": "updated",
        "changes": {
          "before": {
            "priority": 100,
            "isActive": true
          },
          "after": {
            "priority": 200,
            "isActive": false
          }
        },
        "userId": "user_456",
        "userName": "John Doe",
        "timestamp": "2024-01-16T14:45:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /api/rules/audit

Get audit logs for all rules.

**Permissions:** `rules.audit`

**Query Parameters:**

| Parameter   | Type   | Required | Description           |
| ----------- | ------ | -------- | --------------------- |
| `userId`    | string | No       | Filter by user ID     |
| `action`    | string | No       | Filter by action type |
| `startDate` | string | No       | Start date filter     |
| `endDate`   | string | No       | End date filter       |
| `page`      | number | No       | Page number           |
| `limit`     | number | No       | Items per page        |

**Response:**

```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": "audit_123",
        "ruleId": "rule_123",
        "action": "created",
        "changes": {
          "after": {
            "name": "New Rule",
            "category": "flight"
          }
        },
        "userId": "user_456",
        "userName": "John Doe",
        "timestamp": "2024-01-15T10:30:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Categories

#### GET /api/rules/categories

Get available rule categories.

**Permissions:** `rules.view`

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "flight",
        "name": "Flight Rules",
        "description": "Rules for flight bookings and operations",
        "icon": "plane",
        "color": "#3b82f6"
      },
      {
        "id": "hotel",
        "name": "Hotel Rules",
        "description": "Rules for hotel bookings and operations",
        "icon": "building",
        "color": "#10b981"
      },
      {
        "id": "car",
        "name": "Car Rules",
        "description": "Rules for car rental bookings",
        "icon": "car",
        "color": "#f59e0b"
      },
      {
        "id": "package",
        "name": "Package Rules",
        "description": "Rules for package bookings",
        "icon": "box",
        "color": "#8b5cf6"
      },
      {
        "id": "payment",
        "name": "Payment Rules",
        "description": "Rules for payment processing",
        "icon": "credit-card",
        "color": "#ef4444"
      },
      {
        "id": "user",
        "name": "User Rules",
        "description": "Rules for user management",
        "icon": "user",
        "color": "#6366f1"
      },
      {
        "id": "booking",
        "name": "Booking Rules",
        "description": "General booking rules",
        "icon": "calendar",
        "color": "#06b6d4"
      }
    ]
  }
}
```

#### POST /api/rules/categories

Create a new rule category.

**Permissions:** `rules.categories.manage`

**Request Body:**

```json
{
  "id": "custom",
  "name": "Custom Rules",
  "description": "Custom business rules",
  "icon": "settings",
  "color": "#64748b"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "custom",
    "name": "Custom Rules",
    "description": "Custom business rules",
    "icon": "settings",
    "color": "#64748b",
    "createdAt": "2024-01-16T14:45:00Z"
  }
}
```

## Request/Response Examples

### Create Rule Example

**Request:**

```http
POST /api/rules
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "name": "Corporate Flight Discount",
  "description": "10% discount for corporate flight bookings",
  "category": "flight",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "flight" },
      "corporate": { "const": true },
      "advanceBookingDays": { "minimum": 7 }
    }
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 10,
      "currency": "USD",
      "applyTo": "base_fare"
    }
  ],
  "priority": 500,
  "isActive": true
}
```

**Response:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "rule_corp_001",
    "name": "Corporate Flight Discount",
    "description": "10% discount for corporate flight bookings",
    "category": "flight",
    "conditions": {
      "type": "object",
      "properties": {
        "bookingType": { "const": "flight" },
        "corporate": { "const": true },
        "advanceBookingDays": { "minimum": 7 }
      }
    },
    "actions": [
      {
        "type": "apply_discount",
        "value": 10,
        "currency": "USD",
        "applyTo": "base_fare"
      }
    ],
    "priority": 500,
    "isActive": true,
    "companyId": "comp_123",
    "createdAt": "2024-01-16T14:45:00Z",
    "updatedAt": "2024-01-16T14:45:00Z"
  }
}
```

### Error Response Example

**Response:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "priority",
        "message": "Priority must be between 1 and 1000"
      },
      {
        "field": "conditions",
        "message": "Conditions must be a valid JSON schema"
      }
    ]
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Read operations**: 100 requests per minute per user
- **Write operations**: 20 requests per minute per user
- **Analytics operations**: 50 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642358400
```

## Security Considerations

### Input Validation

- All inputs are validated using JSON Schema
- SQL injection protection through parameterized queries
- XSS prevention through proper escaping
- File upload validation for any file-based operations

### Authentication & Authorization

- JWT tokens with expiration
- Role-based access control
- Permission validation on every request
- Audit logging for all sensitive operations

### Data Protection

- Sensitive data encryption at rest
- HTTPS required for all API calls
- Request/response logging for security monitoring
- Regular security audits recommended

### Best Practices

- Use strong, unique API keys
- Implement proper error handling without exposing sensitive information
- Regularly rotate API keys and tokens
- Monitor API usage for unusual patterns
- Implement proper session management
