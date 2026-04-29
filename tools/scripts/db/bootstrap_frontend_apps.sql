-- Shared bootstrap for frontend app databases:
-- booking engine, b2b portal, call center, superadmin
-- Idempotent script: safe to run multiple times.

BEGIN;

INSERT INTO tenants (
  id, code, name, type, status, timezone, "baseCurrency", "createdAt", "updatedAt"
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'TRIPALFA',
  'TripAlfa Platform',
  'INTERNAL',
  'ACTIVE',
  'Asia/Bahrain',
  'USD',
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  timezone = EXCLUDED.timezone,
  "baseCurrency" = EXCLUDED."baseCurrency",
  "updatedAt" = NOW();

INSERT INTO tenant_application_access ("tenantId", app, "isEnabled", "activatedAt", "updatedAt")
SELECT t.id, a.app, true, NOW(), NOW()
FROM tenants t
CROSS JOIN (
  VALUES
    ('BOOKING_ENGINE'::"AppModule"),
    ('B2B_PORTAL'::"AppModule"),
    ('CALL_CENTER'::"AppModule"),
    ('SUPERADMIN'::"AppModule")
) AS a(app)
WHERE t.code = 'TRIPALFA'
ON CONFLICT ("tenantId", app) DO UPDATE SET
  "isEnabled" = EXCLUDED."isEnabled",
  "updatedAt" = NOW();

INSERT INTO permissions (id, code, resource, action, "createdAt")
VALUES
  (gen_random_uuid()::text, 'users.read', 'users', 'read', NOW()),
  (gen_random_uuid()::text, 'users.write', 'users', 'write', NOW()),
  (gen_random_uuid()::text, 'roles.read', 'roles', 'read', NOW()),
  (gen_random_uuid()::text, 'roles.write', 'roles', 'write', NOW()),
  (gen_random_uuid()::text, 'bookings.read', 'bookings', 'read', NOW()),
  (gen_random_uuid()::text, 'bookings.write', 'bookings', 'write', NOW()),
  (gen_random_uuid()::text, 'bookings.cancel', 'bookings', 'cancel', NOW()),
  (gen_random_uuid()::text, 'inventory.read', 'inventory', 'read', NOW()),
  (gen_random_uuid()::text, 'inventory.write', 'inventory', 'write', NOW()),
  (gen_random_uuid()::text, 'payments.read', 'payments', 'read', NOW()),
  (gen_random_uuid()::text, 'payments.write', 'payments', 'write', NOW()),
  (gen_random_uuid()::text, 'payments.refund', 'payments', 'refund', NOW()),
  (gen_random_uuid()::text, 'notifications.read', 'notifications', 'read', NOW()),
  (gen_random_uuid()::text, 'notifications.write', 'notifications', 'write', NOW()),
  (gen_random_uuid()::text, 'audit.read', 'audit', 'read', NOW()),
  (gen_random_uuid()::text, 'support_tickets.read', 'support_tickets', 'read', NOW()),
  (gen_random_uuid()::text, 'support_tickets.write', 'support_tickets', 'write', NOW()),
  (gen_random_uuid()::text, 'support_tickets.assign', 'support_tickets', 'assign', NOW()),
  (gen_random_uuid()::text, 'settings.read', 'settings', 'read', NOW()),
  (gen_random_uuid()::text, 'settings.write', 'settings', 'write', NOW()),
  (gen_random_uuid()::text, 'reports.read', 'reports', 'read', NOW())
ON CONFLICT (code) DO NOTHING;

WITH platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
)
INSERT INTO roles (id, "tenantId", code, name, "isSystem", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, pt.id, r.code, r.name, r.is_system, NOW(), NOW()
FROM platform_tenant pt
CROSS JOIN (
  VALUES
    ('SUPERADMIN', 'Super Administrator', true),
    ('BOOKING_ENGINE_MANAGER', 'Booking Engine Manager', true),
    ('B2B_PORTAL_MANAGER', 'B2B Portal Manager', true),
    ('CALL_CENTER_AGENT', 'Call Center Agent', true),
    ('FINANCE_MANAGER', 'Finance Manager', true)
) AS r(code, name, is_system)
ON CONFLICT ("tenantId", code) DO UPDATE SET
  name = EXCLUDED.name,
  "isSystem" = EXCLUDED."isSystem",
  "updatedAt" = NOW();

WITH role_permission_matrix AS (
  SELECT 'SUPERADMIN'::text AS role_code, p.code AS permission_code
  FROM permissions p
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'bookings.read'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'bookings.write'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'bookings.cancel'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'inventory.read'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'inventory.write'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'notifications.read'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'notifications.write'
  UNION ALL SELECT 'BOOKING_ENGINE_MANAGER', 'reports.read'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'bookings.read'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'bookings.write'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'payments.read'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'notifications.read'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'notifications.write'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'users.read'
  UNION ALL SELECT 'B2B_PORTAL_MANAGER', 'reports.read'
  UNION ALL SELECT 'CALL_CENTER_AGENT', 'support_tickets.read'
  UNION ALL SELECT 'CALL_CENTER_AGENT', 'support_tickets.write'
  UNION ALL SELECT 'CALL_CENTER_AGENT', 'support_tickets.assign'
  UNION ALL SELECT 'CALL_CENTER_AGENT', 'bookings.read'
  UNION ALL SELECT 'CALL_CENTER_AGENT', 'users.read'
  UNION ALL SELECT 'FINANCE_MANAGER', 'payments.read'
  UNION ALL SELECT 'FINANCE_MANAGER', 'payments.write'
  UNION ALL SELECT 'FINANCE_MANAGER', 'payments.refund'
  UNION ALL SELECT 'FINANCE_MANAGER', 'reports.read'
  UNION ALL SELECT 'FINANCE_MANAGER', 'audit.read'
),
platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
),
role_permission_ids AS (
  SELECT
    r.id AS role_id,
    p.id AS permission_id
  FROM role_permission_matrix rpm
  JOIN platform_tenant pt ON true
  JOIN roles r ON r."tenantId" = pt.id AND r.code = rpm.role_code
  JOIN permissions p ON p.code = rpm.permission_code
)
INSERT INTO role_permissions ("roleId", "permissionId", "grantedAt")
SELECT role_id, permission_id, NOW()
FROM role_permission_ids
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

WITH platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
)
INSERT INTO users (
  id,
  "tenantId",
  email,
  username,
  "firstName",
  "lastName",
  "passwordHash",
  status,
  "appScopes",
  "createdAt",
  "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000010',
  pt.id,
  'superadmin@tripalfa.local',
  'superadmin',
  'System',
  'Admin',
  '$2b$12$replace_this_with_real_bcrypt_hash_before_production',
  'ACTIVE',
  ARRAY[
    'BOOKING_ENGINE'::"AppModule",
    'B2B_PORTAL'::"AppModule",
    'CALL_CENTER'::"AppModule",
    'SUPERADMIN'::"AppModule"
  ],
  NOW(),
  NOW()
FROM platform_tenant pt
ON CONFLICT (email) DO UPDATE SET
  "tenantId" = EXCLUDED."tenantId",
  username = EXCLUDED.username,
  "appScopes" = EXCLUDED."appScopes",
  status = EXCLUDED.status,
  "updatedAt" = NOW();

WITH platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
),
superadmin_user AS (
  SELECT id FROM users WHERE email = 'superadmin@tripalfa.local'
),
superadmin_role AS (
  SELECT r.id
  FROM roles r
  JOIN platform_tenant pt ON pt.id = r."tenantId"
  WHERE r.code = 'SUPERADMIN'
)
INSERT INTO role_assignments ("userId", "roleId", "assignedAt")
SELECT su.id, sr.id, NOW()
FROM superadmin_user su
CROSS JOIN superadmin_role sr
ON CONFLICT ("userId", "roleId") DO NOTHING;

WITH platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
)
INSERT INTO booking_engine_preferences (
  "tenantId",
  "defaultCurrency",
  "defaultLocale",
  "enableInstantTicketing",
  "cancellationGraceMinutes",
  "searchCacheTtlSeconds",
  "pricingRulesVersion",
  "createdAt",
  "updatedAt"
)
SELECT
  pt.id,
  'USD',
  'en',
  true,
  30,
  120,
  1,
  NOW(),
  NOW()
FROM platform_tenant pt
ON CONFLICT ("tenantId") DO UPDATE SET
  "defaultCurrency" = EXCLUDED."defaultCurrency",
  "defaultLocale" = EXCLUDED."defaultLocale",
  "enableInstantTicketing" = EXCLUDED."enableInstantTicketing",
  "searchCacheTtlSeconds" = EXCLUDED."searchCacheTtlSeconds",
  "updatedAt" = NOW();

WITH platform_tenant AS (
  SELECT id FROM tenants WHERE code = 'TRIPALFA'
)
INSERT INTO b2b_organization_profiles (
  "tenantId",
  "companyName",
  "billingEmail",
  "supportEmail",
  "creditLimit",
  "paymentTermsDays",
  "allowSubAgents",
  "createdAt",
  "updatedAt"
)
SELECT
  pt.id,
  'TripAlfa B2B',
  'billing@tripalfa.local',
  'support@tripalfa.local',
  50000,
  15,
  true,
  NOW(),
  NOW()
FROM platform_tenant pt
ON CONFLICT ("tenantId") DO UPDATE SET
  "companyName" = EXCLUDED."companyName",
  "billingEmail" = EXCLUDED."billingEmail",
  "supportEmail" = EXCLUDED."supportEmail",
  "creditLimit" = EXCLUDED."creditLimit",
  "paymentTermsDays" = EXCLUDED."paymentTermsDays",
  "allowSubAgents" = EXCLUDED."allowSubAgents",
  "updatedAt" = NOW();

INSERT INTO superadmin_settings (id, key, value, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'platform.branding', '{"name":"TripAlfa"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid()::text, 'platform.support', '{"email":"support@tripalfa.local"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid()::text, 'feature.flags', '{"bookingEngine":true,"b2bPortal":true,"callCenter":true,"superAdmin":true}'::jsonb, NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  "updatedAt" = NOW();

COMMIT;
