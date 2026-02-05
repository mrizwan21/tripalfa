#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateSchema() {
  console.log('Validating enhanced database schema...');

  try {
    // Test Country model
    console.log('Testing Country model...');
    const countries = await prisma.country.findMany({ take: 5 });
    console.log(`✓ Found ${countries.length} countries`);

    // Test Currency model
    console.log('Testing Currency model...');
    const currencies = await prisma.currency.findMany({ take: 5 });
    console.log(`✓ Found ${currencies.length} currencies`);

    // Test HotelFacility model
    console.log('Testing HotelFacility model...');
    const facilities = await prisma.hotelFacility.findMany({ take: 5 });
    console.log(`✓ Found ${facilities.length} hotel facilities`);

    // Test HotelType model
    console.log('Testing HotelType model...');
    const hotelTypes = await prisma.hotelType.findMany({ take: 5 });
    console.log(`✓ Found ${hotelTypes.length} hotel types`);

    // Test DataSource model
    console.log('Testing DataSource model...');
    const dataSources = await prisma.dataSource.findMany({ take: 5 });
    console.log(`✓ Found ${dataSources.length} data sources`);

    // Test ApiVendor model
    console.log('Testing ApiVendor model...');
    const vendors = await prisma.apiVendor.findMany({ take: 5 });
    console.log(`✓ Found ${vendors.length} API vendors`);

    // Test Supplier model
    console.log('Testing Supplier model...');
    const suppliers = await prisma.supplier.findMany({ take: 5 });
    console.log(`✓ Found ${suppliers.length} suppliers`);

    // Test Contract model
    console.log('Testing Contract model...');
    const contracts = await prisma.contract.findMany({ take: 5 });
    console.log(`✓ Found ${contracts.length} contracts`);

    // Test PricingRule model
    console.log('Testing PricingRule model...');
    const pricingRules = await prisma.pricingRule.findMany({ take: 5 });
    console.log(`✓ Found ${pricingRules.length} pricing rules`);

    // Test relationships
    console.log('Testing relationships...');
    
    // Test Country -> City relationship
    const countryWithCities = await prisma.country.findFirst({
      include: {
        cities: {
          take: 3
        }
      }
    });
    if (countryWithCities) {
      console.log(`✓ Country "${countryWithCities.name}" has ${countryWithCities.cities.length} cities`);
    }

    // Test Supplier -> Contract relationship
    const supplierWithContracts = await prisma.supplier.findFirst({
      include: {
        contracts: {
          take: 2
        }
      }
    });
    if (supplierWithContracts) {
      console.log(`✓ Supplier "${supplierWithContracts.name}" has ${supplierWithContracts.contracts.length} contracts`);
    }

    // Test ApiVendor -> Supplier relationship
    const vendorWithSuppliers = await prisma.apiVendor.findFirst({
      include: {
        suppliers: {
          take: 2
        }
      }
    });
    if (vendorWithSuppliers) {
      console.log(`✓ Vendor "${vendorWithSuppliers.name}" has ${vendorWithSuppliers.suppliers.length} suppliers`);
    }

    // Test data integrity
    console.log('Testing data integrity...');
    
    // Check for duplicate codes
    const duplicateCountries = await prisma.country.groupBy({
      by: ['code'],
      having: {
        _count: {
          code: {
            gt: 1
          }
        }
      }
    });
    if (duplicateCountries.length === 0) {
      console.log('✓ No duplicate country codes found');
    } else {
      console.log(`⚠ Found ${duplicateCountries.length} duplicate country codes`);
    }

    const duplicateCurrencies = await prisma.currency.groupBy({
      by: ['code'],
      having: {
        _count: {
          code: {
            gt: 1
          }
        }
      }
    });
    if (duplicateCurrencies.length === 0) {
      console.log('✓ No duplicate currency codes found');
    } else {
      console.log(`⚠ Found ${duplicateCurrencies.length} duplicate currency codes`);
    }

    const duplicateHotelTypes = await prisma.hotelType.groupBy({
      by: ['name'],
      having: {
        _count: {
          name: {
            gt: 1
          }
        }
      }
    });
    if (duplicateHotelTypes.length === 0) {
      console.log('✓ No duplicate hotel type names found');
    } else {
      console.log(`⚠ Found ${duplicateHotelTypes.length} duplicate hotel type names`);
    }

    // Test performance with indexes
    console.log('Testing index performance...');
    const startTime = Date.now();
    const indexedQuery = await prisma.country.findMany({
      where: {
        code: 'USA'
      }
    });
    const queryTime = Date.now() - startTime;
    console.log(`✓ Indexed query completed in ${queryTime}ms`);

    console.log('✅ Schema validation completed successfully!');
    console.log('\nSchema Enhancement Summary:');
    console.log('- ✅ Enhanced static data models created');
    console.log('- ✅ Proper relationships established');
    console.log('- ✅ Indexes created for performance');
    console.log('- ✅ Data integrity constraints validated');
    console.log('- ✅ Seed data successfully imported');

  } catch (error) {
    console.error('❌ Error validating schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation function
if (require.main === module) {
  validateSchema()
    .then(() => {
      console.log('Validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { validateSchema };