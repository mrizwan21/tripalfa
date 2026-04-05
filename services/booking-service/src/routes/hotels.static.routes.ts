import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/hotels/destinations:
 *   get:
 *     summary: Search hotel destinations/cities
 *     tags: [Hotel Static Data]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Destinations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                   type:
 *                     type: string
 */
router.get('/hotels/destinations', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json([]);

  const pattern = `%${q}%`;
  const rows = await prisma.$queryRaw<
    { id: string; name: string; city: string; country: string; type: string }[]
  >`
    SELECT id, name, city, country, 'hotel' AS type
    FROM hotels
    WHERE is_active = true
      AND (name ILIKE ${pattern} OR city ILIKE ${pattern})
    ORDER BY city ASC
    LIMIT 10
  `;
  return res.json(rows);
});

/**
 * @swagger
 * /api/hotels/{hotelId}/static:
 *   get:
 *     summary: Get hotel static details including images, amenities, policies, room types
 *     tags: [Hotel Static Data]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 starRating:
 *                   type: number
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 address:
 *                   type: string
 *                 city:
 *                   type: string
 *                 country:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                 amenities:
 *                   type: array
 *                   items:
 *                     type: object
 *                 policies:
 *                   type: array
 *                   items:
 *                     type: object
 *                 nearbyPlaces:
 *                   type: array
 *                   items:
 *                     type: object
 *                 roomTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/hotels/:hotelId/static', async (req: Request, res: Response) => {
  const hotel = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      starRating: number | null;
      latitude: number | null;
      longitude: number | null;
      address: string | null;
      city: string | null;
      country: string | null;
      checkinTime: string | null;
      checkoutTime: string | null;
      description: string | null;
      distanceFromCenter: number | null;
      neighbourhood: string | null;
    }[]
  >`
    SELECT id, name, star_rating as "starRating", latitude, longitude,
           address, city, country, checkin_time as "checkinTime",
           checkout_time as "checkoutTime", description,
           distance_from_center as "distanceFromCenter",
           neighbourhood
    FROM hotels
    WHERE id = ${req.params.hotelId}
    LIMIT 1
  `;

  if (!hotel || hotel.length === 0) {
    return res.status(404).json({ error: 'Hotel not found' });
  }

  const [hotelData] = hotel;

  // Fetch related data in parallel
  const [images, amenities, policies, nearbyPlaces, roomTypes] = await Promise.all([
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        imageUrl: string;
        caption: string | null;
        category: string | null;
        isPrimary: boolean;
        displayOrder: number;
      }[]
    >`
      SELECT id, hotel_id as "hotelId", image_url as "imageUrl",
             caption, category, is_primary as "isPrimary", display_order as "displayOrder"
      FROM hotel_images
      WHERE hotel_id = ${req.params.hotelId}
      ORDER BY display_order ASC
    `,
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        amenityId: number;
        amenityName: string;
        amenityIcon: string | null;
      }[]
    >`
      SELECT ha.id, ha.hotel_id as "hotelId", ha.amenity_id as "amenityId",
             a.name as "amenityName", a.icon as "amenityIcon"
      FROM hotel_amenities ha
      JOIN amenities a ON ha.amenity_id = a.id
      WHERE ha.hotel_id = ${req.params.hotelId}
    `,
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        policyType: string;
        description: string;
      }[]
    >`
      SELECT id, hotel_id as "hotelId", policy_type as "policyType", description
      FROM hotel_policies
      WHERE hotel_id = ${req.params.hotelId}
    `,
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        name: string;
        distanceKm: number;
        category: string;
      }[]
    >`
      SELECT id, hotel_id as "hotelId", name, distance_km as "distanceKm", category
      FROM hotel_nearby_places
      WHERE hotel_id = ${req.params.hotelId}
      ORDER BY distance_km ASC
    `,
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        name: string;
        sizeSqm: number | null;
        maxAdults: number | null;
        maxChildren: number | null;
      }[]
    >`
      SELECT id, hotel_id as "hotelId", name, size_sqm as "sizeSqm",
             max_adults as "maxAdults", max_children as "maxChildren"
      FROM room_types
      WHERE hotel_id = ${req.params.hotelId}
    `,
  ]);

  return res.json({
    ...hotelData,
    images,
    amenities,
    policies,
    nearbyPlaces,
    roomTypes,
  });
});

/**
 * @swagger
 * /api/hotels/{hotelId}/reviews:
 *   get:
 *     summary: Get paginated hotel reviews
 *     tags: [Hotel Static Data]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 */
router.get('/hotels/:hotelId/reviews', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
  const skip = (page - 1) * limit;

  const [reviews, countData, avgData] = await Promise.all([
    prisma.$queryRaw<
      {
        id: number;
        hotelId: string;
        reviewerName: string | null;
        rating: number;
        comment: string | null;
        reviewDate: Date;
      }[]
    >`
      SELECT id, hotel_id as "hotelId", reviewer_name as "reviewerName",
             rating, comment, review_date as "reviewDate"
      FROM hotel_reviews
      WHERE hotel_id = ${req.params.hotelId}
      ORDER BY review_date DESC
      LIMIT ${limit} OFFSET ${skip}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM hotel_reviews WHERE hotel_id = ${req.params.hotelId}
    `,
    prisma.$queryRaw<{ avg: number }[]>`
      SELECT AVG(rating) as avg FROM hotel_reviews WHERE hotel_id = ${req.params.hotelId}
    `,
  ]);

  const total = Number(countData[0]?.count ?? 0);
  const avgRating = countData.length > 0 ? Number(avgData[0]?.avg ?? 0) : 0;

  return res.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
    averageRating: Number(avgRating.toFixed(1)),
  });
});

/**
 * @swagger
 * /api/hotels/{hotelId}/extras:
 *   get:
 *     summary: Get hotel extra services
 *     tags: [Hotel Static Data]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Extra services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hotelId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 */
router.get('/hotels/:hotelId/extras', async (req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      id: number;
      hotelId: string;
      name: string;
      description: string | null;
      price: number;
      currency: string;
      isActive: boolean;
    }[]
  >`
      SELECT id, hotel_id as "hotelId", name, description, price, currency, is_active as "isActive"
      FROM hotel_extra_services
      WHERE hotel_id = ${req.params.hotelId}
        AND is_active = true
    `;
  return res.json(data);
});

export default router;
