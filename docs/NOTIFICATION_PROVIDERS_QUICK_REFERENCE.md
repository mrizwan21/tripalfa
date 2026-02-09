# Notification Providers - Quick Reference Guide

## 🚀 Quick Start

### 1. Initialize Providers
```typescript
import { ProviderFactory, NotificationService } from '@tripalfa/notification';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const factory = ProviderFactory.createFromEnvironment();
const service = new NotificationService(prisma, factory);
```

### 2. Send Notification
```typescript
const result = await service.sendNotification({
  userId: 'user-123',
  userEmail: 'user@example.com',
  userPhone: '+1234567890',
  notificationType: 'booking-confirmation',
  channels: ['email', 'sms', 'push', 'in_app'],
  content: {
    email: { subject: 'Confirmed', body: 'Your booking is confirmed' },
    sms: { message: 'Booking confirmed. Ref: #12345' },
    push: { title: 'Confirmed', body: 'Your booking is ready' },
    in_app: { title: 'Confirmed', message: 'Your booking is ready' }
  }
});
```

### 3. Check Status
```typescript
const notification = await service.getNotification(result.id);
console.log(notification.channelStatus);
// { email: 'sent', sms: 'sent', push: 'sent', in_app: 'sent' }
```

---

## 📧 Email Provider

### Basic Send
```typescript
import { EmailProvider } from '@tripalfa/notification';

const email = new EmailProvider(apiKey, fromEmail);
const result = await email.send('recipient@example.com', {
  subject: 'Hello',
  body: 'This is the email body'
});
```

### With HTML
```typescript
await email.send('user@example.com', {
  subject: 'Welcome',
  body: 'Plain text backup',
  htmlBody: '<h1>Welcome to TripAlfa</h1>',
  replyTo: 'support@tripalfa.com'
});
```

### Bulk Send
```typescript
const results = await email.sendBulk(
  ['user1@example.com', 'user2@example.com'],
  { subject: 'Newsletter', body: 'Content here' }
);
```

### Configuration
```
SENDGRID_API_KEY=sg-xxxxx
SENDGRID_FROM_EMAIL=noreply@tripalfa.com
```

---

## 💬 SMS Provider

### Basic Send
```typescript
import { SMSProvider } from '@tripalfa/notification';

const sms = new SMSProvider(accountSid, authToken, phoneNumber);
const result = await sms.send('+1234567890', {
  message: 'Your OTP is: 123456'
});
```

### Auto-Splitting Long Messages
```typescript
// Message over 160 chars automatically splits
const result = await sms.send('+1234567890', {
  message: 'a'.repeat(200) // Will split into 2 messages
});
// Result: "(1/2) aaa..." and "(2/2) aaa..."
```

### Bulk Send
```typescript
const results = await sms.sendBulk(
  ['+1111111111', '+2222222222'],
  { message: 'Your booking is confirmed' }
);
```

### Message Splitting
```typescript
const sms = new SMSProvider(...);
const parts = sms.splitLongMessage('Long message...');
// parts = ['(1/3) Long message...', '(2/3) ...', '(3/3) ...']
```

### Configuration
```
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=token_xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🔔 Push Provider

### Send to Device
```typescript
import { PushProvider } from '@tripalfa/notification';

const push = new PushProvider(projectId, privateKeyId, privateKey, clientEmail);
const result = await push.send(deviceToken, {
  title: 'New Booking',
  body: 'Your booking is ready',
  data: { bookingId: '12345' }
});
```

### Send to Multiple Devices
```typescript
const results = await push.sendMulticast(
  [deviceToken1, deviceToken2, deviceToken3],
  { title: 'Promo', body: 'Special offer available now' }
);
```

### Topic Broadcasting
```typescript
// Send to all topic subscribers
await push.sendToTopic('booking-updates', {
  title: 'System Update',
  body: 'Booking system updated'
});

// Subscribe device to topic
await push.subscribeToTopic(deviceToken, 'booking-updates');

// Unsubscribe
await push.unsubscribeFromTopic(deviceToken, 'booking-updates');
```

### With Rich Content
```typescript
await push.send(deviceToken, {
  title: 'Booking Confirmed',
  body: 'Your booking is ready',
  icon: 'https://example.com/icon.png',
  image: 'https://example.com/image.png',
  sound: 'default',
  badge: '1'
});
```

### Configuration
```
FIREBASE_PROJECT_ID=project_xxxxx
FIREBASE_PRIVATE_KEY_ID=key_xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com
```

---

## 📱 In-App Provider

### Send Notification
```typescript
import { InAppProvider } from '@tripalfa/notification';

const inApp = new InAppProvider(dbClient, wsManager);
const result = await inApp.send('user-123', {
  title: 'Welcome',
  message: 'Welcome to TripAlfa',
  actionUrl: '/dashboard',
  priority: 'high'
});
```

### Send to Multiple Users
```typescript
const results = await inApp.sendToMany(
  ['user-1', 'user-2', 'user-3'],
  { title: 'Promo', message: 'Check out our deals' }
);
```

### Send to User Segment
```typescript
await inApp.sendToSegment('premium-users', {
  title: 'Exclusive Offer',
  message: 'Premium members save 20%'
});
```

### Notification Management
```typescript
// Get user's notifications
const notifications = await inApp.getNotifications('user-123', {
  limit: 20,
  offset: 0,
  unreadOnly: true
});

// Mark as read
await inApp.markAsRead(notificationId, 'user-123');

// Delete
await inApp.deleteNotification(notificationId, 'user-123');
```

### No External Configuration Needed
```
// Built-in, uses database
// No additional env vars required
```

---

## 🏭 Provider Factory

### Get Provider
```typescript
import { ProviderFactory } from '@tripalfa/notification';

const factory = new ProviderFactory(config);

// Get specific provider
const emailProvider = factory.getProvider('email');
const smsProvider = factory.getProvider('sms');
const pushProvider = factory.getProvider('push');
const inAppProvider = factory.getProvider('in_app');
```

### Check Configuration
```typescript
// List all configured providers
const configured = factory.getConfiguredProviders();
// ['email', 'sms', 'push', 'in_app']

// Health check
const health = await factory.healthCheck();
// { email: true, sms: true, push: true, in_app: true }
```

### Create from Environment
```typescript
const factory = ProviderFactory.createFromEnvironment();
// Automatically loads all env vars
```

---

## 🧪 Testing

### Run All Provider Tests
```bash
npm test -- notificationProviders.integration.test.ts
```

### Run Specific Provider Tests
```bash
npm test -- notificationProviders.integration.test.ts -t "EmailProvider"
npm test -- notificationProviders.integration.test.ts -t "SMSProvider"
npm test -- notificationProviders.integration.test.ts -t "PushProvider"
npm test -- notificationProviders.integration.test.ts -t "InAppProvider"
```

### With Coverage
```bash
npm test -- --coverage notificationProviders.integration.test.ts
```

### Mock Mode
```typescript
// All providers support mock mode for testing
const email = new EmailProvider(apiKey, fromEmail, true); // true = mock mode
const sms = new SMSProvider(sid, token, phone, true);
const push = new PushProvider(id, keyId, key, email, true);
const inApp = new InAppProvider(db, ws, true);
```

---

## ⚙️ Configuration

### Development
```bash
NODE_ENV=development
MOCK_PROVIDERS=true
```

### Production - Email
```bash
SENDGRID_API_KEY=sg-xxxxx
SENDGRID_FROM_EMAIL=noreply@tripalfa.com
```

### Production - SMS
```bash
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=token_xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Production - Push
```bash
FIREBASE_PROJECT_ID=project_xxxxx
FIREBASE_PRIVATE_KEY_ID=key_xxxxx
FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com
```

---

## 🔍 Error Handling

### Invalid Email
```typescript
try {
  await email.send('invalid-email', { subject: 'Test', body: 'Test' });
} catch (error) {
  // "Invalid email address: invalid-email"
}
```

### SMS Too Long
```typescript
try {
  await sms.send('+1234567890', { message: 'a'.repeat(161) });
} catch (error) {
  // "SMS message exceeds 160 characters"
}
```

### Invalid Device Token
```typescript
try {
  await push.send('short', { title: 'Test', body: 'Test' });
} catch (error) {
  // "Invalid device token format"
}
```

### Graceful Degradation
```typescript
// If email fails, SMS still sends
await service.sendNotification({
  // ...
  channels: ['email', 'sms'], // Try email first
  content: {
    email: { subject: 'Bad sender', body: 'Test' }, // Will fail
    sms: { message: 'SMS message' } // Still sends
  }
});
// Result: email fails, sms succeeds
```

---

## 📊 Status Tracking

### Channel Status Values
```typescript
type ChannelStatus = 
  | 'pending'   // Awaiting delivery
  | 'sent'      // Delivered to provider
  | 'delivered' // Confirmed delivered
  | 'opened'    // (Email/Push) User opened
  | 'clicked'   // (Email/Push) User clicked
  | 'failed';   // Delivery failed
```

### Check Individual Channel Status
```typescript
const notification = await service.getNotification(id);
console.log(notification.channelStatus);
// {
//   email: 'sent',
//   sms: 'delivered',
//   push: 'opened',
//   in_app: 'sent'
// }
```

---

## 🎯 Common Workflows

### Booking Confirmation
```typescript
await service.sendNotification({
  userId: 'user-123',
  userEmail: 'user@example.com',
  userPhone: '+1234567890',
  notificationType: 'booking-confirmation',
  channels: ['email', 'sms', 'in_app'], // No push yet
  content: {
    email: {
      subject: 'Your booking is confirmed',
      body: 'Order #12345 confirmed for tomorrow'
    },
    sms: {
      message: 'Booking confirmed. Ref: #12345. Check email for details.'
    },
    in_app: {
      title: 'Booking Confirmed',
      message: 'Order #12345 is confirmed',
      actionUrl: '/booking/12345'
    }
  }
});
```

### Payment Alert
```typescript
await service.sendNotification({
  userId: 'user-123',
  userEmail: 'user@example.com',
  notificationType: 'payment-failed',
  channels: ['email', 'in_app'],
  priority: 'high',
  content: {
    email: {
      subject: 'Payment Failed',
      body: 'Your payment could not be processed. Please update your payment method.'
    },
    in_app: {
      title: 'Payment Failed',
      message: 'Update your payment method to complete booking',
      actionUrl: '/payment',
      priority: 'high'
    }
  }
});
```

### Promotional Campaign
```typescript
await service.sendNotification({
  userId: 'user-123',
  channels: ['email', 'push', 'in_app'], // Skip SMS for promo
  notificationType: 'promotion',
  content: {
    email: {
      subject: 'Special Offer - Save 30%',
      htmlBody: '<h1>Special Offer</h1><p>Save 30% on all bookings</p>'
    },
    push: {
      title: 'Special Offer',
      body: 'Save 30% on all bookings this week'
    },
    in_app: {
      title: 'Special Offer',
      message: 'Save 30% on all bookings',
      actionUrl: '/promo'
    }
  }
});
```

---

## 🚨 Troubleshooting

### Provider Not Sending
**Problem**: Notifications not being sent
**Solution**:
1. Check environment variables are set
2. Verify API credentials in provider config
3. Check if mock mode is enabled
4. Review error logs for details

### SMS Not Splitting
**Problem**: Long SMS stays as one message
**Solution**:
```typescript
const sms = new SMSProvider(...);
const parts = sms.splitLongMessage(longMessage);
// Use parts array to send individually if needed
```

### Push Not Reaching Devices
**Problem**: Push notifications not delivered
**Solution**:
1. Verify device tokens are valid (50+ chars)
2. Check Firebase configuration
3. Ensure app has notification permission
4. Check topic subscription status

### Tests Failing
**Problem**: Tests hanging or timing out
**Solution**:
1. Ensure mock mode is enabled
2. Run with `npm test -- --timeout 10000`
3. Check for unclosed database connections
4. Review test output for specific errors

---

## 📖 Full Documentation

- **Complete Guide**: `docs/NOTIFICATION_PROVIDERS_IMPLEMENTATION.md`
- **Implementation Index**: `docs/NOTIFICATION_PROVIDERS_IMPLEMENTATION_INDEX.md`
- **Progress Report**: `docs/NOTIFICATION_PROVIDERS_PROGRESS_REPORT.md`
- **Implementation Status**: `docs/NOTIFICATION_PROVIDERS_IMPLEMENTATION_COMPLETE.md`

---

**Quick Reference: Notification Providers**
*Last Updated: Current Session*
*Status: Production Ready* ✅
