/**
 * Nationalities Static Data
 * Common nationalities for passport/travel documents
 */

export interface Nationality {
  code: string;
  name: string;
  demonym: string;
}

export const NATIONALITIES: Nationality[] = [
  // Middle East
  { code: 'SA', name: 'Saudi Arabia', demonym: 'Saudi' },
  { code: 'AE', name: 'United Arab Emirates', demonym: 'Emirati' },
  { code: 'QA', name: 'Qatar', demonym: 'Qatari' },
  { code: 'KW', name: 'Kuwait', demonym: 'Kuwaiti' },
  { code: 'BH', name: 'Bahrain', demonym: 'Bahraini' },
  { code: 'OM', name: 'Oman', demonym: 'Omani' },
  { code: 'JO', name: 'Jordan', demonym: 'Jordanian' },
  { code: 'LB', name: 'Lebanon', demonym: 'Lebanese' },
  { code: 'EG', name: 'Egypt', demonym: 'Egyptian' },
  { code: 'IQ', name: 'Iraq', demonym: 'Iraqi' },
  { code: 'YE', name: 'Yemen', demonym: 'Yemeni' },
  { code: 'SY', name: 'Syria', demonym: 'Syrian' },
  { code: 'PS', name: 'Palestine', demonym: 'Palestinian' },
  { code: 'IR', name: 'Iran', demonym: 'Iranian' },
  { code: 'IL', name: 'Israel', demonym: 'Israeli' },
  
  // Asia
  { code: 'IN', name: 'India', demonym: 'Indian' },
  { code: 'PK', name: 'Pakistan', demonym: 'Pakistani' },
  { code: 'BD', name: 'Bangladesh', demonym: 'Bangladeshi' },
  { code: 'LK', name: 'Sri Lanka', demonym: 'Sri Lankan' },
  { code: 'NP', name: 'Nepal', demonym: 'Nepalese' },
  { code: 'CN', name: 'China', demonym: 'Chinese' },
  { code: 'JP', name: 'Japan', demonym: 'Japanese' },
  { code: 'KR', name: 'South Korea', demonym: 'South Korean' },
  { code: 'TH', name: 'Thailand', demonym: 'Thai' },
  { code: 'MY', name: 'Malaysia', demonym: 'Malaysian' },
  { code: 'SG', name: 'Singapore', demonym: 'Singaporean' },
  { code: 'ID', name: 'Indonesia', demonym: 'Indonesian' },
  { code: 'PH', name: 'Philippines', demonym: 'Filipino' },
  { code: 'VN', name: 'Vietnam', demonym: 'Vietnamese' },
  { code: 'HK', name: 'Hong Kong', demonym: 'Hong Konger' },
  { code: 'TW', name: 'Taiwan', demonym: 'Taiwanese' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', demonym: 'British' },
  { code: 'DE', name: 'Germany', demonym: 'German' },
  { code: 'FR', name: 'France', demonym: 'French' },
  { code: 'IT', name: 'Italy', demonym: 'Italian' },
  { code: 'ES', name: 'Spain', demonym: 'Spanish' },
  { code: 'NL', name: 'Netherlands', demonym: 'Dutch' },
  { code: 'BE', name: 'Belgium', demonym: 'Belgian' },
  { code: 'CH', name: 'Switzerland', demonym: 'Swiss' },
  { code: 'AT', name: 'Austria', demonym: 'Austrian' },
  { code: 'SE', name: 'Sweden', demonym: 'Swedish' },
  { code: 'NO', name: 'Norway', demonym: 'Norwegian' },
  { code: 'DK', name: 'Denmark', demonym: 'Danish' },
  { code: 'FI', name: 'Finland', demonym: 'Finnish' },
  { code: 'IE', name: 'Ireland', demonym: 'Irish' },
  { code: 'PT', name: 'Portugal', demonym: 'Portuguese' },
  { code: 'GR', name: 'Greece', demonym: 'Greek' },
  { code: 'PL', name: 'Poland', demonym: 'Polish' },
  { code: 'CZ', name: 'Czech Republic', demonym: 'Czech' },
  { code: 'RU', name: 'Russia', demonym: 'Russian' },
  { code: 'TR', name: 'Turkey', demonym: 'Turkish' },
  
  // North America
  { code: 'US', name: 'United States', demonym: 'American' },
  { code: 'CA', name: 'Canada', demonym: 'Canadian' },
  { code: 'MX', name: 'Mexico', demonym: 'Mexican' },
  
  // South America
  { code: 'BR', name: 'Brazil', demonym: 'Brazilian' },
  { code: 'AR', name: 'Argentina', demonym: 'Argentine' },
  { code: 'CL', name: 'Chile', demonym: 'Chilean' },
  { code: 'CO', name: 'Colombia', demonym: 'Colombian' },
  { code: 'PE', name: 'Peru', demonym: 'Peruvian' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', demonym: 'South African' },
  { code: 'NG', name: 'Nigeria', demonym: 'Nigerian' },
  { code: 'KE', name: 'Kenya', demonym: 'Kenyan' },
  { code: 'MA', name: 'Morocco', demonym: 'Moroccan' },
  { code: 'TN', name: 'Tunisia', demonym: 'Tunisian' },
  { code: 'DZ', name: 'Algeria', demonym: 'Algerian' },
  { code: 'ET', name: 'Ethiopia', demonym: 'Ethiopian' },
  { code: 'GH', name: 'Ghana', demonym: 'Ghanaian' },
  
  // Oceania
  { code: 'AU', name: 'Australia', demonym: 'Australian' },
  { code: 'NZ', name: 'New Zealand', demonym: 'New Zealander' },
];

/**
 * Search nationalities by name or code
 */
export function searchNationalities(query?: string): Nationality[] {
  if (!query || query.length < 1) {
    return NATIONALITIES;
  }
  
  const searchTerm = query.toLowerCase();
  return NATIONALITIES.filter(
    nat =>
      nat.code.toLowerCase().includes(searchTerm) ||
      nat.name.toLowerCase().includes(searchTerm) ||
      nat.demonym.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get nationality by code
 */
export function getNationalityByCode(code: string): Nationality | undefined {
  return NATIONALITIES.find(
    nat => nat.code.toLowerCase() === code.toLowerCase()
  );
}
