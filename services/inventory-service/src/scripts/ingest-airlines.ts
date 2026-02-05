import 'dotenv/config';
import AmadeusClient from '../services/AmadeusClient.js';
import { staticPrisma } from '../db.js';

async function ingestAirlines() {
    console.log('Starting Airline Ingestion...');

    const majorAirlines = ['EK', 'QR', 'SQ', 'BA', 'AA', 'DL', 'UA', 'LH', 'AF', 'CX', 'JL', 'QF', 'EY', 'TK', 'VS', 'WY', 'SV'];
    const codesString = majorAirlines.join(',');

    try {
        const airlines = await AmadeusClient.getAirlines(codesString);

        if (!airlines) {
            console.log('No airlines returned.');
            return;
        }

        for (const airline of airlines) {
            const data = {
                iataCode: airline.iataCode,
                icaoCode: airline.icaoCode,
                name: airline.businessName || airline.commonName,
                country: '',
                isActive: true
            };

            await staticPrisma.airline.upsert({
                where: { iataCode: airline.iataCode },
                update: data,
                create: data
            });

            console.log(`Upserted Airline: ${airline.iataCode}`);
        }

    } catch (error) {
        console.error('Airline Ingestion Failed:', error);
    }

    console.log('Airline Ingestion Complete.');
    process.exit(0);
}

ingestAirlines();
