-- CreateEnum for DocumentType
CREATE TYPE "DocumentType" AS ENUM ('BOOKING_CONFIRMATION', 'INVOICE', 'RECEIPT', 'OFFLINE_REQUEST_CONFIRMATION');

-- CreateEnum for GenerationStatus
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED', 'SENT', 'ARCHIVED');

-- CreateEnum for DocumentFormat
CREATE TYPE "DocumentFormat" AS ENUM ('HTML', 'PDF', 'BOTH');

-- CreateTable DocumentTemplate
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "format" "DocumentFormat" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "GenerationStatus" NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "templateId" TEXT NOT NULL,
    "storagePath" TEXT,
    "metadata" JSONB,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentAccess
CREATE TABLE "DocumentAccess" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentRetention
CREATE TABLE "DocumentRetention" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "autoDelete" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRetention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for DocumentTemplate
CREATE UNIQUE INDEX "DocumentTemplate_name_type_version_key" ON "DocumentTemplate"("name", "type", "version");
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");
CREATE INDEX "DocumentTemplate_isActive_idx" ON "DocumentTemplate"("isActive");
CREATE INDEX "DocumentTemplate_createdAt_idx" ON "DocumentTemplate"("createdAt");

-- CreateIndex for Document
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_bookingId_idx" ON "Document"("bookingId");
CREATE INDEX "Document_invoiceId_idx" ON "Document"("invoiceId");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_templateId_idx" ON "Document"("templateId");
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex for DocumentAccess
CREATE INDEX "DocumentAccess_documentId_idx" ON "DocumentAccess"("documentId");
CREATE INDEX "DocumentAccess_userId_idx" ON "DocumentAccess"("userId");
CREATE INDEX "DocumentAccess_action_idx" ON "DocumentAccess"("action");
CREATE INDEX "DocumentAccess_timestamp_idx" ON "DocumentAccess"("timestamp");

-- CreateIndex for DocumentRetention
CREATE UNIQUE INDEX "DocumentRetention_documentType_key" ON "DocumentRetention"("documentType");
CREATE INDEX "DocumentRetention_documentType_idx" ON "DocumentRetention"("documentType");

-- AddForeignKey for Document
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for DocumentAccess
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default retention policies
INSERT INTO "DocumentRetention" ("id", "documentType", "retentionDays", "autoDelete", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, 'BOOKING_CONFIRMATION'::text::"DocumentType", 730, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'INVOICE'::text::"DocumentType", 2555, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'RECEIPT'::text::"DocumentType", 365, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'OFFLINE_REQUEST_CONFIRMATION'::text::"DocumentType", 730, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
