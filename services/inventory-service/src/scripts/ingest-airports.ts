import 'dotenv/config';
import AmadeusClient from '../services/AmadeusClient.js';
import { staticPrisma } from '../db.js';

async function ingestAirports() {
    console.log('Starting Airport Ingestion...');

    // List of major cities/hubs to search airports for
    const hubs = ['LON', 'NYC', 'PAR', 'DXB', 'SIN', 'HKG', 'TYO', 'FRA', 'AMS', 'IST', 'LAX', 'SYD'];

    for (const hub of hubs) {
        console.log(`Fetching airports near ${hub}...`);
        try {
            const locations = await AmadeusClient.getAirports(hub);

            if (!locations || locations.length === 0) {
                console.log(`No airports found for ${hub}`);
                continue;
            }

            console.log(`Found ${locations.length} locations for ${hub}`);

            for (const loc of locations) {
                if (loc.subType !== 'AIRPORT') continue;

                const airportData = {
                    iataCode: loc.iataCode,
                    name: loc.name,
                    city: loc.address?.cityName || '',
                    country: loc.address?.countryName || '',
                    countryCode: loc.address?.countryCode || '',
                    latitude: loc.geoCode?.latitude,
                    longitude: loc.geoCode?.longitude,
                    timezone: loc.timeZoneOffset,
                    isActive: true
                };

                await staticPrisma.airport.upsert({
                    where: { iataCode: loc.iataCode },
                    update: airportData,
                    create: airportData
                });

                console.log(`Upserted ${loc.iataCode} - ${loc.name}`);
            }
        } catch (error) {
            console.error(`Error processing ${hub}:`, error);
        }
    }

    console.log('Airport Ingestion Complete.');
    process.exit(0);
}

ingestAirports();
