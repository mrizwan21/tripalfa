# Phase 2 Production Deployment Guide

**Target Audience**: DevOps, Backend Team, Product Managers  
**Estimated Time**: 2-3 hours for full production setup  
**Risk Level**: Low (backward compatible, can be deployed with feature flags)

---

## Pre-Deployment Checklist

### Development Environment Setup

- [ ] **Environment Variables**

  ```bash
  # Verify .env.local has all Phase 2 vars
  VITE_BOOKING_SERVICE=<backend-url>
  VITE_API_GATEWAY=<gateway-url>
  VITE_METRICS_ENDPOINT=/api/metrics
  VITE_METRICS_INTERVAL=60000
  ```

- [ ] **Dependencies**

  ```bash
  npm install
  npm run build --workspace=@tripalfa/booking-engine
  npm run build --workspace=@tripalfa/booking-service
  npm test
  ```

- [ ] **Type Safety**

  ```bash
  npx tsc -p tsconfig.json --noEmit
  ```

- [ ] **Linting**

  ```bash
  npm run lint
  ```

### Staging Environment Preparation

1. **Create Feature Flag** (if using feature flags)

   ```typescript
   // features.ts
   export const PHASE2_ENABLED = process.env.VITE_PHASE2_ENABLED === 'true';

   // App.tsx
   if (PHASE2_ENABLED) {
     await initializePhase2Services({
       /* config */
     });
   }
   ```

2. **Database Migrations** (if applicable)

   ```bash
   npm run db:migrate
   npm run db:generate
   ```

3. **Backend Service URLs**
   - [ ] Verify booking-service health endpoint
   - [ ] Verify api-gateway health endpoint
   - [ ] Test fallback endpoints

4. **Monitoring System Setup**
   - [ ] Prometheus scrape config created
   - [ ] Datadog agent installed
   - [ ] Grafana dashboards created
   - [ ] Alerts configured

---

## Staging Deployment Process

### Step 1: Deploy Services

```bash
# Deploy backend services first
npm run deploy --workspace=@tripalfa/booking-service

# Verify services are healthy
curl http://staging-booking1.tripalfa.com/health
curl http://staging-booking2.tripalfa.com/health
curl http://staging-api.tripalfa.com/health
```

### Step 2: Deploy Frontend

```bash
# Build frontend
npm run build --workspace=@tripalfa/booking-engine

# Deploy to staging
npm run deploy:staging --workspace=@tripalfa/booking-engine

# Verify deployment
curl https://staging.tripalfa.com/
```

### Step 3: Verify Phase 2 Initialization

```text
# Check browser console (should see init messages)
console.log([Phase 2] Services initialized:');

# Verify metrics collection
const metrics = getPerformanceMetrics();
console.log(metrics);
```

### Step 4: Load Testing

```javascript
# Using k6 or Artillery
# File: load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '90s', target: 100 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://staging.tripalfa.com/');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'FCP < 2s': (r) => {
      // Check performance header if available
      return true;
    },
  });

  sleep(1);
}

# Run: k6 run load-test.js
```

### Step 5: Health Check Verification

```text
# Test service health gating
curl -X GET 'https://staging.tripalfa.com/api/health'

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "booking-service": "healthy",
#     "api-gateway": "healthy"
#   },
#   "metrics": {
#     "FCP": 1200,
#     "LCP": 2100,
#     "INP": 90,
#     "CLS": 0.08,
#     "TTFB": 300
#   }
# }
```

### Step 6: Metrics Collection Test

```text
# Verify metrics are being exported
curl -X GET 'https://staging.tripalfa.com/api/metrics' -H 'Accept: text/plain'

# Expected: Prometheus format metrics
# core_web_vitals_fcp_ms{} 1200
# core_web_vitals_lcp_ms{} 2100
# ...
```

---

## Monitoring System Integration

### Prometheus Setup

**File**: `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'tripalfa-metrics'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['staging.tripalfa.com']
    relabel_configs:
      - source_labels: [__scheme__]
        target_label: scheme
      - source_labels: [__metrics_path__]
        target_label: metrics_path

  - job_name: 'tripalfa-prod'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['app.tripalfa.com']
    scrape_interval: 30s
    scrape_timeout: 10s
```

**Deploy**:

```bash
# Copy to Prometheus server
scp prometheus.yml prometheus-server:/etc/prometheus/

# Reload configuration
ssh prometheus-server 'curl -X POST http://localhost:9090/-/reload'
```

### Datadog Integration

**File**: `datadog.config.ts`

```typescript
import { startAutomaticMetricsExport } from './services/phase2-integration';

export function setupDatadogMetrics() {
  if (!window.DD_RUM) {
    console.warn('Datadog RUM not loaded');
    return;
  }

  startAutomaticMetricsExport({
    intervalMs: 60000,
    endpoint: '/api/metrics/datadog',
    format: 'json', // Datadog expects JSON with custom format
  });

  // Send Core Web Vitals to Datadog
  const metrics = getPerformanceMetrics();
  window.DD_RUM.metric('core_web_vitals.fcp', metrics.vitals.FCP);
  window.DD_RUM.metric('core_web_vitals.lcp', metrics.vitals.LCP);
  window.DD_RUM.metric('core_web_vitals.inp', metrics.vitals.INP);
  window.DD_RUM.metric('core_web_vitals.cls', metrics.vitals.CLS);
  window.DD_RUM.metric('core_web_vitals.ttfb', metrics.vitals.TTFB);
}
```

### Grafana Dashboard

**Grafana JSON Model** (simplified):

```json
{
  "dashboard": {
    "title": "TripAlfa Phase 2 Metrics",
    "panels": [
      {
        "title": "Core Web Vitals",
        "targets": [
          {
            "expr": "core_web_vitals_fcp_ms{}"
          },
          {
            "expr": "core_web_vitals_lcp_ms{}"
          },
          {
            "expr": "core_web_vitals_inp_ms{}"
          }
        ]
      },
      {
        "title": "Service Health",
        "targets": [
          {
            "expr": "service_health_status{}"
          }
        ]
      }
    ]
  }
}
```

**Import to Grafana**:

```bash
curl -X POST http://grafana:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  -d @grafana-dashboard.json
```

---

## Alert Configuration

### Prometheus Alert Rules

**File**: `alerts.yml`

```yaml
groups:
  - name: tripalfa_alerts
    rules:
      # FCP alerting
      - alert: SlowFCP
        expr: core_web_vitals_fcp_ms > 3000
        for: 5m
        annotations:
          summary: 'FCP is slow ({{ $value }}ms)'
          description: 'FCP exceeded 3 seconds'

      # LCP alerting
      - alert: SlowLCP
        expr: core_web_vitals_lcp_ms > 4000
        for: 5m
        annotations:
          summary: 'LCP is slow ({{ $value }}ms)'

      # Service health alerting
      - alert: ServiceDown
        expr: service_health_status == 0
        for: 1m
        annotations:
          summary: 'Service is down'
          description: 'Health check failed'

      # CLS alerting
      - alert: HighCLS
        expr: core_web_vitals_cls > 0.1
        for: 5m
        annotations:
          summary: 'CLS is high ({{ $value }})'
```

**Deploy**:

```bash
scp alerts.yml prometheus-server:/etc/prometheus/rules/
ssh prometheus-server 'curl -X POST http://localhost:9090/-/reload'
```

---

## Production Deployment

### Phase 1: Canary Deployment (5% traffic)

```bash
# Deploy to 5% of servers
DEPLOYMENT_PERCENTAGE=5 npm run deploy:production

# Monitor metrics for 1 hour
# Check: Error rates, FCP, LCP, INP, CLS, Service health

# In Grafana, confirm:
# - Error rate: <0.1%
# - FCP: Improvement vs baseline
# - Service health: All healthy
```

### Phase 2: Gradual Rollout

```bash
# Timeline:
# Hour 1-2: 5% (canary)
# Hour 2-4: 25% (early adopters)
# Hour 4-8: 50% (majority)
# Hour 8-24: 75% (late majority)
# Hour 24+: 100% (all users)

# Each hour, monitor:
DEPLOYMENT_PERCENTAGE=25 npm run deploy:production
sleep 3600
DEPLOYMENT_PERCENTAGE=50 npm run deploy:production
sleep 3600
DEPLOYMENT_PERCENTAGE=75 npm run deploy:production
sleep 3600
DEPLOYMENT_PERCENTAGE=100 npm run deploy:production
```

### Phase 3: Full Production

```bash
# Monitor for 24 hours after full deployment
# Key metrics to watch:
# 1. Core Web Vitals (FCP, LCP, INP, CLS, TTFB)
# 2. Error rates
# 3. Service health status
# 4. User engagement (time on page, bounce rate)
# 5. Conversion metrics
```

---

## Rollback Procedure

### If Issues Occur

```bash
# Immediate rollback (within 5 minutes of detection)
DEPLOYMENT_PERCENTAGE=0 npm run deploy:production

# Revert to previous build
git checkout main
npm run build --workspace=@tripalfa/booking-engine
npm run deploy:production

# Investigate issue
# - Check error logs
# - Review metrics
# - Check recent changes
```

### Post-Rollback

1. Create incident report
2. Identify root cause
3. Fix issue
4. Re-test in staging
5. Gradual re-rollout

---

## Post-Deployment Monitoring

### Daily Checks (First Week)

```bash
# Check Core Web Vitals trending
# Grafana Dashboard > Core Web Vitals

# Check error rates
curl https://app.tripalfa.com/api/health/errors

# Check service health
curl https://app.tripalfa.com/api/health

# Check metrics export
curl https://app.tripalfa.com/api/metrics | head -10
```

### Weekly Checks

```bash
# Performance regression analysis
# Compare current week vs baseline

# User feedback review
# Check support tickets related to performance

# Error spike investigation
# Look for patterns in error logs

# Conversion impact analysis
# Check if improvements translate to better conversions
```

### Monthly Review

```bash
# Performance improvement summary
# - FCP improvement %
# - LCP improvement %
# - Error rate reduction %

# Cost analysis (if applicable)
# - Infrastructure costs
# - Monitoring costs

# ROI calculation
# - Performance improvements
# - User satisfaction
# - Business impact
```

---

## Troubleshooting

### Issue: Metrics not exporting

**Symptom**: Prometheus shows no data

**Debug**:

```bash
# Check endpoint is accessible
curl https://app.tripalfa.com/api/metrics

# Check Prometheus scrape config
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets'

# Check for errors in app logs
kubectl logs -f deployment/booking-engine | grep "metrics"
```

**Solution**:

```bash
# Ensure metrics endpoint is public
# Check CORS configuration
# Verify Prometheus can reach app
```

### Issue: Service repeatedly marked unhealthy

**Symptom**: ServiceHealthGate showing service down

**Debug**:

```bash
# Test service endpoint directly
curl -v http://booking-service:3001/health

# Check service logs
kubectl logs -f deployment/booking-service

# Check network connectivity
kubectl exec -it deployment/booking-engine -- \
  curl -v http://booking-service:3001/health
```

**Solution**:

```typescript
// Increase health check timeout
initializePhase2Services({
  healthCheckTimeoutMs: 5000 // Increase from 3000
});

# Check service resource limits
kubectl describe deployment booking-service
```

### Issue: Performance not improving

**Symptom**: FCP/LCP the same as before

**Debug**:

```bash
# Check if Phase 2 is initialized
console.log(getPerformanceMetrics());

// Check if service health gating is active
console.log(getServicesStatus());

// Profile page load
// Open DevTools > Performance tab
```

**Solution**:

```bash
// Ensure Phase2BootstrapGuard is wrapping entire app
// Check that useWaitForServices is properly gating data fetches
// Verify no additional data loads during initialization
```

---

## Success Criteria

### Performance Metrics

- [ ] FCP: 2.5s → 1.2s (or proportional improvement)
- [ ] LCP: 4.2s → 2.1s
- [ ] INP: 250ms → 90ms
- [ ] CLS: 0.2 → 0.08
- [ ] TTFB: 800ms → 300ms

### Reliability Metrics

- [ ] Error rate: <0.5% (same as baseline or better)
- [ ] Service uptime: >99.9%
- [ ] Health check success: >99%

### User Experience Metrics

- [ ] User satisfaction: Same or better
- [ ] Bounce rate: Same or better
- [ ] Conversion rate: Same or better

### Operational Metrics

- [ ] Deployment time: <30 minutes
- [ ] Rollback time: <5 minutes
- [ ] Alert accuracy: <10% false positives

---

## Sign-Off Checklist

- [ ] **DevOps**: Deployment pipeline tested
- [ ] **Backend**: Service health endpoints verified
- [ ] **Frontend**: Build process verified
- [ ] **QA**: Staging tests passed
- [ ] **Product**: Performance metrics acceptable
- [ ] **Security**: No security regressions
- [ ] **Leadership**: Approval for production deployment

---

## Post-Deployment Communication

### Internal Team

```text
📢 Announcement: Phase 2 Deployment Success

Deployed: March 15, 2026 at 10:00 PM UTC
Duration: 45 minutes (5% → 100%)

Performance Improvements:
- FCP: 2.5s → 1.2s (↓ 52%)
- LCP: 4.2s → 2.1s (↓ 50%)
- Page load time: 3.7s → 1.8s (↓ 50%)

Reliability:
- Service health gating: Active
- Error rate: <0.1%
- Zero incidents

Next Steps:
- Monitor Core Web Vitals dashboard
- Review user feedback
- Plan Phase 3 enhancements
```

### Public/Users

```text
🚀 We've improved TripAlfa's performance!

- 50% faster page loads
- Better reliability when services are busy
- Improved booking experience

You may notice:
- Pages load faster
- Smoother interactions
- Better experience on slower connections
```

---

## Document Sign-Off

**Deployment Team**:

- Name: ******\_\_\_******
- Date: ******\_\_\_******
- Approved: ****\_\_\_****

**DevOps Lead**:

- Name: ******\_\_\_******
- Date: ******\_\_\_******
- Approved: ****\_\_\_****

**Product Manager**:

- Name: ******\_\_\_******
- Date: ******\_\_\_******
- Approved: ****\_\_\_****
