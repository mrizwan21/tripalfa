# Production Deployment Checklist & Runbook

Complete step-by-step guide for deploying and managing TripAlfa production infrastructure.

## Quick Start (5 minutes)

```bash
# 1. Set environment variables
export NEON_API_KEY="your-neon-api-key"
export NEON_PROJECT_ID="your-project-id"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export S3_BACKUP_BUCKET="tripalfa-backups"

# 2. Enable Neon automatic backups
curl -X PATCH https://api.neon.tech/api/v2/projects/$NEON_PROJECT_ID \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"settings": {"backup_retention": 30}}'

# 3. Deploy application stack
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh production v1.0.0

# 4. Deploy to Kubernetes (if available)
kubectl apply -f infrastructure/k8s/namespace-config.yaml
kubectl apply -f infrastructure/k8s/api-gateway-deployment.yaml

# 5. Import Grafana dashboard
# Via UI: Dashboards → Import → Paste JSON from infrastructure/monitoring/grafana/dashboards/tripalfa-production.json

# 6. Load AlertManager rules
cp infrastructure/monitoring/alert-rules.yml /etc/prometheus/rules/
cp infrastructure/monitoring/alertmanager.yml /etc/alertmanager/config.yml
systemctl restart prometheus alertmanager
```

## Table of Contents

1. [Pre-Deployment Validation](#pre-deployment-validation)
2. [Deployment Process](#deployment-process)
3. [Backup Strategy](#backup-strategy)
4. [Monitoring Setup](#monitoring-setup)
5. [Alerting Configuration](#alerting-configuration)
6. [Scaling & Auto-Recovery](#scaling--auto-recovery)
7. [Security Hardening](#security-hardening)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Validation

### 1. Environment Preparation

```bash
# Check all required environment variables
required_vars=(
  "NEON_API_KEY"
  "NEON_PROJECT_ID"
  "DATABASE_URL"
  "SLACK_WEBHOOK_URL"
  "REGISTRY_URL"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    exit 1
  fi
done

echo "✅ All required environment variables set"
```

### 2. System Requirements Check

```bash
# Validate prerequisites
docker --version          # ≥ 20.10
docker-compose --version # ≥ 1.29
kubectl version          # ≥ 1.24 (if using K8s)
npm --version           # ≥ 8.0
node --version          # ≥ 18.0
psql --version          # ≥ 12.0
git --version           # Any recent version
```

### 3. Code Quality Gates

```bash
# Run pre-deployment checks
npm run lint          # ESLint validation
npm run format        # Code formatting check
npm run build         # TypeScript compilation
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# All tests must pass before deployment
```

### 4. Database Readiness

```bash
# Verify database connectivity
npm run db:migrate    # Apply pending migrations
npm run db:generate   # Regenerate Prisma client

# Check database state
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "SELECT count(*) FROM schema_migrations WHERE status = 'applied';"
```

---

## Deployment Process

### Phase 1: Automated Deployment

```bash
./scripts/deploy-production.sh production v1.0.0
```

**What this does:**
- ✅ Validates code quality
- ✅ Builds Docker images
- ✅ Pushes to registry
- ✅ Creates database backup
- ✅ Deploys containers
- ✅ Runs health checks
- ✅ Executes smoke tests
- ✅ Generates deployment report

### Phase 2: Kubernetes Deployment

```bash
# Create namespace with security policies
kubectl apply -f infrastructure/k8s/namespace-config.yaml

# Deploy API Gateway with autoscaling
kubectl apply -f infrastructure/k8s/api-gateway-deployment.yaml

# Verify deployment
kubectl get pods -n tripalfa
kubectl get svc -n tripalfa
kubectl describe hpa -n tripalfa
```

### Phase 3: Verification

```bash
# Check service health
for service in api-gateway booking-service payment-service; do
  echo "Checking $service..."
  curl -s http://localhost:3000/health | jq .
done

# Check pod logs
kubectl logs -n tripalfa -l app=api-gateway --tail=100

# Monitor resource usage
kubectl top pods -n tripalfa
kubectl top nodes
```

### Phase 4: Traffic Migration

```bash
# Gradual traffic shift (if using Istio)
kubectl apply -f infrastructure/k8s/istio-canary.yaml

# Or switch load balancer immediately
kubectl patch service api-gateway -n tripalfa -p \
  '{"spec":{"selector":{"version":"v1.0.0"}}}'
```

---

## Backup Strategy

### Automatic Neon Backups

Neon provides automatic backups with configurable retention.

**Enable via API:**
```bash
curl -X PATCH https://api.neon.tech/api/v2/projects/$NEON_PROJECT_ID \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "backup_retention": 30,
      "backup_frequency": "daily"
    }
  }'
```

**Backup Retention Policy:**
- Automatic daily snapshots: 7 days
- Weekly snapshots: 30 days
- Monthly snapshots: 90 days
- Point-in-time recovery: 7 days

### Manual Backup via Script

```bash
# Create daily backup
./scripts/backup-neon-database.sh backup

# List available backups
./scripts/backup-neon-database.sh list

# Restore from backup
./scripts/backup-neon-database.sh restore ./backups/dump-20240115-120000.sql.gz
```

**Backup Configuration:**
```bash
# Environment variables
export NEON_API_KEY="your-api-key"
export NEON_PROJECT_ID="your-project-id"
export DATABASE_URL="postgresql://user:pass@host/db"
export S3_BACKUP_BUCKET="tripalfa-backups"
export RETENTION_DAYS=30
export SLACK_WEBHOOK_URL="..."
```

**S3 Backup Storage:**
- Encrypted with AES-256
- Versioning enabled
- Lifecycle management (delete after 90 days)
- Cross-region replication to secondary bucket

### Backup Verification

```bash
# Schedule daily verification
0 2 * * * ./scripts/verify-backup-integrity.sh

# Verify latest backup
gunzip -c ./backups/latest.sql.gz | pg_dump --stdin 2>&1 | wc -l

# Test restore in dev environment
pg_restore -d dev_tripalfa ./backups/latest.sql.gz
```

---

## Monitoring Setup

### Grafana Dashboard Import

```bash
# Via API
curl -X POST http://localhost:3010/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  -d @infrastructure/monitoring/grafana/dashboards/tripalfa-production.json

# Via UI
# 1. Open Grafana: http://localhost:3010
# 2. Click "+" → "Import"
# 3. Paste JSON from tripalfa-production.json
# 4. Select Prometheus datasource
# 5. Click "Import"
```

### Prometheus Configuration

```yaml
# Add to prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'tripalfa-services'
    static_configs:
      - targets: ['localhost:3000', 'localhost:3001', 'localhost:3002']
    
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: ['tripalfa']

  - job_name: 'postgresql'
    static_configs:
      - targets: ['localhost:9187']
```

### Key Metrics to Monitor

1. **Application Performance**
   - Request rate (req/sec)
   - Response time (p50, p95, p99)
   - Error rate (count by status code)
   - Active connections

2. **Infrastructure**
   - CPU utilization per pod
   - Memory usage
   - Disk I/O
   - Network bandwidth

3. **Database**
   - Active connections
   - Query duration
   - Slow queries
   - Connection pool status

4. **Business Metrics**
   - Booking success rate
   - Payment processing time
   - Order completion rate
   - User session duration

---

## Alerting Configuration

### AlertManager Setup

```bash
# Copy configuration
cp infrastructure/monitoring/alertmanager.yml /etc/alertmanager/config.yml

# Set environment secrets
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export SMTP_USER="alerts@tripalfa.com"
export SMTP_PASSWORD="your-password"
export PAGERDUTY_SERVICE_KEY="your-service-key"

# Start AlertManager
docker run -d \
  --name alertmanager \
  -p 9093:9093 \
  -v /etc/alertmanager/config.yml:/etc/alertmanager/config.yml \
  -e SLACK_WEBHOOK_URL \
  -e SMTP_USER \
  -e SMTP_PASSWORD \
  -e PAGERDUTY_SERVICE_KEY \
  prom/alertmanager:latest
```

### Alert Rules Loading

```bash
# Copy alert rules
cp infrastructure/monitoring/alert-rules.yml /etc/prometheus/rules/

# Add to prometheus.yml
rule_files:
  - '/etc/prometheus/rules/alert-rules.yml'

# Restart Prometheus
systemctl restart prometheus
```

### Notification Channels

**All alerts route through AlertManager with:**

1. **Slack** (#alerts, #critical-alerts, #ops)
2. **Email** (ops@tripalfa.com, dev-team@tripalfa.com, dba@tripalfa.com)
3. **PagerDuty** (for critical alerts with on-call escalation)

**Alert Severity Levels:**

| Severity | Response Time | Escalation | Channel |
|----------|---------------|-----------|---------|
| warning | 30s | Slack only | #warnings |
| critical | immediate | Slack + Email + PagerDuty | #critical-alerts |
| business | 5m | Slack + Email | #alerts |

---

## Scaling & Auto-Recovery

### Kubernetes Autoscaling

**Horizontal Pod Autoscaling:**
```bash
# Check HPA status
kubectl get hpa -n tripalfa

# Configure custom scaling policy
kubectl autoscale deployment api-gateway \
  -n tripalfa \
  --min=3 --max=10 \
  --cpu-percent=70
```

**Scaling Triggers:**
- CPU utilization > 70% → scale up
- Memory usage > 80% → scale up
- Request queue depth > 100 → scale up

### Pod Disruption Budgets

Ensures minimum availability during updates:
```bash
# Check PDB status
kubectl get pdb -n tripalfa

# Minimum 2 pods must remain available during disruptions
# Allows safe cluster maintenance without downtime
```

### Health Checks

**Liveness Probes** (restart unhealthy pods)
```
./health/live
Interval: 10s
Threshold: 3 failures
```

**Readiness Probes** (remove from load balancer)
```
./health/ready
Interval: 5s
Threshold: 2 failures
```

---

## Security Hardening

### Network Security

```bash
# Apply network policies
kubectl apply -f infrastructure/k8s/namespace-config.yaml

# Policies enforce:
- Namespace isolation
- Egress restrictions (only to required services)
- Ingress only from API Gateway
```

### RBAC Configuration

```bash
# Create service account
kubectl create serviceaccount tripalfa-app -n tripalfa

# Bind to minimal role with only needed permissions
# Permissions limited to: configmaps, secrets (read), pods (watch)
```

### Secret Management

```bash
# Create Kubernetes secrets
kubectl create secret generic database-credentials \
  -n tripalfa \
  --from-literal=username=$DB_USER \
  --from-literal=password=$DB_PASSWORD

kubectl create secret generic app-secrets \
  -n tripalfa \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=session-secret=$SESSION_SECRET \
  --from-literal=api-keys=$API_KEYS
```

### Pod Security Policies

Enforced by namespace configuration:
- ❌ No privileged containers
- ❌ No host network access
- ✅ Drop ALL Linux capabilities
- ✅ Non-root user enforcement
- ✅ Read-only root filesystem

---

## Troubleshooting

### Service Not Starting

```bash
# Check pod logs
kubectl logs -n tripalfa -l app=api-gateway --tail=200

# Describe pod for events
kubectl describe pod <pod-name> -n tripalfa

# Check resource limits
kubectl top pods -n tripalfa

# Increase resource allocation if constrained
kubectl edit deployment api-gateway -n tripalfa
```

### High Memory Usage

```bash
# Identify memory-hungry pods
kubectl top pods -n tripalfa --sort-by=memory

# Check for memory leaks
kubectl describe node <node-name>

# Restart pod if necessary
kubectl delete pod <pod-name> -n tripalfa
```

### Database Connection Issues

```bash
# Test connection from pod
kubectl exec -it <pod-name> -n tripalfa -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check connection pool status
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor with pgBouncer stats
psql -d pgbouncer -h localhost -p 6432 \
  -c "SHOW CLIENTS; SHOW SERVERS;"
```

### Slow Queries

```bash
# Identify slow queries
psql $DATABASE_URL -c "
  SELECT query, calls, mean_time, max_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# Enable query logging
psql $DATABASE_URL -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"

# Check slow query log
tail -f /var/log/postgresql/postgresql.log | grep "duration:"
```

### Network Connectivity

```bash
# Test DNS resolution
kubectl run -it --rm debug --image=nicolaka/netshoot -n tripalfa -- bash
nslookup api-gateway
curl http://api-gateway:3000/health

# Check network policies
kubectl describe networkpolicy -n tripalfa

# Verify ingress rules
kubectl get ingress -n tripalfa -o yaml
```

---

## Rollback Procedures

### Quick Rollback to Previous Version

```bash
./scripts/deploy-production.sh rollback [version]
```

**Automatic rollback triggers:**
- Health check failures (3+ errors)
- Smoke test failures
- Database migration errors
- Deployment timeout

### Manual Rollback via Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/api-gateway -n tripalfa

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n tripalfa

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway -n tripalfa --to-revision=5

# Verify rollback
kubectl rollout status deployment/api-gateway -n tripalfa
```

### Database Rollback

```bash
# Migrate down to previous version
npm run db:migrate:down

# Or restore from backup
./scripts/backup-neon-database.sh restore ./backups/backup-before-deploy.sql.gz
```

### Service Restart

```bash
# Restart all services
kubectl delete pods --all -n tripalfa

# Rolling restart (one at a time)
kubectl rollout restart deployment/api-gateway -n tripalfa
```

---

## Post-Deployment Verification

### Health Checks

```bash
# 1. API Gateway
curl http://localhost:3000/health

# Response should be:
# {"status":"healthy","timestamp":"2024-01-15T12:00:00Z","uptime":"1h23m"}

# 2. All microservices
for service in api-gateway booking-service payment-service; do
  curl -s http://localhost:3000/health/$service
done

# 3. Database connectivity
curl http://localhost:3000/health/database

# 4. Message queue
curl http://localhost:3000/health/queue
```

### Performance Baselines

```bash
# Measure baseline metrics
ab -n 1000 -c 10 http://localhost:3000/api/search

# Expected results:
# - p95 response time: < 500ms
# - p99 response time: < 1000ms
# - Error rate: < 0.1%
```

### Load Testing

```bash
# Run k6 load tests
k6 run scripts/load-test.js

# Run for 30s with 100 concurrent users
k6 run -u 100 -d 30s scripts/load-test.js
```

---

## Maintenance Windows

### Scheduled Maintenance

**Window:** Sunday 2:00 AM - 4:00 AM UTC

**Activities:**
1. Database maintenance (VACUUM, ANALYZE)
2. Index optimization
3. Log rotation
4. Certificate renewal
5. Security patches

### Communication

1. Slack notification 48 hours before
2. Status page update
3. Email to users
4. PagerDuty schedule adjustments

### Database Maintenance Script

```bash
# Run during maintenance window
./scripts/database-maintenance.sh

# Includes:
# - VACUUM ANALYZE
# - REINDEX
# - LOG rotation
# - Statistics update
# - Cache clearing
```

---

## Monitoring Dashboards

### Production Dashboard

Access at: `http://your-domain:3010/d/tripalfa-production`

**Key Panels:**
1. Request Rate (5-minute rolling average)
2. Response Time P95 (yellow >500ms, red >1s)
3. Error Rate (5xx errors)
4. Memory Utilization per pod
5. CPU Usage by container
6. Database connections

### Custom Alerts

Create additional alerts in Grafana:
1. Click on metric panel
2. "Create Alert" button
3. Set threshold and notification channel
4. Example: Alert when error rate > 1% for 5 minutes

---

## Conclusion

Your TripAlfa production environment is now:

✅ **Resilient** - Auto-healing, load-balanced, with rollback capability
✅ **Observable** - Comprehensive monitoring and alerting
✅ **Scalable** - Kubernetes with HPA and PDB
✅ **Secure** - RBAC, network policies, secrets management
✅ **Backed-up** - Multiple backup strategies with point-in-time recovery

For support and issues, refer to:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3010
- AlertManager: http://localhost:9093
- PostgreSQL: Use `psql` with `$DATABASE_URL`

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Maintained By:** TripAlfa DevOps Team
