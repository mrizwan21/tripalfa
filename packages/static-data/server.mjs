#!/usr/bin/env node
/**
 * Static Data API Server - ES Module version
 * Bypasses Kong Gateway for static data per architecture plan
 */

import express from "express";
import { Pool } from "pg";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.STATIC_API_PORT || 3022;

// Database pool (connection pooling)
const pool = new Pool({
  connectionString: process.env.STATIC_RO_DATABASE_URL || 
    "postgresql://static_ro:static_secure_password_123!@localhost:5433/tripalfa_local",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// Helper to handle DB queries with fallback
async function queryDB(query, fallback, params = []) {
  try {
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.warn("DB query failed, using fallback:", err.message);
    return fallback;
  }
}

// Static data endpoints
app.get("/amenities", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_amenities ORDER BY name",
    [
      { code: "WIFI", name: "Wi-Fi", is_popular: true },
      { code: "POOL", name: "Swimming Pool", is_popular: true },
      { code: "GYM", name: "Gym", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/board-types", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_board_types ORDER BY name",
    [
      { code: "RO", name: "Room Only" },
      { code: "BB", name: "Bed & Breakfast", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/hotel-types", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_types ORDER BY name",
    [
      { code: "HOTEL", name: "Hotel", is_popular: true },
      { code: "RESORT", name: "Resort", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/chains", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name FROM hotel_chains ORDER BY name",
    [
      { code: "MARRIOTT", name: "Marriott" },
      { code: "HILTON", name: "Hilton" },
    ]
  );
  res.json({ success: true, data });
});

app.get("/star-ratings", async (req, res) => {
  const data = await queryDB(
    "SELECT id, name, is_popular FROM hotel_star_ratings ORDER BY id",
    [
      { id: "3", name: "3 Star" },
      { id: "4", name: "4 Star", is_popular: true },
      { id: "5", name: "5 Star", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/room-types", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_room_types ORDER BY name",
    [
      { code: "STD", name: "Standard Room", is_popular: true },
      { code: "DLX", name: "Deluxe Room", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/view-types", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_view_types ORDER BY name",
    [
      { code: "CITY", name: "City View" },
      { code: "SEA", name: "Sea View", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/payment-types", async (req, res) => {
  const data = await queryDB(
    "SELECT code, name, is_popular FROM hotel_payment_types ORDER BY name",
    [
      { code: "PREPAID", name: "Prepaid", is_popular: true },
      { code: "PAY_AT_HOTEL", name: "Pay at Hotel", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

app.get("/destinations", async (req, res) => {
  const query = req.query.q || "";
  const data = await queryDB(
    `SELECT id, name, country, city, code, is_popular 
     FROM hotel_destinations 
     WHERE is_popular = true 
     ORDER BY name`,
    [
      { id: "DXB", name: "Dubai", country: "UAE", city: "Dubai", code: "DXB", isPopular: true },
      { id: "AUH", name: "Abu Dhabi", country: "UAE", city: "Abu Dhabi", code: "AUH", isPopular: true },
    ]
  );
  
  const filtered = query 
    ? data.filter(d => 
        d.name?.toLowerCase().includes(query.toLowerCase()) ||
        d.city?.toLowerCase().includes(query.toLowerCase()) ||
        d.country?.toLowerCase().includes(query.toLowerCase()) ||
        d.code?.toLowerCase().includes(query.toLowerCase())
      )
    : data;
    
  res.json({ success: true, data: filtered });
});

// Airports
app.get("/airports", async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const query = req.query.q || "";
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
app.get("/airlines", async (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  const query = req.query.q || "";
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
app.get("/currencies", async (req, res) => {
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
app.get("/countries", async (req, res) => {
  const query = req.query.q || "";
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
app.get("/popular-destinations", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
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

// Hotel amenities (alias for /amenities)
app.get("/hotel-amenities", async (req, res) => {
  const data = await queryDB(
    `SELECT code, name, is_popular FROM hotel_amenities ORDER BY name`,
    [
      { code: "WIFI", name: "Wi-Fi", is_popular: true },
      { code: "POOL", name: "Swimming Pool", is_popular: true },
      { code: "GYM", name: "Gym", is_popular: true },
    ]
  );
  res.json({ success: true, data });
});

// LiteAPI languages endpoint
app.get("/api/liteapi/languages", async (req, res) => {
  const data = await queryDB(
    `SELECT code, name FROM shared.languages ORDER BY name`,
    [
      { code: "en", name: "English" },
      { code: "ar", name: "Arabic" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "es", name: "Spanish" },
      { code: "zh", name: "Chinese" },
    ]
  );
  res.json({ success: true, data });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "static-data-api" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

app.listen(PORT, () => {
  console.log(`[Static Data API] Running on http://localhost:${PORT}`);
  console.log(`[Static Data API] Health: http://localhost:${PORT}/health`);
});
