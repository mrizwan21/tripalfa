# Notification System Integration Guide

## Overview

This guide explains how to integrate the notification system with the offline booking request workflow in TripAlfa. The notification system supports multi-channel delivery (email, SMS, push, in-app) with user preference management.

## Architecture

### Core Components

1. **NotificationService** (`services/notification-service/src/services/notificationService.ts`)
   - Orchestrates multi-channel notification delivery
   - Manages user preferences and channel selection
   - Handles email templating, SMS routing, and push subscriptions
   - Logs delivery status for each channel

2. **NotificationController** (`services/notification-service/src/controllers/notificationController.ts`)
   - HTTP API endpoints for notification management
   - User preference management endpoints
   - Push subscription lifecycle endpoints
   - Admin notification sending

3. **OfflineRequestWebhooks** (`services/notification-service/src/webhooks/offlineRequestWebhooks.ts`)
   - Webhook handlers for offline request status changes
   - Admin notification triggers
   - Bulk notification support

4. **Frontend Hooks** (`apps/booking-engine/src/hooks/useNotifications.ts`)
   - React Query-based data management
   - Real-time notification updates
   - WebSocket support for live delivery

5. **Frontend Components** (`apps/booking-engine/src/components/Notifications/`)
   - NotificationBell: Badge with unread count
   - NotificationCenter: Full notification management page
   - NotificationPreferences: User preference settings
   - NotificationToast: In-app toast notifications

## Integration Steps

### Step 1: Update Offline Request Service

In your offline request service (`services/booking-service/src/services/offlineRequestService.ts`), add webhook notifications:

```typescript
import { offlineRequestNotificationHandler } from '@tripalfa/notification-service';

export class OfflineRequestService {
  async updateRequestStatus(
    requestId: string,
    newStatus: OfflineRequestStatus,
    reviewNotes?: string
  ) {
    const request = await prisma.offlineRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    // Update the status
    const updated = await prisma.offlineRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
      include: { tripDetails: true },
    });

    // Trigger notification webhook
    const notificationPayload = {
      requestId,
      userId: request.userId,
      status: newStatus as OfflineRequestStatus,
      previousStatus: request.status,
      bookingId: request.bookingId,
      tripDetails: {
        destination: request.tripDetails?.destination,
        departureDate: request.tripDetails?.departureDate,
        returnDate: request.tripDetails?.returnDate,
        passengers: request.tripDetails?.passengers,
      },
      reviewNotes,
      actionUrl: `/bookings/requests/${requestId}`,
    };

    // Send notification asynchronously
    await offlineRequestNotificationHandler.handleStatusChange(notificationPayload);

    return updated;
  }

  async submitRequest(userId: string, requestData: CreateOfflineRequestDto) {
    const request = await prisma.offlineRequest.create({
      data: {
        userId,
        status: 'submitted',
        ...requestData,
      },
    });

    // Notify admins about new request
    await offlineRequestNotificationHandler.notifyAdminNewRequest(
      request.id,
      userId,
      {
        destination: requestData.destination,
        departureDate: requestData.departureDate,
        returnDate: requestData.returnDate,
        passengers: requestData.passengers,
      }
    );

    return request;
  }
}
```

### Step 2: Register Webhook Endpoint

In your API Gateway or notification service routes, register the webhook endpoint:

```typescript
// services/notification-service/src/routes/notificationRoutes.ts
import { offlineRequestWebhookMiddleware } from '../webhooks/offlineRequestWebhooks';

// Add to router
router.post('/webhooks/offline-request-status', offlineRequestWebhookMiddleware);
```

### Step 3: Add Frontend Components

#### Add NotificationBell to Header

```typescript
// apps/booking-engine/src/components/Layout/Header.tsx
import { NotificationBell } from '@/components/Notifications';

export const Header = () => {
  return (
    <header>
      {/* Other nav items */}
      <NotificationBell size="md" showBadge={true} />
    </header>
  );
};
```

#### Add NotificationToastContainer to App Layout

```typescript
// apps/booking-engine/src/App.tsx
import { NotificationToastContainer, useToast } from '@/components/Notifications';

export function App() {
  const { toasts, removeToast } = useToast();

  return (
    <div>
      {/* Your app content */}
      <NotificationToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
```

#### Add NotificationCenter Route

```typescript
// apps/booking-engine/src/routes.tsx
import { NotificationCenter } from '@/components/Notifications';

export const routes = [
  {
    path: '/notifications',
    element: <NotificationCenter />,
  },
  // ... other routes
];
```

#### Add NotificationPreferences Route

```typescript
// apps/booking-engine/src/routes.tsx
import { NotificationPreferences } from '@/components/Notifications';

export const routes = [
  {
    path: '/settings/notifications',
    element: <NotificationPreferences />,
  },
  // ... other routes
];
```

### Step 4: Configure Environment Variables

Create or update `.env` files with notification service credentials:

```bash
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@tripalfa.com
EMAIL_SECURE=false

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+1234567890

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_VAPID_PUBLIC_KEY=your-web-push-vapid-key

# Database (if using Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/tripalfa
```

### Step 5: Update Prisma Schema

Add notification models to your Prisma schema:

```prisma
// database/prisma/schema.prisma

model Notification {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type          String   // offline_request_update, price_alert, booking_reminder, approval_pending
  title         String
  message       String
  data          Json?    // Store arbitrary notification data
  channels      String[] @default(["email", "push", "in_app"])
  priority      String   @default("medium") // low, medium, high
  
  status        String   @default("pending") // pending, sent, failed
  actionUrl     String?
  
  readAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  logs          NotificationLog[]
  
  @@index([userId])
  @@index([createdAt])
  @@index([status])
}

model NotificationLog {
  id              String   @id @default(cuid())
  notificationId  String
  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  
  channel         String   // email, sms, push, in_app
  status          String   @default("pending") // pending, sent, delivered, failed, bounced
  error           String?
  
  sentAt          DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())
  
  @@index([notificationId])
  @@index([channel])
  @@index([status])
}

model NotificationPreference {
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  emailEnabled        Boolean  @default(true)
  smsEnabled          Boolean  @default(true)
  pushEnabled         Boolean  @default(true)
  
  offlineRequestUpdates Boolean @default(true)
  priceDropAlerts     Boolean  @default(true)
  bookingReminders    Boolean  @default(true)
  promotionalEmails   Boolean  @default(false)
  
  quietHoursStart     String?  // HH:mm format
  quietHoursEnd       String?  // HH:mm format
  timezone            String   @default("UTC")
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  endpoint  String   @unique
  auth      String
  p256dh    String
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([isActive])
}

// Add to User model:
model User {
  // ... existing fields
  
  notifications             Notification[]
  notificationPreferences   NotificationPreference?
  pushSubscriptions         PushSubscription[]
}
```

Run migrations:

```bash
npm run db:migrate -- --name add_notification_models
npm run db:generate
```

### Step 6: Set Up WebSocket Server (Optional for Real-time)

For real-time notifications, add WebSocket support to your API Gateway:

```typescript
// services/api-gateway/src/websocket/notificationSocket.ts
import { Server as SocketIOServer } from 'socket.io';
import { NotificationService } from '@tripalfa/notification-service';

export class NotificationSocketHandler {
  private io: SocketIOServer;
  private notificationService: NotificationService;
  private userConnections: Map<string, string[]> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.notificationService = new NotificationService();
  }

  initializeHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      // Track user connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, []);
      }
      this.userConnections.get(userId)!.push(socket.id);

      // Join user room
      socket.join(`user:${userId}`);

      console.log(`User ${userId} connected via socket ${socket.id}`);

      socket.on('disconnect', () => {
        const connections = this.userConnections.get(userId);
        if (connections) {
          const index = connections.indexOf(socket.id);
          if (index > -1) connections.splice(index, 1);
          if (connections.length === 0) {
            this.userConnections.delete(userId);
          }
        }
        console.log(`User ${userId} disconnected`);
      });
    });
  }

  /**
   * Broadcast notification to connected user
   */
  broadcastToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(notification: any) {
    this.io.emit('notification:new', notification);
  }
}
```

### Step 7: Update Offline Request Routes

Ensure offline request endpoints trigger notifications:

```typescript
// services/booking-service/src/routes/offlineRequestRoutes.ts
import { offlineRequestService } from '../services/offlineRequestService';

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  try {
    const updated = await offlineRequestService.updateRequestStatus(
      id,
      status,
      reviewNotes
    );

    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { userId, ...requestData } = req.body;

  try {
    const created = await offlineRequestService.submitRequest(userId, requestData);
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## API Endpoints Reference

### User Notifications

- `GET /api/notifications` - List user's notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/count/unread` - Get unread count

### User Preferences

- `GET /api/notifications/preferences` - Get preferences
- `PATCH /api/notifications/preferences` - Update preferences

### Push Subscriptions

- `POST /api/notifications/subscribe` - Register push subscription
- `DELETE /api/notifications/subscribe/:id` - Unregister push

### Admin

- `POST /api/notifications/send` - Send notification (admin only)

## Database Schema

### Notification Fields

- `id`: Unique identifier
- `userId`: User receiving the notification
- `type`: Notification type (offline_request_update, price_alert, etc.)
- `title`: Notification title
- `message`: Notification message
- `data`: JSON object with additional data
- `channels`: Array of delivery channels
- `priority`: Notification priority (low, medium, high)
- `status`: Delivery status (pending, sent, failed)
- `actionUrl`: URL for action button
- `readAt`: When user read the notification
- `createdAt`: When notification was created

### NotificationPreference Fields

- `emailEnabled`: Enable email notifications
- `smsEnabled`: Enable SMS notifications
- `pushEnabled`: Enable push notifications
- `offlineRequestUpdates`: Enable request status updates
- `priceDropAlerts`: Enable price alert notifications
- `bookingReminders`: Enable booking reminders
- `promotionalEmails`: Enable promotional emails
- `quietHoursStart`: Start time for quiet hours (HH:mm)
- `quietHoursEnd`: End time for quiet hours (HH:mm)
- `timezone`: User's timezone

## Testing

### Test Sending Notifications

```bash
# Using the admin endpoint
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "type": "offline_request_update",
    "title": "Test Notification",
    "message": "This is a test",
    "priority": "high",
    "channels": ["email", "push", "in_app"],
    "actionUrl": "/bookings/test"
  }'
```

### Test Webhook

```bash
curl -X POST http://localhost:3001/api/notifications/webhooks/offline-request-status \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req-123",
    "userId": "user-456",
    "status": "approved",
    "actionUrl": "/bookings/requests/req-123",
    "tripDetails": {
      "destination": "Dubai",
      "departureDate": "2024-06-01",
      "passengers": 2
    }
  }'
```

## Notification Triggers

The notification system triggers automatically for:

1. **Offline Request Submitted**
   - User receives confirmation
   - Admins notified to review

2. **Request Under Review**
   - User notified of status change

3. **Request Approved**
   - High priority notification to user
   - SMS and email sent

4. **Request Rejected**
   - High priority notification with reason
   - SMS and email sent

5. **Booking Completed**
   - Confirmation email and in-app notification

6. **Request Cancelled**
   - Status update notification

## Troubleshooting

### Emails Not Sending

1. Check SMTP configuration in `.env`
2. Verify email credentials are correct
3. Check `NotificationLog` table for error details
4. Enable "Less secure app access" if using Gmail

### SMS Not Sending

1. Verify Twilio credentials
2. Check user phone number is stored
3. Verify Twilio account has credits
4. Check `NotificationLog` for Twilio errors

### Push Notifications Not Working

1. Verify VAPID keys are configured
2. Check browser has notification permission
3. Verify Service Worker is registered
4. Check browser console for errors

### Notifications Not Appearing

1. Check user preferences are enabled for that channel
2. Verify user isn't in quiet hours
3. Check error logs in database
4. Verify network connectivity

## Best Practices

1. **Always include actionUrl** for notifications - helps users quickly access relevant content
2. **Use appropriate priority levels** - don't mark all as high
3. **Respect user preferences** - never send to disabled channels
4. **Test with yourself first** - verify all channels work
5. **Monitor notification logs** - track delivery failures
6. **Set reasonable quiet hours** - default to 22:00-08:00
7. **Include context in data field** - helps with analytics
8. **Handle failures gracefully** - don't break main workflow if notifications fail

## Future Enhancements

- [ ] Push notification rich content (images, buttons)
- [ ] Notification scheduling/delay
- [ ] A/B testing for notification content
- [ ] Delivery analytics dashboard
- [ ] Template system for common notifications
- [ ] Two-way SMS replies
- [ ] Telegram/Slack notifications
