# Code Citations

## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
```


## License: Apache-2.0
https://github.com/CleverCloud/clever-tools/blob/2bef57ce30d07982296c0b10c462979079eedf43/src/models/interact.js

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
    console.log('\n
```


## License: MIT
https://github.com/langchain-ai/langchainjs/blob/d6e25af137873493d30bdf5732d46b842e421ffa/examples/src/use_cases/human_in_the_loop/accept-feedback.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
    console.log('\n
```


## License: unknown
https://github.com/rabiddroid/langchain-ts-demo/blob/5cf43c3648b55b385286838aaec4f7b7a71c8adc/src/prompt.ts

```
I see the issue - I need to create the files using a different method. Let me provide you with the content in a way you can copy directly into the files. First, let me create them one by one:

## **Step 1: Create `scripts/audit-neon-static-data.ts`**

Copy the entire content below and create a new file called `scripts/audit-neon-static-data.ts`:

```typescript
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditNeonDatabase() {
  try {
    console.log('\n🔍 AUDITING NEON DATABASE FOR STATIC DATA\n');
    console.log('='.repeat(75));
    
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables in Neon: ${allTables.rows.length}\n`);
    
    const staticTableResults: any[] = [];
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        if (result.rows.length > 0 && result.rows[0].count > 0) {
          staticTableResults.push({
            table,
            rowCount: parseInt(result.rows[0].count),
            hasData: true,
          });
        } else {
          staticTableResults.push({
            table,
            rowCount: 0,
            hasData: false,
          });
        }
      } catch (err: any) {
        staticTableResults.push({
          table,
          rowCount: 0,
          hasData: false,
          error: 'Table does not exist',
        });
      }
    }
    
    const tablesWithData = staticTableResults.filter(t => t.hasData);
    const tablesEmpty = staticTableResults.filter(t => !t.hasData && !t.error);
    const tablesNotFound = staticTableResults.filter(t => t.error);
    
    console.log('⚠️  STATIC DATA TABLES WITH DATA IN NEON:');
    console.log('='.repeat(75));
    
    if (tablesWithData.length === 0) {
      console.log('✅ NO PROBLEMATIC DATA FOUND\n');
      console.log('All static data tables are either empty or do not contain data.\n');
    } else {
      console.log(`\n❌ Found ${tablesWithData.length} static data table(s) with data:\n`);
      tablesWithData.forEach((t) => {
        console.log(
          `  ❌ ${t.table.padEnd(40)} ${t.rowCount.toString().padStart(10)} rows`
        );
      });
      console.log('');
    }
    
    console.log('✅ STATIC DATA TABLES THAT ARE EMPTY:');
    console.log('='.repeat(75));
    console.log(`${tablesEmpty.length} table(s) exist but are empty.\n`);
    
    console.log('⚪ STATIC DATA TABLES NOT FOUND:');
    console.log('='.repeat(75));
    console.log(`${tablesNotFound.length} table(s) do not exist.\n`);
    
    console.log('📋 SUMMARY:');
    console.log('='.repeat(75));
    console.log(`Total checked: ${STATIC_DATA_TABLES.length}`);
    console.log(`✅ Empty/Safe: ${tablesEmpty.length}`);
    console.log(`⚪ Not found: ${tablesNotFound.length}`);
    console.log(`❌ Contains data: ${tablesWithData.length}\n`);
    
    if (tablesWithData.length > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('='.repeat(75));
      console.log('Static data must be removed from Neon.\n');
      console.log('Run: npm run cleanup:neon\n');
      process.exit(1);
    } else {
      console.log('✅ STATUS: Your Neon database is clean!\n');
      process.exit(0);
    }
    
  } catch (err: any) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditNeonDatabase();
```

## **Step 2: Create `scripts/cleanup-neon-static-data.ts`**

```typescript
import 'dotenv/config';
import pg from 'pg';
import * as readline from 'readline';

const { Pool } = pg;

const STATIC_DATA_TABLES = [
  'hotelston_countries',
  'hotelston_cities',
  'hotelston_hotel_chains',
  'hotelston_hotel_facilities',
  'hotelston_hotel_types',
  'canonical_hotels',
  'canonical_flight_routes',
  'canonical_hotel_translations',
  'canonical_room_types',
  'aircraft',
  'airlines',
  'airport_terminals',
  'airports',
  'hotel_chains',
  'hotel_facilities',
  'hotel_types',
  'hotel_images',
  'hotel_base_rates',
  'hotel_room_types',
  'hotel_supplier_references',
  'flight_routes',
  'flight_schedules',
  'flight_base_prices',
  'countries',
  'cities',
  'currencies',
  'languages',
  'regions',
  'amenities',
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function cleanupNeonStaticData() {
  try {
    console.log('
🧹 CLEANING UP STATIC DATA FROM NEON DATABASE
');
    console.log('='.repeat(75));
    
    const answer = await askQuestion(
      '⚠️  This will DELETE all static data from your Neon database. Are you sure? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.
');
      process.exit(0);
    }
    
    console.log('
🔄 Starting cleanup process...
');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const table of STATIC_DATA_TABLES) {
      try {
        console.log();
        await pool.query();
        deletedCount++;
      } catch (err: any) {
        console.log();
        errorCount++;
      }
    }
    
    console.log('
📋 CLEANUP SUMMARY:');
    console.log('='.repeat(75));
    console.log();
    console.log();
    console.log();
    
    if (errorCount === 0) {
      console.log('✅ All static data has been successfully removed from Neon!
');
      process.exit(0);
    } else {
      console.log('⚠️  Cleanup completed with some errors. Please check the output above.
');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('
❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupNeonStaticData();icData() {
  try {
    console.log('\n
```

