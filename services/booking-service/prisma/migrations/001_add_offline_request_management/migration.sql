-- CreateTable "offline_change_requests"
CREATE TABLE "offline_change_requests" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_staff',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "originalDetails" JSONB NOT NULL,
    "requestedChanges" JSONB NOT NULL,
    "staffPricing" JSONB,
    "priceDifference" JSONB,
    "customerApproval" JSONB,
    "payment" JSONB,
    "reissuedDocuments" JSONB,
    "timeline" JSONB NOT NULL,
    "tags" TEXT[],
    "internalNotes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable "offline_request_audit_logs"
CREATE TABLE "offline_request_audit_logs" (
    "id" TEXT NOT NULL,
    "offlineRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_request_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable "offline_request_notification_queues"
CREATE TABLE "offline_request_notification_queues" (
    "id" TEXT NOT NULL,
    "offlineRequestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notificationType" TEXT NOT NULL,
    "recipientIds" TEXT[],
    "content" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_request_notification_queues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offline_change_requests_requestRef_key" ON "offline_change_requests"("requestRef");

-- CreateIndex
CREATE INDEX "offline_change_requests_bookingId_idx" ON "offline_change_requests"("bookingId");

-- CreateIndex
CREATE INDEX "offline_change_requests_bookingRef_idx" ON "offline_change_requests"("bookingRef");

-- CreateIndex
CREATE INDEX "offline_change_requests_status_idx" ON "offline_change_requests"("status");

-- CreateIndex
CREATE INDEX "offline_change_requests_requestType_idx" ON "offline_change_requests"("requestType");

-- CreateIndex
CREATE INDEX "offline_change_requests_priority_idx" ON "offline_change_requests"("priority");

-- CreateIndex
CREATE INDEX "offline_change_requests_createdAt_idx" ON "offline_change_requests"("createdAt");

-- CreateIndex
CREATE INDEX "offline_change_requests_requestRef_idx" ON "offline_change_requests"("requestRef");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_offlineRequestId_idx" ON "offline_request_audit_logs"("offlineRequestId");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_action_idx" ON "offline_request_audit_logs"("action");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_actorType_idx" ON "offline_request_audit_logs"("actorType");

-- CreateIndex
CREATE INDEX "offline_request_audit_logs_createdAt_idx" ON "offline_request_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "offline_request_notification_queues_offlineRequestId_idx" ON "offline_request_notification_queues"("offlineRequestId");

-- CreateIndex
CREATE INDEX "offline_request_notification_queues_status_idx" ON "offline_request_notification_queues"("status");

-- CreateIndex
CREATE INDEX "offline_request_notification_queues_notificationType_idx" ON "offline_request_notification_queues"("notificationType");

-- CreateIndex
CREATE INDEX "offline_request_notification_queues_createdAt_idx" ON "offline_request_notification_queues"("createdAt");

-- AddForeignKey
ALTER TABLE "offline_request_audit_logs" ADD CONSTRAINT "offline_request_audit_logs_offlineRequestId_fkey" FOREIGN KEY ("offlineRequestId") REFERENCES "offline_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_request_notification_queues" ADD CONSTRAINT "offline_request_notification_queues_offlineRequestId_fkey" FOREIGN KEY ("offlineRequestId") REFERENCES "offline_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
