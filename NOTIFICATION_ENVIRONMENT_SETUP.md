# Notification System Environment Configuration

This guide provides all the environment variables needed to configure the notification system for TripAlfa.

## Table of Contents
1. [Email Configuration](#email-configuration)
2. [SMS Configuration](#sms-configuration)
3. [Push Notifications](#push-notifications)
4. [Frontend Configuration](#frontend-configuration)
5. [Backend Configuration](#backend-configuration)
6. [Database Configuration](#database-configuration)

---

## Email Configuration

### Gmail / Google Workspace

```bash
# Using App Password (recommended for Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@tripalfa.com
EMAIL_SECURE=false

# Alternative: Using Gmail OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

**Steps to generate Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate a 16-character password
4. Use this password as `EMAIL_PASS`

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@tripalfa.com
```

### AWS SES (Simple Email Service)

```bash
EMAIL_PROVIDER=aws-ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EMAIL_FROM=noreply@tripalfa.com
```

### Mailgun

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.tripalfa.com
EMAIL_FROM=noreply@tripalfa.com
```

---

## SMS Configuration

### Twilio

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional
```

**Steps to get Twilio credentials:**
1. Create account at https://www.twilio.com
2. Verify phone numbers (for sandbox) or upgrade account
3. Get credentials from https://console.twilio.com
4. Purchase a phone number for send messages

### AWS SNS (Simple Notification Service)

```bash
SMS_PROVIDER=aws-sns
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Vonage (Nexmo)

```bash
SMS_PROVIDER=vonage
VONAGE_API_KEY=xxxxx
VONAGE_API_SECRET=xxxxx
VONAGE_FROM_NUMBER=TripAlfa  # Display name (up to 11 chars)
```

---

## Push Notifications

### Web Push (VAPID Keys)

```bash
# Generate keys using this tool: https://web-push-codelab.glitch.me/
REACT_APP_VAPID_PUBLIC_KEY=BP_YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
VAPID_SUBJECT=mailto:support@tripalfa.com

# Alternative: For local testing
REACT_APP_VAPID_PUBLIC_KEY=BKLL0kxIXH_7fwYbx-gHm3y3WzQqVCIRB_j2H5p5t3kZVmqNSctF3xjkQEAiVa_1a3XYCFQmV-CnOOzCZ3Bv0ow
VAPID_PRIVATE_KEY=AAGd9wCdh5BX3Y_q5n9Z_X5p7r3N_L9K
VAPID_SUBJECT=mailto:support@tripalfa.com
```

**To generate VAPID keys:**
```bash
npm install --save-dev web-push
npx web-push generate-vapid-keys
```

---

## Frontend Configuration

```bash
# API URLs
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=30000

# WebSocket URLs
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_WS_RECONNECT_INTERVAL=5000

# Firebase (Optional: for additional push capability)
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=tripalfa.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tripalfa
REACT_APP_FIREBASE_STORAGE_BUCKET=tripalfa.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Feature Flags
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
REACT_APP_ENABLE_EMAIL_NOTIFICATIONS=true
REACT_APP_ENABLE_SMS_NOTIFICATIONS=true
REACT_APP_ENABLE_IN_APP_NOTIFICATIONS=true
```

---

## Backend Configuration

### Core Notification Service

```bash
# Node Environment
NODE_ENV=production
NODE_PORT=3002

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tripalfa

# Service URLs
API_GATEWAY_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3002

# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://tripalfa.com

# Redis (for caching and queuing)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Queue Configuration
QUEUE_PROVIDER=redis  # or "memory" for development
MAX_QUEUE_SIZE=10000
```

### API Gateway WebSocket

```bash
# WebSocket Configuration
WS_PORT=3001
WS_PATH=/socket.io
WS_TRANSPORTS=websocket,polling

# Message Queue (for real-time notifications)
AMQP_URL=amqp://guest:guest@localhost:5672/
KAFKA_BROKERS=localhost:9092
MESSAGE_QUEUE_TYPE=redis  # redis, amqp, kafka, memory

# Notification Polling
NOTIFICATION_POLL_INTERVAL=30000  # 30 seconds
MAX_NOTIFICATIONS_PER_POLL=50
```

### Queue Worker (Optional)

```bash
# For async notification processing
WORKER_THREADS=4
BATCH_SIZE=100
BATCH_TIMEOUT=5000

# Dead Letter Queue
DLQ_RETENTION_DAYS=30
DLQ_RETRY_INTERVAL=3600  # 1 hour

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## Database Configuration

### PostgreSQL

```bash
# Primary Database
DATABASE_URL=postgresql://neondb_owner:password@us-east-1.sql.neon.tech/neondb?sslmode=require

# Replica (for read scaling)
DATABASE_READ_URL=postgresql://neondb_owner:password@replica-us-east-1.sql.neon.tech/neondb?sslmode=require

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# Timeouts
DB_QUERY_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# SSL/TLS
DB_SSL_MODE=require
DB_SSL_CERT_PATH=/path/to/cert.pem
```

---

## Logging Configuration

```bash
# Log Levels: error, warn, info, debug, trace
LOG_LEVEL=info
LOG_FORMAT=json  # json or pretty

# Structured Logging
ENABLE_STRUCTURED_LOGS=true
LOG_SERVICE_NAME=tripalfa-notifications

# Error Tracking
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Performance Monitoring
ENABLE_APM=false
APM_SERVICE_NAME=tripalfa-notifications
```

---

## Security Configuration

```bash
# CORS
CORS_ORIGIN=http://localhost:5173,https://tripalfa.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# API Keys (for external services)
INTERNAL_API_KEY=your-internal-service-key
ADMIN_API_KEY=your-admin-key

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key-here
ENCRYPTION_ALGORITHM=aes-256-gcm
```

---

## Email Template Configuration

```bash
# Email Template Directory
EMAIL_TEMPLATE_DIR=./templates/emails

# Email Templates
EMAIL_TEMPLATE_OFFLINE_REQUEST_SUBMITTED=offline-request-submitted.html
EMAIL_TEMPLATE_OFFLINE_REQUEST_APPROVED=offline-request-approved.html
EMAIL_TEMPLATE_OFFLINE_REQUEST_REJECTED=offline-request-rejected.html
EMAIL_TEMPLATE_BOOKING_CONFIRMATION=booking-confirmation.html

# Brand Configuration
BRAND_NAME=TripAlfa
BRAND_EMAIL=support@tripalfa.com
BRAND_COLOR=#007BFF
BRAND_LOGO_URL=https://tripalfa.com/logo.png
```

---

## Webhook Configuration

```bash
# Webhook URLs
OFFLINE_REQUEST_WEBHOOK_URL=http://localhost:3002/webhooks/offline-request-status
PAYMENT_WEBHOOK_URL=http://localhost:3002/webhooks/payment
BOOKING_WEBHOOK_URL=http://localhost:3002/webhooks/booking

# Webhook Authentication
WEBHOOK_SECRET=your-webhook-secret-key
WEBHOOK_SIGNATURE_HEADER=X-Webhook-Signature
WEBHOOK_TIMEOUT=30000

# Webhook Retry
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
CHECK_WEBHOOK_SIGNATURE=true
```

---

## Development vs Production

### Development (.env.local)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/tripalfa
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
LOG_LEVEL=debug
EMAIL_PROVIDER=console  # Logs emails to console
SMS_PROVIDER=mock  # Mock SMS sending
```

### Production (.env.production)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-postgres.example.com/tripalfa
REACT_APP_API_URL=https://api.tripalfa.com
REACT_APP_WS_URL=wss://api.tripalfa.com
LOG_LEVEL=warn
SENTRY_DSN=https://...
```

---

## Validation Script

Create a script to validate environment variables:

```bash
# validate-env.sh
#!/bin/bash

required_vars=(
  "DATABASE_URL"
  "EMAIL_HOST"
  "EMAIL_USER"
  "TWILIO_ACCOUNT_SID"
  "JWT_SECRET"
)

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing required environment variables:"
  printf '%s\n' "${missing[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"
```

Usage:
```bash
chmod +x validate-env.sh
./validate-env.sh
```

---

## Tips for Setup

1. **Never commit `.env` files** - Use `.env.example` template
2. **Use strong keys** - Generate new JWT and encryption keys for production
3. **VAPID Keys** - Generate separately for each domain/environment
4. **SMS in Development** - Use mock provider to avoid charges
5. **Email in Development** - Use local SMTP or console provider
6. **Database Backups** - Configure automated backups before prod
7. **Monitor Quotas** - Check Twilio/SendGrid/AWS quotas regularly
8. **Test All Providers** - Verify email/SMS delivery works before launch
9. **Secure Credentials** - Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
10. **Update Regularly** - Keep provider libraries updated for security patches

---

## Quick Start

1. Copy `.env.example`:
```bash
cp .env.example .env.local
```

2. Fill in required variables for your environment

3. Validate:
```bash
./validate-env.sh
```

4. Start services:
```bash
npm run dev
```

5. Test notifications:
```bash
npm run test:notifications
```

---

## Troubleshooting

### "Email not sending"
- Check `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
- Verify port (587 for TLS, 465 for SSL)
- Check firewall allows outbound SMTP
- Enable less secure apps (Gmail)

### "SMS not sending"
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Check account has sufficient balance/credits
- Verify phone number format is correct
- Check region restrictions

### "WebSocket not connecting"
- Verify `REACT_APP_WS_URL` is correct
- Check CORS settings
- Verify server WebSocket is initialized
- Check for proxy/firewall issues

### "Push notifications not working"
- Verify VAPID keys are correct
- Check browser has granted notification permission
- Verify Service Worker is registered
- Check browser console for errors

---

**Last Updated**: Phase 4 Implementation
**Version**: 1.0
