import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.STATIC_DATABASE_URL || process.env.DATABASE_URL } }
});

const DUFFEL_API_KEY = process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_PROD_API_KEY;

if (!DUFFEL_API_KEY) {
    console.error('DUFFEL_API_KEY is missing in .env');
    process.exit(1);
}

interface DuffelAirline {
    id: string;
    name: string;
    iata_code: string | null;
    logo_symbol_url: string | null;
    logo_lockup_url: string | null;
}

async function fetchAllAirlines(): Promise<DuffelAirline[]> {
    let allAirlines: DuffelAirline[] = [];
    let nextCard: string | null = null;

    console.log('Fetching airlines from Duffel...');

    do {
        try {
            const url = `https://api.duffel.com/air/airlines?limit=200${nextCard ? `&after=${nextCard}` : ''}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${DUFFEL_API_KEY}`,
                    'Duffel-Version': 'v2',
                }
            });

            const { data, meta } = response.data;
            allAirlines = [...allAirlines, ...data];
            nextCard = meta.after;

            console.log(`Fetched ${allAirlines.length} airlines so far...`);
        } catch (error: any) {
            console.error('Error fetching from Duffel:', error.response?.data || error.message);
            break;
        }
    } while (nextCard);

    return allAirlines;
}

async function main() {
    try {
        const duffelAirlines = await fetchAllAirlines();
        console.log(`Total airlines fetched: ${duffelAirlines.length}`);

        let upsertCount = 0;

        for (const airline of duffelAirlines) {
            // Prioritize official logo URLs
            const logoUrl = airline.logo_symbol_url || airline.logo_lockup_url;

            if (!airline.iata_code) continue;

            await prisma.airline.upsert({
                where: { iataCode: airline.iata_code },
                update: {
                    name: airline.name,
                    // Only update logo if we have a better one from Duffel
                    ...(logoUrl ? { logoUrl } : {}),
                    updatedAt: new Date()
                },
                create: {
                    iataCode: airline.iata_code,
                    name: airline.name,
                    logoUrl: logoUrl || `https://logo.clearbit.com/${airline.name.toLowerCase().replace(/\s+/g, '')}.com`, // Fallback only for creation
                    isActive: true
                }
            });
            upsertCount++;
            if (upsertCount % 50 === 0) process.stdout.write('.');
        }

        console.log(`\nSuccessfully upserted/updated ${upsertCount} airlines.`);

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
