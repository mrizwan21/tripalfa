import { PrismaClient } from '@prisma/client';

const dynamicPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const staticPrisma = new PrismaClient({
  datasources: { db: { url: process.env.STATIC_DATABASE_URL } }
});

async function main(): Promise<void> {
  console.log('Seeding Vendors & Suppliers (Dynamic DB - Neon)...');

  // 1. Create API Vendors
  const duffelVendor = await dynamicPrisma.apiVendor.upsert({
    where: { code: 'DUFFEL' },
    update: {},
    create: {
      name: 'Duffel',
      code: 'DUFFEL',
      baseUrl: 'https://api.duffel.com/air',
      authType: 'bearer',
      credentials: { apiKey: process.env.DUFFEL_API_KEY },
      isActive: true,
    }
  });

  const liteApiVendor = await dynamicPrisma.apiVendor.upsert({
    where: { code: 'LITEAPI' },
    update: {},
    create: {
      name: 'LiteAPI',
      code: 'LITEAPI',
      baseUrl: 'https://api.liteapi.jp/v1',
      authType: 'apiKey',
      credentials: { apiKey: process.env.LITEAPI_API_KEY },
      isActive: true,
    }
  });

  // 2. Create Suppliers mapped to these vendors
  await dynamicPrisma.supplier.upsert({
    where: { code: 'DUFFEL_FLIGHTS' },
    update: { isActive: true },
    create: {
      name: 'Duffel Flights',
      code: 'DUFFEL_FLIGHTS',
      category: 'flights',
      vendorId: duffelVendor.id,
      isActive: true,
      settings: { margin: 0, preferred: true }
    }
  });

  await dynamicPrisma.supplier.upsert({
    where: { code: 'LITEAPI_HOTELS' },
    update: { isActive: true },
    create: {
      name: 'LiteAPI Hotels',
      code: 'LITEAPI_HOTELS',
      category: 'hotels',
      vendorId: liteApiVendor.id,
      isActive: true,
      settings: { margin: 0, preferred: true }
    }
  });

  // 4. Create LOCAL Suppliers in Dynamic DB (as they are management configs)
  await dynamicPrisma.supplier.upsert({
    where: { code: 'LOCAL_FLIGHTS' },
    update: { isActive: true },
    create: {
      name: 'Domestic Flights (Static)',
      code: 'LOCAL_FLIGHTS',
      category: 'LOCAL',
      isActive: true,
      settings: { margin: 5 }
    }
  });

  await dynamicPrisma.supplier.upsert({
    where: { code: 'LOCAL_HOTELS' },
    update: { isActive: true },
    create: {
      name: 'Local Boutique Hotels',
      code: 'LOCAL_HOTELS',
      category: 'LOCAL',
      isActive: true,
      settings: { margin: 10 }
    }
  });

  // 3. Create Static Reference Data (Local DB)
  console.log('Seeding Static Reference Data (Local PG)...');

  await staticPrisma.airport.upsert({
    where: { iataCode: 'JFK' },
    update: {},
    create: {
      iataCode: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'USA',
      countryCode: 'US'
    }
  });

  await staticPrisma.airport.upsert({
    where: { iataCode: 'DXB' },
    update: {},
    create: {
      iataCode: 'DXB',
      name: 'Dubai International Airport',
      city: 'Dubai',
      country: 'UAE',
      countryCode: 'AE'
    }
  });

  await staticPrisma.airline.upsert({
    where: { iataCode: 'EK' },
    update: {},
    create: {
      iataCode: 'EK',
      name: 'Emirates',
      country: 'UAE',
      logoUrl: 'https://logo.clearbit.com/emirates.com'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await dynamicPrisma.$disconnect();
    await staticPrisma.$disconnect();
  });