-- Migration: create notifications table (safe, zero-downtime friendly)
-- Run this using your migration tool (Prisma/migrations or psql).

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  channel text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  idempotency_key text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  delivered_at timestamptz
);

-- Indexes: create concurrently in production where supported
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications (user_id, created_at DESC);

-- Unique idempotency index (partial to allow NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_idempotency ON notifications (idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMIT;
