#!/usr/bin/env node
/**
 * Database Validation Script
 * Checks if PostgreSQL tables have been populated with static data
 * replacing the removed CSV files.
 * 
 * Run with: npm run validate-db-migration
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tripalfa';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

interface TableStatus {
  table: string;
  count: number;
  expected: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';

async function checkTablePopulation(): Promise<void> {
  console.log(`\n${BLUE}${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);
  console.log(`${BLUE}${BOLD}DATABASE MIGRATION VALIDATION REPORT${RESET}\n`);
  console.log(`${BLUE}${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);

  const results: TableStatus[] = [];

  // Check Airlines
  try {
    const count = await prisma.airline.count({ where: { is_active: true } });
    results.push({
      table: 'Airline (active)',
      count,
      expected: 400,
      status: count > 100 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Airline table:', e);
  }

  // Check Airports
  try {
    const count = await prisma.airport.count({ where: { is_active: true } });
    results.push({
      table: 'Airport (active)',
      count,
      expected: 8000,
      status: count > 1000 ? 'OK' : count > 100 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Airport table:', e);
  }

  // Check Cities
  try {
    const count = await prisma.city.count({ where: { is_active: true } });
    results.push({
      table: 'City (active)',
      count,
      expected: 10000,
      status: count > 1000 ? 'OK' : count > 100 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking City table:', e);
  }

  // Check Countries
  try {
    const count = await prisma.country.count({ where: { isActive: true } });
    results.push({
      table: 'Country (active)',
      count,
      expected: 250,
      status: count > 200 ? 'OK' : count > 50 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Country table:', e);
  }

  // Check Currencies
  try {
    const count = await prisma.currency.count({ where: { isActive: true } });
    results.push({
      table: 'Currency (active)',
      count,
      expected: 180,
      status: count > 150 ? 'OK' : count > 50 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Currency table:', e);
  }

  // Check HotelAmenity
  try {
    const count = await prisma.hotelAmenity.count({ where: { isActive: true } });
    results.push({
      table: 'HotelAmenity (active)',
      count,
      expected: 200,
      status: count > 50 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking HotelAmenity table:', e);
  }

  // Check BoardType
  try {
    const count = await prisma.boardType.count({ where: { isActive: true } });
    results.push({
      table: 'BoardType (active)',
      count,
      expected: 10,
      status: count >= 5 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking BoardType table:', e);
  }

  // Check Destination
  try {
    const count = await prisma.destination.count({ where: { isActive: true } });
    results.push({
      table: 'Destination (active)',
      count,
      expected: 1000,
      status: count > 100 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Destination table:', e);
  }

  // Check Supplier
  try {
    const count = await prisma.supplier.count({ where: { status: true } });
    results.push({
      table: 'Supplier (active)',
      count,
      expected: 5,
      status: count >= 3 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking Supplier table:', e);
  }

  // Check HotelAmenitySupplierMapping
  try {
    const count = await prisma.hotelAmenitySupplierMapping.count();
    results.push({
      table: 'HotelAmenitySupplierMapping',
      count,
      expected: 1000,
      status: count > 100 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking HotelAmenitySupplierMapping table:', e);
  }

  // Check RoomAmenity
  try {
    const count = await prisma.roomAmenity.count({ where: { isActive: true } });
    results.push({
      table: 'RoomAmenity (active)',
      count,
      expected: 200,
      status: count > 50 ? 'OK' : count > 0 ? 'WARNING' : 'CRITICAL',
    });
  } catch (e) {
    console.warn('Error checking RoomAmenity table:', e);
  }

  // Display results
  console.log(`${BOLD}Reference Data Status:${RESET}\n`);

  let criticalCount = 0;
  let warningCount = 0;

  for (const result of results) {
    let statusIcon = '✅';

    if (result.status === 'WARNING') {
      statusIcon = '⚠️ ';
      warningCount++;
    } else if (result.status === 'CRITICAL') {
      statusIcon = '❌';
      criticalCount++;
    }

    const countStr = result.status === 'OK' ? `${GREEN}${result.count}${RESET}` : 
                     result.status === 'WARNING' ? `${YELLOW}${result.count}${RESET}` :
                     `${RED}${result.count}${RESET}`;

    console.log(`${statusIcon} ${BOLD}${result.table}${RESET}`);
    console.log(`   Count: ${countStr} (expected: ${result.expected})`);
    console.log('');
  }

  // Summary
  console.log(`${BLUE}${BOLD}SUMMARY${RESET}\n`);
  console.log(`OK:       ${GREEN}${results.filter((r) => r.status === 'OK').length}${RESET}`);
  console.log(`WARNING:  ${YELLOW}${warningCount}${RESET}`);
  console.log(`CRITICAL: ${RED}${criticalCount}${RESET}`);
  console.log('');

  // Check for airline logos in DB
  console.log(`\n${BLUE}${BOLD}AIRLINE LOGO STATUS${RESET}\n`);
  try {
    const airlinesWithLogos = await prisma.airline.count({
      where: { is_active: true, logo_url: { not: null } },
    });
    const totalAirlines = await prisma.airline.count({ where: { is_active: true } });

    if (totalAirlines === 0) {
      console.log(`${RED}❌ No active airlines in database${RESET}`);
    } else if (airlinesWithLogos === 0) {
      console.log(`${YELLOW}⚠️  Airlines present but NO logo URLs set${RESET}`);
      console.log(`   Active airlines: ${totalAirlines}`);
      console.log('   Action: Need to populate logo_url field (from CDN or supplier)\n');
    } else {
      console.log(`${GREEN}✅ ${airlinesWithLogos}/${totalAirlines} airlines have logo URLs set${RESET}`);
      // Sample some logo URLs
      const sample = await prisma.airline.findMany({
        where: { is_active: true, logo_url: { not: null } },
        take: 3,
        select: { iata_code: true, name: true, logo_url: true },
      });
      console.log('   Sample URLs:');
      for (const airline of sample) {
        console.log(`     • ${airline.iata_code}: ${airline.logo_url}`);
      }
      console.log('');
    }
  } catch (e) {
    console.warn('Error checking airline logos:', e);
  }

  // Recommendations
  if (criticalCount > 0 || warningCount > 0) {
    console.log(`\n${BLUE}${BOLD}RECOMMENDATIONS${RESET}\n`);

    if (results.some((r) => r.table.includes('Airline') && r.status !== 'OK')) {
      console.log(`${YELLOW}1. Populate Airlines data:${RESET}`);
      console.log('   npm run import-duffel-airlines\n');
    }

    if (results.some((r) => r.table.includes('Airport') && r.status !== 'OK')) {
      console.log(`${YELLOW}2. Populate Airports data:${RESET}`);
      console.log('   npm run import-duffel-airports\n');
    }

    if (results.some((r) => r.table.includes('City') && r.status !== 'OK')) {
      console.log(`${YELLOW}3. Populate Cities data:${RESET}`);
      console.log('   npm run import-duffel-cities\n');
    }

    if (results.some((r) => r.table.includes('Country') && r.status !== 'OK')) {
      console.log(`${YELLOW}4. Populate Reference data (countries, currencies):${RESET}`);
      console.log('   npm run import-liteapi-reference\n');
    }

    if (results.some((r) => r.table.includes('BoardType') && r.status !== 'OK')) {
      console.log(`${YELLOW}5. Seed initial data:${RESET}`);
      console.log('   npm run seed-suppliers\n');
    }

    console.log(`${BLUE}${BOLD}Full data import:${RESET}`);
    console.log('   npm run import-duffel\n');
  } else {
    console.log(`\n${GREEN}${BOLD}✅ All tables appear to be properly populated!${RESET}\n`);
  }

  console.log(`${BLUE}${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);
}

async function main(): Promise<void> {
  try {
    await checkTablePopulation();
  } catch (error) {
    console.error(`${RED}Validation failed:${RESET}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
