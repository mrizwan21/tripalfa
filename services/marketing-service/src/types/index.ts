import { z } from 'zod';

const CampaignStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'PAUSED']);
const RecipientStatusSchema = z.enum(['PENDING', 'SENT', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'CONVERTED']);
const DeviceTypeSchema = z.enum(['MOBILE', 'DESKTOP', 'TABLET']);
const LeadGradeSchema = z.enum(['A', 'B', 'C', 'D']);
const SubscriberStatusSchema = z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'INACTIVE']);

const CreateEmailCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().optional(),
  segmentationRules: z.record(z.any()),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  previewText: z.string().optional(),
  createdBy: z.string(),
  scheduledFor: z.date().optional(),
});

const SubscribeEmailSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  interests: z.array(z.string()).optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

const TrackVisitorSchema = z.object({
  sessionId: z.string(),
  pageUrl: z.string(),
  pageType: z.string().optional(),
  searchParams: z.record(z.any()).optional(),
  viewDuration: z.number().optional(),
  email: z.string().optional(),
  deviceType: z.string().optional(),
  deviceOs: z.string().optional(),
  browserName: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

const UploadFlyerSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  designJson: z.record(z.any()),
  uploadedBy: z.string(),
});

// Type exports
type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
type RecipientStatus = z.infer<typeof RecipientStatusSchema>;
type DeviceType = z.infer<typeof DeviceTypeSchema>;
type LeadGrade = z.infer<typeof LeadGradeSchema>;
type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;
export type CreateEmailCampaign = z.infer<typeof CreateEmailCampaignSchema>;
type SubscribeEmail = z.infer<typeof SubscribeEmailSchema>;
type TrackVisitor = z.infer<typeof TrackVisitorSchema>;
type UploadFlyer = z.infer<typeof UploadFlyerSchema>;
