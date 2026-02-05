# Wallet Service - Deployment Checklist

## Pre-Deployment (Development Team)

### Code Review & Testing
- [ ] Code review completed by 2+ team members
- [ ] All TypeScript compiles without errors: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Code coverage meets >80% threshold
- [ ] No console.log statements (use logger instead)
- [ ] No TODO comments left unaddressed
- [ ] Error handling tested for all edge cases
- [ ] Idempotency verified with duplicate requests
- [ ] Database migrations tested on fresh database

### Type Safety
- [ ] No `any` types used (except in tests if necessary)
- [ ] All imports properly typed
- [ ] All function signatures include return types
- [ ] All API responses typed with interfaces
- [ ] Frontend components properly typed with React.FC
- [ ] Service methods return expected types

### Security Review
- [ ] JWT validation on all protected endpoints
- [ ] Input validation with Joi schemas
- [ ] SQL injection prevention (parameterized queries)
- [ ] No secrets in code (use .env)
- [ ] Helmet middleware enabled
- [ ] CORS properly configured
- [ ] Rate limiting configured at API gateway
- [ ] Error messages don't leak sensitive info

## Pre-Deployment (DevOps/Infrastructure)

### Environment Setup
- [ ] Neon Postgres database created
- [ ] Database user and password set
- [ ] Connection string verified: `psql $DATABASE_URL -c "SELECT 1"`

### Database Migration to Neon
- [ ] Export your Docker/Postgres database using pg_dump (see IMPLEMENTATION_GUIDE.md)
- [ ] Place your dump file (e.g., wallet_db.dump) in the project directory
- [ ] Make the migration script executable:
  ```bash
  chmod +x services/wallet-service/scripts/migrate_to_neon.sh
  ```
- [ ] Run the migration script to import your dump into Neon:
  ```bash
  ./services/wallet-service/scripts/migrate_to_neon.sh "postgresql://your_user:your_password@your_project_id.your_region.neon.tech/your_db?sslmode=require" wallet_db.dump
  ```
- [ ] Update your .env file with the Neon DATABASE_URL (see .env.example)
- [ ] Run migrations if needed: `npm run migrations`
- [ ] Start the service and verify all endpoints and jobs
- [ ] SSL/TLS enabled for database connection
- [ ] JWT_SECRET generated (min 32 characters)
- [ ] OPEN_EXCHANGE_RATES_API_KEY obtained and validated
- [ ] All required environment variables in .env file

### Database
- [ ] Migrations run successfully: `npm run migrations`
- [ ] All 13 tables created
- [ ] All indexes created
- [ ] Foreign key constraints verified
- [ ] Enum types created (user_type_enum, transaction_type_enum, etc.)
- [ ] Triggers created (wallet updated_at)
- [ ] Backup strategy documented
- [ ] Point-in-time restore tested

### Deployment Infrastructure
- [ ] Container registry access (Docker Hub, ECR, etc.)
- [ ] Kubernetes cluster configured (if using K8s)
- [ ] Load balancer configured
- [ ] SSL/TLS certificates obtained
- [ ] Health check endpoint accessible
- [ ] Logging infrastructure (ELK, Datadog, etc.) configured
- [ ] Monitoring and alerting setup
- [ ] Error tracking (Sentry) configured

## Deployment Process

### Build & Push
- [ ] Docker image builds: `npm run docker:build`
- [ ] Image tagged correctly: `wallet-service:v1.0.0`
- [ ] Image pushed to registry
- [ ] Image verified in registry
- [ ] Image scanning completed (vulnerability check)

### Pre-Production Testing
- [ ] Deploy to staging environment
- [ ] Run smoke tests against staging
- [ ] Verify FX fetcher runs hourly
- [ ] Verify reconciliation job runs daily
- [ ] Test all API endpoints manually
- [ ] Load test with realistic data volume
- [ ] Verify database backups work
- [ ] Test rollback procedure

### Production Deployment
- [ ] Production database verified accessible
- [ ] All environment variables set
- [ ] Blue-green deployment ready (if using)
- [ ] Canary deployment planned (if applicable)
- [ ] Rollback plan documented and tested
- [ ] On-call engineer briefed
- [ ] Maintenance window scheduled (if needed)
- [ ] Customer notifications sent

### Health Check
- [ ] Service starts without errors
- [ ] Health endpoint returns 200: `GET /health`
- [ ] Ready endpoint returns 200: `GET /ready`
- [ ] Database connection working
- [ ] FX snapshot fetched (non-empty)
- [ ] Logs showing normal operation
- [ ] No errors in logs in first 5 minutes
- [ ] API endpoints responding

## Post-Deployment (First 24 Hours)

### Monitoring
- [ ] CPU/memory usage normal
- [ ] Database connection pool healthy
- [ ] FX fetcher ran at least once
- [ ] No 5xx errors in logs
- [ ] Request latency < 500ms
- [ ] Database query times normal
- [ ] Disk space adequate
- [ ] Network bandwidth normal

### Functional Testing
- [ ] Test topup endpoint: `POST /api/wallet/transfer`
- [ ] Test customer purchase: `POST /api/wallet/purchase`
- [ ] Test settlement: `POST /api/wallet/settlement`
- [ ] Verify ledger entries created
- [ ] Verify transactions recorded
- [ ] Test idempotency (retry with same key)
- [ ] Test error scenarios (insufficient funds, etc.)
- [ ] Verify all data in database

### Operations
- [ ] On-call rotation established
- [ ] Runbook shared with team
- [ ] Escalation procedures clear
- [ ] Backup verified
- [ ] Restore procedure tested
- [ ] Disaster recovery plan available
- [ ] Team trained on deployment
- [ ] Documentation links accessible

## Post-Deployment (First Week)

### Monitoring
- [ ] FX fetcher running every hour successfully
- [ ] Reconciliation job running daily
- [ ] No repeated errors
- [ ] Performance metrics collected
- [ ] Error rates trending down
- [ ] Database health check steady
- [ ] All scheduled jobs completing

### Optimization
- [ ] Identify slow endpoints
- [ ] Optimize database queries if needed
- [ ] Review error logs for patterns
- [ ] Check for unnecessary logging
- [ ] Verify caching working
- [ ] Connection pool efficiently used

### Knowledge Transfer
- [ ] Team walkthrough completed
- [ ] Runbook reviewed and updated
- [ ] Common issues documented
- [ ] Troubleshooting guide created
- [ ] On-call procedures practiced
- [ ] Monitoring dashboards explained

## Ongoing Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify all jobs executing
- [ ] Review database size
- [ ] Check backup completion

### Monthly
- [ ] Review transaction volumes
- [ ] Check FX rate fluctuations
- [ ] Verify settlement reconciliation
- [ ] Review customer issues
- [ ] Plan feature improvements
- [ ] Security update checks
- [ ] Dependency updates review

### Quarterly
- [ ] Full backup and restore test
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Team training update

## Rollback Procedure

If issues occur during/after deployment:

### Immediate (< 5 minutes)
- [ ] Alert team via Slack/PagerDuty
- [ ] Assess severity and impact
- [ ] Pause any ongoing changes
- [ ] Document initial error messages

### Short-term (< 15 minutes)
- [ ] Review recent logs
- [ ] Check database status
- [ ] Verify external API connectivity
- [ ] Decision: fix or rollback?

### Rollback (If Needed)
- [ ] Stop new service
- [ ] Revert to previous image tag
- [ ] Verify health check passing
- [ ] Run smoke tests
- [ ] Notify stakeholders
- [ ] Schedule post-mortem

### Post-Mortem
- [ ] Root cause identified
- [ ] Fix prepared and tested
- [ ] Plan for re-deployment
- [ ] Update runbook
- [ ] Team debrief

## Rollback Example

```bash
# If current deployment (v1.0.0) has issues:

# 1. Revert to previous version
kubectl set image deployment/wallet-service \
  wallet-service=wallet-service:v0.9.9

# 2. Verify
kubectl rollout status deployment/wallet-service
kubectl get pods

# 3. Check health
curl http://service-url/health

# 4. Verify database still functional
psql $DATABASE_URL -c "SELECT COUNT(*) FROM wallets"

# 5. Monitor logs
kubectl logs -f deployment/wallet-service
```

## Contact & Escalation

- **On-Call Engineer**: [Name] - [Phone] - [Slack]
- **Engineering Lead**: [Name] - [Phone] - [Slack]
- **DevOps Lead**: [Name] - [Phone] - [Slack]
- **CTO**: [Name] - [Phone] - [Slack]

## Sign-Off

- [ ] Development Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Engineering Manager: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______

## Notes

```
[Space for any additional notes or observations]




```

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Next Review**: 2024-02-15
