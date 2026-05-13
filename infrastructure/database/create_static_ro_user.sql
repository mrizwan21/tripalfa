-- Create read-only user for tripalfa_local static database
CREATE USER static_ro WITH PASSWORD 'static_secure_password_123!';

-- Grant connection to tripalfa_local database
GRANT CONNECT ON DATABASE tripalfa_local TO static_ro;

-- Connect to tripalfa_local to set up schema permissions
\c tripalfa_local

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO static_ro;

-- Grant select on all existing tables in public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO static_ro;

-- Grant select on all future tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO static_ro;

-- Optional: Restrict write permissions explicitly (redundant but secure)
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM static_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO static_ro;
