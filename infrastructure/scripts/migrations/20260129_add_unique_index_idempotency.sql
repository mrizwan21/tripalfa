-- Migration: ensure unique index on notifications.idempotency_key
-- This migration creates a unique index to support ON CONFLICT(idempotency_key)
-- Run this in your migration system or via psql against your Neon DB.

-- Note: creating a unique index concurrently is recommended in production,
-- but some managed providers restrict concurrent index creation in transactions.
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_idempotency ON notifications (idempotency_key);
