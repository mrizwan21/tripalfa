/**
 * Hotelston Monitoring Startup Script
 * Starts the monitoring system for Hotelston API availability
 * This script handles the database setup and then starts monitoring
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

console.log('='.repeat(60));
console.log('HOTELSTON MONITORING STARTUP');
console.log('='.repeat(60));

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Check if database directory exists
const databaseDir = path.join(currentDir, 'database');
if (!fs.existsSync(databaseDir)) {
  console.error('❌ Database directory not found. Please run this script from the project root.');
  process.exit(1);
}

console.log('✅ Database directory found');

// Check if Prisma is set up
const prismaDir = path.join(databaseDir, 'prisma');
if (!fs.existsSync(prismaDir)) {
  console.error('❌ Prisma directory not found in database folder');
  process.exit(1);
}

console.log('✅ Prisma directory found');

// Check if Prisma client is generated
const generatedDir = path.join(databaseDir, 'src', 'generated', 'prisma');
if (!fs.existsSync(generatedDir)) {
  console.log('⚠️  Prisma client not generated. Generating now...');
  
  try {
    process.chdir(databaseDir);
    console.log('Running: npx prisma generate');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
    process.chdir(currentDir);
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
} else {
  console.log('✅ Prisma client already generated');
}

// Check if database is running
console.log('Checking database connection...');
try {
  process.chdir(databaseDir);
  console.log('Running: npx prisma db pull');
  execSync('npx prisma db pull', { stdio: 'inherit' });
  console.log('✅ Database connection verified');
  process.chdir(currentDir);
} catch (error) {
  console.error('⚠️  Database connection check failed. This is expected if database is not running yet.');
  console.log('Database will be checked when the monitoring script starts.');
  process.chdir(currentDir);
}

// Now start the monitoring script
console.log('='.repeat(60));
console.log('STARTING HOTELSTON MONITORING');
console.log('='.repeat(60));

try {
  console.log('Starting setup-hotelston-import.ts...');
  execSync('node scripts/setup-hotelston-import.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start monitoring script:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}