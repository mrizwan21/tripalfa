import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Database connection configuration - try multiple connection strings
const connectionStrings = [
    process.env.STATIC_DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5433/staticdatabase',
    'postgresql://postgres@localhost:5433/staticdatabase',
    'postgresql://postgres:postgres@localhost:5432/tripalfa_local',
    'postgresql://postgres@localhost:5432/tripalfa_local'
].filter(Boolean) as string[];

let pool: pg.Pool | null = null;
let usedConnectionString: string | undefined;

async function createPool() {
    for (const connString of connectionStrings) {
        try {
            console.log(`📡 Trying connection: ${connString.replace(/:[^:]*@/, ':***@')}`);
            pool = new Pool({
                connectionString: connString,
                max: 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            // Test the connection
            const client = await pool.connect();
            client.release();
            usedConnectionString = connString;
            console.log(`✅ Connected successfully using: ${connString.replace(/:[^:]*@/, ':***@')}`);
            return;
        } catch (error) {
            console.log(`❌ Failed: ${(error as Error).message}`);
            if (pool) {
                await pool.end();
                pool = null;
            }
        }
    }

    throw new Error('Unable to connect to any database. Please check your database configuration.');
}

async function checkHotelCount() {
    if (!pool) return;

    console.log('🏨 Checking Hotel Import Status in Local Database\n');
    console.log('='.repeat(60));

    try {
        const client = await pool.connect();

        try {
            // Check if the hotel table exists
            const tableCheck = await client.query<{ exists: boolean }>(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'hotels'
                )
            `);

            if (!tableCheck.rows[0].exists) {
                console.log('❌ Hotel table does not exist in the database');
                console.log('   Make sure the static database is properly set up');
                return;
            }

            // Get total hotel count
            const countResult = await client.query<{ total: string }>('SELECT COUNT(*) as total FROM public.hotels');
            const totalHotels = parseInt(countResult.rows[0].total);

            console.log(`✅ Total Hotels Imported: ${totalHotels.toLocaleString()}`);

            // Get additional statistics
            const statsResult = await client.query<any>(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as with_ratings,
                    COUNT(CASE WHEN stars IS NOT NULL THEN 1 END) as with_stars,
                    COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as with_city,
                    COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as with_country,
                    AVG(rating) as avg_rating,
                    AVG(stars) as avg_stars
                FROM public.hotels
            `);

            const stats = statsResult.rows[0];

            console.log('\n📊 Detailed Statistics:');
            console.log(`   • Hotels with ratings: ${parseInt(stats.with_ratings).toLocaleString()}`);
            console.log(`   • Hotels with star ratings: ${parseInt(stats.with_stars).toLocaleString()}`);
            console.log(`   • Hotels with city info: ${parseInt(stats.with_city).toLocaleString()}`);
            console.log(`   • Hotels with country info: ${parseInt(stats.with_country).toLocaleString()}`);
            console.log(`   • Average rating: ${parseFloat(stats.avg_rating || 0).toFixed(2)}`);
            console.log(`   • Average stars: ${parseFloat(stats.avg_stars || 0).toFixed(2)}`);

            // Get country distribution
            const countryResult = await client.query<{ country: string, count: string }>(`
                SELECT 
                    country,
                    COUNT(*) as count
                FROM public.hotels
                WHERE country IS NOT NULL
                GROUP BY country
                ORDER BY count DESC
                LIMIT 10
            `);

            if (countryResult.rows.length > 0) {
                console.log('\n🌍 Top Countries by Hotel Count:');
                countryResult.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.country}: ${parseInt(row.count).toLocaleString()}`);
                });
            }

            // Get city distribution
            const cityResult = await client.query<{ city: string, count: string }>(`
                SELECT 
                    city,
                    COUNT(*) as count
                FROM public.hotels
                WHERE city IS NOT NULL
                GROUP BY city
                ORDER BY count DESC
                LIMIT 10
            `);

            if (cityResult.rows.length > 0) {
                console.log('\n🏙️  Top Cities by Hotel Count:');
                cityResult.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.city}: ${parseInt(row.count).toLocaleString()}`);
                });
            }

            // Check recent imports
            const recentResult = await client.query<{ import_date: string, count: string }>(`
                SELECT 
                    DATE(created_at) as import_date,
                    COUNT(*) as count
                FROM public.hotels
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY import_date DESC
                LIMIT 7
            `);

            if (recentResult.rows.length > 0) {
                console.log('\n📈 Recent Import Activity (Last 7 Days):');
                recentResult.rows.forEach(row => {
                    console.log(`   ${row.import_date}: ${parseInt(row.count).toLocaleString()} hotels`);
                });
            }

            console.log('\n' + '='.repeat(60));
            console.log('✅ Hotel count check completed successfully');

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Error checking hotel count:', (error as Error).message);

        const pgError = error as any;
        if (pgError.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('   • Make sure PostgreSQL is running on localhost:5433');
            console.log('   • Check if the static database exists');
            console.log('   • Verify your .env.local STATIC_DATABASE_URL setting');
        } else if (pgError.code === '3D000') {
            console.log('\n💡 Troubleshooting:');
            console.log('   • The static database may not exist');
            console.log('   • Run the database setup scripts first');
        } else if (pgError.code === '42P01') {
            console.log('\n💡 Troubleshooting:');
            console.log('   • The hotel schema or table may not exist');
            console.log('   • Run the import scripts to create the schema and data');
        }

        process.exit(1);
    } finally {
        if (pool) await pool.end();
    }
}

// Run the script
async function main() {
    try {
        await createPool();
        await checkHotelCount();
    } catch (error) {
        console.error('❌ Failed to check hotel count:', (error as Error).message);
        process.exit(1);
    }
}

main();
