-- Migration: Initialize tripalfa_core database with core OLTP tables
-- Database: tripalfa_core
-- Timestamp: 2026-03-09
-- Description: Contains core transactional tables for users, org, bookings, wallet, KYC, inventory, admin UI
--
-- Tables included:
-- - User/Auth: users, user_preferences, roles, user_roles
-- - Org: companies, branches, departments, designations, cost_centers
-- - Bookings: bookings, booking_segments, booking_passengers, booking_modifications, prebook_sessions, offline_booking_forms
-- - Wallet: wallets, wallet_transactions, wallet_ledger, wallet_reconciliations
-- - KYC: kyc_verifications, kyc_document_submissions, kyc_verification_history, kyc_id_verifications
-- - Booking Ops: booking_work_queue, booking_approvals, booking_escalations, ticket_reissues, refund_requests
-- - Inventory: inventory_items, inventory_holds, inventory_allocation_rules
-- - Admin UI: admin_ui_preferences, saved_searches, admin_dashboard_widgets, user_sessions, admin_activity_logs
-- - Duffel Flight: duffel_offer_requests, duffel_offers, duffel_offer_cache, duffel_offer_request_cache, duffel_orders, duffel_order_cache, duffel_order_cancellations, duffel_order_changes, duffel_seat_map_cache, duffel_services_cache, duffel_cancellation_cache
-- - Kiwi: kiwi_booking_holds, kiwi_settlements, kiwi_refunds, kiwi_price_changes
-- - Infrastructure: audit_logs, circuit_breakers, exchange_rates, airports, airlines, destinations, organization_settings, system_configurations

BEGIN;

-- ============================================
-- USERS & ROLES (Identity & Authorization)
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "inAppNotifications" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'English',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_preferences_userId_key" UNIQUE ("userId"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
);

-- ============================================
-- ORGANIZATION STRUCTURE
-- ============================================

CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "legalName" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "type" TEXT NOT NULL DEFAULT 'b2b',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "branches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "branches_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "headId" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "designations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salaryRange" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "designations_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "cost_centers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL,
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL
);

-- ============================================
-- ORGANIZATION SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS "organization_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_settings_company_key_unique" UNIQUE ("companyId", "setting_key"),
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "system_configurations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "environment" TEXT DEFAULT 'development',
    "updated_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_configurations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "system_configurations_key_environment_unique" UNIQUE ("key", "environment")
);

-- ============================================
-- KYC & IDENTITY VERIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFront" TEXT,
    "documentBack" TEXT,
    "selfie" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "address" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "previousVerificationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "kyc_document_submissions" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "storageUrl" TEXT,
    "ocrResult" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kyc_document_submissions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("kycId") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "kyc_verification_history" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kyc_verification_history_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("kycId") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "kyc_id_verifications" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "confidenceScore" DECIMAL(3,2),
    "extractedData" JSONB,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kyc_id_verifications_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("submissionId") REFERENCES "kyc_document_submissions"("id") ON DELETE CASCADE
);

-- ============================================
-- BOOKINGS & BOOKING OPERATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS "bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workflowState" TEXT DEFAULT 'awaiting_confirmation',
    "paymentStatus" TEXT DEFAULT 'unpaid',
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "baseAmount" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2),
    "markupAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "travelDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookings_bookingRef_key" UNIQUE ("bookingRef"),
    INDEX "bookings_bookingRef_idx" ("bookingRef"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "booking_segments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_segments_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "booking_passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "passportNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_passengers_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "booking_modifications" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "modType" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "feeApplied" DECIMAL(12,2),
    "status" TEXT DEFAULT 'pending',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_modifications_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "prebook_sessions" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hotelId" TEXT,
    "roomTypeId" TEXT,
    "guestCount" INTEGER,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "holdStatus" TEXT DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "priceAtHold" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prebook_sessions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

-- ============================================
-- OFFLINE BOOKING & CHANGE REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS "offline_booking_forms" (
    "id" TEXT NOT NULL,
    "formRef" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "companyId" TEXT,
    "serviceType" TEXT NOT NULL,
    "travelerName" TEXT,
    "travelerEmail" TEXT,
    "travelerPhone" TEXT,
    "productRef" TEXT,
    "supplier" TEXT,
    "travelDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "baseAmount" DECIMAL(12,2),
    "markupAmount" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2),
    "feeAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "status" TEXT DEFAULT 'draft',
    "convertedBookingId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "offline_booking_forms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "offline_booking_forms_formRef_key" UNIQUE ("formRef"),
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
    FOREIGN KEY ("convertedBookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "offline_change_requests" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingRef" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "priority" TEXT DEFAULT 'normal',
    "submittedBy" TEXT,
    "assignedTo" TEXT,
    "requestDetails" JSONB,
    "resolution" JSONB,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "offline_change_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "offline_change_requests_requestRef_key" UNIQUE ("requestRef"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);

-- ============================================
-- BOOKING WORKFLOW & OPERATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS "booking_work_queue" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "assigneeId" TEXT,
    "priority" INTEGER DEFAULT 50,
    "status" TEXT DEFAULT 'pending',
    "queueReason" TEXT,
    "timeoutMinutes" INTEGER DEFAULT 60,
    "isEscalated" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_work_queue_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "booking_approvals" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_approvals_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "booking_escalations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'high',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_escalations_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ticket_reissues" (
    "id" TEXT NOT NULL,
    "originalBookingId" TEXT NOT NULL,
    "newBookingId" TEXT,
    "ticketNumber" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "feeApplied" DECIMAL(12,2),
    "feeCurrency" TEXT DEFAULT 'USD',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_reissues_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("originalBookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("newBookingId") REFERENCES "bookings"("id") ON DELETE SET NULL,
    FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "refund_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "refundType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedAmount" DECIMAL(12,2),
    "approvedAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "status" TEXT DEFAULT 'pending',
    "rejectionReason" TEXT,
    "paymentMethodReturned" TEXT,
    "requestedBy" TEXT,
    "reviewedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
    FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "inventory_items" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "itemType" TEXT NOT NULL,
    "itemRef" TEXT,
    "totalCount" INTEGER DEFAULT 0,
    "availableCount" INTEGER DEFAULT 0,
    "holdCount" INTEGER DEFAULT 0,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inventory_holds" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "bookingRef" TEXT,
    "heldQuantity" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_holds_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "inventory_allocation_rules" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "rule" JSONB,
    "priority" INTEGER DEFAULT 0,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_allocation_rules_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- WALLET & PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reservedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dailyLimit" DECIMAL(12,2),
    "monthlyLimit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallets_userId_currency_key" UNIQUE ("userId", "currency"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "payerId" TEXT,
    "payeeId" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "type" TEXT NOT NULL,
    "flow" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "credit" DECIMAL(12,2),
    "debit" DECIMAL(12,2),
    "description" TEXT,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "serviceType" TEXT,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "bookingRef" TEXT,
    "travelDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "route" TEXT,
    "hotelAddress" TEXT,
    "guestName" TEXT,
    "roomType" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE,
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "wallet_ledger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "balance" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "credit" DECIMAL(12,2),
    "debit" DECIMAL(12,2),
    "accountType" TEXT,
    "account" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "wallet_reconciliations" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "openingBalance" DECIMAL(12,2),
    "closingBalance" DECIMAL(12,2),
    "totalCredits" DECIMAL(12,2),
    "totalDebits" DECIMAL(12,2),
    "discrepancyAmount" DECIMAL(12,2),
    "reconciliationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_reconciliations_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "kiwi_booking_holds" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "walletId" TEXT,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kiwi_booking_holds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kiwi_booking_holds_kiwiBookingId_key" UNIQUE ("kiwiBookingId"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL
);

-- ============================================
-- DUFFEL FLIGHT INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS "duffel_offer_requests" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "passengers" JSONB NOT NULL,
    "slices" JSONB NOT NULL,
    "cabinClass" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "duffel_offer_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_offer_requests_externalId_key" UNIQUE ("externalId")
);

CREATE TABLE IF NOT EXISTS "duffel_offers" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "offerRequestId" TEXT,
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT,
    "passengers" JSONB,
    "slices" JSONB,
    "conditions" JSONB,
    "allowedChanges" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "duffel_offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_offers_offerId_key" UNIQUE ("offerId")
);

CREATE TABLE IF NOT EXISTS "duffel_offer_cache" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "offerData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_offer_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_offer_cache_offerId_key" UNIQUE ("offerId")
);

CREATE TABLE IF NOT EXISTS "duffel_offer_request_cache" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_offer_request_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_offer_request_cache_requestId_key" UNIQUE ("requestId")
);

CREATE TABLE IF NOT EXISTS "duffel_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT,
    "livePricing" JSONB,
    "passengers" JSONB,
    "slices" JSONB,
    "services" JSONB,
    "orderChangeRequests" JSONB,
    "ticketingStatus" TEXT,
    "ticketingExpiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "duffel_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_orders_orderId_key" UNIQUE ("orderId"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "duffel_order_cache" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_order_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_order_cache_orderId_key" UNIQUE ("orderId")
);

CREATE TABLE IF NOT EXISTS "duffel_order_cancellations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cancellationId" TEXT NOT NULL,
    "reason" TEXT,
    "refundAmount" DECIMAL(12,2),
    "refundCurrency" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "duffel_order_cancellations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_order_cancellations_cancellationId_key" UNIQUE ("cancellationId")
);

CREATE TABLE IF NOT EXISTS "duffel_order_changes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderChangeId" TEXT NOT NULL,
    "changeType" TEXT,
    "sliceId" TEXT,
    "penalty" JSONB,
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "duffel_order_changes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_order_changes_orderChangeId_key" UNIQUE ("orderChangeId")
);

CREATE TABLE IF NOT EXISTS "duffel_seat_map_cache" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "seatMapData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_seat_map_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_seat_map_cache_segmentId_key" UNIQUE ("segmentId")
);

CREATE TABLE IF NOT EXISTS "duffel_services_cache" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "servicesData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_services_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_services_cache_orderId_key" UNIQUE ("orderId")
);

CREATE TABLE IF NOT EXISTS "duffel_cancellation_cache" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cancellationData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duffel_cancellation_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "duffel_cancellation_cache_orderId_key" UNIQUE ("orderId")
);

-- ============================================
-- KIWI FLIGHT INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS "kiwi_settlements" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kiwiBookingId" TEXT,
    "commissionPercentage" DECIMAL(5,2),
    "commissionAmount" DECIMAL(12,2),
    "settlementAmount" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "settledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kiwi_settlements_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "kiwi_refunds" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "originalPaymentId" TEXT,
    "bookingId" TEXT,
    "walletId" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kiwi_refunds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kiwi_refunds_refundId_key" UNIQUE ("refundId"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "kiwi_price_changes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "originalPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2),
    "priceDifference" DECIMAL(12,2),
    "changeType" TEXT,
    "detectedAt" TIMESTAMP(3),
    "actionTaken" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kiwi_price_changes_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE
);

-- ============================================
-- EXCHANGE RATES & CURRENCY
-- ============================================

CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "id" TEXT NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(10,6) NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exchange_rates_pair_unique" UNIQUE ("sourceCurrency", "targetCurrency")
);

-- ============================================
-- FLIGHT & HOTEL REFERENCE DATA
-- ============================================

CREATE TABLE IF NOT EXISTS "airports" (
    "id" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "icaoCode" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "timezone" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "airports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "airports_iataCode_key" UNIQUE ("iataCode")
);

CREATE TABLE IF NOT EXISTS "airlines" (
    "id" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "icaoCode" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "airlines_iataCode_key" UNIQUE ("iataCode")
);

CREATE TABLE IF NOT EXISTS "destinations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'city',
    "country" TEXT,
    "countryCode" TEXT,
    "continent" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "imageUrl" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "destinations_code_key" UNIQUE ("code")
);

-- ============================================
-- AUDIT & INFRASTRUCTURE
-- ============================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "circuit_breakers" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'closed',
    "failureCount" INTEGER DEFAULT 0,
    "successCount" INTEGER DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "tripAt" TIMESTAMP(3),
    "resetAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "circuit_breakers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "circuit_breakers_serviceName_key" UNIQUE ("serviceName")
);

-- ============================================
-- ADMIN UI STATE & PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS "admin_ui_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT DEFAULT 'light',
    "sidebarCollapsed" BOOLEAN DEFAULT false,
    "defaultDateRange" TEXT DEFAULT '30d',
    "language" TEXT DEFAULT 'English',
    "timezone" TEXT,
    "tableDensity" TEXT DEFAULT 'comfortable',
    "columnVisibility" JSONB,
    "sortPreferences" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_ui_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_ui_preferences_userId_key" UNIQUE ("userId"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortBy" TEXT,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "admin_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "positionX" INTEGER,
    "positionY" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "config" JSONB,
    "isVisible" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_dashboard_widgets_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "summary" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_companyId" ON "users"("companyId");
CREATE INDEX IF NOT EXISTS "idx_bookings_userId" ON "bookings"("userId");
CREATE INDEX IF NOT EXISTS "idx_bookings_status" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "idx_bookings_createdAt" ON "bookings"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_booking_segments_bookingId" ON "booking_segments"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_booking_passengers_bookingId" ON "booking_passengers"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_wallets_userId" ON "wallets"("userId");
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_walletId" ON "wallet_transactions"("walletId");
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_bookingId" ON "wallet_transactions"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_company_users" ON "users"("companyId");
CREATE INDEX IF NOT EXISTS "idx_departments_companyId" ON "departments"("companyId");
CREATE INDEX IF NOT EXISTS "idx_branches_companyId" ON "branches"("companyId");
CREATE INDEX IF NOT EXISTS "idx_offline_change_requests_bookingId" ON "offline_change_requests"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_offline_change_requests_status" ON "offline_change_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_booking_work_queue_status" ON "booking_work_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_booking_work_queue_assigneeId" ON "booking_work_queue"("assigneeId");
CREATE INDEX IF NOT EXISTS "idx_refund_requests_bookingId" ON "refund_requests"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_refund_requests_status" ON "refund_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_inventory_items_supplierId" ON "inventory_items"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_inventory_holds_itemId" ON "inventory_holds"("itemId");

COMMIT;
