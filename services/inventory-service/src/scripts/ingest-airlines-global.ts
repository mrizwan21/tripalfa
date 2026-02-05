import 'dotenv/config';
import DuffelClient from '../services/DuffelClient.js';
import AmadeusClient from '../services/AmadeusClient.js';
import { staticPrisma } from '../db.js';

async function ingestGlobalAirlines() {
    console.log('Starting Global Airline Ingestion (Multi-Supplier Incremental)...');

    // --- PART 1: DUFFEL (PRIMARY SOURCE) ---
    try {
        const airlines = await DuffelClient.getAirlines('prod');
        console.log(`Received ${airlines.length} airlines from Duffel.`);

        for (const airline of airlines) {
            if (!airline.iata_code) continue;

            const existing = await staticPrisma.airline.findUnique({ where: { iataCode: airline.iata_code } });

            const data = {
                iataCode: airline.iata_code,
                name: airline.name,
                logoUrl: airline.logo_symbol_url,
                isActive: true
            };

            if (!existing) {
                await staticPrisma.airline.create({ data });
            } else {
                // Duffel has good logos, ensure we have it
                if (!existing.logoUrl && airline.logo_symbol_url) {
                    await staticPrisma.airline.update({
                        where: { id: existing.id },
                        data: { logoUrl: airline.logo_symbol_url }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Duffel Airline Ingestion Failed:', error);
    }

    // --- PART 2: AMADEUS (INCREMENTAL ENRICHMENT) ---
    // Ensure we have ICAO codes or missing airlines from Amadeus
    const majorAirlines = ['EK', 'QR', 'SQ', 'BA', 'AA', 'DL', 'UA', 'LH', 'AF', 'CX', 'JL', 'QF', 'EY', 'TK', 'VS', 'WY', 'SV'];
    const codesString = majorAirlines.join(',');

    try {
        const amadeusAirlines = await AmadeusClient.getAirlines(codesString);
        if (amadeusAirlines) {
            console.log(`Checking ${amadeusAirlines.length} airlines from Amadeus for enrichment...`);

            for (const air of amadeusAirlines) {
                const iata = air.iataCode;
                if (!iata) continue;

                const existing = await staticPrisma.airline.findUnique({ where: { iataCode: iata } });

                if (!existing) {
                    // Add missing airline
                    await staticPrisma.airline.create({
                        data: {
                            iataCode: iata,
                            name: air.commonName || air.businessName,
                            icaoCode: air.icaoCode,
                            isActive: true
                        }
                    });
                    console.log(`[Amadeus] Added missing airline: ${iata}`);
                } else {
                    // Incremental: Add ICAO code if missing
                    if (!existing.icaoCode && air.icaoCode) {
                        await staticPrisma.airline.update({
                            where: { id: existing.id },
                            data: { icaoCode: air.icaoCode }
                        });
                        console.log(`[Amadeus] Added ICAO for ${iata}`);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Amadeus Airline Ingestion Failed', e);
    }

    console.log('Global Airline Ingestion Complete.');
    process.exit(0);
}

ingestGlobalAirlines();
