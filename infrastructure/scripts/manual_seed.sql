-- Manual Seed Data for Static Database
-- This provides a robust set of airports, airlines, and countries for development

-- Clear existing data
DELETE FROM airports;
DELETE FROM airlines;
DELETE FROM nationalities;
DELETE FROM loyalty_programs;
DELETE FROM countries;
DELETE FROM currencies;

-- Insert Countries
INSERT INTO nationalities (code, name, country) VALUES 
('US', 'United States', 'United States'),
('GB', 'United Kingdom', 'United Kingdom'),
('AE', 'United Arab Emirates', 'United Arab Emirates'),
('IN', 'India', 'India'),
('FR', 'France', 'France'),
('DE', 'Germany', 'Germany'),
('CA', 'Canada', 'Canada'),
('AU', 'Australia', 'Australia'),
('SG', 'Singapore', 'Singapore'),
('TR', 'Turkey', 'Turkey'),
('QA', 'Qatar', 'Qatar'),
('OM', 'Oman', 'Oman'),
('JO', 'Jordan', 'Jordan'),
('EG', 'Egypt', 'Egypt'),
('SA', 'Saudi Arabia', 'Saudi Arabia');

INSERT INTO countries (code, name) SELECT code, name FROM nationalities;

-- Insert Currencies
INSERT INTO currencies (code, name, symbol) VALUES 
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('AED', 'UAE Dirham', 'د.إ'),
('INR', 'Indian Rupee', '₹');

-- Insert Airports
INSERT INTO airports (iata_code, name, city, country, country_code, latitude, longitude) VALUES 
('JFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 40.6413, -73.7781),
('LHR', 'Heathrow Airport', 'London', 'United Kingdom', 'GB', 51.4700, -0.4543),
('DXB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'AE', 25.2532, 55.3657),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 49.0097, 2.5479),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 1.3644, 103.9915),
('HKG', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'HK', 22.3080, 113.9185),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US', 33.9416, -118.4085),
('ORD', 'O''Hare International Airport', 'Chicago', 'United States', 'US', 41.9742, -87.9073),
('AMS', 'Amsterdam Schiphol Airport', 'Amsterdam', 'Netherlands', 'NL', 52.3105, 4.7683),
('FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'DE', 50.0379, 8.5622),
('IST', 'Istanbul Airport', 'Istanbul', 'Turkey', 'TR', 41.2753, 28.7519),
('DEL', 'Indira Gandhi International Airport', 'New Delhi', 'India', 'IN', 28.5562, 77.1000),
('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'IN', 19.0896, 72.8656),
('DOH', 'Hamad International Airport', 'Doha', 'Qatar', 'QA', 25.2731, 51.6081),
('AUH', 'Abu Dhabi International Airport', 'Abu Dhabi', 'United Arab Emirates', 'AE', 24.4330, 54.6511),
('SYD', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'AU', -33.9399, 151.1753),
('NRT', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 35.7720, 140.3929),
('HND', 'Haneda Airport', 'Tokyo', 'Japan', 'JP', 35.5494, 139.7798),
('ICN', 'Incheon International Airport', 'Seoul', 'South Korea', 'KR', 37.4602, 126.4407),
('BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 13.6900, 100.7501),
('KUL', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'MY', 2.7456, 101.7072),
('MCT', 'Muscat International Airport', 'Muscat', 'Oman', 'OM', 23.5933, 58.2844);

-- Insert Airlines with Logos
INSERT INTO airlines (iata_code, name, country, logo_url) VALUES 
('EK', 'Emirates', 'United Arab Emirates', 'https://logo.clearbit.com/emirates.com'),
('QR', 'Qatar Airways', 'Qatar', 'https://logo.clearbit.com/qatarairways.com'),
('EY', 'Etihad Airways', 'United Arab Emirates', 'https://logo.clearbit.com/etihad.com'),
('VS', 'Virgin Atlantic', 'United Kingdom', 'https://logo.clearbit.com/virginatlantic.com'),
('BA', 'British Airways', 'United Kingdom', 'https://logo.clearbit.com/britishairways.com'),
('AA', 'American Airlines', 'United States', 'https://logo.clearbit.com/americanairlines.com'),
('DL', 'Delta Air Lines', 'United States', 'https://logo.clearbit.com/delta.com'),
('UA', 'United Airlines', 'United States', 'https://logo.clearbit.com/united.com'),
('LH', 'Lufthansa', 'Germany', 'https://logo.clearbit.com/lufthansa.com'),
('AF', 'Air France', 'France', 'https://logo.clearbit.com/airfrance.com'),
('TK', 'Turkish Airlines', 'Turkey', 'https://logo.clearbit.com/turkishairlines.com'),
('SQ', 'Singapore Airlines', 'Singapore', 'https://logo.clearbit.com/singaporeair.com'),
('CX', 'Cathay Pacific', 'Hong Kong', 'https://logo.clearbit.com/cathaypacific.com'),
('AI', 'Air India', 'India', 'https://logo.clearbit.com/airindia.in'),
('AC', 'Air Canada', 'Canada', 'https://logo.clearbit.com/aircanada.com'),
('QF', 'Qantas', 'Australia', 'https://logo.clearbit.com/qantas.com'),
('IB', 'Iberia', 'Spain', 'https://logo.clearbit.com/iberia.com'),
('KL', 'KLM', 'Netherlands', 'https://logo.clearbit.com/klm.com'),
('WY', 'Oman Air', 'Oman', 'https://logo.clearbit.com/omanair.com'),
('FZ', 'FlyDubai', 'United Arab Emirates', 'https://logo.clearbit.com/flydubai.com'),
('ZZ', 'Duffel Airways', 'United Kingdom', 'https://logo.clearbit.com/duffel.com');

-- Insert Loyalty Programs
INSERT INTO loyalty_programs (name, code, airline_id) VALUES 
('Emirates Skywards', 'SKYWARDS', (SELECT id FROM airlines WHERE iata_code = 'EK')),
('Qatar Airways Privilege Club', 'PRIVILEGE', (SELECT id FROM airlines WHERE iata_code = 'QR')),
('Etihad Guest', 'GUEST', (SELECT id FROM airlines WHERE iata_code = 'EY')),
('Flying Club', 'FLYING_CLUB', (SELECT id FROM airlines WHERE iata_code = 'VS')),
('Executive Club', 'EXECUTIVE', (SELECT id FROM airlines WHERE iata_code = 'BA')),
('AAdvantage', 'AADVANTAGE', (SELECT id FROM airlines WHERE iata_code = 'AA')),
('Miles & More', 'MILES_MORE', (SELECT id FROM airlines WHERE iata_code = 'LH')),
('Flying Blue', 'FLYING_BLUE', (SELECT id FROM airlines WHERE iata_code = 'AF')),
('Miles&Smiles', 'MILES_SMILES', (SELECT id FROM airlines WHERE iata_code = 'TK')),
('KrisFlyer', 'KRISFLYER', (SELECT id FROM airlines WHERE iata_code = 'SQ')),
('Aeroplan', 'AEROPLAN', (SELECT id FROM airlines WHERE iata_code = 'AC'));
