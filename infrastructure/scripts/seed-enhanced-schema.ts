#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedEnhancedSchema() {
  console.log('Seeding enhanced database schema...');

  try {
    // Seed Countries
    console.log('Seeding countries...');
    const countries = [
      { code: 'USA', name: 'United States', isoCode: 'US', continent: 'North America', currency: 'USD', phoneCode: '+1' },
      { code: 'CAN', name: 'Canada', isoCode: 'CA', continent: 'North America', currency: 'CAD', phoneCode: '+1' },
      { code: 'GBR', name: 'United Kingdom', isoCode: 'GB', continent: 'Europe', currency: 'GBP', phoneCode: '+44' },
      { code: 'DEU', name: 'Germany', isoCode: 'DE', continent: 'Europe', currency: 'EUR', phoneCode: '+49' },
      { code: 'FRA', name: 'France', isoCode: 'FR', continent: 'Europe', currency: 'EUR', phoneCode: '+33' },
      { code: 'ESP', name: 'Spain', isoCode: 'ES', continent: 'Europe', currency: 'EUR', phoneCode: '+34' },
      { code: 'ITA', name: 'Italy', isoCode: 'IT', continent: 'Europe', currency: 'EUR', phoneCode: '+39' },
      { code: 'AUS', name: 'Australia', isoCode: 'AU', continent: 'Oceania', currency: 'AUD', phoneCode: '+61' },
      { code: 'JPN', name: 'Japan', isoCode: 'JP', continent: 'Asia', currency: 'JPY', phoneCode: '+81' },
      { code: 'CHN', name: 'China', isoCode: 'CN', continent: 'Asia', currency: 'CNY', phoneCode: '+86' }
    ];

    for (const country of countries) {
      await prisma.country.upsert({
        where: { code: country.code },
        update: country,
        create: country
      });
    }
    console.log('✓ Countries seeded');

    // Seed Currencies
    console.log('Seeding currencies...');
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 }
    ];

    for (const currency of currencies) {
      await prisma.currency.upsert({
        where: { code: currency.code },
        update: currency,
        create: currency
      });
    }
    console.log('✓ Currencies seeded');

    // Seed Hotel Facilities
    console.log('Seeding hotel facilities...');
    const facilities = [
      { name: 'Wi-Fi', category: 'Connectivity', description: 'Free wireless internet access', isCommon: true },
      { name: 'Swimming Pool', category: 'Recreation', description: 'Outdoor or indoor swimming pool', isCommon: true },
      { name: 'Fitness Center', category: 'Recreation', description: 'Gym and fitness equipment', isCommon: true },
      { name: 'Restaurant', category: 'Dining', description: 'On-site restaurant', isCommon: true },
      { name: 'Bar', category: 'Dining', description: 'Hotel bar and lounge', isCommon: true },
      { name: 'Room Service', category: 'Services', description: '24/7 room service', isCommon: true },
      { name: 'Business Center', category: 'Business', description: 'Business services and facilities', isCommon: true },
      { name: 'Spa', category: 'Wellness', description: 'Spa and wellness center', isCommon: false },
      { name: 'Parking', category: 'Transportation', description: 'On-site parking', isCommon: true },
      { name: 'Airport Shuttle', category: 'Transportation', description: 'Airport transfer service', isCommon: false }
    ];

    for (const facility of facilities) {
      await prisma.hotelFacility.upsert({
        where: { name: facility.name },
        update: facility,
        create: facility
      });
    }
    console.log('✓ Hotel facilities seeded');

    // Seed Hotel Types
    console.log('Seeding hotel types...');
    const hotelTypes = [
      { name: 'Luxury', description: 'High-end luxury hotels with premium services' },
      { name: 'Boutique', description: 'Small, unique hotels with personalized service' },
      { name: 'Business', description: 'Hotels designed for business travelers' },
      { name: 'Resort', description: 'Vacation resorts with extensive amenities' },
      { name: 'Budget', description: 'Economy hotels with basic amenities' },
      { name: 'Extended Stay', description: 'Hotels for longer-term stays' },
      { name: 'Boutique', description: 'Small, unique hotels with personalized service' },
      { name: 'Resort', description: 'Vacation resorts with extensive amenities' }
    ];

    for (const type of hotelTypes) {
      await prisma.hotelType.upsert({
        where: { name: type.name },
        update: type,
        create: type
      });
    }
    console.log('✓ Hotel types seeded');

    // Seed Data Sources
    console.log('Seeding data sources...');
    const dataSources = [
      {
        name: 'Hotelston API',
        sourceType: 'api',
        endpoint: 'https://api.hotelston.com',
        apiKey: process.env.HOTELSTON_API_KEY || 'demo-key',
        isActive: true,
        syncIntervalMinutes: 1440
      },
      {
        name: 'Innstant Travel API',
        sourceType: 'api',
        endpoint: 'https://api.innstant.travel',
        apiKey: process.env.INNSTANT_API_KEY || 'demo-key',
        isActive: true,
        syncIntervalMinutes: 1440
      },
      {
        name: 'Duffel Airlines',
        sourceType: 'api',
        endpoint: 'https://api.duffel.com',
        apiKey: process.env.DUFFEL_API_KEY || 'demo-key',
        isActive: true,
        syncIntervalMinutes: 1440
      }
    ];

    for (const source of dataSources) {
      await prisma.dataSource.upsert({
        where: { name: source.name },
        update: source,
        create: source
      });
    }
    console.log('✓ Data sources seeded');

    // Seed Api Vendors
    console.log('Seeding API vendors...');
    const apiVendors = [
      {
        name: 'Hotelston',
        code: 'hotelston',
        baseUrl: 'https://api.hotelston.com',
        authType: 'apiKey',
        credentials: { apiKey: process.env.HOTELSTON_API_KEY || 'demo-key' },
        isActive: true
      },
      {
        name: 'Innstant Travel',
        code: 'innstant',
        baseUrl: 'https://api.innstant.travel',
        authType: 'apiKey',
        credentials: { apiKey: process.env.INNSTANT_API_KEY || 'demo-key' },
        isActive: true
      },
      {
        name: 'Duffel',
        code: 'duffel',
        baseUrl: 'https://api.duffel.com',
        authType: 'bearer',
        credentials: { token: process.env.DUFFEL_API_KEY || 'demo-token' },
        isActive: true
      }
    ];

    for (const vendor of apiVendors) {
      await prisma.apiVendor.upsert({
        where: { code: vendor.code },
        update: vendor,
        create: vendor
      });
    }
    console.log('✓ API vendors seeded');

    // Seed Suppliers
    console.log('Seeding suppliers...');
    const suppliers = [
      { name: 'Hotelston Supplier', code: 'HSTN', category: 'Hotel', vendorId: 'hotelston', isActive: true },
      { name: 'Innstant Supplier', code: 'INNS', category: 'Hotel', vendorId: 'innstant', isActive: true },
      { name: 'Duffel Airlines', code: 'DUFF', category: 'Flight', vendorId: 'duffel', isActive: true }
    ];

    for (const supplier of suppliers) {
      await prisma.supplier.upsert({
        where: { code: supplier.code },
        update: supplier,
        create: supplier
      });
    }
    console.log('✓ Suppliers seeded');

    // Seed Contracts
    console.log('Seeding contracts...');
    const contracts = [
      {
        supplierId: 'HSTN',
        name: 'Hotelston Contract',
        currency: 'USD',
        creditLimit: 50000,
        commission: 15,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        status: 'ACTIVE'
      },
      {
        supplierId: 'INNS',
        name: 'Innstant Contract',
        currency: 'USD',
        creditLimit: 30000,
        commission: 12,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        status: 'ACTIVE'
      },
      {
        supplierId: 'DUFF',
        name: 'Duffel Contract',
        currency: 'USD',
        creditLimit: 100000,
        commission: 8,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        status: 'ACTIVE'
      }
    ];

    for (const contract of contracts) {
      await prisma.contract.upsert({
        where: { name: contract.name },
        update: contract,
        create: contract
      });
    }
    console.log('✓ Contracts seeded');

    // Seed Pricing Rules
    console.log('Seeding pricing rules...');
    const pricingRules = [
      {
        name: 'Standard Markup',
        targetType: 'supplier',
        targetId: 'HSTN',
        serviceType: 'hotel',
        markupType: 'percentage',
        markupValue: 10,
        status: 'ACTIVE',
        priority: 1,
        criteria: { minStay: 1, maxStay: 30 }
      },
      {
        name: 'Weekend Premium',
        targetType: 'supplier',
        targetId: 'INNS',
        serviceType: 'hotel',
        markupType: 'percentage',
        markupValue: 15,
        status: 'ACTIVE',
        priority: 2,
        criteria: { daysOfWeek: ['Friday', 'Saturday', 'Sunday'] }
      },
      {
        name: 'Flight Commission',
        targetType: 'supplier',
        targetId: 'DUFF',
        serviceType: 'flight',
        markupType: 'percentage',
        markupValue: 5,
        status: 'ACTIVE',
        priority: 1,
        criteria: { cabinClass: 'economy' }
      }
    ];

    for (const rule of pricingRules) {
      await prisma.pricingRule.upsert({
        where: { name: rule.name },
        update: rule,
        create: rule
      });
    }
    console.log('✓ Pricing rules seeded');

    console.log('✅ Enhanced schema seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding enhanced schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedEnhancedSchema()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedEnhancedSchema };