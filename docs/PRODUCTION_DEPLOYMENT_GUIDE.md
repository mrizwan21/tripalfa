# Production Deployment Guide for TripAlfa

## Pre-Deployment Checklist

### 1. Environment & Configuration ✅
- [ ] Environment variables configured for production
- [ ] Database credentials secured in secret manager
- [ ] API keys and secrets stored in `.env.production`
- [ ] CORS origins whitelist properly configured
- [ ] Rate limiting thresholds set appropriately
- [ ] Session timeout configured (recommended: 30-60 minutes)

### 2. Database & Data ✅
- [ ] Database backups configured and tested
- [ ] Migration scripts tested in staging
- [ ] Seed data verified in production environment
- [ ] Database indexes optimized
- [ ] Connection pooling configured (PgBouncer for Neon)
- [ ] Monitoring for database queries enabled

### 3. Security ✅
- [ ] SSL/TLS certificates installed and valid
- [ ] HTTPS enforced across all endpoints
- [ ] Security headers configured (HSTS, CSP, X-Frame-Options)
- [ ] Input validation enabled on all endpoints
- [ ] SQL injection protection verified
- [ ] CORS headers properly configured
- [ ] Rate limiting enabled
- [ ] Authentication tokens validated
- [ ] API keys rotated if needed

### 4. Application Code ✅
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] All tests passing (`npm test`)
- [ ] E2E tests passing
- [ ] No console errors or warnings
- [ ] Environment variables properly handled
- [ ] Error handling for all async operations
- [ ] Proper logging in place

### 5. Infrastructure & Deployment ✅
- [ ] Docker images built and tested
- [ ] Container registry configured
- [ ] Kubernetes manifests (if applicable) reviewed
- [ ] Load balancing configured
- [ ] Reverse proxy (nginx/Traefik) configured
- [ ] Monitoring and alerting setup
- [ ] Log aggregation configured

### 6. Monitoring & Observability ✅
- [ ] Application performance monitoring (APM) enabled
- [ ] Health check endpoints configured
- [ ] Metrics collection enabled (Prometheus/StatsD)
- [ ] Log aggregation (ELK/Splunk/CloudWatch)
- [ ] Error tracking (Sentry/DataDog)
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set

### 7. Performance & Load Testing ✅
- [ ] Load testing completed
- [ ] Response times acceptable
- [ ] Memory usage under control
- [ ] CPU usage normal
- [ ] Database query performance verified
- [ ] Caching strategies implemented

## Deployment Steps

### Phase 1: Pre-Deployment (1 hour)
```bash
# 1. Run all checks
npm run lint
npm run type-check
npm run test
npm run test:e2e

# 2. Build all services
npm run build

# 3. Generate Prisma client with production database
DATABASE_URL="<production-db-url>" npm run db:generate

# 4. Verify migrations are up to date
DATABASE_URL="<production-db-url>" npx prisma migrate status
```

### Phase 2: Database Preparation (30 minutes)
```bash
# 1. Backup current database
# Use native Neon backup: https://neon.tech/docs/manage/backups

# 2. Apply any pending migrations
DATABASE_URL="<production-db-url>" npx prisma migrate deploy

# 3. Seed production data if needed
DATABASE_URL="<production-db-url>" npm run db:seed

# 4. Verify data integrity
DATABASE_URL="<production-db-url>" npx prisma db execute --stdin < verify.sql
```

### Phase 3: Container Deployment (30 minutes)
```bash
# 1. Build Docker images
docker build -t tripalfa/api-gateway:latest ./services/api-gateway
docker build -t tripalfa/booking-engine:latest ./apps/booking-engine
# ... build all services

# 2. Push to registry
docker push tripalfa/api-gateway:latest
# ... push all images

# 3. Deploy to Kubernetes/Docker Compose
kubectl apply -f infrastructure/k8s/
# OR
docker-compose -f infrastructure/compose/docker-compose.prod.yml up -d
```

### Phase 4: Service Verification (30 minutes)
```bash
# 1. Health check all services
curl http://api.tripalfa.com/health
curl http://api.tripalfa.com/api/countries

# 2. Test critical workflows
# - User registration
# - Login
# - Flight search
# - Hotel search
# - Booking creation

# 3. Monitor system metrics
# - CPU usage: should be < 70%
# - Memory: should be < 80%
# - Response time: should be < 500ms (p95)
# - Error rate: should be < 0.5%
```

### Phase 5: Post-Deployment (ongoing)
```bash
# 1. Monitor logs
tail -f logs/combined.log logs/error.log

# 2. Check metrics dashboard
# - Access Prometheus/Grafana dashboard
# - Monitor response times
# - Monitor error rates
# - Monitor database connections

# 3. Run smoke tests periodically
npm run test:smoke

# 4. Get alert notifications
# - Email alerts for errors
# - SMS for critical issues
# - Slack integration for team channel
```

## Service Configuration for Production

### API Gateway
- **Port**: 3000
- **Workers**: 4 (or CPU count)
- **Rate Limit**: 1000 req/min per IP
- **Timeout**: 30s
- **Max Body Size**: 10MB

### Booking Engine (Frontend)
- **Build Command**: `pnpm exec vite build`
- **Host**: CDN or load-balanced servers
- **Cache Policy**: 
  - Static assets: 1 year
  - HTML: no-cache
  - API responses: 5 minutes

### Booking Service
- **Port**: 3001
- **Workers**: 4
- **Database Pool Size**: 20
- **Cache**: Redis with 1h TTL

### Database (Neon PostgreSQL)
- **Connection Pooling**: PgBouncer enabled
- **Max Connections**: 100
- **Backup**: Daily, 30-day retention
- **Replication**: Enabled
- **Monitoring**: pg_stat_statements enabled

## Rollback Procedure

If deployment fails:

```bash
# 1. Check logs for errors
tail -f logs/error.log

# 2. Rollback container images to previous version
docker pull tripalfa/api-gateway:previous-tag
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 3. If database issue, restore from backup
# Contact Neon support for restore: https://console.neon.tech

# 4. Verify services are healthy
curl http://api.tripalfa.com/health

# 5. Notify team of rollback
```

## Monitoring Commands

```bash
# View real-time logs
tail -f logs/combined.log

# Check service status
systemctl status tripalfa-api-gateway
systemctl status tripalfa-booking-service
docker-compose -f docker-compose.prod.yml ps

# Monitor system resources
top -p $(pgrep -d',' -f 'node|tsx')
iostat 1 10

# Check database connections
DATABASE_URL="<prod-url>" psql -c "SELECT count(*) FROM pg_stat_activity;"

# View application metrics
curl http://localhost:9090/metrics  # Prometheus
curl http://localhost:3000/health   # Application health
```

## Deployment Schedule Recommendation

- **Monday-Friday during business hours**: Safe to deploy
- **Weekends/Holidays**: Deploy only if critical
- **Peak capacity hours (6 PM - 10 PM)**: Avoid deployments
- **Maintenance window**: Schedule 2-4 AM for non-critical updates

## Emergency Contacts

- On-call Engineer: [Contact]
- Database Administrator: [Contact]
- DevOps Lead: [Contact]
- Customer Support: [Contact]

## Post-Deployment Success Criteria

✅ All health checks passing
✅ No error alerts in first 30 minutes
✅ Response times < 500ms (p95)
✅ Error rate < 0.5%
✅ Database connections stable
✅ Memory usage stable
✅ Users can complete booking workflow
✅ E2E tests all passing

## Additional Resources

- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md)
- [Monitoring Setup](docs/MONITORING_SETUP.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)
