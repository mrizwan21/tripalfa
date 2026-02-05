import 'dotenv/config';
import { staticPrisma } from '../db.js';

async function main() {
  console.log('Connecting and querying hotel counts...');

  try {
    const total = await staticPrisma.hotel.count();

    // gather counts by active status
    const activeCount = await staticPrisma.hotel.count({ where: { isActive: true } });
    const inactiveCount = await staticPrisma.hotel.count({ where: { isActive: false } });

    console.log(`Total hotels: ${total}`);
    console.log(`Active hotels: ${activeCount}`);
    console.log(`Inactive hotels: ${inactiveCount}\n`);

    console.log('\nSample hotels (5):');
    const samples = await staticPrisma.hotel.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        createdAt: true
      }
    });

    samples.forEach(h => console.log(JSON.stringify(h)));

  } catch (err) {
    console.error('Query failed:', err?.message || err);
    process.exitCode = 2;
  } finally {
    await staticPrisma.$disconnect();
  }
}

main();
