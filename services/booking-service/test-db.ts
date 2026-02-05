import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env.test') });

async function test() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // Import the prisma client from the database module
    const { prisma } = await import(join(__dirname, 'src/database/index.js'));
    console.log('✅ Prisma client imported');

    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);

    await prisma.$disconnect();
    console.log('✅ Disconnected successfully');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
}

test();