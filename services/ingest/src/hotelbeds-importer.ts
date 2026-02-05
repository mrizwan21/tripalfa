import { Pool } from 'pg';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { HotelData, findOrCreateCanonicalHotel } from './mapping-utils';

interface HotelbedsCredentials {
    apiKey: string;
    secret: string;
}

export class HotelbedsImporter {
    private pool: Pool;
    private credentials: HotelbedsCredentials[];
    private currentCredentialIndex: number = 0;
    private baseUrl: string;

    constructor(pool: Pool, credentials: HotelbedsCredentials[], baseUrl?: string) {
        this.pool = pool;
        this.credentials = credentials;
        this.baseUrl = baseUrl || 'https://api.test.hotelbeds.com';
    }

    private get currentCreds(): HotelbedsCredentials {
        return this.credentials[this.currentCredentialIndex];
    }

    private rotateCredentials() {
        this.currentCredentialIndex = (this.currentCredentialIndex + 1) % this.credentials.length;
        console.log(`🔄 Rotated to Hotelbeds credential set ${this.currentCredentialIndex + 1}`);
    }

    private generateSignature(): string {
        const { apiKey, secret } = this.currentCreds;
        const ts = Math.floor(Date.now() / 1000).toString();
        return crypto.createHash('sha256').update(apiKey + secret + ts).digest('hex');
    }

    private getHeaders() {
        return {
            'Api-key': this.currentCreds.apiKey,
            'X-Signature': this.generateSignature(),
            'Accept': 'application/json'
        };
    }

    private async fetchWithRetry(endpoint: string, params: Record<string, any> = {}, retries = 3): Promise<any> {
        let attempt = 0;
        const url = `${this.baseUrl.replace(/\/$/, '')}${endpoint}`;

        while (attempt <= retries) {
            try {
                const response = await axios.get(url, {
                    headers: this.getHeaders(),
                    params
                });
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 429) {
                    console.warn(`⚠️ Rate limit exceeded for key ${this.currentCredentialIndex + 1}.`);
                    this.rotateCredentials();
                    attempt++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    continue;
                }

                if (attempt >= retries) throw error;
                attempt++;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
        }
    }

    async ingestHotels(limit?: number) {
        console.log('🏨 Starting Hotelbeds Hotel Ingestion...');
        let from = 1;
        const step = 1000;
        let processedCount = 0;

        try {
            while (true) {
                const data = await this.fetchWithRetry('/hotel-content-api/1.0/hotels', {
                    from,
                    to: from + step - 1,
                    fields: 'all',
                    useSecondaryLanguage: false
                });

                if (!data.hotels || data.hotels.length === 0) break;

                for (const hbHotel of data.hotels) {
                    const hotelData: HotelData = {
                        name: hbHotel.name?.content || hbHotel.name,
                        address: hbHotel.address?.content || hbHotel.address,
                        city: hbHotel.city?.content || hbHotel.city,
                        country: hbHotel.countryCode, // HB uses countryCode
                        country_code: hbHotel.countryCode,
                        stars: this.mapStars(hbHotel.categoryCode),
                        latitude: hbHotel.coordinates?.latitude,
                        longitude: hbHotel.coordinates?.longitude,
                        amenities: hbHotel.facilities?.map((f: any) => String(f.description?.content || f.facilityCode)),
                        images: hbHotel.images?.map((img: any) => ({
                            url: `http://photos.hotelbeds.com/giata/${img.path}`,
                            caption: img.typeDescription?.content
                        })),
                        external_id: hbHotel.code.toString(),
                        external_source: 'HOTELBEDS'
                    };

                    await findOrCreateCanonicalHotel(this.pool, hotelData, hbHotel.code);
                    processedCount++;

                    if (limit && processedCount >= limit) {
                        console.log(`✅ Reached limit of ${limit} hotels.`);
                        return;
                    }
                }

                console.log(`✅ Processed ${processedCount} hotels...`);
                from += step;
                if (from > data.total) break;
            }
        } catch (error: any) {
            console.error('❌ Hotelbeds ingestion failed:', error.message);
            throw error;
        }
    }

    private mapStars(categoryCode: string): number {
        // HB category codes: 1EST, 2EST, 3EST, 4EST, 5EST, etc.
        const match = String(categoryCode || '').match(/(\d+)EST/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Ingest hotels from a local JSON file (previously downloaded from Hotelbeds API)
     */
    async ingestFromLocalFile(filePath: string, limit?: number) {
        console.log(`🏨 Starting Hotelbeds Hotel Ingestion from local file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        if (!data.hotels || !Array.isArray(data.hotels)) {
            throw new Error('Invalid file format: expected { hotels: [...] }');
        }

        console.log(`📊 Found ${data.hotels.length} hotels in file (total reported: ${data.total || 'N/A'})`);

        let processedCount = 0;
        let errorCount = 0;

        for (const hbHotel of data.hotels) {
            try {
                const hotelData: HotelData = {
                    name: hbHotel.name?.content || hbHotel.name,
                    address: hbHotel.address?.content || hbHotel.address,
                    city: hbHotel.city?.content || hbHotel.city,
                    country: hbHotel.countryCode,
                    country_code: hbHotel.countryCode,
                    stars: this.mapStars(hbHotel.categoryCode),
                    latitude: hbHotel.coordinates?.latitude,
                    longitude: hbHotel.coordinates?.longitude,
                    amenities: hbHotel.facilities?.map((f: any) => String(f.description?.content || f.facilityCode)),
                    images: hbHotel.images?.map((img: any) => ({
                        url: `http://photos.hotelbeds.com/giata/${img.path}`,
                        caption: img.typeDescription?.content
                    })),
                    external_id: hbHotel.code.toString(),
                    external_source: 'HOTELBEDS'
                };

                await findOrCreateCanonicalHotel(this.pool, hotelData, hbHotel.code);
                processedCount++;

                if (processedCount % 100 === 0) {
                    console.log(`✅ Processed ${processedCount} hotels...`);
                }

                if (limit && processedCount >= limit) {
                    console.log(`✅ Reached limit of ${limit} hotels.`);
                    break;
                }
            } catch (error: any) {
                errorCount++;
                if (errorCount <= 5) {
                    console.warn(`⚠️ Error processing hotel ${hbHotel.code}: ${error.message}`);
                }
            }
        }

        console.log(`✅ Completed! Processed: ${processedCount}, Errors: ${errorCount}`);
        return { processed: processedCount, errors: errorCount };
    }
}
