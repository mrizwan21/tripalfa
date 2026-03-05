# Incident Response Playbook - Production Payment Gateway

## Critical Incident Response Procedures

**Last Updated**: March 2, 2026  
**Version**: 4.4.0  
**Status**: Active for Production Use

---

## 1. Payment Processing Outage

### Severity: CRITICAL (P1)

**Indicators**:
- Payment success rate drops below 95% for 5+ minutes
- Customers unable to process payments
- Multiple failed Stripe/PayPal API calls
- Error rate > 10% for payment endpoint

### Immediate Response (0-5 minutes)

```
Step 1: Alert routing
└─ PagerDuty automatically pages Payment Team on-call
└─ Slack notification to #payment-critical-prod

Step 2: Incident commander assignment
└─ First responder acknowledges in PagerDuty (creates incident)
└─ Executes: /incident create "Payment Processing Outage"

Step 3: Status page update
└─ Update status.tripalfa.com: "Investigating payment issues"
└─ Notify stakeholders: #incident-bridge

Step 4: Initial diagnosis (5 min max)
└─ Check Sentry for error patterns
└─ Check Stripe/PayPal API status
└─ Check database connection pool
└─ Check webhook queue backlog
```

### Diagnosis (5-15 minutes)

```bash
# Check payment service logs
tail -100 /var/log/tripalfa/payments.log | grep -i error

# Check Stripe API connectivity
curl https://api.stripe.com/v1/health

# Check PayPal API connectivity
curl https://api.www.paypal.com/v1/health

# Check database status
psql $DATABASE_URL -c "SELECT count(*) FROM payment_transactions WHERE created_at > NOW() - INTERVAL '5 minutes';"

# Check service health
curl https://api.tripalfa.com/health
```

### Root Cause Analysis

**Case 1: Database Connection Pool Exhausted**
- Symptom: All payment requests timeout
- Fix: Increase connection pool or restart service
```bash
# Restart payment gateway service
docker restart tripalfa-payment-gateway
# OR
systemctl restart tripalfa-payment-gateway
```

**Case 2: Stripe API Down**
- Symptom: All Stripe payments fail, PayPal works
- Fix: Check Stripe status, consider PayPal fallback
```bash
# Check Stripe status
curl https://status.stripe.com/api

# Fallback configuration - temporarily route all payments to PayPal
# (pre-configured failover)
PAYMENT_PROCESSOR=paypal npm start
```

**Case 3: PayPal API Down**
- Symptom: All PayPal payments fail, Stripe works
- Fix: Check PayPal status, consider Stripe fallback
```bash
# Check PayPal status
curl https://status.paypal.com

# Fallback - temporarily route all payments to Stripe
PAYMENT_PROCESSOR=stripe npm start
```

**Case 4: Network/Firewall Issue**
- Symptom: Cannot reach Stripe/PayPal APIs
- Fix: Check AWS security groups, network ACLs
```bash
# Test connectivity to Stripe
curl -v https://api.stripe.com/v1/charges \
  -H "Authorization: Bearer $STRIPE_API_KEY"

# Check outbound firewall rules
aws ec2 describe-security-groups --group-ids sg-xxxxxx
```

### Recovery (15-30 minutes)

```
Step 1: Fix root cause
└─ Apply temporary fix or workaround
└─ Monitor recovery metrics

Step 2: Gradual restore
└─ Enable payment processing
└─ Monitor error rate
└─ Increase load gradually

Step 3: Validate recovery
└─ Test payment flow end-to-end
└─ Verify webhook delivery
└─ Check transaction counts

Step 4: Resolve
└─ Confirm all payments processing normally
└─ Update status page: "Resolved"
└─ Schedule full incident review
```

### Post-Incident (Within 24 hours)

- [ ] Conduct incident review meeting
- [ ] Document root cause
- [ ] Create action items (preventive measures)
- [ ] Update runbooks if needed
- [ ] Notify stakeholders of resolution

---

## 2. Security Incident - Data Breach / Unauthorized Access

### Severity: CRITICAL (P1)

### Immediate Response (0-15 minutes)

```
Step 1: Contain breach (HALT all operations)
└─ Pause all external API access if possible
└─ Isolate affected systems
└─ Preserve logs for forensics

Step 2: Activate incident response team
└─ Page Security Lead (PagerDuty P1)
└─ Page CTO (immediate escalation)
└─ Create incident bridge (Slack: #incident-bridge)

Step 3: Initial assessment
└─ What data was accessed?
└─ How was breach detected?
└─ When did it start?
└─ Is access ongoing? (STOP if possible)

Step 4: Notification
└─ Notify legal team immediately
└─ Notify compliance/privacy officer
└─ Prepare for regulatory (PCI-DSS, GDPR, CCPA) notification
└─ Do NOT communicate breach publicly yet
```

### Investigation (15-60 minutes)

```
Step 1: Preserve evidence
└─ Capture all logs related to incident
└─ Take snapshots/backups
└─ Preserve audit trail

Step 2: Determine scope
└─ Which customers affected?
└─ What data was exposed?
└─ How many records?
└─ Card data exposed? (escalate if yes)

Step 3: Determine cause
└─ Stolen API key?
└─ SQL injection?
└─ Weak password?
└─ Unpatched vulnerability?
└─ Insider threat?

Step 4: Stop ongoing access
└─ Revoke compromised credentials
└─ Patch vulnerability if applicable
└─ Update firewall rules
└─ Force password resets if needed
```

### Notification (if card data compromised)

**PCI-DSS Breach Notification Requirements:**
- Notify customers within 72 hours
- Notify payment card brands immediately
- Notify acquiring bank immediately
- File report with law enforcement (if required)
- Preserve evidence for forensics

### Remediation & Recovery

```
Step 1: Containment
└─ Revoke all API keys
└─ Patch vulnerabilities
└─ Force password rotations
└─ Enable MFA everywhere

Step 2: Enhanced monitoring
└─ Deploy intrusion detection
└─ Increase audit logging
└─ Set up anomaly alerts
└─ Monitor for indicators of compromise

Step 3: Restore service
└─ Deploy patched code
└─ Restore from clean backup if necessary
└─ Test all security controls
└─ Gradual restore to production

Step 4: Post-incident review
└─ Conduct full security audit
└─ Engage external security firm
└─ Implement preventive measures
└─ Update security policies
```

---

## 3. Webhook Delivery Failure - Stripe/PayPal

### Severity: HIGH (P2)

**Indicators**:
- Webhook delivery rate drops below 99%
- Payment status not updating in database
- Transactions stuck in "PROCESSING" state
- Webhook signature validation failures

### Response

```
Step 1: Assess impact
└─ How many webhooks failing?
└─ Which processor (Stripe/PayPal)?
└─ How long failing?
└─ Which event types?

Step 2: Check webhook service logs
tail -50 /var/log/tripalfa/webhooks.log | grep -i error

Step 3: Verify webhook endpoints are accessible
curl -v https://api.tripalfa.com/webhooks/stripe
curl -v https://api.tripalfa.com/webhooks/paypal

Step 4: Check signature validation
└─ Verify webhook signing secret hasn't changed
└─ Test signature validation with sample webhook
└─ Check for recent credential rotation

Step 5: Retry failed webhooks
└─ Query database for stuck transactions:
  SELECT * FROM payment_webhook_events 
  WHERE processed_at IS NULL 
  AND received_at > NOW() - INTERVAL '1 hour';

└─ Trigger manual retry processing
└─ Monitor webhook queue

Step 6: Escalate if unresolved after 10 minutes
└─ Page Infrastructure Team
└─ Check reverse proxy (Nginx/Apache) logs
└─ Check firewall/network issues
```

---

## 4. Database Performance Degradation

### Severity: HIGH (P2)

**Indicators**:
- Payment processing latency > 5 seconds
- Database query latency > 1 second
- Connection pool utilization > 80%
- Slow query logs showing problematic queries

### Response

```
Step 1: Diagnose
└─ Check slow query log:
  tail -20 /var/log/tripalfa/slow-queries.log

└─ Check connection pool status:
  SELECT count(*) FROM pg_stat_activity;

└─ Check query plans:
  EXPLAIN ANALYZE SELECT * FROM payment_transactions WHERE created_at > NOW() - INTERVAL '1 hour';

Step 2: Immediate mitigation
└─ Reduce rate limiting temporarily (allow slower processing)
└─ Clear cache if applicable
└─ Kill idle connections:
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';

Step 3: Investigate root cause
└─ Long-running transaction?
└─ Missing index?
└─ Bloated table?
└─ High transaction volume?

Step 4: Apply fix
└─ Add index if missing
└─ Kill blocking transaction
└─ Scale read replicas if needed
└─ Consider database upgrade

Step 5: Monitor recovery
└─ Watch payment latency decrease
└─ Verify connection pool returns to normal
└─ Confirm no queries > 1 second
```

---

## 5. Rate Limiting False Positives / Legitimate Traffic Blocked

### Severity: MEDIUM (P3)

**Indicators**:
- Customer complaints of "too many requests" errors
- Error rate spike but no actual overload
- Legitimate users blocked from making payments

### Response

```
Step 1: Verify rate limits
└─ Current limits from .env:
  RATE_LIMIT_PAYMENTS_PER_MINUTE=30
  RATE_LIMIT_API_PER_HOUR=10000

Step 2: Identify affected customers
└─ Check logs for 429 (Too Many Requests) errors
└─ Identify IP addresses or user IDs
└─ Determine if legitimate or attack

Step 3: Whitelist if legitimate
└─ Add customer IP to whitelist if needed
└─ Increase rate limits if attack is not suspected
└─ Temporarily reduce load if needed

Step 4: Notify customers
└─ Apologize for service interruption
└─ Explain rate limiting cause
└─ Offer alternative: wait/retry or support assistance
```

---

## General Incident Response Procedures

### Escalation Path

```
Level 1 (0-15 min): Payment Team On-Call
  └─ Diagnose issue
  └─ Apply immediate fix if possible
  └─ If unresolved → escalate to Level 2

Level 2 (15-30 min): Payment Systems Lead + Infrastructure Lead
  └─ Deeper investigation
  └─ Consider service restart/failover
  └─ If unresolved → escalate to Level 3

Level 3 (30-60 min): CTO + VP Engineering
  └─ Strategic decisions
  └─ Consider full rollback if necessary
  └─ Authorize extended downtime if needed
  └─ Stakeholder communication

Level 4 (60+ min): CEO/Executive Leadership
  └─ Regulatory notification
  └─ Public statement
  └─ Customer compensation discussion
```

### Roles & Responsibilities

**Incident Commander**:
- Coordinates response
- Maintains communication
- Makes escalation decisions
- Documents timeline

**Payment Systems Engineer**:
- Diagnoses technical issue
- Implements fix
- Monitors recovery
- Documents resolution

**Infrastructure Lead**:
- Manages system resources
- Performs deployments/rollbacks
- Monitors infrastructure metrics

**Security Lead** (if security incident):
- Investigation
- Evidence preservation
- Breach assessment
- Regulatory notification

### Communication Template

```
🚨 INCIDENT NOTIFICATION

Title: [Incident Type]
Severity: [P1/P2/P3]
Status: [INVESTIGATING/MITIGATING/RESOLVED]

Impact:
- [What's affected]
- [How many users]
- [Financial impact if applicable]

Timeline:
- 14:32 UTC: Issue detected
- 14:33 UTC: Incident commander assigned
- 14:45 UTC: Root cause identified
- 15:00 UTC: Fix deployed
- 15:05 UTC: Monitoring shows recovery

Next Update: [Time]
Contact: #incident-bridge or [on-call number]
```

### Post-Incident Review Template

```
Incident: [Name]
Date: [Date]
Severity: [P1/P2/P3]
Duration: [HH:MM]

Timeline:
1. [Event at time]
2. [Action at time]
3. [Resolution at time]

Root Cause:
[What ultimately caused the incident]

Contributing Factors:
- [Factor 1]
- [Factor 2]

Impact:
- Customers affected: [N]
- Revenue lost: [$X.XX]
- Data exposed: [Yes/No]

Resolution:
[How it was fixed]

Action Items (Preventive):
1. [Action] - Owner: [Name] - Due: [Date]
2. [Action] - Owner: [Name] - Due: [Date]

Follow-up:
- Review: [Date, 1 week after]
- Action items tracking: [Link to tracking system]
```

---

## Contact Information

**Payment Team On-Call**: [Phone/Slack]  
**Infrastructure Lead**: [Phone/Slack]  
**CTO**: [Phone/Slack]  
**Security Lead**: security@tripalfa.com  
**Incident Bridge**: Slack #incident-bridge or Bridge URL  
**Status Page**: https://status.tripalfa.com

---

## Quick Links

- [Sentry Error Tracking](https://sentry.io)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch)
- [PagerDuty](https://tripalfa.pagerduty.com)
- [Stripe Status](https://status.stripe.com)
- [PayPal Status](https://status.paypal.com)

---

**This playbook MUST be reviewed quarterly and updated as needed.**

