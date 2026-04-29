/**
 * 14-notifications.ts — NotificationTemplate, NotificationLog
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS } from './02-tenants.js';
import { log, randomPastDate } from './helpers/faker.js';

export async function seedNotifications(prisma: PrismaClient) {
  console.log('\n🔔 [14-notifications] Seeding notification templates and logs...');

  // 1. Templates
  const templates = [
    { code: 'BOOKING_CONFIRMATION', name: 'Booking Confirmation', channel: 'email' as const, subject: 'Booking Confirmation - {{bookingRef}}', bodyTemplate: 'Dear {{customerName}}, your booking {{bookingRef}} is confirmed.', priority: 'high' as const },
    { code: 'BOOKING_CANCELLATION', name: 'Booking Cancellation', channel: 'email' as const, subject: 'Booking Cancelled - {{bookingRef}}', bodyTemplate: 'Dear {{customerName}}, your booking {{bookingRef}} has been cancelled.', priority: 'high' as const },
    { code: 'PAYMENT_RECEIPT', name: 'Payment Receipt', channel: 'email' as const, subject: 'Payment Receipt - {{transactionNo}}', bodyTemplate: 'We have received your payment of {{amount}} {{currency}}.', priority: 'medium' as const },
    { code: 'APPROVAL_REQUEST', name: 'Approval Request', channel: 'email' as const, subject: 'Action Required: Approval for {{bookingRef}}', bodyTemplate: 'A service request requires your approval.', priority: 'high' as const },
    { code: 'TICKET_DEADLINE_REMINDER', name: 'Ticket Deadline Reminder', channel: 'sms' as const, subject: null, bodyTemplate: 'Reminder: Ticket deadline for booking {{bookingRef}} is approaching.', priority: 'high' as const },
    { code: 'PASSPORT_EXPIRY_ALERT', name: 'Passport Expiry Alert', channel: 'in_app' as const, subject: 'Passport Expiring Soon', bodyTemplate: 'Passport for {{travellerName}} expires on {{expiryDate}}.', priority: 'medium' as const },
    { code: 'REFUND_PROCESSED', name: 'Refund Processed', channel: 'email' as const, subject: 'Refund Processed - {{bookingRef}}', bodyTemplate: 'Your refund of {{amount}} {{currency}} has been processed.', priority: 'medium' as const },
    { code: 'WALLET_LOW_BALANCE', name: 'Wallet Low Balance', channel: 'sms' as const, subject: null, bodyTemplate: 'Alert: Your wallet balance has dropped below the threshold.', priority: 'urgent' as const },
    { code: 'SYSTEM_MAINTENANCE', name: 'System Maintenance', channel: 'in_app' as const, subject: 'Scheduled Maintenance', bodyTemplate: 'System will be down for maintenance on {{date}}.', priority: 'medium' as const },
    { code: 'WELCOME_AGENT', name: 'Welcome Agent', channel: 'email' as const, subject: 'Welcome to TripAlfa!', bodyTemplate: 'Welcome! Your account has been created.', priority: 'medium' as const },
    { code: 'PASSWORD_RESET', name: 'Password Reset', channel: 'email' as const, subject: 'Password Reset Request', bodyTemplate: 'Click here to reset your password.', priority: 'urgent' as const },
    { code: 'OTP_VERIFICATION', name: 'OTP Verification', channel: 'sms' as const, subject: null, bodyTemplate: 'Your verification code is {{code}}.', priority: 'urgent' as const },
  ];

  let tplCount = 0;
  const createdTemplates: Record<string, string> = {}; // code -> id
  for (const tpl of templates) {
    const created = await prisma.notificationTemplate.upsert({
      where: { code: tpl.code },
      update: {},
      create: {
        name: tpl.name, code: tpl.code, channel: tpl.channel,
        subject: tpl.subject, bodyTemplate: tpl.bodyTemplate,
        isDefault: true, isActive: true,
      },
    });
    createdTemplates[tpl.code] = created.id;
    tplCount++;
  }
  log('14-notifications', 'NotificationTemplate', tplCount);

  // 2. Logs
  let logCount = 0;
  for (let i = 0; i < 30; i++) {
    const tplCode = faker.helpers.arrayElement(Object.keys(createdTemplates));
    const tpl = templates.find(t => t.code === tplCode)!;
    const status = faker.helpers.weightedArrayElement([
      { weight: 15, value: 'sent' as const },
      { weight: 5, value: 'pending' as const },
      { weight: 5, value: 'failed' as const },
      { weight: 5, value: 'retrying' as const },
    ]);

    await prisma.notificationLog.create({
      data: {
        templateId: createdTemplates[tplCode],
        channel: tpl.channel,
        priority: tpl.priority,
        status,
        to: tpl.channel === 'email' ? faker.internet.email() : `+9733${faker.string.numeric(7)}`,
        subject: tpl.subject ? tpl.subject.replace('{{bookingRef}}', `BK-${faker.string.numeric(4)}`) : null,
        body: tpl.bodyTemplate, // Just use raw template for mock
        tenantId: faker.helpers.arrayElement([TENANT_IDS.master, TENANT_IDS.sub1, TENANT_IDS.corp1]),
        provider: tpl.channel === 'email' ? 'resend' : tpl.channel === 'sms' ? 'twilio' : 'system',
        attempts: status === 'failed' ? 3 : status === 'retrying' ? 1 : 1,
        sentAt: status === 'sent' ? randomPastDate(1, 10) : null,
        nextRetryAt: status === 'retrying' ? new Date() : null,
        createdAt: randomPastDate(1, 14),
      },
    });
    logCount++;
  }

  log('14-notifications', 'NotificationLog', logCount);
}
