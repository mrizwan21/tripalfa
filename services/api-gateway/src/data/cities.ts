// Static Cities Data
export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  isPopular?: boolean;
}

export const CITIES: City[] = [
  // Middle East - Popular
  { id: 'DXB', name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', isPopular: true },
  { id: 'AUH', name: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', isPopular: true },
  { id: 'SHJ', name: 'Sharjah', country: 'United Arab Emirates', countryCode: 'AE' },
  { id: 'RKT', name: 'Ras Al Khaimah', country: 'United Arab Emirates', countryCode: 'AE' },
  { id: 'RUH', name: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', isPopular: true },
  { id: 'JED', name: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', isPopular: true },
  { id: 'DMM', name: 'Dammam', country: 'Saudi Arabia', countryCode: 'SA' },
  { id: 'MED', name: 'Medina', country: 'Saudi Arabia', countryCode: 'SA' },
  { id: 'DOH', name: 'Doha', country: 'Qatar', countryCode: 'QA', isPopular: true },
  { id: 'KWI', name: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', isPopular: true },
  { id: 'BAH', name: 'Manama', country: 'Bahrain', countryCode: 'BH' },
  { id: 'MCT', name: 'Muscat', country: 'Oman', countryCode: 'OM' },
  { id: 'AMM', name: 'Amman', country: 'Jordan', countryCode: 'JO' },
  { id: 'BEY', name: 'Beirut', country: 'Lebanon', countryCode: 'LB' },
  { id: 'CAI', name: 'Cairo', country: 'Egypt', countryCode: 'EG', isPopular: true },
  { id: 'TLV', name: 'Tel Aviv', country: 'Israel', countryCode: 'IL' },
  
  // South Asia
  { id: 'DEL', name: 'New Delhi', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'BOM', name: 'Mumbai', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'BLR', name: 'Bangalore', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'HYD', name: 'Hyderabad', country: 'India', countryCode: 'IN' },
  { id: 'MAA', name: 'Chennai', country: 'India', countryCode: 'IN' },
  { id: 'CCU', name: 'Kolkata', country: 'India', countryCode: 'IN' },
  { id: 'COK', name: 'Kochi', country: 'India', countryCode: 'IN' },
  { id: 'AMD', name: 'Ahmedabad', country: 'India', countryCode: 'IN' },
  { id: 'KHI', name: 'Karachi', country: 'Pakistan', countryCode: 'PK', isPopular: true },
  { id: 'ISB', name: 'Islamabad', country: 'Pakistan', countryCode: 'PK' },
  { id: 'LHE', name: 'Lahore', country: 'Pakistan', countryCode: 'PK' },
  { id: 'DAC', name: 'Dhaka', country: 'Bangladesh', countryCode: 'BD' },
  { id: 'CMB', name: 'Colombo', country: 'Sri Lanka', countryCode: 'LK' },
  { id: 'MLE', name: 'Male', country: 'Maldives', countryCode: 'MV', isPopular: true },
  { id: 'KTM', name: 'Kathmandu', country: 'Nepal', countryCode: 'NP' },
  
  // Southeast Asia
  { id: 'SIN', name: 'Singapore', country: 'Singapore', countryCode: 'SG', isPopular: true },
  { id: 'BKK', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', isPopular: true },
  { id: 'HKT', name: 'Phuket', country: 'Thailand', countryCode: 'TH', isPopular: true },
  { id: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', isPopular: true },
  { id: 'CGK', name: 'Jakarta', country: 'Indonesia', countryCode: 'ID' },
  { id: 'DPS', name: 'Bali', country: 'Indonesia', countryCode: 'ID', isPopular: true },
  { id: 'MNL', name: 'Manila', country: 'Philippines', countryCode: 'PH' },
  { id: 'SGN', name: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN' },
  { id: 'HAN', name: 'Hanoi', country: 'Vietnam', countryCode: 'VN' },
  
  // East Asia
  { id: 'HKG', name: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', isPopular: true },
  { id: 'NRT', name: 'Tokyo', country: 'Japan', countryCode: 'JP', isPopular: true },
  { id: 'KIX', name: 'Osaka', country: 'Japan', countryCode: 'JP' },
  { id: 'ICN', name: 'Seoul', country: 'South Korea', countryCode: 'KR', isPopular: true },
  { id: 'PEK', name: 'Beijing', country: 'China', countryCode: 'CN' },
  { id: 'PVG', name: 'Shanghai', country: 'China', countryCode: 'CN' },
  { id: 'TPE', name: 'Taipei', country: 'Taiwan', countryCode: 'TW' },
  
  // Europe - Popular
  { id: 'LHR', name: 'London', country: 'United Kingdom', countryCode: 'GB', isPopular: true },
  { id: 'MAN', name: 'Manchester', country: 'United Kingdom', countryCode: 'GB' },
  { id: 'EDI', name: 'Edinburgh', country: 'United Kingdom', countryCode: 'GB' },
  { id: 'CDG', name: 'Paris', country: 'France', countryCode: 'FR', isPopular: true },
  { id: 'FRA', name: 'Frankfurt', country: 'Germany', countryCode: 'DE', isPopular: true },
  { id: 'MUC', name: 'Munich', country: 'Germany', countryCode: 'DE' },
  { id: 'BER', name: 'Berlin', country: 'Germany', countryCode: 'DE' },
  { id: 'AMS', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', isPopular: true },
  { id: 'ZRH', name: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
  { id: 'GVA', name: 'Geneva', country: 'Switzerland', countryCode: 'CH' },
  { id: 'VIE', name: 'Vienna', country: 'Austria', countryCode: 'AT' },
  { id: 'PRG', name: 'Prague', country: 'Czech Republic', countryCode: 'CZ' },
  { id: 'BCN', name: 'Barcelona', country: 'Spain', countryCode: 'ES', isPopular: true },
  { id: 'MAD', name: 'Madrid', country: 'Spain', countryCode: 'ES' },
  { id: 'FCO', name: 'Rome', country: 'Italy', countryCode: 'IT', isPopular: true },
  { id: 'MXP', name: 'Milan', country: 'Italy', countryCode: 'IT' },
  { id: 'ATH', name: 'Athens', country: 'Greece', countryCode: 'GR' },
  { id: 'IST', name: 'Istanbul', country: 'Turkey', countryCode: 'TR', isPopular: true },
  { id: 'SVO', name: 'Moscow', country: 'Russia', countryCode: 'RU' },
  { id: 'OSL', name: 'Oslo', country: 'Norway', countryCode: 'NO' },
  { id: 'CPH', name: 'Copenhagen', country: 'Denmark', countryCode: 'DK' },
  { id: 'ARN', name: 'Stockholm', country: 'Sweden', countryCode: 'SE' },
  { id: 'HEL', name: 'Helsinki', country: 'Finland', countryCode: 'FI' },
  { id: 'DUB', name: 'Dublin', country: 'Ireland', countryCode: 'IE' },
  { id: 'BRU', name: 'Brussels', country: 'Belgium', countryCode: 'BE' },
  { id: 'LIS', name: 'Lisbon', country: 'Portugal', countryCode: 'PT' },
  { id: 'WAW', name: 'Warsaw', country: 'Poland', countryCode: 'PL' },
  { id: 'BUD', name: 'Budapest', country: 'Hungary', countryCode: 'HU' },
  
  // Americas
  { id: 'JFK', name: 'New York', country: 'United States', countryCode: 'US', isPopular: true },
  { id: 'LAX', name: 'Los Angeles', country: 'United States', countryCode: 'US', isPopular: true },
  { id: 'SFO', name: 'San Francisco', country: 'United States', countryCode: 'US' },
  { id: 'MIA', name: 'Miami', country: 'United States', countryCode: 'US', isPopular: true },
  { id: 'ORD', name: 'Chicago', country: 'United States', countryCode: 'US' },
  { id: 'DFW', name: 'Dallas', country: 'United States', countryCode: 'US' },
  { id: 'IAH', name: 'Houston', country: 'United States', countryCode: 'US' },
  { id: 'ATL', name: 'Atlanta', country: 'United States', countryCode: 'US' },
  { id: 'BOS', name: 'Boston', country: 'United States', countryCode: 'US' },
  { id: 'SEA', name: 'Seattle', country: 'United States', countryCode: 'US' },
  { id: 'LAS', name: 'Las Vegas', country: 'United States', countryCode: 'US' },
  { id: 'YYZ', name: 'Toronto', country: 'Canada', countryCode: 'CA', isPopular: true },
  { id: 'YVR', name: 'Vancouver', country: 'Canada', countryCode: 'CA' },
  { id: 'YUL', name: 'Montreal', country: 'Canada', countryCode: 'CA' },
  { id: 'MEX', name: 'Mexico City', country: 'Mexico', countryCode: 'MX' },
  { id: 'CUN', name: 'Cancun', country: 'Mexico', countryCode: 'MX', isPopular: true },
  { id: 'GRU', name: 'Sao Paulo', country: 'Brazil', countryCode: 'BR' },
  { id: 'GIG', name: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR' },
  { id: 'EZE', name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
  { id: 'BOG', name: 'Bogota', country: 'Colombia', countryCode: 'CO' },
  { id: 'LIM', name: 'Lima', country: 'Peru', countryCode: 'PE' },
  { id: 'SCL', name: 'Santiago', country: 'Chile', countryCode: 'CL' },
  
  // Africa
  { id: 'JNB', name: 'Johannesburg', country: 'South Africa', countryCode: 'ZA' },
  { id: 'CPT', name: 'Cape Town', country: 'South Africa', countryCode: 'ZA' },
  { id: 'NBO', name: 'Nairobi', country: 'Kenya', countryCode: 'KE' },
  { id: 'ADD', name: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET' },
  { id: 'LOS', name: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
  { id: 'ACC', name: 'Accra', country: 'Ghana', countryCode: 'GH' },
  { id: 'CMN', name: 'Casablanca', country: 'Morocco', countryCode: 'MA' },
  { id: 'TUN', name: 'Tunis', country: 'Tunisia', countryCode: 'TN' },
  { id: 'ALG', name: 'Algiers', country: 'Algeria', countryCode: 'DZ' },
  
  // Oceania
  { id: 'SYD', name: 'Sydney', country: 'Australia', countryCode: 'AU', isPopular: true },
  { id: 'MEL', name: 'Melbourne', country: 'Australia', countryCode: 'AU' },
  { id: 'BNE', name: 'Brisbane', country: 'Australia', countryCode: 'AU' },
  { id: 'PER', name: 'Perth', country: 'Australia', countryCode: 'AU' },
  { id: 'AKL', name: 'Auckland', country: 'New Zealand', countryCode: 'NZ' },
];

// Search cities by name or country
export function searchCities(query?: string): City[] {
  if (!query || query.trim() === '') {
    // Return popular cities first, then alphabetically
    return [...CITIES].sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 50);
  }

  const searchTerm = query.toLowerCase().trim();
  const results = CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm) ||
    city.country.toLowerCase().includes(searchTerm) ||
    city.countryCode.toLowerCase() === searchTerm ||
    city.id.toLowerCase() === searchTerm
  );

  // Sort: popular first, then exact matches, then partial matches
  return results.sort((a, b) => {
    // Popular cities first
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    // Exact name match first
    if (a.name.toLowerCase() === searchTerm) return -1;
    if (b.name.toLowerCase() === searchTerm) return 1;
    // Starts with search term
    if (a.name.toLowerCase().startsWith(searchTerm) && !b.name.toLowerCase().startsWith(searchTerm)) return -1;
    if (!a.name.toLowerCase().startsWith(searchTerm) && b.name.toLowerCase().startsWith(searchTerm)) return 1;
    return a.name.localeCompare(b.name);
  }).slice(0, 50);
}

// Get city by ID
export function getCityById(id: string): City | undefined {
  return CITIES.find(city => city.id.toLowerCase() === id.toLowerCase());
}

// Get cities by country
export function getCitiesByCountry(countryCode: string): City[] {
  return CITIES.filter(city => city.countryCode.toLowerCase() === countryCode.toLowerCase());
}
