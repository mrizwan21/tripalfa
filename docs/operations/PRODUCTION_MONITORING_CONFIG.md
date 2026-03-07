# Production Monitoring & Alerting Configuration

**Status**: Production-Ready  
**Version**: 4.4.0  
**Environment**: Production (LIVE Payments)  
**Date**: March 2, 2026

---

## Critical Metrics - Production Thresholds

### Payment Processing Metrics

```yaml
payment_success_rate:
  name: "Payment Success Rate"
  metric_path: "metrics.success_rate"
  threshold: 0.99              # Alert if < 99%
  window: "5 minutes"
  severity: CRITICAL
  escalation: "P1 → On-call"
  action: "Check Stripe/PayPal API, review error logs"

payment_processing_latency:
  name: "Payment Processing Latency (P95)"
  metric_path: "histogram_quantile(0.95, payment_duration)"
  threshold: 3000              # Alert if > 3 seconds
  window: "5 minutes"
  severity: HIGH
  escalation: "P2 → Payment Team"
  action: "Check database performance, API latency"

payment_timeout_errors:
  name: "Payment Timeout Errors"
  count_metric: "errors.timeout"
  threshold: 5                 # Alert if > 5 timeouts in 5 min
  window: "5 minutes"
  severity: HIGH
  action: "Increase timeout threshold, scale infrastructure"

payment_failure_spike:
  name: "Payment Failure Spike"
  metric_path: "rate(payment_failures[5m])"
  threshold: 0.05              # Alert if > 5% failure rate
  window: "immediate"
  severity: CRITICAL
  action: "Immediate incident escalation"
```

### Webhook Metrics

```yaml
webhook_delivery_rate:
  name: "Webhook Delivery Rate"
  metric_path: "rate(webhook_delivered[5m]) / rate(webhook_received[5m])"
  threshold: 0.995             # Alert if < 99.5%
  window: "5 minutes"
  severity: CRITICAL
  escalation: "P1 → On-call"
  action: "Check webhook endpoint, network connectivity, firewall"

webhook_processing_latency:
  name: "Webhook Processing Latency (P95)"
  metric_path: "histogram_quantile(0.95, webhook_duration)"
  threshold: 2000              # Alert if > 2 seconds
  window: "5 minutes"
  severity: HIGH
  action: "Review webhook handler performance"

webhook_signature_failures:
  name: "Webhook Signature Failures"
  count_metric: "webhook.signature_failures"
  threshold: 0                 # Alert if ANY signature failures
  window: "immediate"
  severity: CRITICAL
  action: "Verify webhook secrets, potential security incident"

webhook_processing_errors:
  name: "Webhook Processing Errors"
  count_metric: "webhook.errors"
  threshold: 10                # Alert if > 10 errors in 1 min
  window: "1 minute"
  severity: HIGH
  action: "Review webhook logs, check database connection"
```

### Database Metrics

```yaml
database_connection_latency:
  name: "Database Query Latency (P95)"
  metric_path: "histogram_quantile(0.95, db_query_duration)"
  threshold: 500               # Alert if > 500ms
  window: "5 minutes"
  severity: HIGH
  action: "Check slow query log, add indexes, scale database"

database_connection_pool:
  name: "Database Connection Pool Utilization"
  metric_path: "active_connections / max_connections"
  threshold: 0.8               # Alert if > 80% utilization
  window: "5 minutes"
  severity: HIGH
  action: "Increase pool size or reduce load"

database_replication_lag:
  name: "Database Replica Lag"
  metric_path: "replica.lag_bytes"
  threshold: 1048576           # Alert if > 1MB behind
  window: "5 minutes"
  severity: MEDIUM
  action: "Check network between primary and replica"
```

### API Gateway Metrics

```yaml
api_error_rate:
  name: "API Error Rate"
  metric_path: "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m])"
  threshold: 0.01              # Alert if > 1% error rate
  window: "5 minutes"
  severity: HIGH
  action: "Check service logs, review recent changes"

api_availability:
  name: "API Availability"
  metric_path: "up{job='payment-gateway'}"
  threshold: 1                 # Alert if service is down
  window: "1 minute"
  severity: CRITICAL
  action: "Immediate incident, check service health"

api_response_time:
  name: "API Response Time (P99)"
  metric_path: "histogram_quantile(0.99, http_request_duration)"
  threshold: 5000              # Alert if > 5 seconds
  window: "5 minutes"
  severity: HIGH
  action: "Check resource utilization, review slow queries"
```

### Stripe API Metrics

```yaml
stripe_api_latency:
  name: "Stripe API Latency"
  metric_path: "rate(stripe_api_duration_seconds[5m])"
  threshold: 3000              # Alert if > 3 seconds
  window: "5 minutes"
  severity: HIGH
  action: "Check Stripe status, review API usage limits"

stripe_api_errors:
  name: "Stripe API Errors"
  count_metric: "stripe_api_errors"
  threshold: 5                 # Alert if > 5 errors in 5 min
  window: "5 minutes"
  severity: HIGH
  action: "Check Stripe status, verify API credentials"

stripe_rate_limit_warnings:
  name: "Stripe Rate Limit Warnings"
  count_metric: "stripe_rate_limit_warnings"
  threshold: 1                 # Alert if ANY warnings
  window: "immediate"
  severity: MEDIUM
  action: "Review request volume, implement backoff strategy"
```

### PayPal API Metrics

```yaml
paypal_api_latency:
  name: "PayPal API Latency"
  metric_path: "rate(paypal_api_duration_seconds[5m])"
  threshold: 3000              # Alert if > 3 seconds
  window: "5 minutes"
  severity: HIGH
  action: "Check PayPal status, review API usage"

paypal_api_errors:
  name: "PayPal API Errors"
  count_metric: "paypal_api_errors"
  threshold: 5                 # Alert if > 5 errors in 5 min
  window: "5 minutes"
  severity: HIGH
  action: "Check PayPal status, verify credentials"

paypal_authentication_failures:
  name: "PayPal Auth Failures"
  count_metric: "paypal_auth_failures"
  threshold: 0                 # Alert if ANY auth failures
  window: "immediate"
  severity: CRITICAL
  action: "Verify PayPal credentials, potential security issue"
```

---

## Alert Rules Configuration

### Sentry Configuration

```typescript
// Sentry init
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  
  // Sample 5% of transactions in production
  tracesSampleRate: 0.05,
  
  // Custom fingerprinting for payment errors
  beforeSend(event, hint) {
    // Group payment errors by error type
    if (event.exception?.values?.[0]?.value?.includes('payment')) {
      event.fingerprint = ['payment-error', '{{ type }}'];
    }
    
    // Flag signature validation failures
    if (event.exception?.values?.[0]?.value?.includes('signature')) {
      event.fingerprint = ['security', 'signature-validation'];
      event.level = 'fatal'; // Escalate to P1
    }
    
    return event;
  },
  
  // Integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

### Alert Rules (Sentry Dashboard)

```
Rule 1: Critical Payment Errors
- Condition: level:error AND tags.service:payment-gateway
- Actions: 
  - Send to: #payment-critical-prod (Slack)
  - Create in: PagerDuty (P1)
  - Notify: On-call team

Rule 2: Payment Timeout Spike
- Condition: transaction:process_payment AND duration > 5000
- Actions:
  - Send to: #payment-alerts (Slack)
  - Create in: PagerDuty (P2)

Rule 3: Webhook Signature Failures
- Condition: error.type:InvalidSignature OR error.message:*signature*
- Actions:
  - Send to: #security-alerts (Slack)
  - Create in: PagerDuty (P1)
  - Notify: Security lead (email + Slack)

Rule 4: Database Errors
- Condition: error.type:DatabaseError OR error.type:ConnectionError
- Actions:
  - Send to: #infrastructure-alerts (Slack)
  - Create in: PagerDuty (P2)

Rule 5: Stripe API Failures
- Condition: tags.processor:stripe AND error.type:APIError
- Actions:
  - Send to: #payment-alerts (Slack)
  - Create in: PagerDuty (P2)

Rule 6: PayPal API Failures
- Condition: tags.processor:paypal AND error.type:APIError
- Actions:
  - Send to: #payment-alerts (Slack)
  - Create in: PagerDuty (P2)
```

### CloudWatch Alarms

```bash
# Create CloudWatch alarm - Payment Success Rate
aws cloudwatch put-metric-alarm \
  --alarm-name "payment-success-rate-critical" \
  --alarm-description "Alert if payment success rate < 99%" \
  --metric-name "PaymentSuccessRate" \
  --namespace "TripAlfa/PaymentGateway" \
  --statistic Average \
  --period 300 \
  --threshold 0.99 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:payment-critical

# Create CloudWatch alarm - API Error Rate
aws cloudwatch put-metric-alarm \
  --alarm-name "api-error-rate-critical" \
  --alarm-description "Alert if API error rate > 1%" \
  --metric-name "APIErrorRate" \
  --namespace "TripAlfa/PaymentGateway" \
  --statistic Average \
  --period 300 \
  --threshold 0.01 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:payment-critical

# Create CloudWatch alarm - Webhook Delivery Rate
aws cloudwatch put-metric-alarm \
  --alarm-name "webhook-delivery-rate-critical" \
  --alarm-description "Alert if webhook delivery < 99.5%" \
  --metric-name "WebhookDeliveryRate" \
  --namespace "TripAlfa/PaymentGateway" \
  --statistic Average \
  --period 300 \
  --threshold 0.995 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:payment-critical

# Create CloudWatch alarm - Database Latency
aws cloudwatch put-metric-alarm \
  --alarm-name "db-latency-warning" \
  --alarm-description "Alert if database query latency > 500ms" \
  --metric-name "DatabaseLatency" \
  --namespace "TripAlfa/PaymentGateway" \
  --statistic Average \
  --period 300 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:payment-alerts
```

---

## PagerDuty Escalation Policies

```yaml
# Payment Critical (P1)
payment_critical_policy:
  escalation_delay_minutes: 5
  levels:
    - level: 1
      notify: payment-team-oncall
    - level: 2
      notify: infrastructure-lead-oncall
    - level: 3
      notify: cto-oncall
      
# Payment High (P2)
payment_high_policy:
  escalation_delay_minutes: 15
  levels:
    - level: 1
      notify: payment-team-oncall
    - level: 2
      notify: payment-systems-lead
      
# Security Incident (P1 - Priority)
security_incident_policy:
  escalation_delay_minutes: 2
  levels:
    - level: 1
      notify: security-lead (page immediately)
    - level: 2
      notify: cto
      notify: legal
```

---

## Slack Integration

```yaml
channels:
  critical:
    name: "#payment-critical-prod"
    description: "CRITICAL payment alerts (P1)"
    notify_on:
      - Payment success rate < 99%
      - Webhook delivery < 99.5%
      - API error rate > 1%
      - Service down
    escalation: "Auto-page on-call"
    
  alerts:
    name: "#payment-alerts"
    description: "Payment service alerts"
    notify_on:
      - Payment latency > 3s
      - API latency > 5s
      - Database latency > 500ms
      - Rate limiting activated
      
  security:
    name: "#security-alerts-prod"
    description: "Security-related alerts"
    notify_on:
      - Webhook signature failures
      - Auth failures
      - Suspicious activity
      - Security events
    escalation: "Immediate page to security lead"
    
  infrastructure:
    name: "#infrastructure-alerts"
    description: "Infrastructure alerts"
    notify_on:
      - Database connection pool > 80%
      - Memory usage > 85%
      - CPU usage > 90%
      - Disk space < 10%
```

---

## Daily Monitoring Tasks

### 9 AM Daily Check

```
☐ Review Sentry errors (target: < 5 errors)
☐ Check payment success rate (target: > 99.5%)
☐ Review payment volume (trending)
☐ Check webhook delivery rate (target: > 99%)
☐ Verify database backup completed
☐ Check backup size is reasonable
☐ Review web server logs for anomalies
```

### 5 PM Daily Check

```
☐ Review performance metrics
☐ Check for any customer complaints
☐ Verify monitoring is receiving data
☐ Spot-check transaction accuracy
☐ Review failed payment reasons
☐ Check webhook queue size
```

---

## Weekly Monitoring Tasks

### Monday 9 AM

```
☐ Generate performance report
☐ Analyze success rate trends
☐ Review latency trends
☐ Identify any patterns in failures
☐ Verify SLA compliance (99.5%)
☐ Review alert thresholds (adjust if needed)
☐ Conduct capacity planning
```

---

## Monthly Monitoring Tasks

### First Monday of Month

```
☐ Full system health audit
☐ Review all security metrics
☐ Analyze cost trends
☐ Update capacity forecasts
☐ Schedule security review
☐ Plan infrastructure upgrades if needed
☐ Update monitoring configurations
```

---

**Document Version**: 4.4.0  
**Last Updated**: March 2, 2026  
**Status**: Production Monitoring Ready
