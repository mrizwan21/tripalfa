#!/usr/bin/env ts-node
/**
 * Rebuild Database Script
 *
 * This script helps rebuild the database from scratch based on the new design and code.
 * It performs the following steps:
 * 1. Validates environment variables
 * 2. Generates Prisma client
 * 3. Resets the database (with confirmation)
 * 4. Runs migrations
 * 5. Seeds initial data (if applicable)
 *
 * Usage:
 *   npx ts-node scripts/rebuild-database.ts [--skip-confirm] [--seed]
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const skipConfirm = args.includes('--skip-confirm');
const runSeed = args.includes('--seed');

interface DatabaseConfig {
  databaseUrl: string;
  dbName: string;
  environment: string;
}

function getEnvironment(): string {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'staging') return 'staging';
  return 'development';
}

function validateEnvironment(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  const environment = getEnvironment();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse database name from connection string
  let dbName = 'tripalfa';
  try {
    const url = new URL(databaseUrl);
    dbName = url.pathname.split('/')[1] || 'tripalfa';
  } catch (error) {
    console.warn('⚠️  Could not parse database name from DATABASE_URL');
  }

  return { databaseUrl, dbName, environment };
}

async function promptUser(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

function generatePrismaClient(): void {
  console.log('📦 Generating Prisma client...');
  try {
    execSync('npx prisma generate --schema=database/prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client');
    throw error;
  }
}

function resetDatabase(): void {
  console.log('🔄 Resetting database...');
  try {
    execSync('npx prisma db push --force-reset --schema=database/prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env },
    });
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset database');
    throw error;
  }
}

function runMigrations(): void {
  console.log('🚀 Running migrations...');
  try {
    // Note: Using db push for now as we don't have migration files
    execSync('npx prisma db push --schema=database/prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env },
    });
    console.log('✅ Migrations applied successfully');
  } catch (error) {
    console.error('❌ Failed to run migrations');
    throw error;
  }
}

function seedDatabase(): void {
  console.log('🌱 Seeding database...');
  try {
    // Check if seed script exists
    const seedPath = path.resolve(__dirname, '..', 'scripts', 'seed.ts');
    try {
      require.resolve(seedPath);
      execSync('npx ts-node scripts/seed.ts', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env },
      });
      console.log('✅ Database seeded successfully');
    } catch {
      console.warn('⚠️  No seed script found, skipping seed step');
    }
  } catch (error) {
    console.error('❌ Failed to seed database');
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    console.log('🔧 Database Rebuild Script Started\n');

    const config = validateEnvironment();
    console.log(`Environment: ${config.environment}`);
    console.log(`Database Name: ${config.dbName}\n`);

    // Generate Prisma client
    generatePrismaClient();

    // Check if user wants to reset database
    let shouldReset = skipConfirm;
    if (!skipConfirm) {
      console.log('\n⚠️  WARNING: This will delete all data in the database!');
      shouldReset = await promptUser('Do you want to reset the database? (y/n) ');
    }

    if (shouldReset) {
      resetDatabase();
    } else {
      runMigrations();
    }

    // Seed if requested
    if (runSeed) {
      seedDatabase();
    }

    console.log('\n✅ Database rebuild completed successfully!');
    console.log('📝 Next steps:');
    console.log('  1. Start services: npm run dev');
    console.log('  2. Access database studio: npm run db:studio');
  } catch (error) {
    console.error('\n❌ Database rebuild failed:', error);
    process.exit(1);
  }
}

main();
