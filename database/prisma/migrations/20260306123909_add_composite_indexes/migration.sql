-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "inAppNotifications" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'English',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "legalName" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "type" TEXT NOT NULL DEFAULT 'b2b',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "headId" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salaryRange" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFront" TEXT,
    "documentBack" TEXT,
    "selfie" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "address" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "previousVerificationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
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
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "failureDetails" JSONB,
    "providerMessageIds" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "isDLQ" BOOLEAN NOT NULL DEFAULT false,
    "dlqReason" TEXT,
    "dlqMovedAt" TIMESTAMP(3),
    "dlqReplays" INTEGER NOT NULL DEFAULT 0,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_statuses" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT 'pending',
    "sms" TEXT NOT NULL DEFAULT 'pending',
    "push" TEXT NOT NULL DEFAULT 'pending',
    "in_app" TEXT NOT NULL DEFAULT 'pending',
    "email_sent_at" TIMESTAMP(3),
    "sms_sent_at" TIMESTAMP(3),
    "push_sent_at" TIMESTAMP(3),
    "in_app_sent_at" TIMESTAMP(3),
    "email_delivered_at" TIMESTAMP(3),
    "sms_delivered_at" TIMESTAMP(3),
    "push_delivered_at" TIMESTAMP(3),
    "in_app_delivered_at" TIMESTAMP(3),
    "email_opened_at" TIMESTAMP(3),
    "sms_opened_at" TIMESTAMP(3),
    "push_opened_at" TIMESTAMP(3),
    "in_app_opened_at" TIMESTAMP(3),
    "email_clicked_at" TIMESTAMP(3),
    "push_clicked_at" TIMESTAMP(3),
    "email_error" TEXT,
    "sms_error" TEXT,
    "push_error" TEXT,
    "in_app_error" TEXT,
    "email_message_id" TEXT,
    "sms_message_id" TEXT,
    "push_message_id" TEXT,
    "in_app_message_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "templates" JSONB,
    "emailTemplate" JSONB,
    "smsTemplate" JSONB,
    "pushTemplate" JSONB,
    "inAppTemplate" JSONB,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_retries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "failureReason" TEXT,
    "scheduledRetryAt" TIMESTAMP(3),
    "actualRetryAt" TIMESTAMP(3),
    "delayMs" INTEGER NOT NULL DEFAULT 1000,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerResponse" JSONB,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_retries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_analytics" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "providerId" TEXT,
    "providerStatus" TEXT,

    CONSTRAINT "notification_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_targets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dead_letter_queue" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalError" TEXT,
    "errorDetails" JSONB,
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplayAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dead_letter_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "supplierId" TEXT,
    "externalEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payload" JSONB,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "trigger" TEXT NOT NULL DEFAULT 'event',
    "triggerEvent" TEXT,
    "condition" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "timeout" INTEGER DEFAULT 30000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "asyncExecution" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "tags" TEXT[],
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutionAt" TIMESTAMP(3),
    "lastExecutionStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_executions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "inputData" JSONB,
    "outputData" JSONB,
    "conditionMet" BOOLEAN NOT NULL DEFAULT false,
    "conditionEval" JSONB,
    "actionsExecuted" JSONB,
    "error" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "bookingId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_analyses" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "conflicts" JSONB,
    "performance" JSONB,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workflowState" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "markupAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "travelDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_segments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "flightNumber" TEXT,
    "airline" TEXT,
    "departureAirport" TEXT,
    "arrivalAirport" TEXT,
    "departureTime" TIMESTAMP(3),
    "arrivalTime" TIMESTAMP(3),
    "hotelName" TEXT,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "roomType" TEXT,
    "supplierHotelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "passengerType" TEXT NOT NULL DEFAULT 'adult',
    "title" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "passportNumber" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_modifications" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "modificationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestNote" TEXT,
    "responseNote" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "modificationFee" DECIMAL(12,2),
    "penaltyFee" DECIMAL(12,2),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prebook_sessions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "hotelId" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "guestEmail" TEXT,
    "guestName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prebook_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reservedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dailyLimit" DECIMAL(12,2),
    "monthlyLimit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "payerId" TEXT,
    "payeeId" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "type" TEXT NOT NULL,
    "flow" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "credit" DECIMAL(12,2),
    "debit" DECIMAL(12,2),
    "description" TEXT,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "serviceType" TEXT,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "bookingRef" TEXT,
    "travelDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "route" TEXT,
    "hotelAddress" TEXT,
    "guestName" TEXT,
    "roomType" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "credit" DECIMAL(12,2),
    "debit" DECIMAL(12,2),
    "accountType" TEXT NOT NULL,
    "account" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_reconciliations" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "closingBalance" DECIMAL(12,2) NOT NULL,
    "totalCredits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDebits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "maxPoints" INTEGER,
    "benefits" JSONB,
    "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_loyalty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loyaltyTierId" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "customerLoyaltyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "transactionType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_vouchers" (
    "id" TEXT NOT NULL,
    "customerLoyaltyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedForBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "serviceType" TEXT,
    "ruleType" TEXT NOT NULL DEFAULT 'percentage',
    "value" DECIMAL(12,4) NOT NULL,
    "minValue" DECIMAL(12,2),
    "maxValue" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "conditions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_settlements" (
    "id" TEXT NOT NULL,
    "commissionRuleId" TEXT,
    "agentId" TEXT,
    "bookingId" TEXT NOT NULL,
    "bookingRef" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "settlementStatus" TEXT NOT NULL DEFAULT 'pending',
    "settledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markup_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "serviceType" TEXT,
    "ruleType" TEXT NOT NULL DEFAULT 'percentage',
    "value" DECIMAL(12,4) NOT NULL,
    "minValue" DECIMAL(12,2),
    "maxValue" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "conditions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markup_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "action" TEXT NOT NULL,
    "serviceType" TEXT,
    "originalPrice" DECIMAL(12,2),
    "finalPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rulesApplied" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT,
    "serviceType" TEXT,
    "terms" JSONB,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetAudience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "campaignType" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetSegment" JSONB,
    "content" JSONB,
    "schedule" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "actualSpend" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metrics" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_coupons" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "minOrderAmount" DECIMAL(12,2),
    "maxDiscount" DECIMAL(12,2),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "minOrderAmount" DECIMAL(12,2),
    "maxDiscount" DECIMAL(12,2),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "apiEndpoint" TEXT,
    "apiVersion" TEXT,
    "supportedRoutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_credentials" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "token" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_sync_logs" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_hotel_mappings" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierHotelId" TEXT NOT NULL,
    "localHotelId" TEXT,
    "liteapiHotelId" TEXT,
    "hotelName" TEXT,
    "matchScore" DECIMAL(5,4),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_hotel_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_deals" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "productType" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "discountType" TEXT DEFAULT 'percentage',
    "discountValue" DECIMAL(12,2) DEFAULT 0,
    "discountPercent" DECIMAL(5,2),
    "discountAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "minPurchase" DECIMAL(12,2),
    "minOrderAmount" DECIMAL(12,2),
    "maxDiscount" DECIMAL(12,2),
    "applicableRoutes" TEXT[],
    "excludedDates" TEXT[],
    "promoCode" TEXT,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isCombinableWithCoupons" BOOLEAN NOT NULL DEFAULT false,
    "mappingRules" JSONB,
    "supplierCodes" TEXT[],
    "metadata" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_mapping_rules" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "originCities" TEXT[],
    "originCountries" TEXT[],
    "destinationCities" TEXT[],
    "destinationCountries" TEXT[],
    "cabinClasses" TEXT[],
    "fareClasses" TEXT[],
    "airlines" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_mapping_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_product_mappings" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "platformProductId" TEXT,
    "productType" TEXT NOT NULL,
    "marketNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "geographyZones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seasonalApplicable" TEXT NOT NULL DEFAULT 'year-round',
    "businessRules" JSONB,
    "matchConfidence" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_mapping_parameters" (
    "id" TEXT NOT NULL,
    "mappingId" TEXT NOT NULL,
    "parameterType" TEXT NOT NULL,
    "marketName" TEXT,
    "parameterName" TEXT NOT NULL,
    "parameterValue" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'percentage',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mapping_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_financials" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT '30_days',
    "settlementCycle" TEXT NOT NULL DEFAULT 'monthly',
    "commissionStructure" JSONB,
    "minimumPayoutAmount" DECIMAL(12,2),
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankCode" TEXT,
    "swiftCode" TEXT,
    "accountHolderName" TEXT,
    "country" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxId" TEXT,
    "paymentHolds" BOOLEAN NOT NULL DEFAULT false,
    "holdReason" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "totalOutstanding" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAttributed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payment_terms" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "financialId" TEXT,
    "termType" TEXT NOT NULL,
    "daysFromBooking" INTEGER NOT NULL DEFAULT 0,
    "percentageRequired" DECIMAL(5,2),
    "minimumAmount" DECIMAL(12,2),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_wallets" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reservedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "dailyPayoutLimit" DECIMAL(12,2),
    "monthlyPayoutLimit" DECIMAL(12,2),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_wallet_approval_requests" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "walletId" TEXT,
    "requestType" TEXT NOT NULL,
    "requestData" JSONB NOT NULL,
    "approverRole" TEXT NOT NULL DEFAULT 'finance',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvalNotes" TEXT,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_wallet_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentType" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'bank_transfer',
    "transactionReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payment_logs" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "walletId" TEXT,
    "paymentId" TEXT,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "previousBalance" DECIMAL(12,2),
    "newBalance" DECIMAL(12,2),
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'system',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_offer_requests" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slices" JSONB,
    "passengers" JSONB,
    "cabinClass" TEXT,
    "offersCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duffel_offer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_offers" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "offerRequestId" TEXT,
    "slices" JSONB,
    "passengers" JSONB,
    "conditions" JSONB,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCurrency" TEXT NOT NULL DEFAULT 'USD',
    "baseAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'available',
    "cabinClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_offer_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "offerId" TEXT,
    "offerData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_offer_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_offer_request_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "requestData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_offer_request_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_orders" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "offerId" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "bookingReference" TEXT,
    "localBookingId" TEXT,
    "baseAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL DEFAULT 'instant',
    "slices" JSONB,
    "passengers" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "ticketedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_order_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "orderData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_order_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_order_cancellations" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "refundAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refundCurrency" TEXT NOT NULL DEFAULT 'USD',
    "refundTo" TEXT NOT NULL DEFAULT 'original_form_of_payment',
    "airlineCredits" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_order_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_order_changes" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "orderId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'flight_change',
    "newSlices" JSONB,
    "slicesAdd" JSONB,
    "slicesRemove" JSONB,
    "penaltyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "newTotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_order_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_seat_map_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "seatData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_seat_map_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_services_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "servicesData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_services_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duffel_cancellation_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cancellationData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duffel_cancellation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiwi_booking_holds" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "walletId" TEXT,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "kiwi_booking_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiwi_settlements" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "description" TEXT,
    "invoiceId" TEXT,
    "settledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiwi_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiwi_refunds" (
    "id" TEXT NOT NULL,
    "refundId" TEXT,
    "originalPaymentId" TEXT,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "reference" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiwi_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiwi_price_changes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT,
    "oldPrice" DECIMAL(12,2) NOT NULL,
    "walletId" TEXT NOT NULL,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "newAmount" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "priceMatchId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiwi_price_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_change_requests" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingRef" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "submittedBy" TEXT,
    "assignedTo" TEXT,
    "requestDetails" JSONB,
    "resolution" JSONB,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_request_audit_logs" (
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

-- CreateTable
CREATE TABLE "offline_request_notification_queue" (
    "id" TEXT NOT NULL,
    "offlineRequestId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_request_notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "url" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_retention" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "scheduledDeleteAt" TIMESTAMP(3),
    "isRetained" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_retention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
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

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "walletId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "settlementDate" TIMESTAMP(3),
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circuit_breakers" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'closed',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circuit_breakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "icaoCode" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "timezone" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airlines" (
    "id" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "icaoCode" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'city',
    "country" TEXT,
    "countryCode" TEXT,
    "continent" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "imageUrl" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_amenities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "includesMeals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_externalId_key" ON "users"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_companyId_email_idx" ON "users"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "companies_code_idx" ON "companies"("code");

-- CreateIndex
CREATE INDEX "companies_isActive_idx" ON "companies"("isActive");

-- CreateIndex
CREATE INDEX "branches_companyId_idx" ON "branches"("companyId");

-- CreateIndex
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

-- CreateIndex
CREATE INDEX "designations_companyId_idx" ON "designations"("companyId");

-- CreateIndex
CREATE INDEX "cost_centers_companyId_idx" ON "cost_centers"("companyId");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_status_idx" ON "kyc_verifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");

-- CreateIndex
CREATE INDEX "notifications_bookingId_idx" ON "notifications"("bookingId");

-- CreateIndex
CREATE INDEX "notifications_notificationType_idx" ON "notifications"("notificationType");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_isDLQ_idx" ON "notifications"("isDLQ");

-- CreateIndex
CREATE INDEX "notifications_userId_status_createdAt_idx" ON "notifications"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_notificationType_status_idx" ON "notifications"("notificationType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_statuses_notificationId_key" ON "channel_statuses"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_slug_key" ON "notification_templates"("slug");

-- CreateIndex
CREATE INDEX "notification_templates_slug_idx" ON "notification_templates"("slug");

-- CreateIndex
CREATE INDEX "notification_templates_category_idx" ON "notification_templates"("category");

-- CreateIndex
CREATE INDEX "notification_templates_enabled_idx" ON "notification_templates"("enabled");

-- CreateIndex
CREATE INDEX "notification_retries_notificationId_idx" ON "notification_retries"("notificationId");

-- CreateIndex
CREATE INDEX "notification_retries_status_idx" ON "notification_retries"("status");

-- CreateIndex
CREATE INDEX "notification_retries_scheduledRetryAt_idx" ON "notification_retries"("scheduledRetryAt");

-- CreateIndex
CREATE INDEX "notification_analytics_notificationId_idx" ON "notification_analytics"("notificationId");

-- CreateIndex
CREATE INDEX "notification_analytics_channel_idx" ON "notification_analytics"("channel");

-- CreateIndex
CREATE INDEX "notification_analytics_event_idx" ON "notification_analytics"("event");

-- CreateIndex
CREATE INDEX "notification_analytics_timestamp_idx" ON "notification_analytics"("timestamp");

-- CreateIndex
CREATE INDEX "notification_metrics_date_idx" ON "notification_metrics"("date");

-- CreateIndex
CREATE INDEX "notification_metrics_channel_idx" ON "notification_metrics"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_metrics_date_channel_notificationType_key" ON "notification_metrics"("date", "channel", "notificationType");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_notifications_jobId_key" ON "scheduled_notifications"("jobId");

-- CreateIndex
CREATE INDEX "scheduled_notifications_userId_idx" ON "scheduled_notifications"("userId");

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_idx" ON "scheduled_notifications"("status");

-- CreateIndex
CREATE INDEX "scheduled_notifications_scheduledTime_idx" ON "scheduled_notifications"("scheduledTime");

-- CreateIndex
CREATE INDEX "scheduled_notifications_active_idx" ON "scheduled_notifications"("active");

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_scheduledTime_idx" ON "scheduled_notifications"("status", "scheduledTime");

-- CreateIndex
CREATE INDEX "notification_targets_userId_idx" ON "notification_targets"("userId");

-- CreateIndex
CREATE INDEX "notification_targets_targetType_idx" ON "notification_targets"("targetType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_targets_userId_target_key" ON "notification_targets"("userId", "target");

-- CreateIndex
CREATE INDEX "dead_letter_queue_notificationId_idx" ON "dead_letter_queue"("notificationId");

-- CreateIndex
CREATE INDEX "dead_letter_queue_reason_idx" ON "dead_letter_queue"("reason");

-- CreateIndex
CREATE INDEX "dead_letter_queue_status_idx" ON "dead_letter_queue"("status");

-- CreateIndex
CREATE INDEX "dead_letter_queue_movedAt_idx" ON "dead_letter_queue"("movedAt");

-- CreateIndex
CREATE INDEX "webhook_events_notificationId_idx" ON "webhook_events"("notificationId");

-- CreateIndex
CREATE INDEX "webhook_events_supplierId_idx" ON "webhook_events"("supplierId");

-- CreateIndex
CREATE INDEX "webhook_events_externalEventId_idx" ON "webhook_events"("externalEventId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events"("provider");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "rules_category_idx" ON "rules"("category");

-- CreateIndex
CREATE INDEX "rules_status_idx" ON "rules"("status");

-- CreateIndex
CREATE INDEX "rules_enabled_idx" ON "rules"("enabled");

-- CreateIndex
CREATE INDEX "rules_triggerEvent_idx" ON "rules"("triggerEvent");

-- CreateIndex
CREATE INDEX "rules_category_enabled_status_idx" ON "rules"("category", "enabled", "status");

-- CreateIndex
CREATE INDEX "rule_executions_ruleId_idx" ON "rule_executions"("ruleId");

-- CreateIndex
CREATE INDEX "rule_executions_status_idx" ON "rule_executions"("status");

-- CreateIndex
CREATE INDEX "rule_executions_userId_idx" ON "rule_executions"("userId");

-- CreateIndex
CREATE INDEX "rule_executions_bookingId_idx" ON "rule_executions"("bookingId");

-- CreateIndex
CREATE INDEX "rule_executions_startedAt_idx" ON "rule_executions"("startedAt");

-- CreateIndex
CREATE INDEX "rule_executions_ruleId_startedAt_idx" ON "rule_executions"("ruleId", "startedAt");

-- CreateIndex
CREATE INDEX "rule_analyses_ruleId_idx" ON "rule_analyses"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingRef_key" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_serviceType_idx" ON "bookings"("serviceType");

-- CreateIndex
CREATE INDEX "bookings_bookingRef_idx" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_userId_status_idx" ON "bookings"("userId", "status");

-- CreateIndex
CREATE INDEX "bookings_userId_serviceType_status_idx" ON "bookings"("userId", "serviceType", "status");

-- CreateIndex
CREATE INDEX "bookings_status_createdAt_idx" ON "bookings"("status", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_status_idx" ON "bookings"("paymentStatus", "status");

-- CreateIndex
CREATE INDEX "booking_segments_bookingId_idx" ON "booking_segments"("bookingId");

-- CreateIndex
CREATE INDEX "booking_segments_bookingId_segmentType_idx" ON "booking_segments"("bookingId", "segmentType");

-- CreateIndex
CREATE INDEX "booking_passengers_bookingId_idx" ON "booking_passengers"("bookingId");

-- CreateIndex
CREATE INDEX "booking_modifications_bookingId_idx" ON "booking_modifications"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "prebook_sessions_transactionId_key" ON "prebook_sessions"("transactionId");

-- CreateIndex
CREATE INDEX "prebook_sessions_transactionId_idx" ON "prebook_sessions"("transactionId");

-- CreateIndex
CREATE INDEX "prebook_sessions_status_idx" ON "prebook_sessions"("status");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_currency_key" ON "wallets"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_referenceId_key" ON "wallet_transactions"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_bookingId_idx" ON "wallet_transactions"("bookingId");

-- CreateIndex
CREATE INDEX "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_idempotencyKey_idx" ON "wallet_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_transactions_serviceType_idx" ON "wallet_transactions"("serviceType");

-- CreateIndex
CREATE INDEX "wallet_transactions_supplierId_idx" ON "wallet_transactions"("supplierId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_type_status_idx" ON "wallet_transactions"("walletId", "type", "status");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_serviceType_createdAt_idx" ON "wallet_transactions"("walletId", "serviceType", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_ledger_walletId_idx" ON "wallet_ledger"("walletId");

-- CreateIndex
CREATE INDEX "wallet_ledger_transactionId_idx" ON "wallet_ledger"("transactionId");

-- CreateIndex
CREATE INDEX "wallet_reconciliations_walletId_idx" ON "wallet_reconciliations"("walletId");

-- CreateIndex
CREATE INDEX "wallet_reconciliations_reconciliationDate_idx" ON "wallet_reconciliations"("reconciliationDate");

-- CreateIndex
CREATE INDEX "wallet_reconciliations_status_idx" ON "wallet_reconciliations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tiers_name_key" ON "loyalty_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tiers_level_key" ON "loyalty_tiers"("level");

-- CreateIndex
CREATE INDEX "loyalty_tiers_level_idx" ON "loyalty_tiers"("level");

-- CreateIndex
CREATE INDEX "loyalty_tiers_isActive_idx" ON "loyalty_tiers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "customer_loyalty_userId_key" ON "customer_loyalty"("userId");

-- CreateIndex
CREATE INDEX "customer_loyalty_userId_idx" ON "customer_loyalty"("userId");

-- CreateIndex
CREATE INDEX "customer_loyalty_loyaltyTierId_idx" ON "customer_loyalty"("loyaltyTierId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_customerLoyaltyId_idx" ON "loyalty_transactions"("customerLoyaltyId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_userId_idx" ON "loyalty_transactions"("userId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_bookingId_idx" ON "loyalty_transactions"("bookingId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_transactionType_idx" ON "loyalty_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "loyalty_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "loyalty_transactions_customerLoyaltyId_createdAt_idx" ON "loyalty_transactions"("customerLoyaltyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_vouchers_code_key" ON "loyalty_vouchers"("code");

-- CreateIndex
CREATE INDEX "loyalty_vouchers_customerLoyaltyId_idx" ON "loyalty_vouchers"("customerLoyaltyId");

-- CreateIndex
CREATE INDEX "loyalty_vouchers_code_idx" ON "loyalty_vouchers"("code");

-- CreateIndex
CREATE INDEX "loyalty_vouchers_status_idx" ON "loyalty_vouchers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rules_code_key" ON "commission_rules"("code");

-- CreateIndex
CREATE INDEX "commission_rules_code_idx" ON "commission_rules"("code");

-- CreateIndex
CREATE INDEX "commission_rules_companyId_idx" ON "commission_rules"("companyId");

-- CreateIndex
CREATE INDEX "commission_rules_isActive_idx" ON "commission_rules"("isActive");

-- CreateIndex
CREATE INDEX "commission_rules_validFrom_idx" ON "commission_rules"("validFrom");

-- CreateIndex
CREATE INDEX "commission_rules_validTo_idx" ON "commission_rules"("validTo");

-- CreateIndex
CREATE INDEX "commission_settlements_commissionRuleId_idx" ON "commission_settlements"("commissionRuleId");

-- CreateIndex
CREATE INDEX "commission_settlements_agentId_idx" ON "commission_settlements"("agentId");

-- CreateIndex
CREATE INDEX "commission_settlements_bookingId_idx" ON "commission_settlements"("bookingId");

-- CreateIndex
CREATE INDEX "commission_settlements_settlementStatus_idx" ON "commission_settlements"("settlementStatus");

-- CreateIndex
CREATE INDEX "commission_settlements_bookingId_settlementStatus_idx" ON "commission_settlements"("bookingId", "settlementStatus");

-- CreateIndex
CREATE UNIQUE INDEX "markup_rules_code_key" ON "markup_rules"("code");

-- CreateIndex
CREATE INDEX "markup_rules_code_idx" ON "markup_rules"("code");

-- CreateIndex
CREATE INDEX "markup_rules_companyId_idx" ON "markup_rules"("companyId");

-- CreateIndex
CREATE INDEX "markup_rules_isActive_idx" ON "markup_rules"("isActive");

-- CreateIndex
CREATE INDEX "pricing_audit_log_userId_idx" ON "pricing_audit_log"("userId");

-- CreateIndex
CREATE INDEX "pricing_audit_log_bookingId_idx" ON "pricing_audit_log"("bookingId");

-- CreateIndex
CREATE INDEX "pricing_audit_log_action_idx" ON "pricing_audit_log"("action");

-- CreateIndex
CREATE INDEX "pricing_audit_log_timestamp_idx" ON "pricing_audit_log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_contracts_contractNumber_key" ON "corporate_contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "corporate_contracts_companyId_idx" ON "corporate_contracts"("companyId");

-- CreateIndex
CREATE INDEX "corporate_contracts_isActive_idx" ON "corporate_contracts"("isActive");

-- CreateIndex
CREATE INDEX "campaigns_companyId_idx" ON "campaigns"("companyId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns"("status");

-- CreateIndex
CREATE INDEX "marketing_campaigns_campaignType_idx" ON "marketing_campaigns"("campaignType");

-- CreateIndex
CREATE UNIQUE INDEX "discount_coupons_code_key" ON "discount_coupons"("code");

-- CreateIndex
CREATE INDEX "discount_coupons_code_idx" ON "discount_coupons"("code");

-- CreateIndex
CREATE INDEX "discount_coupons_companyId_idx" ON "discount_coupons"("companyId");

-- CreateIndex
CREATE INDEX "discount_coupons_isActive_idx" ON "discount_coupons"("isActive");

-- CreateIndex
CREATE INDEX "discount_coupons_isActive_validFrom_validTo_idx" ON "discount_coupons"("isActive", "validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_isActive_idx" ON "promo_codes"("isActive");

-- CreateIndex
CREATE INDEX "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_bookingId_idx" ON "coupon_redemptions"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_code_idx" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "suppliers_deletedAt_idx" ON "suppliers"("deletedAt");

-- CreateIndex
CREATE INDEX "supplier_credentials_supplierId_idx" ON "supplier_credentials"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_sync_logs_supplierId_idx" ON "supplier_sync_logs"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_sync_logs_status_idx" ON "supplier_sync_logs"("status");

-- CreateIndex
CREATE INDEX "supplier_hotel_mappings_supplierId_idx" ON "supplier_hotel_mappings"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_hotel_mappings_supplierHotelId_idx" ON "supplier_hotel_mappings"("supplierHotelId");

-- CreateIndex
CREATE INDEX "supplier_hotel_mappings_status_idx" ON "supplier_hotel_mappings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_deals_code_key" ON "supplier_deals"("code");

-- CreateIndex
CREATE INDEX "supplier_deals_supplierId_idx" ON "supplier_deals"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_deals_dealType_idx" ON "supplier_deals"("dealType");

-- CreateIndex
CREATE INDEX "supplier_deals_isActive_idx" ON "supplier_deals"("isActive");

-- CreateIndex
CREATE INDEX "supplier_deals_code_idx" ON "supplier_deals"("code");

-- CreateIndex
CREATE INDEX "deal_mapping_rules_dealId_idx" ON "deal_mapping_rules"("dealId");

-- CreateIndex
CREATE INDEX "deal_mapping_rules_isActive_idx" ON "deal_mapping_rules"("isActive");

-- CreateIndex
CREATE INDEX "supplier_products_supplierId_idx" ON "supplier_products"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_products_productType_idx" ON "supplier_products"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_products_supplierId_externalProductId_key" ON "supplier_products"("supplierId", "externalProductId");

-- CreateIndex
CREATE INDEX "supplier_product_mappings_supplierId_idx" ON "supplier_product_mappings"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_product_mappings_productType_idx" ON "supplier_product_mappings"("productType");

-- CreateIndex
CREATE INDEX "supplier_product_mappings_status_idx" ON "supplier_product_mappings"("status");

-- CreateIndex
CREATE INDEX "product_mapping_parameters_mappingId_idx" ON "product_mapping_parameters"("mappingId");

-- CreateIndex
CREATE INDEX "product_mapping_parameters_parameterType_idx" ON "product_mapping_parameters"("parameterType");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_financials_supplierId_key" ON "supplier_financials"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_financials_supplierId_idx" ON "supplier_financials"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_payment_terms_supplierId_idx" ON "supplier_payment_terms"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_wallets_supplierId_key" ON "supplier_wallets"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_wallets_supplierId_idx" ON "supplier_wallets"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_wallets_status_idx" ON "supplier_wallets"("status");

-- CreateIndex
CREATE INDEX "supplier_wallets_approvalStatus_idx" ON "supplier_wallets"("approvalStatus");

-- CreateIndex
CREATE INDEX "supplier_wallet_approval_requests_supplierId_idx" ON "supplier_wallet_approval_requests"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_wallet_approval_requests_status_idx" ON "supplier_wallet_approval_requests"("status");

-- CreateIndex
CREATE INDEX "supplier_wallet_approval_requests_expiresAt_idx" ON "supplier_wallet_approval_requests"("expiresAt");

-- CreateIndex
CREATE INDEX "supplier_payments_supplierId_idx" ON "supplier_payments"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_payments_walletId_idx" ON "supplier_payments"("walletId");

-- CreateIndex
CREATE INDEX "supplier_payments_status_idx" ON "supplier_payments"("status");

-- CreateIndex
CREATE INDEX "supplier_payments_createdAt_idx" ON "supplier_payments"("createdAt");

-- CreateIndex
CREATE INDEX "supplier_payments_walletId_status_createdAt_idx" ON "supplier_payments"("walletId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_payment_logs_supplierId_idx" ON "supplier_payment_logs"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_payment_logs_walletId_idx" ON "supplier_payment_logs"("walletId");

-- CreateIndex
CREATE INDEX "supplier_payment_logs_action_idx" ON "supplier_payment_logs"("action");

-- CreateIndex
CREATE INDEX "supplier_payment_logs_createdAt_idx" ON "supplier_payment_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_offer_requests_externalId_key" ON "duffel_offer_requests"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_offers_externalId_key" ON "duffel_offers"("externalId");

-- CreateIndex
CREATE INDEX "duffel_offers_externalId_idx" ON "duffel_offers"("externalId");

-- CreateIndex
CREATE INDEX "duffel_offers_offerRequestId_idx" ON "duffel_offers"("offerRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_offer_cache_cacheKey_key" ON "duffel_offer_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_offer_cache_cacheKey_idx" ON "duffel_offer_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_offer_cache_expiresAt_idx" ON "duffel_offer_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_offer_request_cache_cacheKey_key" ON "duffel_offer_request_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_offer_request_cache_cacheKey_idx" ON "duffel_offer_request_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_offer_request_cache_expiresAt_idx" ON "duffel_offer_request_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_orders_externalId_key" ON "duffel_orders"("externalId");

-- CreateIndex
CREATE INDEX "duffel_orders_externalId_idx" ON "duffel_orders"("externalId");

-- CreateIndex
CREATE INDEX "duffel_orders_bookingReference_idx" ON "duffel_orders"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_order_cache_cacheKey_key" ON "duffel_order_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_order_cache_cacheKey_idx" ON "duffel_order_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_order_cache_expiresAt_idx" ON "duffel_order_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_order_cancellations_externalId_key" ON "duffel_order_cancellations"("externalId");

-- CreateIndex
CREATE INDEX "duffel_order_cancellations_orderId_idx" ON "duffel_order_cancellations"("orderId");

-- CreateIndex
CREATE INDEX "duffel_order_cancellations_userId_idx" ON "duffel_order_cancellations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_order_changes_externalId_key" ON "duffel_order_changes"("externalId");

-- CreateIndex
CREATE INDEX "duffel_order_changes_orderId_idx" ON "duffel_order_changes"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_seat_map_cache_cacheKey_key" ON "duffel_seat_map_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_seat_map_cache_cacheKey_idx" ON "duffel_seat_map_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_seat_map_cache_expiresAt_idx" ON "duffel_seat_map_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_services_cache_cacheKey_key" ON "duffel_services_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_services_cache_cacheKey_idx" ON "duffel_services_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_services_cache_expiresAt_idx" ON "duffel_services_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "duffel_cancellation_cache_cacheKey_key" ON "duffel_cancellation_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_cancellation_cache_cacheKey_idx" ON "duffel_cancellation_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "duffel_cancellation_cache_expiresAt_idx" ON "duffel_cancellation_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "exchange_rates_targetCurrency_idx" ON "exchange_rates"("targetCurrency");

-- CreateIndex
CREATE INDEX "exchange_rates_fetchedAt_idx" ON "exchange_rates"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_source_baseCurrency_targetCurrency_key" ON "exchange_rates"("source", "baseCurrency", "targetCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "kiwi_booking_holds_bookingId_key" ON "kiwi_booking_holds"("bookingId");

-- CreateIndex
CREATE INDEX "kiwi_booking_holds_status_idx" ON "kiwi_booking_holds"("status");

-- CreateIndex
CREATE INDEX "kiwi_booking_holds_expiresAt_idx" ON "kiwi_booking_holds"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "kiwi_settlements_settlementId_key" ON "kiwi_settlements"("settlementId");

-- CreateIndex
CREATE INDEX "kiwi_settlements_bookingId_idx" ON "kiwi_settlements"("bookingId");

-- CreateIndex
CREATE INDEX "kiwi_settlements_walletId_idx" ON "kiwi_settlements"("walletId");

-- CreateIndex
CREATE INDEX "kiwi_settlements_status_idx" ON "kiwi_settlements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "kiwi_refunds_refundId_key" ON "kiwi_refunds"("refundId");

-- CreateIndex
CREATE INDEX "kiwi_refunds_bookingId_idx" ON "kiwi_refunds"("bookingId");

-- CreateIndex
CREATE INDEX "kiwi_refunds_walletId_idx" ON "kiwi_refunds"("walletId");

-- CreateIndex
CREATE INDEX "kiwi_refunds_status_idx" ON "kiwi_refunds"("status");

-- CreateIndex
CREATE INDEX "kiwi_price_changes_bookingId_idx" ON "kiwi_price_changes"("bookingId");

-- CreateIndex
CREATE INDEX "kiwi_price_changes_walletId_idx" ON "kiwi_price_changes"("walletId");

-- CreateIndex
CREATE INDEX "kiwi_price_changes_status_idx" ON "kiwi_price_changes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "offline_change_requests_requestRef_key" ON "offline_change_requests"("requestRef");

-- CreateIndex
CREATE INDEX "offline_change_requests_bookingId_idx" ON "offline_change_requests"("bookingId");

-- CreateIndex
CREATE INDEX "offline_change_requests_bookingRef_idx" ON "offline_change_requests"("bookingRef");

-- CreateIndex
CREATE INDEX "offline_change_requests_requestRef_idx" ON "offline_change_requests"("requestRef");

-- CreateIndex
CREATE INDEX "offline_change_requests_status_idx" ON "offline_change_requests"("status");

-- CreateIndex
CREATE INDEX "offline_change_requests_priority_idx" ON "offline_change_requests"("priority");

-- CreateIndex
CREATE INDEX "offline_change_requests_requestType_idx" ON "offline_change_requests"("requestType");

-- CreateIndex
CREATE INDEX "offline_change_requests_createdAt_idx" ON "offline_change_requests"("createdAt");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_offlineRequestId_idx" ON "offline_request_audit_logs"("offlineRequestId");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_action_idx" ON "offline_request_audit_logs"("action");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_createdAt_idx" ON "offline_request_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "offline_request_notification_queue_offlineRequestId_idx" ON "offline_request_notification_queue"("offlineRequestId");

-- CreateIndex
CREATE INDEX "offline_request_notification_queue_notificationType_idx" ON "offline_request_notification_queue"("notificationType");

-- CreateIndex
CREATE INDEX "offline_request_notification_queue_status_idx" ON "offline_request_notification_queue"("status");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_bookingId_idx" ON "documents"("bookingId");

-- CreateIndex
CREATE INDEX "documents_templateId_idx" ON "documents"("templateId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex
CREATE INDEX "documents_userId_type_status_idx" ON "documents"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "document_access_documentId_idx" ON "document_access"("documentId");

-- CreateIndex
CREATE INDEX "document_access_userId_idx" ON "document_access"("userId");

-- CreateIndex
CREATE INDEX "document_access_action_idx" ON "document_access"("action");

-- CreateIndex
CREATE INDEX "document_access_timestamp_idx" ON "document_access"("timestamp");

-- CreateIndex
CREATE INDEX "document_retention_documentId_idx" ON "document_retention"("documentId");

-- CreateIndex
CREATE INDEX "document_templates_type_idx" ON "document_templates"("type");

-- CreateIndex
CREATE INDEX "document_templates_isActive_idx" ON "document_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_name_type_version_key" ON "document_templates"("name", "type", "version");

-- CreateIndex
CREATE INDEX "disputes_bookingId_idx" ON "disputes"("bookingId");

-- CreateIndex
CREATE INDEX "disputes_userId_idx" ON "disputes"("userId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "settlements_bookingId_idx" ON "settlements"("bookingId");

-- CreateIndex
CREATE INDEX "settlements_walletId_idx" ON "settlements"("walletId");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_createdAt_idx" ON "audit_logs"("resource", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "circuit_breakers_state_idx" ON "circuit_breakers"("state");

-- CreateIndex
CREATE UNIQUE INDEX "circuit_breakers_service_channel_key" ON "circuit_breakers"("service", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "airports_iataCode_key" ON "airports"("iataCode");

-- CreateIndex
CREATE INDEX "airports_iataCode_idx" ON "airports"("iataCode");

-- CreateIndex
CREATE INDEX "airports_city_idx" ON "airports"("city");

-- CreateIndex
CREATE INDEX "airports_countryCode_idx" ON "airports"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_iataCode_key" ON "airlines"("iataCode");

-- CreateIndex
CREATE INDEX "airlines_iataCode_idx" ON "airlines"("iataCode");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_code_key" ON "destinations"("code");

-- CreateIndex
CREATE INDEX "destinations_code_idx" ON "destinations"("code");

-- CreateIndex
CREATE INDEX "destinations_type_idx" ON "destinations"("type");

-- CreateIndex
CREATE INDEX "destinations_countryCode_idx" ON "destinations"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_amenities_code_key" ON "hotel_amenities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "board_types_code_key" ON "board_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_statuses" ADD CONSTRAINT "channel_statuses_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_retries" ADD CONSTRAINT "notification_retries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_analytics" ADD CONSTRAINT "notification_analytics_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_targets" ADD CONSTRAINT "notification_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dead_letter_queue" ADD CONSTRAINT "dead_letter_queue_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_executions" ADD CONSTRAINT "rule_executions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_analyses" ADD CONSTRAINT "rule_analyses_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_modifications" ADD CONSTRAINT "booking_modifications_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prebook_sessions" ADD CONSTRAINT "prebook_sessions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "wallet_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_reconciliations" ADD CONSTRAINT "wallet_reconciliations_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_loyaltyTierId_fkey" FOREIGN KEY ("loyaltyTierId") REFERENCES "loyalty_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerLoyaltyId_fkey" FOREIGN KEY ("customerLoyaltyId") REFERENCES "customer_loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_vouchers" ADD CONSTRAINT "loyalty_vouchers_customerLoyaltyId_fkey" FOREIGN KEY ("customerLoyaltyId") REFERENCES "customer_loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_settlements" ADD CONSTRAINT "commission_settlements_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "commission_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markup_rules" ADD CONSTRAINT "markup_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_contracts" ADD CONSTRAINT "corporate_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_coupons" ADD CONSTRAINT "discount_coupons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "discount_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_credentials" ADD CONSTRAINT "supplier_credentials_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_sync_logs" ADD CONSTRAINT "supplier_sync_logs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_hotel_mappings" ADD CONSTRAINT "supplier_hotel_mappings_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_deals" ADD CONSTRAINT "supplier_deals_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_mapping_rules" ADD CONSTRAINT "deal_mapping_rules_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "supplier_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_product_mappings" ADD CONSTRAINT "supplier_product_mappings_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_product_mappings" ADD CONSTRAINT "supplier_product_mappings_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "supplier_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mapping_parameters" ADD CONSTRAINT "product_mapping_parameters_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "supplier_product_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_financials" ADD CONSTRAINT "supplier_financials_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payment_terms" ADD CONSTRAINT "supplier_payment_terms_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payment_terms" ADD CONSTRAINT "supplier_payment_terms_financialId_fkey" FOREIGN KEY ("financialId") REFERENCES "supplier_financials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_wallets" ADD CONSTRAINT "supplier_wallets_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_wallet_approval_requests" ADD CONSTRAINT "supplier_wallet_approval_requests_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_wallet_approval_requests" ADD CONSTRAINT "supplier_wallet_approval_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "supplier_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "supplier_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payment_logs" ADD CONSTRAINT "supplier_payment_logs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payment_logs" ADD CONSTRAINT "supplier_payment_logs_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "supplier_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_request_audit_logs" ADD CONSTRAINT "offline_request_audit_logs_offlineRequestId_fkey" FOREIGN KEY ("offlineRequestId") REFERENCES "offline_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_request_notification_queue" ADD CONSTRAINT "offline_request_notification_queue_offlineRequestId_fkey" FOREIGN KEY ("offlineRequestId") REFERENCES "offline_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access" ADD CONSTRAINT "document_access_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_retention" ADD CONSTRAINT "document_retention_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
