import express, { Request, Response } from 'express';
import { staticPrisma } from '../db.js';

const router = express.Router();

// GET /static/data?type=airports|airlines|aircraft|chains|currencies|facilities|types
router.get('/data', async (req: Request, res: Response) => {
    try {
        const { type } = req.query;

        let data;
        switch (type) {
            case 'airports':
                data = await staticPrisma.airport.findMany({ where: { isActive: true } });
                break;
            case 'airlines':
                data = await staticPrisma.airline.findMany({ where: { isActive: true } });
                break;
            case 'aircraft':
                data = await staticPrisma.aircraft.findMany({ where: { isActive: true } });
                break;
            case 'chains':
                data = await staticPrisma.hotelChain.findMany();
                break;
            case 'currencies':
                data = await staticPrisma.currency.findMany({ where: { isActive: true } });
                break;
            case 'facilities':
                data = await staticPrisma.hotelFacility.findMany();
                break;
            case 'types':
                data = await staticPrisma.hotelType.findMany();
                break;
            case 'loyalty-programs':
                data = await staticPrisma.loyaltyProgram.findMany({ where: { isActive: true } });
                break;
            case 'nationalities':
                data = await staticPrisma.nationality.findMany();
                break;
            case 'countries':
                // Note: Cities model has country and countryCode. Airports also has country.
                // For now, we can extract distinct countries from Airport or City if a dedicated Country model doesn't exist.
                // Assuming based on previous plan, we might need a dedicated model or just distinct names.
                // Let's check Airport first as it's likely already populated.
                const countriesRaw = await staticPrisma.airport.findMany({
                    select: { country: true, countryCode: true },
                    distinct: ['countryCode']
                });
                data = countriesRaw.map(c => ({ name: c.country, code: c.countryCode }));
                break;
            default:
                return res.status(400).json({ error: 'Invalid or missing type parameter' });
        }

        res.json(data);
    } catch (error) {
        console.error('Static Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch static data' });
    }
});

// GET /static/currencies
router.get('/currencies', async (req: Request, res: Response) => {
    try {
        const currs = await staticPrisma.currency.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' }
        });
        res.json(currs);
    } catch (error) {
        console.error('GET /static/currencies error', error);
        res.status(500).json({ error: 'Failed to fetch currencies' });
    }
});

export default router;
