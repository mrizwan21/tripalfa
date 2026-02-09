import express, { Request, Response } from 'express';
import { staticPrisma } from '../db.js';
import { getHotelCacheService, hotelCacheKeys, CACHE_TTL } from '../cache/index.js';

const router = express.Router();

// Helper for caching and fetching
const serveStaticData = async (
    req: Request,
    res: Response,
    key: string,
    fetcher: () => Promise<any>
) => {
    try {
        const cacheService = getHotelCacheService();
        const cacheKey = hotelCacheKeys.static(key);

        // Try cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const data = await fetcher();

        // Cache for 6 hours
        if (data) {
            await cacheService.set(cacheKey, data, CACHE_TTL.STATIC_DATA);
        }

        res.json(data);
    } catch (error) {
        console.error(`Static Data Fetch Error (${key}):`, error);
        res.status(500).json({ error: `Failed to fetch ${key}` });
    }
};

router.get('/airports', (req, res) => {
    serveStaticData(req, res, 'airports', () =>
        staticPrisma.airport.findMany({ where: { isActive: true } })
    );
});

router.get('/airlines', (req, res) => {
    serveStaticData(req, res, 'airlines', () =>
        staticPrisma.airline.findMany({ where: { isActive: true } })
    );
});

router.get('/aircraft', (req, res) => {
    serveStaticData(req, res, 'aircraft', () =>
        staticPrisma.aircraft.findMany({ where: { isActive: true } })
    );
});

router.get('/chains', (req, res) => {
    serveStaticData(req, res, 'chains', () =>
        staticPrisma.hotelChain.findMany()
    );
});

router.get('/hotelChains', (req, res) => {
    serveStaticData(req, res, 'hotelChains', () =>
        staticPrisma.hotelChain.findMany()
    );
});

router.get('/currencies', (req, res) => {
    serveStaticData(req, res, 'currencies', () =>
        staticPrisma.currency.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' }
        })
    );
});

router.get('/facilities', (req, res) => {
    serveStaticData(req, res, 'facilities', () =>
        staticPrisma.hotelFacility.findMany()
    );
});

router.get('/hotelFacilities', (req, res) => {
    serveStaticData(req, res, 'hotelFacilities', () =>
        staticPrisma.hotelFacility.findMany()
    );
});

router.get('/types', (req, res) => {
    serveStaticData(req, res, 'types', () =>
        staticPrisma.hotelType.findMany()
    );
});

router.get('/hotelTypes', (req, res) => {
    serveStaticData(req, res, 'hotelTypes', () =>
        staticPrisma.hotelType.findMany()
    );
});

router.get('/loyalty-programs', (req, res) => {
    serveStaticData(req, res, 'loyalty-programs', () =>
        staticPrisma.loyaltyProgram.findMany({ where: { isActive: true } })
    );
});

router.get('/nationalities', (req, res) => {
    serveStaticData(req, res, 'nationalities', () =>
        staticPrisma.nationality.findMany()
    );
});

router.get('/countries', (req, res) => {
    serveStaticData(req, res, 'countries', async () => {
        const countriesRaw = await staticPrisma.airport.findMany({
            select: { country: true, countryCode: true },
            distinct: ['countryCode']
        });
        return countriesRaw.map(c => ({ name: c.country, code: c.countryCode }));
    });
});

// Deprecated: legacy query param support for backward compatibility if needed
router.get('/data', async (req: Request, res: Response) => {
    const { type } = req.query;
    if (typeof type === 'string') {
        const typeMap: Record<string, string> = {
            'airports': '/airports',
            'airlines': '/airlines',
            'aircraft': '/aircraft',
            'chains': '/chains',
            'currencies': '/currencies',
            'facilities': '/facilities',
            'types': '/types',
            'loyalty-programs': '/loyalty-programs',
            'nationalities': '/nationalities',
            'countries': '/countries'
        };

        if (typeMap[type]) {
            // Redirect or internal call? Redirect is easiest but 301 might cache bad. 
            // Better to re-route logic.
            // But for now, let's just return error or minimal support.
            return res.redirect(req.baseUrl + typeMap[type]);
        }
    }
    res.status(400).json({ error: 'Use specific endpoints e.g. /static/airports' });
});

export default router;
