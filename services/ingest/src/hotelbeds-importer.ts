/**
 * Hotelbeds Static Data Importer
 * 
 * This service handles importing hotel static data from Hotelbeds API
 * into the canonical database structure. It supports:
 * - Full imports
 * - Incremental/delta imports
 * - Rate limit handling with credential rotation
 * - Automatic mapping to canonical hotels
 * 
 * Usage:
 *   npm run import-static -- hotelbeds-hotels --limit=100
 *   npm run import-static -- hotelbeds-hotels --incremental --from=2024-01-01
 */

import { Supplier, SupplierSyncLog, CanonicalHotel, Amenity } from '@prisma/client';
import { prisma } from '@tripalfa/shared-database';
import { getRoomCategories, getBoardTypes, getPolicyTerms, mapHotelAmenity } from './reference-data-service';
import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

interface HotelbedsConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

interface HotelbedsHotel {
  code: number;
  name: {
    content: string;
    language?: string;
  };
  description?: {
    content: string;
    language?: string;
  };
  countryCode: string;
  stateCode?: string;
  destinationCode: string;
  zoneCode?: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  categoryCode: string;
  categoryGroupCode?: string;
  chainCode?: string;
  accommodationTypeCode?: string;
  boardCodes?: string[];
  facilityCodes?: string[];
  images?: Array<{
    filePath: string;
    type: string;
    characteristicCode?: string;
    roomCode?: string;
    visualOrder?: number;
  }>;
  address?: {
    content: string;
    language?: string;
  };
  postalCode?: string;
  city?: {
    content: string;
    language?: string;
  };
  email?: string;
  phones?: Array<{
    phoneNumber: string;
    phoneType: string;
  }>;
  web?: string;
  lastUpdate?: string;
  S2C?: string;
  rank?: number;
}

interface HotelbedsResponse {
  hotels: {
    total: number;
    hotels: HotelbedsHotel[];
  };
  auditData: {
    processTime: string;
    timestamp: string;
    requestHost: string;
    serverId: string;
    environment: string;
    release: string;
    token: string;
  };
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
}

interface ImportOptions {
  limit?: number;
  incremental?: boolean;
  from?: string;
  to?: string;
  dryRun?: boolean;
  batchSize?: number;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ code: string; error: string }>;
}

// ============================================
// HOTELBEDS IMPORTER CLASS
// ============================================

export class HotelbedsImporter {
  private supplier: Supplier | null = null;
  private credentials: HotelbedsConfig[] = [];
  private currentCredentialIndex = 0;
  private apiClient: AxiosInstance | null = null;
  private syncLog: SupplierSyncLog | null = null;
  
  // Rate limiting
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitDelay = 600; // ms between requests

  constructor() {
    this.loadCredentials();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private loadCredentials(): void {
    const credentials: HotelbedsConfig[] = [];
    
    // Primary credentials
    if (process.env.HOTELBEDS_API_KEY && process.env.HOTELBEDS_API_SECRET) {
      credentials.push({
        apiKey: process.env.HOTELBEDS_API_KEY,
        apiSecret: process.env.HOTELBEDS_API_SECRET,
        baseUrl: process.env.HOTELBEDS_BASE_URL || 'https://api.hotelbeds.com/hotel-api/1.0',
      });
    }
    
    // Secondary credentials (for rate limit rotation)
    if (process.env.HOTELBEDS_API_KEY_2 && process.env.HOTELBEDS_API_SECRET_2) {
      credentials.push({
        apiKey: process.env.HOTELBEDS_API_KEY_2,
        apiSecret: process.env.HOTELBEDS_API_SECRET_2,
        baseUrl: process.env.HOTELBEDS_BASE_URL || 'https://api.hotelbeds.com/hotel-api/1.0',
      });
    }
    
    // Tertiary credentials
    if (process.env.HOTELBEDS_API_KEY_3 && process.env.HOTELBEDS_API_SECRET_3) {
      credentials.push({
        apiKey: process.env.HOTELBEDS_API_KEY_3,
        apiSecret: process.env.HOTELBEDS_API_SECRET_3,
        baseUrl: process.env.HOTELBEDS_BASE_URL || 'https://api.hotelbeds.com/hotel-api/1.0',
      });
    }
    
    this.credentials = credentials;
    
    if (credentials.length === 0) {
      console.warn('No Hotelbeds credentials found in environment');
    }
  }

  private async initialize(): Promise<void> {
    // Get or create supplier record
    this.supplier = await prisma.supplier.upsert({
      where: { code: 'hotelbeds' },
      update: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'running',
      },
      create: {
        code: 'hotelbeds',
        name: 'Hotelbeds',
        type: 'hotel',
        status: 'active',
        apiBaseUrl: this.credentials[0]?.baseUrl,
        syncEnabled: true,
        syncInterval: 86400,
        features: {
          hotels: true,
          availability: true,
          realtime: true,
          multiCurrency: true,
          multiLanguage: true,
        },
      },
    });
    
    // Create sync log
    this.syncLog = await prisma.supplierSyncLog.create({
      data: {
        supplierId: this.supplier.id,
        syncType: 'full',
        dataType: 'hotels',
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
      throw new Error('No valid Hotelbeds credentials available');
    }
    
    this.apiClient = axios.create({
      baseURL: cred.baseUrl,
      headers: {
        'Api-Key': cred.apiKey,
        'X-Signature': this.generateSignature(cred.apiKey, cred.apiSecret),
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      timeout: 30000,
    });
  }

  private generateSignature(apiKey: string, apiSecret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const toHash = apiKey + apiSecret + timestamp;
    return crypto.createHash('sha256').update(toHash).digest('hex');
  }

  private rotateCredentials(): void {
    this.currentCredentialIndex = (this.currentCredentialIndex + 1) % this.credentials.length;
    console.log(`Rotating to credential set ${this.currentCredentialIndex + 1}`);
    this.initApiClient();
  }

  // ============================================
  // API CALLS
  // ============================================

  private async fetchHotels(
    page: number = 1,
    limit: number = 100,
    from?: string,
    to?: string
  ): Promise<HotelbedsResponse | null> {
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
      const params: Record<string, unknown> = {
        page,
        hotelsPerPage: limit,
        language: 'ENG',
      };
      
      if (from) {
        params.from = from;
      }
      if (to) {
        params.to = to;
      }
      
      const response = await this.apiClient.get<HotelbedsResponse>('/hotels', { params });
      
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 429) {
        console.log('Rate limit hit, rotating credentials...');
        this.rotateCredentials();
        // Retry with new credentials
        return this.fetchHotels(page, limit, from, to);
      }
      
      console.error('Error fetching hotels:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // DATA TRANSFORMATION
  // ============================================

  private parseStarRating(categoryCode: string): number | null {
    // Hotelbeds uses format like "4EST" for 4 stars, "5LUX" for 5 stars luxury
    const match = categoryCode.match(/^(\d)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  private extractHotelData(hotel: HotelbedsHotel): Partial<CanonicalHotel> {
    const starRating = this.parseStarRating(hotel.categoryCode);
    
    return {
      name: hotel.name?.content || '',
      nameNormalized: hotel.name?.content?.toLowerCase().trim(),
      description: hotel.description?.content,
      address: hotel.address?.content,
      addressNormalized: hotel.address?.content?.toLowerCase().trim(),
      city: hotel.city?.content || '',
      countryCode: hotel.countryCode,
      postalCode: hotel.postalCode,
      latitude: hotel.coordinates?.latitude,
      longitude: hotel.coordinates?.longitude,
      starRating: starRating ? starRating : null,
      chainCode: hotel.chainCode,
      email: hotel.email,
      website: hotel.web,
      // Extract phone
      phone: hotel.phones?.find(p => p.phoneType === 'PHONE')?.phoneNumber ||
             hotel.phones?.[0]?.phoneNumber,
    };
  }

  private extractImages(hotel: HotelbedsHotel): Array<{
    url: string;
    urlHash: string;
    imageType: string;
    roomTypeCode?: string;
    displayOrder: number;
  }> {
    if (!hotel.images || hotel.images.length === 0) {
      return [];
    }
    
    return hotel.images.map((img, index) => {
      const url = `http://photos.hotelbeds.com/giata/${img.filePath}`;
      return {
        url,
        urlHash: crypto.createHash('md5').update(url).digest('hex'),
        imageType: img.type || 'general',
        roomTypeCode: img.roomCode,
        displayOrder: img.visualOrder || index,
      };
    });
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  private async upsertCanonicalHotel(
    hotel: HotelbedsHotel,
    options: ImportOptions
  ): Promise<{ hotel: CanonicalHotel; created: boolean } | null> {
    if (!this.supplier) {
      throw new Error('Supplier not initialized');
    }
    
    const hotelCode = hotel.code.toString();
    const hotelData = this.extractHotelData(hotel);
    
    // Check if mapping already exists
    const existingMapping = await prisma.supplierHotelMapping.findUnique({
      where: {
        supplierId_supplierHotelId: {
          supplierId: this.supplier.id,
          supplierHotelId: hotelCode,
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
            ...hotelData,
            updatedAt: new Date(),
          },
        });
        
        // Update mapping sync status
        await prisma.supplierHotelMapping.update({
          where: { id: existingMapping.id },
          data: {
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            supplierData: hotel as unknown as Record<string, unknown>,
          },
        });
        
        return { hotel: updated, created: false };
      }
      return { hotel: existingMapping.canonicalHotel, created: false };
    }
    
    // Try to find matching hotel by name and location (fuzzy matching)
    const potentialMatch = await this.findMatchingHotel(hotel);
    
    if (potentialMatch) {
      // Create mapping to existing hotel
      if (!options.dryRun) {
        await prisma.supplierHotelMapping.create({
          data: {
            canonicalHotelId: potentialMatch.id,
            supplierId: this.supplier.id,
            supplierHotelId: hotelCode,
            matchType: 'auto',
            matchConfidence: 0.8,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            supplierData: hotel as unknown as Record<string, unknown>,
          },
        });
      }
      return { hotel: potentialMatch, created: false };
    }
    
    // Create new canonical hotel
    if (!options.dryRun) {
      const canonicalCode = `HB-${hotelCode}-${Date.now()}`;
      
      const newHotel = await prisma.canonicalHotel.create({
        data: {
          canonicalCode,
          ...hotelData,
          status: 'active',
          supplierMappings: {
            create: {
              supplierId: this.supplier.id,
              supplierHotelId: hotelCode,
              matchType: 'auto',
              matchConfidence: 1.0,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              supplierData: hotel as unknown as Record<string, unknown>,
            },
          },
        },
      });
      
      return { hotel: newHotel, created: true };
    }
    
    return null;
  }

  private async findMatchingHotel(hotel: HotelbedsHotel): Promise<CanonicalHotel | null> {
    if (!hotel.name?.content || !hotel.countryCode) {
      return null;
    }
    
    // Try to find by name similarity and country
    const matches = await prisma.canonicalHotel.findMany({
      where: {
        countryCode: hotel.countryCode,
        nameNormalized: {
          contains: hotel.name.content.toLowerCase().trim(),
        },
      },
      take: 5,
    });
    
    if (matches.length === 0) {
      return null;
    }
    
    // TODO: Implement more sophisticated matching (Levenshtein distance, etc.)
    // For now, return the first match
    return matches[0];
  }

  private async upsertHotelImages(
    canonicalHotelId: string,
    images: Array<{
      url: string;
      urlHash: string;
      imageType: string;
      roomTypeCode?: string;
      displayOrder: number;
    }>,
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || images.length === 0) {
      return 0;
    }
    
    let created = 0;
    
    for (const img of images) {
      // Check if image already exists
      const existing = await prisma.hotelImage.findUnique({
        where: { urlHash: img.urlHash },
      });
      
      if (!existing) {
        await prisma.hotelImage.create({
          data: {
            canonicalHotelId,
            supplierId: this.supplier?.id,
            url: img.url,
            urlHash: img.urlHash,
            imageType: img.imageType,
            roomTypeCode: img.roomTypeCode,
            displayOrder: img.displayOrder,
            status: 'active',
          },
        });
        created++;
      }
    }
    
    return created;
  }

  private async upsertHotelAmenities(
    canonicalHotelId: string,
    facilityCodes: string[],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || facilityCodes.length === 0 || !this.supplier) {
      return 0;
    }
    
    let created = 0;
    
    for (const facilityCode of facilityCodes) {
      // Find amenity mapping for this facility code
      const mapping = await prisma.amenitySupplierMapping.findUnique({
        where: {
          supplierId_supplierCode: {
            supplierId: this.supplier.id,
            supplierCode: facilityCode,
          },
        },
        include: { amenity: true },
      });
      
      if (mapping) {
        // Check if mapping already exists
        const existing = await prisma.hotelAmenityMapping.findUnique({
          where: {
            canonicalHotelId_amenityId: {
              canonicalHotelId,
              amenityId: mapping.amenityId,
            },
          },
        });
        
        if (!existing) {
          await prisma.hotelAmenityMapping.create({
            data: {
              canonicalHotelId,
              amenityId: mapping.amenityId,
              supplierId: this.supplier.id,
              supplierAmenityCode: facilityCode,
            },
          });
          created++;
        }
      }
    }
    
    return created;
  }

  // ============================================
  // MAIN IMPORT METHOD
  // ============================================

  async importHotels(options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      await this.initialize();
      
      const batchSize = options.batchSize || 100;
      const limit = options.limit || 1000;
      let page = 1;
      let hasMore = true;
      
      console.log(`Starting Hotelbeds import with limit: ${limit}, batchSize: ${batchSize}`);
      
      while (hasMore && result.total < limit) {
        console.log(`Fetching page ${page}...`);
        
        const response = await this.fetchHotels(
          page,
          Math.min(batchSize, limit - result.total),
          options.from,
          options.to
        );
        
        if (!response || !response.hotels?.hotels?.length) {
          console.log('No more hotels to fetch');
          hasMore = false;
          break;
        }
        
        const hotels = response.hotels.hotels;
        console.log(`Processing ${hotels.length} hotels...`);
        
        for (const hotel of hotels) {
          try {
            const upsertResult = await this.upsertCanonicalHotel(hotel, options);
            
            if (upsertResult) {
              if (upsertResult.created) {
                result.created++;
              } else {
                result.updated++;
              }
              
              // Process images
              const images = this.extractImages(hotel);
              await this.upsertHotelImages(upsertResult.hotel.id, images, options);
              
              // Process amenities
              if (hotel.facilityCodes) {
                await this.upsertHotelAmenities(
                  upsertResult.hotel.id,
                  hotel.facilityCodes,
                  options
                );
              }
            }
            
            result.total++;
            
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
            result.errors.push({
              code: hotel.code.toString(),
              error: errorMessage,
            });
            console.error(`Error processing hotel ${hotel.code}:`, errorMessage);
          }
        }
        
        // Check pagination
        if (response.pagination) {
          hasMore = response.pagination.page < response.pagination.totalPages;
          page++;
        } else {
          hasMore = hotels.length === batchSize;
          page++;
        }
        
        // Small delay between pages
        await this.delay(500);
      }
      
      // Update final sync status
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
            errors: result.errors.length > 0 ? result.errors : undefined,
          },
        });
      }
      
      // Update supplier sync status
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
      
      console.log('\nImport completed!');
      console.log(`Total: ${result.total}`);
      console.log(`Created: ${result.created}`);
      console.log(`Updated: ${result.updated}`);
      console.log(`Failed: ${result.failed}`);
      
      return result;
    } catch (error) {
      console.error('Import failed:', error);
      
      // Update sync log with error
      if (this.syncLog) {
        await prisma.supplierSyncLog.update({
          where: { id: this.syncLog.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
      }
      
      throw error;
    }
  }

  // ============================================
  // INCREMENTAL IMPORT
  // ============================================

  async importIncremental(fromDate?: string): Promise<ImportResult> {
    const from = fromDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    
    console.log(`Running incremental import from ${from} to ${to}`);
    
    return this.importHotels({
      incremental: true,
      from,
      to,
    });
  }

  // ============================================
  // CLEANUP
  // ============================================

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// ============================================
// CLI ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const options: ImportOptions = {};
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--incremental':
        options.incremental = true;
        break;
      case '--from':
        options.from = args[++i];
        break;
      case '--to':
        options.to = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i], 10);
        break;
    }
  }
  
  const importer = new HotelbedsImporter();
  
  try {
    if (options.incremental) {
      await importer.importIncremental(options.from);
    } else {
      await importer.importHotels(options);
    }
  } finally {
    await importer.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default HotelbedsImporter;