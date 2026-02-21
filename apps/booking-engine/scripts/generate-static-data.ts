/**
 * Build-Time Static Data Generator
 * ================================
 * Directly indexes PostgreSQL tables and generates TypeScript/JSON files
 * that get bundled into the frontend at build time.
 * 
 * This eliminates the API layer for static reference data, improving:
 * - Performance: No network latency for static lookups
 * - Reliability: No API failures for static data
 * - SEO: Data available at render time
 * 
 * Usage: npx tsx scripts/generate-static-data.ts
 * 
 * Environment Variables:
 * - STATIC_DATABASE_URL: PostgreSQL connection string
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Output directory
const OUTPUT_DIR = path.resolve(__dirname, '../src/generated/static-data');

// PostgreSQL connection
const DB_URL = process.env.STATIC_DATABASE_URL || 
              process.env.DIRECT_DATABASE_URL ||
              process.env.DATABASE_URL ||
              'postgresql://postgres:postgres@localhost:5433/staticdatabase';

const pool = new Pool({ connectionString: DB_URL });

async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// Ensure output directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Write TypeScript file with typed exports
function writeTsFile(filename: string, content: string) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, `// Auto-generated at build time - DO NOT EDIT\n\n${content}`);
  console.log(`✓ Generated: ${filename}`);
}

// Write JSON file
function writeJsonFile(filename: string, data: any) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Generated: ${filename}`);
}

// ============================================
// GENERATORS
// ============================================

async function generateAirports() {
  console.log('\n📊 Generating airports...');
  const airports = await query(`
    SELECT iata_code, name, city, country, country_code, latitude, longitude, is_active
    FROM "Airport"
    WHERE is_active = true
    ORDER BY iata_code
  `);

  // Index by IATA code for O(1) lookup
  const byIataCode: Record<string, any> = {};
  airports.forEach(a => { byIataCode[a.iata_code] = a; });

  writeTsFile('airports.ts', `
export interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
}

export const AIRPORTS: Airport[] = ${JSON.stringify(airports, null, 2)};

export const AIRPORTS_BY_IATA: Record<string, Airport> = ${JSON.stringify(byIataCode, null, 2)};

export function getAirport(code: string): Airport | undefined {
  return AIRPORTS_BY_IATA[code];
}

export function searchAirports(query: string, limit = 10): Airport[] {
  const q = query.toLowerCase();
  return AIRPORTS.filter(a => 
    a.iata_code.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q)
  ).slice(0, limit);
}
`);

  return airports.length;
}

async function generateAirlines() {
  console.log('\n📊 Generating airlines...');
  const airlines = await query(`
    SELECT iata_code, name, logo_url, logo_symbol_url, country, country_code, is_active
    FROM "Airline"
    WHERE is_active = true
    ORDER BY name
  `);

  const byIataCode: Record<string, any> = {};
  airlines.forEach(a => { byIataCode[a.iata_code] = a; });

  writeTsFile('airlines.ts', `
export interface Airline {
  iata_code: string;
  name: string;
  logo_url: string | null;
  logo_symbol_url: string | null;
  country: string | null;
  country_code: string | null;
}

export const AIRLINES: Airline[] = ${JSON.stringify(airlines, null, 2)};

export const AIRLINES_BY_IATA: Record<string, Airline> = ${JSON.stringify(byIataCode, null, 2)};

export function getAirline(code: string): Airline | undefined {
  return AIRLINES_BY_IATA[code];
}

export function getAirlineLogo(code: string): string | undefined {
  const airline = AIRLINES_BY_IATA[code];
  return airline?.logo_symbol_url || airline?.logo_url || undefined;
}
`);

  return airlines.length;
}

async function generateCities() {
  console.log('\n📊 Generating cities...');
  const cities = await query(`
    SELECT iata_code, name, country, country_code, latitude, longitude, timezone, is_active
    FROM "City"
    WHERE is_active = true
    ORDER BY name
  `);

  const byIataCode: Record<string, any> = {};
  cities.forEach(c => { byIataCode[c.iata_code] = c; });

  writeTsFile('cities.ts', `
export interface City {
  iata_code: string;
  name: string;
  country: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export const CITIES: City[] = ${JSON.stringify(cities, null, 2)};

export const CITIES_BY_IATA: Record<string, City> = ${JSON.stringify(byIataCode, null, 2)};

export function getCity(code: string): City | undefined {
  return CITIES_BY_IATA[code];
}
`);

  return cities.length;
}

async function generateCountries() {
  console.log('\n📊 Generating countries...');
  const countries = await query(`
    SELECT code, name, alpha3, "numericCode", "phonePrefix", currency, "isActive"
    FROM "Country"
    WHERE "isActive" = true
    ORDER BY name
  `);

  const byCode: Record<string, any> = {};
  countries.forEach(c => { byCode[c.code] = c; });

  writeTsFile('countries.ts', `
export interface Country {
  code: string;
  name: string;
  alpha3: string | null;
  numericCode: number | null;
  phonePrefix: string | null;
  currency: string | null;
}

export const COUNTRIES: Country[] = ${JSON.stringify(countries, null, 2)};

export const COUNTRIES_BY_CODE: Record<string, Country> = ${JSON.stringify(byCode, null, 2)};

export function getCountry(code: string): Country | undefined {
  return COUNTRIES_BY_CODE[code];
}

export function getCountryByPhonePrefix(prefix: string): Country | undefined {
  return COUNTRIES.find(c => c.phonePrefix === prefix);
}
`);

  return countries.length;
}

async function generateCurrencies() {
  console.log('\n📊 Generating currencies...');
  const currencies = await query(`
    SELECT code, name, symbol, "exchangeRate", "isActive"
    FROM "Currency"
    WHERE "isActive" = true
    ORDER BY code
  `);

  const byCode: Record<string, any> = {};
  currencies.forEach(c => { byCode[c.code] = c; });

  writeTsFile('currencies.ts', `
export interface Currency {
  code: string;
  name: string;
  symbol: string | null;
  exchangeRate: number | null;
}

export const CURRENCIES: Currency[] = ${JSON.stringify(currencies, null, 2)};

export const CURRENCIES_BY_CODE: Record<string, Currency> = ${JSON.stringify(byCode, null, 2)};

export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES_BY_CODE[code];
}

export function formatCurrency(amount: number, code: string): string {
  const currency = getCurrency(code);
  const symbol = currency?.symbol || code;
  return \`\${symbol}\${amount.toLocaleString()}\`;
}
`);

  return currencies.length;
}

async function generateHotelAmenities() {
  console.log('\n📊 Generating hotel amenities...');
  const amenities = await query(`
    SELECT id, code, name, category, icon, "isPopular", "sortOrder"
    FROM "HotelAmenity"
    WHERE "isActive" = true
    ORDER BY "sortOrder", name
  `);

  const byCode: Record<string, any> = {};
  const popular: any[] = [];
  const byCategory: Record<string, any[]> = {};
  
  amenities.forEach(a => {
    byCode[a.code] = a;
    if (a.isPopular) popular.push(a);
    const cat = a.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  });

  writeTsFile('hotel-amenities.ts', `
export interface HotelAmenity {
  id: string;
  code: string;
  name: string;
  category: string | null;
  icon: string | null;
  isPopular: boolean;
  sortOrder: number | null;
}

export const HOTEL_AMENITIES: HotelAmenity[] = ${JSON.stringify(amenities, null, 2)};

export const HOTEL_AMENITIES_BY_CODE: Record<string, HotelAmenity> = ${JSON.stringify(byCode, null, 2)};

export const POPULAR_AMENITIES: HotelAmenity[] = ${JSON.stringify(popular, null, 2)};

export const AMENITIES_BY_CATEGORY: Record<string, HotelAmenity[]> = ${JSON.stringify(byCategory, null, 2)};

export function getAmenity(code: string): HotelAmenity | undefined {
  return HOTEL_AMENITIES_BY_CODE[code];
}
`);

  return amenities.length;
}

async function generateBoardTypes() {
  console.log('\n📊 Generating board types...');
  const boardTypes = await query(`
    SELECT code, name, description,
           "includesBreakfast", "includesLunch", "includesDinner",
           "includesDrinks", "includesSnacks", "sortOrder"
    FROM "BoardType"
    WHERE "isActive" = true
    ORDER BY "sortOrder"
  `);

  const byCode: Record<string, any> = {};
  boardTypes.forEach(b => { byCode[b.code] = b; });

  writeTsFile('board-types.ts', `
export interface BoardType {
  code: string;
  name: string;
  description: string | null;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  includesDrinks: boolean;
  includesSnacks: boolean;
  sortOrder: number | null;
}

export const BOARD_TYPES: BoardType[] = ${JSON.stringify(boardTypes, null, 2)};

export const BOARD_TYPES_BY_CODE: Record<string, BoardType> = ${JSON.stringify(byCode, null, 2)};

export const BOARD_LABELS: Record<string, string> = {
  RO: 'Room Only',
  BB: 'Bed & Breakfast',
  HB: 'Half Board',
  FB: 'Full Board',
  AI: 'All Inclusive',
  UAI: 'Ultra All Inclusive',
  SC: 'Self Catering',
};

export function getBoardType(code: string): BoardType | undefined {
  return BOARD_TYPES_BY_CODE[code];
}

export function getBoardLabel(code: string): string {
  return BOARD_LABELS[code] || code;
}
`);

  return boardTypes.length;
}

async function generateSuppliers() {
  console.log('\n📊 Generating suppliers...');
  const suppliers = await query(`
    SELECT id, code, name, type, status, "apiBaseUrl", features
    FROM "suppliers"
    WHERE status = true
    ORDER BY name
  `);

  const byCode: Record<string, any> = {};
  const byType: Record<string, any[]> = {};
  
  suppliers.forEach(s => {
    byCode[s.code] = s;
    const t = s.type || 'unknown';
    if (!byType[t]) byType[t] = [];
    byType[t].push(s);
  });

  writeTsFile('suppliers.ts', `
export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: string;
  status: boolean;
  apiBaseUrl: string | null;
  features: Record<string, any> | null;
}

export const SUPPLIERS: Supplier[] = ${JSON.stringify(suppliers, null, 2)};

export const SUPPLIERS_BY_CODE: Record<string, Supplier> = ${JSON.stringify(byCode, null, 2)};

export const SUPPLIERS_BY_TYPE: Record<string, Supplier[]> = ${JSON.stringify(byType, null, 2)};

export const HOTEL_SUPPLIERS: Supplier[] = ${JSON.stringify(byType['hotel'] || [], null, 2)};

export const FLIGHT_SUPPLIERS: Supplier[] = ${JSON.stringify(byType['flight'] || [], null, 2)};

export function getSupplier(code: string): Supplier | undefined {
  return SUPPLIERS_BY_CODE[code];
}
`);

  return suppliers.length;
}

async function generateDestinations() {
  console.log('\n📊 Generating destinations...');
  const destinations = await query(`
    SELECT id, code, name, "destinationType", "countryCode", "countryName",
           "stateName", latitude, longitude, timezone,
           "popularityScore", "hotelCount", "imageUrl", "isPopular"
    FROM "Destination"
    WHERE "isActive" = true
    ORDER BY "hotelCount" DESC NULLS LAST, "popularityScore" DESC NULLS LAST
    LIMIT 5000
  `);

  const byCode: Record<string, any> = {};
  const popular: any[] = [];
  const cities: any[] = [];
  
  destinations.forEach(d => {
    byCode[d.code] = d;
    if (d.isPopular) popular.push(d);
    if (d.destinationType === 'city') cities.push(d);
  });

  writeTsFile('destinations.ts', `
export interface Destination {
  id: string;
  code: string;
  name: string;
  destinationType: string;
  countryCode: string | null;
  countryName: string | null;
  stateName: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  popularityScore: number | null;
  hotelCount: number | null;
  imageUrl: string | null;
  isPopular: boolean;
}

export const DESTINATIONS: Destination[] = ${JSON.stringify(destinations, null, 2)};

export const DESTINATIONS_BY_CODE: Record<string, Destination> = ${JSON.stringify(byCode, null, 2)};

export const POPULAR_DESTINATIONS: Destination[] = ${JSON.stringify(popular.slice(0, 20), null, 2)};

export const CITY_DESTINATIONS: Destination[] = ${JSON.stringify(cities.slice(0, 100), null, 2)};

export function getDestination(code: string): Destination | undefined {
  return DESTINATIONS_BY_CODE[code];
}

export function searchDestinations(query: string, limit = 10): Destination[] {
  const q = query.toLowerCase();
  return DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.countryName?.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q)
  ).slice(0, limit);
}
`);

  return destinations.length;
}

async function generateCanonicalHotels() {
  console.log('\n📊 Generating canonical hotels (popular)...');
  
  // Only generate popular hotels with good content (to keep bundle size reasonable)
  const hotels = await query(`
    SELECT id, "canonicalCode", name, city, "countryCode", 
           "starRating", "chainName", "hotelType",
           latitude, longitude, "imageUrl"
    FROM canonical_hotels
    WHERE "is_active" = true
    AND "starRating" >= 3.0
    ORDER BY "starRating" DESC, name
    LIMIT 5000
  `);

  const byId: Record<string, any> = {};
  const byCity: Record<string, any[]> = {};
  const byCountry: Record<string, any[]> = {};
  const byChain: Record<string, any[]> = {};
  
  hotels.forEach(h => {
    byId[h.id] = h;
    
    if (h.city) {
      const cityKey = h.city.toLowerCase();
      if (!byCity[cityKey]) byCity[cityKey] = [];
      byCity[cityKey].push(h);
    }
    
    if (h.countryCode) {
      if (!byCountry[h.countryCode]) byCountry[h.countryCode] = [];
      byCountry[h.countryCode].push(h);
    }
    
    if (h.chainName) {
      const chainKey = h.chainName.toLowerCase();
      if (!byChain[chainKey]) byChain[chainKey] = [];
      byChain[chainKey].push(h);
    }
  });

  writeTsFile('hotels.ts', `
export interface CanonicalHotel {
  id: string;
  canonicalCode: string | null;
  name: string;
  city: string | null;
  countryCode: string | null;
  starRating: number | null;
  chainName: string | null;
  hotelType: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
}

export const HOTELS: CanonicalHotel[] = ${JSON.stringify(hotels, null, 2)};

export const HOTELS_BY_ID: Record<string, CanonicalHotel> = ${JSON.stringify(byId, null, 2)};

export const HOTELS_BY_CITY: Record<string, CanonicalHotel[]> = ${JSON.stringify(byCity, null, 2)};

export const HOTELS_BY_COUNTRY: Record<string, CanonicalHotel[]> = ${JSON.stringify(byCountry, null, 2)};

export const HOTELS_BY_CHAIN: Record<string, CanonicalHotel[]> = ${JSON.stringify(byChain, null, 2)};

export function getHotel(id: string): CanonicalHotel | undefined {
  return HOTELS_BY_ID[id];
}

export function searchHotels(query: string, limit = 20): CanonicalHotel[] {
  const q = query.toLowerCase();
  return HOTELS.filter(h =>
    h.name.toLowerCase().includes(q) ||
    h.city?.toLowerCase().includes(q) ||
    h.chainName?.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function getHotelsByCity(city: string): CanonicalHotel[] {
  return HOTELS_BY_CITY[city.toLowerCase()] || [];
}

export function getHotelsByChain(chain: string): CanonicalHotel[] {
  return HOTELS_BY_CHAIN[chain.toLowerCase()] || [];
}
`);

  return hotels.length;
}

async function generateHotelChains() {
  console.log('\n📊 Generating hotel chains...');
  const chains = await query(`
    SELECT id, name, "logoUrl", "isActive"
    FROM "hotel_chains"
    WHERE "isActive" = true
    ORDER BY name
  `);

  const byId: Record<string, any> = {};
  const byName: Record<string, any> = {};
  
  chains.forEach(c => {
    byId[c.id] = c;
    byName[c.name.toLowerCase()] = c;
  });

  writeTsFile('hotel-chains.ts', `
export interface HotelChain {
  id: string;
  name: string;
  logoUrl: string | null;
}

export const HOTEL_CHAINS: HotelChain[] = ${JSON.stringify(chains, null, 2)};

export const HOTEL_CHAINS_BY_ID: Record<string, HotelChain> = ${JSON.stringify(byId, null, 2)};

export const HOTEL_CHAINS_BY_NAME: Record<string, HotelChain> = ${JSON.stringify(byName, null, 2)};

export function getHotelChain(id: string): HotelChain | undefined {
  return HOTEL_CHAINS_BY_ID[id];
}

export function getHotelChainByName(name: string): HotelChain | undefined {
  return HOTEL_CHAINS_BY_NAME[name.toLowerCase()];
}
`);

  return chains.length;
}

async function generateHotelTypes() {
  console.log('\n📊 Generating hotel types...');
  const types = await query(`
    SELECT id, name, code, icon, "sortOrder", "isActive"
    FROM "hotel_types"
    WHERE "isActive" = true
    ORDER BY "sortOrder", name
  `);

  const byId: Record<string, any> = {};
  const byCode: Record<string, any> = {};
  
  types.forEach(t => {
    byId[t.id] = t;
    if (t.code) byCode[t.code] = t;
  });

  writeTsFile('hotel-types.ts', `
export interface HotelType {
  id: number;
  name: string;
  code: string | null;
  icon: string | null;
  sortOrder: number | null;
}

export const HOTEL_TYPES: HotelType[] = ${JSON.stringify(types, null, 2)};

export const HOTEL_TYPES_BY_ID: Record<string, HotelType> = ${JSON.stringify(byId, null, 2)};

export const HOTEL_TYPES_BY_CODE: Record<string, HotelType> = ${JSON.stringify(byCode, null, 2)};

export function getHotelType(id: string): HotelType | undefined {
  return HOTEL_TYPES_BY_ID[id];
}
`);

  return types.length;
}

async function generateRoomAmenities() {
  console.log('\n📊 Generating room amenities...');
  const amenities = await query(`
    SELECT id, code, name, category, icon, "isPopular", "sortOrder"
    FROM "RoomAmenity"
    WHERE "isActive" = true
    ORDER BY "sortOrder", name
  `);

  const byCode: Record<string, any> = {};
  const popular: any[] = [];
  const byCategory: Record<string, any[]> = {};
  
  amenities.forEach(a => {
    byCode[a.code] = a;
    if (a.isPopular) popular.push(a);
    const cat = a.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  });

  writeTsFile('room-amenities.ts', `
export interface RoomAmenity {
  id: string;
  code: string;
  name: string;
  category: string | null;
  icon: string | null;
  isPopular: boolean;
  sortOrder: number | null;
}

export const ROOM_AMENITIES: RoomAmenity[] = ${JSON.stringify(amenities, null, 2)};

export const ROOM_AMENITIES_BY_CODE: Record<string, RoomAmenity> = ${JSON.stringify(byCode, null, 2)};

export const POPULAR_ROOM_AMENITIES: RoomAmenity[] = ${JSON.stringify(popular, null, 2)};

export const ROOM_AMENITIES_BY_CATEGORY: Record<string, RoomAmenity[]> = ${JSON.stringify(byCategory, null, 2)};

export function getRoomAmenity(code: string): RoomAmenity | undefined {
  return ROOM_AMENITIES_BY_CODE[code];
}
`);

  return amenities.length;
}

async function generateNationalities() {
  console.log('\n📊 Generating nationalities...');
  const nationalities = await query(`
    SELECT id, code, name, demonym, "countryCode", "isActive"
    FROM "Nationality"
    WHERE "isActive" = true
    ORDER BY name
  `);

  const byCode: Record<string, any> = {};
  const byCountry: Record<string, any> = {};
  
  nationalities.forEach(n => {
    byCode[n.code] = n;
    if (n.countryCode) byCountry[n.countryCode] = n;
  });

  writeTsFile('nationalities.ts', `
export interface Nationality {
  id: string;
  code: string;
  name: string;
  demonym: string | null;
  countryCode: string | null;
}

export const NATIONALITIES: Nationality[] = ${JSON.stringify(nationalities, null, 2)};

export const NATIONALITIES_BY_CODE: Record<string, Nationality> = ${JSON.stringify(byCode, null, 2)};

export const NATIONALITIES_BY_COUNTRY: Record<string, Nationality> = ${JSON.stringify(byCountry, null, 2)};

export function getNationality(code: string): Nationality | undefined {
  return NATIONALITIES_BY_CODE[code];
}

export function getNationalityByCountry(countryCode: string): Nationality | undefined {
  return NATIONALITIES_BY_COUNTRY[countryCode];
}
`);

  return nationalities.length;
}

async function generateLoyaltyPrograms() {
  console.log('\n📊 Generating loyalty programs...');
  const programs = await query(`
    SELECT id, code, name, program_type, provider_code, logo_url, "cashbackRate", enabled, status
    FROM "LoyaltyProgram"
    WHERE enabled = true
    ORDER BY name
  `);

  const byCode: Record<string, any> = {};
  const airline: any[] = [];
  const hotel: any[] = [];
  
  programs.forEach(p => {
    byCode[p.code] = p;
    if (p.program_type === 'airline') airline.push(p);
    if (p.program_type === 'hotel') hotel.push(p);
  });

  writeTsFile('loyalty-programs.ts', `
export interface LoyaltyProgram {
  id: string;
  code: string;
  name: string;
  program_type: string;
  provider_code: string | null;
  logo_url: string | null;
  cashbackRate: number | null;
  enabled: boolean;
  status: string;
}

export const LOYALTY_PROGRAMS: LoyaltyProgram[] = ${JSON.stringify(programs, null, 2)};

export const LOYALTY_PROGRAMS_BY_CODE: Record<string, LoyaltyProgram> = ${JSON.stringify(byCode, null, 2)};

export const AIRLINE_LOYALTY_PROGRAMS: LoyaltyProgram[] = ${JSON.stringify(airline, null, 2)};

export const HOTEL_LOYALTY_PROGRAMS: LoyaltyProgram[] = ${JSON.stringify(hotel, null, 2)};

export function getLoyaltyProgram(code: string): LoyaltyProgram | undefined {
  return LOYALTY_PROGRAMS_BY_CODE[code];
}
`);

  return programs.length;
}

// Generate master index file
function generateIndexFile(stats: Record<string, number>) {
  writeTsFile('index.ts', `
// Static Data Index - Auto-generated at build time
// Total records: ${Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()}

// Flight & Travel Data
export * from './airports';
export * from './airlines';
export * from './cities';
export * from './countries';
export * from './currencies';
export * from './nationalities';

// Hotel Data
export * from './hotels';
export * from './hotel-chains';
export * from './hotel-types';
export * from './hotel-amenities';
export * from './room-amenities';
export * from './board-types';
export * from './destinations';

// Supplier & Loyalty Data
export * from './suppliers';
export * from './loyalty-programs';

// Quick stats
export const STATIC_DATA_STATS = ${JSON.stringify(stats, null, 2)};

// Data categories for easy access
export const DATA_CATEGORIES = {
  flight: ['airports', 'airlines', 'cities', 'countries', 'currencies', 'nationalities'],
  hotel: ['hotels', 'hotelChains', 'hotelTypes', 'hotelAmenities', 'roomAmenities', 'boardTypes', 'destinations'],
  supplier: ['suppliers', 'loyaltyPrograms'],
};
`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  STATIC DATA GENERATOR - Direct PostgreSQL Indexing');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n📦 Output: ${OUTPUT_DIR}`);
  console.log(`🗄️  Database: ${DB_URL.replace(/:([^@]+)@/, ':***@')}\n`);

  ensureDir(OUTPUT_DIR);

  const stats: Record<string, number> = {};

  try {
    // Test connection
    await query('SELECT 1');
    console.log('✅ Database connected\n');

    // Generate all static data
    // Flight data
    stats.airports = await generateAirports();
    stats.airlines = await generateAirlines();
    stats.cities = await generateCities();
    stats.countries = await generateCountries();
    stats.currencies = await generateCurrencies();
    stats.nationalities = await generateNationalities();
    
    // Hotel data
    stats.hotels = await generateCanonicalHotels();
    stats.hotelChains = await generateHotelChains();
    stats.hotelTypes = await generateHotelTypes();
    stats.hotelAmenities = await generateHotelAmenities();
    stats.roomAmenities = await generateRoomAmenities();
    stats.boardTypes = await generateBoardTypes();
    stats.destinations = await generateDestinations();
    
    // Supplier & Loyalty data
    stats.suppliers = await generateSuppliers();
    stats.loyaltyPrograms = await generateLoyaltyPrograms();

    // Generate index
    generateIndexFile(stats);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  GENERATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📊 Records generated:');
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key.padEnd(20)} ${count.toLocaleString().padStart(10)}`);
    });
    console.log(`   ${'─'.repeat(32)}`);
    console.log(`   ${'TOTAL'.padEnd(20)} ${Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString().padStart(10)}`);
    console.log('\n✅ Static data ready for frontend bundle!\n');

  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();