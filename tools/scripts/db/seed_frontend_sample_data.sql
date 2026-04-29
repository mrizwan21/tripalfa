-- Sample business data seed for active frontend apps:
-- BOOKING_ENGINE, B2B_PORTAL, CALL_CENTER, SUPERADMIN
-- Safe to rerun (idempotent UPSERT style).

BEGIN;

-- ---------------------------------------------------------------------------
-- Users per app role
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, "tenantId", email, username, "firstName", "lastName", "passwordHash",
  status, "appScopes", "createdAt", "updatedAt"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'bookingmanager@tripalfa.local',
    'booking_manager',
    'Booking',
    'Manager',
    '$2b$12$replace_this_with_real_bcrypt_hash_before_production',
    'ACTIVE',
    ARRAY['BOOKING_ENGINE'::"AppModule"],
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    'b2bmanager@tripalfa.local',
    'b2b_manager',
    'B2B',
    'Manager',
    '$2b$12$replace_this_with_real_bcrypt_hash_before_production',
    'ACTIVE',
    ARRAY['B2B_PORTAL'::"AppModule"],
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000001',
    'callagent@tripalfa.local',
    'call_center_agent',
    'Call',
    'Agent',
    '$2b$12$replace_this_with_real_bcrypt_hash_before_production',
    'ACTIVE',
    ARRAY['CALL_CENTER'::"AppModule"],
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    'financemanager@tripalfa.local',
    'finance_manager',
    'Finance',
    'Manager',
    '$2b$12$replace_this_with_real_bcrypt_hash_before_production',
    'ACTIVE',
    ARRAY['SUPERADMIN'::"AppModule"],
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  "tenantId" = EXCLUDED."tenantId",
  username = EXCLUDED.username,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  status = EXCLUDED.status,
  "appScopes" = EXCLUDED."appScopes",
  "updatedAt" = NOW();

-- Role assignments for seeded users
INSERT INTO role_assignments ("userId", "roleId", "assignedAt")
SELECT u.id, r.id, NOW()
FROM users u
JOIN roles r
  ON r."tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE
  (u.email = 'bookingmanager@tripalfa.local' AND r.code = 'BOOKING_ENGINE_MANAGER') OR
  (u.email = 'b2bmanager@tripalfa.local' AND r.code = 'B2B_PORTAL_MANAGER') OR
  (u.email = 'callagent@tripalfa.local' AND r.code = 'CALL_CENTER_AGENT') OR
  (u.email = 'financemanager@tripalfa.local' AND r.code = 'FINANCE_MANAGER')
ON CONFLICT ("userId", "roleId") DO NOTHING;

INSERT INTO call_center_agent_profiles (
  "userId", "queueName", "skillTags", "maxConcurrentTickets", "isAvailable", "createdAt", "updatedAt"
)
VALUES (
  '00000000-0000-0000-0000-000000000022',
  'general-support',
  ARRAY['booking', 'payment', 'refund'],
  12,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "queueName" = EXCLUDED."queueName",
  "skillTags" = EXCLUDED."skillTags",
  "maxConcurrentTickets" = EXCLUDED."maxConcurrentTickets",
  "isAvailable" = EXCLUDED."isAvailable",
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
INSERT INTO customers (
  id, "tenantId", "externalRef", "firstName", "lastName", email, phone, "countryCode", "createdAt", "updatedAt"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'CUST-1001',
    'John',
    'Smith',
    'john.smith@example.com',
    '+97330001001',
    'BH',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'CUST-1002',
    'Aisha',
    'Rahman',
    'aisha.rahman@example.com',
    '+97330001002',
    'AE',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'CUST-1003',
    'David',
    'Miller',
    'david.miller@example.com',
    '+97330001003',
    'SA',
    NOW(),
    NOW()
  )
ON CONFLICT ("tenantId", email) DO UPDATE SET
  "externalRef" = EXCLUDED."externalRef",
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  phone = EXCLUDED.phone,
  "countryCode" = EXCLUDED."countryCode",
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Hotels, room types, inventory
-- ---------------------------------------------------------------------------
INSERT INTO hotels (
  id, "externalHotelCode", name, city, country, "addressLine", "starRating", "isActive", "createdAt", "updatedAt"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    'TA-HOTEL-001',
    'TripAlfa Downtown Hotel',
    'Manama',
    'BH',
    'Diplomatic Area',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'TA-HOTEL-002',
    'TripAlfa Beach Resort',
    'Dubai',
    'AE',
    'Jumeirah Beach Road',
    5,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT ("externalHotelCode") DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  "addressLine" = EXCLUDED."addressLine",
  "starRating" = EXCLUDED."starRating",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO room_types (
  id, "hotelId", code, name, status, "capacityAdults", "capacityChildren", "maxGuests", "baseCurrency", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000301',
  h.id,
  'DLX',
  'Deluxe Room',
  'ACTIVE',
  2,
  1,
  3,
  'USD',
  NOW(),
  NOW()
FROM hotels h
WHERE h."externalHotelCode" = 'TA-HOTEL-001'
ON CONFLICT ("hotelId", code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  "capacityAdults" = EXCLUDED."capacityAdults",
  "capacityChildren" = EXCLUDED."capacityChildren",
  "maxGuests" = EXCLUDED."maxGuests",
  "updatedAt" = NOW();

INSERT INTO room_types (
  id, "hotelId", code, name, status, "capacityAdults", "capacityChildren", "maxGuests", "baseCurrency", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000302',
  h.id,
  'STE',
  'Executive Suite',
  'ACTIVE',
  2,
  2,
  4,
  'USD',
  NOW(),
  NOW()
FROM hotels h
WHERE h."externalHotelCode" = 'TA-HOTEL-002'
ON CONFLICT ("hotelId", code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  "capacityAdults" = EXCLUDED."capacityAdults",
  "capacityChildren" = EXCLUDED."capacityChildren",
  "maxGuests" = EXCLUDED."maxGuests",
  "updatedAt" = NOW();

INSERT INTO room_inventory (
  id, "roomTypeId", "stayDate", "availableCount", "soldCount", "baseRate", "taxRate", currency, "closedOut", "minStay", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000401',
  rt.id,
  DATE '2026-05-05',
  25,
  3,
  125.00,
  10.00,
  'USD',
  false,
  1,
  NOW(),
  NOW()
FROM room_types rt
JOIN hotels h ON h.id = rt."hotelId"
WHERE h."externalHotelCode" = 'TA-HOTEL-001' AND rt.code = 'DLX'
ON CONFLICT ("roomTypeId", "stayDate") DO UPDATE SET
  "availableCount" = EXCLUDED."availableCount",
  "soldCount" = EXCLUDED."soldCount",
  "baseRate" = EXCLUDED."baseRate",
  "taxRate" = EXCLUDED."taxRate",
  "updatedAt" = NOW();

INSERT INTO room_inventory (
  id, "roomTypeId", "stayDate", "availableCount", "soldCount", "baseRate", "taxRate", currency, "closedOut", "minStay", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000402',
  rt.id,
  DATE '2026-05-06',
  18,
  2,
  220.00,
  10.00,
  'USD',
  false,
  1,
  NOW(),
  NOW()
FROM room_types rt
JOIN hotels h ON h.id = rt."hotelId"
WHERE h."externalHotelCode" = 'TA-HOTEL-002' AND rt.code = 'STE'
ON CONFLICT ("roomTypeId", "stayDate") DO UPDATE SET
  "availableCount" = EXCLUDED."availableCount",
  "soldCount" = EXCLUDED."soldCount",
  "baseRate" = EXCLUDED."baseRate",
  "taxRate" = EXCLUDED."taxRate",
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Bookings (one per app, plus extra activity)
-- ---------------------------------------------------------------------------
INSERT INTO bookings (
  id, "tenantId", app, "bookingNumber", "customerId", "hotelId", "checkInDate", "checkOutDate",
  nights, "guestsCount", "roomsCount", status, currency, "subtotalAmount", "taxAmount",
  "totalAmount", "paidAmount", "balanceAmount", "customerNameSnapshot", "hotelNameSnapshot",
  "sourceChannel", "createdByUserId", "assignedToUserId", "confirmedAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000501',
  '00000000-0000-0000-0000-000000000001',
  'BOOKING_ENGINE',
  'BE-2026-0001',
  c.id,
  h.id,
  DATE '2026-05-05',
  DATE '2026-05-07',
  2,
  2,
  1,
  'CONFIRMED',
  'USD',
  250.00,
  25.00,
  275.00,
  275.00,
  0.00,
  'John Smith',
  h.name,
  'web',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000020',
  NOW(),
  NOW(),
  NOW()
FROM customers c
JOIN hotels h ON h."externalHotelCode" = 'TA-HOTEL-001'
WHERE c.email = 'john.smith@example.com' AND c."tenantId" = '00000000-0000-0000-0000-000000000001'
ON CONFLICT ("tenantId", "bookingNumber") DO UPDATE SET
  status = EXCLUDED.status,
  "totalAmount" = EXCLUDED."totalAmount",
  "paidAmount" = EXCLUDED."paidAmount",
  "balanceAmount" = EXCLUDED."balanceAmount",
  "assignedToUserId" = EXCLUDED."assignedToUserId",
  "updatedAt" = NOW();

INSERT INTO bookings (
  id, "tenantId", app, "bookingNumber", "customerId", "hotelId", "checkInDate", "checkOutDate",
  nights, "guestsCount", "roomsCount", status, currency, "subtotalAmount", "taxAmount",
  "totalAmount", "paidAmount", "balanceAmount", "customerNameSnapshot", "hotelNameSnapshot",
  "sourceChannel", "createdByUserId", "assignedToUserId", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000502',
  '00000000-0000-0000-0000-000000000001',
  'B2B_PORTAL',
  'B2B-2026-0001',
  c.id,
  h.id,
  DATE '2026-05-06',
  DATE '2026-05-09',
  3,
  3,
  1,
  'PENDING',
  'USD',
  660.00,
  66.00,
  726.00,
  300.00,
  426.00,
  'Aisha Rahman',
  h.name,
  'agency',
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000021',
  NOW(),
  NOW()
FROM customers c
JOIN hotels h ON h."externalHotelCode" = 'TA-HOTEL-002'
WHERE c.email = 'aisha.rahman@example.com' AND c."tenantId" = '00000000-0000-0000-0000-000000000001'
ON CONFLICT ("tenantId", "bookingNumber") DO UPDATE SET
  status = EXCLUDED.status,
  "totalAmount" = EXCLUDED."totalAmount",
  "paidAmount" = EXCLUDED."paidAmount",
  "balanceAmount" = EXCLUDED."balanceAmount",
  "updatedAt" = NOW();

INSERT INTO bookings (
  id, "tenantId", app, "bookingNumber", "customerId", "hotelId", "checkInDate", "checkOutDate",
  nights, "guestsCount", "roomsCount", status, currency, "subtotalAmount", "taxAmount",
  "totalAmount", "paidAmount", "balanceAmount", "customerNameSnapshot", "hotelNameSnapshot",
  "sourceChannel", "createdByUserId", "assignedToUserId", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000503',
  '00000000-0000-0000-0000-000000000001',
  'CALL_CENTER',
  'CC-2026-0001',
  c.id,
  h.id,
  DATE '2026-05-10',
  DATE '2026-05-12',
  2,
  1,
  1,
  'CONFIRMED',
  'USD',
  250.00,
  25.00,
  275.00,
  100.00,
  175.00,
  'David Miller',
  h.name,
  'phone',
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000022',
  NOW(),
  NOW()
FROM customers c
JOIN hotels h ON h."externalHotelCode" = 'TA-HOTEL-001'
WHERE c.email = 'david.miller@example.com' AND c."tenantId" = '00000000-0000-0000-0000-000000000001'
ON CONFLICT ("tenantId", "bookingNumber") DO UPDATE SET
  status = EXCLUDED.status,
  "totalAmount" = EXCLUDED."totalAmount",
  "paidAmount" = EXCLUDED."paidAmount",
  "balanceAmount" = EXCLUDED."balanceAmount",
  "updatedAt" = NOW();

INSERT INTO bookings (
  id, "tenantId", app, "bookingNumber", "customerId", "hotelId", "checkInDate", "checkOutDate",
  nights, "guestsCount", "roomsCount", status, currency, "subtotalAmount", "taxAmount",
  "totalAmount", "paidAmount", "balanceAmount", "customerNameSnapshot", "hotelNameSnapshot",
  "sourceChannel", "createdByUserId", "assignedToUserId", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000504',
  '00000000-0000-0000-0000-000000000001',
  'SUPERADMIN',
  'SA-2026-0001',
  c.id,
  h.id,
  DATE '2026-05-12',
  DATE '2026-05-15',
  3,
  2,
  1,
  'CONFIRMED',
  'USD',
  660.00,
  66.00,
  726.00,
  726.00,
  0.00,
  'Aisha Rahman',
  h.name,
  'admin',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000023',
  NOW(),
  NOW()
FROM customers c
JOIN hotels h ON h."externalHotelCode" = 'TA-HOTEL-002'
WHERE c.email = 'aisha.rahman@example.com' AND c."tenantId" = '00000000-0000-0000-0000-000000000001'
ON CONFLICT ("tenantId", "bookingNumber") DO UPDATE SET
  status = EXCLUDED.status,
  "totalAmount" = EXCLUDED."totalAmount",
  "paidAmount" = EXCLUDED."paidAmount",
  "balanceAmount" = EXCLUDED."balanceAmount",
  "updatedAt" = NOW();

INSERT INTO booking_rooms (
  id, "bookingId", "roomTypeId", quantity, adults, children, "unitRate", "totalRate", currency
)
SELECT
  '00000000-0000-0000-0000-000000000601',
  b.id,
  rt.id,
  1,
  2,
  0,
  125.00,
  250.00,
  'USD'
FROM bookings b
JOIN room_types rt ON rt.code = 'DLX'
JOIN hotels h ON h.id = rt."hotelId" AND h."externalHotelCode" = 'TA-HOTEL-001'
WHERE b."bookingNumber" = 'BE-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  "totalRate" = EXCLUDED."totalRate";

INSERT INTO booking_rooms (
  id, "bookingId", "roomTypeId", quantity, adults, children, "unitRate", "totalRate", currency
)
SELECT
  '00000000-0000-0000-0000-000000000602',
  b.id,
  rt.id,
  1,
  2,
  1,
  220.00,
  660.00,
  'USD'
FROM bookings b
JOIN room_types rt ON rt.code = 'STE'
JOIN hotels h ON h.id = rt."hotelId" AND h."externalHotelCode" = 'TA-HOTEL-002'
WHERE b."bookingNumber" = 'B2B-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  "totalRate" = EXCLUDED."totalRate";

INSERT INTO booking_rooms (
  id, "bookingId", "roomTypeId", quantity, adults, children, "unitRate", "totalRate", currency
)
SELECT
  '00000000-0000-0000-0000-000000000603',
  b.id,
  rt.id,
  1,
  1,
  0,
  125.00,
  250.00,
  'USD'
FROM bookings b
JOIN room_types rt ON rt.code = 'DLX'
JOIN hotels h ON h.id = rt."hotelId" AND h."externalHotelCode" = 'TA-HOTEL-001'
WHERE b."bookingNumber" = 'CC-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  "totalRate" = EXCLUDED."totalRate";

INSERT INTO booking_rooms (
  id, "bookingId", "roomTypeId", quantity, adults, children, "unitRate", "totalRate", currency
)
SELECT
  '00000000-0000-0000-0000-000000000604',
  b.id,
  rt.id,
  1,
  2,
  0,
  220.00,
  660.00,
  'USD'
FROM bookings b
JOIN room_types rt ON rt.code = 'STE'
JOIN hotels h ON h.id = rt."hotelId" AND h."externalHotelCode" = 'TA-HOTEL-002'
WHERE b."bookingNumber" = 'SA-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  "totalRate" = EXCLUDED."totalRate";

INSERT INTO booking_status_history (
  "bookingId", "fromStatus", "toStatus", "changedByUserId", note, "changedAt"
)
SELECT
  b.id,
  NULL,
  b.status,
  b."createdByUserId",
  'Initial booking state',
  NOW()
FROM bookings b
WHERE b."bookingNumber" IN ('BE-2026-0001', 'B2B-2026-0001', 'CC-2026-0001', 'SA-2026-0001')
  AND NOT EXISTS (
    SELECT 1 FROM booking_status_history h
    WHERE h."bookingId" = b.id AND h.note = 'Initial booking state'
  );

-- ---------------------------------------------------------------------------
-- Payments and refunds
-- ---------------------------------------------------------------------------
INSERT INTO payments (
  id, "tenantId", app, "bookingId", "customerId", method, status, amount, "feeAmount", "netAmount",
  currency, provider, "providerReference", "idempotencyKey", "processedByUserId", "processedAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000701',
  b."tenantId",
  b.app,
  b.id,
  b."customerId",
  'CARD',
  'CAPTURED',
  275.00,
  5.00,
  270.00,
  'USD',
  'stripe',
  'pi_be_0001',
  'PAY-BE-2026-0001',
  '00000000-0000-0000-0000-000000000023',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
WHERE b."bookingNumber" = 'BE-2026-0001'
ON CONFLICT ("tenantId", "idempotencyKey") DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  "netAmount" = EXCLUDED."netAmount",
  "updatedAt" = NOW();

INSERT INTO payments (
  id, "tenantId", app, "bookingId", "customerId", method, status, amount, "feeAmount", "netAmount",
  currency, provider, "providerReference", "idempotencyKey", "processedByUserId", "processedAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000702',
  b."tenantId",
  b.app,
  b.id,
  b."customerId",
  'BANK_TRANSFER',
  'AUTHORIZED',
  300.00,
  0.00,
  300.00,
  'USD',
  'bank',
  'bank_b2b_0001',
  'PAY-B2B-2026-0001',
  '00000000-0000-0000-0000-000000000023',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
WHERE b."bookingNumber" = 'B2B-2026-0001'
ON CONFLICT ("tenantId", "idempotencyKey") DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  "updatedAt" = NOW();

INSERT INTO payments (
  id, "tenantId", app, "bookingId", "customerId", method, status, amount, "feeAmount", "netAmount",
  currency, provider, "providerReference", "idempotencyKey", "processedByUserId", "processedAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000703',
  b."tenantId",
  b.app,
  b.id,
  b."customerId",
  'WALLET',
  'CAPTURED',
  100.00,
  0.00,
  100.00,
  'USD',
  'wallet',
  'wallet_cc_0001',
  'PAY-CC-2026-0001',
  '00000000-0000-0000-0000-000000000023',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
WHERE b."bookingNumber" = 'CC-2026-0001'
ON CONFLICT ("tenantId", "idempotencyKey") DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  "updatedAt" = NOW();

INSERT INTO payments (
  id, "tenantId", app, "bookingId", "customerId", method, status, amount, "feeAmount", "netAmount",
  currency, provider, "providerReference", "idempotencyKey", "processedByUserId", "processedAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000704',
  b."tenantId",
  b.app,
  b.id,
  b."customerId",
  'CARD',
  'CAPTURED',
  726.00,
  7.00,
  719.00,
  'USD',
  'stripe',
  'pi_sa_0001',
  'PAY-SA-2026-0001',
  '00000000-0000-0000-0000-000000000023',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
WHERE b."bookingNumber" = 'SA-2026-0001'
ON CONFLICT ("tenantId", "idempotencyKey") DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  "updatedAt" = NOW();

INSERT INTO refunds (
  id, "paymentId", amount, reason, status, "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000801',
  p.id,
  50.00,
  'Partial compensation',
  'PROCESSED',
  NOW(),
  NOW()
FROM payments p
WHERE p."idempotencyKey" = 'PAY-CC-2026-0001'
  AND NOT EXISTS (
    SELECT 1 FROM refunds r WHERE r.id = '00000000-0000-0000-0000-000000000801'
  );

-- ---------------------------------------------------------------------------
-- Notification templates + notifications
-- ---------------------------------------------------------------------------
INSERT INTO notification_templates (
  id, "tenantId", app, code, channel, "subjectTemplate", "bodyTemplate", "isActive", "createdAt", "updatedAt"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000001',
    'BOOKING_ENGINE',
    'BOOKING_CONFIRMED',
    'EMAIL',
    'Booking Confirmed',
    'Your booking {{bookingNumber}} is confirmed.',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000902',
    '00000000-0000-0000-0000-000000000001',
    'B2B_PORTAL',
    'PAYMENT_PENDING',
    'EMAIL',
    'Payment Pending',
    'Your booking {{bookingNumber}} has pending balance.',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000903',
    '00000000-0000-0000-0000-000000000001',
    'CALL_CENTER',
    'TICKET_CREATED',
    'IN_APP',
    'Ticket Created',
    'Support ticket {{ticketId}} has been created.',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000904',
    '00000000-0000-0000-0000-000000000001',
    'SUPERADMIN',
    'SETTING_UPDATED',
    'EMAIL',
    'Platform Setting Updated',
    'A platform setting was updated by {{user}}.',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT ("tenantId", app, code, channel) DO UPDATE SET
  "subjectTemplate" = EXCLUDED."subjectTemplate",
  "bodyTemplate" = EXCLUDED."bodyTemplate",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO notifications (
  id, "tenantId", app, "userId", "customerId", "bookingId", "templateId",
  channel, status, recipient, subject, body, "scheduledAt", "sentAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000951',
  b."tenantId",
  b.app,
  b."createdByUserId",
  b."customerId",
  b.id,
  nt.id,
  'EMAIL',
  'DELIVERED',
  c.email,
  'Booking Confirmed',
  'Booking ' || b."bookingNumber" || ' is confirmed.',
  NOW(),
  NOW(),
  NOW(),
  NOW()
FROM bookings b
JOIN customers c ON c.id = b."customerId"
JOIN notification_templates nt
  ON nt."tenantId" = b."tenantId"
 AND nt.app = 'BOOKING_ENGINE'
 AND nt.code = 'BOOKING_CONFIRMED'
 AND nt.channel = 'EMAIL'
WHERE b."bookingNumber" = 'BE-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  "updatedAt" = NOW();

INSERT INTO notifications (
  id, "tenantId", app, "userId", "customerId", "bookingId", "templateId",
  channel, status, recipient, subject, body, "scheduledAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000952',
  b."tenantId",
  b.app,
  b."createdByUserId",
  b."customerId",
  b.id,
  nt.id,
  'EMAIL',
  'QUEUED',
  c.email,
  'Payment Pending',
  'Booking ' || b."bookingNumber" || ' has outstanding amount.',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
JOIN customers c ON c.id = b."customerId"
JOIN notification_templates nt
  ON nt."tenantId" = b."tenantId"
 AND nt.app = 'B2B_PORTAL'
 AND nt.code = 'PAYMENT_PENDING'
 AND nt.channel = 'EMAIL'
WHERE b."bookingNumber" = 'B2B-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  "updatedAt" = NOW();

-- ---------------------------------------------------------------------------
-- Call center tickets
-- ---------------------------------------------------------------------------
INSERT INTO support_tickets (
  id, "tenantId", app, "bookingId", "customerId", "openedByUserId", "assignedToUserId",
  status, priority, subject, description, "firstResponseAt", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000971',
  b."tenantId",
  'CALL_CENTER',
  b.id,
  b."customerId",
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000022',
  'IN_PROGRESS',
  'HIGH',
  'Customer requested early check-in',
  'Need to coordinate with hotel front desk for early check-in approval.',
  NOW(),
  NOW(),
  NOW()
FROM bookings b
WHERE b."bookingNumber" = 'CC-2026-0001'
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  "updatedAt" = NOW();

INSERT INTO support_ticket_messages (
  "ticketId", "senderUserId", message, "isInternal", "createdAt"
)
SELECT
  '00000000-0000-0000-0000-000000000971',
  '00000000-0000-0000-0000-000000000022',
  'Reached hotel partner, confirmation expected in 30 minutes.',
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM support_ticket_messages m
  WHERE m."ticketId" = '00000000-0000-0000-0000-000000000971'
    AND m.message = 'Reached hotel partner, confirmation expected in 30 minutes.'
);

-- ---------------------------------------------------------------------------
-- Audit logs + daily aggregations
-- ---------------------------------------------------------------------------
INSERT INTO audit_logs (
  "tenantId", app, "userId", "entityType", "entityId", action, severity, "requestId", "createdAt"
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  b.app,
  b."createdByUserId",
  'Booking',
  b.id,
  'booking.created',
  'INFO',
  b."bookingNumber" || '-req',
  NOW()
FROM bookings b
WHERE b."bookingNumber" IN ('BE-2026-0001', 'B2B-2026-0001', 'CC-2026-0001', 'SA-2026-0001')
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a
    WHERE a."requestId" = b."bookingNumber" || '-req'
  );

INSERT INTO booking_daily_aggregations (
  id, "tenantId", app, "businessDate", "totalBookings", "confirmedBookings", "cancelledBookings",
  "grossAmount", "netAmount", "avgOrderValue", "createdAt", "updatedAt"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000981',
    '00000000-0000-0000-0000-000000000001',
    'BOOKING_ENGINE',
    DATE '2026-05-05',
    1,
    1,
    0,
    275.00,
    250.00,
    275.00,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000982',
    '00000000-0000-0000-0000-000000000001',
    'B2B_PORTAL',
    DATE '2026-05-06',
    1,
    0,
    0,
    726.00,
    660.00,
    726.00,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000983',
    '00000000-0000-0000-0000-000000000001',
    'CALL_CENTER',
    DATE '2026-05-10',
    1,
    1,
    0,
    275.00,
    250.00,
    275.00,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000984',
    '00000000-0000-0000-0000-000000000001',
    'SUPERADMIN',
    DATE '2026-05-12',
    1,
    1,
    0,
    726.00,
    660.00,
    726.00,
    NOW(),
    NOW()
  )
ON CONFLICT ("tenantId", app, "businessDate") DO UPDATE SET
  "totalBookings" = EXCLUDED."totalBookings",
  "confirmedBookings" = EXCLUDED."confirmedBookings",
  "cancelledBookings" = EXCLUDED."cancelledBookings",
  "grossAmount" = EXCLUDED."grossAmount",
  "netAmount" = EXCLUDED."netAmount",
  "avgOrderValue" = EXCLUDED."avgOrderValue",
  "updatedAt" = NOW();

COMMIT;
