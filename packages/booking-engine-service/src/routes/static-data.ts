import { Router, type Request, type Response } from 'express';
import { staticDbPool } from '../static-db.js';

const router: Router = Router();

/**
 * @swagger
 * /api/static/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: List of countries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/countries', async (_req: Request, res: Response) => {
  try {
    const result = await staticDbPool.query(
      'SELECT code, name FROM shared.countries ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Countries fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch countries' });
  }
});

/**
 * @swagger
 * /api/static/currencies:
 *   get:
 *     summary: Get all currencies
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: List of currencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       decimals:
 *                         type: integer
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/currencies', async (_req: Request, res: Response) => {
  try {
    const result = await staticDbPool.query(
      'SELECT code, name, code as symbol, decimal_precision as decimals FROM shared.currencies ORDER BY code ASC'
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Currencies fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch currencies' });
  }
});

/**
 * @swagger
 * /api/static/languages:
 *   get:
 *     summary: Get enabled languages
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: List of enabled languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/languages', async (_req: Request, res: Response) => {
  try {
    const result = await staticDbPool.query(
      'SELECT code, name FROM shared.languages WHERE is_enabled = true ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Languages fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch languages' });
  }
});

/**
 * @swagger
 * /api/static/hotel-types:
 *   get:
 *     summary: Get hotel property types
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: List of hotel types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/hotel-types', async (_req: Request, res: Response) => {
  try {
    const result = await staticDbPool.query('SELECT id, name FROM hotel.types ORDER BY name ASC');
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Hotel types fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch hotel types' });
  }
});

/**
 * @swagger
 * /api/static/hotel-amenities:
 *   get:
 *     summary: Get hotel facilities and amenities
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: List of hotel amenities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       iconUrl:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/hotel-amenities', async (_req: Request, res: Response) => {
  try {
    const result = await staticDbPool.query(
      'SELECT id, name, category, icon_url as iconUrl FROM hotel.facilities ORDER BY category ASC, name ASC'
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Hotel amenities fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch hotel amenities' });
  }
});

/**
 * @swagger
 * /api/static/destinations:
 *   get:
 *     summary: Search city destinations
 *     tags: [Static Data]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term for city name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Filter by country code
 *     responses:
 *       200:
 *         description: List of matching destinations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       city:
 *                         type: string
 *                       countryCode:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       type:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/destinations', async (req: Request, res: Response) => {
  try {
    const { q, countryCode } = req.query;
    let query =
      "SELECT id, name, name as city, country_code as countryCode, latitude, longitude, 'city' as type FROM hotel.cities";
    const params = [];
    const where = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(`name ILIKE $${params.length}`);
    }
    if (countryCode) {
      params.push(countryCode.toString().toUpperCase());
      where.push(`country_code = $${params.length}`);
    }

    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY name ASC LIMIT 30';

    const result = await staticDbPool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] Destinations fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch destinations' });
  }
});

/**
 * @swagger
 * /api/static/iata-codes:
 *   get:
 *     summary: Get IATA airport codes
 *     tags: [Static Data]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for airport code or name
 *     responses:
 *       200:
 *         description: List of IATA codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       countryCode:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/iata-codes', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = 'SELECT code, name, country_code as countryCode FROM hotel.iata_airports';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE code ILIKE $1 OR name ILIKE $1`;
    }
    query += ' ORDER BY code ASC LIMIT 30';

    const result = await staticDbPool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error: any) {
    console.error('[StaticData] IATA codes fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch IATA codes' });
  }
});

export default router;
