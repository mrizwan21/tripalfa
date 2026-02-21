// API Clients Index
export { default as AuditService } from './auditservice.js';
export { default as KYCService } from './kycservice.js';
export { default as MarketingService } from './marketingservice.js';
export { default as NotificationService } from './notificationservice.js';
export { default as PaymentService } from './paymentservice.js';
export { default as RuleEngineService } from './ruleengineservice.js';
export { default as SupportService } from './supportservice.js';
export { default as TaxService } from './taxservice.js';

// Export types from services
export type { AuditLog, ComplianceReport } from './auditservice.js';
export type { KYCVerification } from './kycservice.js';
export type { Campaign } from './marketingservice.js';
export type {
  Notification,
  NotificationTemplate,
  NotificationCampaign,
  DeliveryStatus,
  CreateNotificationRequest,
  SendNotificationResponse,
  CreateTemplateRequest,
  CreateCampaignRequest,
  CampaignExecutionResponse,
  DeliveryAnalytics,
} from './notificationservice.js';
export type { Payment, PaymentRequest } from './paymentservice.js';
export type {
  Rule,
  CreateRuleRequest,
  UpdateRuleRequest,
  ExecuteRuleRequest,
  ExecuteRuleResponse,
  DebugRuleRequest,
  DebugRuleResponse,
  RuleAnalysisResponse,
  RuleExecutionHistory,
  RuleConflictCheckResponse,
} from './ruleengineservice.js';
export type { SupportTicket, SupportMessage } from './supportservice.js';
export type { TaxCalculation, TaxBreakdown } from './taxservice.js';
