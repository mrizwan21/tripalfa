import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const CDN_BASE = 'https://raw.githubusercontent.com/svg-use-it/airline-logos/master/logos';
  
  const airlines = await prisma.airline.findMany({
    where: { is_active: true },
  });
  
  let updated = 0;
  for (const airline of airlines) {
    try {
      await prisma.airline.update({
        where: { id: airline.id },
        data: {
          logo_url: `${CDN_BASE}/${airline.iata_code.toLowerCase()}.png`
        }
      });
      updated++;
    } catch (e) {
      // Silent fail for individual airlines
    }
  }
  
  console.log(`✅ Updated ${updated}/${airlines.length} airlines with CDN URLs`);
}

main().finally(() => prisma.$disconnect());
