# Production Deployment Guide - Payment Gateway v4.4.0

**Status**: Production-Ready  
**Version**: 4.4.0  
**Date**: March 2, 2026  
**Environment**: Production (LIVE Payments)

---

## 📋 Pre-Deployment Checklist (MUST COMPLETE ALL BEFORE DEPLOYING)

### Security Requirements (21 items)

- [ ] API keys are LIVE keys, not test keys
- [ ] Database uses SSL/TLS (sslmode=require)
- [ ] HTTPS/TLS enabled on all endpoints
- [ ] Security audit checklist 100% complete
- [ ] All team members signed off on security requirements
- [ ] API keys rotated (first time in production)
- [ ] Secrets stored in AWS Secrets Manager or HashiCorp Vault
- [ ] Webhook IP whitelisting configured
- [ ] Rate limiting configured and tested
- [ ] DDoS protection enabled (CloudFlare/AWS Shield)
- [ ] Web Application Firewall (WAF) enabled
- [ ] Encryption configured for sensitive data
- [ ] PCI-DSS compliance verified
- [ ] Penetration testing scheduled
- [ ] Security incident response plan documented
- [ ] Data breach notification procedures documented
- [ ] Sentry error tracking configured
- [ ] CloudWatch log aggregation configured
- [ ] PagerDuty escalation policies configured
- [ ] Backup and disaster recovery tested
- [ ] On-call schedule established

### Operational Requirements (15 items)

- [ ] Production database provisioned (managed RDS/equivalent)
- [ ] Database daily automated backups enabled
- [ ] Database read replicas configured
- [ ] Reverse proxy (Nginx/Apache) configured
- [ ] Load balancer configured
- [ ] Health check endpoint created (/health)
- [ ] Metrics endpoint created (/metrics)
- [ ] Zero-downtime deployment strategy decided
- [ ] Rollback procedure tested
- [ ] Canary deployment planned (if applicable)
- [ ] Blue-green deployment infrastructure ready
- [ ] Monitoring dashboards created
- [ ] Alert thresholds configured
- [ ] Log rotation configured
- [ ] Capacity planning completed

### Testing Requirements (12 items)

- [ ] All 23 payment gateway tests passing
- [ ] Load testing completed with production-like traffic
- [ ] Stress testing completed
- [ ] Security testing completed
- [ ] Webhook delivery tested end-to-end
- [ ] Multi-currency transactions tested
- [ ] Idempotency verified
- [ ] Refund processing tested
- [ ] Error scenarios tested
- [ ] Wallet integration tested (payment → wallet credit)
- [ ] Failover scenarios tested
- [ ] Backup/restore procedures tested

### Team Requirements (8 items)

- [ ] All core team trained on deployment procedures
- [ ] On-call team trained on incident response
- [ ] Payment processor API training completed
- [ ] PCI-DSS training completed by all team
- [ ] Security training completed by all team
- [ ] Runbooks created for common procedures
- [ ] Runbooks tested (dry run)
- [ ] Communication plan established

---

## 🚀 Production Deployment Steps

### Step 1: Final Pre-Deployment Verification (30 minutes)

#### 1.1 Copy Production Environment Template
```bash
cp .env.production.template .env.production
```

#### 1.2 Fill in Production Credentials

Edit `.env.production` with:

**Stripe Production**:
```bash
STRIPE_API_KEY=sk_live_XXX...                      # LIVE key
STRIPE_WEBHOOK_SECRET=whsec_live_XXX...            # LIVE secret
STRIPE_PUBLISHABLE_KEY=pk_live_XXX...              # LIVE key
```

**PayPal Production**:
```bash
PAYPAL_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID         # Production
PAYPAL_CLIENT_SECRET=YOUR_PRODUCTION_SECRET        # Production
PAYPAL_API_MODE=live                               # CRITICAL: Must be 'live'
```

**Database Production**:
```bash
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/db?sslmode=require
DATABASE_BACKUP_ENABLED=true
DATABASE_BACKUP_INTERVAL_HOURS=12
```

#### 1.3 Verify All Required Variables

```bash
# Count variables
grep -c "^[^#]" .env.production | grep -E "^(7[0-9]|[89][0-9]|1[0-9]{2})$"

# Verify LIVE mode (not test)
grep STRIPE_API_KEY .env.production | grep -E "sk_live_"
grep PAYPAL_API_MODE .env.production | grep "live"

# Verify critical security settings
grep "sslmode=require" .env.production
grep "HTTPS_ENABLED=true" .env.production
grep "PCI_DSS_ENABLED=true" .env.production
```

### Step 2: Final Security Audit (45 minutes)

#### 2.1 Review Security Audit Checklist
```bash
cat SECURITY_AUDIT_CHECKLIST.md | grep -c "☐"
# Should output: 0 (all items checked)
```

#### 2.2 Verify No Secrets in Codebase
```bash
# Scan for API keys in git history
git log -p | grep -i "sk_live\|whsec_\|client_secret" && \
echo "❌ CRITICAL: Secrets found in git history" || \
echo "✅ No secrets in git history"
```

#### 2.3 Review Incident Response Plan
```bash
cat INCIDENT_RESPONSE_PLAYBOOK.md | head -50
# Verify all procedures are clear
```

### Step 3: Create Production Database Backup (15 minutes)

```bash
# Create AWS RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier tripalfa-prod-db \
  --db-snapshot-identifier tripalfa-prod-backup-$(date +%Y%m%d-%H%M%S)

# OR use PostgreSQL backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Verify backup size
ls -lh backup-*.sql.gz | tail -1
```

### Step 4: Run Production Deployment Script (60 minutes)

```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Run deployment with confirmation
./scripts/deploy-production.sh production CONFIRMED
```

This script will:
1. ✅ Verify LIVE credentials (not test keys)
2. ✅ Check database SSL/TLS required
3. ✅ Verify all security prerequisites
4. ✅ Create database backup
5. ✅ Run all payment gateway tests
6. ✅ Verify monitoring is configured
7. ✅ Generate deployment report

### Step 5: Register Production Webhooks (20 minutes)

#### 5.1 Register Stripe Webhook

**Via Stripe Dashboard**:
1. Go to: Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://api.tripalfa.com/webhooks/stripe`
4. Events: Select these 6 events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payment_intent.canceled`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Copy signing secret to `.env.production`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_live_XXX...
   ```

#### 5.2 Register PayPal Webhook

**Via PayPal Dashboard**:
1. Go to: Dashboard > Apps & Credentials > Live
2. Click "Create Webhook" or "Webhooks"
3. URL: `https://api.tripalfa.com/webhooks/paypal`
4. Select these 6 event types:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `PAYMENT.CAPTURE.PENDING`
   - `BILLING.PLAN.CREATED`
   - `BILLING.PLAN.UPDATED`
5. Copy Webhook ID to `.env.production`:
   ```bash
   PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID
   ```

### Step 6: Deploy to Production Infrastructure (30 minutes)

#### 6.1 Build Docker Image (Optional)

```bash
docker build -t tripalfa/payment-gateway:4.4.0 \
  --build-arg ENVIRONMENT=production \
  .

docker push tripalfa/payment-gateway:4.4.0
```

#### 6.2 Deploy to Production

**Option A: Kubernetes**:
```bash
kubectl set image deployment/payment-gateway \
  payment-gateway=tripalfa/payment-gateway:4.4.0 \
  -n production

kubectl rollout status deployment/payment-gateway -n production
```

**Option B: Docker Swarm**:
```bash
docker service update \
  --image tripalfa/payment-gateway:4.4.0 \
  tripalfa-payment-gateway
```

**Option C: Systemd Service**:
```bash
# Copy .env.production to production server
scp .env.production deploy@prod-server:/opt/tripalfa/.env.production

# SSH to production server
ssh deploy@prod-server

# Update and restart service
systemctl stop tripalfa-payment-gateway
cd /opt/tripalfa
npm install --production
npm start &
systemctl start tripalfa-payment-gateway

# Verify service started
systemctl status tripalfa-payment-gateway
```

### Step 7: Verify Production Deployment (30 minutes)

#### 7.1 Test Health Endpoint
```bash
curl https://api.tripalfa.com/health

# Expected response:
# {
#   "status": "ok",
#   "service": "payment-gateway",
#   "version": "4.4.0",
#   "uptime_ms": 1234
# }
```

#### 7.2 Test Metrics Endpoint
```bash
curl https://api.tripalfa.com/metrics | head -20
```

#### 7.3 Test Payment Processing
```bash
# Create a test payment with real Stripe test card
curl -X POST https://api.tripalfa.com/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "userId": "user-123",
    "processor": "stripe",
    "amount": 10.00,
    "currency": "USD",
    "paymentMethod": "card",
    "stripePaymentIntentId": "pi_test_intent",
    "idempotencyKey": "test-payment-001"
  }'

# Should return 200 with transaction details
```

#### 7.4 Test Webhook Delivery
```bash
# Send test webhook from Stripe Dashboard
# Dashboard > Developers > Webhooks > Select endpoint > Send test webhook

# Monitor logs for webhook processing
tail -f /var/log/tripalfa/webhooks.log | grep "payment_intent.succeeded"

# Should see: "✅ Webhook processed: payment_intent.succeeded"
```

#### 7.5 Monitor Service Metrics
```bash
# Check Sentry for errors (should be zero)
# https://sentry.io/organizations/tripalfa

# Check CloudWatch for logs
# AWS Console > CloudWatch > Logs > /tripalfa/payment-gateway-prod

# Check payment transaction volume
curl https://api.tripalfa.com/metrics | grep payment_transactions_total
```

### Step 8: Update Status Page (5 minutes)

```bash
# Update status.tripalfa.com
# Status: "✅ Payment Gateway v4.4.0 deployed to production"
# Notify stakeholders through Slack #announcements
```

### Step 9: Monitor First Hour (60 minutes)

**Every 10 minutes, check**:

```bash
# Error rate
curl https://api.tripalfa.com/metrics | grep error_rate

# Payment success rate
curl https://api.tripalfa.com/metrics | grep success_rate

# Webhook delivery rate
curl https://api.tripalfa.com/metrics | grep webhook_delivery_rate

# Sentry dashboard
# https://sentry.io → Look for any errors
```

**Expected metrics**:
- Error rate: < 1%
- Payment success rate: > 99%
- Webhook delivery rate: > 99%
- P95 latency: < 2000ms

---

## ⚠️ Rollback Procedure (If Needed)

### If Critical Issues Occur Within First Hour

```bash
# Step 1: Alert team immediately
# /incident create "Roll back payment gateway to v4.3.0"

# Step 2: Prepare rollback
docker pull tripalfa/payment-gateway:4.3.0

# Step 3: Execute rollback
docker service update \
  --image tripalfa/payment-gateway:4.3.0 \
  tripalfa-payment-gateway

# Step 4: Verify rollback
curl https://api.tripalfa.com/health | grep "4.3.0"

# Step 5: Restore API credentials from previous version
# (webhook signing secrets may be different)

# Step 6: Verify payment processing works
# Test a transaction
```

### Database Rollback (If Data Corruption)

```bash
# Step 1: Stop payment gateway service
systemctl stop tripalfa-payment-gateway

# Step 2: Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tripalfa-prod-db-restored \
  --db-snapshot-identifier tripalfa-prod-backup-20260302-143000

# Step 3: Wait for restore to complete
aws rds describe-db-instances \
  --db-instance-identifier tripalfa-prod-db-restored \
  --query 'DBInstances[0].DBInstanceStatus'
# Wait for status: "available"

# Step 4: Update DATABASE_URL in .env.production
DATABASE_URL=postgresql://user:password@tripalfa-prod-db-restored.xxxx.rds.amazonaws.com:5432/db

# Step 5: Restart payment gateway
systemctl start tripalfa-payment-gateway

# Step 6: Verify transactions match backup timestamp
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM payment_transactions;"
```

---

## 🔍 Post-Deployment Validation

### First 24 Hours

- [ ] Monitor error rate (target: < 0.5%)
- [ ] Monitor payment success rate (target: > 99.5%)
- [ ] Monitor webhook delivery (target: > 99.9%)
- [ ] Check for any Sentry errors (target: 0 critical)
- [ ] Verify transactions in database
- [ ] Verify wallet integration working
- [ ] Test refund processing
- [ ] Conduct smoke tests with real payments

### First Week

- [ ] Generate performance report
- [ ] Analyze transaction patterns
- [ ] Review error logs for anomalies
- [ ] Test disaster recovery procedures
- [ ] Conduct load test similar to Phase 4.1
- [ ] Review customer feedback
- [ ] Complete incident-free stability claim (if true)

---

## 📊 Success Criteria

✅ **Deployment Success Indicators**:
- 0 critical errors in Sentry
- Payment success rate > 99%
- Webhook delivery rate > 99%
- Payment latency < 2 seconds (P95)
- No customer complaints
- All transactions reconciling correctly
- Wallet credits working as expected
- No security issues detected

---

## 📞 Support Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Payment Team On-Call | Slack: @payment-oncall | 24/7 |
| Infrastructure Lead | Slack: @infra-lead | 24/7 |
| Security Lead | Email: security@tripalfa.com | 24/7 |
| CTO | Slack: @cto | Business hours |
| Incident Bridge | Slack: #incident-bridge | 24/7 |

---

## 📝 Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Deployment Lead | _________ | ______ | ☐ |
| Security Lead | _________ | ______ | ☐ |
| Infrastructure Lead | _________ | ______ | ☐ |
| CTO / VP Eng | _________ | ______ | ☐ |

---

**Document Version**: 4.4.0  
**Last Updated**: March 2, 2026  
**Status**: Production Deployment Ready

