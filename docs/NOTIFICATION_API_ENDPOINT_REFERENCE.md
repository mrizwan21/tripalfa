# Notification Management Tests - API Endpoint Reference

## Complete API Endpoint Mapping

This document provides a comprehensive list of all API endpoints tested across the notification management test suite.

---

## 1. Core Notification Endpoints

### Base URL
```
http://localhost:3001/api
```

### POST /notifications
**Test File**: `notificationAPI.integration.test.ts`

Create and send a notification across multiple channels.

**Request Body**:
```json
{
  "orderId": "order-123",
  "recipientEmail": "customer@example.com",
  "recipientPhone": "+1234567890",
  "channels": ["email", "sms", "push", "in_app"],
  "notificationType": "booking_confirmation",
  "data": {
    "bookingRef": "BK12345",
    "customerName": "John Doe",
    "flightDetails": "NYC-LAX on Feb 15"
  }
}
```

**Response**:
```json
{
  "notificationId": "notif-123",
  "status": "pending",
  "channels": ["email", "sms", "push", "in_app"],
  "createdAt": "2026-02-09T10:00:00Z"
}
```

### GET /notifications/:id
**Test File**: `notificationAPI.integration.test.ts`

Retrieve notification details and delivery status.

**Response**:
```json
{
  "notificationId": "notif-123",
  "orderId": "order-123",
  "status": "sent",
  "channels": {
    "email": { "status": "delivered", "time": "2026-02-09T10:00:30Z" },
    "sms": { "status": "delivered", "time": "2026-02-09T10:00:25Z" },
    "push": { "status": "failed", "reason": "device_offline" }
  },
  "deliveredAt": "2026-02-09T10:00:30Z"
}
```

### GET /notifications
**Test File**: `notificationAPI.integration.test.ts`

List notifications with pagination and filtering.

**Query Parameters**:
```
GET /notifications?page=1&limit=50&status=sent&orderId=order-123
```

**Response**:
```json
{
  "notifications": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5
  }
}
```

### PATCH /notifications/:id
**Test File**: `notificationRetryMechanism.test.ts`

Update notification status or trigger manual retry.

**Request Body**:
```json
{
  "status": "pending",
  "retryCount": 0
}
```

---

## 2. Scheduled Notifications Endpoints

### POST /notifications/schedule
**Test File**: `scheduledNotifications.test.ts`

Schedule a notification to be sent at a future time.

**Request Body**:
```json
{
  "orderId": "order-123",
  "channels": ["email", "sms"],
  "scheduledTime": "2026-02-20T10:00:00Z",
  "data": {
    "reminderType": "pre_travel",
    "hoursTo": 72
  }
}
```

**Response**:
```json
{
  "jobId": "job-123",
  "scheduledTime": "2026-02-20T10:00:00Z",
  "status": "scheduled"
}
```

### GET /notifications/jobs/:jobId
**Test File**: `scheduledNotifications.test.ts`

Get the status of a scheduled notification job.

**Response**:
```json
{
  "jobId": "job-123",
  "status": "scheduled",
  "scheduledTime": "2026-02-20T10:00:00Z",
  "delayMs": 259200000,
  "attempts": 0
}
```

### DELETE /notifications/jobs/:jobId
**Test File**: `scheduledNotifications.test.ts`

Cancel a scheduled notification before it executes.

**Response**:
```json
{
  "cancelled": true,
  "jobId": "job-123"
}
```

### POST /notifications/schedule/recurring
**Test File**: `scheduledNotifications.test.ts`

Create a recurring notification schedule.

**Request Body**:
```json
{
  "orderId": "order-123",
  "frequency": "daily",
  "startTime": "2026-02-10T09:00:00Z",
  "endTime": "2026-02-20T09:00:00Z",
  "channels": ["email"]
}
```

---

## 3. Template Management Endpoints

### POST /templates/render
**Test File**: `templateSubstitution.test.ts`

Render a notification template with variable substitution.

**Request Body**:
```json
{
  "templateId": "booking_confirmation",
  "channel": "email",
  "locale": "en",
  "variables": {
    "customerName": "John Doe",
    "bookingReference": "BK12345",
    "flightDate": "2026-02-15",
    "isPremium": true
  }
}
```

**Response**:
```json
{
  "content": "<html>...</html>",
  "subject": "Booking Confirmation - BK12345",
  "renderTime": 45
}
```

### POST /templates/validate
**Test File**: `templateSubstitution.test.ts`

Validate a notification template for syntax and variables.

**Request Body**:
```json
{
  "template": "Hello {{customerName}}, your booking {{#if isPremium}}with premium support{{/if}} is confirmed!",
  "requiredVariables": ["customerName"]
}
```

**Response**:
```json
{
  "valid": true,
  "variables": ["customerName", "isPremium"],
  "errors": []
}
```

### GET /templates/variables
**Test File**: `templateSubstitution.test.ts`

Get available variables for a template type.

**Response**:
```json
{
  "variables": [
    {
      "name": "customerName",
      "type": "string",
      "required": true,
      "description": "Customer's full name"
    },
    {
      "name": "isPremium",
      "type": "boolean",
      "required": false
    }
  ]
}
```

---

## 4. Webhook & Event Endpoints

### POST /webhooks/process
**Test File**: `webhooksIntegration.test.ts`

Process a webhook from an external supplier.

**Request Headers**:
```
X-Webhook-Signature: sha256=abcd1234...
X-Webhook-Timestamp: 1707467400
```

**Request Body**:
```json
{
  "event": "order.airline_initiated_change_detected",
  "order_id": "ORDER123",
  "changes": [
    {
      "type": "departure_time_change",
      "from": "2026-02-15T09:00:00Z",
      "to": "2026-02-15T11:30:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "acknowledged": true,
  "notificationsSent": 2
}
```

### POST /webhooks/schedule-change
**Test File**: `scheduleChangeDetection.test.ts`

Handle schedule change detection from Duffel.

**Request Body**:
```json
{
  "orderId": "duffel-order-123",
  "changeType": "departure_time_change",
  "oldTime": "2026-02-15T09:00:00Z",
  "newTime": "2026-02-15T14:00:00Z",
  "timeToDepature": 25200,
  "connectionTime": 65
}
```

**Response**:
```json
{
  "urgency": "URGENT",
  "impactLevel": "CRITICAL",
  "notificationChannels": ["email", "sms", "push", "in_app"],
  "userActionRequired": true
}
```

### GET /webhooks/history
**Test File**: `scheduleChangeDetection.test.ts`

Get history of processed webhooks.

**Query Parameters**:
```
GET /webhooks/history?supplier=duffel&limit=50&offset=0
```

---

## 5. Retry & DLQ Endpoints

### POST /notifications/:id/retry
**Test File**: `notificationRetryMechanism.test.ts`

Manually retry a failed notification.

**Request Body**:
```json
{
  "channels": ["email"],
  "strategyType": "exponential_backoff"
}
```

**Response**:
```json
{
  "retryScheduled": true,
  "nextRetryAt": "2026-02-09T10:02:00Z",
  "retryAttempt": 1
}
```

### GET /notifications/dlq
**Test File**: `notificationRetryMechanism.test.ts`

Retrieve notifications in Dead Letter Queue.

**Query Parameters**:
```
GET /notifications/dlq?limit=50&offset=0
```

**Response**:
```json
{
  "dlqNotifications": [
    {
      "notificationId": "notif-123",
      "reason": "max_retries_exhausted",
      "failureReason": "email_provider_unreachable",
      "moveTime": "2026-02-09T10:15:00Z",
      "replayCount": 0
    }
  ]
}
```

### POST /notifications/dlq/:id/replay
**Test File**: `notificationRetryMechanism.test.ts`

Replay a notification from the Dead Letter Queue.

**Request Body**:
```json
{
  "resetRetryCount": true,
  "newRetryLimit": 3
}
```

**Response**:
```json
{
  "replayed": true,
  "newStatus": "pending",
  "retryCountReset": 0
}
```

### GET /notifications/circuit-breaker/status
**Test File**: `notificationRetryMechanism.test.ts`

Get circuit breaker status for a provider.

**Response**:
```json
{
  "provider": "sendgrid",
  "state": "half_open",
  "failureRate": 0.35,
  "nextProbeTime": "2026-02-09T10:35:00Z"
}
```

---

## 6. Wallet Reconciliation Endpoints

### POST /wallet/reconciliation/execute
**Test File**: `walletReconciliation.test.ts`

Execute wallet reconciliation job (normally scheduled daily at 2 AM UTC).

**Request Body**:
```json
{
  "executionTime": "2026-02-09T02:00:00Z",
  "manualTrigger": true
}
```

**Response**:
```json
{
  "jobId": "recon-123",
  "status": "completed",
  "recordsProcessed": 15000,
  "notificationsSent": 45,
  "discrepancies": [...],
  "duration": 180000
}
```

### POST /wallet/fx-rates/update
**Test File**: `walletReconciliation.test.ts`

Update FX rates (normally scheduled hourly).

**Request Body**:
```json
{
  "executionTime": "2026-02-09T10:00:00Z",
  "manualTrigger": true,
  "currencies": ["USD", "EUR", "GBP"]
}
```

**Response**:
```json
{
  "ratesUpdated": 150,
  "significantChanges": [
    {
      "currencyPair": "EUR/USD",
      "oldRate": 1.0850,
      "newRate": 1.1050,
      "changePercentage": 1.84,
      "notificationSent": false
    }
  ]
}
```

### POST /wallet/:walletId/low-balance-check
**Test File**: `walletReconciliation.test.ts`

Check wallet balance and send alert if low.

**Request Body**:
```json
{
  "userId": "user-123",
  "threshold": 100,
  "warningThreshold": 500,
  "criticalThreshold": 200,
  "currency": "USD"
}
```

**Response**:
```json
{
  "currentBalance": 45,
  "belowThreshold": true,
  "alertLevel": "urgent",
  "notificationSent": true,
  "suggestedTopUpAmounts": [100, 250, 500]
}
```

### GET /wallet/reconciliation/history
**Test File**: `walletReconciliation.test.ts`

Get history of reconciliation jobs.

**Query Parameters**:
```
GET /wallet/reconciliation/history?limit=10&offset=0
```

**Response**:
```json
{
  "executions": [
    {
      "jobId": "recon-123",
      "status": "completed",
      "timestamp": "2026-02-09T02:00:00Z",
      "recordsProcessed": 12000,
      "duration": 150000
    }
  ]
}
```

---

## 7. Analytics & Metrics Endpoints

### GET /notifications/analytics/delivery-rate
**Test File**: `notificationAnalytics.test.ts`

Get delivery rate metrics for a date range.

**Query Parameters**:
```
GET /notifications/analytics/delivery-rate?startDate=2026-02-01&endDate=2026-02-09
```

**Response**:
```json
{
  "successRate": 94.5,
  "failureRate": 5.5,
  "totalNotifications": 10000,
  "period": {
    "start": "2026-02-01",
    "end": "2026-02-09"
  }
}
```

### GET /notifications/analytics/channel/:channel
**Test File**: `notificationAnalytics.test.ts`

Get performance metrics for a specific channel.

**Response**:
```json
{
  "channel": "email",
  "sent": 5000,
  "delivered": 4725,
  "failed": 275,
  "deliveryRate": 94.5,
  "openRate": 32.1,
  "clickRate": 8.4
}
```

### GET /notifications/analytics/channels
**Test File**: `notificationAnalytics.test.ts`

Compare performance across all channels.

**Response**:
```json
{
  "channels": [
    {
      "name": "email",
      "deliveryRate": 94.5,
      "openRate": 32.1,
      "sent": 5000
    },
    {
      "name": "sms",
      "deliveryRate": 98.2,
      "acknowledgmentRate": 45.3,
      "sent": 3000
    }
  ]
}
```

### GET /notifications/analytics/latency
**Test File**: `notificationAnalytics.test.ts`

Get notification latency metrics (P50, P95, P99).

**Response**:
```json
{
  "averageLatency": 450,
  "p50Latency": 320,
  "p95Latency": 1200,
  "p99Latency": 2500,
  "unit": "ms"
}
```

### GET /notifications/analytics/throughput
**Test File**: `notificationAnalytics.test.ts`

Get notification sending throughput.

**Query Parameters**:
```
GET /notifications/analytics/throughput?interval=hourly&startDate=2026-02-09&endDate=2026-02-10
```

**Response**:
```json
{
  "peakThroughput": 850,
  "averageThroughput": 320,
  "totalNotificationsSent": 15000,
  "interval": "hourly",
  "timeline": [...]
}
```

### GET /notifications/analytics/failure-reasons
**Test File**: `notificationAnalytics.test.ts`

Get categorization of failures by reason.

**Response**:
```json
{
  "reasons": [
    {
      "reason": "provider_timeout",
      "count": 125,
      "percentage": 45.5
    },
    {
      "reason": "invalid_email_address",
      "count": 88,
      "percentage": 32.0
    },
    {
      "reason": "rate_limit_exceeded",
      "count": 62,
      "percentage": 22.5
    }
  ]
}
```

### POST /notifications/analytics/report/daily
**Test File**: `notificationAnalytics.test.ts`

Generate daily performance report.

**Request Body**:
```json
{
  "date": "2026-02-09"
}
```

**Response**:
```json
{
  "reportId": "report-123",
  "date": "2026-02-09",
  "metrics": {
    "totalNotifications": 8500,
    "successRate": 94.2,
    "failureRate": 5.8,
    "averageLatency": 455
  }
}
```

### GET /notifications/analytics/queue-status
**Test File**: `notificationAnalytics.test.ts`

Get current notification queue status (real-time dashboard).

**Response**:
```json
{
  "pending": 245,
  "processing": 32,
  "retrying": 18,
  "failed": 5,
  "total": 300
}
```

### GET /notifications/analytics/provider-health
**Test File**: `notificationAnalytics.test.ts`

Get health status of notification providers.

**Response**:
```json
{
  "providers": [
    {
      "name": "sendgrid",
      "status": "healthy",
      "lastCheckTime": "2026-02-09T10:15:00Z",
      "uptime": 99.95
    },
    {
      "name": "twilio",
      "status": "degraded",
      "lastCheckTime": "2026-02-09T10:14:30Z",
      "uptime": 98.5
    }
  ]
}
```

---

## 8. Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Validation Error",
  "message": "Missing required field: orderId",
  "code": "INVALID_REQUEST"
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate Limited",
  "message": "Max 3 replays per notification allowed",
  "retryAfter": 60
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to send notification",
  "code": "INTERNAL_ERROR",
  "requestId": "req-123"
}
```

---

## 9. Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 10. Rate Limits

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: Unlimited

---

## Filter & Search Syntax

### Notification Queries
```
GET /notifications?filters=status:sent,channel:email&sort=createdAt:desc
```

### Date Ranges
```
GET /notifications?createdAfter=2026-02-01&createdBefore=2026-02-09
```

### Pagination
```
GET /notifications?page=2&limit=50&sort=createdAt:desc
```

---

**Last Updated**: February 9, 2026  
**Test Suite Version**: 14 files | 610+ scenarios | 5,514+ lines
