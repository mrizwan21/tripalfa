/**
 * LiteAPI Static Data Sync Script (Refined)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LITEAPI_API_KEY = "prod_1ca7e299-f889-4462-8e32-ce421ab66a93";
const LITEAPI_BASE_URL = "https://api.liteapi.travel/v3.0";
const DB_NAME = "staticdatabase";
const SQL_TMP_FILE = "/tmp/liteapi_sync.sql";

if (!LITEAPI_API_KEY) {
    process.exit(1);
}

const headers = {
    "X-API-Key": LITEAPI_API_KEY,
    "Content-Type": "application/json",
};

async function fetchLiteData(endpoint: string) {
    const url = endpoint.startsWith('http') ? endpoint : `${LITEAPI_BASE_URL}${endpoint}`;
    console.log(`Fetching from ${url}...`);
    const response = await fetch(url, { headers });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText} - ${error}`);
    }
    const json: any = await response.json();
    return json.data || json;
}

function runSqlBatch(queries: string[], batchSize = 100) {
    if (queries.length === 0) return;
    for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        fs.writeFileSync(SQL_TMP_FILE, 'BEGIN;\n' + batch.join('\n') + '\nCOMMIT;');
        try {
            execSync(`psql -h localhost -U postgres -d ${DB_NAME} -f ${SQL_TMP_FILE}`, { stdio: 'pipe' });
        } catch (error: any) {
            console.error(`Batch insertion failed at index ${i}. First query: ${batch[0]?.substring(0, 100)}...`);
            // If batch fails, try individual insertion for this batch to pin-point or bypass error
            if (batchSize > 1) {
                console.log("Retrying batch with smaller size...");
                runSqlBatch(batch, 1);
            } else {
                // console.error("Statement failed:", error.message);
            }
        }
    }
}

function esc(val: any): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return val.toString();
}

async function syncReferenceData() {
    // 1. Countries with Dialing Codes
    console.log("Syncing Countries and Dialing Codes...");
    const countries = await fetchLiteData("/data/countries");

    // Fetch dialing codes from a reliable public source
    let dialingCodeMap: Record<string, string> = {};
    try {
        const response = await fetch("https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json");
        const countryData = await response.json() as any[];
        countryData.forEach(c => {
            if (c.idd && c.idd.root) {
                const code = c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : "");
                dialingCodeMap[c.cca2] = code;
            }
        });
    } catch (err) {
        console.warn("Failed to fetch dialing codes, proceeding with names only.");
    }

    const countryQueries = countries.map((c: any) => {
        const dialing_code = dialingCodeMap[c.code] || null;
        return `
        INSERT INTO liteapi_countries (code, name, dialing_code, updated_at)
        VALUES (${esc(c.code)}, ${esc(c.name)}, ${esc(dialing_code)}, NOW())
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, dialing_code = EXCLUDED.dialing_code, updated_at = NOW();
    `});
    runSqlBatch(countryQueries);

    // 2. IATA Codes
    console.log("Syncing IATA Codes...");
    const iataCodes = await fetchLiteData("/data/iataCodes");
    const iataQueries = iataCodes.map((i: any) => `
    INSERT INTO liteapi_iata_codes (code, name, country_code, updated_at)
    VALUES (${esc(i.code)}, ${esc(i.name)}, ${esc(i.countryCode)}, NOW())
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, country_code = EXCLUDED.country_code, updated_at = NOW();
  `);
    runSqlBatch(iataQueries);

    // 3. Facilities
    console.log("Syncing Facilities...");
    const facilities = await fetchLiteData("/data/facilities");
    const facQueries = facilities.map((f: any) => `
    INSERT INTO liteapi_facilities (id, name, updated_at)
    VALUES (${esc(f.facility_id)}, ${esc(f.facility)}, NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
  `);
    runSqlBatch(facQueries);

    // 4. Hotel Types
    console.log("Syncing Hotel Types...");
    const types = await fetchLiteData("/data/hotelTypes");
    const typeQueries = types.map((t: any) => `
    INSERT INTO liteapi_hotel_types (id, name, updated_at)
    VALUES (${esc(t.id)}, ${esc(t.name)}, NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
  `);
    runSqlBatch(typeQueries);

    // 5. Chains
    console.log("Syncing Chains...");
    const chains = await fetchLiteData("/data/chains");
    const chainQueries = chains.map((c: any) => `
    INSERT INTO liteapi_chains (id, name, updated_at)
    VALUES (${esc(c.id)}, ${esc(c.name)}, NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
  `);
    runSqlBatch(chainQueries);

    // 6. Languages
    console.log("Syncing Languages...");
    const languages = await fetchLiteData("/data/languages");
    const langQueries = languages.map((l: any) => `
    INSERT INTO liteapi_languages (code, name, updated_at)
    VALUES (${esc(l.code)}, ${esc(l.name)}, NOW())
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
  `);
    runSqlBatch(langQueries);

    // 7. Currencies
    console.log("Syncing Currencies...");
    const currencies = await fetchLiteData("/data/currencies");
    const currQueries = currencies.map((c: any) => `
    INSERT INTO liteapi_currencies (code, name, updated_at)
    VALUES (${esc(c.code)}, ${esc(c.name)}, NOW())
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
  `);
    runSqlBatch(currQueries);
}

async function syncCities() {
    console.log("Syncing Cities...");
    const countries = await fetchLiteData("/data/countries");
    const targetCountries = ["US", "GB", "AE", "FR", "SA", "IN"];

    for (const country of countries) {
        if (!targetCountries.includes(country.code)) continue;

        console.log(`Fetching cities for ${country.name} (${country.code})...`);
        try {
            const result = await fetchLiteData(`/data/cities?countryCode=${country.code}`);
            const cities = Array.isArray(result) ? result : [];
            if (cities.length === 0) continue;

            const cityQueries = cities.map((c: any) => `
                INSERT INTO liteapi_cities (id, name, country_code, latitude, longitude, updated_at)
                VALUES (${esc(c.id)}, ${esc(c.name)}, ${esc(country.code)}, ${c.latitude || 'NULL'}, ${c.longitude || 'NULL'}, NOW())
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    latitude = EXCLUDED.latitude, 
                    longitude = EXCLUDED.longitude, 
                    updated_at = NOW();
            `);
            runSqlBatch(cityQueries);
        } catch (err) {
            console.error(`Failed to fetch cities for ${country.code}`);
        }
    }
}

async function syncHotels() {
    const targetCountries = ["US", "GB", "AE", "FR", "SA", "IN"];
    for (const countryCode of targetCountries) {
        const iataCodes = await fetchLiteData("/data/iataCodes");
        const majorCities = iataCodes.filter((i: any) => i.countryCode === countryCode && !!i.name).slice(0, 10);

        for (const city of majorCities) {
            console.log(`Syncing Hotels for ${city.name} (${city.code}), ${countryCode}...`);
            try {
                const hotels = await fetchLiteData(`/data/hotels?countryCode=${countryCode}&iataCode=${city.code}`);
                const hotelQueries = hotels.map((h: any) => `
          INSERT INTO liteapi_hotels (id, name, star_rating, hotel_type_id, chain_id, address, city, country_code, latitude, longitude, metadata, updated_at)
          VALUES (${esc(h.id)}, ${esc(h.name)}, ${h.starRating || 'NULL'}, ${esc(h.hotelTypeId)}, ${esc(h.chainId)}, ${esc(h.address)}, ${esc(h.city)}, ${esc(h.countryCode)}, ${h.latitude || 'NULL'}, ${h.longitude || 'NULL'}, ${esc(h)}, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name, 
            star_rating = EXCLUDED.star_rating,
            address = EXCLUDED.address,
            metadata = EXCLUDED.metadata,
            updated_at = NOW();
        `);
                runSqlBatch(hotelQueries);
            } catch (err) {
                // Silent error for specific city failures
            }
        }
    }
}

async function main() {
    try {
        await syncReferenceData();
        await syncCities();
        await syncHotels();
        console.log("LiteAPI sync completed successfully.");
        if (fs.existsSync(SQL_TMP_FILE)) fs.unlinkSync(SQL_TMP_FILE);
    } catch (error) {
        console.error("Sync failed:", error);
    }
}

main();
