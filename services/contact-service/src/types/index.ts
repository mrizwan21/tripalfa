import { z } from 'zod';

export const ContactTierSchema = z.enum(['PLATINUM', 'GOLD', 'SILVER', 'STANDARD']);
export const CommunicationPrefSchema = z.enum(['EMAIL', 'SMS', 'BOTH', 'NONE']);
export const EmailFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'NEVER']);
export const ActivityTypeSchema = z.enum([
  'BOOKING_CREATED',
  'BOOKING_MODIFIED',
  'AMENDMENT_REQUESTED',
  'TICKET_CREATED',
  'TICKET_RESOLVED',
  'EMAIL_SENT',
  'EMAIL_OPENED',
  'EMAIL_CLICKED',
  'PAYMENT_RECEIVED',
  'REFUND_ISSUED',
  'VISITOR_CONVERTED',
  'OTHER'
]);

export const CreateContactSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  tier: ContactTierSchema.optional().default('STANDARD'),
});

export const UpdateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  tier: ContactTierSchema.optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const CreateActivitySchema = z.object({
  contactId: z.string().min(1),
  type: ActivityTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  bookingId: z.string().optional(),
  ticketId: z.string().optional(),
  emailCampaignId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdBy: z.string().optional(),
  isInternal: z.boolean().optional(),
});

export const UpdatePreferenceSchema = z.object({
  marketingEmail: z.boolean().optional(),
  marketingSms: z.boolean().optional(),
  marketingPush: z.boolean().optional(),
  promotionalOffers: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  emailFrequency: EmailFrequencySchema.optional(),
  smsFrequency: EmailFrequencySchema.optional(),
});

export const ContactQuerySchema = z.object({
  tier: ContactTierSchema.optional(),
  sortBy: z.enum(['createdAt', 'totalSpent', 'bookingsCount']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Type exports
type ContactTier = z.infer<typeof ContactTierSchema>;
type CommunicationPref = z.infer<typeof CommunicationPrefSchema>;
type EmailFrequency = z.infer<typeof EmailFrequencySchema>;
type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type CreateActivity = z.infer<typeof CreateActivitySchema>;
export type UpdatePreference = z.infer<typeof UpdatePreferenceSchema>;
type ContactQuery = z.infer<typeof ContactQuerySchema>;
