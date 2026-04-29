import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/airports:
 *   get:
 *     summary: Search airports by IATA code, city, or name
 *     tags: [Static Data]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (min 2 characters)
 *     responses:
 *       200:
 *         description: Airports retrieved successfully
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
 *                       iata_code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       city:
 *                         type: string
 *                       country:
 *                         type: string
 */
router.get('/airports', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json({ data: [] });

  const pattern = `%${q}%`;
  const upperQ = q.toUpperCase();
  const rows = await prisma.$queryRaw<
    { iata_code: string; name: string; city: string; country: string }[]
  >`
    SELECT iata_code, name, city, country
    FROM airports
    WHERE (
      iata_code ILIKE ${upperQ + '%'}
      OR city ILIKE ${pattern}
      OR name ILIKE ${pattern}
    )
    ORDER BY
      CASE WHEN iata_code ILIKE ${upperQ + '%'} THEN 0 ELSE 1 END,
      city ASC
    LIMIT 10
  `;
  return res.json({ data: rows });
});

/**
 * @swagger
 * /api/airlines:
 *   get:
 *     summary: List all active airlines
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Airlines retrieved successfully
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
 *                       iata_code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       logo_url:
 *                         type: string
 *                       country:
 *                         type: string
 *                       alliance:
 *                         type: string
 *                       checkin_url:
 *                         type: string
 */
router.get('/airlines', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      iata_code: string;
      name: string;
      logo_url: string | null;
      country: string | null;
      alliance: string | null;
      checkin_url: string | null;
    }[]
  >`
    SELECT iata_code, name, logo_url, country, alliance, checkin_url
    FROM airlines
    WHERE is_active = true
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      iata_code: r.iata_code,
      name: r.name,
      logo_url: r.logo_url,
      country: r.country,
      alliance: r.alliance,
      checkin_url: r.checkin_url,
    })),
  });
});

/**
 * @swagger
 * /api/airlines/{code}:
 *   get:
 *     summary: Get airline details by IATA code
 *     tags: [Static Data]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Airline IATA code
 *     responses:
 *       200:
 *         description: Airline details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Airline not found
 */
router.get('/airlines/:code', async (req: Request, res: Response) => {
  const [airline] = await prisma.$queryRaw<
    {
      iata_code: string;
      name: string;
      logo_url: string | null;
      country: string | null;
      alliance: string | null;
      checkin_url: string | null;
    }[]
  >`
    SELECT iata_code, name, logo_url, country, alliance, checkin_url
    FROM airlines
    WHERE iata_code = ${req.params.code.toUpperCase()}
    LIMIT 1
  `;

  if (!airline) return res.status(404).json({ error: 'Airline not found' });

  const loyalties = await prisma.$queryRaw<
    { id: number; airline_id: string; program_name: string }[]
  >`
    SELECT id, airline_id, program_name FROM loyalty_programs WHERE airline_id = ${airline.iata_code}
  `;

  return res.json({
    iataCode: airline.iata_code,
    name: airline.name,
    logoUrl: airline.logo_url,
    country: airline.country,
    alliance: airline.alliance,
    checkinUrl: airline.checkin_url,
    loyaltyPrograms: loyalties.map(l => ({
      id: l.id,
      airlineId: l.airline_id,
      programName: l.program_name,
    })),
  });
});

/**
 * @swagger
 * /api/aircraft-types:
 *   get:
 *     summary: List all aircraft types
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Aircraft types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/aircraft-types', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      iata_code: string;
      name: string;
      manufacturer: string | null;
      seat_count_economy: number | null;
      seat_count_business: number | null;
      seat_count_first: number | null;
    }[]
  >`
    SELECT iata_code, name, manufacturer, seat_count_economy, seat_count_business, seat_count_first
    FROM aircraft_types
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      iata_code: r.iata_code,
      name: r.name,
      manufacturer: r.manufacturer,
      seat_count_economy: r.seat_count_economy,
      seat_count_business: r.seat_count_business,
      seat_count_first: r.seat_count_first,
    })),
  });
});

/**
 * @swagger
 * /api/aircraft-types/{code}:
 *   get:
 *     summary: Get aircraft type details by IATA code
 *     tags: [Static Data]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Aircraft type IATA code
 *     responses:
 *       200:
 *         description: Aircraft type details retrieved successfully
 *       404:
 *         description: Aircraft type not found
 */
router.get('/aircraft-types/:code', async (req: Request, res: Response) => {
  const [data] = await prisma.$queryRaw<
    {
      iata_code: string;
      name: string;
      manufacturer: string | null;
      seat_count_economy: number | null;
      seat_count_business: number | null;
      seat_count_first: number | null;
    }[]
  >`
    SELECT iata_code, name, manufacturer, seat_count_economy, seat_count_business, seat_count_first
    FROM aircraft_types
    WHERE iata_code = ${req.params.code.toUpperCase()}
    LIMIT 1
  `;

  if (!data) return res.status(404).json({ error: 'Aircraft type not found' });

  return res.json({
    iataCode: data.iata_code,
    name: data.name,
    manufacturer: data.manufacturer,
    seatCountEconomy: data.seat_count_economy,
    seatCountBusiness: data.seat_count_business,
    seatCountFirst: data.seat_count_first,
  });
});

/**
 * @swagger
 * /api/countries:
 *   get:
 *     summary: List all active countries
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/countries', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      name: string;
      dial_code: string | null;
      flag_emoji: string | null;
      is_active: boolean;
    }[]
  >`
    SELECT code, name, dial_code, flag_emoji, is_active
    FROM countries
    WHERE is_active = true
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      code: r.code,
      name: r.name,
      dial_code: r.dial_code,
      flag_emoji: r.flag_emoji,
      is_active: r.is_active,
    })),
  });
});

/**
 * @swagger
 * /api/countries/{code}/states:
 *   get:
 *     summary: List states by country code
 *     tags: [Static Data]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Country code
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/countries/:code/states', async (req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      id: number;
      country_code: string;
      code: string;
      name: string;
    }[]
  >`
    SELECT id, country_code, code, name
    FROM states
    WHERE country_code = ${req.params.code.toUpperCase()}
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      id: r.id,
      country_code: r.country_code,
      code: r.code,
      name: r.name,
    })),
  });
});

/**
 * @swagger
 * /api/currencies:
 *   get:
 *     summary: List all active currencies
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Currencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/currencies', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      name: string;
      symbol: string;
      decimal_places: number;
      is_active: boolean;
    }[]
  >`
    SELECT code, name, symbol, decimal_places, is_active
    FROM currencies
    WHERE is_active = true
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      decimal_places: r.decimal_places,
      is_active: r.is_active,
    })),
  });
});

/**
 * @swagger
 * /api/languages:
 *   get:
 *     summary: List all active languages
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/languages', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      name: string;
      direction: 'ltr' | 'rtl';
      is_active: boolean;
    }[]
  >`
    SELECT code, name, direction, is_active
    FROM languages
    WHERE is_active = true
    ORDER BY name ASC
  `;

  return res.json({
    data: data.map(r => ({
      code: r.code,
      name: r.name,
      direction: r.direction,
      is_active: r.is_active,
    })),
  });
});

/**
 * @swagger
 * /api/salutations:
 *   get:
 *     summary: List all salutations
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Salutations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/salutations', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      label: string;
      display_order: number;
    }[]
  >`
    SELECT code, label, display_order
    FROM salutations
    ORDER BY display_order ASC
  `;

  return res.json({
    data: data.map(r => ({
      code: r.code,
      label: r.label,
      display_order: r.display_order,
    })),
  });
});

/**
 * @swagger
 * /api/genders:
 *   get:
 *     summary: List all gender options
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Genders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/genders', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<{ code: string; label: string }[]>`
    SELECT code, label FROM genders
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/cabin-classes:
 *   get:
 *     summary: List all cabin classes
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Cabin classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/cabin-classes', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      name: string;
      display_order: number;
    }[]
  >`
    SELECT code, name, display_order
    FROM cabin_classes
    ORDER BY display_order ASC
  `;

  return res.json({
    data: data.map(r => ({
      code: r.code,
      name: r.name,
      display_order: r.display_order,
    })),
  });
});

/**
 * @swagger
 * /api/meal-preferences:
 *   get:
 *     summary: List all meal preference options
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Meal preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/meal-preferences', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      label: string;
      description: string | null;
    }[]
  >`
    SELECT code, label, description
    FROM meal_preferences
    ORDER BY label ASC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/special-assistance:
 *   get:
 *     summary: List all special assistance options
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Special assistance options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/special-assistance', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      label: string;
      description: string | null;
    }[]
  >`
    SELECT code, label, description
    FROM special_assistance_types
    ORDER BY label ASC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/board-basis:
 *   get:
 *     summary: List all board basis types
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Board basis types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/board-basis', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      label: string;
    }[]
  >`
    SELECT code, label FROM board_basis_types ORDER BY label ASC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/property-types:
 *   get:
 *     summary: List all property types
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Property types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/property-types', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      code: string;
      label: string;
    }[]
  >`
    SELECT code, label FROM property_types ORDER BY label ASC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: List all active payment methods
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/payment-methods', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      id: number;
      code: string;
      label: string;
      icon_url: string | null;
      is_active: boolean;
      display_order: number;
    }[]
  >`
    SELECT id, code, label, icon_url, is_active, display_order
    FROM payment_methods
    WHERE is_active = true
    ORDER BY display_order ASC
  `;

  return res.json({
    data: data.map(r => ({
      id: r.id,
      code: r.code,
      label: r.label,
      icon_url: r.icon_url,
      is_active: r.is_active,
      display_order: r.display_order,
    })),
  });
});

/**
 * @swagger
 * /api/amenities:
 *   get:
 *     summary: List all amenities
 *     tags: [Static Data]
 *     parameters:
 *       - in: query
 *         name: filterable
 *         schema:
 *           type: boolean
 *         description: If true, returns only filterable amenities
 *     responses:
 *       200:
 *         description: Amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/amenities', async (req: Request, res: Response) => {
  const filterableOnly = req.query.filterable === 'true';

  let query = `
    SELECT id, name, icon, category, filterable, display_order
    FROM amenities
  `;

  if (filterableOnly) {
    query += ` WHERE filterable = true`;
  }

  query += ` ORDER BY category ASC, display_order ASC`;

  const data = await prisma.$queryRawUnsafe<
    {
      id: number;
      name: string;
      icon: string | null;
      category: string | null;
      filterable: boolean;
      display_order: number;
    }[]
  >(query);

  return res.json({
    data: data.map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      category: r.category,
      filterable: r.filterable,
      display_order: r.display_order,
    })),
  });
});

/**
 * @swagger
 * /api/cancellation-policies:
 *   get:
 *     summary: List all cancellation policies
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Cancellation policies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/cancellation-policies', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      id: number;
      type: string;
      description: string;
      penalty_percentage: number | null;
      deadline_hours: number | null;
    }[]
  >`
    SELECT id, type, description, penalty_percentage, deadline_hours
    FROM cancellation_policies
  `;

  return res.json({
    data: data.map(r => ({
      id: r.id,
      type: r.type,
      description: r.description,
      penalty_percentage: r.penalty_percentage,
      deadline_hours: r.deadline_hours,
    })),
  });
});

export default router;
