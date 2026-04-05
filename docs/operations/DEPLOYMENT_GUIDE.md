# TripAlfa Database Architecture Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the TripAlfa project with the new 4-database architecture to staging and production environments.

## Prerequisites

### Environment Requirements

- Node.js 18+
- npm or pnpm
- PostgreSQL 13+
- psql client
- Access to 4 PostgreSQL databases:
  - `tripalfa_core`
  - `tripalfa_ops`
  - `tripalfa_local`
  - `tripalfa_finance`

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database URLs (required)
CORE_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_core"
OPS_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_ops"
LOCAL_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_local"
FINANCE_DATABASE_URL="postgresql://user:pass@host:port/tripalfa_finance"

# Application Environment
NODE_ENV="staging"  # or "production"

# Optional: SSL Configuration
DB_SSL_REJECT_UNAUTHORIZED="true"  # For production SSL validation

# Optional: Connection Pool Settings
DB_POOL_MAX="20"
DB_IDLE_TIMEOUT_MS="30000"
DB_CONNECTION_TIMEOUT_MS="10000"
DB_STATEMENT_TIMEOUT_MS="30000"
```

## Deployment Process

### Step 1: Environment Verification

Run the staging environment verification script to ensure all prerequisites are met:

```bash
node scripts/verify-staging-environment.js
```

This script will verify:

- ✅ Environment variables are set
- ✅ Required dependencies are installed
- ✅ Database connections are working
- ✅ All services are built successfully

### Step 2: Database Setup

#### For New Deployments

1. **Create Databases** (if not already created):

   ```sql
   CREATE DATABASE tripalfa_core;
   CREATE DATABASE tripalfa_ops;
   CREATE DATABASE tripalfa_local;
   CREATE DATABASE tripalfa_finance;
   ```

2. **Run Migrations**:
   ```bash
   # Run migrations for each database
   npx prisma migrate dev --schema=database/prisma/schema.core.prisma
   npx prisma migrate dev --schema=database/prisma/schema.ops.prisma
   npx prisma migrate dev --schema=database/prisma/schema.local.prisma
   npx prisma migrate dev --schema=database/prisma/schema.finance.prisma
   ```

#### For Existing Deployments

1. **Check Migration Status**:

   ```bash
   npx prisma migrate status --schema=database/prisma/schema.core.prisma
   npx prisma migrate status --schema=database/prisma/schema.ops.prisma
   npx prisma migrate status --schema=database/prisma/schema.local.prisma
   npx prisma migrate status --schema=database/prisma/schema.finance.prisma
   ```

2. **Apply Pending Migrations**:
   ```bash
   npx prisma migrate deploy --schema=database/prisma/schema.core.prisma
   npx prisma migrate deploy --schema=database/prisma/schema.ops.prisma
   npx prisma migrate deploy --schema=database/prisma/schema.local.prisma
   npx prisma migrate deploy --schema=database/prisma/schema.finance.prisma
   ```

### Step 3: Service Deployment

#### Automated Deployment

Use the deployment script for automated deployment:

```bash
# Make the script executable (if not already)
chmod +x scripts/deploy-services.sh

# Run deployment
./scripts/deploy-services.sh
```

The deployment script will:

1. ✅ Validate environment configuration
2. ✅ Test database connections
3. ✅ Build all services
4. ✅ Deploy services in dependency order
5. ✅ Generate deployment logs

#### Manual Deployment

If you prefer manual deployment, follow these steps:

1. **Build All Services**:

   ```bash
   # Build each service individually
   cd services/booking-service && pnpm build
   cd services/b2b-admin-service && pnpm build
   cd services/wallet-service && pnpm build
   cd services/payment-service && pnpm build
   cd services/notification-service && pnpm build
   cd services/rule-engine-service && pnpm build
   cd services/kyc-service && pnpm build
   cd services/company-service && pnpm build
   cd services/auth-service && pnpm build
   cd services/marketing-service && pnpm build
   cd services/api-gateway && pnpm build
   cd services/booking-engine-service && pnpm build
   ```

2. **Deploy Services in Order**:

   ```bash
   # Start with core services
   cd services/auth-service && NODE_ENV=staging CORE_DATABASE_URL=$CORE_DATABASE_URL node dist/index.js &

   cd services/api-gateway && NODE_ENV=staging CORE_DATABASE_URL=$CORE_DATABASE_URL node dist/index.js &

   cd services/user-service && NODE_ENV=staging CORE_DATABASE_URL=$CORE_DATABASE_URL node dist/index.js &

   # Continue with other services...
   ```

### Step 4: Performance Monitoring

#### Start Database Performance Monitoring

```bash
# Start monitoring with 30-second intervals (default)
node scripts/monitor-database-performance.js

# Start monitoring with custom interval (e.g., 60 seconds)
node scripts/monitor-database-performance.js 60000
```

The monitoring script provides:

- 📊 Real-time connection statistics
- ⚡ Query performance metrics
- 🚨 Alert system for performance issues
- 📈 Historical performance logging

#### Monitor Application Logs

```bash
# Monitor logs from all services
tail -f logs/*.log

# Monitor specific service logs
tail -f logs/booking-service_deploy_*.log
```

### Step 5: Health Checks and Testing

#### Service Health Checks

```bash
# Check if services are responding
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Booking Service
# ... check other services
```

#### Integration Testing

```bash
# Run integration tests
pnpm test:integration

# Run specific service tests
cd services/booking-service && pnpm test
cd services/auth-service && pnpm test
# ... test other services
```

## Service Dependencies and Order

### Deployment Order

Services must be deployed in the following order due to dependencies:

1. **auth-service** - Authentication and user management
2. **api-gateway** - API routing and authentication
3. **user-service** - User data management
4. **kyc-service** - User verification
5. **company-service** - Company management
6. **booking-service** - Core booking operations
7. **booking-engine-service** - Booking engine
8. **wallet-service** - Wallet management
9. **payment-service** - Payment processing
10. **notification-service** - Notifications
11. **rule-engine-service** - Business rules
12. **b2b-admin-service** - Admin operations
13. **marketing-service** - Marketing campaigns

### Database Dependencies

| Service              | Required Databases | Purpose                         |
| -------------------- | ------------------ | ------------------------------- |
| auth-service         | core               | User authentication             |
| api-gateway          | core               | User data and routing           |
| booking-service      | core, ops, local   | Bookings, queues, static data   |
| wallet-service       | core, finance      | Wallet and financial operations |
| payment-service      | core, finance      | Payment processing              |
| notification-service | ops                | Notification workflows          |
| b2b-admin-service    | core, ops, finance | Admin across all domains        |

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `Failed to connect to database`

**Solution**:

- Verify database URLs in environment variables
- Check database server accessibility
- Ensure SSL settings match your environment
- Test connections with psql: `psql $DATABASE_URL`

#### 2. Build Failures

**Error**: `Build failed` or TypeScript errors

**Solution**:

- Check TypeScript configuration in `tsconfig.json`
- Ensure all dependencies are installed: `pnpm install`
- Verify import statements in database.ts files
- Check for missing environment variables

#### 3. Service Startup Failures

**Error**: `Service failed to start`

**Solution**:

- Check service logs in `logs/` directory
- Verify required database connections
- Check environment variables for the service
- Ensure dependent services are running

#### 4. Performance Issues

**Symptoms**: Slow queries, high connection usage

**Solution**:

- Run performance monitoring: `node scripts/monitor-database-performance.js`
- Check for missing indexes in slow queries
- Review connection pool settings
- Monitor database resource usage

### Debug Commands

```bash
# Check environment variables
echo $CORE_DATABASE_URL
echo $OPS_DATABASE_URL
echo $LOCAL_DATABASE_URL
echo $FINANCE_DATABASE_URL

# Test database connections
psql $CORE_DATABASE_URL -c "SELECT 1;"
psql $OPS_DATABASE_URL -c "SELECT 1;"
psql $LOCAL_DATABASE_URL -c "SELECT 1;"
psql $FINANCE_DATABASE_URL -c "SELECT 1;"

# Check service status
ps aux | grep node

# View service logs
tail -f logs/service-name_*.log
```

## Production Deployment

### Additional Steps for Production

1. **SSL Configuration**:

   ```bash
   export DB_SSL_REJECT_UNAUTHORIZED="true"
   ```

2. **Connection Pool Tuning**:

   ```bash
   export DB_POOL_MAX="50"  # Increase for production
   export DB_IDLE_TIMEOUT_MS="60000"
   ```

3. **Process Management**:

   ```bash
   # Use PM2 for production process management
   npm install -g pm2

   # Start services with PM2
   pm2 start services/auth-service/dist/index.js --name auth-service
   pm2 start services/api-gateway/dist/index.js --name api-gateway
   # ... start other services
   ```

4. **Load Balancing**:
   - Set up reverse proxy (nginx, HAProxy)
   - Configure load balancing across service instances
   - Implement health checks

5. **Monitoring and Alerting**:
   - Set up monitoring with Prometheus/Grafana
   - Configure alerting for critical metrics
   - Monitor database performance and resource usage

### Security Considerations

1. **Environment Variables**:
   - Store secrets in secure vaults
   - Use environment-specific configurations
   - Never commit secrets to version control

2. **Database Security**:
   - Use SSL connections in production
   - Implement proper user permissions
   - Regular security audits

3. **Network Security**:
   - Use firewalls and security groups
   - Implement API rate limiting
   - Use HTTPS for all communications

## Rollback Procedures

### Service Rollback

1. **Stop Current Services**:

   ```bash
   # Stop services
   pkill -f "node.*dist/index.js"
   ```

2. **Deploy Previous Version**:

   ```bash
   # Checkout previous commit
   git checkout HEAD~1

   # Rebuild and deploy
   ./scripts/deploy-services.sh
   ```

### Database Rollback

1. **Check Migration History**:

   ```bash
   npx prisma migrate status --schema=database/prisma/schema.core.prisma
   ```

2. **Rollback Migration**:
   ```bash
   npx prisma migrate reset --schema=database/prisma/schema.core.prisma
   ```

**⚠️ Warning**: Database rollbacks may result in data loss. Always backup before rolling back.

## Post-Deployment Checklist

- [ ] All services are running and responding to health checks
- [ ] Database connections are established and stable
- [ ] Performance monitoring is active
- [ ] Logs are being generated and monitored
- [ ] Integration tests are passing
- [ ] No errors in service logs
- [ ] Database performance is within acceptable thresholds
- [ ] Backup procedures are in place
- [ ] Monitoring and alerting are configured
- [ ] Documentation is updated

## Support and Maintenance

### Regular Maintenance

1. **Database Maintenance**:
   - Monitor disk space usage
   - Run VACUUM and ANALYZE operations
   - Review and optimize slow queries
   - Monitor connection pool usage

2. **Application Maintenance**:
   - Monitor service health and performance
   - Review and rotate logs
   - Update dependencies regularly
   - Run security scans

3. **Infrastructure Maintenance**:
   - Monitor system resources
   - Update security patches
   - Review backup procedures
   - Test disaster recovery plans

### Getting Help

- **Documentation**: Check the `docs/` directory for detailed guides
- **Logs**: Review service and database logs for error details
- **Monitoring**: Use the performance monitoring script for real-time insights
- **Community**: Reach out to the development team for support

## Conclusion

This deployment guide provides comprehensive instructions for deploying the TripAlfa project with the new 4-database architecture. The automated scripts and verification tools help ensure a smooth deployment process with minimal manual intervention.

For any issues or questions, refer to this guide or consult the development team. Regular monitoring and maintenance will help ensure the system continues to perform optimally in production.
