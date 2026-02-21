#!/usr/bin/env node
/**
 * LiteAPI Hotel Details Import - Prisma Version
 * Imports hotel types, chains, and facilities into the database
 * 
 * Usage:
 *   npx tsx scripts/import-liteapi-details-prisma.ts           # Import all
 *   npx tsx scripts/import-liteapi-details-prisma.ts --types   # Import only types
 *   npx tsx scripts/import-liteapi-details-prisma.ts --chains  # Import only chains
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.services', override: true });

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LITEAPI_BASE_URL = process.env.LITEAPI_BASE_URL 
  ? process.env.LITEAPI_BASE_URL.replace(/\/$/, '') + '/v3.0'
  : 'https://api.liteapi.travel/v3.0';
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || '';

interface ImportResult {
  typesCreated: number;
  typesUpdated: number;
  chainsCreated: number;
  chainsUpdated: number;
}

async function fetchLiteAPI<T>(endpoint: string): Promise<T> {
  const response = await axios.get<any>(`${LITEAPI_BASE_URL}${endpoint}`, {
    headers: { 'X-API-Key': LITEAPI_API_KEY, 'Accept': 'application/json' },
    timeout: 60000,
  });
  return response.data?.data || response.data;
}

async function importHotelTypes(): Promise<{ created: number; updated: number }> {
  console.log('\n🏨 Importing hotel types...');
  const types = await fetchLiteAPI<any[]>('/data/hotelTypes');
  
  if (!types || types.length === 0) {
    console.log('   No types found');
    return { created: 0, updated: 0 };
  }
  
  let created = 0;
  let updated = 0;

  for (const type of types) {
    if (!type?.id || !type?.name) continue;
    
    try {
      const typeId = Number(type.id);
      
      // Check if exists by externalId
      const existing = await prisma.hotelType.findFirst({
        where: { externalId: typeId },
      });

      if (existing) {
        await prisma.hotelType.update({
          where: { id: existing.id },
          data: {
            name: type.name,
            metadata: JSON.stringify({ liteapiId: typeId }),
          },
        });
        updated++;
      } else {
        await prisma.hotelType.create({
          data: {
            name: type.name,
            externalId: typeId,
            metadata: JSON.stringify({ liteapiId: typeId }),
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`   Error importing type ${type.name}:`, (error as Error).message);
    }
  }

  console.log(`   ✅ Types: ${created} created, ${updated} updated`);
  return { created, updated };
}

async function importChains(): Promise<{ created: number; updated: number }> {
  console.log('\n🔗 Importing hotel chains...');
  const chains = await fetchLiteAPI<any[]>('/data/chains');
  
  if (!chains || chains.length === 0) {
    console.log('   No chains found');
    return { created: 0, updated: 0 };
  }
  
  let created = 0;
  let updated = 0;

  for (const chain of chains) {
    if (!chain?.id || !chain?.name) continue;
    
    try {
      const chainId = Number(chain.id);
      
      const existing = await prisma.hotelChain.findFirst({
        where: { externalId: chainId },
      });

      if (existing) {
        await prisma.hotelChain.update({
          where: { id: existing.id },
          data: {
            name: chain.name,
            metadata: JSON.stringify({ liteapiId: chainId }),
          },
        });
        updated++;
      } else {
        await prisma.hotelChain.create({
          data: {
            name: chain.name,
            externalId: chainId,
            metadata: JSON.stringify({ liteapiId: chainId }),
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`   Error importing chain ${chain.name}:`, (error as Error).message);
    }
  }

  console.log(`   ✅ Chains: ${created} created, ${updated} updated`);
  return { created, updated };
}

async function main() {
  const args = process.argv.slice(2);
  const includeTypes = args.includes('--types') || args.includes('--all') || args.length === 0;
  const includeChains = args.includes('--chains') || args.includes('--all') || args.length === 0;

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Hotel Details Import (Prisma)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   Base URL: ${LITEAPI_BASE_URL}`);
  console.log(`   Importing: ${includeTypes ? 'Types' : ''} ${includeChains ? 'Chains' : ''}`.trim() || 'None');

  if (!LITEAPI_API_KEY) {
    console.warn('\n⚠️  Warning: LITEAPI_API_KEY not set');
  }

  const result: ImportResult = {
    typesCreated: 0,
    typesUpdated: 0,
    chainsCreated: 0,
    chainsUpdated: 0,
  };

  try {
    if (includeTypes) {
      const typeResult = await importHotelTypes();
      result.typesCreated = typeResult.created;
      result.typesUpdated = typeResult.updated;
    }

    if (includeChains) {
      const chainResult = await importChains();
      result.chainsCreated = chainResult.created;
      result.chainsUpdated = chainResult.updated;
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                      IMPORT COMPLETED                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`   Hotel Types:    ${result.typesCreated} created, ${result.typesUpdated} updated`);
    console.log(`   Hotel Chains:   ${result.chainsCreated} created, ${result.chainsUpdated} updated`);
    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
