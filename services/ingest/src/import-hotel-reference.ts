/**
 * Hotel Reference Data Importer
 * 
 * Imports hotel reference data from CSV files into the static database.
 * 
 * Usage: 
 *   npx tsx services/ingest/src/import-hotel-reference.ts
 *   
 * Environment: Uses STATIC_DATABASE_URL from .env file (Docker Postgres)
 */

// IMPORTANT: Load dotenv BEFORE any other imports that use process.env
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

// Load .env file FIRST - this must happen before importing shared-database
config({ path: resolve(projectRoot, '.env') });

// Verify DATABASE_URL is loaded
console.log('STATIC_DATABASE_URL loaded:', !!process.env.STATIC_DATABASE_URL);
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

const CSV_DIR = '/Users/mohamedrizwan/Downloads/traductionUAE';

interface CategoryRow {
  seq_id: string;
  type: string;
  redflag: string;
  score: string;
  category: string;
  output_EN: string;
  output_SP: string;
  output_PT: string;
  output_FR: string;
  output_IT: string;
  output_DE: string;
  output_RU: string;
  output_IL: string;
  output_CN: string;
  output_IN: string;
}

interface SimpleRow {
  seq_id: string;
  score?: string;
  category?: string;
  output_EN: string;
  output_AE: string;
}

function parseCSV<T>(filename: string): T[] {
  const filePath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return [];
  }
  let fileContent = fs.readFileSync(filePath, 'utf-8');
  // Remove BOM if present
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1);
  }
  const records = csv.parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
  console.log(`Parsed ${records.length} rows from ${filename}`);
  return records as T[];
}

async function main() {
  // Dynamic import AFTER dotenv is loaded - this is crucial for process.env to be available
  const { prisma } = await import('@tripalfa/shared-database');
  
  console.log('Starting Hotel Reference Data Import...\n');
  const startTime = Date.now();
  
  try {
    // Import categories
    console.log('\nImporting Room Categories...');
    const catRows = parseCSV<CategoryRow>('category.csv');
    let catCount = 0;
    for (const row of catRows) {
      const seqId = row.seq_id?.trim();
      if (!seqId) continue;
      await prisma.roomCategory.upsert({
        where: { seqId },
        create: {
          seqId, 
          type: row.type || null, 
          redflag: row.redflag === '1',
          score: parseInt(row.score || '0') || 0, 
          category: row.category || null,
          nameEn: row.output_EN || null, 
          nameSp: row.output_SP || null,
          namePt: row.output_PT || null, 
          nameFr: row.output_FR || null,
          nameIt: row.output_IT || null, 
          nameDe: row.output_DE || null,
          nameRu: row.output_RU || null, 
          nameIl: row.output_IL || null,
          nameCn: row.output_CN || null, 
          nameIn: row.output_IN || null,
        },
        update: { 
          type: row.type || null, 
          redflag: row.redflag === '1', 
          score: parseInt(row.score || '0') || 0,
          nameEn: row.output_EN || null,
        },
      });
      catCount++;
    }
    console.log(`Categories: ${catCount}`);

    // Import policy terms
    console.log('\nImporting Policy Terms...');
    let ptCount = 0;
    
    const posRows = parseCSV<SimpleRow>('positron.csv');
    for (const row of posRows) {
      const seqId = row.seq_id?.trim();
      if (!seqId) continue;
      await prisma.policyTerm.upsert({
        where: { seqId },
        create: { seqId, type: 'positive', score: parseInt(row.score || '0') || 0, nameEn: row.output_EN || null, nameAe: row.output_AE || null },
        update: { nameEn: row.output_EN || null, nameAe: row.output_AE || null },
      });
      ptCount++;
    }
    
    const negRows = parseCSV<SimpleRow>('negatron.csv');
    for (const row of negRows) {
      const seqId = row.seq_id?.trim();
      if (!seqId) continue;
      await prisma.policyTerm.upsert({
        where: { seqId },
        create: { seqId, type: 'negative', score: parseInt(row.score || '0') || 0, nameEn: row.output_EN || null, nameAe: row.output_AE || null },
        update: { nameEn: row.output_EN || null, nameAe: row.output_AE || null },
      });
      ptCount++;
    }
    
    const assocRows = parseCSV<SimpleRow>('associatron.csv');
    for (const row of assocRows) {
      const seqId = row.seq_id?.trim();
      if (!seqId) continue;
      await prisma.policyTerm.upsert({
        where: { seqId },
        create: { seqId, type: 'association', score: parseInt(row.score || '0') || 0, nameEn: row.output_EN || null, nameAe: row.output_AE || null },
        update: { nameEn: row.output_EN || null, nameAe: row.output_AE || null },
      });
      ptCount++;
    }
    console.log(`Policy Terms: ${ptCount}`);

    // Import simple tables
    const tables: Array<{file: string; model: string; hasScore: boolean}> = [
      { file: 'board_score.csv', model: 'boardTypeScore', hasScore: true },
      { file: 'cancel_score.csv', model: 'cancelPolicy', hasScore: true },
      { file: 'floor_score.csv', model: 'floorType', hasScore: false },
      { file: 'bedroom_score.csv', model: 'bedroomType', hasScore: false },
      { file: 'plan_score.csv', model: 'ratePlan', hasScore: false },
      { file: 'paxusage_score.csv', model: 'paxUsageRule', hasScore: false },
      { file: 'refund_score.csv', model: 'refundPolicy', hasScore: true },
      { file: 'shared_score.csv', model: 'sharedAmenity', hasScore: true },
      { file: 'smoke_score.csv', model: 'smokingPolicy', hasScore: true },
      { file: 'parking_score.csv', model: 'parkingOption', hasScore: false },
      { file: 'membership_score.csv', model: 'membershipScore', hasScore: false },
      { file: 'internet_score.csv', model: 'internetOption', hasScore: false },
      { file: 'deposit_score.csv', model: 'depositOption', hasScore: false },
      { file: 'cooking_score.csv', model: 'cookingOption', hasScore: false },
      { file: 'marketing_score.csv', model: 'marketingTerm', hasScore: false },
      // Additional CSV files
      { file: 'accessible_score.csv', model: 'sharedAmenity', hasScore: true },
      { file: 'amenities_score.csv', model: 'sharedAmenity', hasScore: true },
      { file: 'balcony_score.csv', model: 'sharedAmenity', hasScore: true },
      { file: 'beds_score.csv', model: 'bedroomType', hasScore: false },
      { file: 'category_score.csv', model: 'roomCategory', hasScore: true },
    ];

    let total = catCount + ptCount;

    for (const table of tables) {
      const rows = parseCSV<SimpleRow>(table.file);
      let count = 0;
      for (const row of rows) {
        const seqId = row.seq_id?.trim();
        if (!seqId) continue;
        const data: any = { 
          seqId, 
          nameEn: row.output_EN || null, 
          nameAe: row.output_AE || null 
        };
        if (table.hasScore) data.score = parseInt(row.score || '0') || 0;
        
        await (prisma as any)[table.model].upsert({
          where: { seqId },
          create: data,
          update: { nameEn: data.nameEn, nameAe: data.nameAe },
        });
        count++;
      }
      console.log(`${table.file}: ${count}`);
      total += count;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(50));
    console.log(`Total records: ${total}`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(50));
    
    // Exit successfully - must call process.exit() because pg.Pool keeps event loop alive
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
