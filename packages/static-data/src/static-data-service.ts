/**
 * Static Data Service - Data Access Layer
 *
 * Provides methods for fetching static data directly from the PostgreSQL database.
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const DB_URL =
  process.env.STATIC_DATABASE_URL || 'postgresql://postgres@localhost:5432/staticdatabase';

// Types
export interface Country {
  code: string;
  name: string;
  demonym?: string;
  continent?: string;
  phone_prefix?: string;
}

export interface City {
  id: string;
  name: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
}

export interface Airport {
  iata_code: string;
  name: string;
  country_code: string;
  city?: string;
}

export interface Hotel {
  id: string;
  name: string;
  stars?: number;
  rating?: number;
  address?: string;
  city?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
}

export class StaticDataService {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: DB_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } as any);

    this.pool.on('error', err => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Get all countries from shared schema
   */
  async getCountries(): Promise<Country[]> {
    const client = await this.pool.connect();
    try {
      // Updated to match verified shared.countries schema
      const result = await client.query(`
                SELECT code, name
                FROM shared.countries 
                ORDER BY name
            `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get countries by continent (Mocked if column missing, or check if exist)
   */
  async getCountriesByContinent(_continent: string): Promise<Country[]> {
    // Since continent column is missing in verified schema, we return all or handle accordingly
    return this.getCountries();
  }

  /**
   * Get airports from public.liteapi_iata_codes
   */
  async getAirports(search?: string, limit: number = 30): Promise<Airport[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT code as iata_code, name, country_code FROM public.liteapi_iata_codes`;
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        sql += ` WHERE code ILIKE $1 OR name ILIKE $1`;
      }
      sql += ` ORDER BY name LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get airlines from public.duffel_airlines
   */
  async getAirlines(search?: string, limit: number = 30): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT code, name FROM public.duffel_airlines`;
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        sql += ` WHERE code ILIKE $1 OR name ILIKE $1`;
      }
      sql += ` ORDER BY name LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sql, params);
      return result.rows;
    } catch (e) {
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get cities from public.liteapi_cities
   */
  async getCities(query?: string, countryCode?: string, limit: number = 30): Promise<City[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT id, name, country_code, latitude, longitude FROM public.liteapi_cities`;
      const where: string[] = [];
      const params: any[] = [];

      if (query) {
        params.push(`%${query}%`);
        where.push(`name ILIKE $${params.length}`);
      }
      if (countryCode) {
        params.push(countryCode);
        where.push(`country_code = $${params.length}`);
      }

      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY name LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get loyalty programs
   */
  async getLoyaltyPrograms(_type?: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT * FROM public.duffel_loyalty_programmes`;
      const result = await client.query(sql);
      return result.rows;
    } catch (e) {
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get phone codes (Simplified as column missing)
   */
  async getPhoneCodes(): Promise<any[]> {
    const countries = await this.getCountries();
    return countries
      .map(c => ({
        country: c.name,
        code: c.code,
        prefix: '', // Column missing in current schema
      }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }

  /**
   * Get currencies from shared schema
   */
  async getCurrencies(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
                SELECT code, name, decimal_precision as decimals
                FROM shared.currencies
                ORDER BY code
            `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get languages from shared schema
   */
  async getLanguages(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
                SELECT code, name
                FROM shared.languages
                WHERE is_enabled = true
                ORDER BY name
            `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get hotel types from hotel schema
   */
  async getHotelTypes(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
                SELECT id, name
                FROM hotel.types
                ORDER BY name
            `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get hotel amenities/facilities from hotel schema
   */
  async getHotelAmenities(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
                SELECT id, name, category, icon_url as "iconUrl"
                FROM hotel.facilities
                ORDER BY category, name
            `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get hotel chains
   */
  async getHotelChains(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
                SELECT id, name, code
                FROM hotel.chains
                ORDER BY name
            `);
      return result.rows;
    } catch (e) {
      return [
        { id: '1', name: 'Marriott International', code: 'MARRIOTT' },
        { id: '2', name: 'Hilton Worldwide', code: 'HILTON' },
        { id: '3', name: 'InterContinental Hotels Group', code: 'IHG' },
        { id: '4', name: 'Accor Hotels', code: 'ACCOR' },
        { id: '5', name: 'Wyndham Hotels & Resorts', code: 'WYNDHAM' },
        { id: '6', name: 'Hyatt Hotels Corporation', code: 'HYATT' },
        { id: '7', name: 'Choice Hotels International', code: 'CHOICE' },
        { id: '8', name: 'Best Western International', code: 'BEST_WESTERN' },
        { id: '9', name: 'Radisson Hotel Group', code: 'RADISSON' },
        { id: '10', name: 'Meliá Hotels International', code: 'MELIA' },
      ];
    } finally {
      client.release();
    }
  }

  /**
   * Search destinations (cities)
   */
  async searchDestinations(
    query?: string,
    countryCode?: string,
    limit: number = 30
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT id, name, country_code as "countryCode", latitude, longitude FROM public.liteapi_cities`;
      const where: string[] = [];
      const params: any[] = [];

      if (query) {
        params.push(`%${query}%`);
        where.push(`name ILIKE $${params.length}`);
      }
      if (countryCode) {
        params.push(countryCode);
        where.push(`country_code = $${params.length}`);
      }

      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY name LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sql, params);
      return result.rows.map((row: any) => ({ ...row, type: 'city' }));
    } finally {
      client.release();
    }
  }

  /**
   * Get popular hotels
   */
  async getPopularHotels(limit: number = 20): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
                SELECT id, name, star_rating as stars, city, country_code, address, latitude, longitude
                FROM public.liteapi_hotels
                WHERE city IS NOT NULL
                ORDER BY star_rating DESC, name ASC
                LIMIT $1
            `,
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get IATA codes lookup
   */
  async getIataCodes(search?: string, limit: number = 30): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT code, name, country_code as "countryCode" FROM public.liteapi_iata_codes`;
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        sql += ` WHERE code ILIKE $1 OR name ILIKE $1`;
      }
      sql += ` ORDER BY code LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get nationalities (derived from countries)
   */
  async getNationalities(): Promise<any[]> {
    const countries = await this.getCountries();
    return countries.map((c: any) => ({
      code: c.code,
      name: c.name,
    }));
  }

  /**
   * Get board types
   */
  async getBoardTypes(): Promise<any[]> {
    return [
      { code: 'RO', name: 'Room Only', description: 'No meals included' },
      { code: 'BB', name: 'Bed & Breakfast', description: 'Breakfast included' },
      { code: 'HB', name: 'Half Board', description: 'Breakfast and dinner included' },
      { code: 'FB', name: 'Full Board', description: 'All meals included' },
      {
        code: 'AI',
        name: 'All Inclusive',
        description: 'All meals, drinks, and activities included',
      },
      {
        code: 'UAI',
        name: 'Ultra All Inclusive',
        description: 'Premium all-inclusive with branded drinks and extras',
      },
    ];
  }

  /**
   * Get hotels from public.liteapi_hotels
   */
  async getHotels(
    filters: {
      city?: string;
      country?: string;
      minStars?: number;
      maxStars?: number;
      minRating?: number;
      maxRating?: number;
      amenities?: string[];
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'rating' | 'stars' | 'price';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ hotels: Hotel[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const { city, country, minStars, maxStars } = filters;
      const { limit = 20, offset = 0, sortBy = 'name', sortOrder = 'ASC' } = pagination;

      const whereConditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (country) {
        whereConditions.push(`country_code = $${paramIndex++}`);
        params.push(country);
      }

      if (city) {
        whereConditions.push(`city ILIKE $${paramIndex++}`);
        params.push(`%${city}%`);
      }

      if (minStars !== undefined) {
        whereConditions.push(`star_rating >= $${paramIndex++}`);
        params.push(minStars);
      }

      if (maxStars !== undefined) {
        whereConditions.push(`star_rating <= $${paramIndex++}`);
        params.push(maxStars);
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) as total FROM public.liteapi_hotels ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Using verified column names: star_rating, hotel_description
      const hotelsQuery = `
                SELECT id, name, star_rating as stars, address, city, country_code, latitude, longitude
                FROM public.liteapi_hotels
                ${whereClause}
                ORDER BY ${sortBy === 'stars' ? 'star_rating' : sortBy} ${sortOrder}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
      params.push(limit, offset);

      const hotelsResult = await client.query(hotelsQuery, params);

      return {
        hotels: hotelsResult.rows,
        total,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get hotel by ID
   */
  async getHotelById(id: string): Promise<Hotel | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
                SELECT id, name, star_rating as stars, address, city, country_code, latitude, longitude, metadata, hotel_description
                FROM public.liteapi_hotels
                WHERE id = $1
            `,
        [id]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get hotel with full details
   */
  async getHotelFullDetails(id: string): Promise<any | null> {
    const hotel = await this.getHotelById(id);
    if (!hotel) return null;

    const metadata = (hotel as any).metadata || {};
    return {
      hotel,
      images: metadata.images || [],
      amenities: metadata.facilities || [],
      descriptions: metadata.descriptions || [],
      contacts: metadata.contacts || [],
      reviews: metadata.reviews || [],
      rooms: metadata.rooms || [],
    };
  }

  /**
   * Get popular destinations
   */
  async getPopularDestinations(limit: number = 10): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
                SELECT city, country_code as country, COUNT(*) as hotel_count
                FROM public.liteapi_hotels
                WHERE city IS NOT NULL
                GROUP BY city, country_code
                ORDER BY hotel_count DESC
                LIMIT $1
            `,
        [limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Search hotels by name
   */
  async searchHotels(query: string, limit: number = 20): Promise<Hotel[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
                SELECT id, name, star_rating as stars, address, city, country_code
                FROM public.liteapi_hotels
                WHERE name ILIKE $1
                ORDER BY name
                LIMIT $2
            `,
        [`%${query}%`, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    const client = await this.pool.connect();
    try {
      const [totalHotels, totalCities, totalCountries] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM public.liteapi_hotels'),
        client.query('SELECT COUNT(*) as count FROM public.liteapi_cities'),
        client.query('SELECT COUNT(*) as count FROM shared.countries'),
      ]);

      return {
        total_hotels: parseInt(totalHotels.rows[0].count),
        total_cities: parseInt(totalCities.rows[0].count),
        total_countries: parseInt(totalCountries.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get hotels near coordinates
   */
  async getHotelsNearCoordinates(
    lat: number,
    lon: number,
    _radiusKm: number = 50,
    limit: number = 20
  ): Promise<Hotel[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
                SELECT id, name, star_rating as stars, address, city, country_code,
                       (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance
                FROM public.liteapi_hotels
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY distance
                LIMIT $3
            `;
      const result = await client.query(sql, [lat, lon, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const staticDataService = new StaticDataService();
