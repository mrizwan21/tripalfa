/**
 * sync-duffel.ts
 * ------------------------------------
 * Fetches all Duffel static reference data and upserts into the flight schema:
 *
 * 1.  flight.airlines            — /air/airlines     (cursor-paginated)
 * 2.  flight.aircraft            — /air/aircraft     (cursor-paginated)
 * 3.  flight.cities              — /air/cities       (cursor-paginated)
 * 4.  flight.airports            — /air/airports     (cursor-paginated, FK to cities)
 * 5.  flight.loyalty_programmes  — /air/loyalty_programmes
 * 6.  flight.places              — merged from airports + cities already in DB
 *
 * All Duffel lists use cursor-based pagination: after=<cursor>.
 */

import * as dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";
import { createDuffelClient, get } from "./utils/http";
import { query, closePool } from "./utils/db";
import { createLogger } from "./utils/logger";
import type { AxiosInstance } from "axios";

const log = createLogger("Duffel");
const _CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 5);
const PAGE_LIMIT = 200;

// ---- Types ----------------------------------------------------

interface DuffelMeta {
  after?: string;
  before?: string;
  limit: number;
}
interface DuffelListResponse<T> {
  data: T[];
  meta: DuffelMeta;
}
interface DuffelObjectResponse<T> {
  data: T;
}

interface DuffelAirline {
  id: string;
  name: string;
  iata_code: string | null;
  logo_symbol_url: string | null;
  logo_lockup_url: string | null;
  conditions_of_carriage_url: string | null;
}

interface DuffelAircraft {
  id: string;
  name: string;
  iata_code: string | null;
}

interface DuffelCity {
  id: string;
  name: string;
  iata_code: string;
  iata_country_code: string;
  airports?: DuffelAirport[];
}

interface DuffelAirport {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string | null;
  iata_city_code: string | null;
  city_name: string | null;
  iata_country_code: string;
  latitude: number | null;
  longitude: number | null;
  time_zone: string | null;
  city?: DuffelCity | null;
}

interface DuffelLoyaltyProgramme {
  id: string;
  name: string;
  alliance: string | null;
  logo_url: string | null;
  owner_airline_id: string | null;
  programme_type?: "flight" | "hotel";
}

// ---- Pagination helper ----------------------------------------

async function* paginateDuffel<T>(
  client: AxiosInstance,
  path: string,
): AsyncGenerator<T[]> {
  let after: string | undefined;
  while (true) {
    const params: Record<string, unknown> = { limit: PAGE_LIMIT };
    if (after) params.after = after;
    const resp = await get<DuffelListResponse<T>>(client, path, params);
    yield resp.data ?? [];
    if (resp.meta?.after) {
      after = resp.meta.after;
    } else {
      break;
    }
  }
}

// ---- Sync functions -------------------------------------------

async function syncAirlines(client: AxiosInstance): Promise<void> {
  log.info("Syncing airlines...");
  let total = 0;
  for await (const page of paginateDuffel<DuffelAirline>(
    client,
    "/air/airlines",
  )) {
    for (const a of page) {
      await query(
        `INSERT INTO flight.airlines (id, iata_code, name, logo_symbol_url, logo_lockup_url, conditions_of_carriage_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET
           iata_code                  = EXCLUDED.iata_code,
           name                       = EXCLUDED.name,
           logo_symbol_url            = EXCLUDED.logo_symbol_url,
           logo_lockup_url            = EXCLUDED.logo_lockup_url,
           conditions_of_carriage_url = EXCLUDED.conditions_of_carriage_url,
           updated_at                 = NOW()`,
        [
          a.id,
          a.iata_code || null,
          a.name,
          a.logo_symbol_url || null,
          a.logo_lockup_url || null,
          a.conditions_of_carriage_url || null,
        ],
      );
      total++;
    }
  }
  log.success(`Airlines: upserted ${total}`);
}

async function syncAircraft(client: AxiosInstance): Promise<void> {
  log.info("Syncing aircraft...");
  let total = 0;
  for await (const page of paginateDuffel<DuffelAircraft>(
    client,
    "/air/aircraft",
  )) {
    for (const a of page) {
      await query(
        `INSERT INTO flight.aircraft (id, iata_code, name)
         VALUES ($1,$2,$3)
         ON CONFLICT (id) DO UPDATE SET
           iata_code  = EXCLUDED.iata_code,
           name       = EXCLUDED.name,
           updated_at = NOW()`,
        [a.id, a.iata_code || null, a.name],
      );
      total++;
    }
  }
  log.success(`Aircraft: upserted ${total}`);
}

async function syncCities(client: AxiosInstance): Promise<void> {
  log.info("Syncing Duffel cities...");
  let total = 0;
  for await (const page of paginateDuffel<DuffelCity>(client, "/air/cities")) {
    for (const c of page) {
      await query(
        `INSERT INTO flight.cities (id, iata_code, name, iata_country_code)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
           iata_code         = EXCLUDED.iata_code,
           name              = EXCLUDED.name,
           iata_country_code = EXCLUDED.iata_country_code`,
        [c.id, c.iata_code, c.name, c.iata_country_code],
      );
      total++;
    }
  }
  log.success(`Duffel cities: upserted ${total}`);
}

async function syncAirports(client: AxiosInstance): Promise<void> {
  log.info("Syncing airports...");
  let total = 0;
  for await (const page of paginateDuffel<DuffelAirport>(
    client,
    "/air/airports",
  )) {
    for (const a of page) {
      // Determine city_id FK: look up flight.cities by iata_city_code
      const cityRows = await query<{ id: string }>(
        `SELECT id FROM flight.cities WHERE iata_code = $1 LIMIT 1`,
        [a.iata_city_code ?? a.iata_code],
      );
      const cityId = cityRows[0]?.id ?? null;

      await query(
        `INSERT INTO flight.airports (id, iata_code, icao_code, name, iata_city_code, iata_country_code, city_name, latitude, longitude, time_zone, city_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           iata_code         = EXCLUDED.iata_code,
           icao_code         = EXCLUDED.icao_code,
           name              = EXCLUDED.name,
           iata_city_code    = EXCLUDED.iata_city_code,
           iata_country_code = EXCLUDED.iata_country_code,
           city_name         = EXCLUDED.city_name,
           latitude          = EXCLUDED.latitude,
           longitude         = EXCLUDED.longitude,
           time_zone         = EXCLUDED.time_zone,
           city_id           = EXCLUDED.city_id,
           updated_at        = NOW()`,
        [
          a.id,
          a.iata_code,
          a.icao_code || null,
          a.name,
          a.iata_city_code || null,
          a.iata_country_code,
          a.city_name || null,
          a.latitude ?? null,
          a.longitude ?? null,
          a.time_zone || null,
          cityId,
        ],
      );
      total++;
    }
  }
  log.success(`Airports: upserted ${total}`);
}

async function syncLoyaltyProgrammes(client: AxiosInstance): Promise<void> {
  log.info("Syncing loyalty programmes...");
  let total = 0;
  for await (const page of paginateDuffel<DuffelLoyaltyProgramme>(
    client,
    "/air/loyalty_programmes",
  )) {
    for (const p of page) {
      // Duffel /air/loyalty_programmes returns flight programmes by default
      const programmeType = p.programme_type ?? "flight";
      await query(
        `INSERT INTO flight.loyalty_programmes (id, name, alliance, logo_url, owner_airline_id, programme_type)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET
           name             = EXCLUDED.name,
           alliance         = EXCLUDED.alliance,
           logo_url         = EXCLUDED.logo_url,
           owner_airline_id = EXCLUDED.owner_airline_id,
           programme_type   = EXCLUDED.programme_type,
           updated_at       = NOW()`,
        [
          p.id,
          p.name,
          p.alliance || null,
          p.logo_url || null,
          p.owner_airline_id || null,
          programmeType,
        ],
      );
      total++;
    }
  }
  log.success(`Loyalty programmes: upserted ${total}`);
}

async function populatePlaces(): Promise<void> {
  log.info("Populating flight.places from airports + cities...");

  // Insert all airports into places
  const airportResult = await query(
    `INSERT INTO flight.places (id, type, iata_code, icao_code, name, iata_city_code, city_name, iata_country_code, latitude, longitude, time_zone)
     SELECT id, 'airport', iata_code, icao_code, name, iata_city_code, city_name, iata_country_code, latitude, longitude, time_zone
     FROM flight.airports
     ON CONFLICT (id) DO UPDATE SET
       iata_code         = EXCLUDED.iata_code,
       icao_code         = EXCLUDED.icao_code,
       name              = EXCLUDED.name,
       iata_city_code    = EXCLUDED.iata_city_code,
       city_name         = EXCLUDED.city_name,
       iata_country_code = EXCLUDED.iata_country_code,
       latitude          = EXCLUDED.latitude,
       longitude         = EXCLUDED.longitude,
       time_zone         = EXCLUDED.time_zone,
       updated_at        = NOW()
     RETURNING id`,
  );

  // Insert all cities into places
  const cityResult = await query(
    `INSERT INTO flight.places (id, type, iata_code, name, iata_country_code)
     SELECT id, 'city', iata_code, name, iata_country_code
     FROM flight.cities
     ON CONFLICT (id) DO UPDATE SET
       iata_code         = EXCLUDED.iata_code,
       name              = EXCLUDED.name,
       iata_country_code = EXCLUDED.iata_country_code,
       updated_at        = NOW()
     RETURNING id`,
  );

  log.success(
    `Places: ${airportResult.length} airports + ${cityResult.length} cities`,
  );
}

// ---- Main entry -----------------------------------------------

export async function syncDuffel(): Promise<void> {
  const accessToken = process.env.DUFFEL_API_KEY;
  if (!accessToken) throw new Error("DUFFEL_API_KEY is not set");

  const httpClient = createDuffelClient(accessToken);

  log.info("Starting Duffel static data sync...");

  await syncAirlines(httpClient);
  await syncAircraft(httpClient);
  await syncCities(httpClient);
  await syncAirports(httpClient); // must run after cities (FK)
  await syncLoyaltyProgrammes(httpClient);
  await populatePlaces();

  log.success("Duffel sync complete!");
}

if (require.main === module) {
  syncDuffel()
    .then(() => closePool())
    .catch((err: unknown) => {
      log.error((err as Error).message);
      process.exit(1);
    });
}
