import { Router, Request, Response } from 'express';
import axios from 'axios';
import pg from 'pg';

const { Pool } = pg;
const router: Router = Router();

// ipapi.co API key from environment
const IPAPI_KEY = process.env.IPAPI_API_KEY;
const STATIC_DATABASE_URL =
  process.env.STATIC_DATABASE_URL || 'postgresql://postgres@localhost:5432/staticdatabase';

// Database pool for static data
const pool = new Pool({
  connectionString: STATIC_DATABASE_URL,
});

/**
 * @swagger
 * /api/location/me:
 *   get:
 *     summary: Detect user location and timezone based on IP address
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Location detected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ip:
 *                       type: string
 *                     city:
 *                       type: string
 *                     region:
 *                       type: string
 *                     country:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     utcOffset:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     languages:
 *                       type: string
 *                     _source:
 *                       type: string
 *       400:
 *         description: Invalid IP address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to detect location
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Get IP from request (handling proxies)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();

    // SECURITY: Validate IP address to prevent SSRF attacks
    if (clientIp && !isValidIpAddress(clientIp) && !isLocalhost(clientIp)) {
      console.warn(`[Location] Invalid IP address detected: ${clientIp}`);
      return res.status(400).json({ error: 'Invalid IP address format' });
    }

    // Try to fetch from local cache first
    try {
      const cacheResult = await pool.query('SELECT * FROM hotel.ip_locations WHERE ip = $1', [
        clientIp,
      ]);

      if (cacheResult.rows.length > 0) {
        const data = cacheResult.rows[0];
        console.log(`[Location] Cache hit for IP: ${clientIp}`);
        return res.json({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country,
          countryCode: data.country_code,
          timezone: data.timezone,
          utcOffset: data.utc_offset,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          currency: data.currency,
          languages: data.languages,
          _source: 'local-cache',
        });
      }
    } catch (dbError: any) {
      console.warn('[Location] Database cache check failed:', dbError.message);
      // Continue to API if DB fails
    }

    console.log(`[Location] Cache miss. Detecting location for IP: ${clientIp} via ipapi.co`);

    // Check if API key is configured if we need to call external API
    if (!IPAPI_KEY) {
      console.warn('[Location] IPAPI_API_KEY not configured - returning default response');
      return res.json({
        ip: clientIp || '127.0.0.1',
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        countryCode: 'XX',
        timezone: 'UTC',
        utcOffset: '+00:00',
        latitude: 0,
        longitude: 0,
        currency: 'USD',
        languages: 'en',
        _notice: 'API key not configured - using defaults',
      });
    }

    const useProvidedIp =
      clientIp && (isValidIpAddress(clientIp) || isLocalhost(clientIp)) && !isLocalhost(clientIp);
    const url = useProvidedIp ? `https://ipapi.co/${clientIp}/json/` : `https://ipapi.co/json/`;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: { Authorization: `ApiKey ${IPAPI_KEY}` },
    });

    if (response.data && !response.data.error) {
      const locationData = {
        ip: response.data.ip,
        city: response.data.city,
        region: response.data.region,
        country: response.data.country_name,
        countryCode: response.data.country_code,
        timezone: response.data.timezone,
        utcOffset: response.data.utc_offset,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        currency: response.data.currency,
        languages: response.data.languages,
      };

      // Cache the result asynchronously
      pool
        .query(
          `INSERT INTO hotel.ip_locations 
                (ip, city, region, country, country_code, timezone, utc_offset, latitude, longitude, currency, languages, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (ip) DO UPDATE SET
                city = EXCLUDED.city, region = EXCLUDED.region, country = EXCLUDED.country,
                country_code = EXCLUDED.country_code, timezone = EXCLUDED.timezone,
                utc_offset = EXCLUDED.utc_offset, latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude, currency = EXCLUDED.currency,
                languages = EXCLUDED.languages, updated_at = NOW()`,
          [
            locationData.ip,
            locationData.city,
            locationData.region,
            locationData.country,
            locationData.countryCode,
            locationData.timezone,
            locationData.utcOffset,
            locationData.latitude,
            locationData.longitude,
            locationData.currency,
            locationData.languages,
          ]
        )
        .catch(err => console.error('[Location] Failed to cache location data:', err.message));

      return res.json({ ...locationData, _source: 'ipapi.co' });
    } else {
      return res.status(422).json({
        error: 'Could not detect location',
        details: response.data?.reason || 'IP API error',
      });
    }
  } catch (error: any) {
    console.error('[Location] Error:', error.message);
    res.status(500).json({ error: 'Failed to detect location' });
  }
});

export default router;
