-- Create static data tables for tripalfa_local database
\c tripalfa_local;

-- Hotel amenities
CREATE TABLE IF NOT EXISTS hotel_amenities (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel board types
CREATE TABLE IF NOT EXISTS hotel_board_types (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel types (hotel, resort, etc.)
CREATE TABLE IF NOT EXISTS hotel_types (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel chains
CREATE TABLE IF NOT EXISTS hotel_chains (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Hotel star ratings
CREATE TABLE IF NOT EXISTS hotel_star_ratings (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel room types
CREATE TABLE IF NOT EXISTS hotel_room_types (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel view types
CREATE TABLE IF NOT EXISTS hotel_view_types (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel payment types
CREATE TABLE IF NOT EXISTS hotel_payment_types (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Hotel destinations
CREATE TABLE IF NOT EXISTS hotel_destinations (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  is_popular BOOLEAN DEFAULT false
);

-- Seed data: Hotel amenities
INSERT INTO hotel_amenities (code, name, is_popular) VALUES
  ('WIFI', 'Wi-Fi', true),
  ('POOL', 'Swimming Pool', true),
  ('GYM', 'Gym', true),
  ('PARKING', 'Parking', false),
  ('SPA', 'Spa', false),
  ('RESTAURANT', 'Restaurant', true),
  ('BAR', 'Bar', false),
  ('ROOM_SERVICE', 'Room Service', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel board types
INSERT INTO hotel_board_types (code, name, is_popular) VALUES
  ('RO', 'Room Only', false),
  ('BB', 'Bed & Breakfast', true),
  ('HB', 'Half Board', true),
  ('FB', 'Full Board', false),
  ('AI', 'All Inclusive', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel types
INSERT INTO hotel_types (code, name, is_popular) VALUES
  ('HOTEL', 'Hotel', true),
  ('RESORT', 'Resort', true),
  ('APARTMENT', 'Apartment', false),
  ('VILLA', 'Villa', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel chains
INSERT INTO hotel_chains (code, name) VALUES
  ('MARRIOTT', 'Marriott'),
  ('HILTON', 'Hilton'),
  ('IHG', 'IHG'),
  ('HYATT', 'Hyatt')
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel star ratings
INSERT INTO hotel_star_ratings (id, name, is_popular) VALUES
  ('3', '3 Star', false),
  ('4', '4 Star', true),
  ('5', '5 Star', true)
ON CONFLICT (id) DO NOTHING;

-- Seed data: Hotel room types
INSERT INTO hotel_room_types (code, name, is_popular) VALUES
  ('STD', 'Standard Room', true),
  ('DLX', 'Deluxe Room', true),
  ('STE', 'Suite', false),
  ('FAM', 'Family Room', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel view types
INSERT INTO hotel_view_types (code, name, is_popular) VALUES
  ('CITY', 'City View', false),
  ('SEA', 'Sea View', true),
  ('POOL', 'Pool View', false),
  ('GARDEN', 'Garden View', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Hotel payment types
INSERT INTO hotel_payment_types (code, name, is_popular) VALUES
  ('PREPAID', 'Prepaid', true),
  ('PAY_AT_HOTEL', 'Pay at Hotel', true)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Popular destinations
INSERT INTO hotel_destinations (id, name, country, city, code, is_popular) VALUES
  ('DXB', 'Dubai', 'UAE', 'Dubai', 'DXB', true),
  ('AUH', 'Abu Dhabi', 'UAE', 'Abu Dhabi', 'AUH', true),
  ('DOH', 'Doha', 'Qatar', 'Doha', 'DOH', true),
  ('BAH', 'Bahrain', 'Bahrain', 'Manama', 'BAH', true)
ON CONFLICT (id) DO NOTHING;

-- Grant read-only user access to all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO static_ro;
