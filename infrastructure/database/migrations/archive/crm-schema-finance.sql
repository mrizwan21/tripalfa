-- Migration: Add CRM Models to Finance Database
-- Description: Adds contact, activity, campaign, and campaign_contact tables to finance database
-- Schema: finance
-- Date: 2025-03-30

-- crm_contact table
CREATE TABLE "crm_contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "status" TEXT NOT NULL DEFAULT 'lead',
  "source" TEXT,
  "lastInteractionAt" TIMESTAMPTZ,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "crm_contact_email_idx" ON "crm_contact"("email");
CREATE INDEX "crm_contact_status_idx" ON "crm_contact"("status");
CREATE INDEX "crm_contact_source_idx" ON "crm_contact"("source");

-- crm_activity table
CREATE TABLE "crm_activity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "crm_activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contact" ("id") ON DELETE CASCADE
);

CREATE INDEX "crm_activity_contactId_idx" ON "crm_activity"("contactId");
CREATE INDEX "crm_activity_activityType_idx" ON "crm_activity"("activityType");
CREATE INDEX "crm_activity_status_idx" ON "crm_activity"("status");

-- crm_campaign table
CREATE TABLE "crm_campaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "type" TEXT NOT NULL,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "targetAudience" TEXT,
  "budget" NUMERIC(12, 2),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "crm_campaign_status_idx" ON "crm_campaign"("status");
CREATE INDEX "crm_campaign_type_idx" ON "crm_campaign"("type");

-- crm_campaign_contact table (junction table)
CREATE TABLE "crm_campaign_contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "engagement" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("campaignId", "contactId"),
  CONSTRAINT "crm_campaign_contact_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "crm_campaign" ("id") ON DELETE CASCADE,
  CONSTRAINT "crm_campaign_contact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contact" ("id") ON DELETE CASCADE
);

CREATE INDEX "crm_campaign_contact_campaignId_idx" ON "crm_campaign_contact"("campaignId");
CREATE INDEX "crm_campaign_contact_contactId_idx" ON "crm_campaign_contact"("contactId");
CREATE INDEX "crm_campaign_contact_status_idx" ON "crm_campaign_contact"("status");

-- Add updated triggers for auto-updating updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_contact_updated_at_trigger
BEFORE UPDATE ON "crm_contact"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_activity_updated_at_trigger
BEFORE UPDATE ON "crm_activity"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_campaign_updated_at_trigger
BEFORE UPDATE ON "crm_campaign"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_campaign_contact_updated_at_trigger
BEFORE UPDATE ON "crm_campaign_contact"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
