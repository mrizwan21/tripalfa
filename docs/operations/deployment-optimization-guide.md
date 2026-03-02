# TripAlfa Deployment & Optimization Guide

## Overview

This guide provides comprehensive instructions for deploying and optimizing the TripAlfa database system on Neon through their MCP server. It covers configuration, performance tuning, monitoring, and best practices for maintaining a robust, fast, and low-latency system with shared database architecture.

## Prerequisites

### System Requirements

- **Neon MCP Server**: Active account with database hosting capabilities
- **PostgreSQL**: Version 14 or higher
- **Memory**: Minimum 8GB RAM (16GB recommended for production)
- **Storage**: SSD storage with at least 100GB available
- **Network**: Low-latency connection to Neon data centers

### Development Environment

- **Node.js**: Version 18 or higher
- **Prisma CLI**: Latest version
- **Docker**: For containerization (optional but recommended)
- **Monitoring Tools**: Prometheus, Grafana, or equivalent

## Database Configuration

### Connection Settings

```env
# Database URL for Neon MCP Server
# Replace <DB_PASSWORD> and <NEON_HOST> with your actual credentials
DATABASE_URL="postgresql://neondb_owner:<DB_PASSWORD>@<NEON_HOST>/neondb?sslmode=require"

# Connection Pooling Settings
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### Performance Tuning Parameters

```sql
-- PostgreSQL Configuration for Shared Database
shared_buffers = '4GB'          -- 25% of available RAM
effective_cache_size = '12GB'   -- 75% of available RAM
work_mem = '8MB'                -- Per-query memory
maintenance_work_mem = '64MB'   -- Maintenance operations
checkpoint_completion_target = '0.9'
max_connections = '200'
```

## Deployment Steps

### Step 1: Schema Migration

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

### Step 2: Data Seeding

```bash
# Seed static reference data
npx prisma db seed --preview-feature
```

### Step 3: Connection Pool Configuration

```javascript
// Database connection setup
const { PrismaClient } = require("@prisma/client");

const globalPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      direct: true,
      pool: {
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
        acquireTimeoutMillis:
          parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000,
      },
    },
  },
});
```

## Performance Optimization

### Query Optimization

#### 1. Index Usage Analysis

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM bookings WHERE user_id = 'user_123' AND status = 'pending';

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM
    pg_stat_user_indexes
WHERE
    schemaname = 'public';
```

#### 2. Slow Query Identification

```sql
-- Find slow queries
SELECT
    query,
    mean_time,
    calls,
    total_time,
    rows
FROM
    pg_stat_statements
ORDER BY
    mean_time DESC
LIMIT 10;
```

### Advanced Caching Strategy

#### 1. Redis Integration

```javascript
// Redis caching for reference data
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

// Cache static data
async function getAirports() {
  const cached = await redis.get("airports");
  if (cached) return JSON.parse(cached);

  const airports = await globalPrisma.airport.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  await redis.setex("airports", 3600, JSON.stringify(airports)); // 1 hour cache
  return airports;
}
```

#### 2. Query Result Caching

```javascript
// Cache frequently accessed queries
async function getRecentBookings(userId) {
  const cacheKey = `recent_bookings:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const bookings = await globalPrisma.booking.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await redis.setex(cacheKey, 300, JSON.stringify(bookings)); // 5 minutes cache
  return bookings;
}
```

### Advanced Performance Features

#### 1. Materialized Views

```sql
-- Create materialized view for booking summaries
CREATE MATERIALIZED VIEW booking_summary AS
SELECT
  booking_id,
  user_id,
  total_amount,
  status,
  created_at
FROM bookings
WHERE status IN ('confirmed', 'pending');

-- Create materialized view for user activity
CREATE MATERIALIZED VIEW user_activity AS
SELECT
  user_id,
  COUNT(*) as total_bookings,
  SUM(total_amount) as total_amount,
  MAX(created_at) as last_booking
FROM bookings
GROUP BY user_id;
```

#### 2. Table Partitioning

```sql
-- Partition bookings table by date
CREATE TABLE bookings_partitioned (
  LIKE bookings INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for different time periods
CREATE TABLE bookings_2024_q1 PARTITION OF bookings_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE bookings_2024_q2 PARTITION OF bookings_partitioned
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Partition search history by user
CREATE TABLE search_history_partitioned (
  LIKE search_history INCLUDING ALL
) PARTITION BY HASH (user_id);
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Database Performance**
   - Query response time
   - Connection pool usage
   - Index hit ratio
   - Cache hit ratio

2. **System Health**
   - CPU and memory usage
   - Disk I/O
   - Network latency
   - Connection errors

3. **Application Metrics**
   - Request rate and latency
   - Error rates
   - Throughput
   - User activity

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "postgres"
    static_configs:
      - targets: ["localhost:9187"] # Postgres exporter

  - job_name: "tripalfa-app"
    static_configs:
      - targets: ["localhost:3000"] # Application metrics
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "TripAlfa Database Performance",
    "panels": [
      {
        "title": "Query Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_statements_mean_time",
            "legendFormat": "Mean Time"
          }
        ]
      },
      {
        "title": "Connection Pool Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "db_connections_in_use / db_connections_max",
            "legendFormat": "Usage Ratio"
          }
        ]
      }
    ]
  }
}
```

## Security Best Practices

### Database Security

1. **Connection Encryption**

   ```sql
   -- Enable SSL connections
   ALTER SYSTEM SET ssl = on;
   ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';
   ALTER SYSTEM SET ssl_key_file = '/path/to/key.pem';
   ```

2. **User Permissions**

   ```sql
   -- Create limited user for application
   CREATE USER tripalfa_app WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE tripalfa TO tripalfa_app;
   GRANT USAGE ON SCHEMA public TO tripalfa_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tripalfa_app;
   ```

3. **Regular Security Audits**

   ```sql
   -- Check for unused accounts
   SELECT
       usename,
       valuntil,
       usesuper,
       usecreatedb
   FROM
       pg_user
   WHERE
       valuntil < NOW();
   ```

### Application Security

1. **SQL Injection Prevention**

   ```javascript
   // Use parameterized queries
   const bookings = await globalPrisma.booking.findMany({
     where: {
       userId: userId,
       status: { in: ["pending", "confirmed"] },
     },
   });
   ```

2. **API Rate Limiting**

   ```javascript
   // Implement rate limiting
   const rateLimit = require("express-rate-limit");

   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: "Too many requests from this IP, please try again later.",
   });
   ```

## Backup & Recovery

### Automated Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/tripalfa"

# Create backup
pg_dump -h localhost -U tripalfa_app -d tripalfa -F c -b -v -f ${BACKUP_DIR}/tripalfa_${DATE}.dump

# Keep last 7 days
find ${BACKUP_DIR} -name "tripalfa_*.dump" -mtime +7 -exec rm {} \;
```

### Point-in-Time Recovery

```sql
-- Restore to specific point in time
pg_restore -h localhost -U tripalfa_app -d tripalfa -c -C -1 -j 2 tripalfa_20231201.dump

-- Recovery to specific timestamp
psql -h localhost -U tripalfa_app -d tripalfa -c "SELECT pg_create_restore_point('recovery_point');"
```

## Performance Testing

### Load Testing Setup

```javascript
// Artillery load testing configuration
export default {
  scenarios: {
    bookings: {
      flow: [
        { get: { url: "/api/bookings" } },
        {
          post: {
            url: "/api/bookings",
            json: {
              /* booking data */
            },
          },
        },
      ],
    },
  },
  phases: [
    { duration: 60, arrivalRate: 10 },
    { duration: 120, arrivalRate: 50 },
    { duration: 60, arrivalRate: 10 },
  ],
  payload: {
    path: "bookings.csv",
    fields: ["userId", "flightRouteId", "hotelId"],
  },
};
```

### Performance Benchmarks

```sql
-- Benchmark queries
\timing
SELECT * FROM bookings WHERE user_id = 'user_123' AND status = 'pending';
SELECT * FROM search_history WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 50;
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Slow Query Performance

**Symptoms**: High response times, database timeouts
**Solutions**:

- Check query execution plans
- Add missing indexes
- Optimize query structure
- Increase work_mem if needed

#### 2. Connection Pool Exhaustion

**Symptoms**: "Too many connections" errors
**Solutions**:

- Increase pool size
- Optimize connection usage
- Implement connection reuse
- Add read replicas

#### 3. High Memory Usage

**Symptoms**: System slowdowns, OOM errors
**Solutions**:

- Adjust shared_buffers
- Optimize work_mem
- Add more RAM
- Implement query result caching

### Monitoring Commands

```bash
# Check database status
psql -h localhost -U tripalfa_app -d tripalfa -c "SELECT version();"
psql -h localhost -U tripalfa_app -d tripalfa -c "SELECT * FROM pg_stat_activity;"

# Check disk space
df -h
du -sh /var/lib/postgresql/data/

# Check memory usage
free -h
ps aux | grep postgres
```

## Best Practices

### Development

1. **Use Connection Pooling**: Always use connection pools in production
2. **Implement Caching**: Cache frequently accessed data
3. **Monitor Performance**: Set up comprehensive monitoring
4. **Regular Backups**: Automate backup procedures
5. **Security First**: Implement proper access controls

### Production

1. **Read Replicas**: Use read replicas for read-heavy operations
2. **Partitioning**: Partition large tables for better performance
3. **Regular Maintenance**: Vacuum and analyze regularly
4. **Performance Tuning**: Continuously optimize queries and indexes
5. **Disaster Recovery**: Test backup and recovery procedures

### Maintenance

1. **Regular Updates**: Keep PostgreSQL and dependencies updated
2. **Index Maintenance**: Rebuild fragmented indexes
3. **Log Analysis**: Review logs for performance issues
4. **Capacity Planning**: Plan for future growth
5. **Security Updates**: Apply security patches promptly

## Advanced Database Optimization

### Materialized Views Implementation

```sql
-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW booking_summary AS
SELECT
  booking_id,
  user_id,
  total_amount,
  status,
  created_at
FROM bookings
WHERE status IN ('confirmed', 'pending');

CREATE INDEX idx_booking_summary_user_id ON booking_summary(user_id);
CREATE INDEX idx_booking_summary_status ON booking_summary(status);

REFRESH MATERIALIZED VIEW booking_summary;
```

### Query Performance Monitoring

```sql
-- Create table to track query performance
CREATE TABLE query_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT,
  execution_time_ms INTEGER,
  rows_returned INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create index for query performance monitoring
CREATE INDEX idx_query_performance_timestamp ON query_performance(timestamp);

-- Insert query performance data
INSERT INTO query_performance (query_text, execution_time_ms, rows_returned)
VALUES ('SELECT * FROM bookings WHERE user_id = $1', 45, 10);
```

### Cache Performance Monitoring

```sql
-- Create table to track cache performance
CREATE TABLE cache_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT,
  hit_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  hit_rate DECIMAL(5,4),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create index for cache performance monitoring
CREATE INDEX idx_cache_performance_timestamp ON cache_performance(timestamp);

-- Update cache performance data
UPDATE cache_performance
SET hit_count = hit_count + 1, hit_rate = hit_count::DECIMAL / (hit_count + miss_count)
WHERE cache_key = 'user_bookings:123';
```

---

This deployment and optimization guide provides a comprehensive framework for maintaining a high-performance TripAlfa database system on Neon's MCP server infrastructure with shared database architecture and advanced performance optimizations.
