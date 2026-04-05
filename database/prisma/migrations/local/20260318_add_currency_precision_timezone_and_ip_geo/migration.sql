-- Add currency metadata fields to shared.currencies
ALTER TABLE shared.currencies ADD COLUMN decimal_precision INTEGER NOT NULL DEFAULT 2;
ALTER TABLE shared.currencies ADD COLUMN rounding_mode VARCHAR(50) NOT NULL DEFAULT 'ROUND_HALF_UP';

-- Add timezone to hotel.cities
ALTER TABLE hotel.cities ADD COLUMN timezone VARCHAR(50);
CREATE INDEX idx_cities_timezone ON hotel.cities(timezone) WHERE timezone IS NOT NULL;

-- Create IP geolocation cache table
CREATE TABLE shared.ip_geolocation (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  country_code CHAR(2),
  country_name VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  timezone VARCHAR(50),
  isp VARCHAR(200),
  organization VARCHAR(200),
  currency CHAR(3),
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for ip_geolocation
CREATE INDEX idx_ip_geolocation_ip ON shared.ip_geolocation(ip_address);
CREATE INDEX idx_ip_geolocation_country ON shared.ip_geolocation(country_code);
CREATE INDEX idx_ip_geolocation_cached ON shared.ip_geolocation(cached_at DESC);

-- Add comment for currency metadata fields
COMMENT ON COLUMN shared.currencies.decimal_precision IS 'Number of decimal places for currency amounts (typically 2)';
COMMENT ON COLUMN shared.currencies.rounding_mode IS 'Rounding mode to use: ROUND_HALF_UP, ROUND_DOWN, ROUND_CEILING, ROUND_FLOOR, etc.';

-- Add comment for timezone
COMMENT ON COLUMN hotel.cities.timezone IS 'IANA timezone identifier (e.g., America/New_York)';

-- Add comment for ip_geolocation table
COMMENT ON TABLE shared.ip_geolocation IS 'IP geolocation cache from ipapi.co - used for location-based services';
COMMENT ON COLUMN shared.ip_geolocation.expires_at IS 'Cache expiry time - NULL means no expiry';
