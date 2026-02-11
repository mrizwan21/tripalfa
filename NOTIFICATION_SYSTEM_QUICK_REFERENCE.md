# Notification System Quick Reference

## For Frontend Developers

### Import Components

```typescript
import {
  NotificationBell,
  NotificationCenter,
  NotificationPreferences,
  useToast,
  NotificationToastContainer,
} from '@/components/Notifications';
```

### Use in Header

```typescript
export const Header = () => {
  return (
    <header className="flex items-center justify-between p-4">
      {/* Other content */}
      <NotificationBell size="md" showBadge={true} />
    </header>
  );
};
```

### Use Toast Notifications

```typescript
const { showToast, toasts, removeToast } = useToast();

// Show success message
showToast('Booking created successfully!', 'success', 3000);

// Show error message
showToast('Failed to update preference', 'error', 5000);

// Show with action
showToast('Notification sent', 'info', 4000, {
  label: 'View',
  onClick: () => window.location.href = '/notifications',
});

// Render container
<NotificationToastContainer toasts={toasts} onClose={removeToast} />
```

### Use Notification Hooks

```typescript
import { useNotifications, useNotificationPreferences } from '@/hooks/useNotifications';

// Get user's notifications
const { notifications, isLoading, error, markAsRead, deleteNotification } = useNotifications(20);

// Get/update preferences
const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

// Update preferences
await updatePreferences({
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  offlineRequestUpdates: true,
});

// Mark notification as read
await markAsRead('notification-id');

// Delete notification
await deleteNotification('notification-id');
```

### Add Routes

```typescript
// In your router config
import { NotificationCenter, NotificationPreferences } from '@/components/Notifications';

const routes = [
  { path: '/notifications', element: <NotificationCenter /> },
  { path: '/settings/notifications', element: <NotificationPreferences /> },
];
```

## For Backend Developers

### Send Notification (Node.js)

```typescript
import { NotificationService } from '@tripalfa/notification-service';

const notificationService = new NotificationService();

// Send to single user
await notificationService.sendNotification({
  userId: 'user-123',
  type: 'offline_request_update',
  title: 'Your Request Was Approved',
  message: 'Your booking request for Dubai has been approved!',
  priority: 'high',
  channels: ['email', 'sms', 'push', 'in_app'],
  actionUrl: '/bookings/requests/req-456',
  data: {
    requestId: 'req-456',
    bookingId: 'book-789',
    destination: 'Dubai',
  },
});
```

### Handle Offline Request Status Change

```typescript
import { offlineRequestNotificationHandler } from '@tripalfa/notification-service';

// When request status changes
await offlineRequestNotificationHandler.handleStatusChange({
  requestId: 'req-123',
  userId: 'user-456',
  status: 'approved', // pending_submission, submitted, under_review, approved, rejected, completed, cancelled
  tripDetails: {
    destination: 'Dubai',
    departureDate: '2024-06-01',
    returnDate: '2024-06-07',
    passengers: 2,
  },
  actionUrl: '/bookings/requests/req-123',
  reviewNotes: 'Approved for travel',
});
```

### Notify Admins

```typescript
// When a new request is submitted
await offlineRequestNotificationHandler.notifyAdminNewRequest(
  'req-123',
  'user-456',
  {
    destination: 'Dubai',
    departureDate: '2024-06-01',
    passengers: 2,
  }
);
```

### Send Bulk Notifications

```typescript
// Send same notification to multiple users
await offlineRequestNotificationHandler.sendBulkNotification(
  ['user-1', 'user-2', 'user-3'],
  'price_alert',
  'Price Drop Alert',
  'Prices have dropped for your saved search!',
  'high',
  '/search?id=search-123'
);
```

### Webhook Integration

```typescript
// In your Express server
import { offlineRequestWebhookMiddleware } from '@tripalfa/notification-service';

app.post('/webhooks/offline-request-status', offlineRequestWebhookMiddleware);

// Or manually call handler
import { offlineRequestNotificationHandler } from '@tripalfa/notification-service';

const result = await offlineRequestNotificationHandler.handleStatusChange({
  requestId: req.body.requestId,
  userId: req.body.userId,
  status: req.body.status,
  actionUrl: req.body.actionUrl,
  tripDetails: req.body.tripDetails,
  reviewNotes: req.body.reviewNotes,
});
```

## Environment Variables

```bash
# SMTP Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@tripalfa.com
EMAIL_SECURE=false

# Twilio SMS
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM_NUMBER=+1234567890

# Frontend
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_VAPID_PUBLIC_KEY=your-key
```

## API Endpoints

### Base URL: `http://localhost:3001/api/notifications`

**Auth Required:** All endpoints except `/health`

#### Notifications
- `GET /` - List notifications (pagination: limit, offset)
- `PATCH /:id/read` - Mark as read
- `PATCH /read-all` - Mark all as read
- `DELETE /:id` - Delete
- `GET /count/unread` - Get unread count

#### Preferences
- `GET /preferences` - Fetch preferences
- `PATCH /preferences` - Update preferences

#### Push Subscriptions
- `POST /subscribe` - Register push endpoint
- `DELETE /subscribe/:id` - Unregister

#### Admin
- `POST /send` - Send notification (admin only)

#### Health
- `GET /health` - Service status (no auth)

## Common Patterns

### Show Inline Toast After Action

```typescript
const { showToast } = useToast();

const handleApproveRequest = async (requestId: string) => {
  try {
    await approveOfflineRequest(requestId);
    showToast('Request approved successfully', 'success', 3000);
  } catch (error) {
    showToast('Failed to approve request', 'error', 5000);
  }
};
```

### Fetch and Display with Real-time Updates

```typescript
import { useRealtimeNotifications } from '@/hooks/useNotifications';

export const NotificationFeed = () => {
  const { notifications } = useNotifications(10);
  const { isConnected, lastNotification } = useRealtimeNotifications();

  useEffect(() => {
    if (lastNotification) {
      showToast(`New: ${lastNotification.title}`, 'info', 3000);
    }
  }, [lastNotification]);

  return (
    <>
      {!isConnected && <p>Connecting to updates...</p>}
      {notifications.map(n => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </>
  );
};
```

### Link to Preferences from Settings Page

```typescript
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Settings</h1>
      <Button onClick={() => navigate('/settings/notifications')}>
        <Settings className="mr-2 w-4 h-4" />
        Notification Preferences
      </Button>
    </div>
  );
};
```

## Channel Behavior

### Email
- Used for: Updates, confirmations, marketing
- Default timing: Immediate (respects quiet hours)
- Retry: 3 attempts over 24 hours

### SMS
- Used for: Urgent, time-sensitive updates
- Default timing: Immediate (always sent, even in quiet hours for high priority)
- Characters: Automatic multi-part for messages > 160 chars

### Push
- Used for: Real-time alerts, status changes
- Default timing: Immediate
- Requires: User permission granted

### In-app
- Used for: All notifications
- Default timing: Instant
- Persisted: Until user deletes

## Notification Types

- `offline_request_update` - Status changes on booking requests
- `price_alert` - Price changes on saved searches
- `booking_reminder` - Departure and check-in reminders
- `approval_pending` - Approvals waiting for action (admin only)

## Priority Levels

- `low` - Non-urgent (email, in-app only)
- `medium` - Standard (email, push, in-app)
- `high` - Urgent (all channels, bypasses quiet hours for SMS)

## Troubleshooting

### Notifications not appearing?
1. Check user has enabled channel in preferences
2. Verify user isn't in quiet hours
3. Check browser notifications permission
4. Check network tab for API errors

### Emails not sending?
1. Verify SMTP credentials in `.env`
2. Check `NotificationLog` for error message
3. Try from Gmail directly with app password
4. Check spam folder

### No TypeScript errors?
1. Run `npm run build` in notification service
2. Update imports if files moved

### WebSocket not connecting?
1. Verify `REACT_APP_WS_URL` is correct
2. Check server has Socket.IO enabled
3. Check browser console for connection errors
4. Verify user is authenticated
