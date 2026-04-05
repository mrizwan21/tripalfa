-- Migration: Add order change request tables
-- Description: Creates tables for Duffel order change requests, changes, cancellations, and airline credits
-- Based on Duffel API v2: https://duffel.com/docs/api/v2/order-change-requests

-- Order Change Request table
CREATE TABLE duffel_order_change_request (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    external_id VARCHAR(255) UNIQUE, -- Duffel's order_change_request.id
    order_id VARCHAR(255) NOT NULL REFERENCES duffel_order(id) ON DELETE CASCADE,
    
    -- Request details
    requested_changes JSONB, -- The slices that were requested to be changed
    change_offers JSONB, -- The order_change_offers returned by Duffel
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB,
    
    -- Indexes
    INDEX idx_duffel_order_change_request_external_id (external_id),
    INDEX idx_duffel_order_change_request_order_id (order_id),
    INDEX idx_duffel_order_change_request_status (status),
    INDEX idx_duffel_order_change_request_created_at (created_at)
);

-- Order Change table (confirmed changes)
CREATE TABLE duffel_order_change (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    external_id VARCHAR(255) UNIQUE, -- Duffel's order_change.id
    order_id VARCHAR(255) NOT NULL REFERENCES duffel_order(id) ON DELETE CASCADE,
    order_change_request_id VARCHAR(255) REFERENCES duffel_order_change_request(id) ON DELETE SET NULL,
    
    -- Change details
    selected_order_change_offer_id VARCHAR(255), -- The selected offer ID
    change_details JSONB, -- The full change details from Duffel
    payment_required BOOLEAN DEFAULT FALSE,
    payment_amount DECIMAL(12,2),
    payment_currency VARCHAR(3) DEFAULT 'USD',
    refund_amount DECIMAL(12,2),
    refund_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, expired
    confirmed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    -- Indexes
    INDEX idx_duffel_order_change_external_id (external_id),
    INDEX idx_duffel_order_change_order_id (order_id),
    INDEX idx_duffel_order_change_status (status),
    INDEX idx_duffel_order_change_order_change_request_id (order_change_request_id)
);

-- Order Cancellation table
CREATE TABLE duffel_order_cancellation (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    external_id VARCHAR(255) UNIQUE, -- Duffel's order_cancellation.id
    order_id VARCHAR(255) NOT NULL REFERENCES duffel_order(id) ON DELETE CASCADE,
    
    -- Cancellation details
    refund_amount DECIMAL(12,2),
    refund_currency VARCHAR(3) DEFAULT 'USD',
    refund_to VARCHAR(50), -- original_form_of_payment, airline_credits, voucher
    airline_credits JSONB, -- Airline credits details if applicable
    voucher JSONB, -- Voucher details if applicable
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, expired
    confirmed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    -- Indexes
    INDEX idx_duffel_order_cancellation_external_id (external_id),
    INDEX idx_duffel_order_cancellation_order_id (order_id),
    INDEX idx_duffel_order_cancellation_status (status)
);

-- Airline Credits table
CREATE TABLE duffel_airline_credit (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    external_id VARCHAR(255) UNIQUE, -- Duffel's airline_credit.id
    order_id VARCHAR(255) NOT NULL REFERENCES duffel_order(id) ON DELETE CASCADE,
    order_cancellation_id VARCHAR(255) REFERENCES duffel_order_cancellation(id) ON DELETE SET NULL,
    
    -- Credit details
    airline_iata_code VARCHAR(3) NOT NULL,
    airline_name VARCHAR(255),
    credit_amount DECIMAL(12,2) NOT NULL,
    credit_currency VARCHAR(3) DEFAULT 'USD',
    passenger_id VARCHAR(255),
    ticket_number VARCHAR(255),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, used, expired
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    -- Indexes
    INDEX idx_duffel_airline_credit_external_id (external_id),
    INDEX idx_duffel_airline_credit_order_id (order_id),
    INDEX idx_duffel_airline_credit_airline_iata_code (airline_iata_code),
    INDEX idx_duffel_airline_credit_status (status)
);

-- Add foreign key constraints for existing duffel_order model
-- Note: These relations are already referenced in the duffel_order model comments
-- but need to be explicitly added to the schema.prisma file