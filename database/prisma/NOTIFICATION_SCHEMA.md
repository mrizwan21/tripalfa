// Add these models to your Prisma schema.prisma file

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'offline_request_update', 'price_alert', 'booking_reminder', etc.
  title     String
  message   String
  data      Json?    // Additional data payload
  channels  String[] // Array of channels: 'email', 'sms', 'push', 'in_app'
  priority  String   @default("medium") // 'low', 'medium', 'high'
  status    String   @default("sent") // 'sent', 'read', 'archived'
  actionUrl String?  // URL to action related to notification
  readAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user   User   @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  logs   NotificationLog[]

  @@index([userId])
  @@index([createdAt])
  @@index([status])
  @@map("notifications")
}

model NotificationLog {
  id              String   @id @default(cuid())
  notificationId  String
  channel         String   // 'email', 'sms', 'push'
  status          String   // 'pending', 'delivered', 'failed', 'bounced'
  error           String?  // Error message if failed
  sentAt          DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())

  // Relations
  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@index([channel])
  @@index([status])
  @@map("notification_logs")
}

model NotificationPreference {
  id                      String   @id @default(cuid())
  userId                  String   @unique
  emailEnabled            Boolean  @default(true)
  smsEnabled              Boolean  @default(false)
  pushEnabled             Boolean  @default(true)
  offlineRequestUpdates   Boolean  @default(true)
  priceDropAlerts         Boolean  @default(true)
  bookingReminders        Boolean  @default(true)
  promotionalEmails       Boolean  @default(false)
  quietHoursStart         String?  // HH:mm format
  quietHoursEnd           String?  // HH:mm format
  timezone                String   @default("UTC")
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  // Relations
  user                    User     @relation("UserNotificationPreferences", fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  auth      String?
  p256dh    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user      User     @relation("UserPushSubscriptions", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isActive])
  @@map("push_subscriptions")
}

// Update User model to include notification relations:
// Add these fields to your existing User model:
/*
  notifications            Notification[]                 @relation("UserNotifications")
  notificationPreferences  NotificationPreference?        @relation("UserNotificationPreferences")
  pushSubscriptions        PushSubscription[]             @relation("UserPushSubscriptions")
*/
