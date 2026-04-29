-- ============================================================
-- OTA PLATFORM - SERVICE TYPE DATA MIGRATION
-- Run BEFORE applying the Prisma schema migration that
-- promotes Booking.serviceType from String to SalesChannel enum.
-- ============================================================

-- Step 1: Normalise legacy B2C free-text values → WEBSITE channel
UPDATE bookings
SET    "serviceType" = 'WEBSITE'
WHERE  lower("serviceType") IN ('b2c', 'web', 'website', 'consumer', 'b2c_web')
  AND  "salesChannel" IN ('WEBSITE', 'MOBILE');

-- Step 2: Normalise legacy B2B free-text values → matching SalesChannel
UPDATE bookings
SET    "serviceType" = 'SUBAGENT'
WHERE  lower("serviceType") IN ('b2b', 'agent', 'subagent', 'b2b_agent');

UPDATE bookings
SET    "serviceType" = 'POS_DC'
WHERE  lower("serviceType") IN ('pos', 'pos_dc', 'direct');

UPDATE bookings
SET    "serviceType" = 'POS_SA'
WHERE  lower("serviceType") IN ('pos_sa', 'sales_agent');

-- Step 3: NULL out any remaining unrecognised values
-- (Prisma will reject them during migration otherwise)
UPDATE bookings
SET    "serviceType" = NULL
WHERE  "serviceType" IS NOT NULL
  AND  "serviceType" NOT IN (
         'POS_DC', 'POS_SA', 'POS_CA', 'SUBAGENT', 'WEBSITE', 'MOBILE'
       );

-- Step 4: Normalise PrebookSession.salesChannel (same pattern)
UPDATE prebook_sessions
SET    "salesChannel" = 'WEBSITE'
WHERE  lower("salesChannel") IN ('b2c', 'web', 'website', 'consumer');

UPDATE prebook_sessions
SET    "salesChannel" = 'SUBAGENT'
WHERE  "salesChannel" NOT IN (
         'POS_DC', 'POS_SA', 'POS_CA', 'SUBAGENT', 'WEBSITE', 'MOBILE'
       );

-- Verification query — run after to confirm zero invalid rows
SELECT COUNT(*) AS invalid_booking_service_type
FROM   bookings
WHERE  "serviceType" IS NOT NULL
  AND  "serviceType" NOT IN (
         'POS_DC', 'POS_SA', 'POS_CA', 'SUBAGENT', 'WEBSITE', 'MOBILE'
       );
