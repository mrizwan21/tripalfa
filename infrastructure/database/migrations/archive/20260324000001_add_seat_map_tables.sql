-- Migration: Add seat map tables
-- Description: Creates normalized tables for aircraft seat map system

-- Aircraft table
CREATE TABLE aircraft (
    id VARCHAR(255) PRIMARY KEY,
    iata_code VARCHAR(10),
    icao_code VARCHAR(10),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year INT,
    seating_capacity INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cabin configuration (multiple cabins per aircraft)
CREATE TABLE cabin_configuration (
    id VARCHAR(255) PRIMARY KEY,
    aircraft_id VARCHAR(255) NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
    configuration_name VARCHAR(100),
    total_seats INT,
    business_seats INT DEFAULT 0,
    premium_economy_seats INT DEFAULT 0,
    economy_seats INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cabin within a configuration
CREATE TABLE cabin (
    id VARCHAR(255) PRIMARY KEY,
    cabin_configuration_id VARCHAR(255) NOT NULL REFERENCES cabin_configuration(id) ON DELETE CASCADE,
    cabin_class VARCHAR(50) NOT NULL, -- 'first', 'business', 'premium_economy', 'economy'
    deck INT DEFAULT 0,
    aisles INT DEFAULT 1,
    wing_position_first_row_index INT,
    wing_position_last_row_index INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seat rows within a cabin
CREATE TABLE seat_row (
    id VARCHAR(255) PRIMARY KEY,
    cabin_id VARCHAR(255) NOT NULL REFERENCES cabin(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cabin_id, row_number)
);

-- Seat sections within a row (left, middle, right)
CREATE TABLE seat_section (
    id VARCHAR(255) PRIMARY KEY,
    seat_row_id VARCHAR(255) NOT NULL REFERENCES seat_row(id) ON DELETE CASCADE,
    section_index INT NOT NULL, -- 0 = left, 1 = middle, 2 = right
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seat_row_id, section_index)
);

-- Seat elements (seats, empty spaces, lavatories, etc.)
CREATE TABLE seat_element (
    id VARCHAR(255) PRIMARY KEY,
    seat_section_id VARCHAR(255) NOT NULL REFERENCES seat_section(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL, -- 'seat', 'empty', 'bassinet', 'exit_row', 'lavatory', 'galley', 'closet', 'stairs', 'restricted_seat_general'
    designator VARCHAR(10), -- e.g., '14B'
    name VARCHAR(100),
    disclosures TEXT[],
    coordinates_x INT,
    coordinates_y INT,
    amenities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seat map (snapshot for a specific segment)
CREATE TABLE seat_map (
    id VARCHAR(255) PRIMARY KEY,
    segment_id VARCHAR(255) NOT NULL,
    slice_id VARCHAR(255) NOT NULL,
    cabin_configuration_id VARCHAR(255) REFERENCES cabin_configuration(id) ON DELETE SET NULL,
    raw_data JSONB, -- original Duffel seat map JSON
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seat availability per segment (dynamic)
CREATE TABLE seat_availability (
    id VARCHAR(255) PRIMARY KEY,
    seat_element_id VARCHAR(255) NOT NULL REFERENCES seat_element(id) ON DELETE CASCADE,
    segment_id VARCHAR(255) NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'booked', 'blocked', 'reserved'
    passenger_id VARCHAR(255),
    booking_id VARCHAR(255),
    price_amount DECIMAL(12,2),
    price_currency VARCHAR(3),
    service_id VARCHAR(255),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seat_element_id, segment_id)
);

-- Seat service (booked seat)
CREATE TABLE seat_service (
    id VARCHAR(255) PRIMARY KEY,
    seat_availability_id VARCHAR(255) NOT NULL REFERENCES seat_availability(id) ON DELETE CASCADE,
    passenger_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    total_currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_aircraft_iata ON aircraft(iata_code);
CREATE INDEX idx_aircraft_icao ON aircraft(icao_code);
CREATE INDEX idx_cabin_config_aircraft ON cabin_configuration(aircraft_id);
CREATE INDEX idx_cabin_configuration ON cabin(cabin_configuration_id);
CREATE INDEX idx_seat_row_cabin ON seat_row(cabin_id);
CREATE INDEX idx_seat_section_row ON seat_section(seat_row_id);
CREATE INDEX idx_seat_element_section ON seat_element(seat_section_id);
CREATE INDEX idx_seat_map_segment ON seat_map(segment_id);
CREATE INDEX idx_seat_availability_segment ON seat_availability(segment_id);
CREATE INDEX idx_seat_availability_seat_element ON seat_availability(seat_element_id);
CREATE INDEX idx_seat_service_availability ON seat_service(seat_availability_id);

-- Comments
COMMENT ON TABLE aircraft IS 'Aircraft types and basic information';
COMMENT ON TABLE cabin_configuration IS 'Aircraft cabin configurations (multiple layouts per aircraft)';
COMMENT ON TABLE cabin IS 'Individual cabins within a configuration';
COMMENT ON TABLE seat_row IS 'Rows within a cabin';
COMMENT ON TABLE seat_section IS 'Sections within a row (left, middle, right)';
COMMENT ON TABLE seat_element IS 'Seat elements (seats, empty spaces, lavatories, etc.)';
COMMENT ON TABLE seat_map IS 'Snapshot of seat layout for a specific segment';
COMMENT ON TABLE seat_availability IS 'Dynamic availability of seats per segment';
COMMENT ON TABLE seat_service IS 'Booked seat services linking seat, passenger, and booking';