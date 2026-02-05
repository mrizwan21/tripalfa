-- KYC & Virtual Card Management System - Neon Database Setup
-- This script creates all necessary tables for the KYC and Virtual Card management system

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create KYC Documents Table
CREATE TABLE kyc_documents (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    issuing_authority VARCHAR(200) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP,
    verified_by VARCHAR,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Create KYC Verifications Table
CREATE TABLE kyc_verifications (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verification_data JSONB,
    verification_result VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP,
    verified_by VARCHAR,
    rejection_reason TEXT,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create KYC Compliance Table
CREATE TABLE kyc_compliance (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR NOT NULL,
    compliance_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    requirements JSONB,
    last_checked_at TIMESTAMP DEFAULT NOW(),
    next_check_at TIMESTAMP,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    issues JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Virtual Cards Table
CREATE TABLE virtual_cards (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR NOT NULL,
    card_number VARCHAR(19) NOT NULL,
    masked_card_number VARCHAR(19) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    card_type VARCHAR(20) NOT NULL,
    spending_limit DECIMAL(15,2) NOT NULL,
    daily_limit DECIMAL(15,2) NOT NULL,
    monthly_limit DECIMAL(15,2) NOT NULL,
    per_transaction_limit DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    usage_type VARCHAR(20) NOT NULL,
    allowed_categories JSONB,
    blocked_categories JSONB,
    allowed_merchants JSONB,
    blocked_merchants JSONB,
    allowed_countries JSONB,
    blocked_countries JSONB,
    allowed_times JSONB,
    notifications JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    last_transaction_at TIMESTAMP
);

-- Create Virtual Card Transactions Table
CREATE TABLE virtual_card_transactions (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id VARCHAR NOT NULL REFERENCES virtual_cards(id) ON DELETE CASCADE,
    company_id VARCHAR NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    merchant_name VARCHAR(200) NOT NULL,
    merchant_category VARCHAR(50) NOT NULL,
    merchant_country VARCHAR(3) NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW(),
    authorization_code VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Create Virtual Card Settings Table
CREATE TABLE virtual_card_settings (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR NOT NULL,
    default_settings JSONB,
    security_settings JSONB,
    notification_settings JSONB,
    compliance_settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_kyc_documents_company_id ON kyc_documents(company_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX idx_kyc_documents_document_type ON kyc_documents(document_type);
CREATE INDEX idx_kyc_verifications_company_id ON kyc_verifications(company_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_compliance_company_id ON kyc_compliance(company_id);
CREATE INDEX idx_kyc_compliance_status ON kyc_compliance(status);
CREATE INDEX idx_kyc_compliance_compliance_type ON kyc_compliance(compliance_type);

CREATE INDEX idx_virtual_cards_company_id ON virtual_cards(company_id);
CREATE INDEX idx_virtual_cards_status ON virtual_cards(status);
CREATE INDEX idx_virtual_cards_card_type ON virtual_cards(card_type);
CREATE INDEX idx_virtual_cards_usage_type ON virtual_cards(usage_type);
CREATE INDEX idx_virtual_cards_is_active ON virtual_cards(is_active);
CREATE INDEX idx_virtual_cards_is_blocked ON virtual_cards(is_blocked);

CREATE INDEX idx_virtual_card_transactions_card_id ON virtual_card_transactions(card_id);
CREATE INDEX idx_virtual_card_transactions_company_id ON virtual_card_transactions(company_id);
CREATE INDEX idx_virtual_card_transactions_status ON virtual_card_transactions(status);
CREATE INDEX idx_virtual_card_transactions_transaction_type ON virtual_card_transactions(transaction_type);
CREATE INDEX idx_virtual_card_transactions_transaction_date ON virtual_card_transactions(transaction_date);

CREATE INDEX idx_virtual_card_settings_company_id ON virtual_card_settings(company_id);

-- Create Function to Update Updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for Updated_at Columns
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_compliance_updated_at BEFORE UPDATE ON kyc_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON virtual_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_virtual_card_settings_updated_at BEFORE UPDATE ON virtual_card_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data for Testing (Optional)
-- Uncomment the following section if you want to add sample data

/*
-- Sample KYC Documents
INSERT INTO kyc_documents (company_id, document_type, document_number, issue_date, expiry_date, issuing_authority, document_url, status) VALUES
('company-001', 'BUSINESS_REGISTRATION', 'BR123456789', '2023-01-01', '2028-01-01', 'Company Registry', 'https://storage.example.com/documents/br123.pdf', 'VERIFIED'),
('company-001', 'TAX_ID', 'TAX987654321', '2023-01-01', '2028-01-01', 'Tax Authority', 'https://storage.example.com/documents/tax987.pdf', 'PENDING'),
('company-002', 'DIRECTOR_ID', 'DIR456789123', '2023-01-01', '2028-01-01', 'Government ID', 'https://storage.example.com/documents/dir456.pdf', 'REJECTED');

-- Sample KYC Verifications
INSERT INTO kyc_verifications (company_id, verification_type, status, verification_result, verified_at, verified_by) VALUES
('company-001', 'BUSINESS_VERIFICATION', 'VERIFIED', 'PASS', NOW(), 'admin-user'),
('company-001', 'DIRECTOR_VERIFICATION', 'PENDING', 'PENDING', NULL, NULL),
('company-002', 'BUSINESS_VERIFICATION', 'REJECTED', 'FAIL', NOW(), 'admin-user');

-- Sample KYC Compliance
INSERT INTO kyc_compliance (company_id, compliance_type, status, compliance_score, requirements) VALUES
('company-001', 'AML', 'COMPLIANT', 95.50, '{"kyc_documents": true, "risk_assessment": true}'),
('company-001', 'KYC', 'COMPLIANT', 90.00, '{"document_verification": true, "pep_check": true}'),
('company-002', 'AML', 'NON_COMPLIANT', 45.00, '{"kyc_documents": false, "risk_assessment": false}');

-- Sample Virtual Cards
INSERT INTO virtual_cards (company_id, card_number, masked_card_number, cvv, expiry_date, cardholder_name, currency, status, card_type, spending_limit, daily_limit, monthly_limit, per_transaction_limit, usage_type, allowed_categories, blocked_categories, allowed_countries, blocked_countries) VALUES
('company-001', '4532015112830366', '453201******0366', '123', '2026-12-31', 'John Doe', 'USD', 'ACTIVE', 'MULTI_USE', 10000.00, 2000.00, 10000.00, 500.00, 'BOTH', '["TRAVEL", "HOTEL"]', '["GAMBLING"]', '["US", "CA"]', '["IR", "SY"]'),
('company-001', '4916123456789012', '491612******9012', '456', '2026-12-31', 'Jane Smith', 'USD', 'PENDING', 'SINGLE_USE', 500.00, 500.00, 500.00, 500.00, 'ONLINE', '["TRAVEL"]', '[]', '["US"]', '[]');

-- Sample Virtual Card Transactions
INSERT INTO virtual_card_transactions (card_id, company_id, transaction_type, amount, currency, merchant_name, merchant_category, merchant_country, authorization_code, status) VALUES
((SELECT id FROM virtual_cards WHERE cardholder_name = 'John Doe'), 'company-001', 'PURCHASE', 150.00, 'USD', 'Hotel Example', 'HOTEL', 'US', 'AUTH123456', 'COMPLETED'),
((SELECT id FROM virtual_cards WHERE cardholder_name = 'John Doe'), 'company-001', 'PURCHASE', 75.50, 'USD', 'Restaurant Example', 'FOOD', 'US', 'AUTH789012', 'COMPLETED'),
((SELECT id FROM virtual_cards WHERE cardholder_name = 'Jane Smith'), 'company-001', 'PURCHASE', 250.00, 'USD', 'Airline Example', 'TRAVEL', 'US', 'AUTH345678', 'COMPLETED');

-- Sample Virtual Card Settings
INSERT INTO virtual_card_settings (company_id, default_settings, security_settings, notification_settings, compliance_settings) VALUES
('company-001', '{"default_currency": "USD", "default_card_type": "MULTI_USE"}', '{"mfa_required": true, "session_timeout": 3600}', '{"email_notifications": true, "sms_notifications": false}', '{"kyc_required": true, "max_cards_per_company": 10}'),
('company-002', '{"default_currency": "EUR", "default_card_type": "SINGLE_USE"}', '{"mfa_required": false, "session_timeout": 1800}', '{"email_notifications": true, "sms_notifications": true}', '{"kyc_required": true, "max_cards_per_company": 5}');
*/

-- Verify Tables Created Successfully
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('kyc_documents', 'kyc_verifications', 'kyc_compliance', 'virtual_cards', 'virtual_card_transactions', 'virtual_card_settings');