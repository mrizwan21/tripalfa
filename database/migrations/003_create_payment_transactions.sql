-- Migration: Create payment_transactions table for payment gateway integration
-- Date: 2026-03-02
-- Purpose: Store payment processor transactions and webhook events

CREATE TABLE IF NOT EXISTS payment_transactions (
  -- Core identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payment details
  processor VARCHAR(50) NOT NULL CHECK (processor IN ('stripe', 'paypal')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'bank_transfer', 'digital_wallet')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED')
  ),
  
  -- External references
  processor_transaction_id VARCHAR(255) NOT NULL,
  processor_reference VARCHAR(255),
  idempotency_key VARCHAR(255) UNIQUE,
  
  -- Refund information
  refund_amount DECIMAL(15, 2),
  refund_processor_id VARCHAR(255),
  
  -- Error tracking
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  last_error_message TEXT,
  last_error_code VARCHAR(255),
  
  -- Metadata
  metadata JSONB,
  webhook_data JSONB,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  captured_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance and queries
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_processor ON payment_transactions(processor);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_currency ON payment_transactions(currency);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_processor_ref ON payment_transactions(processor_transaction_id);
CREATE INDEX idx_payment_transactions_idempotency ON payment_transactions(idempotency_key);

-- Table for webhook events (audit log)
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  processor VARCHAR(50) NOT NULL,
  
  -- Event payload (raw from processor)
  payload JSONB NOT NULL,
  
  -- Processing status
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit
  received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for webhook audit
CREATE INDEX idx_webhook_events_transaction_id ON payment_webhook_events(transaction_id);
CREATE INDEX idx_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX idx_webhook_events_processor ON payment_webhook_events(processor);
CREATE INDEX idx_webhook_events_event_type ON payment_webhook_events(event_type);
CREATE INDEX idx_webhook_events_received_at ON payment_webhook_events(received_at DESC);

-- Table for payment metrics (daily aggregation)
CREATE TABLE IF NOT EXISTS payment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Date/time
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour >= 0 AND metric_hour < 24),
  
  -- Processor breakdown
  processor VARCHAR(50) NOT NULL,
  
  -- Metrics
  total_transactions INTEGER DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  total_volume DECIMAL(15, 2) DEFAULT 0,
  total_refunds DECIMAL(15, 2) DEFAULT 0,
  
  -- Performance
  avg_processing_time_ms DECIMAL(10, 2),
  max_processing_time_ms DECIMAL(10, 2),
  
  -- Currency breakdown (JSON)
  currency_distribution JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for metrics queries
CREATE INDEX idx_metrics_date ON payment_metrics(metric_date DESC);
CREATE INDEX idx_metrics_processor ON payment_metrics(processor);
CREATE INDEX idx_metrics_date_processor ON payment_metrics(metric_date, processor);

-- Enable row level security (if needed for multi-tenancy)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_transactions_updated_at();

CREATE OR REPLACE FUNCTION update_payment_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_metrics_updated_at
BEFORE UPDATE ON payment_metrics
FOR EACH ROW
EXECUTE FUNCTION update_payment_metrics_updated_at();

-- Create helper views for common queries

-- View: Recent transactions summary
CREATE OR REPLACE VIEW v_recent_transactions AS
SELECT
  pt.id,
  pt.user_id,
  pt.processor,
  pt.amount,
  pt.currency,
  pt.status,
  pt.processor_transaction_id,
  pt.retry_count,
  pt.created_at,
  pt.updated_at
FROM payment_transactions pt
ORDER BY pt.created_at DESC
LIMIT 100;

-- View: Daily metrics summary
CREATE OR REPLACE VIEW v_daily_metrics_summary AS
SELECT
  pm.metric_date,
  pm.processor,
  pm.total_transactions,
  pm.successful_transactions,
  pm.failed_transactions,
  pm.total_volume,
  pm.total_refunds,
  ROUND((pm.successful_transactions::numeric / NULLIF(pm.total_transactions, 0) * 100), 2) as success_rate
FROM payment_metrics pm
WHERE pm.metric_hour IS NULL  -- Daily aggregate only
ORDER BY pm.metric_date DESC;

-- Permissions (modify based on your security model)
GRANT SELECT, INSERT ON payment_transactions TO api_role;
GRANT SELECT, INSERT ON payment_webhook_events TO api_role;
GRANT SELECT ON payment_metrics TO api_role;
