-- 01_wallet_schema.sql
-- Complete wallet and FX management schema for Neon Postgres
-- Run: psql $DATABASE_URL < migrations/01_wallet_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER ACCOUNTS (support customers, agencies, travel suppliers)
-- ============================================================================
-- user_type stored as text to remain compatible with existing schemas

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  user_type VARCHAR(32) NOT NULL DEFAULT 'customer',
  -- Agency/Supplier specific fields
  company_name TEXT,
  tax_id TEXT,
  bank_account_info JSONB, -- encrypted bank details for payouts
  commission_rate NUMERIC(5,2) DEFAULT 0, -- for agencies buying from suppliers
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- WALLETS (per user per currency)
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- existing projects use text user IDs; keep compatibility by using TEXT
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL,
  balance NUMERIC(24,6) NOT NULL DEFAULT 0,
  status VARCHAR(32) DEFAULT 'active', -- active, frozen, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- ============================================================================
-- TRANSACTIONS (all wallet operations - enhanced for multi-user flows)
-- ============================================================================
-- transaction types and flows are stored as text (VARCHAR) for compatibility

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Transaction classification
  type VARCHAR(32) NOT NULL,
  flow VARCHAR(32),
  
  -- Amount and FX
  amount NUMERIC(24,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  fx_rate NUMERIC(24,12),
  base_currency VARCHAR(3),
  base_amount NUMERIC(24,6),
  
  -- Related parties (for multi-party transactions)
  -- keep payer/payee IDs as TEXT to match existing `users.id` type
  payer_id TEXT REFERENCES users(id),
  payee_id TEXT REFERENCES users(id),
  related_transaction_id UUID, -- link to related transaction
  
  -- Business context
  booking_id UUID,     -- booking/order ID
  invoice_id UUID,     -- invoice reference
  counterparty TEXT,   -- external party description
  description TEXT,
  
  -- Gateway and settlement
  gateway VARCHAR(32),
  gateway_reference TEXT,
  gateway_fee NUMERIC(24,6),
  
  -- Status and tracking
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  idempotency_key TEXT UNIQUE,
  exchange_snapshot_fetched_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_reference ON transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================================================
-- LEDGER ENTRIES (double-entry bookkeeping for audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  account TEXT NOT NULL, -- e.g., wallet:USD:<wallet_id>, clearing:stripe_usd, fees:stripe, fx_pnl:usd
  debit NUMERIC(24,6) DEFAULT 0,
  credit NUMERIC(24,6) DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at DESC);

-- ============================================================================
-- EXCHANGE RATE SNAPSHOTS (hourly snapshots from OpenExchangeRates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exchange_rate_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(64) NOT NULL, -- e.g., 'openexchangerates'
  base_currency VARCHAR(3) NOT NULL, -- e.g., 'USD'
  rates JSONB NOT NULL, -- {"EUR":1.12345,"GBP":0.87654,"JPY":110.234,...}
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL, -- timestamp from API (UTC)
  status VARCHAR(32) DEFAULT 'active', -- active, stale, error
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_snapshot_fetched_at ON exchange_rate_snapshots(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_snapshot_created_at ON exchange_rate_snapshots(created_at DESC);

-- ============================================================================
-- SETTLEMENTS (from payment gateways and banks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway VARCHAR(32) NOT NULL, -- stripe, paypal, wise, neobank
  gateway_settlement_id TEXT, -- external settlement/payout ID
  currency VARCHAR(3) NOT NULL,
  amount NUMERIC(24,6) NOT NULL,
  fees NUMERIC(24,6) DEFAULT 0,
  net_amount NUMERIC(24,6), -- amount - fees
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, completed, failed, reversed
  reconciliation_status VARCHAR(32) DEFAULT 'unmatched', -- unmatched, matched, disputed
  raw JSONB, -- original settlement payload
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_gateway_id ON settlements(gateway, gateway_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_settled_at ON settlements(settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);

-- ============================================================================
-- BANK STATEMENTS (reconciliation source)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway VARCHAR(32) NOT NULL,
  statement_date DATE NOT NULL,
  sequence_number INT, -- line number in statement
  amount NUMERIC(24,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  description TEXT,
  reference TEXT, -- transaction reference from statement
  matched BOOLEAN DEFAULT FALSE,
  matched_settlement_id UUID REFERENCES settlements(id),
  raw_line JSONB, -- original statement line
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_statements_gateway_date ON bank_statements(gateway, statement_date);
CREATE INDEX IF NOT EXISTS idx_bank_statements_matched ON bank_statements(matched);

-- ============================================================================
-- SETTLEMENT_TRANSACTION_MAPPING (reconciliation join table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settlement_transaction_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  mapping_type VARCHAR(32), -- primary, chargeback_reversal, etc.
  variance_amount NUMERIC(24,6) DEFAULT 0, -- settlement amount - transaction amount
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mapping_settlement_id ON settlement_transaction_mappings(settlement_id);
CREATE INDEX IF NOT EXISTS idx_mapping_transaction_id ON settlement_transaction_mappings(transaction_id);

-- ============================================================================
-- DISPUTES & CHARGEBACKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  gateway VARCHAR(32),
  gateway_dispute_id TEXT,
  reason_code VARCHAR(64),
  amount NUMERIC(24,6),
  status VARCHAR(32) DEFAULT 'open', -- open, lost, won, reversed
  reserved_balance NUMERIC(24,6) DEFAULT 0, -- funds held pending resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_gateway_id ON disputes(gateway, gateway_dispute_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- ============================================================================
-- FX ADJUSTMENT LOG (record of FX P&L adjustments during reconciliation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fx_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID REFERENCES settlements(id),
  adjustment_type VARCHAR(32), -- gain, loss, rounding
  amount NUMERIC(24,6),
  currency VARCHAR(3),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fx_adjustments_settlement ON fx_adjustments(settlement_id);

-- ============================================================================
-- IDEMPOTENCY KEYS (track processed operations by key)
-- ============================================================================
CREATE TABLE IF NOT EXISTS idempotency_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  request_hash TEXT, -- SHA256 of request body
  response JSONB, -- cached response
  status_code INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_cache(expires_at);

-- ============================================================================
-- WEBHOOK EVENTS (audit trail for all webhook deliveries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway VARCHAR(32) NOT NULL,
  event_type VARCHAR(64) NOT NULL, -- payment.success, payout.completed, chargeback.created, etc.
  external_event_id TEXT, -- event ID from gateway
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway_type ON webhook_events(gateway, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- ============================================================================
-- AUDIT LOG (immutable operation log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- actor_id uses TEXT to be compatible with existing users.id
  actor_id TEXT REFERENCES users(id),
  actor_type VARCHAR(32), -- user, admin, system, gateway
  action VARCHAR(64),
  resource_type VARCHAR(32),
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- CONSTRAINTS & TRIGGERS
-- ============================================================================

-- Prevent wallet balance from going negative (with safety margin)
ALTER TABLE wallets
ADD CONSTRAINT wallets_balance_non_negative
CHECK (balance >= 0);

-- Ensure transaction amounts are positive
ALTER TABLE transactions
ADD CONSTRAINT transactions_amount_positive
CHECK (amount > 0);

-- Ensure ledger entries have either debit or credit (not both, not zero)
ALTER TABLE ledger_entries
ADD CONSTRAINT ledger_debit_or_credit
CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0));

-- Create trigger to update wallet updated_at on transaction
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wallets SET updated_at = now() WHERE id = NEW.wallet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_transaction_update_wallet_ts
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- ============================================================================
-- SAMPLE DATA (optional, remove in production)
-- ============================================================================
-- CREATE USER for service (if needed)
-- CREATE USER wallet_service WITH PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE postgres TO wallet_service;
-- GRANT USAGE ON SCHEMA public TO wallet_service;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wallet_service;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wallet_service;
