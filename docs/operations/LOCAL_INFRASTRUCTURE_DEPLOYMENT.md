# Local Infrastructure Deployment Guide

## Overview
This guide covers the deployment of TripAlfa's complete infrastructure stack on a local machine.
The system uses a 4-database architecture with 15+ microservices, reverse proxy, and full monitoring stack.

## Architecture Components

### 1. Database Layer (4 PostgreSQL Databases)
- **tripalfa_core**: Core business data (users, bookings, wallet, KYC)
- **tripalfa_local**: Static reference data (hotels, flights, currencies)
- **tripalfa_ops**: Operational data (notifications, rule engine, documents)
- **tripalfa_finance**: Financial data (invoicing, commissions, suppliers)

### 2. Service Layer (15+ Microservices)
- API Gateway (port 3000)
- Booking Service (port 3001)
- User Service (port 3004)
- Payment Service (port 3007)
- Wallet Service (port 3008)
- Notification Service (port 3009)
- Rule Engine Service (port 3010)
- KYC Service (port 3011)
- Marketing Service (port 3012)
- Company Service (port 3006)
- B2B Admin Service (port 3020)
- Booking Engine Service (port 3021)
- Auth Service (port 3005)

### 3. Infrastructure Layer
- **Nginx Reverse Proxy** (port 80/443)
- **Redis** (port 6379) - Caching & queues
- **Monitoring Stack**:
  - Prometheus (port 9090)
  - Alertmanager (port 9093)
  - Grafana (port 3500)
  - Loki (port 3100)
  - Promtail (log collection)

## Prerequisites

### System Requirements
- **Operating System**: macOS, Linux, or Windows (WSL2)
- **Memory**: 16GB RAM minimum (32GB recommended)
- **Storage**: 50GB free disk space
- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher
- **PostgreSQL**: 15.x or higher

### Required Software
```bash
# Install Node.js and pnpm
brew install node pnpm  # macOS
# or
apt install nodejs pnpm  # Ubuntu

# Install PostgreSQL
brew install postgresql@15  # macOS
# or
apt install postgresql-15  # Ubuntu

# Install Redis
brew install redis  # macOS
# or
apt install redis-server  # Ubuntu
```

## Step-by-Step Deployment

### Step 1: Database Setup

#### 1.1 Start PostgreSQL
```bash
# macOS with Homebrew
brew services start postgresql@15

# Ubuntu
sudo systemctl start postgresql
```

#### 1.2 Create Databases and Users
```bash
# Connect to PostgreSQL
psql postgres

# Create databases
CREATE DATABASE tripalfa_core;
CREATE DATABASE tripalfa_local;
CREATE DATABASE tripalfa_ops;
CREATE DATABASE tripalfa_finance;

# Create user (adjust password)
CREATE USER tripalfa WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tripalfa_core TO tripalfa;
GRANT ALL PRIVILEGES ON DATABASE tripalfa_local TO tripalfa;
GRANT ALL PRIVILEGES ON DATABASE tripalfa_ops TO tripalfa;
GRANT ALL PRIVILEGES ON DATABASE tripalfa_finance TO tripalfa;

# Exit
\q
```

#### 1.3 Run Database Migrations
```bash
# From project root
pnpm run db:migrate:core
pnpm run db:migrate:local
pnpm run db:migrate:ops
pnpm run db:migrate:finance

# Seed initial data
pnpm run db:seed:core
pnpm run db:seed:local
```

### Step 2: Environment Configuration

#### 2.1 Copy Environment Template
```bash
cp .env.example .env
cp .env.example .env.local
```

#### 2.2 Configure Database URLs
Update `.env` with your database credentials:
```env
# Core Database
DATABASE_URL="postgresql://tripalfa:secure_password@localhost:5432/tripalfa_core"
CORE_DATABASE_URL="postgresql://tripalfa:secure_password@localhost:5432/tripalfa_core"

# Local Database
LOCAL_DATABASE_URL="postgresql://tripalfa:secure_password@localhost:5432/tripalfa_local"

# Ops Database
OPS_DATABASE_URL="postgresql://tripalfa:secure_password@localhost:5432/tripalfa_ops"

# Finance Database
FINANCE_DATABASE_URL="postgresql://tripalfa:secure_password@localhost:5432/tripalfa_finance"

# Redis
REDIS_URL="redis://localhost:6379"
QUEUE_REDIS_URL="redis://localhost:6379"
```

#### 2.3 Configure Monitoring (Optional but Recommended)
```env
# Monitoring Stack
PROMETHEUS_PORT=9090
ALERTMANAGER_PORT=9093
GRAFANA_PORT=3500
LOKI_PORT=3100

# Alerting (fill with your values)
SLACK_WEBHOOK_URL=""
RESEND_WEBHOOK_URL=""
PAGERDUTY_SERVICE_KEY=""
```

### Step 3: Start Infrastructure Services

#### 3.1 Start Redis
```bash
# macOS
brew services start redis

# Ubuntu
sudo systemctl start redis-server

# Verify
redis-cli ping  # Should return "PONG"
```

#### 3.2 Start Nginx Reverse Proxy
```bash
# Install nginx if not present
brew install nginx  # macOS
# or
apt install nginx   # Ubuntu

# Copy configuration
sudo cp infrastructure/nginx/nginx.conf /usr/local/etc/nginx/nginx.conf

# Start nginx
sudo nginx

# Reload configuration
sudo nginx -s reload
```

### Step 4: Start Monitoring Stack

#### 4.1 Start Prometheus
```bash
# Navigate to monitoring directory
cd infrastructure/monitoring

# Start Prometheus
prometheus --config.file=prometheus.yml --web.listen-address=:9090 &

# Verify
curl http://localhost:9090/metrics
```

#### 4.2 Start Alertmanager
```bash
alertmanager --config.file=alertmanager.yml --web.listen-address=:9093 &
```

#### 4.3 Start Loki
```bash
loki --config.file=loki.yml &
```

#### 4.4 Start Promtail
```bash
promtail --config.file=promtail.yml &
```

#### 4.5 Start Grafana
```bash
grafana-server --config=grafana.ini --homepath=/usr/share/grafana &
```

### Step 5: Start Application Services

#### 5.1 Install Dependencies
```bash
# From project root
pnpm install
```

#### 5.2 Start Services in Order
```bash
# Terminal 1: API Gateway
pnpm --dir services/api-gateway dev

# Terminal 2: Auth Service
pnpm --dir services/auth-service dev

# Terminal 3: User Service
pnpm --dir services/user-service dev

# Terminal 4: Booking Service
pnpm --dir services/booking-service dev

# Terminal 5: Payment Service
pnpm --dir services/payment-service dev

# Terminal 6: Notification Service
pnpm --dir services/notification-service dev

# Continue with remaining services...
```

#### 5.3 Alternative: Use Process Manager
Create a `Procfile` for use with `foreman` or `pm2`:
```yaml
api-gateway: pnpm --dir services/api-gateway dev
auth-service: pnpm --dir services/auth-service dev
user-service: pnpm --dir services/user-service dev
booking-service: pnpm --dir services/booking-service dev
payment-service: pnpm --dir services/payment-service dev
notification-service: pnpm --dir services/notification-service dev
wallet-service: pnpm --dir services/wallet-service dev
kyc-service: pnpm --dir services/kyc-service dev
company-service: pnpm --dir services/company-service dev
b2b-admin-service: pnpm --dir services/b2b-admin-service dev
booking-engine-service: pnpm --dir services/booking-engine-service dev
```

Start with:
```bash
# Using foreman
gem install foreman
foreman start -f Procfile

# Using pm2
npm install -g pm2
pm2 start ecosystem.config.js
```

### Step 6: Verify Deployment

#### 6.1 Check Service Health
```bash
# API Gateway
curl http://localhost:3000/health

# Individual services
curl http://localhost:3001/health  # Booking Service
curl http://localhost:3004/health  # User Service
curl http://localhost:3007/health  # Payment Service
```

#### 6.2 Check Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3500 (admin/admin)
- **Alertmanager**: http://localhost:9093

#### 6.3 Check Reverse Proxy
```bash
# Through nginx
curl http://localhost/api/health
curl http://localhost/b2b/health
```

## Service Port Reference

| Service | Port | Health Endpoint | Description |
|---------|------|-----------------|-------------|
| API Gateway | 3000 | `/health` | Main API entry point |
| Booking Service | 3001 | `/health` | Flight/hotel bookings |
| User Service | 3004 | `/health` | User management |
| Payment Service | 3007 | `/health` | Payment processing |
| Wallet Service | 3008 | `/health` | Wallet transactions |
| Notification Service | 3009 | `/health` | Email/SMS notifications |
| Rule Engine Service | 3010 | `/health` | Business rules |
| KYC Service | 3011 | `/health` | KYC verification |
| Marketing Service | 3012 | `/health` | Campaigns & promotions |
| Company Service | 3006 | `/health` | Company management |
| B2B Admin Service | 3020 | `/health` | B2B admin panel |
| Booking Engine Service | 3021 | `/health` | Booking engine UI |
| Auth Service | 3005 | `/health` | Authentication |
| Prometheus | 9090 | `/metrics` | Metrics collection |
| Grafana | 3500 | `/api/health` | Monitoring dashboards |
| Alertmanager | 9093 | `/health` | Alert management |
| Loki | 3100 | `/ready` | Log aggregation |
| Redis | 6379 | `PING` | Caching & queues |
| PostgreSQL | 5432 | N/A | Databases |

## Troubleshooting

### Common Issues

#### 1. Database Connection Failures
```bash
# Test database connection
psql "postgresql://tripalfa:password@localhost:5432/tripalfa_core"

# Check PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql
```

#### 2. Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
# or
netstat -tulpn | grep :3000
```

#### 3. Service Not Starting
```bash
# Check logs
tail -f services/auth-service/logs/development.log

# Increase Node.js memory if needed
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4. Monitoring Stack Issues
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .

# Check Loki logs
curl http://localhost:3100/ready
```

### Debug Commands
```bash
# Check all services health
./scripts/check-health.sh

# View service logs
./scripts/view-logs.sh auth-service

# Restart a service
./scripts/restart-service.sh booking-service
```

## Maintenance

### Daily Operations
1. **Check service health**: Run health check script
2. **Monitor logs**: Check for errors in service logs
3. **Verify backups**: Ensure database backups are running
4. **Check monitoring**: Review Grafana dashboards

### Weekly Maintenance
1. **Update dependencies**: `pnpm update`
2. **Clean up logs**: Rotate log files
3. **Database maintenance**: Run `VACUUM ANALYZE`
4. **Review alerts**: Check Alertmanager for unresolved alerts

### Monthly Maintenance
1. **Security updates**: Update Node.js, PostgreSQL, Redis
2. **Performance review**: Analyze slow queries
3. **Backup test**: Test restore procedure
4. **Capacity planning**: Review disk space and memory usage

## Scaling Considerations

### Vertical Scaling (Single Machine)
- Increase RAM to 32GB+ for production-like loads
- Use SSD storage for databases
- Configure PostgreSQL with appropriate `shared_buffers` and `work_mem`
- Use connection pooling (PgBouncer)

### Horizontal Scaling (Multiple Machines)
1. Separate databases to dedicated servers
2. Use read replicas for reporting
3. Implement Redis cluster
4. Use load balancer for API Gateway

## Security Hardening

### Local Development Security
1. **Change default passwords**: PostgreSQL, Redis, Grafana
2. **Enable firewall**: Restrict access to necessary ports
3. **Use .env.local**: Keep secrets out of version control
4. **Regular updates**: Keep all software updated

### Production Security (When Ready)
1. **Enable SSL/TLS**: For all services
2. **Implement authentication**: For monitoring stack
3. **Network segmentation**: Isolate databases
4. **Audit logging**: Enable comprehensive audit trails

## Backup and Recovery

### Database Backups
```bash
# Backup all databases
./scripts/backup-all-databases.sh

# Restore database
./scripts/restore-database.sh tripalfa_core backup_file.sql
```

### Configuration Backups
```bash
# Backup environment files
cp .env .env.backup.$(date +%Y%m%d)
cp .env.local .env.local.backup.$(date +%Y%m%d)
```

## Next Steps

### After Local Deployment
1. **Run tests**: `pnpm test`
2. **Load testing**: Simulate user traffic
3. **Security scan**: Run vulnerability assessment
4. **Documentation**: Update team documentation

### Transition to Production
1. **Review production checklist**: `docs/PRODUCTION_READINESS_CHECKLIST.md`
2. **Set up CI/CD**: Automated deployment pipeline
3. **Monitoring**: Configure production alerting
4. **Disaster recovery**: Test backup and restore

## Support

### Getting Help
- **Documentation**: Check `docs/` directory
- **Logs**: Service logs in `services/*/logs/`
- **Monitoring**: Grafana dashboards at http://localhost:3500
- **Issues**: Create GitHub issues for bugs

### Emergency Procedures
1. **Service down**: Check logs, restart service
2. **Database issues**: Check PostgreSQL logs, restore from backup
3. **Memory issues**: Check `htop`, restart heavy services
4. **Network issues**: Check nginx, firewall settings

---
*Last Updated: $(date)*  
*Owner: Infrastructure Team*  
*Status: Active*
