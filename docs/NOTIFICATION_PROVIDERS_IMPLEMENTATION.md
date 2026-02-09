# Notification Providers Implementation Guide

## Overview

The notification system implements a multi-channel provider architecture supporting:
- **Email** (SendGrid)
- **SMS** (Twilio)
- **Push Notifications** (Firebase)
- **In-App Notifications** (Database-backed)

## Architecture

### Provider Factory Pattern

The `ProviderFactory` class manages all notification providers and handles their lifecycle:

```typescript
const factory = ProviderFactory.createFromEnvironment();
const emailProvider = factory.getProvider('email');
```

**Benefits**:
- Centralized configuration management
- Easy provider swapping for testing
- Mock mode support for development
- Health checks and status reporting

### Provider Interface

All providers implement a consistent interface:

```typescript
interface Provider {
  send(recipient: string, content: Content): Promise<ProviderResponse>;
  isConfigured(): boolean;
}
```

## Detailed Provider Implementation

### 1. Email Provider (SendGrid)

**Configuration**:
- API Key: `SENDGRID_API_KEY`
- From Email: `SENDGRID_FROM_EMAIL` (default: noreply@tripalfa.com)

**Features**:
- Single and bulk email sending
- HTML and plain text support
- Reply-to address support
- CC/BCC support
- Email validation
- Metadata tracking

**Usage**:
```typescript
const emailProvider = new EmailProvider(apiKey, fromEmail);
const result = await emailProvider.send('user@example.com', {
  subject: 'Booking Confirmation',
  body: 'Your booking has been confirmed',
  htmlBody: '<p>Your booking has been confirmed</p>',
  replyTo: 'support@tripalfa.com'
});
```

**Content Validation**:
- Subject required
- Body required
- Valid email format for recipient and reply-to
- Supports HTML templates

**Error Handling**:
- Invalid email format detection
- Network error handling
- Rate limiting (via SendGrid API)

### 2. SMS Provider (Twilio)

**Configuration**:
- Account SID: `TWILIO_ACCOUNT_SID`
- Auth Token: `TWILIO_AUTH_TOKEN`
- Phone Number: `TWILIO_PHONE_NUMBER`

**Features**:
- Single and bulk SMS sending
- Message length validation (160 characters)
- Long message splitting with concatenation
- Phone number validation
- Media attachment support (placeholders)
- Metadata tracking

**Usage**:
```typescript
const smsProvider = new SMSProvider(accountSid, authToken, phoneNumber);
const result = await smsProvider.send('+1234567890', {
  message: 'Your OTP is: 123456'
});
```

**Content Validation**:
- Message required
- Maximum 160 characters
- Valid phone number format (10+ digits)
- Automatic long message splitting

**Message Splitting Algorithm**:
- Max single SMS: 160 characters
- Max concatenated SMS: 153 characters (header overhead)
- Format: `(1/3) message content...`
- Handles multi-part messages transparently

**Error Handling**:
- Invalid phone number detection
- Message length validation
- Network error handling

### 3. Push Notification Provider (Firebase)

**Configuration**:
- Project ID: `FIREBASE_PROJECT_ID`
- Private Key ID: `FIREBASE_PRIVATE_KEY_ID`
- Private Key: `FIREBASE_PRIVATE_KEY`
- Client Email: `FIREBASE_CLIENT_EMAIL`

**Features**:
- Single device push notifications
- Multicast to multiple devices
- Topic-based broadcasting
- Topic subscription management
- Data payload support
- Custom icons and images
- Deep linking support
- Sound and badge support

**Usage**:
```typescript
const pushProvider = new PushProvider(projectId, privateKeyId, privateKey, clientEmail);

// Send to single device
const result = await pushProvider.send(deviceToken, {
  title: 'New Booking',
  body: 'Your booking is ready',
  data: { bookingId: '12345' }
});

// Send to multiple devices
await pushProvider.sendMulticast(deviceTokens, {
  title: 'Promotion',
  body: 'Special offers available now'
});

// Send to topic subscribers
await pushProvider.sendToTopic('booking-updates', {
  title: 'System Update',
  body: 'Booking system updated'
});

// Subscribe to topic
await pushProvider.subscribeToTopic(deviceToken, 'booking-updates');
```

**Content Validation**:
- Title required, max 200 characters
- Body required, max 4000 characters
- Valid device token format (50+ characters)
- Valid topic name (alphanumeric, hyphens, underscores, colons)

**Error Handling**:
- Invalid device token detection
- Content size validation
- Network error handling
- Topic validation

### 4. In-App Provider

**Configuration**:
- Database Client (optional)
- WebSocket Manager (optional)
- No external credentials needed

**Features**:
- Database-backed notification storage
- Real-time WebSocket delivery
- User notification inbox
- Read status tracking
- Segment/cohort targeting
- Priority levels
- Action URLs and labels

**Usage**:
```typescript
const inAppProvider = new InAppProvider(dbClient, wsManager);

// Send to single user
const result = await inAppProvider.send('user-123', {
  title: 'Welcome',
  message: 'Welcome to TripAlfa',
  actionUrl: '/dashboard',
  priority: 'high'
});

// Send to multiple users
await inAppProvider.sendToMany(userIds, {
  title: 'Promo',
  message: 'Check out our latest deals'
});

// Send to user segment
await inAppProvider.sendToSegment('premium-users', {
  title: 'Exclusive Offer',
  message: 'Premium members save 20%'
});

// Get notifications
const notifications = await inAppProvider.getNotifications('user-123', {
  limit: 20,
  offset: 0,
  unreadOnly: true
});

// Mark as read
await inAppProvider.markAsRead(notificationId, 'user-123');
```

**Content Validation**:
- Title required, max 200 characters
- Message required, max 2000 characters
- Action URL must be valid URL format
- Priority: low, medium, high

**Storage Models** (Prisma):
- Persists notifications in database
- Tracks read status
- Maintains audit trail
- Supports soft deletes

## Integration with NotificationService

The `NotificationService` uses `ProviderFactory` to deliver notifications:

```typescript
import { ProviderFactory } from './providers/ProviderFactory';
import { NotificationService } from './NotificationService';

// Initialize with factory
const factory = ProviderFactory.createFromEnvironment();
const notificationService = new NotificationService(prisma, factory);

// Send multi-channel notification
await notificationService.sendNotification({
  userId: 'user-123',
  userEmail: 'user@example.com',
  userPhone: '+1234567890',
  notificationType: 'booking-confirmation',
  channels: ['email', 'sms', 'push', 'in_app'],
  content: {
    email: {
      subject: 'Booking Confirmed',
      body: 'Your booking is confirmed'
    },
    sms: {
      message: 'Booking confirmed. Ref: #12345'
    },
    push: {
      title: 'Booking Confirmed',
      body: 'Your booking is ready'
    },
    in_app: {
      title: 'Booking Confirmed',
      message: 'Your booking is ready',
      actionUrl: '/booking/12345'
    }
  }
});
```

**Delivery Flow**:
1. Service validates payload
2. Creates notification record in database
3. Spawns async delivery tasks (one per channel)
4. Returns immediately (fire-and-forget)
5. Updates channel status as delivery progresses
6. Handles failures gracefully

## Testing

All providers have comprehensive tests:

```bash
# Run provider tests
npm test -- notificationProviders.integration.test.ts

# Run in mock mode (default for testing)
NODE_ENV=test npm test

# Coverage
npm test -- --coverage
```

### Test Suite Coverage

**Email Provider**:
- ✅ Single email sending
- ✅ Bulk email sending
- ✅ Email validation
- ✅ HTML body support
- ✅ Reply-to addressing
- ✅ Configuration validation

**SMS Provider**:
- ✅ Single SMS sending
- ✅ Bulk SMS sending
- ✅ Phone number validation
- ✅ Message length validation
- ✅ Long message splitting
- ✅ Multi-part message handling

**Push Provider**:
- ✅ Single device sending
- ✅ Multicast sending
- ✅ Topic broadcasting
- ✅ Topic subscription
- ✅ Device token validation
- ✅ Content size validation

**In-App Provider**:
- ✅ Single user notification
- ✅ Bulk user notification
- ✅ Segment targeting
- ✅ Notification retrieval
- ✅ Read status tracking
- ✅ Deletion support

**Factory Pattern**:
- ✅ Provider initialization
- ✅ Provider selection
- ✅ Health checks
- ✅ Environment configuration
- ✅ Mock mode toggling

## Error Handling Strategy

### Graceful Degradation
When a channel fails:
1. Status updated to 'failed' in database
2. Error logged for debugging
3. Other channels continue processing
4. Notification marked as partially delivered

### Retry Logic
- Failed channels: Handled by RetryService (future implementation)
- Dead Letter Queue: Captured in DeadLetterQueue model
- Circuit Breaker: Prevents cascading failures

### Validation
- **Pre-send**: Payload and content validation
- **Channel-specific**: Email format, SMS length, device tokens
- **Post-send**: Status tracking and updates

## Environment Configuration

### Development / Testing
```bash
# Mock mode (no external API calls)
NODE_ENV=development
MOCK_PROVIDERS=true
```

### Production
```bash
# SendGrid
SENDGRID_API_KEY=sg-xxxxx
SENDGRID_FROM_EMAIL=noreply@tripalfa.com

# Twilio
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=token_xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Firebase
FIREBASE_PROJECT_ID=project_xxxxx
FIREBASE_PRIVATE_KEY_ID=key_xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com
```

## Performance Considerations

### Async Delivery
- All channel deliveries run in parallel
- Non-blocking: Returns immediately to user
- Status updates asynchronously
- Scales horizontally with queue system

### Concurrency
- Up to N concurrent deliveries per notification
- Bulk operations use Promise.allSettled() for resilience
- Failure in one channel doesn't block others

### Optimization Tips
1. Use mock mode in development
2. Implement connection pooling for APIs
3. Cache provider credentials
4. Monitor error rates per channel
5. Set up alerts for critical failures

## Future Enhancements

### Phase 2
- [ ] Real SendGrid integration
- [ ] Real Twilio integration
- [ ] Real Firebase integration
- [ ] Database connection pooling
- [ ] Provider health metrics

### Phase 3
- [ ] Scheduled notifications (BullMQ)
- [ ] Template rendering (Handlebars)
- [ ] Webhook event processing
- [ ] Retry mechanism (RetryService)
- [ ] Analytics collection (AnalyticsService)

### Phase 4
- [ ] Preference management
- [ ] Unsubscribe handling
- [ ] Rate limiting per user
- [ ] Wallet reconciliation
- [ ] Custom provider plugins

## File Structure

```
services/booking-service/src/notification/
├── providers/
│   ├── EmailProvider.ts          # SendGrid integration
│   ├── SMSProvider.ts            # Twilio integration
│   ├── PushProvider.ts           # Firebase integration
│   ├── InAppProvider.ts          # In-app storage
│   └── ProviderFactory.ts        # Factory pattern
├── NotificationService.ts         # Core service
├── NotificationController.ts      # API routes
└── index.ts                       # Exports

services/booking-service/tests/integration/
├── notificationProviders.integration.test.ts  # Provider tests
├── notificationService.integration.test.ts    # Service tests
└── notificationAPI.integration.test.ts        # API tests
```

## Troubleshooting

### Provider Not Sending
1. Check environment variables are set
2. Verify API credentials
3. Check mock mode setting
4. Review error logs for detailed messages
5. Test provider individually with console logs

### Long Messages
- SMS automatically splits at 153 characters
- Each part adds `(X/Y) ` header
- Consider shorter messages for better UX

### Device Tokens
- Firebase tokens are very long (150+ characters)
- Stored in user preferences table
- Regenerated on app update in some cases
- Monitor for invalid tokens

### Topic Names
- Must match Firebase naming conventions
- Alphanumeric, hyphens, underscores, colons only
- Examples: `booking-updates`, `promo_2024`, `urgent:alerts`

## References

- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference)
- [Twilio SMS API](https://www.twilio.com/docs/sms/api)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Prisma ORM](https://www.prisma.io/docs/)
