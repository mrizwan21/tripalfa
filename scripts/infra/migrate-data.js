#!/usr/bin/env node

/**
 * TripAlfa Data Migration Script
 * Migrates data from monolithic database to microservices databases
 *
 * Usage:
 * node scripts/migrate-data.js [service-name]
 *
 * If no service-name is provided, migrates all services
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DataMigration {
  constructor() {
    // Require environment variables to be set - no hardcoded credentials
    this.sourceDbUrl = process.env.SOURCE_DATABASE_URL;
    if (!this.sourceDbUrl) {
      throw new Error('SOURCE_DATABASE_URL environment variable is required');
    }

    // Build target database URLs from environment variables
    const dbPassword = process.env.DB_PASSWORD;
    const neonHost = process.env.NEON_HOST;
    
    if (!dbPassword || !neonHost) {
      throw new Error('DB_PASSWORD and NEON_HOST environment variables are required');
    }

    this.targetDatabases = {
      user_service: `postgresql://neondb_owner:${dbPassword}@${neonHost}/tripalfa_user_service?sslmode=require`,
      audit_service: `postgresql://neondb_owner:${dbPassword}@${neonHost}/tripalfa_audit_service?sslmode=require`,
      payment_service: `postgresql://neondb_owner:${dbPassword}@${neonHost}/tripalfa_payment_service?sslmode=require`,
      booking_service: `postgresql://neondb_owner:${dbPassword}@${neonHost}/tripalfa_booking_service?sslmode=require`,
      notification_service: `postgresql://neondb_owner:${dbPassword}@${neonHost}/tripalfa_notification_service?sslmode=require`
    };

    this.sourceClient = null;
    this.targetClients = {};
  }

  async connect() {
    console.log('🔌 Connecting to databases...');

    // Connect to source database
    this.sourceClient = new Client({ connectionString: this.sourceDbUrl });
    await this.sourceClient.connect();
    console.log('✅ Connected to source database');

    // Connect to target databases
    for (const [service, url] of Object.entries(this.targetDatabases)) {
      const client = new Client({ connectionString: url });
      await client.connect();
      this.targetClients[service] = client;
      console.log(`✅ Connected to ${service} database`);
    }
  }

  async disconnect() {
    console.log('🔌 Disconnecting from databases...');

    if (this.sourceClient) {
      await this.sourceClient.end();
    }

    for (const client of Object.values(this.targetClients)) {
      await client.end();
    }

    console.log('✅ All database connections closed');
  }

  async migrateUsers() {
    console.log('👥 Migrating user data...');

    try {
      // Get users from source
      const usersQuery = `
        SELECT
          id, external_id, email, phone_number, phone, name, first_name, last_name,
          avatar_url, role, password, user_type, is_active, company_id,
          card_provider, card_last4, card_expiry, metadata,
          created_at, updated_at
        FROM "User"
      `;

      const usersResult = await this.sourceClient.query(usersQuery);
      console.log(`📊 Found ${usersResult.rows.length} users to migrate`);

      // Insert into user service database
      for (const user of usersResult.rows) {
        await this.targetClients.user_service.query(`
          INSERT INTO "User" (
            id, external_id, email, phone_number, phone, name, first_name, last_name,
            avatar_url, role, password, user_type, is_active, company_id,
            card_provider, card_last4, card_expiry, metadata,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id, user.external_id, user.email, user.phone_number, user.phone,
          user.name, user.first_name, user.last_name, user.avatar_url, user.role,
          user.password, user.user_type, user.is_active, user.company_id,
          user.card_provider, user.card_last4, user.card_expiry, user.metadata,
          user.created_at, user.updated_at
        ]);
      }

      // Migrate user preferences
      const preferencesQuery = `SELECT * FROM "UserPreferences"`;
      const preferencesResult = await this.sourceClient.query(preferencesQuery);

      for (const pref of preferencesResult.rows) {
        await this.targetClients.user_service.query(`
          INSERT INTO "UserPreferences" (
            id, user_id, email_notifications, sms_notifications, push_notifications,
            in_app_notifications, unsubscribe_categories, marketing_emails, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          pref.id, pref.user_id, pref.email_notifications, pref.sms_notifications,
          pref.push_notifications, pref.in_app_notifications, pref.unsubscribe_categories,
          pref.marketing_emails, pref.created_at, pref.updated_at
        ]);
      }

      console.log('✅ User data migration completed');

    } catch (error) {
      console.error('❌ Error migrating user data:', error);
      throw error;
    }
  }

  async migrateCompanies() {
    console.log('🏢 Migrating company data...');

    try {
      const companiesQuery = `
        SELECT
          id, name, code, email, phone, address, domain, status, credit_limit,
          balance, card_provider, card_last4, card_expiry, is_active,
          created_at, updated_at
        FROM "Company"
      `;

      const companiesResult = await this.sourceClient.query(companiesQuery);
      console.log(`📊 Found ${companiesResult.rows.length} companies to migrate`);

      for (const company of companiesResult.rows) {
        await this.targetClients.user_service.query(`
          INSERT INTO "Company" (
            id, name, code, email, phone, address, domain, status, credit_limit,
            balance, card_provider, card_last4, card_expiry, is_active,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING
        `, [
          company.id, company.name, company.code, company.email, company.phone,
          company.address, company.domain, company.status, company.credit_limit,
          company.balance, company.card_provider, company.card_last4, company.card_expiry,
          company.is_active, company.created_at, company.updated_at
        ]);
      }

      console.log('✅ Company data migration completed');

    } catch (error) {
      console.error('❌ Error migrating company data:', error);
      throw error;
    }
  }

  async migrateBookings() {
    console.log('🎫 Migrating booking data...');

    try {
      // Get bookings from source
      const bookingsQuery = `
        SELECT
          id, booking_reference, user_id, company_id, status, trip_type, passenger_count,
          total_amount, currency, base_fare, taxes, fees, payment_status, payment_id,
          departure_date, return_date, supplier, supplier_booking_id, supplier_booking_ref,
          contact_email, contact_phone, special_requests, metadata, tags,
          created_at, updated_at, created_by, updated_by
        FROM "Booking"
      `;

      const bookingsResult = await this.sourceClient.query(bookingsQuery);
      console.log(`📊 Found ${bookingsResult.rows.length} bookings to migrate`);

      for (const booking of bookingsResult.rows) {
        await this.targetClients.booking_service.query(`
          INSERT INTO "Booking" (
            id, booking_reference, user_id, company_id, status, trip_type, passenger_count,
            total_amount, currency, base_fare, taxes, fees, payment_status, payment_id,
            departure_date, return_date, supplier, supplier_booking_id, supplier_booking_ref,
            contact_email, contact_phone, special_requests, metadata, tags,
            created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
          ON CONFLICT (id) DO NOTHING
        `, [
          booking.id, booking.booking_reference, booking.user_id, booking.company_id,
          booking.status, booking.trip_type, booking.passenger_count, booking.total_amount,
          booking.currency, booking.base_fare, booking.taxes, booking.fees, booking.payment_status,
          booking.payment_id, booking.departure_date, booking.return_date, booking.supplier,
          booking.supplier_booking_id, booking.supplier_booking_ref, booking.contact_email,
          booking.contact_phone, booking.special_requests, booking.metadata, booking.tags,
          booking.created_at, booking.updated_at, booking.created_by, booking.updated_by
        ]);
      }

      console.log('✅ Booking data migration completed');

    } catch (error) {
      console.error('❌ Error migrating booking data:', error);
      throw error;
    }
  }

  async migratePayments() {
    console.log('💳 Migrating payment data...');

    try {
      // This would migrate payment-related tables
      // Implementation depends on your specific payment schema
      console.log('ℹ️  Payment migration - customize based on your payment schema');

    } catch (error) {
      console.error('❌ Error migrating payment data:', error);
      throw error;
    }
  }

  async migrateAuditLogs() {
    console.log('📋 Migrating audit logs...');

    try {
      // This would migrate audit-related tables
      // Implementation depends on your specific audit schema
      console.log('ℹ️  Audit migration - customize based on your audit schema');

    } catch (error) {
      console.error('❌ Error migrating audit data:', error);
      throw error;
    }
  }

  async migrateNotifications() {
    console.log('🔔 Migrating notification data...');

    try {
      // This would migrate notification-related tables
      // Implementation depends on your specific notification schema
      console.log('ℹ️  Notification migration - customize based on your notification schema');

    } catch (error) {
      console.error('❌ Error migrating notification data:', error);
      throw error;
    }
  }

  async run(serviceName = null) {
    const startTime = Date.now();

    try {
      await this.connect();

      if (serviceName) {
        console.log(`🚀 Starting migration for service: ${serviceName}`);

        switch (serviceName) {
          case 'users':
            await this.migrateUsers();
            await this.migrateCompanies();
            break;
          case 'bookings':
            await this.migrateBookings();
            break;
          case 'payments':
            await this.migratePayments();
            break;
          case 'audit':
            await this.migrateAuditLogs();
            break;
          case 'notifications':
            await this.migrateNotifications();
            break;
          default:
            throw new Error(`Unknown service: ${serviceName}`);
        }
      } else {
        console.log('🚀 Starting full data migration...');

        // Migrate in dependency order
        await this.migrateUsers();
        await this.migrateCompanies();
        await this.migrateBookings();
        await this.migratePayments();
        await this.migrateAuditLogs();
        await this.migrateNotifications();
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`🎉 Migration completed successfully in ${duration.toFixed(2)} seconds`);

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const serviceName = process.argv[2];

  if (serviceName && !['users', 'bookings', 'payments', 'audit', 'notifications'].includes(serviceName)) {
    console.error('❌ Invalid service name. Valid options: users, bookings, payments, audit, notifications');
    process.exit(1);
  }

  const migration = new DataMigration();
  await migration.run(serviceName);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataMigration;