/**
 * Static Data Routes
 * Serves hotel amenities, room types, board types, airports, cities from PostgreSQL
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@tripalfa/shared-database';

const router = Router();

// ============================================================================
// AIRPORTS
// ============================================================================

router.get('/airports', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Build where clause for database query
    const where: any = { is_active: true };
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { iata_code: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    // Query from database
    const airports = await prisma.airport.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        iata_code: true,
        name: true,
        city: true,
        country: true,
        country_code: true,
        latitude: true,
        longitude: true,
      },
    });
    
    res.json({ data: airports, total: airports.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching airports:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CITIES
// ============================================================================

router.get('/cities', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Build where clause for database query
    const where: any = { is_active: true };
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { country: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    // Query from database
    const cities = await prisma.city.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        iata_code: true,
        name: true,
        country: true,
        country_code: true,
        latitude: true,
        longitude: true,
      },
    });
    
    res.json({ data: cities, total: cities.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SUGGESTIONS (for autocomplete)
// ============================================================================

router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const type = req.query.type as string || 'hotel';
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query || query.length < 2) {
      return res.json({ data: [], total: 0 });
    }
    
    const q = query.toLowerCase();
    const suggestions: any[] = [];
    
    if (type === 'flight') {
      // For flight search, return only airports from database
      const airports = await prisma.airport.findMany({
        where: {
          is_active: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { iata_code: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
      
      suggestions.push(...airports.map(a => ({
        type: 'AIRPORT',
        icon: 'plane',
        title: a.name,
        subtitle: `${a.city}, ${a.country}`,
        code: a.iata_code,
        city: a.city,
        country: a.country,
        countryCode: a.country_code,
        latitude: a.latitude,
        longitude: a.longitude,
      })));
    } else {
      // For hotel search, return both cities and airports from database
      // Cities first
      const cities = await prisma.city.findMany({
        where: {
          is_active: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
      
      suggestions.push(...cities.map(c => ({
        type: 'CITY',
        icon: 'map-pin',
        title: c.name,
        subtitle: c.country || '',
        code: c.country_code,
        city: c.name,
        country: c.country,
        countryCode: c.country_code,
        latitude: c.latitude,
        longitude: c.longitude,
      })));
      
      // Then airports
      const airports = await prisma.airport.findMany({
        where: {
          is_active: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { iata_code: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
      
      suggestions.push(...airports.map(a => ({
        type: 'AIRPORT',
        icon: 'plane',
        title: a.name,
        subtitle: `${a.city}, ${a.country}`,
        code: a.iata_code,
        city: a.city,
        country: a.country,
        countryCode: a.country_code,
        latitude: a.latitude,
        longitude: a.longitude,
      })));
    }
    
    res.json({ data: suggestions.slice(0, limit), total: suggestions.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HOTEL AMENITIES
// ============================================================================

router.get('/amenities', async (req: Request, res: Response) => {
  try {
    const amenities = await prisma.hotelAmenity.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ data: amenities, total: amenities.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching amenities:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ROOM TYPES
// ============================================================================

router.get('/room-types', async (req: Request, res: Response) => {
  try {
    const roomTypes = await prisma.hotelRoomType.findMany({
      where: { isActive: true },
      orderBy: { roomTypeName: 'asc' },
    });
    res.json({ data: roomTypes, total: roomTypes.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching room types:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BOARD TYPES
// ============================================================================

router.get('/board-types', async (req: Request, res: Response) => {
  try {
    const boardTypes = await prisma.boardType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: boardTypes, total: boardTypes.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching board types:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ROOM AMENITIES
// ============================================================================

router.get('/room-amenities', async (req: Request, res: Response) => {
  try {
    const roomAmenities = await prisma.roomAmenity.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ data: roomAmenities, total: roomAmenities.length });
  } catch (error: any) {
    console.error('[StaticData] Error fetching room amenities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;