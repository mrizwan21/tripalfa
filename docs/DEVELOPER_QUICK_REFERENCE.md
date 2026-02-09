# Developer Quick Reference - Notification Management Implementation

## ⚡ Quick Lookup Guide for Implementation

This is a fast reference for developers implementing the notification management system.

---

## 🔧 Quick Setup (5 Minutes)

### Environment Variables
```bash
# Copy to .env.local
SENDGRID_API_KEY=sk_test_...
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
FIREBASE_PROJECT_ID=your-project-id

REDIS_HOST=localhost
REDIS_PORT=6379

NOTIFICATION_RETRY_MAX=5
NOTIFICATION_RETRY_DELAY_BASE=1000
NOTIFICATION_RETRY_DELAY_MAX=30000
```

### Install Dependencies
```bash
cd services/booking-service
npm install bullmq handlebars axios
npm install -D @types/node-cron
```

### Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or locally (macOS)
brew services start redis
```

---

## 📂 Test File Quick Map

| Test File | Purpose | Tests | Key Classes |
|-----------|---------|-------|------------|
| `scheduledNotifications.test.ts` | BullMQ job scheduling | 40+ | ScheduledNotificationService |
| `templateSubstitution.test.ts` | Template rendering | 50+ | TemplateService |
| `scheduleChangeDetection.test.ts` | Webhook processing | 55+ | WebhookService |
| `walletReconciliation.test.ts` | Daily reconciliation | 36+ | WalletReconciliationService |
| `notificationRetryMechanism.test.ts` | Retry logic | 45+ | RetryService |
| `notificationAnalytics.test.ts` | Metrics collection | 45+ | AnalyticsService |

---

## 🎯 Core Implementation Classes

### 1. NotificationService (Core)
```typescript
// Main notification delivery logic
async sendNotification(payload: NotificationPayload): Promise<string>
async getNotification(id: string): Promise<Notification>
async listNotifications(page: number, limit: number): Promise<PagedResult>
```

### 2. ScheduledNotificationService
```typescript
async scheduleNotification(notification, delayMs): Promise<string>
async cancelScheduledNotification(jobId: string): Promise<void>
async getJobStatus(jobId: string): Promise<string>
```

### 3. TemplateService
```typescript
async renderTemplate(template, variables, locale): Promise<string>
async validateTemplate(template: string): Promise<ValidationResult>
registerHelpers(): void
```

### 4. WebhookService
```typescript
async processScheduleChangeWebhook(supplier, payload, signature): Promise<void>
verifyWebhookSignature(payload, signature, secret): boolean
async detectScheduleChanges(orders): Promise<ChangeEvent[]>
```

### 5. RetryService
```typescript
async scheduleRetry(notification, failureReason, attempt): Promise<void>
shouldRetry(failureReason: string): boolean
async moveToDLQ(notification, reason): Promise<void>
async replayFromDLQ(dlqNotificationId): Promise<void>
```

### 6. AnalyticsService
```typescript
async recordNotificationDelivery(notification, result, channel, latency): Promise<void>
async getDeliveryRate(startDate, endDate): Promise<DeliveryMetrics>
async getChannelPerformance(channel): Promise<ChannelMetrics>
async generateReport(type, date): Promise<Report>
```

---

## 📝 Common Test Commands

### Run Tests
```bash
# All notification tests
npm test -- services/booking-service/tests/integration/*Notification*.test.ts

# Specific feature
npm test -- services/booking-service/tests/integration/scheduledNotifications.test.ts

# With coverage
npm test -- --coverage services/booking-service/tests/integration

# Watch mode
npm test -- --watch services/booking-service/tests/integration
```

### Validate Code
```bash
# ESLint
npx eslint services/booking-service/tests/integration/*.test.ts

# TypeScript
npx tsc --noEmit -p services/booking-service/tsconfig.json

# All checks
npm run lint && npm run build
```

---

## 🔌 API Endpoints Quick Reference

### Notifications
```
POST   /api/notifications               Create notification
GET    /api/notifications               List notifications
GET    /api/notifications/:id           Get notification
PATCH  /api/notifications/:id           Update status
```

### Scheduling
```
POST   /api/notifications/schedule      Schedule notification
GET    /api/notifications/jobs/:jobId   Get job status
DELETE /api/notifications/jobs/:jobId   Cancel job
```

### Templates
```
POST   /api/templates/render            Render template
POST   /api/templates/validate          Validate template
GET    /api/templates/variables         Get available variables
```

### Webhooks
```
POST   /api/webhooks/process            Process webhook
POST   /api/webhooks/schedule-change    Handle schedule change
GET    /api/webhooks/history            Get webhook history
```

### Retry & DLQ
```
POST   /api/notifications/:id/retry     Retry notification
GET    /api/notifications/dlq           Get DLQ notifications
POST   /api/notifications/dlq/:id/replay Replay from DLQ
```

### Analytics
```
GET    /api/notifications/analytics/delivery-rate
GET    /api/notifications/analytics/channel/:channel
GET    /api/notifications/analytics/latency
POST   /api/notifications/analytics/report/daily
```

### Wallet
```
POST   /api/wallet/reconciliation/execute
POST   /api/wallet/fx-rates/update
POST   /api/wallet/:walletId/low-balance-check
```

---

## 💡 Common Implementation Patterns

### Pattern 1: Multi-Channel Notification
```typescript
const channels = determinePriority(urgency);
for (const channel of channels) {
  try {
    await sendViaProvider(channel, message);
    recordSuccess(channel);
  } catch (error) {
    recordFailure(channel, error);
    scheduleRetry(channel);
  }
}
```

### Pattern 2: Scheduled Job with Fallback
```typescript
try {
  // Try BullMQ
  return await bullQueue.add(job, { delay });
} catch (err) {
  // Fallback to in-memory
  return scheduleInMemory(job, delay);
}
```

### Pattern 3: Template Rendering with Safety
```typescript
const compiled = Handlebars.compile(template);
const sanitized = escapeOutput(compiled(variables));
return sanitized;
```

### Pattern 4: Exponential Backoff with Jitter
```typescript
const backoff = baseDelay * Math.pow(2, attempt);
const jitter = backoff * Math.random() * 0.1;
const delay = Math.min(backoff + jitter, maxDelay);
```

### Pattern 5: Circuit Breaker State Machine
```typescript
if (failureRate > threshold) {
  state = 'open'; // Reject all requests
  scheduleProbe();
} else if (successRate > recoveryThreshold) {
  state = 'closed'; // Accept all requests
}
```

---

## 🧪 Test Execution Stages

### Stage 1: Unit Tests (Day 1-2)
- [ ] Run core notification tests
- [ ] Verify basic delivery logic
- [ ] Test provider integration

### Stage 2: Feature Tests (Day 2-3)
- [ ] Run scheduled notification tests
- [ ] Test template rendering
- [ ] Validate webhook processing

### Stage 3: Integration Tests (Day 4)
- [ ] Run end-to-end workflows
- [ ] Test multi-channel delivery
- [ ] Validate error handling

### Stage 4: Performance Tests (Day 5+)
- [ ] Run performance benchmarks
- [ ] Validate latency metrics
- [ ] Test scalability (100+ jobs)

---

## 🔍 Debugging Checklist

### When Tests Fail
1. Check test name: What exactly is it testing?
2. Check assertion: What value was expected vs actual?
3. Check setup: Are mocks/fixtures configured correctly?
4. Check dependencies: Is Redis running? Are APIs accessible?
5. Check logs: What error message is shown?

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot connect to Redis" | Start Redis: `docker run -d -p 6379:6379 redis:alpine` |
| "BullMQ queue timeout" | Increase timeout or check Redis connection |
| "Template render error" | Verify variable names match template placeholders |
| "Webhook signature invalid" | Check HMAC secret configuration |
| "Type errors in tests" | Run `npm run db:generate` to update Prisma types |
| "Module not found" | Run `npm install` in workspace |

---

## 📊 Implementation Progress Tracking

### Checklist for Phase 1 (Core Service)
```
Week 1:
  [ ] NotificationService class created
  [ ] Email provider (SendGrid) integrated
  [ ] Database models created
  [ ] API endpoints created
  [ ] Core notification tests passing (80%+)

Weekly Goals:
  [ ] Run tests daily
  [ ] Fix failing tests same day
  [ ] 100% core tests passing by Friday
```

### Checklist for Phase 2 (Advanced Features)
```
Week 2:
  [ ] ScheduledNotificationService with BullMQ
  [ ] TemplateService with Handlebars
  [ ] WebhookService for suppliers
  [ ] Advanced tests passing (70%+)

Week 3:
  [ ] RetryService with exponential backoff
  [ ] AnalyticsService with metrics
  [ ] WalletReconciliationService
  [ ] All advanced tests passing (90%+)
```

---

## 📚 Documentation Quick Links

| Link | Purpose |
|------|---------|
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Navigation hub |
| [NOTIFICATION_IMPLEMENTATION_GUIDE.md](NOTIFICATION_IMPLEMENTATION_GUIDE.md) | Full implementation guide |
| [NOTIFICATION_API_ENDPOINT_REFERENCE.md](NOTIFICATION_API_ENDPOINT_REFERENCE.md) | API documentation |
| [TEST_SUITE_VALIDATION_REPORT.md](TEST_SUITE_VALIDATION_REPORT.md) | Test coverage details |

---

## ⚙️ Configuration Quick Reference

### BullMQ Queue Setup
```typescript
const queue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
});

queue.process(async (job) => {
  await notificationService.deliverNotification(job.data);
});
```

### Handlebars Template Engine
```typescript
import Handlebars from 'handlebars';

Handlebars.registerHelper('formatDate', (date) => {
  return new Date(date).toLocaleDateString();
});

const template = Handlebars.compile(templateString);
const rendered = template(variables);
```

### Express Route Setup
```typescript
router.post('/notifications', async (req, res) => {
  const notification = await notificationService.sendNotification(req.body);
  res.json(notification);
});

router.get('/notifications/:id', async (req, res) => {
  const notification = await notificationService.getNotification(req.params.id);
  res.json(notification);
});
```

---

## 🚀 5-Minute Wins (Quick Tasks)

1. **Set up test environment** (5 min)
   ```bash
   npm install && npm run build
   ```

2. **Run first test file** (5 min)
   ```bash
   npm test -- services/booking-service/tests/integration/scheduledNotifications.test.ts
   ```

3. **Create NotificationService stub** (10 min)
   ```typescript
   export class NotificationService { }
   ```

4. **Create one API endpoint** (10 min)
   ```typescript
   router.post('/notifications', handler);
   ```

5. **Run test again and see error** (3 min)
   - This shows what needs implementing next

---

## 💻 Code Snippets

### Quick Notification Send
```typescript
const notification = new Notification({
  orderId: 'order-123',
  channels: ['email', 'sms'],
  content: {
    email: { subject: '...', body: '...' },
    sms: { message: '...' }
  }
});

const result = await notificationService.send(notification);
```

### Quick Template Render
```typescript
const rendered = await templateService.renderTemplate(
  'booking_confirmation',
  {
    customerName: 'John Doe',
    bookingRef: 'BK12345'
  },
  'en'
);
```

### Quick Retry Schedule
```typescript
if (notificationFailed) {
  await retryService.scheduleRetry(
    notification,
    'provider_timeout',
    1 // attempt number
  );
}
```

### Quick Analytics Query
```typescript
const metrics = await analyticsService.getDeliveryRate(
  new Date('2026-02-01'),
  new Date('2026-02-09')
);
console.log(`Success rate: ${metrics.successRate}%`);
```

---

## 🎯 Success Metrics

### Daily Checks
- [ ] Code compiles without errors
- [ ] Tests run without crashing
- [ ] One test scenario passing
- [ ] No regressions in passing tests

### Weekly Milestones
- [ ] 50+ tests passing
- [ ] Core service functional
- [ ] 3+ endpoints working
- [ ] Doc: Implementation 25% complete

### Monthly Goals
- [ ] All 611+ tests passing
- [ ] Full feature implementation
- [ ] Production deployment
- [ ] Team trained on system

---

## 📖 Additional Resources

### For Learning BullMQ
- Docs: https://docs.bullmq.io/
- Quick start: BullMQ Redis-based queue library
- Key concepts: Jobs, queues, producers, consumers

### For Learning Handlebars
- Docs: https://handlebarsjs.com/
- Helpers: Built-in {{#if}}, {{#each}}, etc.
- Escaping: Automatic HTML escaping for safety

### For Learning Prisma
- Docs: https://www.prisma.io/docs/
- Models: Define in schema.prisma
- Migrations: Use prisma migrate

### For Jest Testing
- Docs: https://jestjs.io/
- Assertions: expect(value).toBe(expected)
- Async: Use async/await in tests

---

**Last Updated**: February 9, 2026  
**Purpose**: Fast reference for implementation team  
**Format**: Copy & paste friendly code snippets

Use this guide while coding to quickly look up patterns, commands, and common tasks!
