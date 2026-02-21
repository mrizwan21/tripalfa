#!/usr/bin/env node
/**
 * CLI Entry Point for Static Data Import
 * 
 * Usage:
 *   npm run import-static -- hotelbeds-hotels --limit=100
 *   npm run import-static -- hotelbeds-hotels --incremental
 *   npm run import-static -- hotelbeds-hotels --from=2024-01-01 --to=2024-01-31
 *   npm run import-static -- giata-hotels --limit=1000
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script for reliable path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

// Load environment variables from multiple .env files (in order of priority)
config({ path: resolve(projectRoot, '.env.services') });
config({ path: resolve(projectRoot, '.env.local') });
config({ path: resolve(projectRoot, '.env') });

// Debug: Log loaded credentials
console.log('LITEAPI_API_KEY loaded:', !!process.env.LITEAPI_API_KEY);

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('import-static')
  .description('Import static data from various suppliers')
  .version('1.0.0');

// Hotelbeds import command
program
  .command('hotelbeds-hotels')
  .description('Import hotels from Hotelbeds API')
  .option('-l, --limit <number>', 'Maximum number of hotels to import', '1000')
  .option('-i, --incremental', 'Run incremental import (last 24 hours)')
  .option('--from <date>', 'Import from date (YYYY-MM-DD)')
  .option('--to <date>', 'Import to date (YYYY-MM-DD)')
  .option('--dry-run', 'Run without making changes')
  .option('-b, --batch-size <number>', 'Batch size for API calls', '100')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nHotelbeds Hotel Import\n'));
    
    const { HotelbedsImporter } = await import('./hotelbeds-importer.js');
    const importer = new HotelbedsImporter();
    
    try {
      const importOptions = {
        limit: parseInt(options.limit, 10),
        incremental: options.incremental,
        from: options.from,
        to: options.to,
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize, 10),
      };
      
      console.log('Options:', importOptions);
      console.log('');
      
      if (options.incremental) {
        await importer.importIncremental(options.from);
      } else {
        await importer.importHotels(importOptions);
      }
    } finally {
      await importer.disconnect();
    }
  });

// GIATA import command
program
  .command('giata-hotels')
  .description('Import hotels from GIATA multi-code API')
  .option('-l, --limit <number>', 'Maximum number of hotels to import', '1000')
  .option('--dry-run', 'Run without making changes')
  .option('-b, --batch-size <number>', 'Batch size for API calls', '100')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nGIATA Hotel Import\n'));
    console.log(chalk.yellow('GIATA importer not yet implemented'));
    // TODO: Implement GIATA importer
  });

// LITEAPI import commands
program
  .command('liteapi-all')
  .description('Import ALL static data from LITEAPI (hotels, reference data, reviews) - FULL DATA by default')
  .option('-l, --limit <number>', 'Maximum number of records to import per type (0 = all)', '0')
  .option('--dry-run', 'Run without making changes')
  .option('-b, --batch-size <number>', 'Batch size for API calls', '500')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nLITEAPI Full Static Data Import\n'));
    
    const { LiteApiImporter } = await import('./liteapi-importer.js');
    const importer = new LiteApiImporter();
    
    try {
      const limit = parseInt(options.limit, 10);
      const importOptions = {
        limit: limit === 0 ? undefined : limit, // undefined means no limit
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize, 10),
      };
      
      console.log('Options:', { ...importOptions, limit: importOptions.limit ?? 'ALL' });
      console.log('');
      
      await importer.importAll(importOptions);
    } finally {
      await importer.disconnect();
    }
  });

program
  .command('liteapi-hotels')
  .description('Import ALL hotels from LITEAPI - FULL DATA by default')
  .option('-l, --limit <number>', 'Maximum number of hotels to import (0 = all)', '0')
  .option('--dry-run', 'Run without making changes')
  .option('-b, --batch-size <number>', 'Batch size for API calls', '500')
  .option('-i, --incremental', 'Run incremental import')
  .option('--from <date>', 'Import from date (YYYY-MM-DD)')
  .option('--to <date>', 'Import to date (YYYY-MM-DD)')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nLITEAPI Hotel Import\n'));
    
    const { LiteApiImporter } = await import('./liteapi-importer.js');
    const importer = new LiteApiImporter();
    
    try {
      const limit = parseInt(options.limit, 10);
      const importOptions = {
        limit: limit === 0 ? undefined : limit, // undefined means no limit
        incremental: options.incremental,
        from: options.from,
        to: options.to,
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize, 10),
      };
      
      console.log('Options:', { ...importOptions, limit: importOptions.limit ?? 'ALL' });
      console.log('');
      
      await importer.importHotels(importOptions);
    } finally {
      await importer.disconnect();
    }
  });

program
  .command('liteapi-reviews')
  .description('Import hotel reviews from LITEAPI (imports ALL hotels by default)')
  .option('-l, --limit <number>', 'Maximum number of hotels to fetch reviews for (0 = all)', '0')
  .option('--dry-run', 'Run without making changes')
  .option('--batch-size <number>', 'Batch size for processing', '100')
  .option('--reviews-per-hotel <number>', 'Maximum reviews to fetch per hotel', '10')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nLITEAPI Hotel Reviews Import\n'));
    
    const { LiteApiImporter } = await import('./liteapi-importer.js');
    const importer = new LiteApiImporter();
    
    try {
      const limit = parseInt(options.limit, 10);
      const importOptions = {
        limit: limit === 0 ? undefined : limit, // undefined means no limit
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize, 10),
        reviewsPerHotel: parseInt(options.reviewsPerHotel, 10),
      };
      
      console.log('Options:', { ...importOptions, limit: importOptions.limit ?? 'ALL' });
      console.log('');
      
      await importer.importReviews(importOptions);
    } finally {
      await importer.disconnect();
    }
  });

program
  .command('liteapi-room-types')
  .description('Import room types from LITEAPI hotel details endpoint (imports ALL hotels by default)')
  .option('-l, --limit <number>', 'Maximum number of hotels to fetch room types for (0 = all)', '0')
  .option('--dry-run', 'Run without making changes')
  .option('--batch-size <number>', 'Batch size for processing', '100')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nLITEAPI Room Types Import\n'));
    
    const { LiteApiImporter } = await import('./liteapi-importer.js');
    const importer = new LiteApiImporter();
    
    try {
      const limit = parseInt(options.limit, 10);
      const importOptions = {
        limit: limit === 0 ? undefined : limit, // undefined means no limit
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize, 10),
      };
      
      console.log('Options:', { ...importOptions, limit: importOptions.limit ?? 'ALL' });
      console.log('');
      
      await importer.importRoomTypes(importOptions);
    } finally {
      await importer.disconnect();
    }
  });

program
  .command('liteapi-reference')
  .description('Import reference data from LITEAPI (countries, cities, currencies, etc.)')
  .option('-l, --limit <number>', 'Maximum number of records to import per type')
  .option('--dry-run', 'Run without making changes')
  .option('--types <types>', 'Comma-separated list of types to import (countries,cities,currencies,iataCodes,facilities,hotelTypes,chains,languages,reviews)')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nLITEAPI Reference Data Import\n'));
    
    const { LiteApiImporter } = await import('./liteapi-importer.js');
    const importer = new LiteApiImporter();
    
    try {
      const importOptions = {
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
        dryRun: options.dryRun,
        types: options.types?.split(','),
      };
      
      console.log('Options:', importOptions);
      console.log('');
      
      if (options.types) {
        const types = options.types.split(',');
        for (const type of types) {
          switch (type.trim()) {
            case 'countries':
              await importer.importCountries(importOptions);
              break;
            case 'cities':
              await importer.importCities(importOptions);
              break;
            case 'currencies':
              await importer.importCurrencies(importOptions);
              break;
            case 'iataCodes':
              await importer.importIataCodes(importOptions);
              break;
            case 'facilities':
              await importer.importFacilities(importOptions);
              break;
            case 'hotelTypes':
              await importer.importHotelTypes(importOptions);
              break;
            case 'chains':
              await importer.importChains(importOptions);
              break;
            case 'languages':
              await importer.importLanguages(importOptions);
              break;
            case 'reviews':
              await importer.importReviews(importOptions);
              break;
            default:
              console.log(chalk.yellow(`Unknown reference type: ${type}`));
          }
        }
      } else {
        // Import all reference data
        await importer.importCountries(importOptions);
        await importer.importCities(importOptions);
        await importer.importCurrencies(importOptions);
        await importer.importIataCodes(importOptions);
        await importer.importLanguages(importOptions);
        await importer.importHotelTypes(importOptions);
        await importer.importChains(importOptions);
        await importer.importFacilities(importOptions);
      }
    } finally {
      await importer.disconnect();
    }
  });

// Status command
program
  .command('status')
  .description('Show import status for all suppliers')
  .action(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      console.log(chalk.blue.bold('\nSupplier Import Status\n'));
      
      const suppliers = await prisma.supplier.findMany({
        include: {
          syncLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
      });
      
      for (const supplier of suppliers) {
        const lastSync = supplier.syncLogs[0];
        const statusColor = supplier.status === 'active' ? chalk.green : chalk.red;
        
        console.log(chalk.bold(supplier.name) + ` (${supplier.code})`);
        console.log(`  Status: ${statusColor(supplier.status)}`);
        console.log(`  Type: ${supplier.type}`);
        console.log(`  Sync Enabled: ${supplier.syncEnabled ? 'Yes' : 'No'}`);
        
        if (lastSync) {
          console.log(`  Last Sync: ${lastSync.completedAt || lastSync.startedAt}`);
          console.log(`  Sync Status: ${lastSync.status}`);
          console.log(`  Records: ${lastSync.processedRecords}/${lastSync.totalRecords}`);
          if (lastSync.failedRecords > 0) {
            console.log(chalk.red(`  Failed: ${lastSync.failedRecords}`));
          }
        }
        console.log('');
      }
    } finally {
      await prisma.$disconnect();
    }
  });

// Seed command
program
  .command('seed')
  .description('Seed static data (suppliers, amenities, board types, destinations)')
  .action(async () => {
    console.log(chalk.blue.bold('\nSeeding Static Data\n'));
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Import and run the seed function
      const { fileURLToPath } = await import('url');
      const { dirname, resolve } = await import('path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const seedPath = resolve(__dirname, '../../../database/prisma/seed-suppliers.js');
      const seedModule = await import(seedPath);
      await seedModule.main();
    } finally {
      await prisma.$disconnect();
    }
  });

// Duffel import commands
program
  .command('duffel-all')
  .description('Import ALL static data from Duffel API (airlines, aircraft, airports, cities, loyalty programmes)')
  .option('--download-logos', 'Download airline/hotel logos')
  .option('--dry-run', 'Run without making changes')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nDuffel Full Static Data Import\n'));
    
    const { 
      importAirlines, 
      importAircraft, 
      importAirports, 
      importCities, 
      importAirLoyaltyProgrammes, 
      importAccommodationLoyaltyProgrammes 
    } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const results = {
        airlines: 0,
        aircraft: 0,
        airports: 0,
        cities: 0,
        airLoyalty: 0,
        hotelLoyalty: 0,
      };
      
      results.airlines = await importAirlines();
      results.aircraft = await importAircraft();
      results.airports = await importAirports();
      results.cities = await importCities();
      results.airLoyalty = await importAirLoyaltyProgrammes();
      results.hotelLoyalty = await importAccommodationLoyaltyProgrammes();
      
      console.log(chalk.green('\n========================================'));
      console.log(chalk.green('IMPORT SUMMARY'));
      console.log(chalk.green('========================================'));
      console.log(`Airlines:                        ${results.airlines}`);
      console.log(`Aircraft:                        ${results.aircraft}`);
      console.log(`Airports:                        ${results.airports}`);
      console.log(`Cities:                          ${results.cities}`);
      console.log(`Air Loyalty Programmes:          ${results.airLoyalty}`);
      console.log(`Accommodation Loyalty Programmes: ${results.hotelLoyalty}`);
      console.log(`Total:                           ${Object.values(results).reduce((a, b) => a + b, 0)}`);
      console.log(chalk.green('========================================'));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('duffel-airlines')
  .description('Import airlines from Duffel API')
  .option('--download-logos', 'Download airline logos')
  .option('--dry-run', 'Run without making changes')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nDuffel Airlines Import\n'));
    
    const { importAirlines } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const result = await importAirlines();
      console.log(chalk.green(`\n✅ Imported ${result} airlines`));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('duffel-aircraft')
  .description('Import aircraft types from Duffel API')
  .action(async () => {
    console.log(chalk.blue.bold('\nDuffel Aircraft Import\n'));
    
    const { importAircraft } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const result = await importAircraft();
      console.log(chalk.green(`\n✅ Imported ${result} aircraft`));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('duffel-airports')
  .description('Import airports from Duffel API')
  .action(async () => {
    console.log(chalk.blue.bold('\nDuffel Airports Import\n'));
    
    const { importAirports } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const result = await importAirports();
      console.log(chalk.green(`\n✅ Imported ${result} airports`));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('duffel-cities')
  .description('Import cities from Duffel API')
  .action(async () => {
    console.log(chalk.blue.bold('\nDuffel Cities Import\n'));
    
    const { importCities } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const result = await importCities();
      console.log(chalk.green(`\n✅ Imported ${result} cities`));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('duffel-loyalty')
  .description('Import air and accommodation loyalty programmes from Duffel API')
  .option('--download-logos', 'Download programme logos')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nDuffel Loyalty Programmes Import\n'));
    
    const { importAirLoyaltyProgrammes, importAccommodationLoyaltyProgrammes } = await import('./duffel-static-importer.js');
    const { prisma } = await import('@tripalfa/shared-database');
    
    try {
      const airResult = await importAirLoyaltyProgrammes();
      const hotelResult = await importAccommodationLoyaltyProgrammes();
      console.log(chalk.green(`\n✅ Imported ${airResult} air loyalty programmes`));
      console.log(chalk.green(`✅ Imported ${hotelResult} accommodation loyalty programmes`));
    } catch (error) {
      console.error(chalk.red('Import failed:'), error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Parse arguments
program.parse();
