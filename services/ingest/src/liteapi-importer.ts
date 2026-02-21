/**
 * LITEAPI Static Data Importer
 * 
 * This service handles importing all static data from LITEAPI into the canonical database.
 * It supports importing from all 12 LITEAPI data endpoints:
 * 
 * 1. /v3.0/data/hotels - Full hotel inventory
 * 2. /v3.0/data/hotel - Individual hotel details
 * 3. /v3.0/data/reviews - Hotel reviews
 * 4. /v3.0/data/hotels/room-search - Room type search
 * 5. /v3.0/data/cities - City master data
 * 6. /v3.0/data/countries - Country master data
 * 7. /v3.0/data/currencies - Currency master data
 * 8. /v3.0/data/iataCodes - IATA airport/city codes
 * 9. /v3.0/data/facilities - Hotel facility/amenity codes
 * 10. /v3.0/data/hotelTypes - Hotel property types
 * 11. /v3.0/data/chains - Hotel chain master data
 * 12. /v3.0/data/languages - Supported languages
 * 
 * API Documentation: https://docs.liteapi.travel/
 * Base URL: https://api.liteapi.travel
 * 
 * Usage:
 *   npm run import-static -- liteapi-all
 *   npm run import-static -- liteapi-hotels --limit=100
 *   npm run import-static -- liteapi-reference --types=countries,cities,currencies
 */

import { Supplier, SupplierSyncLog, CanonicalHotel, Prisma } from '@prisma/client';
import { prisma } from '@tripalfa/shared-database';
import { getRoomCategories, getBoardTypes, getPolicyTerms, mapHotelAmenity } from './reference-data-service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosInstance } from 'axios';
import sharp from 'sharp';

// Image storage configuration
const IMAGE_STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || './storage/hotel-images';

// ============================================
// TYPES
// ============================================

interface LiteApiConfig {
  apiKey: string;
  baseUrl: string;
}

// LITEAPI Response Types (based on actual API responses)
interface LiteApiHotel {
  id: string;
  primaryHotelId?: string | null;
  name: string;
  hotelDescription?: string;
  hotelTypeId?: number;
  chain?: string;
  currency?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  zip?: string;
  main_photo?: string;
  thumbnail?: string;
  stars?: number;
  rating?: number;
  reviewCount?: number;
  facilityIds?: number[];
  deletedAt?: string | null;
}

interface LiteApiHotelDetails extends LiteApiHotel {
  // Additional fields from hotel details endpoint
  phone?: string;
  email?: string;
  website?: string;
  checkInTime?: string;
  checkOutTime?: string;
  photos?: Array<{
    url: string;
    type?: string;
    caption?: string;
    width?: number;
    height?: number;
    isPrimary?: boolean;
  }>;
  roomTypes?: Array<{
    roomCode: string;
    roomName: string;
    description?: string;
    bedType?: string;
    bedCount?: number;
    maxOccupancy?: number;
    maxAdults?: number;
    maxChildren?: number;
    roomSize?: number;
    facilities?: string[];
    images?: Array<{
      url: string;
      type?: string;
    }>;
  }>;
}

interface LiteApiReview {
  reviewId: string;
  hotelId: string;
  rating: number;
  title?: string;
  comment?: string;
  reviewerName?: string;
  reviewerCountry?: string;
  reviewDate?: string;
  stayDate?: string;
  response?: string;
  language?: string;
  ratings?: {
    location?: number;
    service?: number;
    cleanliness?: number;
    value?: number;
    rooms?: number;
  };
}

interface LiteApiCity {
  id?: string;
  cityId?: string;
  cityName: string;
  countryCode: string;
  countryName?: string;
  stateCode?: string;
  stateName?: string;
  destinationCode?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  iataCode?: string;
}

interface LiteApiCountry {
  code: string;
  name: string;
}

interface LiteApiCurrency {
  code: string;
  currency: string;
  countries?: string[];
}

// Currency decimal precision mapping based on Airwallex standards
// Source: https://www.airwallex.com/docs/payouts/how-airwallex-payouts-work/currency-precision
const CURRENCY_DECIMAL_PRECISION: Record<string, number> = {
  // 0 decimal places
  CLP: 0, // Chilean peso
  ISK: 0, // Icelandic króna
  KRW: 0, // South Korean won
  PYG: 0, // Paraguayan guaraní
  RWF: 0, // Rwandan franc
  VND: 0, // Vietnamese đồng
  XAF: 0, // Central African CFA franc
  XOF: 0, // West African CFA franc
  
  // 3 decimal places
  BHD: 3, // Bahraini dinar
  JOD: 3, // Jordanian dinar
  KWD: 3, // Kuwaiti dinar
  OMR: 3, // Omani rial
  TND: 3, // Tunisian dinar
  
  // Default: 2 decimal places for all other currencies
};

function getCurrencyDecimalPrecision(currencyCode: string): number {
  return CURRENCY_DECIMAL_PRECISION[currencyCode.toUpperCase()] ?? 2;
}


interface LiteApiIataCode {
  code: string;
  name: string;
  latitude?: number;
  longitude?: number;
  countryCode: string;
}

interface LiteApiFacility {
  facility_id: number;
  facility: string;
  sort?: number;
  translation?: Array<{
    lang: string;
    facility: string;
  }>;
}

interface LiteApiHotelType {
  id: number;
  name: string;
}

interface LiteApiChain {
  id: number;
  name: string;
}

interface LiteApiLanguage {
  code: string;
  name: string;
}

interface LiteApiResponse<T> {
  status: boolean;
  data?: T;
  message?: string;
  totalCount?: number;
  page?: number;
  perPage?: number;
  totalPages?: number;
}

interface ImportOptions {
  limit?: number;
  incremental?: boolean;
  from?: string;
  to?: string;
  dryRun?: boolean;
  batchSize?: number;
  types?: string[]; // For reference data: countries, cities, currencies, etc.
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ code: string; error: string }>;
}

// ============================================
// LITEAPI IMPORTER CLASS
// ============================================

export class LiteApiImporter {
  private supplier: Supplier | null = null;
  private credentials: LiteApiConfig[] = [];
  private currentCredentialIndex = 0;
  private apiClient: AxiosInstance | null = null;
  private syncLog: SupplierSyncLog | null = null;
  
  // Rate limiting
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitDelay = 1000; // ms between requests (60/min = 1000ms)

  // API Endpoints
  private readonly endpoints = {
    hotels: '/v3.0/data/hotels',
    hotel: '/v3.0/data/hotel',
    reviews: '/v3.0/data/reviews',
    roomSearch: '/v3.0/data/hotels/room-search',
    cities: '/v3.0/data/cities',
    countries: '/v3.0/data/countries',
    currencies: '/v3.0/data/currencies',
    iataCodes: '/v3.0/data/iataCodes',
    facilities: '/v3.0/data/facilities',
    hotelTypes: '/v3.0/data/hotelTypes',
    chains: '/v3.0/data/chains',
    languages: '/v3.0/data/languages',
  };

  constructor() {
    this.loadCredentials();
    // Initialize API client if credentials are available
    if (this.credentials.length > 0) {
      this.initApiClient();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private loadCredentials(): void {
    const credentials: LiteApiConfig[] = [];
    
    // Primary credentials from environment
    if (process.env.LITEAPI_API_KEY) {
      credentials.push({
        apiKey: process.env.LITEAPI_API_KEY,
        baseUrl: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel',
      });
    }
    
    // Secondary credentials (for rate limit rotation)
    if (process.env.LITEAPI_API_KEY_2) {
      credentials.push({
        apiKey: process.env.LITEAPI_API_KEY_2,
        baseUrl: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel',
      });
    }
    
    this.credentials = credentials;
    console.log(`Loaded ${credentials.length} LITEAPI credential(s)`);
  }

  private async initialize(dataType: string = 'all'): Promise<void> {
    // Get or create supplier record
    this.supplier = await prisma.supplier.upsert({
      where: { code: 'liteapi' },
      update: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'running',
      },
      create: {
        code: 'liteapi',
        name: 'LITEAPI',
        type: 'hotel',
        status: true,
        apiBaseUrl: this.credentials[0]?.baseUrl || 'https://api.liteapi.travel',
        apiKey: this.credentials[0]?.apiKey,
        syncEnabled: true,
        syncInterval: 3600, // 1 hour
        rateLimitPerMin: 60,
        rateLimitPerDay: 5000,
        features: {
          hotels: true,
          availability: true,
          realtime: true,
          loyalty: true,
          guestManagement: true,
          staticData: true,
        },
        metadata: {
          description: 'Hotel distribution API with loyalty features',
          website: 'https://liteapi.travel',
          endpoints: Object.keys(this.endpoints),
        },
      },
    });
    
    // Create sync log
    this.syncLog = await prisma.supplierSyncLog.create({
      data: {
        supplierId: this.supplier.id,
        syncType: 'full',
        dataType,
        status: 'running',
        startedAt: new Date(),
      },
    });
    
    // Initialize API client
    this.initApiClient();
  }

  private initApiClient(): void {
    const cred = this.credentials[this.currentCredentialIndex];
    if (!cred) {
      throw new Error('No valid LITEAPI credentials available');
    }
    
    this.apiClient = axios.create({
      baseURL: cred.baseUrl,
      headers: {
        'X-API-Key': cred.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 60000, // 60 seconds for large data
    });
  }

  private rotateCredentials(): void {
    if (this.credentials.length > 1) {
      this.currentCredentialIndex = (this.currentCredentialIndex + 1) % this.credentials.length;
      console.log(`Rotating to credential set ${this.currentCredentialIndex + 1}`);
      this.initApiClient();
    }
  }

  // ============================================
  // API CALLS
  // ============================================

  private async fetchWithRateLimit<T>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<LiteApiResponse<T> | null> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }
    
    try {
      const response = await this.apiClient.get<LiteApiResponse<T>>(endpoint, { params });
      
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 429) {
        console.log('Rate limit hit, waiting and rotating credentials...');
        await this.delay(60000); // Wait 1 minute
        this.rotateCredentials();
        // Retry with new credentials
        return this.fetchWithRateLimit(endpoint, params);
      }
      
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  private async fetchAllPages<T>(
    endpoint: string,
    pageSize: number = 500
  ): Promise<T[]> {
    const allItems: T[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching ${endpoint} page ${page}...`);
      
      const response = await this.fetchWithRateLimit<{ items: T[] }>(endpoint, {
        page,
        perPage: pageSize,
      });
      
      if (!response?.data?.items?.length) {
        hasMore = false;
        break;
      }
      
      allItems.push(...response.data.items);
      
      console.log(`Fetched ${response.data.items.length} items (total: ${allItems.length})`);
      
      // Check if there are more pages
      if (response.totalPages) {
        hasMore = page < response.totalPages;
      } else {
        hasMore = response.data.items.length === pageSize;
      }
      
      page++;
      
      // Small delay between pages
      await this.delay(500);
    }
    
    return allItems;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // IMAGE DOWNLOAD AND STORAGE
  // ============================================

  private async downloadAndSaveImage(
    imageUrl: string,
    hotelId: string,
    imageType: string
  ): Promise<{ localPath: string; fileSize: number; width?: number; height?: number } | null> {
    try {
      // Create directory structure: storage/hotel-images/{hotelId}/
      const hotelDir = path.join(IMAGE_STORAGE_PATH, hotelId);
      if (!fs.existsSync(hotelDir)) {
        fs.mkdirSync(hotelDir, { recursive: true });
      }

      // Generate filename from URL hash
      const urlHash = crypto.createHash('md5').update(imageUrl).digest('hex');
      const ext = this.getExtensionFromUrl(imageUrl) || '.jpg';
      const filename = `${imageType}_${urlHash}${ext}`;
      const localPath = path.join(hotelDir, filename);

      // Skip if already downloaded - but still get dimensions
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        try {
          const metadata = await sharp(localPath).metadata();
          return { 
            localPath, 
            fileSize: stats.size,
            width: metadata.width,
            height: metadata.height 
          };
        } catch {
          return { localPath, fileSize: stats.size };
        }
      }

      // Download image
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Save to disk
      fs.writeFileSync(localPath, response.data);
      const fileSize = response.data.length;

      // Get image dimensions using sharp
      let width: number | undefined;
      let height: number | undefined;
      try {
        const metadata = await sharp(response.data).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch (sharpError) {
        console.warn(`Could not extract dimensions for ${filename}:`, sharpError);
      }

      console.log(`Downloaded image: ${filename} (${fileSize} bytes, ${width}x${height})`);

      return { localPath, fileSize, width, height };
    } catch (error) {
      console.error(`Failed to download image ${imageUrl}:`, error);
      return null;
    }
  }

  private getExtensionFromUrl(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }

  // ============================================
  // REFERENCE DATA IMPORTERS
  // ============================================

  async importCountries(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Countries ---');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiCountry[]>(this.endpoints.countries);
      
      if (!response?.data) {
        console.log('No country data received');
        return result;
      }
      
      const countries = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      for (const country of countries) {
        try {
          if (!options.dryRun) {
            await prisma.destination.upsert({
              where: { code: country.code },
              update: {
                name: country.name,
                nameNormalized: country.name?.toLowerCase(),
                destinationType: 'country',
                level: 0,
                countryCode: country.code,
                countryName: country.name,
                iataCountryCode: country.code,
              },
              create: {
                code: country.code,
                name: country.name,
                nameNormalized: country.name?.toLowerCase(),
                destinationType: 'country',
                level: 0,
                countryCode: country.code,
                countryName: country.name,
                iataCountryCode: country.code,
              },
            });
          }
          result.created++;
          result.total++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ code: country.code, error: errorMessage });
        }
      }
      
      console.log(`Countries: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing countries:', error);
      throw error;
    }
    
    return result;
  }

  async importCities(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Cities ---');
    console.log('Note: LITEAPI cities endpoint requires countryCode. Importing by country...');
    
    try {
      // Get ALL countries from the destinations table (no limit)
      const countries = await prisma.destination.findMany({
        where: { destinationType: 'country' },
        select: { countryCode: true },
      });
      
      const countryCodes = countries.map(c => c.countryCode).filter(Boolean) as string[];
      console.log(`Importing cities for ${countryCodes.length} countries (FULL DATA)...`);
      
      for (const countryCode of countryCodes) {
        try {
          const response = await this.fetchWithRateLimit<LiteApiCity[]>(this.endpoints.cities, {
            countryCode,
          });
          
          if (!response?.data) {
            console.log(`No city data received for country ${countryCode}`);
            continue;
          }
          
          const cities = response.data;
          
          for (const city of cities) {
            try {
              // Skip cities without valid name
              if (!city.cityName) {
                console.log(`Skipping city without name:`, city);
                continue;
              }
              
              // Use any available ID field, or fall back to cityName
              const cityCode = city.id || city.cityId || city.destinationCode || 
                               city.cityName.toLowerCase().replace(/[^a-z0-9]/g, '-');
              
              if (!options.dryRun) {
                await prisma.destination.upsert({
                  where: { code: cityCode },
                  update: {
                    name: city.cityName,
                    nameNormalized: city.cityName?.toLowerCase(),
                    destinationType: 'city',
                    level: 1,
                    countryCode: city.countryCode,
                    countryName: city.countryName,
                    stateCode: city.stateCode,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    iataCityCode: city.iataCode,
                  },
                  create: {
                    code: cityCode,
                    name: city.cityName,
                    nameNormalized: city.cityName?.toLowerCase(),
                    destinationType: 'city',
                    level: 1,
                    countryCode: city.countryCode,
                    countryName: city.countryName,
                    stateCode: city.stateCode,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    iataCityCode: city.iataCode,
                  },
                });
              }
              result.created++;
              result.total++;
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              result.failed++;
              result.errors.push({ code: city.cityId || city.destinationCode || 'unknown', error: errorMessage });
            }
          }
          
          console.log(`Cities for ${countryCode}: ${cities.length} processed`);
        } catch (error) {
          console.error(`Error importing cities for country ${countryCode}:`, error);
          // Continue with next country
        }
      }
      
      console.log(`Cities: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing cities:', error);
      throw error;
    }
    
    return result;
  }

  async importCurrencies(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Currencies ---');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiCurrency[]>(this.endpoints.currencies);
      
      if (!response?.data) {
        console.log('No currency data received');
        return result;
      }
      
      const currencies = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      for (const currency of currencies) {
        try {
          if (!options.dryRun) {
            const decimalPrecision = getCurrencyDecimalPrecision(currency.code);
            await prisma.currency.upsert({
              where: { code: currency.code },
              update: {
                name: currency.currency,
                symbol: currency.code,
                decimalPrecision,
              },
              create: {
                code: currency.code,
                name: currency.currency,
                symbol: currency.code,
                decimalPrecision,
              },
            });
          }
          result.created++;
          result.total++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ code: currency.code, error: errorMessage });
        }
      }

      
      console.log(`Currencies: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing currencies:', error);
      throw error;
    }
    
    return result;
  }

  async importIataCodes(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing IATA Codes ---');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiIataCode[]>(this.endpoints.iataCodes);
      
      if (!response?.data) {
        console.log('No IATA code data received');
        return result;
      }
      
      const iataCodes = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      for (const iata of iataCodes) {
        try {
          if (!options.dryRun) {
            // Store IATA codes as destinations (airports)
            await prisma.destination.upsert({
              where: { code: iata.code },
              update: {
                name: iata.name,
                countryCode: iata.countryCode,
                latitude: iata.latitude,
                longitude: iata.longitude,
                destinationType: 'airport',
              },
              create: {
                code: iata.code,
                name: iata.name,
                countryCode: iata.countryCode,
                latitude: iata.latitude,
                longitude: iata.longitude,
                destinationType: 'airport',
                level: 3,
              },
            });
          }
          result.created++;
          result.total++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ code: iata.code, error: errorMessage });
        }
      }
      
      console.log(`IATA Codes: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing IATA codes:', error);
      throw error;
    }
    
    return result;
  }

  async importFacilities(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Facilities (Amenities) ---');
    
    if (!this.supplier) {
      await this.initialize('facilities');
    }
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiFacility[]>(this.endpoints.facilities);
      
      if (!response?.data) {
        console.log('No facility data received');
        return result;
      }
      
      const facilities = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      for (const facility of facilities) {
        try {
          if (!options.dryRun) {
            // Create or update canonical amenity
            const amenity = await prisma.hotelAmenity.upsert({
              where: { code: String(facility.facility_id) },
              update: {
                name: facility.facility,
                category: 'General',
                isPopular: false,
                nameLocalized: facility.translation?.reduce((acc, t) => {
                  acc[t.lang] = t.facility;
                  return acc;
                }, {} as Record<string, string>) || { en: facility.facility },
              },
              create: {
                code: String(facility.facility_id),
                name: facility.facility,
                category: 'General',
                isPopular: false,
                nameLocalized: facility.translation?.reduce((acc, t) => {
                  acc[t.lang] = t.facility;
                  return acc;
                }, {} as Record<string, string>) || { en: facility.facility },
              },
            });
            
            // Create supplier mapping
            if (this.supplier) {
              await prisma.hotelAmenitySupplierMapping.upsert({
                where: {
                  supplierId_supplierCode: {
                    supplierId: this.supplier.id,
                    supplierCode: String(facility.facility_id),
                  },
                },
                update: {
                  supplierName: facility.facility,
                  matchConfidence: 1.0,
                  isVerified: true,
                },
                create: {
                  supplierId: this.supplier.id,
                  supplierCode: String(facility.facility_id),
                  supplierName: facility.facility,
                  amenityId: amenity.id,
                  matchConfidence: 1.0,
                  isVerified: true,
                },
              });
            }
          }
          result.created++;
          result.total++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ code: String(facility.facility_id), error: errorMessage });
        }
      }
      
      console.log(`Facilities: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing facilities:', error);
      throw error;
    }
    
    return result;
  }

  async importHotelTypes(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Hotel Types ---');
    console.log('Note: Hotel types are stored in supplier metadata (no dedicated table)');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiHotelType[]>(this.endpoints.hotelTypes);
      
      if (!response?.data) {
        console.log('No hotel type data received');
        return result;
      }
      
      const hotelTypes = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      // Store hotel types in supplier metadata for reference
      if (!options.dryRun && this.supplier) {
        await prisma.supplier.update({
          where: { id: this.supplier.id },
          data: {
            metadata: {
              hotelTypes: hotelTypes.reduce((acc, ht) => {
                acc[String(ht.id)] = ht.name;
                return acc;
              }, {} as Record<string, string>),
            },
          },
        });
      }
      
      result.created = hotelTypes.length;
      result.total = hotelTypes.length;
      
      console.log(`Hotel Types: ${result.created} stored in supplier metadata`);
    } catch (error) {
      console.error('Error importing hotel types:', error);
      throw error;
    }
    
    return result;
  }

  async importChains(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Hotel Chains ---');
    console.log('Note: Hotel chains are stored in supplier metadata (no dedicated table)');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiChain[]>(this.endpoints.chains);
      
      if (!response?.data) {
        console.log('No chain data received');
        return result;
      }
      
      const chains = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      // Store chains in supplier metadata for reference
      if (!options.dryRun && this.supplier) {
        await prisma.supplier.update({
          where: { id: this.supplier.id },
          data: {
            metadata: {
              hotelChains: chains.reduce((acc, chain) => {
                acc[String(chain.id)] = chain.name;
                return acc;
              }, {} as Record<string, string>),
            },
          },
        });
      }
      
      result.created = chains.length;
      result.total = chains.length;
      
      console.log(`Hotel Chains: ${result.created} stored in supplier metadata`);
    } catch (error) {
      console.error('Error importing chains:', error);
      throw error;
    }
    
    return result;
  }

  async importLanguages(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Languages ---');
    
    try {
      const response = await this.fetchWithRateLimit<LiteApiLanguage[]>(this.endpoints.languages);
      
      if (!response?.data) {
        console.log('No language data received');
        return result;
      }
      
      const languages = options.limit ? response.data.slice(0, options.limit) : response.data;
      
      for (const language of languages) {
        try {
          if (!options.dryRun) {
            await prisma.language.upsert({
              where: { code: language.code },
              update: {
                name: language.name,
              },
              create: {
                code: language.code,
                name: language.name,
              },
            });
          }
          result.created++;
          result.total++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ code: language.code, error: errorMessage });
        }
      }
      
      console.log(`Languages: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      console.error('Error importing languages:', error);
      throw error;
    }
    
    return result;
  }

  // ============================================
  // HOTEL DATA IMPORTER
  // ============================================

  async importHotels(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Hotels ---');
    
    try {
      await this.initialize('hotels');
      
      // No limit by default - import ALL hotels
      const batchSize = options.batchSize || 500;
      
      console.log(`Starting LITEAPI hotel import (FULL DATA - no limit)`);
      console.log('Note: LITEAPI requires country code filter. Importing by country...');
      console.log(`Batch size: ${batchSize}`);
      
      // Get list of countries to import hotels from
      const countries = await this.getCountriesForImport();
      console.log(`Found ${countries.length} countries to import hotels from`);
      
      for (const countryCode of countries) {
        // Only apply limit if explicitly set
        if (options.limit && result.total >= options.limit) break;
        
        console.log(`\nImporting hotels for country: ${countryCode}`);
        
        try {
          // Fetch hotels for this country
          let page = 1;
          let hasMore = true;
          let countryHotelsCount = 0;
          
          while (hasMore) {
            // Check limit if set
            if (options.limit && result.total >= options.limit) {
              hasMore = false;
              break;
            }
            
            const response = await this.fetchWithRateLimit<LiteApiHotel[]>(
              this.endpoints.hotels,
              { 
                countryCode, 
                page, 
                perPage: batchSize 
              }
            );
            
            if (!response?.data?.length) {
              hasMore = false;
              break;
            }
            
            const hotels = response.data;
            console.log(`Processing ${hotels.length} hotels for ${countryCode} (page ${page})...`);
            
            for (const hotel of hotels) {
              if (options.limit && result.total >= options.limit) break;
              
              try {
                const upsertResult = await this.upsertCanonicalHotel(hotel, options);
                
                if (upsertResult) {
                  if (upsertResult.created) {
                    result.created++;
                  } else {
                    result.updated++;
                  }
                  
                  // Process hotel images
                  if (hotel.main_photo || hotel.thumbnail) {
                    await this.upsertHotelImages(upsertResult.hotel.id, hotel, options);
                  }
                  
                  // Process amenities
                  if (hotel.facilityIds && hotel.facilityIds.length > 0) {
                    await this.upsertHotelAmenities(upsertResult.hotel.id, hotel.facilityIds, options);
                  }
                }
                
                result.total++;
                countryHotelsCount++;
                
                // Update sync log progress
                if (this.syncLog && result.total % 100 === 0) {
                  await prisma.supplierSyncLog.update({
                    where: { id: this.syncLog.id },
                    data: {
                      processedRecords: result.total,
                      createdRecords: result.created,
                      updatedRecords: result.updated,
                    },
                  });
                  console.log(`Progress: ${result.total} processed, ${result.created} created, ${result.updated} updated`);
                }
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                result.failed++;
                result.errors.push({ code: hotel.id, error: errorMessage });
                console.error(`Error processing hotel ${hotel.id}:`, errorMessage);
              }
            }
            
            // Check if there are more pages
            hasMore = hotels.length === batchSize;
            page++;
            
            // Small delay between pages
            await this.delay(500);
          }
          
          console.log(`Country ${countryCode} complete: ${countryHotelsCount} hotels processed`);
        } catch (error) {
          console.error(`Error importing hotels for country ${countryCode}:`, error);
          // Continue with next country
        }
      }
      
      // Update final sync status
      await this.updateSyncStatus(result);
      
      console.log('\nHotel import completed!');
      console.log(`Total: ${result.total}`);
      console.log(`Created: ${result.created}`);
      console.log(`Updated: ${result.updated}`);
      console.log(`Failed: ${result.failed}`);
      
    } catch (error) {
      console.error('Hotel import failed:', error);
      throw error;
    }
    
    return result;
  }

  private async getCountriesForImport(): Promise<string[]> {
    // Get countries from the destinations table
    const countries = await prisma.destination.findMany({
      where: {
        destinationType: 'country',
      },
      select: {
        countryCode: true,
      },
    });
    
    // If no countries in DB, use a default list
    if (countries.length === 0) {
      return ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AE', 'SA', 'IN', 'JP', 'AU', 'CA', 'MX', 'BR', 'AR'];
    }
    
    return countries.map(c => c.countryCode).filter(Boolean) as string[];
  }

  // ============================================
  // HOTEL DETAILS & ROOM TYPES IMPORTER
  // ============================================

  /**
   * Fetch hotel details from LITEAPI /v3.0/data/hotel endpoint
   * This endpoint returns full hotel details including roomTypes
   */
  private async fetchHotelDetails(hotelId: string): Promise<LiteApiHotelDetails | null> {
    try {
      const response = await this.fetchWithRateLimit<LiteApiHotelDetails>(
        this.endpoints.hotel,
        { hotelId }
      );
      
      return response?.data || null;
    } catch (error) {
      console.error(`Error fetching hotel details for ${hotelId}:`, error);
      return null;
    }
  }

  /**
   * Import room types for a specific hotel
   */
  private async upsertRoomTypes(
    canonicalHotelId: string,
    roomTypes: LiteApiHotelDetails['roomTypes'],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || !roomTypes || roomTypes.length === 0 || !this.supplier) {
      return 0;
    }

    let created = 0;

    for (const room of roomTypes) {
      try {
        // Generate a unique room type code
        const roomTypeCode = room.roomCode || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Use upsert to handle duplicates gracefully
        const roomType = await prisma.hotelRoomType.upsert({
          where: {
            canonicalHotelId_roomTypeCode: {
              canonicalHotelId,
              roomTypeCode,
            },
          },
          update: {
            roomTypeName: room.roomName,
            bedType: room.bedType,
            bedCount: room.bedCount,
            maxOccupancy: room.maxOccupancy || 2,
            maxAdults: room.maxAdults || 2,
            maxChildren: room.maxChildren || 0,
            roomSize: room.roomSize,
            supplierId: this.supplier.id,
            supplierRoomCode: room.roomCode,
            supplierRoomName: room.roomName,
            updatedAt: new Date(),
          },
          create: {
            canonicalHotelId,
            roomTypeCode,
            roomTypeName: room.roomName || 'Unknown Room',
            bedType: room.bedType,
            bedCount: room.bedCount || 1,
            maxOccupancy: room.maxOccupancy || 2,
            maxAdults: room.maxAdults || 2,
            maxChildren: room.maxChildren || 0,
            roomSize: room.roomSize,
            supplierId: this.supplier.id,
            supplierRoomCode: room.roomCode,
            supplierRoomName: room.roomName,
          },
        });

        created++;

        // Process room images
        if (room.images && room.images.length > 0) {
          await this.upsertRoomImages(roomType.id, room.images, options);
        }

        // Process room facilities/amenities
        if (room.facilities && room.facilities.length > 0) {
          await this.upsertRoomAmenities(roomType.id, room.facilities, options);
        }
      } catch (error) {
        console.error(`Error upserting room type ${room.roomCode}:`, error);
      }
    }

    return created;
  }

  /**
   * Store room images in RoomImage model
   */
  private async upsertRoomImages(
    roomTypeId: string,
    images: Array<{ url: string; type?: string }>,
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || !this.supplier) {
      return 0;
    }

    let created = 0;

    for (const img of images) {
      try {
        const urlHash = crypto.createHash('md5').update(img.url).digest('hex');
        const imageType = img.type || 'room';

        // Download and save image locally
        const downloadedImage = await this.downloadAndSaveImage(
          img.url,
          roomTypeId,
          imageType
        );

        const storagePath = downloadedImage?.localPath || img.url;

        // Use upsert to handle duplicates gracefully
        await prisma.roomImage.upsert({
          where: { urlHash },
          update: {
            roomTypeId,
            supplierId: this.supplier.id,
            width: downloadedImage?.width,
            height: downloadedImage?.height,
            fileSize: downloadedImage?.fileSize,
            imageType,
            status: downloadedImage ? 'active' : 'inactive',
          },
          create: {
            roomTypeId,
            supplierId: this.supplier.id,
            url: storagePath,
            urlHash,
            imageType,
            sizeVariant: 'original',
            width: downloadedImage?.width,
            height: downloadedImage?.height,
            fileSize: downloadedImage?.fileSize,
            status: downloadedImage ? 'active' : 'inactive',
          },
        });

        created++;
      } catch (error) {
        console.error(`Error upserting room image:`, error);
      }
    }

    return created;
  }

  /**
   * Map room facilities to room amenities
   */
  private async upsertRoomAmenities(
    roomTypeId: string,
    facilities: string[],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || facilities.length === 0 || !this.supplier) {
      return 0;
    }

    let created = 0;

    for (const facilityCode of facilities) {
      try {
        // Try to find existing room amenity by code
        let roomAmenity = await prisma.roomAmenity.findUnique({
          where: { code: facilityCode },
        });

        // If not found, create a new room amenity
        if (!roomAmenity) {
          roomAmenity = await prisma.roomAmenity.create({
            data: {
              code: facilityCode,
              name: facilityCode,
              category: 'General',
            },
          });

          // Create supplier mapping for the new amenity
          await prisma.roomAmenitySupplierMapping.create({
            data: {
              amenityId: roomAmenity.id,
              supplierId: this.supplier.id,
              supplierCode: facilityCode,
              supplierName: facilityCode,
              matchConfidence: 1.0,
              isVerified: true,
            },
          });
        }

        // Create mapping between room type and amenity
        await prisma.roomAmenityMapping.upsert({
          where: {
            roomTypeId_amenityId: {
              roomTypeId,
              amenityId: roomAmenity.id,
            },
          },
          update: {
            supplierId: this.supplier.id,
            supplierAmenityCode: facilityCode,
          },
          create: {
            roomTypeId,
            amenityId: roomAmenity.id,
            supplierId: this.supplier.id,
            supplierAmenityCode: facilityCode,
          },
        });

        created++;
      } catch (error) {
        console.error(`Error upserting room amenity ${facilityCode}:`, error);
      }
    }

    return created;
  }

  /**
   * Import room types for all hotels (or a limited set)
   * This fetches individual hotel details from /v3.0/data/hotel endpoint
   */
  async importRoomTypes(options: ImportOptions & { roomsPerHotel?: number } = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };

    console.log('\n--- Importing Room Types ---');
    console.log('Note: Room types are fetched from individual hotel details endpoint');

    try {
      if (!this.supplier) {
        await this.initialize('roomTypes');
      }

      const batchSize = options.batchSize || 100;

      // Get total count of hotel mappings for this supplier
      const totalCount = await prisma.supplierHotelMapping.count({
        where: {
          supplierId: this.supplier?.id,
        },
      });

      // Determine actual limit (undefined means no limit = all hotels)
      const effectiveLimit = options.limit ?? totalCount;
      const hotelsToProcess = Math.min(effectiveLimit, totalCount);

      console.log(`Total hotels available: ${totalCount}`);
      console.log(`Fetching room types for ${hotelsToProcess} hotels...`);
      console.log(`Batch size: ${batchSize}`);

      // Process in batches to avoid memory issues
      let processedCount = 0;
      let skip = 0;

      while (processedCount < hotelsToProcess && skip < totalCount) {
        // Get batch of hotel mappings
        const hotelMappings = await prisma.supplierHotelMapping.findMany({
          where: {
            supplierId: this.supplier?.id,
          },
          select: {
            id: true,
            supplierHotelId: true,
            canonicalHotelId: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: batchSize,
          skip: skip,
        });

        if (hotelMappings.length === 0) break;

        console.log(`\nProcessing batch ${Math.floor(skip / batchSize) + 1} (${hotelMappings.length} hotels)...`);

        for (const mapping of hotelMappings) {
          if (processedCount >= hotelsToProcess) break;

          try {
            // Fetch hotel details including room types
            const hotelDetails = await this.fetchHotelDetails(mapping.supplierHotelId);

            if (hotelDetails?.roomTypes && hotelDetails.roomTypes.length > 0) {
              const roomsCreated = await this.upsertRoomTypes(
                mapping.canonicalHotelId,
                hotelDetails.roomTypes,
                options
              );

              result.created += roomsCreated;
              result.total += hotelDetails.roomTypes.length;
            }

            processedCount++;

            // Progress logging every 50 hotels
            if (processedCount % 50 === 0) {
              console.log(`Progress: ${processedCount}/${hotelsToProcess} hotels processed, ${result.created} room types imported`);

              // Update sync log progress
              if (this.syncLog) {
                await prisma.supplierSyncLog.update({
                  where: { id: this.syncLog.id },
                  data: {
                    processedRecords: processedCount,
                    createdRecords: result.created,
                    failedRecords: result.failed,
                  },
                });
              }
            }

          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.failed++;
            result.errors.push({ code: mapping.supplierHotelId, error: errorMessage });
            processedCount++;
            // Continue with next hotel
          }
        }

        skip += batchSize;

        // Small delay between batches to avoid rate limiting
        await this.delay(500);
      }

      // Update final sync status
      if (this.syncLog) {
        await prisma.supplierSyncLog.update({
          where: { id: this.syncLog.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            totalRecords: hotelsToProcess,
            processedRecords: processedCount,
            createdRecords: result.created,
            failedRecords: result.failed,
            errors: result.errors.length > 0 ? result.errors.slice(0, 100) : undefined,
          },
        });
      }

      console.log(`\nRoom types import completed!`);
      console.log(`Hotels processed: ${processedCount}`);
      console.log(`Room types imported: ${result.created}`);
      console.log(`Failed: ${result.failed}`);
    } catch (error) {
      console.error('Error importing room types:', error);
      // Don't throw - room types are optional
    }

    return result;
  }

  // ============================================
  // HOTEL REVIEWS IMPORTER
  // ============================================

  async importReviews(options: ImportOptions & { reviewsPerHotel?: number } = {}): Promise<ImportResult> {
    const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
    
    console.log('\n--- Importing Hotel Reviews ---');
    console.log('Note: LITEAPI reviews endpoint requires a specific hotelId parameter.');
    console.log('Note: Reviews are stored in hotel metadata (no dedicated table)');
    
    // LITEAPI reviews endpoint requires hotelId - it cannot fetch all reviews
    // We need to iterate through hotels and fetch reviews for each
    try {
      if (!this.supplier) {
        await this.initialize('reviews');
      }
      
      // No limit by default - import ALL hotels
      const reviewsPerHotel = options.reviewsPerHotel || 10;
      const batchSize = options.batchSize || 100;
      
      // Get total count of hotel mappings for this supplier
      const totalCount = await prisma.supplierHotelMapping.count({
        where: {
          supplierId: this.supplier?.id,
        },
      });
      
      // Determine actual limit (undefined means no limit = all hotels)
      const effectiveLimit = options.limit ?? totalCount;
      const hotelsToProcess = Math.min(effectiveLimit, totalCount);
      
      console.log(`Total hotels available: ${totalCount}`);
      console.log(`Fetching reviews for ${hotelsToProcess} hotels (${reviewsPerHotel} reviews per hotel)...`);
      console.log(`Batch size: ${batchSize}`);
      
      // Process in batches to avoid memory issues
      let processedCount = 0;
      let skip = 0;
      
      while (processedCount < hotelsToProcess && skip < totalCount) {
        // Get batch of hotel mappings
        const hotelMappings = await prisma.supplierHotelMapping.findMany({
          where: {
            supplierId: this.supplier?.id,
          },
          select: {
            id: true,
            supplierHotelId: true,
            canonicalHotelId: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: batchSize,
          skip: skip,
        });
        
        if (hotelMappings.length === 0) break;
        
        console.log(`\nProcessing batch ${Math.floor(skip / batchSize) + 1} (${hotelMappings.length} hotels)...`);
        
        for (const mapping of hotelMappings) {
          if (processedCount >= hotelsToProcess) break;
          
          try {
            // Fetch reviews for this specific hotel
            const response = await this.fetchWithRateLimit<{ reviews: LiteApiReview[] }>(
              this.endpoints.reviews,
              { hotelId: mapping.supplierHotelId, limit: reviewsPerHotel }
            );
            
            if (response?.data?.reviews && response.data.reviews.length > 0) {
              const reviews = response.data.reviews;
              
              // Calculate average rating
              const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
              
              if (!options.dryRun) {
                // Get existing hotel metadata
                const existingHotel = await prisma.canonicalHotel.findUnique({
                  where: { id: mapping.canonicalHotelId },
                  select: { metadata: true },
                });
                
                // Merge with existing metadata
                const existingMetadata = (existingHotel?.metadata as Record<string, unknown>) || {};
                
                // Update hotel with review summary
                await prisma.canonicalHotel.update({
                  where: { id: mapping.canonicalHotelId },
                  data: {
                    metadata: {
                      ...existingMetadata,
                      reviews: reviews.slice(0, reviewsPerHotel) as unknown as Prisma.InputJsonValue,
                      avgRating,
                      reviewCount: reviews.length,
                      lastReviewSync: new Date().toISOString(),
                    } as Prisma.InputJsonValue,
                    updatedAt: new Date(),
                  },
                });
              }
              
              result.created += reviews.length;
              result.total += reviews.length;
            }
            
            processedCount++;
            
            // Progress logging every 50 hotels
            if (processedCount % 50 === 0) {
              console.log(`Progress: ${processedCount}/${hotelsToProcess} hotels processed, ${result.created} reviews imported`);
              
              // Update sync log progress
              if (this.syncLog) {
                await prisma.supplierSyncLog.update({
                  where: { id: this.syncLog.id },
                  data: {
                    processedRecords: processedCount,
                    createdRecords: result.created,
                    failedRecords: result.failed,
                  },
                });
              }
            }
            
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.failed++;
            result.errors.push({ code: mapping.supplierHotelId, error: errorMessage });
            processedCount++;
            // Continue with next hotel
          }
        }
        
        skip += batchSize;
        
        // Small delay between batches to avoid rate limiting
        await this.delay(500);
      }
      
      // Update final sync status
      if (this.syncLog) {
        await prisma.supplierSyncLog.update({
          where: { id: this.syncLog.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            totalRecords: hotelsToProcess,
            processedRecords: processedCount,
            createdRecords: result.created,
            failedRecords: result.failed,
            errors: result.errors.length > 0 ? result.errors.slice(0, 100) : undefined,
          },
        });
      }
      
      console.log(`\nReviews import completed!`);
      console.log(`Hotels processed: ${processedCount}`);
      console.log(`Reviews imported: ${result.created}`);
      console.log(`Failed: ${result.failed}`);
    } catch (error) {
      console.error('Error importing reviews:', error);
      // Don't throw - reviews are optional
    }
    
    return result;
  }

  // ============================================
  // DATA TRANSFORMATION
  // ============================================

  private extractHotelData(hotel: LiteApiHotel): Partial<CanonicalHotel> {
    return {
      name: hotel.name || '',
      nameNormalized: hotel.name?.toLowerCase().trim(),
      description: hotel.hotelDescription,
      address: hotel.address,
      addressNormalized: hotel.address?.toLowerCase().trim(),
      city: hotel.city || '',
      state: '',
      stateCode: '',
      country: hotel.country?.toUpperCase() || '',
      countryCode: hotel.country?.toUpperCase() || '',
      postalCode: hotel.zip,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.stars,
      hotelType: String(hotel.hotelTypeId),
      chainCode: hotel.chain !== 'Not Available' ? hotel.chain : undefined,
      chainName: hotel.chain !== 'Not Available' ? hotel.chain : undefined,
    };
  }

  private extractHotelImages(hotel: LiteApiHotel): Array<{
    url: string;
    urlHash: string;
    imageType: string;
    width?: number;
    height?: number;
    isPrimary: boolean;
    displayOrder: number;
  }> {
    const images: Array<{
      url: string;
      urlHash: string;
      imageType: string;
      width?: number;
      height?: number;
      isPrimary: boolean;
      displayOrder: number;
    }> = [];
    
    if (hotel.main_photo) {
      images.push({
        url: hotel.main_photo,
        urlHash: crypto.createHash('md5').update(hotel.main_photo).digest('hex'),
        imageType: 'main',
        isPrimary: true,
        displayOrder: 0,
      });
    }
    
    if (hotel.thumbnail) {
      images.push({
        url: hotel.thumbnail,
        urlHash: crypto.createHash('md5').update(hotel.thumbnail).digest('hex'),
        imageType: 'thumbnail',
        isPrimary: !hotel.main_photo,
        displayOrder: hotel.main_photo ? 1 : 0,
      });
    }
    
    return images;
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  private async upsertCanonicalHotel(
    hotel: LiteApiHotel,
    options: ImportOptions
  ): Promise<{ hotel: CanonicalHotel; created: boolean } | null> {
    if (!this.supplier) {
      throw new Error('Supplier not initialized');
    }
    
    const hotelId = hotel.id;
    const hotelData = this.extractHotelData(hotel);
    
    // Check if mapping already exists
    const existingMapping = await prisma.supplierHotelMapping.findUnique({
      where: {
        supplierId_supplierHotelId: {
          supplierId: this.supplier.id,
          supplierHotelId: hotelId,
        },
      },
      include: { canonicalHotel: true },
    });
    
    if (existingMapping) {
      // Update existing canonical hotel
      if (!options.dryRun) {
        const updated = await prisma.canonicalHotel.update({
          where: { id: existingMapping.canonicalHotelId },
          data: {
            name: hotelData.name,
            nameNormalized: hotelData.nameNormalized,
            description: hotelData.description,
            address: hotelData.address,
            addressNormalized: hotelData.addressNormalized,
            city: hotelData.city,
            country: hotelData.country,
            countryCode: hotelData.countryCode,
            postalCode: hotelData.postalCode,
            latitude: hotelData.latitude,
            longitude: hotelData.longitude,
            starRating: hotelData.starRating,
            hotelType: hotelData.hotelType,
            chainCode: hotelData.chainCode,
            chainName: hotelData.chainName,
            updatedAt: new Date(),
          },
        });
        
        // Update mapping sync status
        await prisma.supplierHotelMapping.update({
          where: { id: existingMapping.id },
          data: {
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            supplierData: hotel as unknown as Prisma.InputJsonValue,
          },
        });
        
        return { hotel: updated, created: false };
      }
      return { hotel: existingMapping.canonicalHotel, created: false };
    }
    
    // Try to find matching hotel by name and location
    const potentialMatch = await this.findMatchingHotel(hotel);
    
    if (potentialMatch) {
      // Create mapping to existing hotel - use upsert to handle duplicates
      if (!options.dryRun) {
        await prisma.supplierHotelMapping.upsert({
          where: {
            supplierId_supplierHotelId: {
              supplierId: this.supplier.id,
              supplierHotelId: hotelId,
            },
          },
          update: {
            canonicalHotelId: potentialMatch.id,
            matchType: 'auto',
            matchConfidence: 0.85,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            supplierData: hotel as unknown as Prisma.InputJsonValue,
          },
          create: {
            canonicalHotelId: potentialMatch.id,
            supplierId: this.supplier.id,
            supplierHotelId: hotelId,
            matchType: 'auto',
            matchConfidence: 0.85,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            supplierData: hotel as unknown as Prisma.InputJsonValue,
          },
        });
      }
      return { hotel: potentialMatch, created: false };
    }
    
    // Create new canonical hotel
    if (!options.dryRun) {
      const canonicalCode = `LA-${hotelId}-${Date.now()}`;
      
      const newHotel = await prisma.canonicalHotel.create({
        data: {
          canonicalCode,
          name: hotel.name || 'Unknown Hotel',
          nameNormalized: hotel.name?.toLowerCase().trim(),
          description: hotel.hotelDescription,
          address: hotel.address,
          addressNormalized: hotel.address?.toLowerCase().trim(),
          city: hotel.city || '',
          state: '',
          stateCode: '',
          country: hotel.country?.toUpperCase() || '',
          countryCode: hotel.country?.toUpperCase() || '',
          postalCode: hotel.zip,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          starRating: hotel.stars,
          hotelType: String(hotel.hotelTypeId),
          chainCode: hotel.chain !== 'Not Available' ? hotel.chain : undefined,
          chainName: hotel.chain !== 'Not Available' ? hotel.chain : undefined,
          status: 'active',
          supplierMappings: {
            create: {
              supplierId: this.supplier.id,
              supplierHotelId: hotelId,
              matchType: 'auto',
              matchConfidence: 1.0,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              supplierData: hotel as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });
      
      return { hotel: newHotel, created: true };
    }
    
    return null;
  }

  private async findMatchingHotel(hotel: LiteApiHotel): Promise<CanonicalHotel | null> {
    if (!hotel.name || !hotel.country) {
      return null;
    }
    
    // Try to find by name similarity and country
    const matches = await prisma.canonicalHotel.findMany({
      where: {
        countryCode: hotel.country.toUpperCase(),
        nameNormalized: {
          contains: hotel.name.toLowerCase().trim(),
        },
      },
      take: 5,
    });
    
    if (matches.length === 0) {
      return null;
    }
    
    // Return the first match (TODO: Implement more sophisticated matching)
    return matches[0];
  }

  private async upsertHotelImages(
    canonicalHotelId: string,
    hotel: LiteApiHotel,
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun) {
      return 0;
    }
    
    const images = this.extractHotelImages(hotel);
    let created = 0;
    
    for (const img of images) {
      try {
        // Download and save image locally
        const downloadedImage = await this.downloadAndSaveImage(
          img.url,
          canonicalHotelId,
          img.imageType
        );
        
        // Store local path instead of remote URL
        const storagePath = downloadedImage?.localPath || img.url;
        const fileSize = downloadedImage?.fileSize;
        const width = downloadedImage?.width || img.width;
        const height = downloadedImage?.height || img.height;
        
        // Use upsert to handle duplicates gracefully
        await prisma.hotelImage.upsert({
          where: { urlHash: img.urlHash },
          update: {
            canonicalHotelId,
            width: width,
            height: height,
            fileSize: fileSize,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
            status: downloadedImage ? 'active' : 'inactive',
          },
          create: {
            canonicalHotelId,
            supplierId: this.supplier?.id,
            url: storagePath,
            urlHash: img.urlHash,
            imageType: img.imageType,
            sizeVariant: 'original',
            width: width,
            height: height,
            fileSize: fileSize,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
            status: downloadedImage ? 'active' : 'inactive',
          },
        });
        created++;
      } catch (error) {
        // Log but continue - don't fail the whole import for one image
        console.error(`Error upserting image ${img.urlHash}:`, error);
      }
    }
    
    return created;
  }

  private async upsertHotelAmenities(
    canonicalHotelId: string,
    facilityIds: number[],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || facilityIds.length === 0 || !this.supplier) {
      return 0;
    }
    
    let created = 0;
    
    for (const facilityId of facilityIds) {
      try {
        const mapping = await prisma.hotelAmenitySupplierMapping.findUnique({
          where: {
            supplierId_supplierCode: {
              supplierId: this.supplier.id,
              supplierCode: String(facilityId),
            },
          },
          include: { amenity: true },
        });
        
        if (mapping) {
          // Use upsert to handle duplicates gracefully
          await prisma.hotelAmenityMapping.upsert({
            where: {
              canonicalHotelId_amenityId: {
                canonicalHotelId,
                amenityId: mapping.amenityId,
              },
            },
            update: {
              supplierId: this.supplier.id,
              supplierAmenityCode: String(facilityId),
            },
            create: {
              canonicalHotelId,
              amenityId: mapping.amenityId,
              supplierId: this.supplier.id,
              supplierAmenityCode: String(facilityId),
            },
          });
          created++;
        }
      } catch (error) {
        console.error(`Error upserting amenity mapping for ${facilityId}:`, error);
      }
    }
    
    return created;
  }

  private async updateSyncStatus(result: ImportResult): Promise<void> {
    if (this.syncLog) {
      await prisma.supplierSyncLog.update({
        where: { id: this.syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          totalRecords: result.total,
          processedRecords: result.total,
          createdRecords: result.created,
          updatedRecords: result.updated,
          failedRecords: result.failed,
          errors: result.errors.length > 0 ? result.errors.slice(0, 100) : undefined,
        },
      });
    }
    
    if (this.supplier) {
      await prisma.supplier.update({
        where: { id: this.supplier.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: result.failed > 0 ? 'partial' : 'success',
          lastSyncRecords: result.total,
        },
      });
    }
  }

  // ============================================
  // MASTER IMPORT METHOD
  // ============================================

  async importAll(options: ImportOptions = {}): Promise<Record<string, ImportResult>> {
    const results: Record<string, ImportResult> = {};
    
    console.log(chalkBlue('\n========================================'));
    console.log(chalkBlue('LITEAPI Full Static Data Import'));
    console.log(chalkBlue('========================================\n'));
    
    try {
      await this.initialize('all');
      
      // Import reference data first (in order of dependencies)
      results.countries = await this.importCountries(options);
      results.cities = await this.importCities(options);
      results.currencies = await this.importCurrencies(options);
      results.iataCodes = await this.importIataCodes(options);
      results.languages = await this.importLanguages(options);
      results.hotelTypes = await this.importHotelTypes(options);
      results.chains = await this.importChains(options);
      results.facilities = await this.importFacilities(options);
      
      // Import hotel data
      results.hotels = await this.importHotels(options);
      results.roomTypes = await this.importRoomTypes(options);
      results.reviews = await this.importReviews(options);
      
      console.log(chalkGreen('\n========================================'));
      console.log(chalkGreen('All imports completed successfully!'));
      console.log(chalkGreen('========================================\n'));
      
      // Print summary
      this.printSummary(results);
      
    } catch (error) {
      console.error('Full import failed:', error);
      throw error;
    }
    
    return results;
  }

  private printSummary(results: Record<string, ImportResult>): void {
    console.log('\nImport Summary:');
    console.log('---------------');
    
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    
    for (const [type, result] of Object.entries(results)) {
      console.log(`${type.padEnd(15)}: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalFailed += result.failed;
    }
    
    console.log('---------------');
    console.log(`Total: ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`);
  }

  // ============================================
  // CLEANUP
  // ============================================

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Helper functions for colored output
function chalkBlue(text: string): string {
  return `\x1b[34m${text}\x1b[0m`;
}

function chalkGreen(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

export default LiteApiImporter;