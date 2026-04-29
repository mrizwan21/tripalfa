-- Migration: Initialize tripalfa_finance database with financial & reporting tables
-- Database: tripalfa_finance
-- Timestamp: 2026-03-09
-- Description: Contains invoices, commission, suppliers, marketing, loyalty, and deals management

BEGIN;

-- ============================================
-- INVOICING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "invoiceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(12,2),
    "notes" TEXT,
    "termsConditions" TEXT,
    "documentUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_invoiceNumber_key" UNIQUE ("invoiceNumber")
);

CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(12,2),
    "itemType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "credit_notes" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "reason" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT DEFAULT 'draft',
    "appliedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credit_notes_creditNoteNumber_key" UNIQUE ("creditNoteNumber"),
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tax_documents" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "taxAuthority" TEXT NOT NULL,
    "filingStatus" TEXT DEFAULT 'pending',
    "filedDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
);

-- ============================================
-- COMMISSION & DEALS
-- ============================================

CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemType" TEXT,
    "percentage" DECIMAL(5,2),
    "fixedAmount" DECIMAL(12,2),
    "minimumAmount" DECIMAL(12,2),
    "maximumAmount" DECIMAL(12,2),
    "priority" INTEGER DEFAULT 50,
    "rules" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commission_settlements" (
    "id" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "partnerId" TEXT,
    "supplierId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adjustments" DECIMAL(12,2),
    "notes" TEXT,
    "settlementDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commission_settlements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "commission_settlements_settlementNumber_key" UNIQUE ("settlementNumber")
);

CREATE TABLE IF NOT EXISTS "deal_approvals" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dealValue" DECIMAL(12,2),
    "approverIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvals" JSONB,
    "status" TEXT DEFAULT 'pending',
    "createdBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deal_approvals_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- MARKUP & PRICING
-- ============================================

CREATE TABLE IF NOT EXISTS "markup_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemType" TEXT,
    "percentage" DECIMAL(5,2),
    "fixedAmount" DECIMAL(12,2),
    "minimumAmount" DECIMAL(12,2),
    "maximumAmount" DECIMAL(12,2),
    "priority" INTEGER DEFAULT 50,
    "rules" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "markup_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pricing_audit_log" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "previousPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2),
    "changeReason" TEXT,
    "changedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pricing_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "minimumValue" DECIMAL(12,2),
    "maximumValue" DECIMAL(12,2),
    "discountPercentage" DECIMAL(5,2),
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- SUPPLIER MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vendorId" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "legalName" TEXT,
    "taxId" TEXT,
    "bankDetails" JSONB,
    "contactPerson" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "suppliers_code_key" UNIQUE ("code")
);

CREATE TABLE IF NOT EXISTS "supplier_credentials" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "webhookUrl" TEXT,
    "isEncrypted" BOOLEAN DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_credentials_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_sync_logs" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recordsProcessed" INTEGER DEFAULT 0,
    "recordsSuccessful" INTEGER DEFAULT 0,
    "recordsFailed" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_sync_logs_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_hotel_mappings" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierHotelId" TEXT NOT NULL,
    "internalHotelId" TEXT,
    "mappingStatus" TEXT DEFAULT 'mapped',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_hotel_mappings_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_deals" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dealType" TEXT NOT NULL,
    "value" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_deals_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "deal_mapping_rules" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "mappingLogic" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deal_mapping_rules_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("dealId") REFERENCES "supplier_deals"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_products" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productType" TEXT,
    "description" TEXT,
    "sku" TEXT,
    "status" TEXT DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_product_mappings" (
    "id" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "internalProductId" TEXT,
    "mappingStatus" TEXT DEFAULT 'mapped',
    "mappingData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_product_mappings_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierProductId") REFERENCES "supplier_products"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "product_mapping_parameters" (
    "id" TEXT NOT NULL,
    "mappingId" TEXT NOT NULL,
    "parameterKey" TEXT NOT NULL,
    "parameterValue" TEXT,
    "dataType" TEXT,
    "isRequired" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_mapping_parameters_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("mappingId") REFERENCES "supplier_product_mappings"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_financials" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenue" DECIMAL(12,2),
    "netIncome" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_financials_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_payment_terms" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "netDays" INTEGER DEFAULT 30,
    "discountPercentage" DECIMAL(5,2),
    "discountDays" INTEGER,
    "minimumAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_payment_terms_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_wallets" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT DEFAULT 'active',
    "lastSettledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_wallets_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_wallet_approval_requests" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT DEFAULT 'pending',
    "approverIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvals" JSONB,
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_wallet_approval_requests_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("walletId") REFERENCES "supplier_wallets"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "supplier_payment_logs" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "statusCode" TEXT,
    "timestamp" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_payment_logs_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("paymentId") REFERENCES "supplier_payments"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "payment_reconciliations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "sourceAmount" DECIMAL(12,2),
    "targetAmount" DECIMAL(12,2),
    "variance" DECIMAL(12,2),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_reconciliations_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("paymentId") REFERENCES "supplier_payments"("id") ON DELETE CASCADE
);

-- ============================================
-- CORPORATE CONTRACTS & AGREEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS "corporate_contracts" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "value" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "terms" TEXT,
    "documentUrl" TEXT,
    "signedBy" TEXT,
    "signedDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corporate_contracts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "corporate_contracts_contractNumber_key" UNIQUE ("contractNumber"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE
);

-- ============================================
-- LOYALTY & REWARDS MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "loyalty_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minimumPoints" INTEGER NOT NULL,
    "benefits" JSONB,
    "description" TEXT,
    "discountPercentage" DECIMAL(5,2),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_loyalty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_loyalty_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("tierId") REFERENCES "loyalty_tiers"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("loyaltyId") REFERENCES "customer_loyalty"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "loyalty_vouchers" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "expiryDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'active',
    "usedAt" TIMESTAMP(3),
    "redeemUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_vouchers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "loyalty_vouchers_voucherCode_key" UNIQUE ("voucherCode"),
    FOREIGN KEY ("loyaltyId") REFERENCES "customer_loyalty"("id") ON DELETE CASCADE
);

-- ============================================
-- CAMPAIGNS & MARKETING
-- ============================================

CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "targetAudience" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "budget" DECIMAL(12,2),
    "actualSpend" DECIMAL(12,2),
    "impressions" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "roi" DECIMAL(5,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "discount_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" DECIMAL(12,2),
    "discountType" TEXT DEFAULT 'percentage',
    "minOrderValue" DECIMAL(12,2),
    "maxOrderValue" DECIMAL(12,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "applicableCategories" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discount_coupons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "discount_coupons_code_key" UNIQUE ("code")
);

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "redeemedAt" TIMESTAMP(3) NOT NULL,
    "discountApplied" DECIMAL(12,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id"),
    FOREIGN KEY ("couponId") REFERENCES "discount_coupons"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "promoType" TEXT NOT NULL,
    "discount" DECIMAL(12,2),
    "discountType" TEXT DEFAULT 'percentage',
    "description" TEXT,
    "status" TEXT DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promo_codes_code_key" UNIQUE ("code")
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_invoices_userId" ON "invoices"("userId");
CREATE INDEX IF NOT EXISTS "idx_invoices_bookingId" ON "invoices"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "idx_invoice_line_items_invoiceId" ON "invoice_line_items"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_commission_settlements_settlementDate" ON "commission_settlements"("settlementDate");
CREATE INDEX IF NOT EXISTS "idx_suppliers_code" ON "suppliers"("code");
CREATE INDEX IF NOT EXISTS "idx_supplier_sync_logs_supplierId" ON "supplier_sync_logs"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_hotel_mappings_supplierId" ON "supplier_hotel_mappings"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_deals_supplierId" ON "supplier_deals"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_payments_status" ON "supplier_payments"("status");
CREATE INDEX IF NOT EXISTS "idx_loyalty_tiers_level" ON "loyalty_tiers"("level");
CREATE INDEX IF NOT EXISTS "idx_customer_loyalty_userId" ON "customer_loyalty"("userId");
CREATE INDEX IF NOT EXISTS "idx_loyalty_vouchers_voucherCode" ON "loyalty_vouchers"("voucherCode");
CREATE INDEX IF NOT EXISTS "idx_discount_coupons_code" ON "discount_coupons"("code");
CREATE INDEX IF NOT EXISTS "idx_promo_codes_code" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "idx_campaigns_status" ON "campaigns"("status");

COMMIT;
