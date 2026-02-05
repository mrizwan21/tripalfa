-- Initial migration for static data (local Postgres)
CREATE TABLE static_data (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for static data
CREATE INDEX idx_static_data_type ON static_data(type);
CREATE INDEX idx_static_data_updated_at ON static_data(updated_at);