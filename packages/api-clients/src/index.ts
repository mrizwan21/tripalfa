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
  // Notification types - aligned with b2b-admin features
  Notification,
  NotificationTemplate,
  NotificationCampaign,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  DeliveryStatus,
  DeliveryStatusResponse,
  CreateNotificationRequest,
  SendNotificationResponse,
  CreateTemplateRequest,
  CreateCampaignRequest,
  CampaignExecutionResponse,
  DeliveryAnalytics,
  TemplateVariable,
  ChannelConfig,
  NotificationCondition,
  NotificationRecipient,
  UserNotificationPreferences,
  FrequencyConfig,
  RetryPolicy,
  NotificationSequence,
  NotificationAnalytics,
} from './notificationservice.js';
export type { Payment, PaymentRequest } from './paymentservice.js';
export type {
  // Rule Engine types - aligned with b2b-admin features
  Rule,
  RuleStatus,
  RulePriority,
  RuleTrigger,
  ConditionOperator,
  ActionType,
  DataType,
  FieldPath,
  RuleCondition,
  RuleAction,
  RuleActionConfig,
  RuleExecution,
  CreateRuleRequest,
  UpdateRuleRequest,
  ExecuteRuleRequest,
  ExecuteRuleResponse,
  DebugRuleRequest,
  DebugRuleResponse,
  RuleAnalysisResponse,
  RuleExecutionHistory,
  RuleConflictCheckResponse,
  RuleStats,
  RuleRetryPolicy,
  ExecutionContext,
  RuleImpactAnalysis,
  RuleConflictAnalysis,
  RuleDebugSession,
} from './ruleengineservice.js';
export type { SupportTicket, SupportMessage } from './supportservice.js';
export type { TaxCalculation, TaxBreakdown } from './taxservice.js';
