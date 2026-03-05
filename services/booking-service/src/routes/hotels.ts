/**
 * Hotel Routes - Hybrid Data Fetching
 * =====================================
 *
 * Strategy:
 * - Static data (95%): Postgres static DB
 * - Live data (rates): LITEAPI
 * - Fallback: LITEAPI if static DB has no data
 *
 * Endpoints:
 * - GET  /hotels/search - Search hotels with live rates
 * - GET  /hotels/:hotelId - Get hotel details
 * - GET  /hotels/facilities - Get all facilities/amenities
 * - POST /hotels/rates - Get live rates for specific hotels
 */

import { Router, Request, Response } from "express";
import HotelDataService from "../services/hotelDataService.js";

const router: Router = Router();

// Helper function to parse query params from Express req.query
// Express query params can be string, string[], or ParsedQs objects
function parseQueryString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

// ============================================================================
// GET /hotels/search - Search hotels
// ============================================================================

router.get("/search", async (req: Request, res: Response) => {
  try {
    const {
      location,
      city,
      country,
      countryCode,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      limit,
      offset,
      facilities,
      starRating,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.query;

    // Validate required params
    if (!checkin || !checkout) {
      return res.status(400).json({
        error: "checkin and checkout dates are required",
      });
    }

    // Parse children ages if provided
    let childrenAges: number[] | undefined;
    if (children) {
      if (Array.isArray(children)) {
        childrenAges = children.map(Number);
      } else if (typeof children === "string") {
        childrenAges = children.split(",").map(Number);
      }
    }

    // Parse facilities if provided
    let facilityIds: number[] | undefined;
    if (facilities) {
      if (Array.isArray(facilities)) {
        facilityIds = facilities.map(Number);
      } else if (typeof facilities === "string") {
        facilityIds = facilities.split(",").map(Number);
      }
    }

    // Parse star rating if provided
    let starRatings: number[] | undefined;
    if (starRating) {
      if (Array.isArray(starRating)) {
        starRatings = starRating.map(Number);
      } else if (typeof starRating === "string") {
        starRatings = starRating.split(",").map(Number);
      }
    }

    const result = await HotelDataService.searchHotels({
      location: String(location || city || ""),
      cityName: String(city || location || ""),
      countryCode: String(countryCode || country || ""),
      checkin: String(checkin),
      checkout: String(checkout),
      adults: adults ? Number(adults) : undefined,
      children: childrenAges,
      rooms: rooms ? Number(rooms) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      facilityIds,
      starRating: starRatings,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: String(sortBy || ""),
      sortOrder: String(sortOrder || "asc"),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Hotels] Search error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /hotels/search - POST version for complex queries
// ============================================================================

router.post("/search", async (req: Request, res: Response) => {
  try {
    const {
      location,
      cityName,
      countryCode,
      checkin,
      checkout,
      adults = 2,
      children,
      rooms = 1,
      limit = 20,
      offset = 0,
      facilityIds,
      starRating,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.body;

    // Validate required params
    if (!checkin || !checkout) {
      return res.status(400).json({
        error: "checkin and checkout dates are required",
      });
    }

    const result = await HotelDataService.searchHotels({
      location,
      cityName,
      countryCode,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      limit,
      offset,
      facilityIds,
      starRating,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Hotels] Search error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /hotels/rates - Get live rates for specific hotels
// ============================================================================

router.post("/rates", async (req: Request, res: Response) => {
  try {
    const {
      hotelIds,
      checkin,
      checkout,
      currency = "USD",
      guestNationality = "US",
      occupancies,
      adults = 2,
      children,
      maxRatesPerHotel = 3,
      timeout = 8,
    } = req.body;

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return res.status(400).json({
        error: "hotelIds array is required",
      });
    }

    if (!checkin || !checkout) {
      return res.status(400).json({
        error: "checkin and checkout dates are required",
      });
    }

    // Build occupancies if not provided
    let occs = occupancies;
    if (!occs) {
      let childrenAges: number[] = [];
      if (children) {
        childrenAges = Array.isArray(children)
          ? children.map(Number)
          : String(children).split(",").map(Number);
      }
      occs = [
        {
          adults: Number(adults),
          children: childrenAges,
        },
      ];
    }

    const ratesMap = await HotelDataService.getLiveRates({
      hotelIds,
      checkin,
      checkout,
      currency,
      guestNationality,
      occupancies: occs,
      maxRatesPerHotel,
      timeout,
    });

    // Convert Map to object for JSON response
    const rates: Record<string, any> = {};
    ratesMap.forEach((value, key) => {
      rates[key] = value;
    });

    res.json({
      success: true,
      rates,
      hotelCount: ratesMap.size,
    });
  } catch (error: any) {
    console.error("[Hotels] Get rates error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /hotels/facilities - Get all facilities/amenities
// ============================================================================

router.get("/facilities/list", async (req: Request, res: Response) => {
  try {
    const facilities = await HotelDataService.getFacilities();

    res.json({
      success: true,
      facilities,
      count: facilities.length,
    });
  } catch (error: any) {
    console.error("[Hotels] Get facilities error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /hotels/filters/options - Get filter options for UI
// ============================================================================

router.get("/filters/options", async (req: Request, res: Response) => {
  try {
    // Get facilities from DB
    const facilities = await HotelDataService.getFacilities();

    // Return filter options for UI components
    res.json({
      success: true,
      filters: {
        starRating: [
          { value: 5, label: "5 Stars" },
          { value: 4, label: "4 Stars" },
          { value: 3, label: "3 Stars" },
          { value: 2, label: "2 Stars" },
          { value: 1, label: "1 Star" },
        ],
        priceRange: {
          min: 0,
          max: 10000,
          step: 50,
        },
        facilities: facilities.map((f) => ({
          value: f.id,
          label: f.name,
        })),
        sortOptions: [
          { value: "price", label: "Price", defaultOrder: "asc" },
          { value: "rating", label: "Rating", defaultOrder: "desc" },
          { value: "name", label: "Name", defaultOrder: "asc" },
        ],
      },
    });
  } catch (error: any) {
    console.error("[Hotels] Get filter options error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /hotels/:hotelId - Get hotel details
// ============================================================================

router.get("/:hotelId", async (req: Request, res: Response) => {
  try {
    const hotelId = String(req.params.hotelId);
    const { checkin, checkout, adults, children } = req.query;

    // Parse children ages if provided
    let childrenAges: number[] | undefined;
    if (children) {
      if (Array.isArray(children)) {
        childrenAges = children.map(Number);
      } else if (typeof children === "string") {
        childrenAges = children.split(",").map(Number);
      }
    }

    const result = await HotelDataService.getHotelDetails(hotelId, {
      checkin: parseQueryString(checkin),
      checkout: parseQueryString(checkout),
      adults: adults ? Number(adults) : undefined,
      children: childrenAges,
    });

    if (!result.hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Hotels] Get hotel error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
