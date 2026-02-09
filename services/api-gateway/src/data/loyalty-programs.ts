/**
 * Airline Loyalty Programs Static Data
 * Common frequent flyer programs for major airlines
 */

export interface LoyaltyProgram {
  id: string;
  airlineCode: string;
  airlineName: string;
  programName: string;
  logo?: string;
}

export const LOYALTY_PROGRAMS: LoyaltyProgram[] = [
  // Middle East
  { id: 'skywards', airlineCode: 'EK', airlineName: 'Emirates', programName: 'Emirates Skywards' },
  { id: 'etihad-guest', airlineCode: 'EY', airlineName: 'Etihad Airways', programName: 'Etihad Guest' },
  { id: 'alfursan', airlineCode: 'SV', airlineName: 'Saudia', programName: 'Alfursan' },
  { id: 'privilege-club', airlineCode: 'QR', airlineName: 'Qatar Airways', programName: 'Privilege Club' },
  { id: 'sindbad', airlineCode: 'WY', airlineName: 'Oman Air', programName: 'Sindbad' },
  { id: 'falconflyer', airlineCode: 'GF', airlineName: 'Gulf Air', programName: 'Falcon Flyer' },
  { id: 'velocity', airlineCode: 'FZ', airlineName: 'flydubai', programName: 'OPEN' },
  { id: 'air-rewards', airlineCode: 'G9', airlineName: 'Air Arabia', programName: 'Air Rewards' },
  
  // Europe
  { id: 'miles-more', airlineCode: 'LH', airlineName: 'Lufthansa', programName: 'Miles & More' },
  { id: 'flying-blue', airlineCode: 'AF', airlineName: 'Air France', programName: 'Flying Blue' },
  { id: 'executive-club', airlineCode: 'BA', airlineName: 'British Airways', programName: 'Executive Club' },
  { id: 'eurobonus', airlineCode: 'SK', airlineName: 'SAS', programName: 'EuroBonus' },
  { id: 'miles-smiles', airlineCode: 'TK', airlineName: 'Turkish Airlines', programName: 'Miles&Smiles' },
  { id: 'millesmiglia', airlineCode: 'AZ', airlineName: 'ITA Airways', programName: 'Volare' },
  { id: 'iberia-plus', airlineCode: 'IB', airlineName: 'Iberia', programName: 'Iberia Plus' },
  { id: 'finnair-plus', airlineCode: 'AY', airlineName: 'Finnair', programName: 'Finnair Plus' },
  { id: 'swiss-miles', airlineCode: 'LX', airlineName: 'SWISS', programName: 'Miles & More' },
  { id: 'tap-miles-go', airlineCode: 'TP', airlineName: 'TAP Portugal', programName: 'Miles&Go' },
  
  // North America
  { id: 'aadvantage', airlineCode: 'AA', airlineName: 'American Airlines', programName: 'AAdvantage' },
  { id: 'mileageplus', airlineCode: 'UA', airlineName: 'United Airlines', programName: 'MileagePlus' },
  { id: 'skymiles', airlineCode: 'DL', airlineName: 'Delta Air Lines', programName: 'SkyMiles' },
  { id: 'rapid-rewards', airlineCode: 'WN', airlineName: 'Southwest Airlines', programName: 'Rapid Rewards' },
  { id: 'trueblue', airlineCode: 'B6', airlineName: 'JetBlue', programName: 'TrueBlue' },
  { id: 'aeroplan', airlineCode: 'AC', airlineName: 'Air Canada', programName: 'Aeroplan' },
  { id: 'alaska-mileage', airlineCode: 'AS', airlineName: 'Alaska Airlines', programName: 'Mileage Plan' },
  { id: 'hawaiian-miles', airlineCode: 'HA', airlineName: 'Hawaiian Airlines', programName: 'HawaiianMiles' },
  
  // Asia
  { id: 'krisflyer', airlineCode: 'SQ', airlineName: 'Singapore Airlines', programName: 'KrisFlyer' },
  { id: 'enrich', airlineCode: 'MH', airlineName: 'Malaysia Airlines', programName: 'Enrich' },
  { id: 'asia-miles', airlineCode: 'CX', airlineName: 'Cathay Pacific', programName: 'Asia Miles' },
  { id: 'garuda-miles', airlineCode: 'GA', airlineName: 'Garuda Indonesia', programName: 'GarudaMiles' },
  { id: 'royal-orchid', airlineCode: 'TG', airlineName: 'Thai Airways', programName: 'Royal Orchid Plus' },
  { id: 'jal-mileage', airlineCode: 'JL', airlineName: 'Japan Airlines', programName: 'JAL Mileage Bank' },
  { id: 'ana-mileage', airlineCode: 'NH', airlineName: 'ANA', programName: 'ANA Mileage Club' },
  { id: 'korean-skypass', airlineCode: 'KE', airlineName: 'Korean Air', programName: 'SKYPASS' },
  { id: 'phoenix-miles', airlineCode: 'CA', airlineName: 'Air China', programName: 'PhoenixMiles' },
  { id: 'eastern-miles', airlineCode: 'MU', airlineName: 'China Eastern', programName: 'Eastern Miles' },
  { id: 'china-southern', airlineCode: 'CZ', airlineName: 'China Southern', programName: 'Sky Pearl Club' },
  { id: 'air-india-ffp', airlineCode: 'AI', airlineName: 'Air India', programName: 'Flying Returns' },
  { id: 'eva-infinity', airlineCode: 'BR', airlineName: 'EVA Air', programName: 'Infinity MileageLands' },
  { id: 'vietnam-lotusmiles', airlineCode: 'VN', airlineName: 'Vietnam Airlines', programName: 'Lotusmiles' },
  
  // Oceania
  { id: 'qantas-ff', airlineCode: 'QF', airlineName: 'Qantas', programName: 'Qantas Frequent Flyer' },
  { id: 'velocity-ff', airlineCode: 'VA', airlineName: 'Virgin Australia', programName: 'Velocity Frequent Flyer' },
  { id: 'airpoints', airlineCode: 'NZ', airlineName: 'Air New Zealand', programName: 'Airpoints' },
  
  // Latin America
  { id: 'latam-pass', airlineCode: 'LA', airlineName: 'LATAM Airlines', programName: 'LATAM Pass' },
  { id: 'aeromexico-club', airlineCode: 'AM', airlineName: 'Aeromexico', programName: 'Club Premier' },
  { id: 'copa-connectmiles', airlineCode: 'CM', airlineName: 'Copa Airlines', programName: 'ConnectMiles' },
  { id: 'avianca-lifemiles', airlineCode: 'AV', airlineName: 'Avianca', programName: 'LifeMiles' },
  
  // Africa
  { id: 'voyager', airlineCode: 'SA', airlineName: 'South African Airways', programName: 'Voyager' },
  { id: 'sheba-miles', airlineCode: 'ET', airlineName: 'Ethiopian Airlines', programName: 'ShebaMiles' },
  { id: 'safarilink', airlineCode: 'KQ', airlineName: 'Kenya Airways', programName: 'Flying Blue' },
  { id: 'royal-air-maroc', airlineCode: 'AT', airlineName: 'Royal Air Maroc', programName: 'Safar Flyer' },
  { id: 'egyptair-plus', airlineCode: 'MS', airlineName: 'EgyptAir', programName: 'EgyptAir Plus' },
];

/**
 * Search loyalty programs by airline name or code
 */
export function searchLoyaltyPrograms(query: string): LoyaltyProgram[] {
  if (!query || query.length < 1) {
    return LOYALTY_PROGRAMS;
  }
  
  const searchTerm = query.toLowerCase();
  return LOYALTY_PROGRAMS.filter(
    program =>
      program.airlineCode.toLowerCase().includes(searchTerm) ||
      program.airlineName.toLowerCase().includes(searchTerm) ||
      program.programName.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get loyalty program by airline code
 */
export function getLoyaltyProgramByCode(code: string): LoyaltyProgram | undefined {
  return LOYALTY_PROGRAMS.find(
    program => program.airlineCode.toLowerCase() === code.toLowerCase()
  );
}
