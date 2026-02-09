# Notification Management Implementation Guide

## Quick Start for Developers

This guide provides step-by-step instructions to implement the notification management system based on the comprehensive test specifications.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway / Routes                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Notification Controllers                         │
│  (notificationAPI.integration.test.ts)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           Notification Service Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Core Service (notificationService.integration)       │   │
│  │ - Multi-channel delivery                             │   │
│  │ - Provider management                                │   │
│  │ - Queue management                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓            ↓            ↓            ↓
   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────┐
   │  Email  │  │   SMS    │  │ Push   │  │In-App │
   └─────────┘  └──────────┘  └────────┘  └───────┘
   (SendGrid)   (Twilio)      (Firebase) (Database)

Advanced Features Layer:
├─ BullMQ Scheduler (scheduledNotifications)
├─ Template Engine (templateSubstitution)
├─ Webhook Processor (scheduleChangeDetection)
├─ Retry Manager (notificationRetryMechanism)
├─ Analytics Engine (notificationAnalytics)
└─ Wallet Reconciliation (walletReconciliation)
```

---

## Phase 1: Core Notification Service Implementation

### 1.1 Create Notification Service

**File**: `services/booking-service/src/services/notificationService.ts`

```typescript
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

export class NotificationService {
  constructor(
    private prisma: PrismaClient,
    private providers: {
      email: EmailProvider;
      sms: SMSProvider;
      push: PushProvider;
      inApp: InAppProvider;
    }
  ) {}

  async sendNotification(notification: NotificationPayload): Promise<void> {
    // Implementation based on tests:
    // - Multi-channel delivery
    // - Provider selection logic
    // - Retry scheduling
    // - State management
  }

  async handleWebhook(supplier: string, payload: any): Promise<void> {
    // Webhook processing logic
  }

  async trackNotification(id: string, status: string): Promise<void> {
    // Notification tracking
  }
}
```

**Test Reference**: `notificationService.integration.test.ts` (Lines 100+)

### 1.2 Implement API Endpoints

**File**: `services/booking-service/src/controllers/notificationController.ts`

```typescript
import express from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async createNotification(req: express.Request, res: express.Response) {
    // POST /api/notifications
    // Create and send notification
  }

  async getNotification(req: express.Request, res: express.Response) {
    // GET /api/notifications/:id
    // Retrieve notification details
  }

  async listNotifications(req: express.Request, res: express.Response) {
    // GET /api/notifications
    // List notifications with pagination
  }
}
```

**Test Reference**: `notificationAPI.integration.test.ts` (Lines 50+)

---

## Phase 2: Advanced Features Implementation

### 2.1 Scheduled Notifications with BullMQ

**File**: `services/booking-service/src/services/scheduledNotificationService.ts`

```typescript
import Bull from 'bull';
import { NotificationService } from './notificationService';

export class ScheduledNotificationService {
  private notificationQueue: Bull.Queue;
  private inMemoryScheduler: Map<string, NodeJS.Timeout>;

  constructor(notificationService: NotificationService) {
    this.notificationQueue = new Bull('notifications', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
    
    this.notificationQueue.process(async (job) => {
      // Process scheduled notification
      // Test reference: scheduledNotifications.test.ts (Lines 120+)
    });
  }

  async scheduleNotification(
    notification: NotificationPayload,
    delayMs: number
  ): Promise<string> {
    // Schedule using BullMQ with fallback to in-memory
    // Test reference: scheduledNotifications.test.ts (Lines 80+)
  }

  async cancelScheduledNotification(jobId: string): Promise<void> {
    // Cancel scheduled job
    // Test reference: scheduledNotifications.test.ts (Lines 160+)
  }

  async getJobStatus(jobId: string): Promise<string> {
    // Get job status
    // Return: 'scheduled' | 'processing' | 'completed' | 'failed'
  }
}
```

**Tests to Reference**:
- `scheduledNotifications.test.ts` - Lines 30-513
- Key features: Job creation, execution, cancellation, recurring patterns

---

### 2.2 Template Rendering Engine

**File**: `services/booking-service/src/services/templateService.ts`

```typescript
import Handlebars from 'handlebars';

export class TemplateService {
  // Register custom helpers
  registerHelpers() {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleDateString();
    });
  }

  async renderTemplate(
    template: string,
    variables: Record<string, any>,
    locale: string = 'en'
  ): Promise<string> {
    // Render template with variable substitution
    // Test reference: templateSubstitution.test.ts (Lines 45+)
    
    // Steps:
    // 1. Validate variables against schema
    // 2. Handle missing/optional variables
    // 3. Compile Handlebars template
    // 4. Escape output for XSS prevention
    // 5. Return rendered content
  }

  async validateTemplate(template: string): Promise<ValidationResult> {
    // Validate template syntax and variables
    // Test reference: templateSubstitution.test.ts (Lines 220+)
  }
}
```

**Tests to Reference**:
- `templateSubstitution.test.ts` - Lines 30-547
- Key features: Variable substitution, conditionals, loops, multi-language, XSS prevention

---

### 2.3 Webhook Processor for Schedule Changes

**File**: `services/booking-service/src/services/webhookService.ts`

```typescript
import crypto from 'crypto';

export class WebhookService {
  async processScheduleChangeWebhook(
    supplier: string,
    payload: any,
    signature: string
  ): Promise<void> {
    // Process webhook from supplier
    // Test reference: scheduleChangeDetection.test.ts
    
    // Steps:
    // 1. Verify webhook signature (HMAC-SHA256)
    // 2. Check for duplicates (idempotency)
    // 3. Parse change details
    // 4. Calculate urgency based on time to departure
    // 5. Trigger multi-channel notifications
    // 6. Track user actions
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return computed === signature;
  }

  async detectScheduleChanges(orders: any[]): Promise<ChangeEvent[]> {
    // Detect schedule changes in orders
    // Test reference: scheduleChangeDetection.test.ts (Lines 100+)
    
    // Return change events with:
    // - Change type (time, gate, aircraft, cancellation)
    // - Impact (urgency, connection risk, delay magnitude)
    // - Recommended actions
  }
}
```

**Tests to Reference**:
- `scheduleChangeDetection.test.ts` - Lines 30-593
- Key features: Webhook processing, urgency detection, multi-channel alerts, user tracking

---

### 2.4 Retry Mechanism with Dead Letter Queue

**File**: `services/booking-service/src/services/retryService.ts`

```typescript
export class RetryService {
  private circuitBreakers: Map<string, CircuitBreaker>;

  async scheduleRetry(
    notification: Notification,
    failureReason: string,
    attempt: number
  ): Promise<void> {
    // Schedule retry with exponential backoff
    // Test reference: notificationRetryMechanism.test.ts (Lines 50+)
    
    // Logic:
    // 1. Calculate backoff delay: baseDelay * (2 ^ attempt) + jitter
    // 2. Cap maximum delay (30s default)
    // 3. Schedule job using BullMQ
    // 4. Check retry limit for channel
    // 5. If max exceeded, move to DLQ
  }

  shouldRetry(failureReason: string): boolean {
    // Permanent failures: invalid_email, invalid_phone
    // Transient failures: timeout, rate_limit, provider_error
    // Return true for transient, false for permanent
  }

  async moveToDLQ(
    notification: Notification,
    reason: string
  ): Promise<void> {
    // Move notification to Dead Letter Queue
    // Test reference: notificationRetryMechanism.test.ts (Lines 177+)
  }

  async replayFromDLQ(
    dlqNotificationId: string,
    retry: boolean = true
  ): Promise<void> {
    // Replay notification from DLQ (max 3 replays)
    // Test reference: notificationRetryMechanism.test.ts (Lines 200+)
  }

  async checkCircuitBreakerStatus(provider: string): Promise<CircuitState> {
    // Check if circuit breaker is open for provider
    // Test reference: notificationRetryMechanism.test.ts (Lines 252+)
    
    // States: 'closed' (normal) | 'open' (all rejected) | 'half_open' (testing)
  }
}
```

**Tests to Reference**:
- `notificationRetryMechanism.test.ts` - Lines 30-563
- Key features: Exponential backoff, DLQ management, circuit breaker, selective retry

---

### 2.5 Analytics & Metrics Collection

**File**: `services/booking-service/src/services/analyticsService.ts`

```typescript
export class AnalyticsService {
  async recordNotificationDelivery(
    notification: Notification,
    result: 'success' | 'failure',
    channel: string,
    latency: number
  ): Promise<void> {
    // Record delivery metric
    // Store: success rate, latency, channel performance
    // Test reference: notificationAnalytics.test.ts (Lines 40+)
  }

  async getDeliveryRate(
    startDate: Date,
    endDate: Date
  ): Promise<{ successRate: number; total: number }> {
    // Calculate delivery success rate
    // Test reference: notificationAnalytics.test.ts (Lines 52+)
  }

  async getChannelPerformance(channel: string): Promise<ChannelMetrics> {
    // Get performance metrics for specific channel
    // Test reference: notificationAnalytics.test.ts (Lines 107+)
  }

  async getEngagementMetrics(channel: string): Promise<EngagementMetrics> {
    // Get engagement metrics (open rate, CTR, dismissal rate)
    // Test reference: notificationAnalytics.test.ts (Lines 197+)
  }

  async generateReport(
    type: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Promise<Report> {
    // Generate report
    // Test reference: notificationAnalytics.test.ts (Lines 440+)
  }
}
```

**Tests to Reference**:
- `notificationAnalytics.test.ts` - Lines 30-611
- Key features: Delivery metrics, channel performance, engagement tracking, reporting

---

### 2.6 Wallet Reconciliation Service

**File**: `services/booking-service/src/services/walletReconciliationService.ts`

```typescript
import cron from 'node-cron';

export class WalletReconciliationService {
  constructor(notificationService: NotificationService) {
    // Schedule daily reconciliation at 2 AM UTC
    cron.schedule('0 2 * * *', () => this.dailyReconciliation());
    
    // Schedule hourly FX updates
    cron.schedule('0 * * * *', () => this.updateFXRates());
  }

  async dailyReconciliation(): Promise<void> {
    // Test reference: walletReconciliation.test.ts (Lines 40+)
    
    // Steps:
    // 1. Fetch all wallet transactions
    // 2. Reconcile with supplier records
    // 3. Identify discrepancies
    // 4. Send notifications for discrepancies
    // 5. Log metrics
  }

  async updateFXRates(): Promise<void> {
    // Fetch FX rates and notify on significant changes (> 2%)
    // Test reference: walletReconciliation.test.ts (Lines 97+)
  }

  async checkLowBalance(wallet: Wallet): Promise<void> {
    // Check if balance is below threshold and send alert
    // Test reference: walletReconciliation.test.ts (Lines 162+)
    
    // Alert levels: warning < critical < urgent
  }

  async detectDiscrepancies(): Promise<Discrepancy[]> {
    // Detect wallet reconciliation discrepancies
    // Types: missing_transaction, duplicate_transaction, rounding_error
    // Test reference: walletReconciliation.test.ts (Lines 293+)
  }
}
```

**Tests to Reference**:
- `walletReconciliation.test.ts` - Lines 30-487
- Key features: Daily reconciliation, FX updates, low balance alerts, discrepancy detection

---

## Phase 3: Database Schema Setup

### 3.1 Create Notification Models in Prisma

**File**: `database/prisma/schema.prisma`

```prisma
model Notification {
  id            String   @id @default(cuid())
  orderId       String
  type          String   // 'order_confirmation', 'payment', 'refund', etc.
  channels      String[] // ['email', 'sms', 'push', 'in_app']
  content       Json
  status        String   // 'pending', 'sent', 'failed', 'dlq'
  createdAt     DateTime @default(now())
  deliveredAt   DateTime?
  failureReason String?
  retryCount    Int      @default(0)
  
  @@index([orderId])
  @@index([status])
}

model NotificationJob {
  id            String   @id @default(cuid())
  notificationId String
  jobId         String   // BullMQ job ID
  scheduledTime DateTime
  status        String   // 'scheduled', 'processing', 'completed', 'failed'
  createdAt     DateTime @default(now())
  
  @@index([notificationId])
  @@index([status])
}

model NotificationMetric {
  id            String   @id @default(cuid())
  channel       String
  date          DateTime
  sent          Int      @default(0)
  delivered     Int      @default(0)
  failed        Int      @default(0)
  openRate      Float?
  clickRate     Float?
  createdAt     DateTime @default(now())
  
  @@unique([channel, date])
}

model DeadLetterQueue {
  id            String   @id @default(cuid())
  notificationId String
  reason        String
  failureReason String
  payloadData   Json
  replayCount   Int      @default(0)
  createdAt     DateTime @default(now())
  
  @@index([notificationId])
}
```

### 3.2 Run Migrations

```bash
npm run db:migrate -- --name "add-notifications"
npm run db:generate
```

---

## Phase 4: Integration with Existing Services

### 4.1 Hook into Booking Service

When a booking is created/confirmed:
```typescript
// In booking controller
const notification = await notificationService.sendNotification({
  type: 'booking_confirmation',
  orderId: booking.id,
  channels: ['email', 'sms', 'push'],
  data: { bookingRef: booking.reference, customerEmail: booking.customerEmail }
});
```

### 4.2 Hook into Payment Service

When a payment is processed:
```typescript
// In payment controller
await notificationService.sendNotification({
  type: 'payment_confirmation',
  orderId: orderId,
  channels: ['email', 'in_app'],
  data: { amount, currency, paymentMethod }
});
```

### 4.3 Hook into Webhook Handlers

When receiving supplier webhooks:
```typescript
// In webhook handler
await webhookService.processScheduleChangeWebhook(
  'duffel',
  payload,
  signature
);
```

---

## Phase 5: Testing & Validation

### Run Test Suite

```bash
# Run all notification tests
npm test -- services/booking-service/tests/integration/*Notification*.test.ts

# Run specific test file
npm test -- services/booking-service/tests/integration/scheduledNotifications.test.ts

# Run with coverage
npm test -- --coverage services/booking-service/tests/integration
```

### Expected Results

- ✅ All core notification tests should pass
- ✅ API endpoint tests should validate request/response
- ✅ Scheduled job tests should verify timing
- ✅ Template tests should validate substitution and rendering
- ✅ Webhook tests should verify event processing
- ✅ Retry tests should validate backoff strategy
- ✅ Analytics tests should verify metrics collection

---

## Implementation Priority

### High Priority (Week 1)
1. Core notification service + email provider
2. Notification API endpoints
3. BullMQ scheduler setup
4. Template engine

### Medium Priority (Week 2)
5. SMS provider integration
6. Webhook processor
7. Retry mechanism

### Lower Priority (Week 3)
8. Push notifications
9. Analytics collection
10. Dead Letter Queue management
11. Wallet reconciliation job

---

## Configuration & Environment Variables

```env
# Providers
SENDGRID_API_KEY=sk_...
TWILIO_ACCOUNT_SID=AC_...
TWILIO_AUTH_TOKEN=...
FIREBASE_PROJECT_ID=...

# Redis & BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379

# Notification Service
NOTIFICATION_RETRY_MAX=5
NOTIFICATION_RETRY_DELAY_BASE=1000
NOTIFICATION_RETRY_DELAY_MAX=30000

# Analytics
ANALYTICS_RETENTION_MONTHS=12
ANALYTICS_BATCH_SIZE=1000

# Webhooks
DUFFEL_WEBHOOK_SECRET=...
INNSTANT_WEBHOOK_SECRET=...
HOTELSTON_WEBHOOK_SECRET=...
```

---

## Troubleshooting Guide

### Tests Failing: "Cannot connect to Redis"
**Solution**: Ensure Redis is running locally or set REDIS_HOST/REDIS_PORT correctly

### Tests Failing: "BullMQ queue timeout"
**Solution**: Increase timeout in test configuration or reduce job execution time

### TypeScript Errors in Tests
**Solution**: Run `npm run db:generate` to regenerate Prisma client types

### Template Rendering Issues
**Solution**: Verify variable names match template placeholders exactly

---

## Resources

- **Test Files**: `/services/booking-service/tests/integration/`
- **Handlebars Docs**: https://handlebarsjs.com/
- **BullMQ Docs**: https://docs.bullmq.io/
- **Prisma Docs**: https://www.prisma.io/docs/

---

**Generated**: February 9, 2026  
**Last Updated**: Comprehensive test implementation documentation
