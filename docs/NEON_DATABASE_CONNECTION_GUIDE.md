# Neon Database Connection Guide

## Overview

This guide provides step-by-step instructions for setting up the KYC & Virtual Card Management System database in your Neon PostgreSQL account.

## Prerequisites

- Neon account (https://neon.tech)
- PostgreSQL client (psql, pgAdmin, or any PostgreSQL client)
- Database URL from your Neon project

## Step 1: Create a Neon Project

1. **Sign in to Neon**
   - Go to https://console.neon.tech
   - Sign in with your credentials

2. **Create a New Project**
   - Click "New Project"
   - Enter a project name (e.g., "tripalfa-b2b-kyc")
   - Select your preferred region
   - Choose a compute size (Free tier is available)
   - Click "Create Project"

3. **Get Database Connection Details**
   - After project creation, you'll see connection details
   - Copy the connection string (it will look like):
     ```
     postgresql://username:password@ep-xyz-123456.us-east-1.aws.neon.tech/tripalfa_b2b
     ```

## Step 2: Run Database Setup Script

### Option A: Using psql Command Line

1. **Install psql** (if not already installed)
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # Windows
   Download from: https://www.postgresql.org/download/windows/
   ```

2. **Connect to Neon Database**
   ```bash
   psql "postgresql://username:password@ep-xyz-123456.us-east-1.aws.neon.tech/tripalfa_b2b"
   ```

3. **Run the Setup Script**
   ```bash
   psql "postgresql://username:password@ep-xyz-123456.us-east-1.aws.neon.tech/tripalfa_b2b" -f NEON_DATABASE_SETUP.sql
   ```

### Option B: Using Neon SQL Editor

1. **Open Neon SQL Editor**
   - In your Neon console, click "SQL Editor"
   - Click "New Query"

2. **Paste and Execute Setup Script**
   - Copy the contents of `NEON_DATABASE_SETUP.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

### Option C: Using pgAdmin

1. **Add Neon Server**
   - Open pgAdmin
   - Right-click "Servers" → "Create" → "Server"
   - Fill in connection details:
     - Name: "Neon TripAlfa B2B"
     - Host: `ep-xyz-123456.us-east-1.aws.neon.tech`
     - Port: `5432`
     - Username: Your Neon username
     - Password: Your Neon password

2. **Run Setup Script**
   - Right-click your database → "Query Tool"
   - Paste the setup script
   - Execute the query

## Step 3: Configure Environment Variables

### Update Your Application Configuration

1. **Create/Update Environment File**
   ```bash
   # In your project root or apps/b2b-admin/server/
   cp .env.example .env
   ```

2. **Set Database URL**
   ```env
   # Neon Database Configuration
   DATABASE_URL="postgresql://username:password@ep-xyz-123456.us-east-1.aws.neon.tech/tripalfa_b2b?sslmode=require"
   
   # Optional: Neon-specific settings
   PGSSLMODE=require
   PGSSLCERT=
   PGSSLKEY=
   PGSSLROOTCERT=
   ```

## Step 4: Verify Database Setup

### Check Tables Created Successfully

Run this query to verify all tables were created:

```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'kyc_documents', 
  'kyc_verifications', 
  'kyc_compliance', 
  'virtual_cards', 
  'virtual_card_transactions', 
  'virtual_card_settings'
)
ORDER BY table_name;
```

### Check Indexes Created

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
  'kyc_documents', 
  'kyc_verifications', 
  'kyc_compliance', 
  'virtual_cards', 
  'virtual_card_transactions', 
  'virtual_card_settings'
)
ORDER BY tablename, indexname;
```

### Check Functions and Triggers

```sql
-- Check if the update function exists
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';

-- Check if triggers are created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'update_%_updated_at';
```

## Step 5: Test Database Connection

### Create a Test Script

Create a test file to verify your application can connect:

```javascript
// test-connection.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    client.release();
    
    // Test table existence
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('kyc_documents', 'virtual_cards')
    `);
    console.log('Tables found:', tableCheck.rows);
    
  } catch (err) {
    console.error('Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

Run the test:
```bash
node test-connection.js
```

## Step 6: Optional - Add Sample Data

To populate your database with sample data for testing:

1. **Uncomment Sample Data Section**
   - Open `NEON_DATABASE_SETUP.sql`
   - Remove the `/*` and `*/` comments around the sample data section

2. **Re-run Setup Script**
   ```bash
   psql "postgresql://username:password@ep-xyz-123456.us-east-1.aws.neon.tech/tripalfa_b2b" -f NEON_DATABASE_SETUP.sql
   ```

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```bash
# Error: connection timed out
# Solution: Check your Neon project status and region
```

#### 2. SSL Connection Error
```bash
# Error: SSL connection failed
# Solution: Ensure sslmode=require in connection string
```

#### 3. Authentication Failed
```bash
# Error: password authentication failed
# Solution: Verify username and password in Neon console
```

#### 4. Extension Not Available
```bash
# Error: extension "uuid-ossp" does not exist
# Solution: Neon automatically includes this extension
```

### Performance Optimization

#### Neon-Specific Optimizations

1. **Connection Pooling**
   ```javascript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { require: true, rejectUnauthorized: false },
     max: 20,              // Maximum connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

2. **Neon Branch Management**
   - Use separate branches for development and production
   - Monitor compute usage in Neon console
   - Scale compute resources as needed

3. **Query Optimization**
   - Use the indexes created in the setup script
   - Monitor slow queries in Neon dashboard
   - Consider connection pooling for high-traffic applications

## Security Best Practices

### Neon Security Features

1. **SSL/TLS Encryption**
   - Always use `sslmode=require`
   - Neon enforces SSL connections

2. **Role-Based Access**
   - Create separate database users for different application components
   - Use least privilege principle

3. **Backup and Recovery**
   - Neon provides automatic backups
   - Test restore procedures regularly

4. **Monitoring**
   - Enable Neon's built-in monitoring
   - Set up alerts for unusual activity

## Next Steps

1. **Update Application Configuration**
   - Set the `DATABASE_URL` environment variable
   - Configure connection pooling settings

2. **Test Application Integration**
   - Run your application with the Neon database
   - Test all KYC and Virtual Card operations

3. **Monitor Performance**
   - Use Neon's dashboard to monitor query performance
   - Optimize slow queries as needed

4. **Set Up Production Environment**
   - Create separate Neon projects for staging and production
   - Configure appropriate compute resources
   - Set up monitoring and alerting

## Support

- **Neon Documentation**: https://neon.tech/docs
- **Neon Support**: https://neon.tech/support
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

For additional help with the KYC & Virtual Card system, refer to the implementation documentation in this repository.