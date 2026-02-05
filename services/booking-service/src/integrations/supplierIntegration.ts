import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger.js';
import { cacheService } from '../cache/redis.js';
import { CacheService } from '../cache/redis.js';
import { metricsStore } from '../monitoring/metrics.js';

export interface SupplierConfig {
  id: string;
  name: string;
  type: 'amadeus' | 'duffel' | 'liteapi' | 'custom';
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  credentials?: {
    clientId: string;
    clientSecret: string;
  };
  timeout: number;
  retryAttempts: number;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface FlightSearchResponse {
  flights: FlightOffer[];
  searchId: string;
  timestamp: Date;
}

export interface FlightOffer {
  id: string;
  price: {
    total: number;
    currency: string;
    breakdown: {
      base: number;
      taxes: number;
      fees: number;
    };
  };
  segments: FlightSegment[];
  baggage: BaggageInfo[];
  provider: string;
  bookingClass: string;
}

export interface FlightSegment {
  id: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  carrier: string;
  flightNumber: string;
  duration: string;
  cabin: string;
}

export interface BaggageInfo {
  type: 'carry_on' | 'checked';
  allowance: string;
  charge: number;
}

export interface HotelSearchRequest {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: {
    adults: number;
    children: number;
    infants: number;
  }[];
  filters?: {
    priceRange: { min: number; max: number };
    amenities: string[];
    rating: number;
    hotelChain: string[];
  };
}

export interface HotelSearchResponse {
  hotels: HotelOffer[];
  searchId: string;
  timestamp: Date;
}

export interface HotelOffer {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  price: {
    total: number;
    currency: string;
    perNight: number;
    taxes: number;
  };
  rooms: RoomOffer[];
  amenities: string[];
  rating: number;
  provider: string;
}

export interface RoomOffer {
  id: string;
  name: string;
  occupancy: {
    maxAdults: number;
    maxChildren: number;
  };
  amenities: string[];
  price: {
    base: number;
    total: number;
  };
}

export class SupplierIntegration {
  private suppliers: Map<string, SupplierConfig> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  addSupplier(config: SupplierConfig): void {
    this.suppliers.set(config.id, config);
    this.createClient(config);
    logger.info(`Supplier added: ${config.name} (${config.type})`);
  }

  private createClient(config: SupplierConfig): void {
    const client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    client.interceptors.request.use(
      (request) => {
        this.addAuthHeaders(request, config);
        return request;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    client.interceptors.response.use(
      (response) => {
        (metricsStore as any).increment('supplier_api_success', { supplier: config.id });
        return response;
      },
      async (error) => {
        (metricsStore as any).increment('supplier_api_error', { supplier: config.id });
        return this.handleSupplierError(error, config);
      }
    );

    this.clients.set(config.id, client);
  }

  private addAuthHeaders(request: any, config: SupplierConfig): void {
    switch (config.type) {
      case 'amadeus':
        request.headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'duffel':
        request.headers['Authorization'] = `Bearer ${config.apiKey}`;
        request.headers['Duffel-Version'] = 'v1';
        break;
      case 'liteapi':
        request.headers['X-API-Key'] = config.apiKey;
        request.headers['X-API-Secret'] = config.apiSecret;
        break;
      case 'custom':
        if (config.credentials) {
          request.headers['X-Client-Id'] = config.credentials.clientId;
          request.headers['X-Client-Secret'] = config.credentials.clientSecret;
        }
        break;
    }
  }

  private async handleSupplierError(error: any, config: SupplierConfig): Promise<any> {
    const retryAttempts = config.retryAttempts;
    const delay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000);

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay(attempt)));
        return await this.clients.get(config.id)!.request(error.config);
      } catch (retryError: any) {
        if (attempt === retryAttempts - 1) {
          logger.error(`Supplier ${config.name} failed after ${retryAttempts} attempts`, {
            error: retryError.message,
            supplierId: config.id,
          });
          throw retryError;
        }
      }
    }
  }

  async searchFlights(
    supplierId: string,
    request: FlightSearchRequest
  ): Promise<FlightSearchResponse> {
    const config = this.suppliers.get(supplierId);
    if (!config) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const cacheKey = this.getCacheKey('flights', supplierId, request);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      (metricsStore as any).increment('supplier_cache_hit', { supplier: supplierId });
      return JSON.parse(String(cached));
    }

    const client = this.clients.get(supplierId);
    if (!client) {
      throw new Error(`Client for supplier ${supplierId} not initialized`);
    }

    try {
      const response = await client.post('/flights/search', request);
      const result = this.transformFlightResponse(response.data, supplierId);
      
      // Cache for 10 minutes
      await this.cache.set(cacheKey, JSON.stringify(result), 600);
      
      return result;
    } catch (error) {
      logger.error(`Flight search failed for supplier ${supplierId}`, {
        error: (error as Error).message,
        supplierId,
        request,
      });
      throw error;
    }
  }

  async searchHotels(
    supplierId: string,
    request: HotelSearchRequest
  ): Promise<HotelSearchResponse> {
    const config = this.suppliers.get(supplierId);
    if (!config) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const cacheKey = this.getCacheKey('hotels', supplierId, request);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      (metricsStore as any).increment('supplier_cache_hit', { supplier: supplierId });
      return JSON.parse(String(cached));
    }

    const client = this.clients.get(supplierId);
    if (!client) {
      throw new Error(`Client for supplier ${supplierId} not initialized`);
    }

    try {
      const response = await client.post('/hotels/search', request);
      const result = this.transformHotelResponse(response.data, supplierId);
      
      // Cache for 15 minutes
      await this.cache.set(cacheKey, JSON.stringify(result), 900);
      
      return result;
    } catch (error) {
      logger.error(`Hotel search failed for supplier ${supplierId}`, {
        error: (error as Error).message,
        supplierId,
        request,
      });
      throw error;
    }
  }

  async bookFlight(
    supplierId: string,
    bookingData: any
  ): Promise<any> {
    const config = this.suppliers.get(supplierId);
    if (!config) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const client = this.clients.get(supplierId);
    if (!client) {
      throw new Error(`Client for supplier ${supplierId} not initialized`);
    }

    try {
      const response = await client.post('/flights/book', bookingData);
      return this.transformBookingResponse(response.data, supplierId);
    } catch (error) {
      logger.error(`Flight booking failed for supplier ${supplierId}`, {
        error: (error as Error).message,
        supplierId,
        bookingData,
      });
      throw error;
    }
  }

  async bookHotel(
    supplierId: string,
    bookingData: any
  ): Promise<any> {
    const config = this.suppliers.get(supplierId);
    if (!config) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const client = this.clients.get(supplierId);
    if (!client) {
      throw new Error(`Client for supplier ${supplierId} not initialized`);
    }

    try {
      const response = await client.post('/hotels/book', bookingData);
      return this.transformBookingResponse(response.data, supplierId);
    } catch (error) {
      logger.error(`Hotel booking failed for supplier ${supplierId}`, {
        error: (error as Error).message,
        supplierId,
        bookingData,
      });
      throw error;
    }
  }

  private transformFlightResponse(data: any, supplierId: string): FlightSearchResponse {
    // Transform supplier-specific response to our standard format
    switch (supplierId) {
      case 'amadeus':
        return this.transformAmadeusFlightResponse(data);
      case 'duffel':
        return this.transformDuffelFlightResponse(data);
      case 'liteapi':
        return this.transformLiteApiFlightResponse(data);
      default:
        return this.transformGenericFlightResponse(data);
    }
  }

  private transformHotelResponse(data: any, supplierId: string): HotelSearchResponse {
    // Transform supplier-specific response to our standard format
    switch (supplierId) {
      case 'amadeus':
        return this.transformAmadeusHotelResponse(data);
      case 'liteapi':
        return this.transformLiteApiHotelResponse(data);
      default:
        return this.transformGenericHotelResponse(data);
    }
  }

  private transformBookingResponse(data: any, supplierId: string): any {
    // Transform supplier-specific booking response to our standard format
    return {
      bookingId: data.bookingId || data.id,
      confirmationNumber: data.confirmationNumber || data.pnr,
      status: data.status,
      supplierReference: data.supplierReference,
      provider: supplierId,
      timestamp: new Date(),
    };
  }

  private transformAmadeusFlightResponse(data: any): FlightSearchResponse {
    // Transform Amadeus API response
    return {
      flights: data.data.map((offer: any) => ({
        id: offer.id,
        price: {
          total: parseFloat(offer.price.total),
          currency: offer.price.currency,
          breakdown: {
            base: parseFloat(offer.price.base),
            taxes: parseFloat(offer.price.taxes),
            fees: parseFloat(offer.price.fees || 0),
          },
        },
        segments: offer.itineraries[0].segments.map((segment: any) => ({
          id: segment.id,
          origin: segment.origin.iataCode,
          destination: segment.destination.iataCode,
          departure: segment.departure.at,
          arrival: segment.arrival.at,
          carrier: segment.carrierCode,
          flightNumber: segment.number,
          duration: segment.duration,
          cabin: segment.cabin,
        })),
        baggage: offer.travelerPricings[0].baggageAllowances.map((baggage: any) => ({
          type: 'checked',
          allowance: baggage.quantity ? `${baggage.quantity} pieces` : baggage.maxWeight,
          charge: 0,
        })),
        provider: 'amadeus',
        bookingClass: offer.travelerPricings[0].cabin,
      })),
      searchId: data.meta?.queryId || Date.now().toString(),
      timestamp: new Date(),
    };
  }

  private transformDuffelFlightResponse(data: any): FlightSearchResponse {
    // Transform Duffel API response
    return {
      flights: data.data.map((offer: any) => ({
        id: offer.id,
        price: {
          total: parseFloat(offer.total_amount),
          currency: offer.total_currency,
          breakdown: {
            base: parseFloat(offer.base_amount),
            taxes: parseFloat(offer.tax_amount),
            fees: parseFloat(offer.total_fee_amount),
          },
        },
        segments: offer.slices[0].segments.map((segment: any) => ({
          id: segment.id,
          origin: segment.origin.iata_code,
          destination: segment.destination.iata_code,
          departure: segment.departing_at,
          arrival: segment.arriving_at,
          carrier: segment.operating_carrier.iata_code,
          flightNumber: segment.flight_number,
          duration: segment.duration,
          cabin: segment.cabin_class_marketing_name,
        })),
        baggage: offer.slices[0].segments.flatMap((segment: any) =>
          segment.passengers.map((pax: any) => ({
            type: 'checked',
            allowance: pax.baggage.allowance ? `${pax.baggage.allowance.quantity} pieces` : 'Not included',
            charge: pax.baggage.allowance ? 0 : parseFloat(pax.baggage.free_bags[0]?.weight?.value || 0),
          }))
        ),
        provider: 'duffel',
        bookingClass: offer.slices[0].cabin_class,
      })),
      searchId: data.meta?.query_id || Date.now().toString(),
      timestamp: new Date(),
    };
  }

  private transformLiteApiFlightResponse(data: any): FlightSearchResponse {
    // Transform LiteAPI response
    return {
      flights: data.offers.map((offer: any) => ({
        id: offer.id,
        price: {
          total: parseFloat(offer.price.total),
          currency: offer.price.currency,
          breakdown: {
            base: parseFloat(offer.price.base),
            taxes: parseFloat(offer.price.taxes),
            fees: parseFloat(offer.price.fees),
          },
        },
        segments: offer.segments.map((segment: any) => ({
          id: segment.id,
          origin: segment.origin,
          destination: segment.destination,
          departure: segment.departure,
          arrival: segment.arrival,
          carrier: segment.carrier,
          flightNumber: segment.flightNumber,
          duration: segment.duration,
          cabin: segment.cabin,
        })),
        baggage: offer.baggage.map((baggage: any) => ({
          type: baggage.type,
          allowance: baggage.allowance,
          charge: parseFloat(baggage.charge),
        })),
        provider: 'liteapi',
        bookingClass: offer.bookingClass,
      })),
      searchId: data.searchId,
      timestamp: new Date(),
    };
  }

  private transformAmadeusHotelResponse(data: any): HotelSearchResponse {
    // Transform Amadeus hotel response
    return {
      hotels: data.data.map((hotel: any) => ({
        id: hotel.hotel.id,
        name: hotel.hotel.name,
        address: {
          street: hotel.hotel.address.line1,
          city: hotel.hotel.address.cityName,
          country: hotel.hotel.address.countryCode,
        },
        price: {
          total: parseFloat(hotel.offers[0].price.total),
          currency: hotel.offers[0].price.currency,
          perNight: parseFloat(hotel.offers[0].price.base),
          taxes: parseFloat(hotel.offers[0].price.taxes),
        },
        rooms: hotel.offers[0].room?.typeEstimated ? [{
          id: hotel.offers[0].room.id,
          name: hotel.offers[0].room.typeEstimated.bed,
          occupancy: {
            maxAdults: hotel.offers[0].room.typeEstimated.bedType === 'double' ? 2 : 1,
            maxChildren: 0,
          },
          amenities: hotel.offers[0].room.typeEstimated.facilities || [],
          price: {
            base: parseFloat(hotel.offers[0].price.base),
            total: parseFloat(hotel.offers[0].price.total),
          },
        }] : [],
        amenities: hotel.hotel.amenities || [],
        rating: hotel.hotel.rating,
        provider: 'amadeus',
      })),
      searchId: data.meta?.queryId || Date.now().toString(),
      timestamp: new Date(),
    };
  }

  private transformLiteApiHotelResponse(data: any): HotelSearchResponse {
    // Transform LiteAPI hotel response
    return {
      hotels: data.hotels.map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        address: {
          street: hotel.address.street,
          city: hotel.address.city,
          country: hotel.address.country,
        },
        price: {
          total: parseFloat(hotel.price.total),
          currency: hotel.price.currency,
          perNight: parseFloat(hotel.price.perNight),
          taxes: parseFloat(hotel.price.taxes),
        },
        rooms: hotel.rooms.map((room: any) => ({
          id: room.id,
          name: room.name,
          occupancy: {
            maxAdults: room.occupancy.adults,
            maxChildren: room.occupancy.children,
          },
          amenities: room.amenities || [],
          price: {
            base: parseFloat(room.price.base),
            total: parseFloat(room.price.total),
          },
        })),
        amenities: hotel.amenities || [],
        rating: hotel.rating,
        provider: 'liteapi',
      })),
      searchId: data.searchId,
      timestamp: new Date(),
    };
  }

  private transformGenericFlightResponse(data: any): FlightSearchResponse {
    // Generic transformation for unknown suppliers
    return {
      flights: data.offers || [],
      searchId: data.searchId || Date.now().toString(),
      timestamp: new Date(),
    };
  }

  private transformGenericHotelResponse(data: any): HotelSearchResponse {
    // Generic transformation for unknown suppliers
    return {
      hotels: data.hotels || [],
      searchId: data.searchId || Date.now().toString(),
      timestamp: new Date(),
    };
  }

  private getCacheKey(type: string, supplierId: string, request: any): string {
    const requestHash = JSON.stringify(request);
    return `supplier:${type}:${supplierId}:${Buffer.from(requestHash).toString('base64')}`;
  }

  getSupplierConfig(supplierId: string): SupplierConfig | undefined {
    return this.suppliers.get(supplierId);
  }

  listSuppliers(): SupplierConfig[] {
    return Array.from(this.suppliers.values());
  }

  removeSupplier(supplierId: string): void {
    this.suppliers.delete(supplierId);
    this.clients.delete(supplierId);
    logger.info(`Supplier removed: ${supplierId}`);
  }
}

export default new SupplierIntegration(cacheService);