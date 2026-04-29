-- Migration: Initialize tripalfa_ops database with operational tables
-- Database: tripalfa_ops
-- Timestamp: 2026-03-09
-- Description: Contains notifications, rules engine, documents, disputes, offline request queue

BEGIN;

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "bookingId" TEXT,
    "notificationType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channels" TEXT[],
    "content" JSONB NOT NULL,
    "contentHash" TEXT,
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "isDLQ" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_statuses" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "messageId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_statuses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "channel_statuses_notification_channel_unique" UNIQUE ("notificationId", "channel")
);

CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "content" JSONB,
    "htmlTemplate" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_retries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT,
    "attemptNumber" INTEGER DEFAULT 1,
    "maxRetries" INTEGER DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_retries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_analytics" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "eventType" TEXT,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_metrics" (
    "id" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "channel" TEXT,
    "period" TEXT,
    "sentCount" INTEGER DEFAULT 0,
    "deliveredCount" INTEGER DEFAULT 0,
    "openedCount" INTEGER DEFAULT 0,
    "failedCount" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "notificationType" TEXT,
    "channels" TEXT[],
    "variables" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "jobQueueId" TEXT,
    "status" TEXT DEFAULT 'scheduled',
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_targets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "isPreferred" BOOLEAN DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dead_letter_queue" (
    "id" TEXT NOT NULL,
    "originalNotificationId" TEXT,
    "reason" TEXT,
    "failureCount" INTEGER DEFAULT 0,
    "lastError" TEXT,
    "payload" JSONB,
    "status" TEXT DEFAULT 'dead_letter',
    "replayedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dead_letter_queue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT DEFAULT 'received',
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- RULE ENGINE
-- ============================================

CREATE TABLE IF NOT EXISTS "rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "trigger" JSONB,
    "triggerEvent" TEXT,
    "condition" JSONB,
    "actions" JSONB,
    "priority" INTEGER DEFAULT 50,
    "status" TEXT DEFAULT 'draft',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER DEFAULT 1,
    "timeout" INTEGER,
    "maxRetries" INTEGER,
    "asyncExecution" BOOLEAN DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalExecutions" INTEGER DEFAULT 0,
    "successCount" INTEGER DEFAULT 0,
    "failureCount" INTEGER DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rule_executions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inputData" JSONB,
    "outputData" JSONB,
    "conditionMet" BOOLEAN,
    "conditionEval" JSONB,
    "actionsExecuted" TEXT[],
    "executionTime" INTEGER,
    "error" TEXT,
    "errorType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rule_executions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "rule_analyses" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "riskLevel" TEXT,
    "conflictCount" INTEGER DEFAULT 0,
    "performance" JSONB,
    "recommendations" TEXT[],
    "analysisData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rule_analyses_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE
);

-- ============================================
-- DOCUMENTS & DOCUMENT MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "url" TEXT,
    "storageKey" TEXT,
    "storageProvider" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_access" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "metadata" JSONB,
    CONSTRAINT "document_access_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "document_retention" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "retentionDays" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isArchived" BOOLEAN DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_retention_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "document_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "content" JSONB,
    "htmlTemplate" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TRAVEL DOCUMENT TEMPLATE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "document_template_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variableSchema" JSONB,
    "previewUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_template_types_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_template_types_code_key" UNIQUE ("code")
);

CREATE TABLE IF NOT EXISTS "generated_travel_documents" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "passengerId" TEXT,
    "templateId" TEXT,
    "templateTypeCode" TEXT NOT NULL,
    "documentRef" TEXT NOT NULL,
    "renderData" JSONB,
    "pdfUrl" TEXT,
    "storageKey" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "issuedBy" TEXT,
    "deliveryStatus" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_travel_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "generated_travel_documents_documentRef_key" UNIQUE ("documentRef")
);

CREATE TABLE IF NOT EXISTS "document_generation_jobs" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'queued',
    "triggeredBy" TEXT,
    "bookingId" TEXT,
    "outputUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_signatures" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signatureProvider" TEXT,
    "status" TEXT DEFAULT 'pending',
    "signatureData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "document_delivery_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'pending',
    "errorMessage" TEXT,
    "attempts" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_delivery_logs_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

-- ============================================
-- OFFLINE REQUEST QUEUE & AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS "offline_request_audit_logs" (
    "id" TEXT NOT NULL,
    "offlineRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offline_request_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "offline_request_notification_queue" (
    "id" TEXT NOT NULL,
    "offlineRequestId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT,
    "payload" JSONB,
    "status" TEXT DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "offline_request_notification_queue_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- DISPUTES & COMPLAINTS
-- ============================================

CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "settlements" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "walletId" TEXT,
    "amount" DECIMAL(12,2),
    "settlementDate" TIMESTAMP(3),
    "referenceId" TEXT,
    "status" TEXT DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "idx_notifications_status" ON "notifications"("status");
CREATE INDEX IF NOT EXISTS "idx_notifications_bookingId" ON "notifications"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_channel_statuses_notificationId" ON "channel_statuses"("notificationId");
CREATE INDEX IF NOT EXISTS "idx_scheduled_notifications_scheduledFor" ON "scheduled_notifications"("scheduledFor");
CREATE INDEX IF NOT EXISTS "idx_rules_enabled" ON "rules"("enabled");
CREATE INDEX IF NOT EXISTS "idx_rules_category" ON "rules"("category");
CREATE INDEX IF NOT EXISTS "idx_rule_executions_ruleId" ON "rule_executions"("ruleId");
CREATE INDEX IF NOT EXISTS "idx_documents_bookingId" ON "documents"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_documents_userId" ON "documents"("userId");
CREATE INDEX IF NOT EXISTS "idx_document_access_documentId" ON "document_access"("documentId");
CREATE INDEX IF NOT EXISTS "idx_generated_travel_documents_bookingId" ON "generated_travel_documents"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_disputes_bookingId" ON "disputes"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_settlements_bookingId" ON "settlements"("bookingId");

COMMIT;
