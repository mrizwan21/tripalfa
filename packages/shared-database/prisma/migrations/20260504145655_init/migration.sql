-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('MASTER', 'SUB_AGENT', 'CORPORATE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('POS_DC', 'POS_SA', 'POS_CA', 'SUBAGENT', 'WEBSITE', 'MOBILE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('NEW_BOOKING', 'PROVISIONAL', 'AUTHORIZED', 'TICKETED', 'DOCUMENTED', 'DISPATCHED', 'CANCELLED', 'VOID', 'REFUNDED', 'REFUND_ON_HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "SegmentStatus" AS ENUM ('HK', 'UC', 'RQ', 'HX', 'NO');

-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('REFUND', 'RESCHEDULE', 'CANCEL', 'CLIENT_SWITCH');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TICKET', 'VOUCHER', 'INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "ApprovalLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LINE_MANAGER', 'FINANCE_MANAGER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CORPORATE', 'SUB_AGENT', 'INDIVIDUAL', 'WALK_IN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BOOKING', 'EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK', 'REMINDER');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('Flight', 'Hotel');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('Active', 'Depleted', 'Expired', 'CarryForwarded');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('Purchase', 'Sale', 'CarryForward', 'Adjustment', 'GroupSale');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'push', 'in_app');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed', 'retrying');

-- CreateEnum
CREATE TYPE "WalletOwnerType" AS ENUM ('CUSTOMER', 'AGENT', 'CORPORATE', 'SUPPLIER', 'SUB_AGENT');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED', 'PENDING_ACTIVATION');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('FLIGHT_BOOKING', 'HOTEL_BOOKING', 'MARKUP_EARNING', 'COMMISSION_EARNING', 'REFUND', 'CREDIT_LIMIT', 'AUTO_RELOAD', 'MANUAL_ADJUSTMENT', 'PAYMENT', 'HOLD');

-- CreateEnum
CREATE TYPE "HoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONVERTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarkupValueType" AS ENUM ('Percentage', 'Fixed');

-- CreateEnum
CREATE TYPE "MarkupRuleLevel" AS ENUM ('BASE', 'OVERRIDE', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "CommissionSourceType" AS ENUM ('Airline', 'HotelSupplier', 'GDS', 'DirectContract');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('Percentage', 'Fixed', 'Tiered');

-- CreateEnum
CREATE TYPE "TaxValueType" AS ENUM ('Percentage', 'Fixed', 'Tiered');

-- CreateEnum
CREATE TYPE "TaxRuleLevel" AS ENUM ('BASE', 'OVERRIDE', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'TRANSFER', 'REFUND', 'FEE', 'ADJUSTMENT', 'RECONCILIATION', 'AUTO_RELOAD');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED', 'QUEUED');

-- CreateEnum
CREATE TYPE "WalletHistoryType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BOOKING_DEBIT', 'BOOKING_CREDIT', 'REFUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'HOLD_PLACED', 'HOLD_RELEASED', 'ADJUSTMENT', 'RECONCILIATION', 'AUTO_RELOAD');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'WALLET', 'CHEQUE', 'ON_HOLD', 'SKIP_PAYMENT');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TenantType" NOT NULL DEFAULT 'SUB_AGENT',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "databaseUrl" TEXT NOT NULL,
    "databaseSchema" TEXT NOT NULL,
    "parentId" TEXT,
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "iataNo" TEXT,
    "officeId" TEXT,
    "vatNo" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'CREDIT',
    "accessFlights" BOOLEAN NOT NULL DEFAULT true,
    "accessHotels" BOOLEAN NOT NULL DEFAULT true,
    "accessCars" BOOLEAN NOT NULL DEFAULT false,
    "enableB2B2C" BOOLEAN NOT NULL DEFAULT false,
    "canManageMarkups" BOOLEAN NOT NULL DEFAULT true,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT true,
    "cachedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cachedBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateOfOperations" TIMESTAMP(3),
    "address1" TEXT,
    "address2" TEXT,
    "address3" TEXT,
    "state" TEXT,
    "postCode" TEXT,
    "telephone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "contactName" TEXT,
    "designation" TEXT,
    "contactMobile" TEXT,
    "websiteUrl" TEXT,
    "referredBy" TEXT,
    "remarks" TEXT,
    "language" TEXT DEFAULT 'English',
    "salesEmail" TEXT,
    "salesPhone" TEXT,
    "salesMobile" TEXT,
    "salesContactName" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "bankSwiftCode" TEXT,
    "bankPhone" TEXT,
    "bankFax" TEXT,
    "bankAccountNo" TEXT,
    "abtaNo" TEXT,
    "atolNo" TEXT,
    "creditLimitAlert" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempCreditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempCreditLimitStart" TIMESTAMP(3),
    "tempCreditLimitEnd" TIMESTAMP(3),
    "tdsApplicable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsExemption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyTicketValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payPeriod" TEXT DEFAULT 'Monthly',
    "annualTurnover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserveVolumeMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noOfEmployees" INTEGER NOT NULL DEFAULT 0,
    "noOfBranches" INTEGER NOT NULL DEFAULT 0,
    "accessInsurance" BOOLEAN NOT NULL DEFAULT false,
    "accessPackages" BOOLEAN NOT NULL DEFAULT false,
    "accessSightseeing" BOOLEAN NOT NULL DEFAULT false,
    "accessTransfers" BOOLEAN NOT NULL DEFAULT false,
    "accessDynamicSearch" BOOLEAN NOT NULL DEFAULT true,
    "canManageBranches" BOOLEAN NOT NULL DEFAULT true,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT true,
    "canManageCreditCards" BOOLEAN NOT NULL DEFAULT false,
    "canImportPNR" BOOLEAN NOT NULL DEFAULT true,
    "canAllowAutoTicket" BOOLEAN NOT NULL DEFAULT true,
    "canAccessIITFare" BOOLEAN NOT NULL DEFAULT false,
    "canManageSupplierCreds" BOOLEAN NOT NULL DEFAULT false,
    "canManagePGCreds" BOOLEAN NOT NULL DEFAULT false,
    "showLogoOnDashboard" BOOLEAN NOT NULL DEFAULT true,
    "allowAirCanx" BOOLEAN NOT NULL DEFAULT true,
    "perfSparkline" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "salesChannelId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_channels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "markupOverride" DOUBLE PRECISION,
    "commissionShare" DOUBLE PRECISION,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorName" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "pnr" TEXT,
    "tenantId" TEXT NOT NULL,
    "salesChannel" "SalesChannel" NOT NULL DEFAULT 'SUBAGENT',
    "agentCode" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "productType" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'NEW_BOOKING',
    "segmentStatus" "SegmentStatus",
    "ticketed" BOOLEAN NOT NULL DEFAULT false,
    "dispatched" BOOLEAN NOT NULL DEFAULT false,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "travelDate" TEXT NOT NULL,
    "tripStartDate" TIMESTAMP(3),
    "ticketDeadline" TIMESTAMP(3),
    "issuedDate" TIMESTAMP(3),
    "passengerName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netFare" DOUBLE PRECISION NOT NULL,
    "supplierCost" DOUBLE PRECISION,
    "route" TEXT,
    "hotelName" TEXT,
    "destination" TEXT,
    "passengerDob" TEXT,
    "passengerNationality" TEXT,
    "passengerPassport" TEXT,
    "passengerPassportExpiry" TEXT,
    "corporateId" TEXT,
    "subagentId" TEXT,
    "enquiryId" TEXT,
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "receiptNo" TEXT,
    "invoiceNo" TEXT,
    "ticketNo" TEXT,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "amendmentHistory" JSONB,
    "inventoryBlockId" TEXT,
    "inventoryDbUrl" TEXT,
    "workflowState" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "userId" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "serviceType" TEXT,
    "baseAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "markupAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tktLater" BOOLEAN NOT NULL DEFAULT false,
    "autoCancelScheduled" BOOLEAN NOT NULL DEFAULT false,
    "balanceDueDate" TIMESTAMP(3),
    "refundAmount" DOUBLE PRECISION,
    "penaltyAmount" DOUBLE PRECISION,
    "passengerResidency" TEXT,
    "clientSwitchBlocked" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT,
    "refundStatus" TEXT,
    "authorizationStatus" TEXT,
    "authorizationBy" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "originalBookingId" TEXT,
    "modificationDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "notifications" JSONB DEFAULT '[]',

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_segments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gdsPnr" TEXT,
    "validatingCarrier" TEXT,
    "status" "SegmentStatus" NOT NULL DEFAULT 'HK',
    "confirmationNo" TEXT,
    "airline" TEXT,
    "airlineCode" TEXT,
    "flightNumber" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "departureDateTime" TIMESTAMP(3),
    "arrivalDateTime" TIMESTAMP(3),
    "class" TEXT,
    "fareBasisCode" TEXT,
    "totalStops" INTEGER,
    "airlinePnr" TEXT,
    "duration" TEXT,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "segmentType" TEXT,
    "tripType" TEXT,
    "operatedBy" TEXT,
    "promoCode" TEXT,
    "hotelName" TEXT,
    "hotelChain" TEXT,
    "starCategory" INTEGER,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "noOfNights" INTEGER,
    "roomType" TEXT,
    "mealPlan" TEXT,
    "noOfRooms" INTEGER,
    "noOfOccupants" INTEGER,
    "occupantsAdults" INTEGER,
    "occupantsChildren" INTEGER,
    "carSupplier" TEXT,
    "pickupLocation" TEXT,
    "dropOffLocation" TEXT,
    "pickupDateTime" TIMESTAMP(3),
    "dropOffDateTime" TIMESTAMP(3),
    "carType" TEXT,
    "leadDriver" TEXT,
    "supplierCurrency" TEXT,
    "fareDetails" JSONB,
    "costing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierPaymentDueDate" TIMESTAMP(3),
    "additionalReferenceNo" TEXT,
    "originAirport" TEXT,
    "destinationAirport" TEXT,
    "terminal" TEXT,
    "openSegment" BOOLEAN NOT NULL DEFAULT false,
    "rateCode" TEXT,
    "hotelAddress" TEXT,
    "cityCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cancellationDate" TIMESTAMP(3),
    "cancellationConditions" TEXT,
    "specialRequest" TEXT,
    "notes" TEXT,
    "serviceDescription" TEXT,
    "serviceQuantity" INTEGER,
    "pickupAddress" TEXT,
    "dropOffAddress" TEXT,
    "carName" TEXT,
    "carGroup" TEXT,
    "additionalDriver" TEXT,
    "driverDob" TEXT,
    "passengerIds" JSONB,
    "calculationMode" TEXT,
    "miscCharges" JSONB,

    CONSTRAINT "booking_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "documentNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "refundStatus" TEXT,
    "fareDetails" JSONB,
    "tstDetails" JSONB,
    "baggage" TEXT,
    "nvdNva" JSONB,
    "ticketingDate" TIMESTAMP(3),
    "fareType" TEXT,
    "airlineCode" TEXT,
    "voucherDetails" JSONB,
    "refundAmount" DOUBLE PRECISION,
    "agencyCharge" DOUBLE PRECISION,
    "airlineCharge" DOUBLE PRECISION,
    "issuedAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iataNo" TEXT,
    "checkDigit" TEXT,
    "conjunctionTickets" INTEGER,
    "gdsValidated" BOOLEAN NOT NULL DEFAULT false,
    "refundedAmount" DOUBLE PRECISION,
    "nonRefundedAmount" DOUBLE PRECISION,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "ServiceRequestType" NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,
    "requestFrom" TEXT,
    "requestRemarks" TEXT,
    "approvalDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvalRemarks" TEXT,
    "processedDate" TIMESTAMP(3),
    "processedBy" TEXT,
    "productType" TEXT,
    "lastModifiedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "serviceRequestId" TEXT,
    "level" "ApprovalLevel" NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "approverName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "actionDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_change_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "status_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_switch_approvals" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromCorporateId" TEXT NOT NULL,
    "toCorporateId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "level1Approver" TEXT,
    "level1Status" TEXT,
    "level1Date" TIMESTAMP(3),
    "level1Remarks" TEXT,
    "level2Approver" TEXT,
    "level2Status" TEXT,
    "level2Date" TIMESTAMP(3),
    "level2Remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_switch_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Quote',
    "corporateId" TEXT,
    "travellerId" TEXT,
    "travellerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "itineraries" JSONB NOT NULL,
    "approverEmails" JSONB NOT NULL,
    "sendToEmployeeFirst" BOOLEAN NOT NULL DEFAULT false,
    "quoteWithoutCost" BOOLEAN NOT NULL DEFAULT false,
    "sendFareRules" BOOLEAN NOT NULL DEFAULT false,
    "includeCheapest" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "upsertData" JSONB,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "approvedDate" TIMESTAMP(3),
    "approverRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_travellers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "corporateName" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "costCenter" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fop" TEXT NOT NULL,
    "availableCredit" DOUBLE PRECISION,
    "creditLimit" DOUBLE PRECISION,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "cip" BOOLEAN NOT NULL DEFAULT false,
    "frequentFlyerNos" JSONB,
    "preferences" JSONB,
    "travelCoordinator" TEXT,
    "last3Bookings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_travellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "companyName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "userId" TEXT,
    "tier" TEXT,
    "comments" TEXT,
    "totalSpent" DOUBLE PRECISION,
    "state" TEXT,
    "country" TEXT,
    "postCode" TEXT,
    "iataNo" TEXT,
    "officeId" TEXT,
    "vatNo" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'CREDIT',
    "payPeriod" TEXT NOT NULL DEFAULT 'Monthly',
    "frequentFlyerNos" JSONB,
    "travelPreferences" JSONB,
    "travelPolicy" JSONB,
    "salesChannel" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "assignedTo" TEXT,
    "lastBookingDate" TIMESTAMP(3),
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT,
    "bookingId" TEXT,
    "ticketId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "bookingRef" TEXT,
    "amount" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_blocks" (
    "id" TEXT NOT NULL,
    "type" "InventoryType" NOT NULL,
    "provider" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "sellPricePerUnit" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'Active',
    "parentBlockId" TEXT,
    "tenantId" TEXT,
    "agentCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "inventoryBlockId" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingRef" TEXT,
    "quantity" INTEGER NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "tenantId" TEXT,
    "agentCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_allocations" (
    "id" TEXT NOT NULL,
    "inventoryBlockId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reservedUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Reserved',
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "agentCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "attachments" JSONB,
    "tenantId" TEXT,
    "bookingRef" TEXT,
    "userId" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "providerError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "walletNo" TEXT NOT NULL,
    "ownerType" "WalletOwnerType" NOT NULL DEFAULT 'AGENT',
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL DEFAULT 'Default Wallet',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "autoReloadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReloadAmount" DOUBLE PRECISION,
    "autoReloadThreshold" DOUBLE PRECISION,
    "autoReloadCurrency" TEXT DEFAULT 'USD',
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_accounts" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "computedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blockedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ledgerAccountId" TEXT,

    CONSTRAINT "currency_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userName" TEXT,
    "transactionNo" TEXT NOT NULL,
    "currencyAccountId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "bookingId" TEXT,
    "bookingRef" TEXT,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "fxRate" DOUBLE PRECISION,
    "originalAmount" DOUBLE PRECISION,
    "originalCurrency" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_holds" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "HoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "holdNo" TEXT NOT NULL,
    "currencyAccountId" TEXT NOT NULL,
    "bookingId" TEXT,
    "description" TEXT,
    "slug" TEXT,

    CONSTRAINT "wallet_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_credit_limits" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempCreditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempCreditLimitStart" TIMESTAMP(3),
    "tempCreditLimitEnd" TIMESTAMP(3),
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsExemption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payPeriod" TEXT NOT NULL DEFAULT 'Monthly',
    "annualTurnover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usedCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tempCreditStart" TIMESTAMP(3),
    "tempCreditEnd" TIMESTAMP(3),
    "creditAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_credit_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_refunds" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refundNo" TEXT NOT NULL,
    "originalTransactionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "reasonCategory" TEXT,
    "notes" TEXT,

    CONSTRAINT "wallet_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_reconciliation_logs" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "adjustedAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reconciledBy" TEXT NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciliationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "systemBalance" DOUBLE PRECISION NOT NULL,
    "ledgerBalance" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL,
    "discrepancyTolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adjustmentAmount" DOUBLE PRECISION,
    "adjustmentReason" TEXT,
    "notes" TEXT,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_reconciliation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_accounts" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "corporateName" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'Monthly',
    "invoiceDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoInvoiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "invoiceEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_wallets" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierType" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,
    "settlementCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "settlementCurrency" TEXT NOT NULL DEFAULT 'USD',
    "payableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "iban" TEXT,
    "swiftCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSettlementDate" TIMESTAMP(3),

    CONSTRAINT "supplier_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markup_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "serviceType" TEXT NOT NULL,
    "valueType" "MarkupValueType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "ruleLevel" "MarkupRuleLevel" NOT NULL DEFAULT 'BASE',
    "salesChannels" TEXT[],
    "airlineCode" TEXT,
    "airlineGroup" TEXT,
    "originCode" TEXT,
    "destinationCode" TEXT,
    "marketRegion" TEXT,
    "rbdClass" TEXT,
    "journeyType" TEXT,
    "cabinClass" TEXT,
    "hotelId" TEXT,
    "hotelChain" TEXT,
    "hotelStars" INTEGER,
    "mealPlan" TEXT,
    "supplierCode" TEXT,
    "customerId" TEXT,
    "customerType" TEXT,
    "customerTier" TEXT,
    "tenantId" TEXT,
    "agentCode" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markup_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markup_rule_audit_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "markup_rule_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "sourceType" "CommissionSourceType" NOT NULL,
    "serviceType" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "baseCommission" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supplierCode" TEXT,
    "supplierId" TEXT,
    "contractRef" TEXT,
    "airlineCode" TEXT,
    "airlineGroup" TEXT,
    "originCode" TEXT,
    "destinationCode" TEXT,
    "rbdClass" TEXT,
    "cabinClass" TEXT,
    "hotelId" TEXT,
    "hotelChain" TEXT,
    "hotelStars" INTEGER,
    "mealPlan" TEXT,
    "salesChannels" TEXT[],
    "tenantId" TEXT,
    "agentCode" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rule_audit_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "commission_rule_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "serviceType" TEXT NOT NULL,
    "valueType" "TaxValueType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "ruleLevel" "TaxRuleLevel" NOT NULL DEFAULT 'BASE',
    "taxCode" TEXT,
    "taxAuthority" TEXT,
    "isRecoverable" BOOLEAN NOT NULL DEFAULT false,
    "appliesToNet" BOOLEAN NOT NULL DEFAULT true,
    "salesChannels" TEXT[],
    "airlineCode" TEXT,
    "airlineGroup" TEXT,
    "originCode" TEXT,
    "destinationCode" TEXT,
    "marketRegion" TEXT,
    "rbdClass" TEXT,
    "journeyType" TEXT,
    "cabinClass" TEXT,
    "hotelId" TEXT,
    "hotelChain" TEXT,
    "hotelStars" INTEGER,
    "mealPlan" TEXT,
    "supplierCode" TEXT,
    "customerId" TEXT,
    "customerType" TEXT,
    "customerTier" TEXT,
    "tenantId" TEXT,
    "agentCode" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rule_audit_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "tax_rule_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "runningBalance" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Success',
    "recipient" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "approverName" TEXT,
    "status" TEXT NOT NULL,
    "actionDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSharingRule" (
    "id" TEXT NOT NULL,
    "commissionRuleId" TEXT NOT NULL,
    "shareType" TEXT NOT NULL,
    "shareValue" DOUBLE PRECISION NOT NULL,
    "recipientType" TEXT NOT NULL,
    "customerId" TEXT,
    "customerType" TEXT,
    "customerTier" TEXT,
    "minBookingValue" DOUBLE PRECISION,
    "maxShareValue" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSharingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionTransaction" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "commissionRuleId" TEXT NOT NULL,
    "sharingRuleId" TEXT,
    "baseCommission" DOUBLE PRECISION NOT NULL,
    "sharedAmount" DOUBLE PRECISION NOT NULL,
    "retainedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravellerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL DEFAULT 'Mr',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TEXT NOT NULL,
    "gender" TEXT,
    "nationality" TEXT,
    "travellerType" TEXT NOT NULL DEFAULT 'Regular',
    "username" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "email" TEXT,
    "alternateEmail" TEXT,
    "mobile" TEXT,
    "alternateMobile" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "homeAddress" JSONB,
    "businessAddress" JSONB,
    "deliveryAddress" JSONB,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "emergencyPhone" TEXT,
    "emergencyEmail" TEXT,
    "noEmail" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "encryptionIv" JSONB,
    "preferredLanguage" TEXT DEFAULT 'en',
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "gdprConsentDate" TIMESTAMP(3),
    "dataRetentionExpiry" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartySharingConsent" BOOLEAN NOT NULL DEFAULT false,
    "externalCRMId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPassport" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "issuingCountry" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "encryptionIv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientVisa" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "visaNumber" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT,
    "dateOfIssue" TEXT NOT NULL,
    "dateOfExpiry" TEXT NOT NULL,
    "encryptionIv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientVisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDependent" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "alternateMobile" TEXT,
    "flightPreferences" JSONB,
    "hotelPreferences" JSONB,
    "carPreferences" JSONB,
    "passportNumber" TEXT,
    "passportExpiry" TEXT,
    "passportNationality" TEXT,
    "visaNumber" TEXT,
    "visaExpiry" TEXT,
    "encryptionIv" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreferences" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "flightPreferences" JSONB,
    "hotelPreferences" JSONB,
    "carPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "documentType" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPersonalCard" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardOption" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "nameOnCard" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "cardNumberLast4" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "product" TEXT,
    "encryptionIv" TEXT,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPersonalCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAssociation" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "associatedClientId" TEXT NOT NULL,
    "associatedClientName" TEXT NOT NULL,
    "associationType" TEXT,
    "associatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomAlert" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "triggerDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "notificationChannels" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT,
    "integrationType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "requestPayload" TEXT,
    "responsePayload" TEXT,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "syncDirection" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Agent',
    "title" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" TEXT,
    "language" TEXT DEFAULT 'English',
    "allowAutoTicket" BOOLEAN NOT NULL DEFAULT true,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postCode" TEXT,
    "telephone" TEXT,
    "mobile" TEXT,
    "remarks" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "address3" TEXT,
    "city" TEXT,
    "userId" TEXT,
    "tier" TEXT,
    "comments" TEXT,
    "totalSpent" DOUBLE PRECISION,
    "state" TEXT,
    "postCode" TEXT,
    "country" TEXT,
    "telephone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactMobile" TEXT,
    "remark" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteAsset" (
    "id" TEXT NOT NULL,
    "subUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postCode" TEXT,
    "country" TEXT,
    "telephone1" TEXT,
    "telephone2" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "taxId" TEXT,
    "panNo" TEXT,
    "serviceTaxNo" TEXT,
    "atolNo" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "swiftCode" TEXT,
    "rtgsCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "settlementPeriod" TEXT NOT NULL DEFAULT 'Monthly',
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financialRemarks" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "loginStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierAlert" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierContract" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contractRef" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "netMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SupplierContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMetric" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latencyMs" INTEGER NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "pnrVelocity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyExchangeRate" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "inverseRate" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "corporateAccountId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lineItems" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierSettlement" (
    "id" TEXT NOT NULL,
    "settlementNo" TEXT NOT NULL,
    "supplierWalletId" TEXT NOT NULL,
    "settlementPeriodStart" TIMESTAMP(3) NOT NULL,
    "settlementPeriodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "lineItems" JSONB,
    "exchangeRate" DOUBLE PRECISION,
    "localAmount" DOUBLE PRECISION,
    "localCurrency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "adjustments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustmentReason" TEXT,
    "notes" TEXT,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "parentAccountId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debitTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "entryNo" TEXT NOT NULL,
    "transactionId" TEXT,
    "bookingId" TEXT,
    "bookingRef" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "balanceBefore" DOUBLE PRECISION,
    "balanceAfter" DOUBLE PRECISION,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "invoiceId" TEXT,

    CONSTRAINT "financial_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_queues" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "queueType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passengerType" TEXT NOT NULL DEFAULT 'ADULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "lineItems" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuffelOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "pnr" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCurrency" TEXT NOT NULL DEFAULT 'USD',
    "passengers" JSONB NOT NULL,
    "slices" JSONB NOT NULL,
    "taxAmount" DOUBLE PRECISION,
    "taxCurrency" TEXT,
    "ticketingStatus" TEXT,
    "paymentStatus" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuffelOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuffelOfferRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "passengers" JSONB NOT NULL,
    "cabinClass" TEXT NOT NULL DEFAULT 'economy',
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuffelOfferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuffelOffer" (
    "id" TEXT NOT NULL,
    "offerRequestId" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "taxAmount" TEXT,
    "currency" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuffelOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiteApiBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "otaBookingId" TEXT,
    "localBookingId" TEXT,
    "status" TEXT NOT NULL,
    "hotelId" TEXT,
    "hotelName" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION,
    "totalAmount" TEXT,
    "currency" TEXT NOT NULL,
    "cancellationPax" JSONB,
    "rooms" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiteApiBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrebookSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "transactionId" TEXT,
    "flightType" TEXT NOT NULL DEFAULT 'duffel',
    "offerId" TEXT,
    "hotelId" TEXT,
    "price" TEXT,
    "currency" TEXT,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bookingId" TEXT,
    "searchParams" JSONB,
    "selectedOffer" JSONB,
    "tenantId" TEXT,
    "salesChannel" TEXT NOT NULL DEFAULT 'SUBAGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrebookSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineChangeRequest" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT,
    "bookingId" TEXT NOT NULL,
    "bookingRef" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT,
    "requestedRole" TEXT,
    "submittedBy" TEXT,
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT,
    "description" TEXT,
    "attachments" JSONB,
    "internalRemarks" TEXT,
    "requestDetails" JSONB,
    "resolutionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineRequestAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineRequestNotificationQueue" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "OfflineRequestNotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierHotelMapping" (
    "id" TEXT NOT NULL,
    "supplierHotelId" TEXT NOT NULL,
    "localHotelId" TEXT,
    "hotelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierHotelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "relatedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "sender" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "white_label_themes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "customCss" TEXT,
    "featureFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "white_label_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT NOT NULL DEFAULT 'RETAIL',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markupRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markupRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "terms" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_bookings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "productType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "travelDate" TEXT,
    "returnDate" TEXT,
    "pnr" TEXT,
    "ticketNo" TEXT,
    "issuedDate" TIMESTAMP(3),
    "bookedBy" TEXT,
    "remarks" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_center_agents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "skills" TEXT[],
    "maxConcurrentCalls" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "call_center_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_queues" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "slaTimeout" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_queue_assignments" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_queue_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "queueId" TEXT,
    "agentId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "callerNumber" TEXT,
    "callerName" TEXT,
    "callerEmail" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "waitTime" INTEGER NOT NULL DEFAULT 0,
    "talkTime" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "disposition" TEXT,
    "remarks" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_interactions" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "content" TEXT NOT NULL,
    "agentId" TEXT,
    "agentName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_agentCode_key" ON "tenants"("agentCode");

-- CreateIndex
CREATE INDEX "tenants_agentCode_idx" ON "tenants"("agentCode");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_type_idx" ON "tenants"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sales_channels_channelCode_key" ON "sales_channels"("channelCode");

-- CreateIndex
CREATE UNIQUE INDEX "sales_channels_slug_key" ON "sales_channels"("slug");

-- CreateIndex
CREATE INDEX "sales_channels_tenantId_idx" ON "sales_channels"("tenantId");

-- CreateIndex
CREATE INDEX "sales_channels_channelCode_idx" ON "sales_channels"("channelCode");

-- CreateIndex
CREATE UNIQUE INDEX "sales_channels_tenantId_channelCode_key" ON "sales_channels"("tenantId", "channelCode");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "api_keys"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingRef_key" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_tenantId_idx" ON "bookings"("tenantId");

-- CreateIndex
CREATE INDEX "bookings_salesChannel_idx" ON "bookings"("salesChannel");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_agentCode_idx" ON "bookings"("agentCode");

-- CreateIndex
CREATE INDEX "bookings_bookingDate_idx" ON "bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "bookings_corporateId_idx" ON "bookings"("corporateId");

-- CreateIndex
CREATE INDEX "bookings_subagentId_idx" ON "bookings"("subagentId");

-- CreateIndex
CREATE INDEX "booking_segments_bookingId_idx" ON "booking_segments"("bookingId");

-- CreateIndex
CREATE INDEX "booking_segments_status_idx" ON "booking_segments"("status");

-- CreateIndex
CREATE INDEX "booking_segments_type_idx" ON "booking_segments"("type");

-- CreateIndex
CREATE INDEX "documents_bookingId_idx" ON "documents"("bookingId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "service_requests_bookingId_idx" ON "service_requests"("bookingId");

-- CreateIndex
CREATE INDEX "service_requests_type_status_idx" ON "service_requests"("type", "status");

-- CreateIndex
CREATE INDEX "approvals_bookingId_idx" ON "approvals"("bookingId");

-- CreateIndex
CREATE INDEX "approvals_serviceRequestId_idx" ON "approvals"("serviceRequestId");

-- CreateIndex
CREATE INDEX "approvals_level_idx" ON "approvals"("level");

-- CreateIndex
CREATE INDEX "status_change_logs_bookingId_idx" ON "status_change_logs"("bookingId");

-- CreateIndex
CREATE INDEX "status_change_logs_changedAt_idx" ON "status_change_logs"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_switch_approvals_bookingId_key" ON "client_switch_approvals"("bookingId");

-- CreateIndex
CREATE INDEX "client_switch_approvals_bookingId_idx" ON "client_switch_approvals"("bookingId");

-- CreateIndex
CREATE INDEX "client_switch_approvals_status_idx" ON "client_switch_approvals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiryId_key" ON "enquiries"("enquiryId");

-- CreateIndex
CREATE INDEX "enquiries_tenantId_idx" ON "enquiries"("tenantId");

-- CreateIndex
CREATE INDEX "enquiries_corporateId_idx" ON "enquiries"("corporateId");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_travellers_employeeId_key" ON "corporate_travellers"("employeeId");

-- CreateIndex
CREATE INDEX "corporate_travellers_tenantId_idx" ON "corporate_travellers"("tenantId");

-- CreateIndex
CREATE INDEX "corporate_travellers_corporateId_idx" ON "corporate_travellers"("corporateId");

-- CreateIndex
CREATE INDEX "corporate_travellers_email_idx" ON "corporate_travellers"("email");

-- CreateIndex
CREATE INDEX "contacts_tenantId_idx" ON "contacts"("tenantId");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_salesChannel_idx" ON "contacts"("salesChannel");

-- CreateIndex
CREATE UNIQUE INDEX "activities_slug_key" ON "activities"("slug");

-- CreateIndex
CREATE INDEX "activities_contactId_idx" ON "activities"("contactId");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_scheduledAt_idx" ON "activities"("scheduledAt");

-- CreateIndex
CREATE INDEX "preferences_contactId_idx" ON "preferences"("contactId");

-- CreateIndex
CREATE INDEX "preferences_category_idx" ON "preferences"("category");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_contactId_category_key_key" ON "preferences"("contactId", "category", "key");

-- CreateIndex
CREATE INDEX "inventory_blocks_tenantId_idx" ON "inventory_blocks"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_blocks_provider_idx" ON "inventory_blocks"("provider");

-- CreateIndex
CREATE INDEX "inventory_blocks_status_idx" ON "inventory_blocks"("status");

-- CreateIndex
CREATE INDEX "inventory_blocks_expiryDate_idx" ON "inventory_blocks"("expiryDate");

-- CreateIndex
CREATE INDEX "inventory_blocks_type_idx" ON "inventory_blocks"("type");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transactions_slug_key" ON "inventory_transactions"("slug");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryBlockId_idx" ON "inventory_transactions"("inventoryBlockId");

-- CreateIndex
CREATE INDEX "inventory_transactions_bookingId_idx" ON "inventory_transactions"("bookingId");

-- CreateIndex
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions"("type");

-- CreateIndex
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_allocations_inventoryBlockId_idx" ON "inventory_allocations"("inventoryBlockId");

-- CreateIndex
CREATE INDEX "inventory_allocations_bookingRef_idx" ON "inventory_allocations"("bookingRef");

-- CreateIndex
CREATE INDEX "inventory_allocations_tenantId_idx" ON "inventory_allocations"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_allocations_status_idx" ON "inventory_allocations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");

-- CreateIndex
CREATE INDEX "notification_templates_tenantId_idx" ON "notification_templates"("tenantId");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_channel_idx" ON "notification_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_logs_tenantId_idx" ON "notification_logs"("tenantId");

-- CreateIndex
CREATE INDEX "notification_logs_bookingRef_idx" ON "notification_logs"("bookingRef");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notification_logs_nextRetryAt_idx" ON "notification_logs"("nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_walletNo_key" ON "wallets"("walletNo");

-- CreateIndex
CREATE INDEX "wallets_ownerType_ownerId_idx" ON "wallets"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "wallets_status_idx" ON "wallets"("status");

-- CreateIndex
CREATE INDEX "currency_accounts_currency_idx" ON "currency_accounts"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "currency_accounts_walletId_currency_key" ON "currency_accounts"("walletId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_transactionNo_key" ON "wallet_transactions"("transactionNo");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_category_idx" ON "wallet_transactions"("category");

-- CreateIndex
CREATE INDEX "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_referenceId_idx" ON "wallet_transactions"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_holds_holdNo_key" ON "wallet_holds"("holdNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_holds_slug_key" ON "wallet_holds"("slug");

-- CreateIndex
CREATE INDEX "wallet_holds_walletId_idx" ON "wallet_holds"("walletId");

-- CreateIndex
CREATE INDEX "wallet_holds_status_idx" ON "wallet_holds"("status");

-- CreateIndex
CREATE INDEX "wallet_holds_bookingRef_idx" ON "wallet_holds"("bookingRef");

-- CreateIndex
CREATE INDEX "agent_credit_limits_walletId_idx" ON "agent_credit_limits"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_credit_limits_walletId_key" ON "agent_credit_limits"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_refunds_refundNo_key" ON "wallet_refunds"("refundNo");

-- CreateIndex
CREATE INDEX "wallet_refunds_walletId_idx" ON "wallet_refunds"("walletId");

-- CreateIndex
CREATE INDEX "wallet_refunds_bookingRef_idx" ON "wallet_refunds"("bookingRef");

-- CreateIndex
CREATE INDEX "wallet_refunds_status_idx" ON "wallet_refunds"("status");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_logs_walletId_idx" ON "wallet_reconciliation_logs"("walletId");

-- CreateIndex
CREATE INDEX "wallet_reconciliation_logs_reconciledAt_idx" ON "wallet_reconciliation_logs"("reconciledAt");

-- CreateIndex
CREATE INDEX "corporate_accounts_walletId_idx" ON "corporate_accounts"("walletId");

-- CreateIndex
CREATE INDEX "corporate_accounts_corporateId_idx" ON "corporate_accounts"("corporateId");

-- CreateIndex
CREATE INDEX "supplier_wallets_walletId_idx" ON "supplier_wallets"("walletId");

-- CreateIndex
CREATE INDEX "supplier_wallets_supplierCode_idx" ON "supplier_wallets"("supplierCode");

-- CreateIndex
CREATE UNIQUE INDEX "markup_rules_slug_key" ON "markup_rules"("slug");

-- CreateIndex
CREATE INDEX "markup_rules_serviceType_isActive_priority_idx" ON "markup_rules"("serviceType", "isActive", "priority");

-- CreateIndex
CREATE INDEX "markup_rules_airlineCode_destinationCode_idx" ON "markup_rules"("airlineCode", "destinationCode");

-- CreateIndex
CREATE INDEX "markup_rules_hotelId_hotelChain_idx" ON "markup_rules"("hotelId", "hotelChain");

-- CreateIndex
CREATE INDEX "markup_rules_tenantId_idx" ON "markup_rules"("tenantId");

-- CreateIndex
CREATE INDEX "markup_rules_effectiveFrom_effectiveTo_idx" ON "markup_rules"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "markup_rule_audit_logs_ruleId_action_idx" ON "markup_rule_audit_logs"("ruleId", "action");

-- CreateIndex
CREATE INDEX "markup_rule_audit_logs_changedAt_idx" ON "markup_rule_audit_logs"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rules_slug_key" ON "commission_rules"("slug");

-- CreateIndex
CREATE INDEX "commission_rules_sourceType_serviceType_isActive_idx" ON "commission_rules"("sourceType", "serviceType", "isActive");

-- CreateIndex
CREATE INDEX "commission_rules_supplierCode_idx" ON "commission_rules"("supplierCode");

-- CreateIndex
CREATE INDEX "commission_rules_tenantId_idx" ON "commission_rules"("tenantId");

-- CreateIndex
CREATE INDEX "commission_rule_audit_logs_ruleId_action_idx" ON "commission_rule_audit_logs"("ruleId", "action");

-- CreateIndex
CREATE INDEX "commission_rule_audit_logs_changedAt_idx" ON "commission_rule_audit_logs"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rules_slug_key" ON "tax_rules"("slug");

-- CreateIndex
CREATE INDEX "tax_rules_serviceType_isActive_priority_idx" ON "tax_rules"("serviceType", "isActive", "priority");

-- CreateIndex
CREATE INDEX "tax_rules_taxCode_idx" ON "tax_rules"("taxCode");

-- CreateIndex
CREATE INDEX "tax_rules_tenantId_idx" ON "tax_rules"("tenantId");

-- CreateIndex
CREATE INDEX "tax_rules_effectiveFrom_effectiveTo_idx" ON "tax_rules"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "tax_rule_audit_logs_ruleId_action_idx" ON "tax_rule_audit_logs"("ruleId", "action");

-- CreateIndex
CREATE INDEX "tax_rule_audit_logs_changedAt_idx" ON "tax_rule_audit_logs"("changedAt");

-- CreateIndex
CREATE INDEX "ApprovalHistory_bookingId_idx" ON "ApprovalHistory"("bookingId");

-- CreateIndex
CREATE INDEX "ApprovalHistory_approvalLevel_idx" ON "ApprovalHistory"("approvalLevel");

-- CreateIndex
CREATE INDEX "CommissionSharingRule_commissionRuleId_recipientType_isActi_idx" ON "CommissionSharingRule"("commissionRuleId", "recipientType", "isActive");

-- CreateIndex
CREATE INDEX "CommissionSharingRule_priority_idx" ON "CommissionSharingRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionTransaction_slug_key" ON "CommissionTransaction"("slug");

-- CreateIndex
CREATE INDEX "CommissionTransaction_bookingRef_status_idx" ON "CommissionTransaction"("bookingRef", "status");

-- CreateIndex
CREATE INDEX "CommissionTransaction_commissionRuleId_idx" ON "CommissionTransaction"("commissionRuleId");

-- CreateIndex
CREATE INDEX "CommissionTransaction_createdAt_idx" ON "CommissionTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "TravellerProfile_tenantId_status_idx" ON "TravellerProfile"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TravellerProfile_email_mobile_idx" ON "TravellerProfile"("email", "mobile");

-- CreateIndex
CREATE INDEX "TravellerProfile_travellerType_idx" ON "TravellerProfile"("travellerType");

-- CreateIndex
CREATE INDEX "TravellerProfile_createdAt_idx" ON "TravellerProfile"("createdAt");

-- CreateIndex
CREATE INDEX "ClientPassport_travellerId_idx" ON "ClientPassport"("travellerId");

-- CreateIndex
CREATE INDEX "ClientPassport_expiryDate_status_idx" ON "ClientPassport"("expiryDate", "status");

-- CreateIndex
CREATE INDEX "ClientVisa_travellerId_idx" ON "ClientVisa"("travellerId");

-- CreateIndex
CREATE INDEX "ClientVisa_dateOfExpiry_idx" ON "ClientVisa"("dateOfExpiry");

-- CreateIndex
CREATE INDEX "ClientDependent_travellerId_idx" ON "ClientDependent"("travellerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreferences_travellerId_key" ON "ClientPreferences"("travellerId");

-- CreateIndex
CREATE INDEX "ClientPreferences_travellerId_idx" ON "ClientPreferences"("travellerId");

-- CreateIndex
CREATE INDEX "ClientDocument_travellerId_idx" ON "ClientDocument"("travellerId");

-- CreateIndex
CREATE INDEX "ClientDocument_documentType_idx" ON "ClientDocument"("documentType");

-- CreateIndex
CREATE INDEX "ClientPersonalCard_travellerId_idx" ON "ClientPersonalCard"("travellerId");

-- CreateIndex
CREATE INDEX "ClientAssociation_travellerId_idx" ON "ClientAssociation"("travellerId");

-- CreateIndex
CREATE INDEX "ClientAssociation_associatedClientId_idx" ON "ClientAssociation"("associatedClientId");

-- CreateIndex
CREATE INDEX "CustomAlert_travellerId_isActive_idx" ON "CustomAlert"("travellerId", "isActive");

-- CreateIndex
CREATE INDEX "CustomAlert_triggerDate_severity_idx" ON "CustomAlert"("triggerDate", "severity");

-- CreateIndex
CREATE INDEX "IntegrationLog_travellerId_idx" ON "IntegrationLog"("travellerId");

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationType_status_idx" ON "IntegrationLog"("integrationType", "status");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubUser_username_key" ON "SubUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SubUser_email_key" ON "SubUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_baseCurrency_quoteCurrency_idx" ON "CurrencyExchangeRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_validFrom_idx" ON "CurrencyExchangeRate"("validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyExchangeRate_baseCurrency_quoteCurrency_validFrom_key" ON "CurrencyExchangeRate"("baseCurrency", "quoteCurrency", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateInvoice_invoiceNo_key" ON "CorporateInvoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "CorporateInvoice_corporateAccountId_idx" ON "CorporateInvoice"("corporateAccountId");

-- CreateIndex
CREATE INDEX "CorporateInvoice_status_idx" ON "CorporateInvoice"("status");

-- CreateIndex
CREATE INDEX "CorporateInvoice_dueDate_idx" ON "CorporateInvoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierSettlement_settlementNo_key" ON "SupplierSettlement"("settlementNo");

-- CreateIndex
CREATE INDEX "SupplierSettlement_supplierWalletId_idx" ON "SupplierSettlement"("supplierWalletId");

-- CreateIndex
CREATE INDEX "SupplierSettlement_status_idx" ON "SupplierSettlement"("status");

-- CreateIndex
CREATE INDEX "SupplierSettlement_settlementPeriodStart_idx" ON "SupplierSettlement"("settlementPeriodStart");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_accountNo_key" ON "LedgerAccount"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_slug_key" ON "LedgerAccount"("slug");

-- CreateIndex
CREATE INDEX "LedgerAccount_accountType_idx" ON "LedgerAccount"("accountType");

-- CreateIndex
CREATE INDEX "LedgerAccount_currency_idx" ON "LedgerAccount"("currency");

-- CreateIndex
CREATE INDEX "LedgerAccount_isActive_idx" ON "LedgerAccount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_entryNo_key" ON "LedgerEntry"("entryNo");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_slug_key" ON "LedgerEntry"("slug");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_bookingId_idx" ON "LedgerEntry"("bookingId");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "financial_events_entity_idx" ON "financial_events"("entity");

-- CreateIndex
CREATE INDEX "financial_events_entityId_idx" ON "financial_events"("entityId");

-- CreateIndex
CREATE INDEX "financial_events_createdAt_idx" ON "financial_events"("createdAt");

-- CreateIndex
CREATE INDEX "booking_queues_bookingId_idx" ON "booking_queues"("bookingId");

-- CreateIndex
CREATE INDEX "booking_queues_status_idx" ON "booking_queues"("status");

-- CreateIndex
CREATE INDEX "booking_passengers_bookingId_idx" ON "booking_passengers"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_bookingId_idx" ON "invoices"("bookingId");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DuffelOrder_orderId_key" ON "DuffelOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "LiteApiBooking_bookingId_key" ON "LiteApiBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "PrebookSession_sessionId_key" ON "PrebookSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrebookSession_transactionId_key" ON "PrebookSession"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineChangeRequest_requestRef_key" ON "OfflineChangeRequest"("requestRef");

-- CreateIndex
CREATE INDEX "SupplierHotelMapping_supplierHotelId_idx" ON "SupplierHotelMapping"("supplierHotelId");

-- CreateIndex
CREATE INDEX "SupplierHotelMapping_localHotelId_idx" ON "SupplierHotelMapping"("localHotelId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardType_code_key" ON "BoardType"("code");

-- CreateIndex
CREATE INDEX "support_tickets_tenantId_idx" ON "support_tickets"("tenantId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "white_label_themes_tenantId_key" ON "white_label_themes"("tenantId");

-- CreateIndex
CREATE INDEX "white_label_themes_tenantId_idx" ON "white_label_themes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "webhook_logs_supplier_idx" ON "webhook_logs"("supplier");

-- CreateIndex
CREATE INDEX "webhook_logs_eventType_idx" ON "webhook_logs"("eventType");

-- CreateIndex
CREATE INDEX "webhook_logs_processed_idx" ON "webhook_logs"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "partners_code_key" ON "partners"("code");

-- CreateIndex
CREATE INDEX "partners_tenantId_idx" ON "partners"("tenantId");

-- CreateIndex
CREATE INDEX "partners_status_idx" ON "partners"("status");

-- CreateIndex
CREATE INDEX "partners_code_idx" ON "partners"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_agreementNumber_key" ON "agreements"("agreementNumber");

-- CreateIndex
CREATE INDEX "agreements_partnerId_idx" ON "agreements"("partnerId");

-- CreateIndex
CREATE INDEX "agreements_status_idx" ON "agreements"("status");

-- CreateIndex
CREATE INDEX "agreements_startDate_endDate_idx" ON "agreements"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_bookings_bookingRef_key" ON "b2b_bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "b2b_bookings_tenantId_idx" ON "b2b_bookings"("tenantId");

-- CreateIndex
CREATE INDEX "b2b_bookings_partnerId_idx" ON "b2b_bookings"("partnerId");

-- CreateIndex
CREATE INDEX "b2b_bookings_status_idx" ON "b2b_bookings"("status");

-- CreateIndex
CREATE INDEX "b2b_bookings_bookingRef_idx" ON "b2b_bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "b2b_bookings_createdAt_idx" ON "b2b_bookings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "call_center_agents_username_key" ON "call_center_agents"("username");

-- CreateIndex
CREATE UNIQUE INDEX "call_center_agents_email_key" ON "call_center_agents"("email");

-- CreateIndex
CREATE INDEX "call_center_agents_tenantId_idx" ON "call_center_agents"("tenantId");

-- CreateIndex
CREATE INDEX "call_center_agents_status_idx" ON "call_center_agents"("status");

-- CreateIndex
CREATE INDEX "call_center_agents_role_idx" ON "call_center_agents"("role");

-- CreateIndex
CREATE UNIQUE INDEX "call_queues_code_key" ON "call_queues"("code");

-- CreateIndex
CREATE INDEX "call_queues_tenantId_idx" ON "call_queues"("tenantId");

-- CreateIndex
CREATE INDEX "call_queues_status_idx" ON "call_queues"("status");

-- CreateIndex
CREATE INDEX "call_queue_assignments_agentId_idx" ON "call_queue_assignments"("agentId");

-- CreateIndex
CREATE INDEX "call_queue_assignments_queueId_idx" ON "call_queue_assignments"("queueId");

-- CreateIndex
CREATE UNIQUE INDEX "call_queue_assignments_agentId_queueId_key" ON "call_queue_assignments"("agentId", "queueId");

-- CreateIndex
CREATE UNIQUE INDEX "calls_callId_key" ON "calls"("callId");

-- CreateIndex
CREATE INDEX "calls_queueId_idx" ON "calls"("queueId");

-- CreateIndex
CREATE INDEX "calls_agentId_idx" ON "calls"("agentId");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE INDEX "calls_createdAt_idx" ON "calls"("createdAt");

-- CreateIndex
CREATE INDEX "call_interactions_callId_idx" ON "call_interactions"("callId");

-- CreateIndex
CREATE INDEX "call_interactions_createdAt_idx" ON "call_interactions"("createdAt");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_salesChannelId_fkey" FOREIGN KEY ("salesChannelId") REFERENCES "sales_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inventoryBlockId_fkey" FOREIGN KEY ("inventoryBlockId") REFERENCES "inventory_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_change_logs" ADD CONSTRAINT "status_change_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_switch_approvals" ADD CONSTRAINT "client_switch_approvals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_parentBlockId_fkey" FOREIGN KEY ("parentBlockId") REFERENCES "inventory_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryBlockId_fkey" FOREIGN KEY ("inventoryBlockId") REFERENCES "inventory_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_accounts" ADD CONSTRAINT "currency_accounts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_accounts" ADD CONSTRAINT "currency_accounts_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_currencyAccountId_fkey" FOREIGN KEY ("currencyAccountId") REFERENCES "currency_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_credit_limits" ADD CONSTRAINT "agent_credit_limits_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_reconciliation_logs" ADD CONSTRAINT "wallet_reconciliation_logs_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_wallets" ADD CONSTRAINT "supplier_wallets_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSharingRule" ADD CONSTRAINT "CommissionSharingRule_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "commission_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionTransaction" ADD CONSTRAINT "CommissionTransaction_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "commission_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionTransaction" ADD CONSTRAINT "CommissionTransaction_sharingRuleId_fkey" FOREIGN KEY ("sharingRuleId") REFERENCES "CommissionSharingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPassport" ADD CONSTRAINT "ClientPassport_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientVisa" ADD CONSTRAINT "ClientVisa_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDependent" ADD CONSTRAINT "ClientDependent_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreferences" ADD CONSTRAINT "ClientPreferences_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPersonalCard" ADD CONSTRAINT "ClientPersonalCard_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssociation" ADD CONSTRAINT "ClientAssociation_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomAlert" ADD CONSTRAINT "CustomAlert_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteAsset" ADD CONSTRAINT "FavoriteAsset_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "SubUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierAlert" ADD CONSTRAINT "SupplierAlert_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierContract" ADD CONSTRAINT "SupplierContract_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMetric" ADD CONSTRAINT "SupplierMetric_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "TravellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierSettlement" ADD CONSTRAINT "SupplierSettlement_supplierWalletId_fkey" FOREIGN KEY ("supplierWalletId") REFERENCES "supplier_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_queues" ADD CONSTRAINT "booking_queues_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuffelOffer" ADD CONSTRAINT "DuffelOffer_offerRequestId_fkey" FOREIGN KEY ("offerRequestId") REFERENCES "DuffelOfferRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineRequestAuditLog" ADD CONSTRAINT "OfflineRequestAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfflineChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineRequestNotificationQueue" ADD CONSTRAINT "OfflineRequestNotificationQueue_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfflineChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_bookings" ADD CONSTRAINT "b2b_bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_bookings" ADD CONSTRAINT "b2b_bookings_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_center_agents" ADD CONSTRAINT "call_center_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_queue_assignments" ADD CONSTRAINT "call_queue_assignments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "call_center_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_queue_assignments" ADD CONSTRAINT "call_queue_assignments_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "call_queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "call_queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "call_center_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_interactions" ADD CONSTRAINT "call_interactions_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
