/**
 * Innstant Travel Static Data Importer
 * 
 * This service handles importing hotel static data from Innstant Travel API
 * into the canonical database structure. It supports:
 * - Full imports (750k+ hotels)
 * - Incremental/delta imports
 * - Rate limit handling
 * - Automatic mapping to canonical hotels
 * - Image size variant mapping
 * 
 * API Documentation: https://docs.innstant-servers.com/#Flow
 * Static Data API: https://static-data.innstant-servers.com/
 * 
 * Usage:
 *   npm run import-static -- innstant-hotels --limit=100
 *   npm run import-static -- innstant-hotels --incremental --from=2024-01-01
 */

import { Supplier, SupplierSyncLog, CanonicalHotel, Prisma } from '@prisma/client';
import { prisma } from '@tripalfa/shared-database';
import { getRoomCategories, getBoardTypes, getPolicyTerms, mapHotelAmenity, mapRoomAmenity } from './reference-data-service';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

interface InnstantConfig {
  apiKey: string;
  accessToken?: string;
  baseUrl: string;
  searchUrl?: string;
}

interface InnstantHotel {
  hotel_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  country_code?: string;
  state?: string;
  state_code?: string;
  destination?: string;
  destination_code?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  star_rating?: number;
  property_type?: string;
  chain_code?: string;
  chain_name?: string;
  brand_code?: string;
  brand_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  check_in_time?: string;
  check_out_time?: string;
  amenities?: string[];
  facilities?: Array<{
    code: string;
    name: string;
    category?: string;
  }>;
  images?: Array<{
    url: string;
    type?: string;
    caption?: string;
    width?: number;
    height?: number;
    size?: string; // thumbnail, small, medium, large, original
    room_code?: string;
    is_primary?: boolean;
  }>;
  room_types?: Array<{
    code: string;
    name: string;
    description?: string;
    bed_type?: string;
    bed_count?: number;
    max_occupancy?: number;
    max_adults?: number;
    max_children?: number;
    room_size?: number;
    amenities?: string[];
    images?: Array<{
      url: string;
      type?: string;
      width?: number;
      height?: number;
      size?: string;
    }>;
  }>;
  last_updated?: string;
  giata_id?: string;
}

interface InnstantResponse {
  status: string;
  data?: {
    hotels: InnstantHotel[];
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
  error?: string;
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
// INNSTANT IMPORTER CLASS
// ============================================

export class InnstantImporter {
  private supplier: Supplier | null = null;
  private credentials: InnstantConfig[] = [];
  private currentCredentialIndex = 0;
  private apiClient: AxiosInstance | null = null;
  private syncLog: SupplierSyncLog | null = null;
  
  // Rate limiting
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitDelay = 1000; // ms between requests (60/min = 1000ms)

  constructor() {
    this.loadCredentials();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private loadCredentials(): void {
    const credentials: InnstantConfig[] = [];
    
    // Primary credentials from environment
    if (process.env.INNSTANT_API_KEY) {
      credentials.push({
        apiKey: process.env.INNSTANT_API_KEY,
        accessToken: process.env.INNSTANT_ACCESS_TOKEN,
        baseUrl: process.env.INNSTANT_STATIC_URL || 'https://static-data.innstant-servers.com',
        searchUrl: process.env.INNSTANT_SEARCH_URL || 'https://connect.mishor5.innstant-servers.com',
      });
    }
    
    // Fallback to known API keys (Search API key + Booking API token)
    if (credentials.length === 0) {
      credentials.push({
        apiKey: '$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS', // Search API key
        accessToken: '$2y$10$wlIPpzB4fJvnaLVokrbAo.jjD4KhZlZVeCc/xf7hcilENIzFDXUhO', // Booking API token
        baseUrl: 'https://static-data.innstant-servers.com',
        searchUrl: 'https://connect.mishor5.innstant-servers.com',
      });
    }
    
    // Secondary credentials (for rate limit rotation)
    if (process.env.INNSTANT_API_KEY_2) {
      credentials.push({
        apiKey: process.env.INNSTANT_API_KEY_2,
        accessToken: process.env.INNSTANT_ACCESS_TOKEN_2,
        baseUrl: process.env.INNSTANT_STATIC_URL || 'https://static-data.innstant-servers.com',
        searchUrl: process.env.INNSTANT_SEARCH_URL || 'https://connect.mishor5.innstant-servers.com',
      });
    }
    
    this.credentials = credentials;
    console.log(`Loaded ${credentials.length} Innstant credential(s)`);
  }

  private async initialize(): Promise<void> {
    // Get or create supplier record
    this.supplier = await prisma.supplier.upsert({
      where: { code: 'innstant' },
      update: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'running',
      },
      create: {
        code: 'innstant',
        name: 'Innstant Travel',
        type: 'hotel',
        status: 'active',
        apiBaseUrl: this.credentials[0]?.baseUrl,
        apiKey: this.credentials[0]?.apiKey,
        syncEnabled: true,
        syncInterval: 86400, // 24 hours
        rateLimitPerMin: 60,
        rateLimitPerDay: 10000,
        features: {
          hotels: true,
          availability: true,
          realtime: true,
          multiCurrency: true,
          multiLanguage: true,
          staticData: true,
        },
        metadata: {
          description: 'Global hotel distribution platform with extensive static data coverage (750k+ hotels)',
          website: 'https://www.innstant.com',
          searchApi: 'https://connect.mishor5.innstant-servers.com',
          bookingApi: 'https://book.mishor5.innstant-servers.com',
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
      throw new Error('No valid Innstant credentials available');
    }
    
    // Use search URL for hotel data (static-data API seems to be deprecated)
    const baseUrl = cred.searchUrl || cred.baseUrl;
    
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Aether-application-key': cred.apiKey,
        'Aether-access-token': cred.accessToken || '',
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

  private async fetchHotels(
    page: number = 1,
    limit: number = 100,
    from?: string,
    to?: string
  ): Promise<InnstantResponse | null> {
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
      const requestBody: Record<string, unknown> = {
        request: 'getHotels',
        page,
        per_page: limit,
      };
      
      if (from) {
        requestBody.from = from;
      }
      if (to) {
        requestBody.to = to;
      }
      
      const response = await this.apiClient.post<InnstantResponse>('/', requestBody);
      
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
        return this.fetchHotels(page, limit, from, to);
      }
      
      console.error('Error fetching hotels:', error);
      throw error;
    }
  }

  private async fetchAllHotels(): Promise<InnstantHotel[]> {
    // Try to fetch all hotels in one request (Innstant may support bulk download)
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }
    
    try {
      const response = await this.apiClient.post<InnstantResponse>('/', {
        request: 'download',
        type: 'hotels',
        format: 'json',
      });
      
      if (response.data?.data?.hotels) {
        return response.data.data.hotels;
      }
    } catch (error) {
      console.log('Bulk download not available, falling back to pagination');
    }
    
    // Fall back to paginated fetch
    return this.fetchHotelsPaginated();
  }

  private async fetchHotelsPaginated(): Promise<InnstantHotel[]> {
    const allHotels: InnstantHotel[] = [];
    let page = 1;
    const perPage = 500; // Larger page size for efficiency
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      
      const response = await this.fetchHotels(page, perPage);
      
      if (!response?.data?.hotels?.length) {
        hasMore = false;
        break;
      }
      
      allHotels.push(...response.data.hotels);
      
      console.log(`Fetched ${response.data.hotels.length} hotels (total: ${allHotels.length})`);
      
      // Check if there are more pages
      if (response.data.total_pages) {
        hasMore = page < response.data.total_pages;
      } else {
        hasMore = response.data.hotels.length === perPage;
      }
      
      page++;
      
      // Small delay between pages
      await this.delay(500);
    }
    
    return allHotels;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // DATA TRANSFORMATION
  // ============================================

  private extractHotelData(hotel: InnstantHotel): Partial<CanonicalHotel> {
    return {
      name: hotel.name || '',
      nameNormalized: hotel.name?.toLowerCase().trim(),
      description: hotel.description,
      address: hotel.address,
      addressNormalized: hotel.address?.toLowerCase().trim(),
      city: hotel.city || '',
      cityCode: hotel.destination_code,
      state: hotel.state,
      stateCode: hotel.state_code,
      country: hotel.country || '',
      countryCode: hotel.country_code,
      postalCode: hotel.postal_code,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.star_rating,
      hotelType: hotel.property_type,
      chainCode: hotel.chain_code,
      chainName: hotel.chain_name,
      brandCode: hotel.brand_code,
      brandName: hotel.brand_name,
      phone: hotel.phone,
      email: hotel.email,
      website: hotel.website,
      checkInTime: hotel.check_in_time || '14:00',
      checkOutTime: hotel.check_out_time || '12:00',
      giataId: hotel.giata_id,
    };
  }

  private extractHotelImages(hotel: InnstantHotel): Array<{
    url: string;
    urlHash: string;
    imageType: string;
    sizeVariant: string;
    width?: number;
    height?: number;
    variants?: Record<string, string>;
    isPrimary: boolean;
    displayOrder: number;
  }> {
    if (!hotel.images || hotel.images.length === 0) {
      return [];
    }
    
    // Group images by URL base (without size variant) to create variants
    const imageGroups = new Map<string, typeof hotel.images>();
    
    for (const img of hotel.images) {
      // Extract base URL without size suffix
      const baseUrl = this.getBaseUrlWithoutSize(img.url);
      const existing = imageGroups.get(baseUrl) || [];
      existing.push(img);
      imageGroups.set(baseUrl, existing);
    }
    
    const result: Array<{
      url: string;
      urlHash: string;
      imageType: string;
      sizeVariant: string;
      width?: number;
      height?: number;
      variants?: Record<string, string>;
      isPrimary: boolean;
      displayOrder: number;
    }> = [];
    
    let order = 0;
    for (const [, images] of Array.from(imageGroups)) {
      // Use the largest/original image as the main URL
      const mainImage = images.find(i => i.size === 'original' || i.size === 'large') || images[0];
      
      // Build variants object
      const variants: Record<string, string> = {};
      for (const img of images) {
        if (img.size) {
          variants[img.size] = img.url;
        }
      }
      
      result.push({
        url: mainImage.url,
        urlHash: crypto.createHash('md5').update(mainImage.url).digest('hex'),
        imageType: mainImage.type || 'general',
        sizeVariant: mainImage.size || 'original',
        width: mainImage.width,
        height: mainImage.height,
        variants: Object.keys(variants).length > 1 ? variants : undefined,
        isPrimary: mainImage.is_primary || order === 0,
        displayOrder: order++,
      });
    }
    
    return result;
  }

  private extractRoomImages(room: InnstantHotel['room_types'] extends (infer T)[] | undefined ? T : never): Array<{
    url: string;
    urlHash: string;
    imageType: string;
    sizeVariant: string;
    width?: number;
    height?: number;
    variants?: Record<string, string>;
    isPrimary: boolean;
    displayOrder: number;
  }> {
    if (!room?.images || room.images.length === 0) {
      return [];
    }
    
    return room.images.map((img, index) => ({
      url: img.url,
      urlHash: crypto.createHash('md5').update(img.url).digest('hex'),
      imageType: img.type || 'bedroom',
      sizeVariant: img.size || 'original',
      width: img.width,
      height: img.height,
      isPrimary: index === 0,
      displayOrder: index,
    }));
  }

  private getBaseUrlWithoutSize(url: string): string {
    // Remove size suffixes like _thumb, _small, _medium, _large
    return url.replace(/_(thumb|small|medium|large|original)(\.[^.]+)$/, '$2');
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  private async upsertCanonicalHotel(
    hotel: InnstantHotel,
    options: ImportOptions
  ): Promise<{ hotel: CanonicalHotel; created: boolean } | null> {
    if (!this.supplier) {
      throw new Error('Supplier not initialized');
    }
    
    const hotelId = hotel.hotel_id;
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
        const { metadata, ...restHotelData } = hotelData;
        const updated = await prisma.canonicalHotel.update({
          where: { id: existingMapping.canonicalHotelId },
          data: {
            ...restHotelData,
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
    
    // Try to find matching hotel by GIATA ID first
    if (hotel.giata_id) {
      const giataMatch = await prisma.canonicalHotel.findUnique({
        where: { giataId: hotel.giata_id },
      });
      
      if (giataMatch) {
        // Create mapping to existing hotel
        if (!options.dryRun) {
          await prisma.supplierHotelMapping.create({
            data: {
              canonicalHotelId: giataMatch.id,
              supplierId: this.supplier.id,
              supplierHotelId: hotelId,
              matchType: 'giata',
              matchConfidence: 1.0,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              supplierData: hotel as unknown as Prisma.InputJsonValue,
            },
          });
        }
        return { hotel: giataMatch, created: false };
      }
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
      const canonicalCode = `INN-${hotelId}-${Date.now()}`;
      
      const newHotel = await prisma.canonicalHotel.create({
        data: {
          canonicalCode,
          name: hotel.name || 'Unknown Hotel',
          nameNormalized: hotel.name?.toLowerCase().trim(),
          description: hotel.description,
          address: hotel.address,
          addressNormalized: hotel.address?.toLowerCase().trim(),
          city: hotel.city || '',
          cityCode: hotel.destination_code,
          state: hotel.state,
          stateCode: hotel.state_code,
          country: hotel.country || '',
          countryCode: hotel.country_code || '',
          postalCode: hotel.postal_code,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          starRating: hotel.star_rating,
          hotelType: hotel.property_type,
          chainCode: hotel.chain_code,
          chainName: hotel.chain_name,
          brandCode: hotel.brand_code,
          brandName: hotel.brand_name,
          phone: hotel.phone,
          email: hotel.email,
          website: hotel.website,
          checkInTime: hotel.check_in_time || '14:00',
          checkOutTime: hotel.check_out_time || '12:00',
          giataId: hotel.giata_id,
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

  private async findMatchingHotel(hotel: InnstantHotel): Promise<CanonicalHotel | null> {
    if (!hotel.name || !hotel.country_code) {
      return null;
    }
    
    // Try to find by name similarity and country
    const matches = await prisma.canonicalHotel.findMany({
      where: {
        countryCode: hotel.country_code,
        nameNormalized: {
          contains: hotel.name.toLowerCase().trim(),
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
      sizeVariant: string;
      width?: number;
      height?: number;
      variants?: Record<string, string>;
      isPrimary: boolean;
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
            sizeVariant: img.sizeVariant,
            width: img.width,
            height: img.height,
            variants: img.variants,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
            status: 'active',
          },
        });
        created++;
      }
    }
    
    return created;
  }

  private async upsertRoomTypes(
    canonicalHotelId: string,
    roomTypes: InnstantHotel['room_types'],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || !roomTypes || roomTypes.length === 0) {
      return 0;
    }
    
    let created = 0;
    
    for (const room of roomTypes) {
      try {
        // Check if room type already exists
        const existing = await prisma.hotelRoomType.findFirst({
          where: {
            canonicalHotelId,
            roomTypeCode: room.code,
          },
        });
        
        if (!existing) {
          const newRoom = await prisma.hotelRoomType.create({
            data: {
              canonicalHotelId,
              roomTypeCode: room.code,
              roomTypeName: room.name,
              bedType: room.bed_type,
              bedCount: room.bed_count || 1,
              maxOccupancy: room.max_occupancy || 2,
              maxAdults: room.max_adults || 2,
              maxChildren: room.max_children || 0,
              roomSize: room.room_size,
              supplierId: this.supplier?.id,
              supplierRoomCode: room.code,
              supplierRoomName: room.name,
              isActive: true,
            },
          });
          
          // Process room images
          if (room.images && room.images.length > 0) {
            const roomImages = this.extractRoomImages(room);
            for (const img of roomImages) {
              await prisma.roomImage.create({
                data: {
                  roomTypeId: newRoom.id,
                  supplierId: this.supplier?.id,
                  url: img.url,
                  urlHash: img.urlHash,
                  imageType: img.imageType,
                  sizeVariant: img.sizeVariant,
                  width: img.width,
                  height: img.height,
                  isPrimary: img.isPrimary,
                  displayOrder: img.displayOrder,
                  status: 'active',
                },
              });
            }
          }
          
          // Process room amenities
          if (room.amenities && room.amenities.length > 0) {
            for (const amenityCode of room.amenities) {
              // Find matching room amenity
              const amenityMapping = await prisma.roomAmenitySupplierMapping.findUnique({
                where: {
                  supplierId_supplierCode: {
                    supplierId: this.supplier!.id,
                    supplierCode: amenityCode,
                  },
                },
                include: { amenity: true },
              });
              
              if (amenityMapping) {
                await prisma.roomAmenityMapping.create({
                  data: {
                    roomTypeId: newRoom.id,
                    amenityId: amenityMapping.amenityId,
                    supplierId: this.supplier?.id,
                    supplierAmenityCode: amenityCode,
                  },
                });
              }
            }
          }
          
          created++;
        }
      } catch (error) {
        console.error(`Error creating room type ${room.code}:`, error);
      }
    }
    
    return created;
  }

  private async upsertHotelAmenities(
    canonicalHotelId: string,
    facilities: InnstantHotel['facilities'],
    options: ImportOptions
  ): Promise<number> {
    if (options.dryRun || !facilities || facilities.length === 0 || !this.supplier) {
      return 0;
    }
    
    let created = 0;
    
    for (const facility of facilities) {
      try {
        // Find amenity mapping for this facility code
        const mapping = await prisma.hotelAmenitySupplierMapping.findUnique({
          where: {
            supplierId_supplierCode: {
              supplierId: this.supplier.id,
              supplierCode: facility.code,
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
                supplierAmenityCode: facility.code,
              },
            });
            created++;
          }
        }
      } catch (error) {
        console.error(`Error creating amenity mapping for ${facility.code}:`, error);
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
      
      const limit = options.limit || 1000000; // Default to 1M for full import
      
      console.log(`Starting Innstant import with limit: ${limit}`);
      console.log('Fetching hotels from Innstant API...');
      
      // Fetch all hotels (either bulk or paginated)
      let hotels: InnstantHotel[];
      
      if (options.incremental && options.from) {
        // Incremental fetch
        hotels = await this.fetchHotelsPaginated();
      } else {
        // Try bulk fetch first, fall back to paginated
        hotels = await this.fetchAllHotels();
      }
      
      console.log(`Fetched ${hotels.length} hotels from Innstant`);
      
      // Apply limit
      if (hotels.length > limit) {
        hotels = hotels.slice(0, limit);
      }
      
      // Process hotels
      const batchSize = options.batchSize || 100;
      
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} hotels)...`);
        
        for (const hotel of batch) {
          try {
            const upsertResult = await this.upsertCanonicalHotel(hotel, options);
            
            if (upsertResult) {
              if (upsertResult.created) {
                result.created++;
              } else {
                result.updated++;
              }
              
              // Process hotel images
              const images = this.extractHotelImages(hotel);
              await this.upsertHotelImages(upsertResult.hotel.id, images, options);
              
              // Process room types
              if (hotel.room_types) {
                await this.upsertRoomTypes(upsertResult.hotel.id, hotel.room_types, options);
              }
              
              // Process amenities
              if (hotel.facilities) {
                await this.upsertHotelAmenities(upsertResult.hotel.id, hotel.facilities, options);
              }
            }
            
            result.total++;
            
            // Update sync log progress
            if (this.syncLog && result.total % 1000 === 0) {
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
              code: hotel.hotel_id,
              error: errorMessage,
            });
            console.error(`Error processing hotel ${hotel.hotel_id}:`, errorMessage);
          }
        }
        
        // Small delay between batches
        await this.delay(100);
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
            errors: result.errors.length > 0 ? result.errors.slice(0, 100) : undefined,
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
  
  const importer = new InnstantImporter();
  
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

export default InnstantImporter;