-- Migration: Add CRM Enhancements
-- Description: Adds tier field to crm_contact, lead scoring table, and visitor analytics tables
-- Schema: finance
-- Date: 2026-03-31

-- 1. Add tier and related fields to crm_contact table
ALTER TABLE "crm_contact" 
ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS "totalBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalSpent" NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "bookingsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "openTicketsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "location" TEXT;

-- Create index on tier for faster filtering
CREATE INDEX IF NOT EXISTS "crm_contact_tier_idx" ON "crm_contact"("tier");

-- 2. Create crm_lead_score table
CREATE TABLE IF NOT EXISTS "crm_lead_score" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contactId" TEXT UNIQUE,
  "email" TEXT UNIQUE,
  "score" INTEGER NOT NULL DEFAULT 0,
  "grade" TEXT NOT NULL DEFAULT 'D',
  "emailsReceived" INTEGER NOT NULL DEFAULT 0,
  "lastEngagementDate" TIMESTAMPTZ,
  "source" TEXT,
  "interests" TEXT[] DEFAULT '{}',
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "searchQueries" INTEGER NOT NULL DEFAULT 0,
  "conversionProbability" NUMERIC(5,2),
  "lastCalculatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "crm_lead_score_contactId_fkey" FOREIGN KEY ("contactId") 
    REFERENCES "crm_contact" ("id") ON DELETE CASCADE
);

-- Create indexes for crm_lead_score
CREATE INDEX IF NOT EXISTS "crm_lead_score_contactId_idx" ON "crm_lead_score"("contactId");
CREATE INDEX IF NOT EXISTS "crm_lead_score_email_idx" ON "crm_lead_score"("email");
CREATE INDEX IF NOT EXISTS "crm_lead_score_score_idx" ON "crm_lead_score"("score");
CREATE INDEX IF NOT EXISTS "crm_lead_score_grade_idx" ON "crm_lead_score"("grade");
CREATE INDEX IF NOT EXISTS "crm_lead_score_lastEngagementDate_idx" ON "crm_lead_score"("lastEngagementDate");

-- 3. Create crm_visitor_session table
CREATE TABLE IF NOT EXISTS "crm_visitor_session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT UNIQUE,
  "visitorId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "landingPage" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "startTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endTime" TIMESTAMPTZ,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "durationSeconds" INTEGER DEFAULT 0,
  "converted" BOOLEAN NOT NULL DEFAULT false,
  "conversionType" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for crm_visitor_session
CREATE INDEX IF NOT EXISTS "crm_visitor_session_sessionId_idx" ON "crm_visitor_session"("sessionId");
CREATE INDEX IF NOT EXISTS "crm_visitor_session_visitorId_idx" ON "crm_visitor_session"("visitorId");
CREATE INDEX IF NOT EXISTS "crm_visitor_session_startTime_idx" ON "crm_visitor_session"("startTime");
CREATE INDEX IF NOT EXISTS "crm_visitor_session_country_idx" ON "crm_visitor_session"("country");
CREATE INDEX IF NOT EXISTS "crm_visitor_session_converted_idx" ON "crm_visitor_session"("converted");

-- 4. Create crm_visitor_page_view table
CREATE TABLE IF NOT EXISTS "crm_visitor_page_view" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "pageUrl" TEXT NOT NULL,
  "pageTitle" TEXT,
  "pageCategory" TEXT,
  "timeOnPageSeconds" INTEGER DEFAULT 0,
  "scrollDepth" NUMERIC(5,2),
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "crm_visitor_page_view_sessionId_fkey" FOREIGN KEY ("sessionId") 
    REFERENCES "crm_visitor_session"("sessionId") ON DELETE CASCADE
);

-- Create indexes for crm_visitor_page_view
CREATE INDEX IF NOT EXISTS "crm_visitor_page_view_sessionId_idx" ON "crm_visitor_page_view"("sessionId");
CREATE INDEX IF NOT EXISTS "crm_visitor_page_view_timestamp_idx" ON "crm_visitor_page_view"("timestamp");
CREATE INDEX IF NOT EXISTS "crm_visitor_page_view_pageCategory_idx" ON "crm_visitor_page_view"("pageCategory");

-- 5. Create crm_visitor_event table
CREATE TABLE IF NOT EXISTS "crm_visitor_event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "elementId" TEXT,
  "elementClass" TEXT,
  "elementText" TEXT,
  "url" TEXT,
  "metadata" JSONB,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "crm_visitor_event_sessionId_fkey" FOREIGN KEY ("sessionId") 
    REFERENCES "crm_visitor_session"("sessionId") ON DELETE CASCADE
);

-- Create indexes for crm_visitor_event
CREATE INDEX IF NOT EXISTS "crm_visitor_event_sessionId_idx" ON "crm_visitor_event"("sessionId");
CREATE INDEX IF NOT EXISTS "crm_visitor_event_eventType_idx" ON "crm_visitor_event"("eventType");
CREATE INDEX IF NOT EXISTS "crm_visitor_event_timestamp_idx" ON "crm_visitor_event"("timestamp");

-- Add updated_at trigger for crm_lead_score
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_lead_score_updated_at_trigger
BEFORE UPDATE ON "crm_lead_score"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Migration completed
COMMENT ON MIGRATION IS 'Added CRM enhancements: tier field, lead scoring, and visitor analytics';