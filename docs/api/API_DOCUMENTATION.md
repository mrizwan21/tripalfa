# TripAlfa User Management System - API Documentation

## Overview

This document provides comprehensive API documentation for the enhanced TripAlfa user management system, including security endpoints, OAuth2 integration, threat detection, fraud detection, and monitoring services.

## Table of Contents

1. [Authentication & Security APIs](#authentication--security-apis)
2. [OAuth2 Integration APIs](#oauth2-integration-apis)
3. [Multi-Factor Authentication APIs](#multi-factor-authentication-apis)
4. [Threat Detection APIs](#threat-detection-apis)
5. [Fraud Detection APIs](#fraud-detection-apis)
6. [Monitoring & Health APIs](#monitoring--health-apis)
7. [User Management APIs](#user-management-apis)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Security Headers](#security-headers)
11. [FX Rates API](#fx-rates-api)
12. [Languages API](#languages-api)

---

## Authentication & Security APIs

### 1. User Login

**POST** `/api/v1/auth/login`

Authenticate a user and receive JWT tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "mfaToken": "123456", // Optional if MFA is enabled
  "rememberMe": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "mfaEnabled": true,
      "lastLogin": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

**Response (401 Unauthorized - MFA Required):**

```json
{
  "success": false,
  "error": {
    "code": "MFA_REQUIRED",
    "message": "Multi-factor authentication required",
    "data": {
      "mfaType": "TOTP",
      "qrCodeUrl": "data:image/png;base64,...",
      "backupCodes": ["ABC123", "DEF456"]
    }
  }
}
```

### 2. Token Refresh

**POST** `/api/v1/auth/refresh`

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### 3. Logout

**POST** `/api/v1/auth/logout`

Logout user and invalidate tokens.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 4. Password Reset Request

**POST** `/api/v1/auth/password-reset/request`

Request password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 5. Password Reset Confirm

**POST** `/api/v1/auth/password-reset/confirm`

Confirm password reset with token.

**Request Body:**

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## OAuth2 Integration APIs

### 1. Google OAuth2 Authorization

**GET** `/api/v1/auth/google`

Redirect to Google OAuth2 authorization.

**Query Parameters:**

- `redirect_uri` (optional): Custom redirect URI
- `state` (optional): State parameter for CSRF protection

**Response:** Redirect to Google OAuth2 consent screen

### 2. Google OAuth2 Callback

**GET** `/api/v1/auth/google/callback`

Handle OAuth2 callback and create user session.

**Query Parameters:**

- `code`: Authorization code from Google
- `state`: State parameter for validation

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@gmail.com",
      "name": "John Doe",
      "oauthProvider": "google",
      "oauthId": "google_123456789"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 3. Microsoft OAuth2 Authorization

**GET** `/api/v1/auth/microsoft`

Redirect to Microsoft OAuth2 authorization.

**Response:** Redirect to Microsoft OAuth2 consent screen

### 4. Microsoft OAuth2 Callback

**GET** `/api/v1/auth/microsoft/callback`

Handle Microsoft OAuth2 callback.

**Response:** Similar to Google callback

### 5. OAuth2 Provider Status

**GET** `/api/v1/auth/oauth2/status`

Get status of configured OAuth2 providers.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "providers": {
      "google": {
        "enabled": true,
        "clientId": "your-google-client-id",
        "authUrl": "https://accounts.google.com/o/oauth2/v2/auth"
      },
      "microsoft": {
        "enabled": true,
        "clientId": "your-microsoft-client-id",
        "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
      }
    }
  }
}
```

---

## Multi-Factor Authentication APIs

### 1. Enable MFA

**POST** `/api/v1/auth/mfa/enable`

Enable MFA for the authenticated user.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["ABC123DEF4", "GHI567JKL8", "MNO901PQR2"]
  }
}
```

### 2. Verify MFA Setup

**POST** `/api/v1/auth/mfa/verify-setup`

Verify MFA setup with TOTP token.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "token": "123456",
  "backupCodes": ["ABC123DEF4", "GHI567JKL8"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "MFA setup verified successfully"
}
```

### 3. Disable MFA

**POST** `/api/v1/auth/mfa/disable`

Disable MFA for the authenticated user.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "token": "123456",
  "password": "current_password"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

### 4. Regenerate Backup Codes

**POST** `/api/v1/auth/mfa/backup-codes/regenerate`

Regenerate backup codes for the authenticated user.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "password": "current_password"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "backupCodes": ["NEW123CODE", "NEW456CODE", "NEW789CODE"]
  }
}
```

### 5. Verify MFA Token

**POST** `/api/v1/auth/mfa/verify`

Verify MFA token for authentication.

**Request Body:**

```json
{
  "token": "123456",
  "userId": "user_123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "verified": true,
    "backupCodeUsed": false,
    "remainingBackupCodes": 9
  }
}
```

---

## Threat Detection APIs

### 1. Get Threat Statistics

**GET** `/api/v1/security/threats/statistics`

Get threat detection statistics.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Query Parameters:**

- `timeWindow` (optional): Time window in milliseconds (default: 24 hours)
- `severity` (optional): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalThreats": 156,
    "threatsByType": {
      "SQL_INJECTION": 45,
      "XSS_ATTEMPT": 23,
      "SUSPICIOUS_USER_AGENT": 67,
      "BOT_DETECTION": 21
    },
    "threatsBySeverity": {
      "LOW": 89,
      "MEDIUM": 45,
      "HIGH": 18,
      "CRITICAL": 4
    },
    "topThreatIPs": [
      {
        "ip": "192.168.1.100",
        "count": 23
      },
      {
        "ip": "10.0.0.50",
        "count": 15
      }
    ],
    "blockedIPs": ["192.168.1.200", "10.0.0.100"]
  }
}
```

### 2. Get Recent Threats

**GET** `/api/v1/security/threats/recent`

Get recent threat events.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Query Parameters:**

- `limit` (optional): Number of threats to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `severity` (optional): Filter by severity

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "threats": [
      {
        "id": "threat_123",
        "type": "SQL_INJECTION",
        "severity": "HIGH",
        "sourceIp": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00Z",
        "details": {
          "pattern": "SQL injection attempt detected",
          "content": "SELECT * FROM users WHERE id = 1; DROP TABLE users;"
        },
        "blocked": true
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 100,
      "offset": 0
    }
  }
}
```

### 3. Block IP Address

**POST** `/api/v1/security/threats/block-ip`

Block an IP address.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Request Body:**

```json
{
  "ipAddress": "192.168.1.100",
  "duration": 3600000,
  "reason": "Multiple security violations"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "IP address blocked successfully"
}
```

### 4. Unblock IP Address

**POST** `/api/v1/security/threats/unblock-ip`

Unblock an IP address.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Request Body:**

```json
{
  "ipAddress": "192.168.1.100"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "IP address unblocked successfully"
}
```

### 5. Export Threat Data

**GET** `/api/v1/security/threats/export`

Export threat data for analysis.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Query Parameters:**

- `format` (optional): Export format (json, csv) - default: json
- `timeWindow` (optional): Time window in milliseconds

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "threats": [...],
    "blockedIPs": [...],
    "statistics": {...}
  }
}
```

---

## Fraud Detection APIs

### 1. Analyze Fraud Risk

**POST** `/api/v1/security/fraud/analyze`

Analyze request for fraud indicators.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Session-ID: session_123
```

**Request Body:**

```json
{
  "userId": "user_123",
  "sessionId": "session_123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "path": "/api/v1/users/profile",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "sessionId": "session_123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "score": 45,
    "riskLevel": "MEDIUM",
    "factors": [
      {
        "type": "UNUSUAL_LOCATION",
        "weight": 30,
        "description": "Login from unusual location: US",
        "value": {
          "country": "US",
          "city": "Unknown"
        }
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get Fraud Statistics

**GET** `/api/v1/security/fraud/statistics`

Get fraud detection statistics.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Query Parameters:**

- `timeWindow` (optional): Time window in milliseconds (default: 24 hours)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalChecks": 1250,
    "averageScore": 23.5,
    "riskDistribution": {
      "LOW": 850,
      "MEDIUM": 300,
      "HIGH": 85,
      "CRITICAL": 15
    },
    "topFraudFactors": [
      {
        "factor": "UNUSUAL_LOCATION",
        "count": 120
      },
      {
        "factor": "RAPID_ACTIONS",
        "count": 89
      }
    ]
  }
}
```

### 3. Get User Risk Profile

**GET** `/api/v1/security/fraud/profile/{userId}`

Get user's fraud risk profile.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "typicalLocations": ["192.168.1.100", "10.0.0.50"],
    "typicalDevices": ["Mozilla/5.0...", "Chrome/91.0..."],
    "typicalTimes": [9, 10, 11, 14, 15, 16],
    "averageSessionDuration": 1800000,
    "typicalActions": ["/api/v1/users/profile", "/api/v1/bookings"],
    "riskThreshold": 50,
    "lastLoginLocation": "192.168.1.100",
    "lastLoginTime": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Update User Risk Threshold

**PUT** `/api/v1/security/fraud/profile/{userId}/threshold`

Update user's risk threshold.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Request Body:**

```json
{
  "riskThreshold": 70
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Risk threshold updated successfully"
}
```

---

## Monitoring & Health APIs

### 1. System Health Check

**GET** `/api/v1/health`

Get overall system health status.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 25,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "auth": {
      "status": "healthy",
      "responseTime": 15,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "cache": {
      "status": "healthy",
      "hitRate": 0.85,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "metrics": {
    "memory": {
      "rss": "150 MB",
      "heapTotal": "80 MB",
      "heapUsed": "45 MB",
      "external": "5 MB"
    },
    "uptime": 3600,
    "cpu": {
      "usage": {
        "user": 125000000,
        "system": 50000000
      }
    }
  }
}
```

**Response (503 Service Unavailable):**

```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "unhealthy",
      "error": "Connection timeout",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. Service Health Check

**GET** `/api/v1/health/{service}`

Get specific service health status.

**Services:** `database`, `redis`, `auth`, `cache`

**Response (200 OK):**

```json
{
  "status": "healthy",
  "responseTime": 25,
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "connectionPool": {
      "active": 5,
      "idle": 15,
      "total": 20
    },
    "queries": {
      "total": 1250,
      "slow": 5,
      "failed": 2
    }
  }
}
```

### 3. Metrics Collection

**GET** `/api/v1/metrics`

Get system metrics.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Query Parameters:**

- `type` (optional): Metric type (security, performance, business)
- `timeWindow` (optional): Time window in milliseconds

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "security": {
      "threats": {
        "total": 156,
        "bySeverity": {
          "LOW": 89,
          "MEDIUM": 45,
          "HIGH": 18,
          "CRITICAL": 4
        }
      },
      "auth": {
        "loginAttempts": 1250,
        "successRate": 0.95,
        "mfaAdoption": 0.65
      }
    },
    "performance": {
      "responseTime": {
        "average": 250,
        "p95": 500,
        "p99": 1000
      },
      "cache": {
        "hitRate": 0.85,
        "missRate": 0.15,
        "evictions": 120
      }
    },
    "business": {
      "users": {
        "active": 5000,
        "newToday": 25,
        "churnRate": 0.02
      },
      "bookings": {
        "total": 1250,
        "successRate": 0.98,
        "revenue": 50000.0
      }
    }
  }
}
```

### 4. WebSocket Connection

**WebSocket** `ws://localhost:8080/metrics`

Real-time metrics streaming.

**Subscription Message:**

```json
{
  "type": "subscribe",
  "metrics": ["security", "performance", "business"]
}
```

**Unsubscribe Message:**

```json
{
  "type": "unsubscribe",
  "metrics": ["security"]
}
```

**Metrics Update Message:**

```json
{
  "type": "metrics_update",
  "data": {
    "type": "security",
    "values": [...],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Alert Management

**GET** `/api/v1/alerts`

Get active alerts.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Admin-Key: your-admin-key
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_123",
        "ruleId": "high_response_time",
        "name": "High Response Time",
        "severity": "HIGH",
        "message": "API response time exceeds 2 seconds",
        "timestamp": "2024-01-15T10:30:00Z",
        "acknowledged": false,
        "acknowledgedAt": null
      }
    ]
  }
}
```

**POST** `/api/v1/alerts/{alertId}/acknowledge`

Acknowledge alert.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Alert acknowledged successfully"
}
```

---

## User Management APIs

### 1. Get User Profile

**GET** `/api/v1/users/profile`

Get authenticated user's profile.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "status": "active",
      "mfaEnabled": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "timezone": "UTC",
        "language": "en"
      }
    }
  }
}
```

### 2. Update User Profile

**PUT** `/api/v1/users/profile`

Update authenticated user's profile.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "timezone": "America/New_York",
    "language": "en"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

### 3. Change Password

**POST** `/api/v1/users/password/change`

Change user password.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "currentPassword": "current_password",
  "newPassword": "new_secure_password123!",
  "confirmPassword": "new_secure_password123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 4. Get User Activity

**GET** `/api/v1/users/activity`

Get user activity log.

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `limit` (optional): Number of activities to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)
- `type` (optional): Filter by activity type

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "type": "LOGIN",
        "description": "User logged in",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00Z",
        "metadata": {
          "mfaUsed": true,
          "sessionDuration": 3600
        }
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

## FX Rates API

### 1. Get Latest Exchange Rates

**GET** `/api/exchange-rates/latest`

Fetch latest FX rates from static DB (`shared.currencies`) populated by hourly OpenExchange sync.

**Query Parameters:**

- `base` (optional): Base currency code (default: `USD`)

**Response (200 OK):**

```json
{
  "success": true,
  "base": "USD",
  "rates": {
    "USD": 1,
    "EUR": 0.92,
    "GBP": 0.79,
    "AED": 3.67
  },
  "source": "static-db",
  "updatedAt": "2026-02-26T08:05:00.000Z"
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Unsupported base currency: XYZ"
}
```

**Response (503 Service Unavailable):**

```json
{
  "success": false,
  "error": "No exchange rates available in static DB"
}
```

---

## Languages API

### 1. Get Supported Languages

**GET** `/api/liteapi/languages`

Fetch enabled languages from static DB (`shared.languages`) synced locally, including design-aligned language flag mapping.

**Response (200 OK):**

```json
[
  {
    "code": "en",
    "name": "English",
    "flag": "🇺🇸",
    "isRtl": false
  },
  {
    "code": "ar",
    "name": "Arabic",
    "flag": "🇸🇦",
    "isRtl": true
  }
]
```

**Response (503 Service Unavailable):**

```json
{
  "success": false,
  "error": "Static DB not configured"
}
```

---

## Error Handling

### Error Response Format

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| Code                  | HTTP Status | Description                     |
| --------------------- | ----------- | ------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request validation failed       |
| `UNAUTHORIZED`        | 401         | Authentication required         |
| `FORBIDDEN`           | 403         | Insufficient permissions        |
| `NOT_FOUND`           | 404         | Resource not found              |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests               |
| `INTERNAL_ERROR`      | 500         | Internal server error           |
| `SERVICE_UNAVAILABLE` | 503         | Service temporarily unavailable |

### Authentication Errors

| Code                    | Description                          |
| ----------------------- | ------------------------------------ |
| `INVALID_CREDENTIALS`   | Invalid email or password            |
| `ACCOUNT_LOCKED`        | Account temporarily locked           |
| `MFA_REQUIRED`          | Multi-factor authentication required |
| `TOKEN_EXPIRED`         | Authentication token expired         |
| `TOKEN_INVALID`         | Invalid authentication token         |
| `REFRESH_TOKEN_EXPIRED` | Refresh token expired                |

### Security Errors

| Code                      | Description                   |
| ------------------------- | ----------------------------- |
| `SUSPICIOUS_ACTIVITY`     | Suspicious activity detected  |
| `IP_BLOCKED`              | IP address is blocked         |
| `RATE_LIMIT_EXCEEDED`     | Too many requests from IP     |
| `FRAUD_DETECTED`          | Fraudulent activity detected  |
| `MFA_VERIFICATION_FAILED` | MFA token verification failed |

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limiting information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
X-RateLimit-Window: 900
```

### Rate Limit Policies

| Endpoint Pattern     | Limit         | Window     |
| -------------------- | ------------- | ---------- |
| `/api/v1/auth/*`     | 5 requests    | 15 minutes |
| `/api/v1/users/*`    | 100 requests  | 15 minutes |
| `/api/v1/security/*` | 50 requests   | 15 minutes |
| `/api/v1/health/*`   | 1000 requests | 15 minutes |
| `/api/v1/metrics/*`  | 100 requests  | 15 minutes |

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2024-01-15T10:45:00Z"
    }
  }
}
```

---

## Security Headers

All API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Authentication

### JWT Token Format

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "email": "user@example.com",
    "role": "admin",
    "iat": 1642230000,
    "exp": 1642230900,
    "mfa": true
  },
  "signature": "..."
}
```

### Token Refresh Flow

1. Client detects expired token (401 response)
2. Client sends refresh token to `/api/v1/auth/refresh`
3. Server validates refresh token and issues new access token
4. Client retries original request with new access token

### OAuth2 Scopes

| Scope            | Description                        |
| ---------------- | ---------------------------------- |
| `profile`        | Access to user profile information |
| `email`          | Access to user email address       |
| `openid`         | OpenID Connect authentication      |
| `offline_access` | Refresh token access               |

---

## SDK Integration Examples

### JavaScript/Node.js

```javascript
class TripAlfaAPI {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getProfile(accessToken) {
    const response = await fetch(`${this.baseURL}/api/v1/users/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### Python

```python
import requests
import json

class TripAlfaAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def login(self, email, password):
        response = self.session.post(f'{self.base_url}/api/v1/auth/login',
                                   json={'email': email, 'password': password})
        response.raise_for_status()
        return response.json()

    def get_profile(self, access_token):
        headers = {'Authorization': f'Bearer {access_token}'}
        response = self.session.get(f'{self.base_url}/api/v1/users/profile',
                                  headers=headers)
        response.raise_for_status()
        return response.json()
```

---

## Versioning

### API Versioning

The API uses URL-based versioning:

- **Current Version:** `v1` (`/api/v1/`)
- **Future Versions:** `v2`, `v3`, etc.

### Deprecation Policy

- Deprecated endpoints will be marked with `X-API-Deprecated: true` header
- Deprecated features will be supported for 12 months after deprecation
- Breaking changes will only be introduced in new major versions

---

## Support

For API support and questions:

- **Documentation:** [https://docs.tripalfa.com/api](https://docs.tripalfa.com/api)
- **Support Email:** <api-support@tripalfa.com>
- **Status Page:** [https://status.tripalfa.com](https://status.tripalfa.com)
- **Developer Forum:** [https://community.tripalfa.com](https://community.tripalfa.com)

---

_Last Updated: January 15, 2024_
_Version: 1.0.0_
