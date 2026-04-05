# Database Scaling Guide

## Overview

This guide provides comprehensive strategies for scaling each of the 4 TripAlfa databases independently based on their specific workload characteristics and performance requirements.

## Database Workload Analysis

### 1. **tripalfa_core** - High Transaction Volume

**Workload Characteristics:**

- High-frequency read/write operations
- User authentication and session management
- Booking creation and updates
- Wallet transactions
- Real-time data access

**Scaling Strategy:** Vertical scaling + Read replicas

### 2. **tripalfa_ops** - Moderate Transaction Volume

**Workload Characteristics:**

- Workflow processing and business rules
- Notification dispatch
- Audit logging
- Document management
- Batch processing operations

**Scaling Strategy:** Horizontal scaling + Partitioning

### 3. **tripalfa_local** - Read-Heavy Workload

**Workload Characteristics:**

- Static reference data (hotels, airports, flights)
- High read frequency, low write frequency
- Cache operations
- Search and lookup operations

**Scaling Strategy:** Read replicas + Caching

### 4. **tripalfa_finance** - Critical Transaction Volume

**Workload Characteristics:**

- Financial transactions and accounting
- Invoice processing
- Commission calculations
- Loyalty program operations
- Compliance and audit requirements

**Scaling Strategy:** Vertical scaling + High availability

## Scaling Strategies by Database

### **tripalfa_core Scaling**

#### 1. Vertical Scaling (Scale Up)

```sql
-- Monitor current resource usage
SELECT
    pg_size_pretty(pg_database_size('tripalfa_core')) as database_size,
    count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'tripalfa_core';

-- Recommended instance sizes based on load:
-- Low load (< 100 concurrent users): 4 vCPU, 16GB RAM
-- Medium load (100-1000 users): 8 vCPU, 32GB RAM
-- High load (> 1000 users): 16+ vCPU, 64GB+ RAM
```

#### 2. Read Replicas Configuration

```yaml
# PostgreSQL configuration for read replicas
# postgresql.conf settings

# Primary database settings
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Replication settings
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
hot_standby = on
hot_standby_feedback = on
```

#### 3. Connection Pool Optimization

```javascript
// Enhanced connection pool configuration for core database
const corePoolConfig = {
  connectionString: process.env.CORE_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  max: 50, // Increase for high load
  min: 10, // Minimum connections
  idleTimeoutMillis: 60000, // 1 minute idle timeout
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,

  // Connection health checks
  application_name: 'tripalfa-core',
  options: '-c statement_timeout=30s',
};
```

#### 4. Index Optimization

```sql
-- Critical indexes for core database performance
CREATE INDEX CONCURRENTLY idx_bookings_user_id ON bookings(user_id);
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY idx_bookings_created_at ON bookings(created_at);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_wallet_user_id ON wallet(user_id);
CREATE INDEX CONCURRENTLY idx_payment_records_booking_id ON payment_records(booking_id);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX CONCURRENTLY idx_bookings_date_range ON bookings(created_at, status);
```

### **tripalfa_ops Scaling**

#### 1. Horizontal Scaling with Partitioning

```sql
-- Partition audit logs by date
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition notifications by status
CREATE TABLE notifications_pending PARTITION OF notifications
FOR VALUES IN ('pending');

CREATE TABLE notifications_sent PARTITION OF notifications
FOR VALUES IN ('sent');

CREATE TABLE notifications_failed PARTITION OF notifications
FOR VALUES IN ('failed');
```

#### 2. Workflow Queue Optimization

```sql
-- Optimize queue tables for high throughput
CREATE INDEX CONCURRENTLY idx_booking_queue_status_priority
ON booking_queue(status, priority, created_at);

CREATE INDEX CONCURRENTLY idx_booking_queue_worker_id
ON booking_queue(worker_id)
WHERE status = 'processing';

-- Add partial indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_rules_active
ON rules(active)
WHERE active = true;
```

#### 3. Batch Processing Configuration

```javascript
// Batch processing optimization for ops database
const opsBatchConfig = {
  batchSize: 1000, // Process 1000 records at a time
  concurrency: 5, // 5 concurrent batch processes
  retryAttempts: 3, // Retry failed batches
  retryDelay: 1000, // 1 second delay between retries
  timeout: 300000, // 5 minute timeout for large batches

  // Memory optimization for batch processing
  memoryLimit: '2GB',
  gcThreshold: 100, // Force garbage collection every 100 records
};
```

### **tripalfa_local Scaling**

#### 1. Read Replicas for Static Data

```yaml
# Configuration for local database read replicas
# Optimized for read-heavy workloads

# Primary database (write operations only)
primary:
  max_connections: 50
  shared_buffers: 2GB
  effective_cache_size: 8GB

# Read replica 1 (hotels and flights)
replica1:
  max_connections: 200
  shared_buffers: 4GB
  effective_cache_size: 16GB
  default_statistics_target: 500 # Higher for better query planning

# Read replica 2 (airports and static data)
replica2:
  max_connections: 100
  shared_buffers: 2GB
  effective_cache_size: 8GB
```

#### 2. Caching Strategy

```javascript
// Multi-level caching for local database
import Redis from 'ioredis';

class LocalDataCache {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.cacheTTL = 3600; // 1 hour
  }

  async getHotels(city, checkin, checkout) {
    const cacheKey = `hotels:${city}:${checkin}:${checkout}`;

    // Try cache first
    let hotels = await this.redis.get(cacheKey);
    if (hotels) {
      return JSON.parse(hotels);
    }

    // Query database
    hotels = await localDb.hotel.findMany({
      where: { city, checkin, checkout },
      include: { rooms: true },
    });

    // Cache results
    await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(hotels));
    return hotels;
  }

  async invalidateHotelCache(hotelId) {
    // Invalidate related cache entries
    await this.redis.del(`hotel:${hotelId}`);
    await this.redis.del(`hotels:*`); // Invalidate all hotel searches
  }
}
```

#### 3. Materialized Views for Complex Queries

```sql
-- Create materialized views for complex flight searches
CREATE MATERIALIZED VIEW flight_search_index AS
SELECT
    f.id,
    f.origin,
    f.destination,
    f.departure_time,
    f.arrival_time,
    f.price,
    a1.city as origin_city,
    a2.city as destination_city,
    a1.country as origin_country,
    a2.country as destination_country
FROM flights f
JOIN airports a1 ON f.origin = a1.code
JOIN airports a2 ON f.destination = a2.code;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_flight_search_index()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY flight_search_index;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 15 minutes
SELECT cron.schedule('refresh-flight-index', '*/15 * * * *', 'SELECT refresh_flight_search_index();');
```

### **tripalfa_finance Scaling**

#### 1. High Availability Configuration

```yaml
# Finance database high availability setup
# Critical for financial data integrity

primary_finance:
  # High-performance settings
  max_connections: 100
  shared_buffers: 8GB
  effective_cache_size: 24GB
  maintenance_work_mem = 2GB
  checkpoint_completion_target = 0.9

  # Financial data specific settings
  synchronous_commit = on
  wal_level = replica
  max_wal_senders = 5
  hot_standby = on

standby_finance:
  # Standby server configuration
  hot_standby = on
  hot_standby_feedback = on
  max_standby_streaming_delay = 30s
  max_standby_archive_delay = 30s
```

#### 2. Financial Data Partitioning

```sql
-- Partition financial tables by date for performance
CREATE TABLE invoices_2024_q1 PARTITION OF invoices
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE invoices_2024_q2 PARTITION OF invoices
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Partition transactions by type for query optimization
CREATE TABLE transactions_bookings PARTITION OF transactions
FOR VALUES IN ('booking');

CREATE TABLE transactions_refunds PARTITION OF transactions
FOR VALUES IN ('refund');

CREATE TABLE transactions_commissions PARTITION OF transactions
FOR VALUES IN ('commission');
```

#### 3. Financial Query Optimization

```sql
-- Optimize financial reporting queries
CREATE INDEX CONCURRENTLY idx_transactions_date_type
ON transactions(created_at, type);

CREATE INDEX CONCURRENTLY idx_invoices_status_date
ON invoices(status, created_at);

CREATE INDEX CONCURRENTLY idx_commissions_calculated_at
ON commissions(calculated_at);

-- Materialized view for financial reporting
CREATE MATERIALIZED VIEW daily_financial_summary AS
SELECT
    DATE(created_at) as transaction_date,
    type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), type
ORDER BY transaction_date DESC, type;
```

## Auto-Scaling Configuration

### 1. Monitoring-Based Auto-Scaling

```javascript
// Auto-scaling controller for database resources
class DatabaseAutoScaler {
  constructor() {
    this.metrics = new Map();
    this.scalingRules = {
      core: {
        cpuThreshold: 80,
        connectionThreshold: 80,
        scaleUp: { cpu: 20, memory: 32 },
        scaleDown: { cpu: 10, memory: 16 },
      },
      ops: {
        queueThreshold: 1000,
        batchSize: 500,
        workers: 10,
      },
      local: {
        cacheHitRate: 90,
        replicaLag: 5000, // 5 seconds
        readReplicas: 3,
      },
      finance: {
        transactionLatency: 100, // 100ms
        replicationLag: 1000, // 1 second
        failoverTime: 30000, // 30 seconds
      },
    };
  }

  async checkScalingRequirements() {
    for (const [dbName, rules] of Object.entries(this.scalingRules)) {
      const metrics = await this.collectMetrics(dbName);
      this.metrics.set(dbName, metrics);

      if (this.shouldScaleUp(dbName, metrics, rules)) {
        await this.scaleUp(dbName, rules.scaleUp);
      } else if (this.shouldScaleDown(dbName, metrics, rules)) {
        await this.scaleDown(dbName, rules.scaleDown);
      }
    }
  }

  async collectMetrics(dbName) {
    // Collect database-specific metrics
    const pool = this.getDatabasePool(dbName);
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          pg_stat_get_backend_idset() as backend_id,
          pg_stat_get_backend_activity(backend_id) as activity,
          pg_stat_get_backend_client_addr(backend_id) as client_addr,
          pg_stat_get_backend_state(backend_id) as state
        FROM pg_stat_get_backend_idset() backend_id
      `);

      return {
        activeConnections: result.rows.length,
        cpuUsage: await this.getCPUUsage(dbName),
        memoryUsage: await this.getMemoryUsage(dbName),
        queryLatency: await this.getAverageQueryLatency(dbName),
        diskIO: await this.getDiskIO(dbName),
      };
    } finally {
      client.release();
    }
  }
}
```

### 2. Kubernetes Database Scaling

```yaml
# Kubernetes deployment with auto-scaling for databases
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: tripalfa-core-db
spec:
  serviceName: tripalfa-core-db
  replicas: 3
  selector:
    matchLabels:
      app: tripalfa-core-db
  template:
    metadata:
      labels:
        app: tripalfa-core-db
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_DB
              value: tripalfa_core
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: password
          resources:
            requests:
              memory: '4Gi'
              cpu: '2000m'
            limits:
              memory: '8Gi'
              cpu: '4000m'
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 100Gi

---
# Horizontal Pod Autoscaler for read replicas
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tripalfa-local-db-replicas
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tripalfa-local-db-replica
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Performance Monitoring Integration

### 1. Database-Specific Metrics

```javascript
// Enhanced performance monitoring for scaling decisions
class DatabasePerformanceMonitor {
  constructor() {
    this.metrics = {
      core: {
        connectionPool: { active: 0, idle: 0, waiting: 0 },
        queryPerformance: { avg: 0, p95: 0, p99: 0 },
        lockWaits: { count: 0, avgTime: 0 },
        replicationLag: 0,
      },
      ops: {
        queueDepth: 0,
        processingRate: 0,
        errorRate: 0,
        batchSize: 0,
      },
      local: {
        cacheHitRate: 0,
        readReplicaLag: 0,
        queryCacheEfficiency: 0,
        indexUsage: {},
      },
      finance: {
        transactionLatency: 0,
        complianceChecks: 0,
        auditLogSize: 0,
        dataIntegrity: true,
      },
    };
  }

  async collectScalingMetrics() {
    // Collect metrics for auto-scaling decisions
    const scalingMetrics = {
      timestamp: new Date().toISOString(),
      databases: {},
    };

    for (const [dbName, pool] of Object.entries(this.databasePools)) {
      const client = await pool.connect();

      try {
        // Core database metrics
        if (dbName === 'core') {
          const coreMetrics = await client.query(`
            SELECT 
              count(*) as active_connections,
              count(*) FILTER (WHERE state = 'active') as running_queries,
              avg(extract(epoch from now() - query_start)) as avg_query_time
            FROM pg_stat_activity 
            WHERE datname = 'tripalfa_core'
          `);

          scalingMetrics.databases.core = {
            activeConnections: parseInt(coreMetrics.rows[0].active_connections),
            runningQueries: parseInt(coreMetrics.rows[0].running_queries),
            avgQueryTime: parseFloat(coreMetrics.rows[0].avg_query_time),
            connectionUtilization:
              (parseInt(coreMetrics.rows[0].active_connections) / pool.options.max) * 100,
          };
        }

        // Ops database metrics
        if (dbName === 'ops') {
          const opsMetrics = await client.query(`
            SELECT 
              count(*) as queue_depth,
              count(*) FILTER (WHERE status = 'processing') as processing,
              avg(extract(epoch from now() - created_at)) as avg_processing_time
            FROM booking_queue 
            WHERE status IN ('pending', 'processing')
          `);

          scalingMetrics.databases.ops = {
            queueDepth: parseInt(opsMetrics.rows[0].queue_depth),
            processing: parseInt(opsMetrics.rows[0].processing),
            avgProcessingTime: parseFloat(opsMetrics.rows[0].avg_processing_time),
          };
        }

        // Local database metrics
        if (dbName === 'local') {
          const localMetrics = await client.query(`
            SELECT 
              sum(idx_scan) as index_scans,
              sum(seq_scan) as sequential_scans,
              sum(idx_scan) / nullif(sum(idx_scan) + sum(seq_scan), 0) as index_hit_ratio
            FROM pg_stat_user_tables
          `);

          scalingMetrics.databases.local = {
            indexHitRatio: parseFloat(localMetrics.rows[0].index_hit_ratio || 0) * 100,
            totalScans:
              parseInt(localMetrics.rows[0].index_scans) +
              parseInt(localMetrics.rows[0].sequential_scans),
          };
        }

        // Finance database metrics
        if (dbName === 'finance') {
          const financeMetrics = await client.query(`
            SELECT 
              avg(extract(epoch from now() - created_at)) as avg_transaction_time,
              count(*) FILTER (WHERE created_at > now() - interval '1 hour') as hourly_transactions
            FROM transactions
          `);

          scalingMetrics.databases.finance = {
            avgTransactionTime: parseFloat(financeMetrics.rows[0].avg_transaction_time),
            hourlyTransactions: parseInt(financeMetrics.rows[0].hourly_transactions),
          };
        }
      } finally {
        client.release();
      }
    }

    return scalingMetrics;
  }
}
```

### 2. Scaling Alert System

```javascript
// Alert system for database scaling events
class DatabaseScalingAlerts {
  constructor() {
    this.alertRules = {
      core: {
        highConnectionUsage: { threshold: 80, severity: 'warning' },
        slowQueryRate: { threshold: 10, severity: 'critical' },
        replicationLag: { threshold: 5000, severity: 'critical' },
      },
      ops: {
        queueDepth: { threshold: 1000, severity: 'warning' },
        processingFailureRate: { threshold: 5, severity: 'critical' },
        batchProcessingTime: { threshold: 300000, severity: 'warning' },
      },
      local: {
        cacheMissRate: { threshold: 20, severity: 'warning' },
        readReplicaLag: { threshold: 10000, severity: 'critical' },
        indexScanRatio: { threshold: 10, severity: 'warning' },
      },
      finance: {
        transactionLatency: { threshold: 1000, severity: 'critical' },
        dataIntegrityFailure: { threshold: 0, severity: 'critical' },
        auditLogGrowth: { threshold: 1000000, severity: 'warning' },
      },
    };
  }

  async checkScalingAlerts(metrics) {
    const alerts = [];

    for (const [dbName, dbMetrics] of Object.entries(metrics.databases)) {
      const rules = this.alertRules[dbName];

      if (!rules) continue;

      for (const [metricName, rule] of Object.entries(rules)) {
        const currentValue = dbMetrics[metricName];
        const threshold = rule.threshold;

        if (currentValue !== undefined && currentValue >= threshold) {
          alerts.push({
            database: dbName,
            metric: metricName,
            currentValue: currentValue,
            threshold: threshold,
            severity: rule.severity,
            timestamp: new Date().toISOString(),
            message: `${dbName.toUpperCase()} ${metricName} (${currentValue}) exceeded threshold (${threshold})`,
          });
        }
      }
    }

    return alerts;
  }

  async sendScalingAlerts(alerts) {
    for (const alert of alerts) {
      // Send to monitoring system
      await this.sendToMonitoring(alert);

      // Send to alerting system
      await this.sendToAlerting(alert);

      // Log the alert
      console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    }
  }
}
```

## Cost Optimization

### 1. Resource Allocation by Database

```yaml
# Cost-optimized resource allocation
database_resources:
  core:
    instance_type: db.r6g.xlarge # High CPU for transaction processing
    storage: gp3
    storage_size: 500GB
    iops: 3000
    auto_scaling: true
    max_instances: 5

  ops:
    instance_type: db.t4g.large # General purpose for workflow processing
    storage: gp3
    storage_size: 200GB
    iops: 1000
    auto_scaling: true
    max_instances: 3

  local:
    instance_type: db.r6g.large # Memory optimized for read caching
    storage: gp3
    storage_size: 1000GB
    iops: 5000
    read_replicas: 3
    auto_scaling: false

  finance:
    instance_type: db.r6g.2xlarge # High performance for financial transactions
    storage: io2
    storage_size: 300GB
    iops: 10000
    multi_az: true
    auto_scaling: false
```

### 2. Storage Optimization

```sql
-- Archive old data to reduce storage costs
-- Archive audit logs older than 1 year
CREATE TABLE audit_logs_archive AS
SELECT * FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- Archive old booking data (keep only last 2 years for active queries)
CREATE TABLE bookings_archive AS
SELECT * FROM bookings
WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
AND status NOT IN ('active', 'confirmed');

DELETE FROM bookings
WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
AND status NOT IN ('active', 'confirmed');
```

This comprehensive scaling guide provides detailed strategies for independently scaling each database based on its specific workload characteristics, ensuring optimal performance and cost efficiency for your TripAlfa 4-database architecture.
