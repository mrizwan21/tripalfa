# BullMQ Message Queuing - Quick Reference

## Overview

TripAlfa uses **BullMQ** (Redis-based job queue) for asynchronous task processing. This replaces direct API calls with reliable, queued job processing.

## Architecture

```
┌─────────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Producer Service  │────▶│   Redis Queue   │────▶│  Worker Service │
│  (booking-service)  │     │   (BullMQ)      │     │ (notification)  │
└─────────────────────┘     └─────────────────┘     └─────────────────┘
```

## Package Location

```
packages/shared-queue/
├── src/
│   ├── config.ts      # Redis connection & queue config
│   ├── queue.ts       # Queue manager & job functions
│   ├── worker.ts      # Base worker class
│   ├── jobs/
│   │   ├── types.ts   # Job payload interfaces
│   │   └── index.ts   # Exports
│   └── index.ts       # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

```env
# Redis connection for job queues
QUEUE_REDIS_URL="redis://localhost:6379"

# Fallback to general Redis URL
REDIS_URL="redis://localhost:6379"
```

## Quick Start

### 1. Queue an Email Job (Producer)

```typescript
import { addJob, QUEUE_NAMES, EmailJobPayload } from '@tripalfa/shared-queue';

const emailJob: EmailJobPayload = {
  to: 'user@example.com',
  subject: 'Booking Confirmed',
  templateId: 'booking-confirmation',
  templateData: {
    bookingId: 'BK-12345',
    confirmationCode: 'ABCXYZ',
  },
  priority: 'high',
};

await addJob(QUEUE_NAMES.EMAIL_QUEUE, 'send-email', emailJob);
```

### 2. Create a Worker (Consumer)

```typescript
import { createWorker, QUEUE_NAMES, EmailJobPayload, JobData } from '@tripalfa/shared-queue';

const worker = createWorker(
  QUEUE_NAMES.EMAIL_QUEUE,
  async job => {
    const { payload } = job.data;
    // Process the email
    await sendEmail(payload);
    return { success: true };
  },
  { concurrency: 5 }
);
```

### 3. Schedule Delayed Job

```typescript
import { scheduleJob, QUEUE_NAMES } from '@tripalfa/shared-queue';

// Send reminder in 24 hours
await scheduleJob(QUEUE_NAMES.EMAIL_QUEUE, 'send-reminder', reminderPayload, 24 * 60 * 60 * 1000);
```

### 4. Schedule Recurring Job

```typescript
import { scheduleRecurringJob, QUEUE_NAMES } from '@tripalfa/shared-queue';

// Daily at 2 AM
await scheduleRecurringJob(
  QUEUE_NAMES.SCHEDULED_TASKS,
  'daily-cleanup',
  cleanupPayload,
  '0 2 * * *'
);
```

## Available Queues

| Queue                  | Purpose              | Service              |
| ---------------------- | -------------------- | -------------------- |
| `EMAIL_QUEUE`          | Email notifications  | notification-service |
| `SMS_QUEUE`            | SMS notifications    | notification-service |
| `PUSH_QUEUE`           | Push notifications   | notification-service |
| `BOOKING_CONFIRMATION` | Booking confirmation | booking-service      |
| `BOOKING_CANCELLATION` | Booking cancellation | booking-service      |
| `BOOKING_REMINDER`     | Booking reminders    | booking-service      |
| `PAYMENT_PROCESSING`   | Payment processing   | payment-service      |
| `PAYMENT_WEBHOOK`      | Payment webhooks     | payment-service      |
| `SCHEDULED_TASKS`      | Scheduled tasks      | Any service          |
| `DATA_SYNC`            | Data synchronization | static-data          |

## Job Payload Types

### EmailJobPayload

```typescript
interface EmailJobPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: string | Buffer }>;
  priority?: 'high' | 'normal' | 'low';
}
```

### BookingConfirmationJobPayload

```typescript
interface BookingConfirmationJobPayload {
  bookingId: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  bookingDetails: {
    type: 'hotel' | 'flight' | 'package';
    name: string;
    startDate: string;
    endDate?: string;
    confirmationCode: string;
    amount: number;
    currency: string;
  };
  sendEmail: boolean;
  sendSms: boolean;
  sendPush: boolean;
}
```

### PaymentProcessingJobPayload

```typescript
interface PaymentProcessingJobPayload {
  paymentId: string;
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: {
    type: 'card' | 'wallet' | 'bank_transfer';
    id: string;
  };
  metadata?: Record<string, unknown>;
}
```

## Queue Management

```typescript
import {
  getQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  drainQueue,
  QUEUE_NAMES,
} from '@tripalfa/shared-queue';

// Get statistics
const stats = await getQueueStats(QUEUE_NAMES.EMAIL_QUEUE);
// { name: 'email-notifications', waiting: 5, active: 2, completed: 100, failed: 1 }

// Pause/Resume
await pauseQueue(QUEUE_NAMES.EMAIL_QUEUE);
await resumeQueue(QUEUE_NAMES.EMAIL_QUEUE);

// Clean old jobs
await cleanQueue(QUEUE_NAMES.EMAIL_QUEUE, 3600000); // 1 hour

// Drain all jobs
await drainQueue(QUEUE_NAMES.EMAIL_QUEUE);
```

## Error Handling

- **Automatic retries**: 3 attempts by default
- **Exponential backoff**: 1s → 2s → 4s
- **Failed jobs**: Kept for 7 days for debugging
- **Completed jobs**: Removed after 24 hours

## Service Integration

### booking-service

**Location**: `services/booking-service/src/queue/`

```typescript
import {
  queueBookingConfirmationEmail,
  queueBookingCancellationEmail,
  queueBookingReminderEmail,
} from './queue/index.js';

// Queue confirmation email
await queueBookingConfirmationEmail({
  bookingId: 'BK-12345',
  userId: 'user-123',
  userEmail: 'user@example.com',
  bookingDetails: {
    /* ... */
  },
  sendEmail: true,
  sendSms: false,
  sendPush: false,
});
```

### notification-service

**Location**: `services/notification-service/src/workers/`

The notification-service runs the email worker that processes jobs from the email queue.

```typescript
// In src/index.ts
import { startEmailWorker } from './workers/email.worker.js';

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  startEmailWorker();
  console.log(`📧 Email queue worker started`);
});
```

## Monitoring

### Check Queue Status

```bash
# Redis CLI
redis-cli

# Check queue keys
KEYS bull:*

# Get queue length
LLEN bull:email-notifications:wait

# Get job details
GET bull:email-notifications:job:<jobId>
```

### Application Logs

Queue events are automatically logged:

```
[INFO] Job added to queue { queue: "email-notifications", jobId: "123", jobName: "send-email" }
[INFO] Processing job { queue: "email-notifications", jobId: "123", attempt: 1 }
[INFO] Job processed successfully { queue: "email-notifications", jobId: "123", duration: 150 }
```

## Troubleshooting

### Jobs Not Processing

1. **Check Redis connection**

   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Verify worker is running**

   ```bash
   ps aux | grep notification-service
   ```

3. **Check queue is not paused**

   ```typescript
   const stats = await getQueueStats(QUEUE_NAMES.EMAIL_QUEUE);
   console.log('Paused:', stats.paused);
   ```

4. **Review error logs**
   ```bash
   tail -f logs/notification-service.log | grep ERROR
   ```

### High Memory Usage

```typescript
// Clean completed jobs older than 1 hour
await cleanQueue(QUEUE_NAMES.EMAIL_QUEUE, 3600000);

// Check queue stats
const stats = await getQueueStats(QUEUE_NAMES.EMAIL_QUEUE);
console.log('Completed jobs:', stats.completed);
```

### Rate Limiting

If hitting API rate limits, adjust worker configuration:

```typescript
const worker = createWorker(QUEUE_NAMES.EMAIL_QUEUE, processEmailJob, {
  limiter: {
    max: 50, // Reduce from 100
    duration: 60000,
  },
});
```

## Best Practices

1. **Use typed payloads** - Always use the provided TypeScript interfaces
2. **Set appropriate priorities** - High for critical emails, low for marketing
3. **Handle failures gracefully** - Jobs retry automatically, but log errors
4. **Monitor queue health** - Regularly check statistics
5. **Clean old jobs** - Prevent memory issues with periodic cleanup
6. **Use correlation IDs** - Track jobs across services
7. **Implement idempotency** - Handle duplicate job processing

## Further Reading

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [shared-queue Package README](../packages/shared-queue/README.md)
