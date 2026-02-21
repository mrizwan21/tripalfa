#!/usr/bin/env node
/**
 * Seed script for importing nationalities from GitHub gist
 * Data source: https://gist.github.com/marijn/274449
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
} else {
  // Try parent directory (when running from database/)
  const parentEnvPath = path.resolve(process.cwd(), '../.env.services');
  if (fs.existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
    console.log(`Loaded environment from: ${parentEnvPath}`);
  } else {
    console.warn('No .env file found, using default database URL');
  }
}

// Now import the modules that depend on environment variables
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma with pg adapter
// Prefer STATIC_DATABASE_URL for local development, then DATABASE_URL
const connectionString = process.env.STATIC_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';
console.log(`Using database: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NATIONALITIES_URL =
  'https://gist.githubusercontent.com/marijn/274449/raw/e81cffe517836e326497d3c359c84bf4b0bd098b/nationalities.txt';

// Mapping of nationality names to ISO 3166-1 alpha-2 country codes
const nationalityToCountryCode: Record<string, string> = {
  Afghan: 'AF',
  Albanian: 'AL',
  Algerian: 'DZ',
  American: 'US',
  Andorran: 'AD',
  Angolan: 'AO',
  Antiguans: 'AG',
  Argentinean: 'AR',
  Armenian: 'AM',
  Australian: 'AU',
  Austrian: 'AT',
  Azerbaijani: 'AZ',
  Bahamian: 'BS',
  Bahraini: 'BH',
  Bangladeshi: 'BD',
  Barbadian: 'BB',
  Barbudans: 'AG',
  Batswana: 'BW',
  Belarusian: 'BY',
  Belgian: 'BE',
  Belizean: 'BZ',
  Beninese: 'BJ',
  Bhutanese: 'BT',
  Bolivian: 'BO',
  Bosnian: 'BA',
  Brazilian: 'BR',
  British: 'GB',
  Bruneian: 'BN',
  Bulgarian: 'BG',
  Burkinabe: 'BF',
  Burmese: 'MM',
  Burundian: 'BI',
  Cambodian: 'KH',
  Cameroonian: 'CM',
  Canadian: 'CA',
  'Cape Verdean': 'CV',
  'Central African': 'CF',
  Chadian: 'TD',
  Chilean: 'CL',
  Chinese: 'CN',
  Colombian: 'CO',
  Comoran: 'KM',
  Congolese: 'CG',
  'Costa Rican': 'CR',
  Croatian: 'HR',
  Cuban: 'CU',
  Cypriot: 'CY',
  Czech: 'CZ',
  Danish: 'DK',
  Djibouti: 'DJ',
  Dominican: 'DO',
  Dutch: 'NL',
  'East Timorese': 'TL',
  Ecuadorean: 'EC',
  Egyptian: 'EG',
  Emirian: 'AE',
  'Equatorial Guinean': 'GQ',
  Eritrean: 'ER',
  Estonian: 'EE',
  Ethiopian: 'ET',
  Fijian: 'FJ',
  Filipino: 'PH',
  Finnish: 'FI',
  French: 'FR',
  Gabonese: 'GA',
  Gambian: 'GM',
  Georgian: 'GE',
  German: 'DE',
  Ghanaian: 'GH',
  Greek: 'GR',
  Grenadian: 'GD',
  Guatemalan: 'GT',
  Guinean: 'GN',
  Guyanese: 'GY',
  Haitian: 'HT',
  Herzegovinian: 'BA',
  Honduran: 'HN',
  Hungarian: 'HU',
  Icelander: 'IS',
  Indian: 'IN',
  Indonesian: 'ID',
  Iranian: 'IR',
  Iraqi: 'IQ',
  Irish: 'IE',
  Israeli: 'IL',
  Italian: 'IT',
  Ivorian: 'CI',
  Jamaican: 'JM',
  Japanese: 'JP',
  Jordanian: 'JO',
  Kazakh: 'KZ',
  Kenyan: 'KE',
  Kiribati: 'KI',
  Kuwaiti: 'KW',
  Kyrgyz: 'KG',
  Laotian: 'LA',
  Latvian: 'LV',
  Lebanese: 'LB',
  Liberian: 'LR',
  Libyan: 'LY',
  Liechtensteiner: 'LI',
  Lithuanian: 'LT',
  Luxembourgish: 'LU',
  Macedonian: 'MK',
  Malagasy: 'MG',
  Malawian: 'MW',
  Malaysian: 'MY',
  Maldivian: 'MV',
  Malian: 'ML',
  Maltese: 'MT',
  Marshallese: 'MH',
  Mauritanian: 'MR',
  Mauritian: 'MU',
  Mexican: 'MX',
  Micronesian: 'FM',
  Moldovan: 'MD',
  Monacan: 'MC',
  Mongolian: 'MN',
  Moroccan: 'MA',
  Mosotho: 'LS',
  Motswana: 'BW',
  Mozambican: 'MZ',
  Namibian: 'NA',
  Nauruan: 'NR',
  Nepalese: 'NP',
  'New Zealander': 'NZ',
  Nicaraguan: 'NI',
  Nigerian: 'NG',
  Nigerien: 'NE',
  'North Korean': 'KP',
  'Northern Irish': 'GB',
  Norwegian: 'NO',
  Omani: 'OM',
  Pakistani: 'PK',
  Palauan: 'PW',
  Panamanian: 'PA',
  'Papua New Guinean': 'PG',
  Paraguayan: 'PY',
  Peruvian: 'PE',
  Polish: 'PL',
  Portuguese: 'PT',
  Qatari: 'QA',
  Romanian: 'RO',
  Russian: 'RU',
  Rwandan: 'RW',
  'Saint Lucian': 'LC',
  Salvadoran: 'SV',
  Samoan: 'WS',
  'San Marinese': 'SM',
  'Sao Tomean': 'ST',
  Saudi: 'SA',
  Scottish: 'GB',
  Senegalese: 'SN',
  Serbian: 'RS',
  Seychellois: 'SC',
  'Sierra Leonean': 'SL',
  Singaporean: 'SG',
  Slovakian: 'SK',
  Slovenian: 'SI',
  'Solomon Islander': 'SB',
  Somali: 'SO',
  'South African': 'ZA',
  'South Korean': 'KR',
  Spanish: 'ES',
  'Sri Lankan': 'LK',
  Sudanese: 'SD',
  Surinamer: 'SR',
  Swazi: 'SZ',
  Swedish: 'SE',
  Swiss: 'CH',
  Syrian: 'SY',
  Taiwanese: 'TW',
  Tajik: 'TJ',
  Tanzanian: 'TZ',
  Thai: 'TH',
  Togolese: 'TG',
  Tongan: 'TO',
  Trinidadian: 'TT',
  Tunisian: 'TN',
  Turkish: 'TR',
  Tuvaluan: 'TV',
  Ugandan: 'UG',
  Ukrainian: 'UA',
  Uruguayan: 'UY',
  Uzbek: 'UZ',
  Venezuelan: 'VE',
  Vietnamese: 'VN',
  Welsh: 'GB',
  Yemeni: 'YE',
  Zambian: 'ZM',
  Zimbabwean: 'ZW',
};

async function main() {
  // Check Node.js version for global fetch support (requires Node 18+)
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersion < 18) {
    throw new Error(`Node.js version 18 or higher is required for global fetch support. Current version: ${process.versions.node}`);
  }

  console.log('Fetching nationalities from GitHub gist...');

  const response = await fetch(NATIONALITIES_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch nationalities: ${response.statusText}`);
  }

  const text = await response.text();
  const nationalities = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log(`Found ${nationalities.length} nationalities to import`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Track used codes to detect duplicates
  const usedCodes = new Set<string>();

  for (const nationality of nationalities) {
    // Generate a code from the nationality name (first 2-3 letters uppercase)
    let code = nationalityToCountryCode[nationality] || nationality.substring(0, 3).toUpperCase();

    // Handle potential duplicate codes by appending a number
    if (usedCodes.has(code)) {
      let suffix = 1;
      while (usedCodes.has(`${code}${suffix}`)) {
        suffix++;
      }
      code = `${code}${suffix}`;
      console.warn(`Duplicate code detected for "${nationality}", using: ${code}`);
    }
    usedCodes.add(code);

    try {
      // Check if record exists first for accurate created/updated tracking
      const existing = await prisma.nationality.findUnique({
        where: { code },
        select: { id: true },
      });

      await prisma.nationality.upsert({
        where: { code },
        create: {
          code,
          name: nationality,
          nameNormalized: nationality.toLowerCase(),
          demonym: nationality,
          adjective: nationality,
          countryCode: nationalityToCountryCode[nationality] || null,
          isActive: true,
        },
        update: {
          name: nationality,
          nameNormalized: nationality.toLowerCase(),
          demonym: nationality,
          adjective: nationality,
          countryCode: nationalityToCountryCode[nationality] || null,
        },
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing nationality "${nationality}": ${errorMessage}`);

      // Check if this is a connection error that should stop the process
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect')) {
        console.error('Database connection error detected. Stopping import.');
        throw error;
      }

      skipped++;
    }
  }

  console.log(`\nImport completed:`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total processed: ${nationalities.length}`);
}

main()
  .catch((error) => {
    console.error('Error importing nationalities:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Cast to any because pg Pool types may vary with Prisma adapter
    await (pool as any).end();
  });
