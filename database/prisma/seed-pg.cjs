require('dotenv').config();

const { Client } = require('pg');
const crypto = require('crypto');

// Simple UUID v4 generator for Node.js
function generateUUID() {
  return crypto.randomUUID();
}

async function seed() {
  console.log('🌱 Starting database seed using raw PostgreSQL...');
  
  const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // 1. Create default company
    await client.query(
      `
      INSERT INTO companies (id, code, name, type, "isActive", "createdAt", "updatedAt")
      VALUES ($1, 'DEFAULT', 'Default Company', 'b2b', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
      `,
      [generateUUID()]
    );
    console.log('  ✔ default company');

    // 2. Create default roles
    await client.query(
      `
      INSERT INTO roles (id, name, description, "isSystem", "createdAt", "updatedAt")
      VALUES 
        ($1, 'admin', 'Administrator role', true, NOW(), NOW()),
        ($2, 'user', 'Standard user role', true, NOW(), NOW()),
        ($3, 'agent', 'Travel agent role', true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      `,
      [generateUUID(), generateUUID(), generateUUID()]
    );
    console.log('  ✔ default roles');

    // 3. Create default loyalty tiers
    await client.query(
      `
      INSERT INTO loyalty_tiers (id, name, level, "minPoints", "maxPoints", multiplier, "createdAt", "updatedAt")
      VALUES 
        ($1, 'Bronze', 1, 0, 999, 1.0, NOW(), NOW()),
        ($2, 'Silver', 2, 1000, 4999, 1.1, NOW(), NOW()),
        ($3, 'Gold', 3, 5000, 19999, 1.2, NOW(), NOW()),
        ($4, 'Platinum', 4, 20000, NULL, 1.3, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      `,
      [generateUUID(), generateUUID(), generateUUID(), generateUUID()]
    );
    console.log('  ✔ default loyalty tiers');

    // 4. Create default notification templates
    const bookingConfirmTemplate = JSON.stringify({
      email: {
        subject: 'Your booking is confirmed!',
        body: 'Thank you for booking with us. Your booking reference is {{bookingRef}}.',
      },
    });
    const paymentConfirmTemplate = JSON.stringify({
      email: {
        subject: 'Payment received!',
        body: 'Your payment of {{amount}} has been received.',
      },
    });

    await client.query(
      `
      INSERT INTO notification_templates (id, name, slug, category, description, templates, variables, enabled, "createdAt", "updatedAt")
      VALUES 
        ($1, $2, 'booking-confirmation', 'booking', 'Template for booking confirmation notifications', $3::jsonb, $4, true, NOW(), NOW()),
        ($5, $6, 'payment-confirmation', 'payment', 'Template for payment confirmation notifications', $7::jsonb, $8, true, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
      `,
      [
        generateUUID(),
        'Booking Confirmation',
        bookingConfirmTemplate,
        ['bookingRef', 'customerName'],
        generateUUID(),
        'Payment Confirmation',
        paymentConfirmTemplate,
        ['amount', 'transactionId'],
      ]
    );
    console.log('  ✔ default notification templates');

    // 5. Create default commission rules
    await client.query(
      `
      INSERT INTO commission_rules (id, code, name, "serviceType", "ruleType", value, currency, "isActive", priority, "createdAt", "updatedAt")
      VALUES 
        ($1, 'DEFAULT_FLIGHT', 'Default Flight Commission', 'flight', 'percentage', 5.0, 'USD', true, 100, NOW(), NOW()),
        ($2, 'DEFAULT_HOTEL', 'Default Hotel Commission', 'hotel', 'percentage', 8.0, 'USD', true, 100, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
      `,
      [generateUUID(), generateUUID()]
    );
    console.log('  ✔ default commission rules');

    // 6. Create default markup rules
    await client.query(
      `
      INSERT INTO markup_rules (id, code, name, "serviceType", "ruleType", value, currency, "isActive", priority, "createdAt", "updatedAt")
      VALUES 
        ($1, 'DEFAULT_FLIGHT', 'Default Flight Markup', 'flight', 'percentage', 2.0, 'USD', true, 100, NOW(), NOW()),
        ($2, 'DEFAULT_HOTEL', 'Default Hotel Markup', 'hotel', 'percentage', 3.0, 'USD', true, 100, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
      `,
      [generateUUID(), generateUUID()]
    );
    console.log('  ✔ default markup rules');

    console.log('\n🎉 Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
