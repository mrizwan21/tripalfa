-- Idempotent index creation for notifications (safe for main branch)
-- Uses DROP IF EXISTS for compatibility across PostgreSQL versions.
-- For Postgres versions that support CONCURRENTLY, this file recommends running with CONCURRENTLY in production.

-- Non-concurrent safe creation (works during deploy when locks are acceptable):
DROP INDEX IF EXISTS idx_superadmin_notifications_tenant_created_at;
CREATE INDEX idx_superadmin_notifications_tenant_created_at ON superadmin_notifications (tenant_id, created_at DESC);

-- If you prefer to create the index without locking reads/writes in production,
-- run the following command manually (outside of a transaction) on PostgreSQL 9.6+:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_superadmin_notifications_tenant_created_at
-- ON superadmin_notifications (tenant_id, created_at DESC);
