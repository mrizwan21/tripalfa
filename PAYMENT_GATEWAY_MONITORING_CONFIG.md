# Monitoring & Alerting Configuration for Payment Gateway

## Overview

This document provides monitoring and alerting configuration for the payment gateway in production and staging environments.

## 1. Metrics to Monitor

### Critical Metrics

```yaml
payment_processing:
  - name: payment_processing_duration_ms
    threshold: 5000  # Alert if > 5 seconds
    severity: warning
    
  - name: payment_success_rate
    threshold: 0.95  # Alert if < 95%
    severity: critical
    
  - name: payment_failure_rate
    threshold: 0.05  # Alert if > 5%
    severity: critical
    
  - name: payment_timeout_errors
    threshold: 5  # Alert if > 5 in 5 minutes
    severity: warning

webhook_processing:
  - name: webhook_delivery_rate
    threshold: 0.99  # Alert if < 99%
    severity: critical
    
  - name: webhook_processing_latency_ms
    threshold: 2000  # Alert if > 2 seconds
    severity: warning
    
  - name: webhook_parse_errors
    threshold: 0  # Alert if > 0
    severity: warning
    
  - name: webhook_signature_failures
    threshold: 0  # Alert if > 0
    severity: critical

database:
  - name: connection_pool_utilization
    threshold: 0.8  # Alert if > 80%
    severity: warning
    
  - name: query_latency_ms
    threshold: 1000  # Alert if > 1 second
    severity: warning
    
  - name: slow_queries_count
    threshold: 10  # Alert if > 10 in 5 minutes
    severity: warning

processor_api:
  - name: stripe_api_latency_ms
    threshold: 3000  # Alert if > 3 seconds
    severity: warning
    
  - name: stripe_api_errors
    threshold: 5  # Alert if > 5 in 5 minutes
    severity: warning
    
  - name: paypal_api_latency_ms
    threshold: 3000  # Alert if > 3 seconds
    severity: warning
    
  - name: paypal_api_errors
    threshold: 5  # Alert if > 5 in 5 minutes
    severity: warning
```

## 2. Sentry Configuration

### Setup

```bash
npm install @sentry/node @sentry/tracing
```

### Code Integration

```typescript
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT,
  
  // Performance monitoring
  tracesSampleRate: process.env.ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Enable distributed tracing
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({
      request: true,
      serverName: true,
    }),
  ],
  
  // Custom fingerprinting for payment errors
  beforeSend(event, hint) {
    if (event.exception) {
      const value = event.exception.values?.[0].value || '';
      
      if (value.includes('payment')) {
        event.fingerprint = ['payment-error', '{{ type }}'];
      }
      
      if (value.includes('webhook')) {
        event.fingerprint = ['webhook-error', '{{ type }}'];
      }
    }
    return event;
  },
});

// Add Express middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Alert Rules in Sentry

Create these alert rules in Sentry dashboard:

1. **Critical Payment Errors**
   ```
   level:error AND tags.service:payment-gateway
   Send to: #payment-alerts Slack channel
   ```

2. **Payment Timeout Spike**
   ```
   transaction:payment-processing AND duration > 5000ms
   Send to: #performance-alerts Slack channel
   ```

3. **Webhook Signature Failures**
   ```
   error.type:InvalidSignature
   Send to: #security-alerts Slack channel (escalate to on-call)
   ```

## 3. CloudWatch/DataDog Configuration

### Payment Processing Metrics

```yaml
# CloudWatch Logs Insights queries
fields @timestamp, @message, @duration, processor, status
| filter @message like /payment/
| stats count() as total, avg(@duration) as avg_duration by processor, status
```

### Webhook Processing Metrics

```yaml
fields @timestamp, @message, event_type, processor, error
| filter @message like /webhook/
| stats count() as total, count(error) as failures by processor, event_type
```

### Database Performance

```yaml
fields @timestamp, @duration, query_type
| filter @duration > 1000
| stats count() as slow_queries, max(@duration) as max_duration by query_type
```

## 4. Prometheus Metrics (if using Prometheus)

```yaml
# Custom metrics to expose

payment_transactions_total:
  type: counter
  labels: [processor, status, currency]
  help: "Total payment transactions by processor and status"

payment_gateway_processing_duration_seconds:
  type: histogram
  labels: [processor]
  buckets: [0.1, 0.5, 1, 2, 5, 10]
  help: "Payment processing duration in seconds"

webhook_events_total:
  type: counter
  labels: [processor, event_type, success]
  help: "Total webhook events received"

webhook_processing_duration_seconds:
  type: histogram
  labels: [processor, event_type]
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
  help: "Webhook processing duration in seconds"

stripe_api_call_duration_seconds:
  type: histogram
  labels: [endpoint]
  help: "Stripe API call duration"

paypal_api_call_duration_seconds:
  type: histogram
  labels: [endpoint]
  help: "PayPal API call duration"
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'payment-gateway'
    static_configs:
      - targets: ['localhost:3002']
        labels:
          service: payment-gateway
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## 5. Grafana Dashboards

### Sample Dashboard JSON

```json
{
  "dashboard": {
    "title": "Payment Gateway Monitoring",
    "panels": [
      {
        "title": "Payment Success Rate",
        "targets": [
          {
            "expr": "rate(payment_transactions_total{status='captured'}[5m]) / rate(payment_transactions_total[5m])"
          }
        ],
        "alert": {
          "conditions": [{"evaluator": {"type": "lt"}, "value": 0.95}],
          "message": "Payment success rate below 95%"
        }
      },
      {
        "title": "Average Payment Processing Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, payment_gateway_processing_duration_seconds)"
          }
        ]
      },
      {
        "title": "Webhook Delivery Failure Rate",
        "targets": [
          {
            "expr": "rate(webhook_events_total{success='false'}[5m]) / rate(webhook_events_total[5m])"
          }
        ]
      },
      {
        "title": "Stripe API Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, rate(stripe_api_call_duration_seconds[5m]))"
          }
        ]
      }
    ]
  }
}
```

## 6. PagerDuty Integration

### Escalation Policies

```yaml
payment_critical:
  description: "Critical payment failures"
  escalation_levels:
    - level: 1
      delay_minutes: 5
      target: payment-team
    - level: 2
      delay_minutes: 5
      target: on-call-manager

webhook_critical:
  description: "Webhook delivery failures"
  escalation_levels:
    - level: 1
      delay_minutes: 5
      target: backend-team
    - level: 2
      delay_minutes: 5
      target: on-call-manager
```

### Incident Routing

```yaml
incident_routing:
  alert_sources:
    - name: "Sentry Payment Errors"
      routing_key: "payment-critical"
      severity_threshold: "error"
    
    - name: "Webhook Failures"
      routing_key: "webhook-critical"
      severity_threshold: "warning"
    
    - name: "Database Alerts"
      routing_key: "infrastructure"
      severity_threshold: "warning"
```

## 7. Slack Integration

### Alert Channels

```yaml
channels:
  - name: "#payment-alerts"
    description: "Real-time payment processing alerts"
    notify: Sentry, CloudWatch
    
  - name: "#webhook-alerts"
    description: "Webhook delivery and processing alerts"
    notify: DataDog, Custom Webhooks
    
  - name: "#performance-alerts"
    description: "Performance and latency alerts"
    notify: Prometheus, CloudWatch
    
  - name: "#security-alerts"
    description: "Security and fraud-related alerts (escalates to on-call)"
    notify: Sentry, AWS GuardDuty
```

### Message Templates

```
🔴 Payment Processing Alert
Severity: CRITICAL
Service: Payment Gateway
Metric: payment_success_rate
Value: 88% (threshold: 95%)
Duration: 15 minutes
Impact: 120 failed payments in last 15 min
Action: Check Stripe API status, Review error logs
```

## 8. Log Analysis Queries

### Critical Payment Failures

```sql
SELECT 
  COUNT(*) as failures,
  processor,
  error_code,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as timestamp
FROM payment_transactions
WHERE status = 'FAILED'
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY processor, error_code, timestamp
ORDER BY timestamp DESC;
```

### Webhook Delivery Health

```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN processed_at IS NOT NULL THEN 1 ELSE 0 END) as processed,
  processor,
  event_type,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at)) * 1000) as avg_latency_ms
FROM payment_webhook_events
WHERE received_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY processor, event_type;
```

### Slow Payment Transactions

```sql
SELECT 
  id,
  processor,
  amount,
  currency,
  EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000 as duration_ms,
  status
FROM payment_transactions
WHERE EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000 > 5000
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY duration_ms DESC;
```

## 9. Health Checks

### Endpoint: /health

```json
{
  "status": "ok",
  "service": "payment-gateway",
  "version": "4.2.0",
  "uptime_ms": 123456,
  "checks": {
    "database": {
      "status": "ok",
      "latency_ms": 45
    },
    "stripe_api": {
      "status": "ok",
      "latency_ms": 234
    },
    "paypal_api": {
      "status": "ok",
      "latency_ms": 567
    },
    "webhook_queue": {
      "status": "ok",
      "pending": 3
    }
  }
}
```

### Endpoint: /metrics

Prometheus-compatible metrics endpoint with payment-specific metrics.

## 10. Regular Monitoring Tasks

### Daily (9 AM)
- [ ] Review error rate trends
- [ ] Check payment success rate
- [ ] Review failed transactions log
- [ ] Verify webhook health

### Weekly (Monday 9 AM)
- [ ] Generate performance report
- [ ] Review SLA compliance (target: 99.5%)
- [ ] Analyze peak load times
- [ ] Review processor API health

### Monthly (First of month)
- [ ] Full system health audit
- [ ] Security review (failed validation attempts)
- [ ] Capacity planning review
- [ ] Update alert thresholds if needed

---

## Contact Information

**Payment System On-Call**: #payment-team-oncall  
**Security Incidents**: security@tripalfa.com  
**Infrastructure**: #infrastructure-team

---

**Last Updated**: March 2, 2026  
**Version**: 4.3.0

