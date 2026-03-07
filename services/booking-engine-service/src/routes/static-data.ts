import { Router, type Request, type Response } from "express";
import { staticDbPool } from "../static-db.js";

const router: Router = Router();

// ============================================================================
// Static Reference Data Routes
// ============================================================================
// These endpoints serve reference/static data from the local PostgreSQL staticdatabase.
// ============================================================================

// GET /api/static/countries - All countries
router.get("/countries", async (_req: Request, res: Response) => {
    try {
        const result = await staticDbPool.query("SELECT code, name FROM shared.countries ORDER BY name ASC");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Countries fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch countries" });
    }
});

// GET /api/static/currencies - All currencies
router.get("/currencies", async (_req: Request, res: Response) => {
    try {
        const result = await staticDbPool.query("SELECT code, name, code as symbol, decimal_precision as decimals FROM shared.currencies ORDER BY code ASC");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Currencies fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch currencies" });
    }
});

// GET /api/static/languages - Enabled languages
router.get("/languages", async (_req: Request, res: Response) => {
    try {
        const result = await staticDbPool.query("SELECT code, name FROM shared.languages WHERE is_enabled = true ORDER BY name ASC");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Languages fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch languages" });
    }
});

// GET /api/static/hotel-types - Hotel property types
router.get("/hotel-types", async (_req: Request, res: Response) => {
    try {
        const result = await staticDbPool.query("SELECT id, name FROM hotel.types ORDER BY name ASC");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Hotel types fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch hotel types" });
    }
});

// GET /api/static/hotel-amenities - Hotel facilities/amenities
router.get("/hotel-amenities", async (_req: Request, res: Response) => {
    try {
        const result = await staticDbPool.query("SELECT id, name, category, icon_url as iconUrl FROM hotel.facilities ORDER BY category ASC, name ASC");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Hotel amenities fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch hotel amenities" });
    }
});

// GET /api/static/destinations - City search
router.get("/destinations", async (req: Request, res: Response) => {
    try {
        const { q, countryCode } = req.query;
        let query = "SELECT id, name, name as city, country_code as countryCode, latitude, longitude, 'city' as type FROM hotel.cities";
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
            query += " WHERE " + where.join(" AND ");
        }
        query += " ORDER BY name ASC LIMIT 30";

        const result = await staticDbPool.query(query, params);
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] Destinations fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch destinations" });
    }
});

// GET /api/static/iata-codes - IATA airport codes
router.get("/iata-codes", async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        let query = "SELECT code, name, country_code as countryCode FROM hotel.iata_airports";
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` WHERE code ILIKE $1 OR name ILIKE $1`;
        }
        query += " ORDER BY code ASC LIMIT 30";

        const result = await staticDbPool.query(query, params);
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error: any) {
        console.error("[StaticData] IATA codes fetch error:", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch IATA codes" });
    }
});

export default router;
