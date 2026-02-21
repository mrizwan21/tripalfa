# @tripalfa/notifications - Integration Guide

This guide covers integrating the centralized notification management module into your services.

## Table of Contents

1. [Installation](#installation)
2. [Setup](#setup)
3. [Basic Integration](#basic-integration)
4. [Advanced Integration](#advanced-integration)
5. [API Integration](#api-integration)
6. [WebSocket Integration](#websocket-integration)
7. [Database Integration](#database-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Installation

### Step 1: Install the Package

```bash
npm install @tripalfa/notifications
```

### Step 2: Update Root Package.json

The package is already configured as a workspace. If not, add it to `package.json`:

```json
{
  "workspaces": [
    "packages/notifications",
    "..."
  ]
}
```

## Setup

### Environment Variables

Create a `.env` file with notification configuration:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@tripalfa.com
EMAIL_SECURE=true

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Frontend
FRONTEND_URL=https://app.tripalfa.com
```

## Basic Integration

### In Your Service

```typescript
// service.ts
import { initializeNotificationManager } from '@tripalfa/notifications';
import pino from 'pino';

const logger = pino();

export const notificationManager = initializeNotificationManager({
  logger,
  email: {
    from: process.env.EMAIL_FROM || 'noreply@tripalfa.com',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },
});

export default notificationManager;
```

### Sending Notifications

```typescript
import { notificationManager } from './notification.service';

// Send a notification
async function notifyBookingConfirmation(userId: string, bookingId: string) {
  try {
    const notificationId = await notificationManager.sendNotification({
      userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed successfully',
      channels: ['email', 'push', 'in_app'],
      priority: 'high',
      data: {
        bookingId,
        bookingReference: 'TR123456',
      },
      actionUrl: `/bookings/${bookingId}`,
    });

    console.log('Notification sent:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}
```

## Advanced Integration

### Register Custom Channels

```typescript
import { NotificationManager, BaseChannel } from '@tripalfa/notifications';
import pino from 'pino';

// Create custom channel
class SlackChannel extends BaseChannel {
  protected name = 'slack';
  private webhookUrl: string;

  constructor(webhookUrl: string, logger) {
    super(logger);
    this.webhookUrl = webhookUrl;
  }

  validateConfig(): boolean {
    return !!this.webhookUrl;
  }

  async send(notification) {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notification.title,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${notification.title}*\n${notification.message}`,
              },
            },
          ],
        }),
      });

      this.logSend(notification, true);
      return true;
    } catch (error) {
      this.logSend(notification, false, error);
      return false;
    }
  }
}

// Register custom channel
const manager = new NotificationManager(logger);
manager.registerChannel(
  new SlackChannel(process.env.SLACK_WEBHOOK_URL, logger)
);
```

## API Integration

### Express Setup

```typescript
import express from 'express';
import { 
  notificationManager,
  createAuthMiddleware,
  validateNotificationPayload,
  createErrorHandler,
  createRateLimitMiddleware,
} from '@tripalfa/notifications';
import pino from 'pino';

const app = express();
const logger = pino();

app.use(express.json());

// Apply middleware
app.use(
  '/api/notifications',
  createRateLimitMiddleware(100, 60000, logger)
);

// Routes
app.post(
  '/api/notifications',
  createAuthMiddleware(logger),
  validateNotificationPayload,
  async (req, res, next) => {
    try {
      const notificationId = await notificationManager.sendNotification(req.body);
      res.status(201).json({
        id: notificationId,
        message: 'Notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/notifications',
  createAuthMiddleware(logger),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationManager.getNotifications(
        userId,
        limit,
        offset
      );

      res.json({
        data: notifications,
        pagination: {
          limit,
          offset,
          hasMore: notifications.length === limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  '/api/notifications/:id/read',
  createAuthMiddleware(logger),
  async (req, res, next) => {
    try {
      await notificationManager.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/notifications/preferences',
  createAuthMiddleware(logger),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const preferences = await notificationManager.getPreferences(userId);
      res.json(preferences);
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  '/api/notifications/preferences',
  createAuthMiddleware(logger),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      await notificationManager.updatePreferences(userId, req.body);
      const updated = await notificationManager.getPreferences(userId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// Error handling
app.use(createErrorHandler(logger));

app.listen(3000, () => {
  console.log('Notification API running on port 3000');
});
```

## WebSocket Integration

### Socket.IO Setup

```typescript
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { notificationManager } from './notification.service';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  // Verify JWT and attach user
  try {
    const decoded = verifyJWT(token);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(error);
  }
});

// Connection handler
io.on('connection', (socket) => {
  const userId = socket.data.userId;

  console.log(`User ${userId} connected`);

  // Join user room
  socket.join(`user:${userId}`);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Broadcast notification to user
export function broadcastNotification(userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification:new', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

httpServer.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});
```

### Real-time Notification Broadcasting

```typescript
import { broadcastNotification } from './websocket.service';
import { notificationManager } from './notification.service';

async function createAndBroadcastNotification(userId: string, payload) {
  // Send notification via channels
  const notificationId = await notificationManager.sendNotification({
    userId,
    ...payload,
  });

  // Broadcast via WebSocket for real-time delivery
  broadcastNotification(userId, {
    id: notificationId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
  });
}
```

## Database Integration

### Prisma Schema

Add to your `schema.prisma`:

```prisma
model Notification {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type              String
  title             String
  message           String
  priority          String   @default("medium")
  status            String   @default("pending")
  data              Json?
  actionUrl         String?
  
  channels          String[]
  readAt            DateTime?
  sentAt            DateTime?
  deliveredAt       DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
  @@index([createdAt])
  @@fulltext([title, message])
}

model NotificationPreference {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  emailEnabled      Boolean  @default(true)
  smsEnabled        Boolean  @default(false)
  pushEnabled       Boolean  @default(true)
  offlineRequestUpdates Boolean @default(true)
  priceDropAlerts   Boolean  @default(true)
  bookingReminders  Boolean  @default(true)
  promotionalEmails Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PushSubscription {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  endpoint          String   @unique
  auth              String
  p256dh            String
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
}

model User {
  // ... existing fields
  notifications           Notification[]
  notificationPreference  NotificationPreference?
  pushSubscriptions       PushSubscription[]
}
```

### Database-backed Service

```typescript
import { PrismaClient } from '@prisma/client';
import { BaseNotificationService, Notification, NotificationPayload } from '@tripalfa/notifications';

export class PrismaNotificationService extends BaseNotificationService {
  constructor(
    private prisma: PrismaClient,
    logger
  ) {
    super(logger);
  }

  async sendNotification(payload: NotificationPayload): Promise<string> {
    this.validatePayload(payload);

    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        channels: payload.channels || ['in_app'],
        priority: payload.priority || 'medium',
        status: 'pending',
        data: payload.data,
        actionUrl: payload.actionUrl,
      },
    });

    return notification.id;
  }

  async getNotifications(userId: string, limit: number, offset: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });
  }

  // ... implement other methods
}
```

## Testing

### Unit Tests

```typescript
import { NotificationManager, NullChannel } from '@tripalfa/notifications';
import pino from 'pino';

describe('NotificationManager', () => {
  let manager;
  let logger;

  beforeEach(() => {
    logger = pino({ level: 'silent' });
    manager = new NotificationManager(logger);
    manager.registerChannel(new NullChannel(logger));
  });

  test('should send notification', async () => {
    const id = await manager.sendNotification({
      userId: 'test-user',
      type: 'booking_confirmed',
      title: 'Test',
      message: 'Test message',
    });

    expect(id).toBeDefined();
  });

  test('should track unread count', async () => {
    await manager.sendNotification({
      userId: 'test-user',
      type: 'booking_confirmed',
      title: 'Test',
      message: 'Test message',
    });

    const count = await manager.getUnreadCount('test-user');
    expect(count).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Issue: Email not sending

**Solution:** Verify SMTP credentials and firewall rules

```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

### Issue: SMS delivery fails

**Solution:** Check Twilio account balance and phone number format

```typescript
// Validate Twilio config
manager.registerChannel(new SMSChannel(config, logger));
const smsChannel = manager.getChannel('sms');
console.log('SMS Config Valid:', smsChannel.validateConfig());
```

### Issue: WebSocket authentication fails

**Solution:** Ensure JWT token is valid and passed correctly

```typescript
// Client-side
const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('auth-token'),
  },
});
```

### Issue: High memory usage

**Solution:** Implement persistence and clean up old notifications

```typescript
// Implement notification cleanup
setInterval(async () => {
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: threshold },
    },
  });
}, 24 * 60 * 60 * 1000); // Daily
```

## Support

For issues or questions:
1. Check the README.md
2. Review example code in `/examples`
3. Check test files in `/__tests__`
4. Contact: dev-team@tripalfa.com

---

**Last Updated:** February 12, 2026
