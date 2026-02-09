/**
 * Countries Static Data
 * Common countries for travel forms
 */

export interface Country {
  code: string;
  name: string;
  dialCode?: string;
  flag?: string;
}

export const COUNTRIES: Country[] = [
  // Middle East
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964' },
  { code: 'YE', name: 'Yemen', dialCode: '+967' },
  { code: 'SY', name: 'Syria', dialCode: '+963' },
  { code: 'PS', name: 'Palestine', dialCode: '+970' },
  { code: 'IR', name: 'Iran', dialCode: '+98' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  
  // Asia
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  
  // North America
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  
  // South America
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  
  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
];

/**
 * Search countries by name or code
 */
export function searchCountries(query?: string): Country[] {
  if (!query || query.length < 1) {
    return COUNTRIES;
  }
  
  const searchTerm = query.toLowerCase();
  return COUNTRIES.filter(
    country =>
      country.code.toLowerCase().includes(searchTerm) ||
      country.name.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(
    country => country.code.toLowerCase() === code.toLowerCase()
  );
}
