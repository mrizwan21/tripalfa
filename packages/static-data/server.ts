require("dotenv").config();
const express = require("express");
const { HOTEL_STATIC_DATA, searchHotelDestinations } = require("./frontend.ts");
const { Pool } = require("pg");

const app = express();
const port = process.env.STATIC_API_PORT || 3022;

const pool = new Pool({
  connectionString: process.env.STATIC_RO_DATABASE_URL || 
    "postgresql://static_ro:static_secure_password_123!@localhost:5433/tripalfa_local",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.use(express.json());

// CORS for local frontend access
app.use((req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

async function queryDB(query: string, fallback: any[], params: any[] = []) {
  try {
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err: any) {
    console.warn("DB query failed, using fallback:", err.message);
    return fallback;
  }
}

// Airports
app.get("/airports", async (req: any, res: any) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const query = req.query.q as string || "";
  const data = await queryDB(
    `SELECT iata_code AS code, name, city_name AS city, iata_country_code AS country
     FROM flight.v_airports_full
     WHERE ($1::text = '' OR name ILIKE '%' || $1 || '%' OR city_name ILIKE '%' || $1 || '%' OR iata_code ILIKE '%' || $1 || '%')
     ORDER BY name
     LIMIT $2`,
    [
      { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "US" },
      { code: "LHR", name: "London Heathrow", city: "London", country: "GB" },
      { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
    ],
    [query, limit]
  );
  res.json({ success: true, data });
});

// Airlines
app.get("/airlines", async (req: any, res: any) => {
  const limit = parseInt(req.query.limit as string) || 200;
  const query = req.query.q as string || "";
  const data = await queryDB(
    `SELECT iata_code AS code, name
     FROM flight.airlines
     WHERE iata_code IS NOT NULL
       AND ($1::text = '' OR name ILIKE '%' || $1 || '%' OR iata_code ILIKE '%' || $1 || '%')
     ORDER BY name
     LIMIT $2`,
    [
      { code: "EK", name: "Emirates" },
      { code: "AA", name: "American Airlines" },
      { code: "BA", name: "British Airways" },
    ],
    [query, limit]
  );
  res.json({ success: true, data });
});

// Currencies
app.get("/currencies", async (req: any, res: any) => {
  const data = await queryDB(
    `SELECT code, name, symbol FROM shared.currencies ORDER BY name`,
    [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    ]
  );
  res.json({ success: true, data });
});

// Countries
app.get("/countries", async (req: any, res: any) => {
  const query = req.query.q as string || "";
  const data = await queryDB(
    `SELECT code, name
     FROM shared.countries
     WHERE ($1::text = '' OR name ILIKE '%' || $1 || '%' OR code ILIKE '%' || $1 || '%')
     ORDER BY name`,
    [
      { code: "US", name: "United States" },
      { code: "GB", name: "United Kingdom" },
      { code: "AE", name: "United Arab Emirates" },
    ],
    [query]
  );
  res.json({ success: true, data });
});

// Popular destinations
app.get("/popular-destinations", async (req: any, res: any) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await queryDB(
    `SELECT id, name, country, city, code, is_popular AS "isPopular"
     FROM hotel_destinations
     WHERE is_popular = true
     ORDER BY name
     LIMIT $1`,
    [
      { id: "DXB", name: "Dubai", country: "AE", city: "Dubai", isPopular: true },
      { id: "NYC", name: "New York", country: "US", city: "New York" },
      { id: "LON", name: "London", country: "GB", city: "London" },
    ],
    [limit]
  );
  res.json({ success: true, data });
});

// Static data endpoints
app.get("/amenities", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.AMENITIES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/board-types", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.BOARD_TYPES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/hotel-types", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.TYPES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/chains", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.CHAINS;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/star-ratings", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.STAR_RATINGS;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/room-types", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.ROOM_TYPES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/view-types", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.VIEW_TYPES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/payment-types", async (req: any, res: any) => {
  try {
    const data = await HOTEL_STATIC_DATA.PAYMENT_TYPES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/destinations", async (req: any, res: any) => {
  try {
    const query = req.query.q as string || "";
    const results = await searchHotelDestinations(query);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get("/health", (req: any, res: any) => {
  res.json({ status: "healthy", service: "static-data-api" });
});

app.listen(port, () => {
  console.log(`Static Data API listening on port ${port}`);
});
