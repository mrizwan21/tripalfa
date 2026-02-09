/**
 * Static Airport Data
 * This is the official static airport data used across the application.
 * This data is sourced from IATA airport database and is not a fallback.
 */

export interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
}

export const AIRPORTS: Airport[] = [
  // North America
  { iata_code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', country_code: 'US', latitude: 40.6413, longitude: -73.7781 },
  { iata_code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', country_code: 'US', latitude: 33.9416, longitude: -118.4085 },
  { iata_code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', country_code: 'US', latitude: 41.9742, longitude: -87.9073 },
  { iata_code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', country_code: 'US', latitude: 37.6213, longitude: -122.379 },
  { iata_code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', country_code: 'US', latitude: 25.7959, longitude: -80.2870 },
  { iata_code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', country_code: 'US', latitude: 33.6407, longitude: -84.4277 },
  { iata_code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', country_code: 'US', latitude: 32.8998, longitude: -97.0403 },
  { iata_code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', country_code: 'US', latitude: 39.8561, longitude: -104.6737 },
  { iata_code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', country_code: 'US', latitude: 47.4502, longitude: -122.3088 },
  { iata_code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'United States', country_code: 'US', latitude: 42.3656, longitude: -71.0096 },
  { iata_code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States', country_code: 'US', latitude: 40.6895, longitude: -74.1745 },
  { iata_code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', country_code: 'CA', latitude: 43.6777, longitude: -79.6248 },
  { iata_code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', country_code: 'CA', latitude: 49.1947, longitude: -123.1792 },
  { iata_code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', country_code: 'MX', latitude: 19.4363, longitude: -99.0721 },
  { iata_code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', country_code: 'MX', latitude: 21.0365, longitude: -86.8771 },
  
  // Europe
  { iata_code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.4700, longitude: -0.4543 },
  { iata_code: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.1537, longitude: -0.1821 },
  { iata_code: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.8860, longitude: 0.2389 },
  { iata_code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', country_code: 'GB', latitude: 53.3537, longitude: -2.2750 },
  { iata_code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', country_code: 'FR', latitude: 49.0097, longitude: 2.5479 },
  { iata_code: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', country_code: 'FR', latitude: 48.7262, longitude: 2.3652 },
  { iata_code: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', latitude: 52.3105, longitude: 4.7683 },
  { iata_code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', country_code: 'DE', latitude: 50.0379, longitude: 8.5622 },
  { iata_code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', country_code: 'DE', latitude: 48.3538, longitude: 11.7861 },
  { iata_code: 'FCO', name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'Italy', country_code: 'IT', latitude: 41.8003, longitude: 12.2389 },
  { iata_code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', country_code: 'IT', latitude: 45.6306, longitude: 8.7281 },
  { iata_code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', country_code: 'ES', latitude: 40.4983, longitude: -3.5676 },
  { iata_code: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', country_code: 'ES', latitude: 41.2974, longitude: 2.0833 },
  { iata_code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', country_code: 'TR', latitude: 41.2753, longitude: 28.7519 },
  { iata_code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', country_code: 'CH', latitude: 47.4647, longitude: 8.5492 },
  { iata_code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', country_code: 'AT', latitude: 48.1103, longitude: 16.5697 },
  { iata_code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', country_code: 'DK', latitude: 55.6181, longitude: 12.6561 },
  { iata_code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', country_code: 'SE', latitude: 59.6519, longitude: 17.9186 },
  { iata_code: 'OSL', name: 'Oslo Gardermoen Airport', city: 'Oslo', country: 'Norway', country_code: 'NO', latitude: 60.1976, longitude: 11.1004 },
  { iata_code: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', country_code: 'FI', latitude: 60.3172, longitude: 24.9633 },
  { iata_code: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', country_code: 'PT', latitude: 38.7813, longitude: -9.1359 },
  { iata_code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', country_code: 'IE', latitude: 53.4264, longitude: -6.2499 },
  { iata_code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', country_code: 'GR', latitude: 37.9364, longitude: 23.9445 },
  { iata_code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', country_code: 'BE', latitude: 50.9014, longitude: 4.4844 },
  { iata_code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', country_code: 'PL', latitude: 52.1657, longitude: 20.9671 },
  { iata_code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', country_code: 'CZ', latitude: 50.1008, longitude: 14.2600 },
  { iata_code: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', country_code: 'HU', latitude: 47.4369, longitude: 19.2556 },
  { iata_code: 'SVO', name: 'Sheremetyevo International Airport', city: 'Moscow', country: 'Russia', country_code: 'RU', latitude: 55.9726, longitude: 37.4146 },
  
  // Middle East
  { iata_code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', latitude: 25.2532, longitude: 55.3657 },
  { iata_code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', country_code: 'AE', latitude: 24.4330, longitude: 54.6511 },
  { iata_code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', country_code: 'QA', latitude: 25.2731, longitude: 51.6081 },
  { iata_code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', country_code: 'SA', latitude: 24.9576, longitude: 46.6988 },
  { iata_code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', country_code: 'SA', latitude: 21.6796, longitude: 39.1566 },
  { iata_code: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', country_code: 'OM', latitude: 23.5933, longitude: 58.2844 },
  { iata_code: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', country_code: 'BH', latitude: 26.2708, longitude: 50.6336 },
  { iata_code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', country_code: 'KW', latitude: 29.2266, longitude: 47.9689 },
  { iata_code: 'AMM', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan', country_code: 'JO', latitude: 31.7226, longitude: 35.9932 },
  { iata_code: 'BEY', name: 'Beirut–Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon', country_code: 'LB', latitude: 33.8209, longitude: 35.4884 },
  { iata_code: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', country_code: 'IL', latitude: 32.0055, longitude: 34.8854 },
  
  // Asia
  { iata_code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', country_code: 'IN', latitude: 28.5562, longitude: 77.1000 },
  { iata_code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', country_code: 'IN', latitude: 19.0896, longitude: 72.8656 },
  { iata_code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India', country_code: 'IN', latitude: 13.1986, longitude: 77.7066 },
  { iata_code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', country_code: 'IN', latitude: 12.9941, longitude: 80.1709 },
  { iata_code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', country_code: 'IN', latitude: 17.2403, longitude: 78.4294 },
  { iata_code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India', country_code: 'IN', latitude: 22.6547, longitude: 88.4467 },
  { iata_code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', country_code: 'IN', latitude: 10.1520, longitude: 76.4019 },
  { iata_code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', country_code: 'SG', latitude: 1.3644, longitude: 103.9915 },
  { iata_code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', country_code: 'HK', latitude: 22.3080, longitude: 113.9185 },
  { iata_code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.7720, longitude: 140.3929 },
  { iata_code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.5494, longitude: 139.7798 },
  { iata_code: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', country_code: 'JP', latitude: 34.4347, longitude: 135.2441 },
  { iata_code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', country_code: 'KR', latitude: 37.4602, longitude: 126.4407 },
  { iata_code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', country_code: 'CN', latitude: 40.0799, longitude: 116.6031 },
  { iata_code: 'PKX', name: 'Beijing Daxing International Airport', city: 'Beijing', country: 'China', country_code: 'CN', latitude: 39.5098, longitude: 116.4105 },
  { iata_code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', country_code: 'CN', latitude: 31.1443, longitude: 121.8083 },
  { iata_code: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', country_code: 'CN', latitude: 23.3924, longitude: 113.2988 },
  { iata_code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', country_code: 'TH', latitude: 13.6900, longitude: 100.7501 },
  { iata_code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', country_code: 'MY', latitude: 2.7456, longitude: 101.7072 },
  { iata_code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', country_code: 'ID', latitude: -6.1256, longitude: 106.6559 },
  { iata_code: 'DPS', name: 'Ngurah Rai International Airport', city: 'Bali', country: 'Indonesia', country_code: 'ID', latitude: -8.7482, longitude: 115.1672 },
  { iata_code: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', country_code: 'PH', latitude: 14.5086, longitude: 121.0194 },
  { iata_code: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', country_code: 'VN', latitude: 10.8188, longitude: 106.6520 },
  { iata_code: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', country_code: 'VN', latitude: 21.2212, longitude: 105.8072 },
  { iata_code: 'TPE', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', country_code: 'TW', latitude: 25.0797, longitude: 121.2342 },
  
  // Oceania
  { iata_code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', country_code: 'AU', latitude: -33.9399, longitude: 151.1753 },
  { iata_code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', country_code: 'AU', latitude: -37.6690, longitude: 144.8410 },
  { iata_code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', country_code: 'AU', latitude: -27.3942, longitude: 153.1218 },
  { iata_code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', country_code: 'AU', latitude: -31.9403, longitude: 115.9669 },
  { iata_code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', country_code: 'NZ', latitude: -37.0082, longitude: 174.7850 },
  
  // Africa
  { iata_code: 'JNB', name: "O.R. Tambo International Airport", city: 'Johannesburg', country: 'South Africa', country_code: 'ZA', latitude: -26.1367, longitude: 28.2411 },
  { iata_code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', country_code: 'ZA', latitude: -33.9715, longitude: 18.6021 },
  { iata_code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', country_code: 'EG', latitude: 30.1219, longitude: 31.4056 },
  { iata_code: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', country_code: 'MA', latitude: 33.3675, longitude: -7.5898 },
  { iata_code: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', country_code: 'KE', latitude: -1.3192, longitude: 36.9258 },
  { iata_code: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', country_code: 'ET', latitude: 8.9779, longitude: 38.7993 },
  { iata_code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', country_code: 'NG', latitude: 6.5774, longitude: 3.3212 },
  
  // South America
  { iata_code: 'GRU', name: 'São Paulo–Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', country_code: 'BR', latitude: -23.4356, longitude: -46.4731 },
  { iata_code: 'GIG', name: 'Rio de Janeiro–Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', country_code: 'BR', latitude: -22.8090, longitude: -43.2506 },
  { iata_code: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', country_code: 'AR', latitude: -34.8222, longitude: -58.5358 },
  { iata_code: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', country_code: 'CL', latitude: -33.3930, longitude: -70.7858 },
  { iata_code: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', country_code: 'CO', latitude: 4.7016, longitude: -74.1469 },
  { iata_code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', country_code: 'PE', latitude: -12.0219, longitude: -77.1143 },
];

/**
 * Search airports by query string
 * Searches in IATA code, name, city, and country
 */
export function searchAirports(query?: string): Airport[] {
  if (!query) {
    return AIRPORTS;
  }
  
  const searchTerm = query.toUpperCase().trim();
  
  return AIRPORTS.filter(airport => 
    airport.iata_code.includes(searchTerm) ||
    airport.name.toUpperCase().includes(searchTerm) ||
    airport.city.toUpperCase().includes(searchTerm) ||
    airport.country.toUpperCase().includes(searchTerm)
  );
}
