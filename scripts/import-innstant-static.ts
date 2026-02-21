#!/usr/bin/env node
/**
 * Innstant Static Data Importer
 * 
 * Imports countries and currencies from Innstant Static Data API
 * into the canonical database structure.
 * 
 * Usage: npx tsx scripts/import-innstant-static.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.services');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Innstant API Configuration
const STATIC_DATA_URL = 'https://static-data.innstant-servers.com';
const API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface InnstantCountry {
  id: string;
  name: string;
  continent: string;
  region: string;
  regions?: Array<{ code: string; name: string }>;
  countryCurrency: string;
}

interface InnstantCurrency {
  currencyId: string;
  name: string;
  sign: string | null;
  active: number;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

async function importCountries(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching countries from Innstant API...');

  try {
    const response = await axios.get<InnstantCountry[]>(`${STATIC_DATA_URL}/countries`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
      timeout: 60000,
    });

    const countries = response.data;
    result.total = countries.length;

    console.log(`   Fetched ${countries.length} countries`);

    for (const country of countries) {
      try {
        // Check if country already exists
        const existing = await prisma.destination.findUnique({
          where: { code: country.id },
        });

        if (existing) {
          // Update existing country (only basic fields that exist in the model)
          await prisma.destination.update({
            where: { id: existing.id },
            data: {
              name: country.name,
              nameNormalized: country.name?.toLowerCase(),
              destinationType: 'country',
              level: 0,
              countryCode: country.id,
              countryName: country.name,
              iataCountryCode: country.id,
            },
          });
          result.updated++;
        } else {
          // Create new country
          await prisma.destination.create({
            data: {
              code: country.id,
              name: country.name,
              nameNormalized: country.name?.toLowerCase(),
              destinationType: 'country',
              level: 0,
              countryCode: country.id,
              countryName: country.name,
              iataCountryCode: country.id,
            },
          });
          result.created++;
        }

        // Import regions as destinations
        if (country.regions && country.regions.length > 0) {
          for (const region of country.regions) {
            try {
              const regionCode = `${country.id}-${region.code}`;
              const existingRegion = await prisma.destination.findUnique({
                where: { code: regionCode },
              });

              if (!existingRegion) {
                await prisma.destination.create({
                  data: {
                    code: regionCode,
                    name: region.name,
                    nameNormalized: region.name?.toLowerCase(),
                    destinationType: 'region',
                    level: 1,
                    countryCode: country.id,
                    countryName: country.name,
                    stateCode: region.code,
                    stateName: region.name,
                  },
                });
              }
            } catch {
              // Skip region errors
            }
          }
        }
      } catch (error) {
        result.failed++;
        console.error(`   Error processing country ${country.id}:`, error);
      }
    }

    console.log(`   ✅ Countries: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching countries:', error);
    throw error;
  }

  return result;
}

async function importCurrencies(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching currencies from Innstant API...');

  try {
    const response = await axios.get<InnstantCurrency[]>(`${STATIC_DATA_URL}/currencies`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
      timeout: 60000,
    });

    const currencies = response.data;
    result.total = currencies.length;

    console.log(`   Fetched ${currencies.length} currencies`);

    for (const currency of currencies) {
      try {
        // Skip inactive currencies
        if (!currency.active) {
          result.skipped++;
          continue;
        }

        // Check if currency already exists
        const existing = await prisma.currency.findUnique({
          where: { code: currency.currencyId },
        });

        if (existing) {
          // Update existing currency
          await prisma.currency.update({
            where: { code: currency.currencyId },
            data: {
              name: currency.name,
              symbol: currency.sign || currency.currencyId,
            },
          });
          result.updated++;
        } else {
          // Create new currency
          await prisma.currency.create({
            data: {
              code: currency.currencyId,
              name: currency.name,
              symbol: currency.sign || currency.currencyId,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
        console.error(`   Error processing currency ${currency.currencyId}:`, error);
      }
    }

    console.log(`   ✅ Currencies: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching currencies:', error);
    throw error;
  }

  return result;
}

async function updateSupplierStatus(status: string, records?: number): Promise<void> {
  await prisma.supplier.upsert({
    where: { code: 'innstant' },
    update: {
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      lastSyncRecords: records,
    },
    create: {
      code: 'innstant',
      name: 'Innstant Travel',
      type: 'hotel',
      status: 'active',
      apiBaseUrl: STATIC_DATA_URL,
      apiKey: API_KEY,
      syncEnabled: true,
      syncInterval: 86400,
      rateLimitPerMin: 60,
      rateLimitPerDay: 10000,
      features: {
        hotels: true,
        availability: true,
        realtime: true,
        staticData: true,
      },
      metadata: {
        description: 'Global hotel distribution platform',
        website: 'https://www.innstant.com',
      },
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      lastSyncRecords: records,
    },
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        Innstant Static Data Import                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    // Import countries
    const countryResult = await importCountries();

    // Import currencies
    const currencyResult = await importCurrencies();

    // Update supplier status
    const totalRecords = countryResult.created + countryResult.updated + currencyResult.created + currencyResult.updated;
    await updateSupplierStatus('success', totalRecords);

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                        IMPORT SUMMARY                            ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║ Countries: ${String(countryResult.created).padStart(5)} created, ${String(countryResult.updated).padStart(5)} updated, ${String(countryResult.failed).padStart(5)} failed ║`);
    console.log(`║ Currencies: ${String(currencyResult.created).padStart(4)} created, ${String(currencyResult.updated).padStart(4)} updated, ${String(currencyResult.failed).padStart(4)} failed ║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝');

    // Get final counts
    const [totalDestinations, totalCurrencies] = await Promise.all([
      prisma.destination.count(),
      prisma.currency.count(),
    ]);

    console.log('\n📊 Database Totals:');
    console.log(`   Destinations: ${totalDestinations}`);
    console.log(`   Currencies: ${totalCurrencies}`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    await updateSupplierStatus('failed', 0);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
