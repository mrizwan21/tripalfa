-- Initial migration for realtime data (Neon Postgres)
-- Partitioned by time for performance and retention

-- Main table for realtime data
CREATE TABLE realtime_data (
    id TEXT NOT NULL,
    vendor TEXT NOT NULL,
    product_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sequence BIGINT,
    PRIMARY KEY (id, ts)
);

-- Indexes for realtime data
CREATE INDEX idx_realtime_vendor_ts ON realtime_data(vendor, ts DESC);
CREATE INDEX idx_realtime_product_ts ON realtime_data(product_id, ts DESC);
CREATE INDEX idx_realtime_ts ON realtime_data(ts DESC);

-- Metrics table for in-repo observability
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tags JSONB DEFAULT '{}',
    value DOUBLE PRECISION NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metrics_y2026 (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tags JSONB DEFAULT '{}',
    value DOUBLE PRECISION NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_name_ts ON metrics(name, ts DESC);

-- Alert rules table
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sql TEXT NOT NULL,
    endpoint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
