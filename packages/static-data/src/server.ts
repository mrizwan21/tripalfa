/**
 * Static Data API Server
 * 
 * Provides REST API endpoints for accessing static hotel and flight data.
 * Runs on port 3002 and provides direct database access for optimal performance.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { staticDataService } from "./static-data-service.js";

const app = express();
const PORT = process.env.STATIC_DATA_PORT || 3002;

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
        res.status(429).json({
            success: false,
            error: "Too many requests from this IP, please try again later."
        });
    }
}) as any;

app.use("/api/", limiter as any);

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "static-data-api",
        version: "1.1.0"
    });
});

// ============================================================================
// API ROUTES
// ============================================================================

// GET /api/countries - Get all countries
app.get("/api/countries", async (req, res) => {
    try {
        const { continent } = req.query;
        let countries;
        if (continent) {
            countries = await staticDataService.getCountriesByContinent(continent as string);
        } else {
            countries = await staticDataService.getCountries();
        }
        res.json({ success: true, data: countries, count: countries.length });
    } catch (error) {
        console.error("Error fetching countries:", error);
        res.status(500).json({ success: false, error: "Failed to fetch countries", message: getErrorMessage(error) });
    }
});

// GET /api/airports - Get airports lookup
app.get("/api/airports", async (req, res) => {
    try {
        const { q, limit } = req.query;
        const airports = await staticDataService.getAirports(q as string, limit ? parseInt(limit as string) : 50);
        res.json({ success: true, data: airports, count: airports.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch airports", message: getErrorMessage(error) });
    }
});

// GET /api/airlines - Get airlines lookup
app.get("/api/airlines", async (req, res) => {
    try {
        const { q, limit } = req.query;
        const airlines = await staticDataService.getAirlines(q as string, limit ? parseInt(limit as string) : 50);
        res.json({ success: true, data: airlines, count: airlines.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch airlines", message: getErrorMessage(error) });
    }
});

// GET /api/cities - Get cities lookup
app.get("/api/cities", async (req, res) => {
    try {
        const { q, countryCode, limit } = req.query;
        const cities = await staticDataService.getCities(q as string, countryCode as string, limit ? parseInt(limit as string) : 50);
        res.json({ success: true, data: cities, count: cities.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch cities", message: getErrorMessage(error) });
    }
});

// GET /api/loyalty-programs - Get loyalty programs
app.get("/api/loyalty-programs", async (req, res) => {
    try {
        const { type } = req.query;
        const programs = await staticDataService.getLoyaltyPrograms(type as string);
        res.json({ success: true, data: programs, count: programs.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch loyalty programs", message: getErrorMessage(error) });
    }
});

// GET /api/phone-codes - Get country phone codes
app.get("/api/phone-codes", async (req, res) => {
    try {
        const codes = await staticDataService.getPhoneCodes();
        res.json({ success: true, data: codes, count: codes.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch phone codes", message: getErrorMessage(error) });
    }
});

// GET /api/board-types - Get meal/board types
app.get("/api/board-types", async (req, res) => {
    try {
        const types = await staticDataService.getBoardTypes();
        res.json({ success: true, data: types, count: types.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch board types", message: getErrorMessage(error) });
    }
});

// GET /api/suggestions - Autocomplete suggestions (Airports + Cities)
app.get("/api/suggestions", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || String(q).length < 2) {
            res.json({ success: true, data: [] });
            return;
        }

        const [airports, cities] = await Promise.all([
            staticDataService.getAirports(q as string, 10),
            staticDataService.getCities(q as string, undefined, 10)
        ]);

        const results = [
            ...airports.map(a => ({ ...a, type: 'airport' })),
            ...cities.map(c => ({ ...c, type: 'city' }))
        ];

        res.json({ success: true, data: results, count: results.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch suggestions", message: getErrorMessage(error) });
    }
});

// GET /api/hotels - Get hotels with filtering
app.get("/api/hotels", async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            city, country, minStars, maxStars, minRating, maxRating, amenities,
            limit = 20, offset = 0, sortBy = "name", sortOrder = "ASC"
        } = req.query;

        const parseNumber = (val: any) => (val !== undefined && val !== "" ? Number(val) : undefined);
        const parseArray = (val: any) => (Array.isArray(val) ? val : typeof val === "string" ? val.split(",") : undefined);

        const filters = {
            city: city as string,
            country: country as string,
            minStars: parseNumber(minStars),
            maxStars: parseNumber(maxStars),
            minRating: parseNumber(minRating),
            maxRating: parseNumber(maxRating),
            amenities: parseArray(amenities)
        };

        const pagination = {
            limit: Math.min(100, parseNumber(limit) || 20),
            offset: parseNumber(offset) || 0,
            sortBy: sortBy as any,
            sortOrder: sortOrder as any
        };

        const result = await staticDataService.getHotels(filters as any, pagination as any);
        res.json({
            success: true,
            data: result.hotels,
            pagination: {
                total: result.total,
                limit: pagination.limit,
                offset: pagination.offset,
                pages: Math.ceil(result.total / pagination.limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch hotels", message: getErrorMessage(error) });
    }
});

// GET /api/hotels/:id - Get single hotel
app.get("/api/hotels/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await staticDataService.getHotelById(id);
        if (!hotel) return res.status(404).json({ success: false, error: "Hotel not found" });
        return res.json({ success: true, data: hotel });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Failed to fetch hotel", message: getErrorMessage(error) });
    }
});

// GET /api/hotels/:id/full - Get full hotel details
app.get("/api/hotels/:id/full", async (req, res) => {
    try {
        const { id } = req.params;
        const details = await staticDataService.getHotelFullDetails(id);
        if (!details) return res.status(404).json({ success: false, error: "Hotel not found" });
        return res.json({ success: true, data: details });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Failed to fetch hotel details", message: getErrorMessage(error) });
    }
});

// GET /api/cities - Get cities lookup
app.get("/api/cities", async (req, res) => {
    try {
        const { query, countryCode, limit = 30 } = req.query;
        const cities = await staticDataService.getCities(query as string, countryCode as string, Number(limit));
        res.json({ success: true, data: cities, count: cities.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch cities", message: getErrorMessage(error) });
    }
});

// GET /api/statistics - Get system statistics
app.get("/api/statistics", async (req, res) => {
    try {
        const stats = await staticDataService.getStatistics();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch statistics", message: getErrorMessage(error) });
    }
});

// GET /api/popular-destinations - Aggregated destinations
app.get("/api/popular-destinations", async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const destinations = await staticDataService.getPopularDestinations(Number(limit));
        res.json({ success: true, data: destinations });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch destinations", message: getErrorMessage(error) });
    }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.use((error: unknown, req: Request, res: Response, next: NextFunction): void => {
    console.error("Unhandled error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
});

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

export const startServer = async () => {
    try {
        await staticDataService.getCountries();
        console.log("✅ Database connection successful");
        app.listen(PORT, () => console.log(`🚀 Static Data Service running on port ${PORT}`));
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) startServer();
