import 'dotenv/config';
import DuffelClient from '../services/DuffelClient.js';
import AmadeusClient from '../services/AmadeusClient.js';
import { staticPrisma } from '../db.js';

async function ingestGlobalAirports() {
    console.log('Starting Global Airport Ingestion (Multi-Supplier Incremental)...');

    // STRATEGY: 
    // 1. Duffel for Bulk/Global coverage (Airports List Endpoint)
    // 2. Amadeus for Enrichment & Missing Hubs (Incremental Merge)

    // --- PART 1: DUFFEL BULK INGESTION (PRIMARY BASE) ---
    try {
        const duffelAirports = await DuffelClient.getAirports('prod');
        console.log(`Retrieved ${duffelAirports.length} airports from Duffel.`);

        for (const apt of duffelAirports) {
            if (!apt.iata_code) continue;

            const existing = await staticPrisma.airport.findUnique({ where: { iataCode: apt.iata_code } });

            const data = {
                iataCode: apt.iata_code,
                name: apt.name,
                city: apt.city_name || '',
                country: '',
                countryCode: apt.country_code || '',
                latitude: apt.latitude,
                longitude: apt.longitude,
                timezone: apt.time_zone,
                isActive: true
            };

            if (!existing) {
                await staticPrisma.airport.create({ data });
            } else {
                // Incremental Update: Only fill critical missing fields or update standard ones
                // Duffel is trusted for Name/Coords
                await staticPrisma.airport.update({
                    where: { id: existing.id },
                    data: {
                        name: data.name, // Trust latest name
                        latitude: data.latitude || existing.latitude,
                        longitude: data.longitude || existing.longitude,
                        countryCode: data.countryCode || existing.countryCode,
                        timezone: data.timezone || existing.timezone
                    }
                });
            }
        }
        console.log('Duffel Airport Ingestion Complete.');

    } catch (err) {
        console.error('Duffel Ingestion Failed:', err);
    }

    // --- PART 2: AMADEUS ENRICHMENT (INCREMENTAL REFINEMENT) ---
    // Iterate Key Hubs to fill gaps (e.g. better City names, or airports Duffel missed)

    const GLOBAL_HUBS = [
        'ATL', 'PEK', 'DXB', 'HND', 'LAX', 'ORD', 'LHR', 'HKG', 'PVG', 'CDG',
        'AMS', 'DFW', 'CAN', 'FRA', 'IST', 'DEL', 'CGK', 'SIN', 'ICN', 'DEN',
        'BKK', 'JFK', 'KUL', 'MAD', 'SFO', 'CTU', 'CKG', 'BCN', 'YYZ', 'MUC'
    ];

    console.log('Starting Amadeus Enrichment...');
    for (const hub of GLOBAL_HUBS) {
        try {
            const locations = await AmadeusClient.getAirports(hub);
            if (!locations) continue;

            for (const loc of locations) {
                if (loc.subType !== 'AIRPORT') continue;

                const existing = await staticPrisma.airport.findUnique({ where: { iataCode: loc.iataCode } });

                if (!existing) {
                    // New Endpoint Data found by secondary source
                    await staticPrisma.airport.create({
                        data: {
                            iataCode: loc.iataCode,
                            name: loc.name,
                            city: loc.address?.cityName || '',
                            country: loc.address?.countryName || '',
                            countryCode: loc.address?.countryCode || '',
                            latitude: loc.geoCode?.latitude,
                            longitude: loc.geoCode?.longitude,
                            timezone: loc.timeZoneOffset,
                            isActive: true
                        }
                    });
                    console.log(`[Amadeus] Added missing airport: ${loc.iataCode}`);
                } else {
                    // Incremental Merge: Fill missing fields in Primary data
                    const updatePayload: any = {};

                    if (!existing.city && loc.address?.cityName) updatePayload.city = loc.address.cityName;
                    if (!existing.country && loc.address?.countryName) updatePayload.country = loc.address.countryName;
                    if (!existing.latitude && loc.geoCode?.latitude) updatePayload.latitude = loc.geoCode.latitude;

                    if (Object.keys(updatePayload).length > 0) {
                        await staticPrisma.airport.update({
                            where: { id: existing.id },
                            data: updatePayload
                        });
                        console.log(`[Amadeus] Enriched airport ${loc.iataCode} with: ${Object.keys(updatePayload).join(', ')}`);
                    }
                }
            }
        } catch (e) { /* ignore individual hub errors */ }
    }

    console.log('Global Airport Ingestion Finished.');
    process.exit(0);
}

ingestGlobalAirports();
