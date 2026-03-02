# @tripalfa/notifications

Centralized notification management module for TripAlfa. A comprehensive, multi-channel notification system supporting Email, SMS, Push, and In-App notifications.

## Features

✅ **Multi-Channel Delivery**

- Email (Nodemailer)
- SMS (Twilio)
- Push Notifications (FCM/APNS)
- In-App Notifications (In-Memory Storage)

✅ **User Preferences**

- Configurable notification channels per user
- Preference persistence
- Smart channel selection based on user settings

✅ **Type Safety**

- Full TypeScript support
- Comprehensive type definitions
- Runtime validation

✅ **Error Handling**

- Circuit breaker pattern ready
- Graceful failure handling
- Detailed error logging

✅ **Monitoring**

- Built-in statistics and metrics
- Structured logging with Pino
- Event tracking

## Installation

```bash
npm install @tripalfa/notifications
```

## Quick Start

### Basic Usage

```typescript
import { initializeNotificationManager } from "@tripalfa/notifications";
import pino from "pino";

const logger = pino();

// Initialize with configuration
const notificationManager = initializeNotificationManager({
  logger,
  email: {
    from: "noreply@tripalfa.com",
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
});

// Send a notification
const notificationId = await notificationManager.sendNotification({
  userId: "user-123",
  type: "booking_confirmed",
  title: "Booking Confirmed",
  message: "Your booking has been confirmed",
  channels: ["email", "push", "in_app"],
  priority: "high",
  data: {
    bookingId: "booking-456",
  },
});

console.log("Notification sent:", notificationId);
```

### Advanced Usage with Express

```typescript
import express from "express";
import {
  NotificationManager,
  EmailChannel,
  createAuthMiddleware,
  validateNotificationPayload,
} from "@tripalfa/notifications";
import pino from "pino";

const app = express();
const logger = pino();
const notificationManager = new NotificationManager(logger);

// Register channels
notificationManager.registerChannel(new EmailChannel(emailConfig, logger));

// Setup routes
app.use(express.json());

app.post(
  "/api/notifications",
  createAuthMiddleware(logger),
  validateNotificationPayload,
  async (req, res) => {
    try {
      const notificationId = await notificationManager.sendNotification(
        req.body,
      );
      res.status(201).json({ id: notificationId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);
```

## API Reference

### NotificationManager

#### `sendNotification(payload: NotificationPayload): Promise<string>`

Sends a notification through configured channels.

```typescript
const notificationId = await manager.sendNotification({
  userId: "user-123",
  type: "booking_confirmed",
  title: "Booking Confirmed",
  message: "Your flight booking is confirmed",
  channels: ["email", "push", "in_app"],
  priority: "high",
  actionUrl: "/bookings/123",
});
```

#### `getNotifications(userId: string, limit: number, offset: number): Promise<Notification[]>`

Retrieves user's notifications with pagination.

```typescript
const notifications = await manager.getNotifications("user-123", 50, 0);
```

#### `markAsRead(notificationId: string): Promise<void>`

Marks a notification as read.

```typescript
await manager.markAsRead("notif-123");
```

#### `markAllAsRead(userId: string): Promise<void>`

Marks all user notifications as read.

```typescript
await manager.markAllAsRead("user-123");
```

#### `deleteNotification(notificationId: string): Promise<void>`

Deletes a notification.

```typescript
await manager.deleteNotification("notif-123");
```

#### `getUnreadCount(userId: string): Promise<number>`

Gets the count of unread notifications.

```typescript
const count = await manager.getUnreadCount("user-123");
```

#### `getPreferences(userId: string): Promise<NotificationPreferences>`

Retrieves user's notification preferences.

```typescript
const prefs = await manager.getPreferences("user-123");
```

#### `updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<void>`

Updates user's notification preferences.

```typescript
await manager.updatePreferences("user-123", {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
});
```

#### `registerChannel(channel: NotificationChannel): void`

Registers a notification channel.

```typescript
manager.registerChannel(new EmailChannel(config, logger));
manager.registerChannel(new SMSChannel(config, logger));
```

#### `getStats(): NotificationStats`

Returns notification system statistics.

```typescript
const stats = manager.getStats();
// {
//   totalNotifications: 1250,
//   sentNotifications: 1200,
//   failedNotifications: 50,
//   readNotifications: 800,
//   failureRate: 4.0,
//   registeredChannels: 4
// }
```

## Notification Types

```typescript
type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_received"
  | "payment_reminder"
  | "agent_assigned"
  | "booking_reminder"
  | "price_alert"
  | "itinerary_change"
  | "amendment"
  | "ssr_update"
  | "system";
```

## Channels

### EmailChannel

Sends emails via SMTP.

```typescript
import { EmailChannel } from "@tripalfa/notifications";

const emailChannel = new EmailChannel(
  {
    from: "noreply@example.com",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-password",
    },
  },
  logger,
);

manager.registerChannel(emailChannel);
```

### SMSChannel

Sends SMS via Twilio.

```typescript
import { SMSChannel } from "@tripalfa/notifications";

const smsChannel = new SMSChannel(
  {
    accountSid: "AC...",
    authToken: "...",
    fromNumber: "+1234567890",
  },
  logger,
);

manager.registerChannel(smsChannel);
```

### PushNotificationChannel

Sends push notifications via FCM or APNS.

```typescript
import { PushNotificationChannel } from "@tripalfa/notifications";

const pushChannel = new PushNotificationChannel(
  {
    fcmServerKey: "AIza...",
    // or
    apnsCert: "...",
    apnsKey: "...",
  },
  logger,
);

manager.registerChannel(pushChannel);
```

### InAppNotificationChannel

Stores notifications for in-app display.

```typescript
import { InAppNotificationChannel } from "@tripalfa/notifications";

const inAppChannel = new InAppNotificationChannel(logger);
manager.registerChannel(inAppChannel);
```

## Middleware

### Authentication Middleware

```typescript
import { createAuthMiddleware } from "@tripalfa/notifications";

app.use("/api/notifications", createAuthMiddleware(logger));
```

### Authorization Middleware

```typescript
import { createAuthorizationMiddleware } from "@tripalfa/notifications";

app.use(
  "/api/notifications/admin",
  createAuthorizationMiddleware(["admin", "staff"], logger),
);
```

### Validation Middleware

```typescript
import { validateNotificationPayload } from "@tripalfa/notifications";

app.post("/api/notifications", validateNotificationPayload, handler);
```

### Rate Limiting Middleware

```typescript
import { createRateLimitMiddleware } from "@tripalfa/notifications";

app.use("/api/notifications", createRateLimitMiddleware(100, 60000, logger));
```

### Error Handler

```typescript
import { createErrorHandler } from "@tripalfa/notifications";

app.use(createErrorHandler(logger));
```

## Logging

### Initialize Logger

```typescript
import { createLogger } from "@tripalfa/notifications";

const logger = createLogger({
  level: "info",
  serviceName: "notifications",
});
```

### Child Logger

```typescript
const childLogger = createChildLogger(logger, { userId: "user-123" });
```

## Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@tripalfa.com
EMAIL_SECURE=true

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://app.tripalfa.com
```

## Testing

```typescript
import { NotificationManager, NullChannel } from "@tripalfa/notifications";
import pino from "pino";

const logger = pino();
const manager = new NotificationManager(logger);

// Use NullChannel for testing (always succeeds silently)
manager.registerChannel(new NullChannel(logger));

const notificationId = await manager.sendNotification({
  userId: "test-user",
  type: "booking_confirmed",
  title: "Test",
  message: "Test notification",
  channels: ["in_app"],
});
```

## Error Handling

The module includes custom error classes:

```typescript
import {
  NotificationError,
  ChannelError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "@tripalfa/notifications";

try {
  await manager.sendNotification(payload);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ChannelError) {
    // Handle channel-specific error
  } else if (error instanceof NotificationError) {
    // Handle general notification error
  }
}
```

## Monitoring

Monitor notification system statistics:

```typescript
setInterval(() => {
  const stats = manager.getStats();
  console.log("Notification Stats:", stats);
  // {
  //   totalNotifications: 1250,
  //   sentNotifications: 1200,
  //   failedNotifications: 50,
  //   readNotifications: 800,
  //   failureRate: 4.0,
  //   registeredChannels: 4
  // }
}, 60000);
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         NotificationManager (Orchestrator)      │
└────────────────────────┬────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐  ┌──────▼──────┐  ┌────▼────┐
    │  Email  │  │     SMS     │  │  Push   │
    │ Channel │  │  Channel    │  │ Channel │
    └─────────┘  └─────────────┘  └─────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
    ┌────────────────────▼────────────────────┐
    │      In-App Notification Storage        │
    │         (Always Included)                │
    └─────────────────────────────────────────┘
```

## Best Practices

1. **Use Environment Variables** - Store sensitive configuration in environment variables
2. **Handle Errors Gracefully** - Implement fallback channels when primary fails
3. **Monitor Statistics** - Track notification system health
4. **Validate Input** - Use provided middleware to validate payloads
5. **Log Appropriately** - Use structured logging for debugging
6. **Rate Limit Requests** - Prevent abuse with rate limiting middleware
7. **Update Preferences** - Respect user notification preferences

## Performance Tips

1. **Async Processing** - Notifications are processed concurrently
2. **Channel Batching** - Multiple channels are contacted in parallel
3. **Memory Efficient** - In-app notifications limited to last 100 per user
4. **Caching Ready** - Designed to work with Redis for distributed systems

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/notification-feature`)
3. Commit changes (`git commit -am 'Add notification feature'`)
4. Push to branch (`git push origin feature/notification-feature`)
5. Submit a Pull Request

## License

MIT

## Support

For issues, questions, or contributions, contact: dev-team@tripalfa.com

## Changelog

### v1.0.0 (2026-02-12)

- Initial release
- Multi-channel notification support
- User preferences management
- WebSocket real-time delivery
- Comprehensive TypeScript types
- Error handling and logging

---

**@tripalfa/notifications v1.0.0** - Centralized notification management for TripAlfa
