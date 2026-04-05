# Resend Email Notifications - Quick Reference Guide

**Last Updated**: 2024-01-15 | **Version**: 1.0.0

---

## Quick Start (5 Minutes)

```bash
# 1. Set API key
export RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 2. Start webhook bridge (using PM2)
cd /path/to/TripAlfa-Node
pm2 start services/alerting-service/src/resend-webhook-bridge.ts --name resend-webhook-bridge

# OR run directly:
# node services/alerting-service/src/resend-webhook-bridge.ts &

# 3. Verify health
curl http://localhost:9094/health

# 4. Test email
curl -X POST "http://localhost:9094/resend/send?to=your-email@example.com" \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"Test"}}],
      "groupLabels":{},"commonAnnotations":{},"commonLabels":{}}'

# 5. Check inbox (wait 30 seconds)
```

---

## Common Commands

### Service Management

```bash
# Start webhook bridge (using PM2)
pm2 start services/alerting-service/src/resend-webhook-bridge.ts --name resend-webhook-bridge

# OR run directly:
# node services/alerting-service/src/resend-webhook-bridge.ts &

# Stop webhook bridge
pm2 stop resend-webhook-bridge

# View logs
pm2 logs resend-webhook-bridge

# Stream logs (real-time)
pm2 logs resend-webhook-bridge -f

# Check service status
pm2 status

# Restart service
pm2 restart resend-webhook-bridge
```

### Verification

```bash
# Health check
curl http://localhost:9094/health

# API key test
curl -X GET https://api.resend.com/api-keys \
  -H "Authorization: Bearer ${RESEND_API_KEY}"

# AlertManager webhook config
curl -s http://localhost:9093/api/v2/receivers | jq '.[] | select(.name=="default")'
```

### Email Testing

```bash
# Send test email (standard route)
curl -X POST "http://localhost:9094/resend/send?to=test@example.com" \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"TestAlert"}}],
      "groupLabels":{},"commonAnnotations":{},"commonLabels":{}}'

# Send test email (critical route)
curl -X POST "http://localhost:9094/resend/send-critical?to=test@example.com" \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"TestAlert"}}],
      "groupLabels":{},"commonAnnotations":{},"commonLabels":{}}'
```

---

## Email Recipients

| Type     | Email                   | Endpoint                | Priority |
| -------- | ----------------------- | ----------------------- | -------- |
| Standard | <ops@tripalfa.com>      | `/resend/send`          | P3       |
| Critical | ${CRITICAL_ALERT_EMAIL} | `/resend/send-critical` | P1       |
| Warning  | <dev-team@tripalfa.com> | `/resend/send`          | P3       |
| Database | ${DATABASE_TEAM_EMAIL}  | `/resend/send-critical` | P2       |

---

## Configuration Files

| File                       | Purpose               | Location                         |
| -------------------------- | --------------------- | -------------------------------- |
| `.env.resend`              | Environment variables | Root directory                   |
| `alertmanager.yml`         | AlertManager config   | `infrastructure/monitoring/`     |
| `resend-webhook-bridge.ts` | Webhook service       | `services/alerting-service/src/` |
| (PM2 managed)              | Process manager       | Use `pm2 status`                 |

---

## Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (with defaults)
FROM_EMAIL=alerts@tripalfa.com
WEBHOOK_PORT=9094
CRITICAL_ALERT_EMAIL=critical-alerts@tripalfa.com
DATABASE_TEAM_EMAIL=dba@tripalfa.com
NODE_ENV=production
```

---

## Webhook Endpoints

| Endpoint                | Method | Purpose        | Port |
| ----------------------- | ------ | -------------- | ---- |
| `/health`               | GET    | Health check   | 9094 |
| `/resend/send`          | POST   | Standard alert | 9094 |
| `/resend/send-critical` | POST   | Critical alert | 9094 |

**Query Parameters**:

- `to=email@example.com` - Recipient email address (required)

**Response**:

```json
{
  "success": true,
  "messageId": "messageId-from-resend"
}
```

---

## Alert Email Structure

**Subject**: `🔴 [FIRING] AlertName` or similar

**From**: `${FROM_EMAIL}` (default: <alerts@tripalfa.com>)

**HTML Body Includes**:

- Alert name and severity
- Firing time
- Description
- Alert details
- Links to AlertManager and Grafana
- Color-coded by severity

---

## Troubleshooting

### "Connection refused"

```bash
# Check if webhook bridge is running
pm2 status | grep resend-webhook-bridge

# Start it
pm2 start services/alerting-service/src/resend-webhook-bridge.ts --name resend-webhook-bridge
```

### "Invalid API Key"

```bash
# Verify API key
echo $RESEND_API_KEY

# Test API key
curl -X GET https://api.resend.com/api-keys \
  -H "Authorization: Bearer ${RESEND_API_KEY}"

# If invalid, get new key from: https://resend.com/api-keys
```

### Emails not delivered

```bash
# Check logs
pm2 logs resend-webhook-bridge | grep -i error

# Verify recipient email
# Check Resend dashboard: https://resend.com/emails

# Verify FROM_EMAIL is verified in Resend
# https://resend.com/emails/settings/domains
```

### Port already in use

```bash
# Find process using port 9094
lsof -i :9094

# Kill it OR use different port
export WEBHOOK_PORT=9095
```

---

## Monitoring

### Daily

```bash
# Check service is running
pm2 status | grep resend-webhook-bridge

# Check for errors
pm2 logs resend-webhook-bridge | grep -i error

# Monitor Resend dashboard
# https://resend.com/emails
```

### Logs to Watch For

✅ **Success**:

```
✓ Email sent to ops@tripalfa.com (messageId: re_xxxxx)
✓ Webhook bridge initialized on port 9094
GET /health - 200
POST /resend/send - 200
```

❌ **Errors**:

```
✗ Invalid API key
✗ Failed to send email
✗ Invalid recipient email
✗ Resend API error
```

---

## Dashboard Links

| Service         | URL                           |
| --------------- | ----------------------------- |
| Resend Emails   | <https://resend.com/emails>   |
| Resend API Keys | <https://resend.com/api-keys> |
| AlertManager    | <http://localhost:9093>       |
| Prometheus      | <http://localhost:9090>       |
| Grafana         | <http://localhost:3000>       |

---

## Key Files Reference

**AlertManager Configuration**:

- File: `infrastructure/monitoring/alertmanager.yml`
- Webhook URLs: Line ~100+
- Contains all 4 receiver definitions

**Webhook Bridge**:

- File: `services/alerting-service/src/resend-webhook-bridge.ts`
- Port: 9094
- Endpoints: /health, /resend/send, /resend/send-critical

**Process Manager (PM2):**

- Use PM2 to manage the webhook bridge service
- Start: `pm2 start services/alerting-service/src/resend-webhook-bridge.ts --name resend-webhook-bridge`
- Status: `pm2 status`

---

## Support

| Need           | Resource                                                 |
| -------------- | -------------------------------------------------------- |
| Setup help     | `docs/RESEND_EMAIL_NOTIFICATIONS.md`                     |
| Deployment     | `docs/RESEND_DEPLOYMENT_CHECKLIST.md`                    |
| Configuration  | `.env.resend.example`                                    |
| Code reference | `services/alerting-service/src/resend-webhook-bridge.ts` |
| Issues         | Check logs: `pm2 logs resend-webhook-bridge`             |

---

## On-Call Runbook Links

- **Email not delivering**: See "Troubleshooting" → "Emails not delivered"
- **Webhook bridge crashed**: `pm2 status` → check status
- **API key invalid**: Update `RESEND_API_KEY` in `.env`
- **Port conflict**: Use `lsof -i :9094` to find process

---

## Deployment Coordinates

| Component      | Status                   | Port | Command                                      |
| -------------- | ------------------------ | ---- | -------------------------------------------- |
| Webhook Bridge | Status via `pm2 status`  | 9094 | `pm2 start ... --name resend-webhook-bridge` |
| AlertManager   | Check process            | 9093 | Check config                                 |
| Resend API     | <https://api.resend.com> | 443  | Requires API key                             |

---

## Quick Testing Script

```bash
#!/bin/bash
set -e

echo "Testing Resend integration..."

# 1. Health check
echo "✓ Health check"
curl -s http://localhost:9094/health | jq .

# 2. API key validation
echo "✓ API key validation"
curl -s -X GET https://api.resend.com/api-keys \
  -H "Authorization: Bearer ${RESEND_API_KEY}" | jq '.data | length'

# 3. Send test email
echo "✓ Sending test email"
curl -s -X POST "http://localhost:9094/resend/send?to=${TEST_EMAIL:-your-email@example.com}" \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"status":"firing","labels":{"alertname":"QuickTest"}}],
      "groupLabels":{},"commonAnnotations":{},"commonLabels":{}}' | jq .

# 4. Check webhook bridge logs
echo "✓ Recent logs"
pm2 logs resend-webhook-bridge --lines 5

echo "All tests passed!"
```

---

## Resend Email Status Codes

| Code | Status          | Action                     |
| ---- | --------------- | -------------------------- |
| 200+ | Success         | No action needed           |
| 400  | Invalid request | Check JSON format          |
| 401  | Invalid API key | Update RESEND_API_KEY      |
| 422  | Invalid email   | Verify recipient addresses |
| 429  | Rate limited    | Wait and retry             |
| 500+ | Server error    | Check Resend status        |

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Maintainer**: DevOps Team  
**Print and laminate for runbook binder!**
