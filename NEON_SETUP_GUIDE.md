# Neon PostgreSQL Setup Guide

## 🚀 Quick Start

### Step 1: Get Your Neon Connection String

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign in or create an account
3. Create a new project (or use existing)
4. Go to **Connection Details** and copy your connection string

Your connection string will look like:
```
postgresql://neon_user:neon_password@ep-xyz.neon.tech/tripalfa?sslmode=require
```

### Step 2: Update Your .env File

Open `.env` in the project root and update:

```env
DATABASE_URL="postgresql://neon_user:neon_password@ep-xyz.neon.tech/tripalfa?sslmode=require"
```

**Replace:**
- `neon_user` - Your Neon project user
- `neon_password` - Your Neon project password
- `ep-xyz.neon.tech` - Your Neon endpoint host
- `tripalfa` - Your database name

### Step 3: Apply Migrations

Once `.env` is configured with your real connection string:

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations to Neon
npm run db:migrate
```

### Step 4: Verify Connection

```bash
# Open Prisma Studio (interactive database browser)
npm run db:studio
```

You should see your database tables including:
- `OfflineChangeRequest` - Main offline request entity
- `OfflineRequestAuditLog` - Audit trail
- `OfflineRequestNotificationQueue` - Notification queue

---

## 📝 Where to Get Neon Connection Details

### From Neon Dashboard

1. **Project Settings** → **Connection Details**
2. Click **Connection string** tab
3. Copy the PostgreSQL connection string
4. Paste into your `.env` as `DATABASE_URL`

### Example Format

```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"
```

---

## 🛠️ Database Scripts Available

```bash
# Generate Prisma client (run after schema changes)
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Push schema changes to database (non-destructive)
npm run db:push

# Open interactive database explorer
npm run db:studio
```

---

## ✅ Offline Request Management System - Database Tables

After migrations, you'll have:

### 1. OfflineChangeRequest
- Core entity for offline booking requests
- Fields: bookingId, status, priority, requestType, pricing, payment, documents
- 34+ columns including JSONB for flexible data

### 2. OfflineRequestAuditLog
- Complete audit trail for compliance
- Records: action, actor, before/after values, timestamp
- Foreign key to OfflineChangeRequest with CASCADE delete

### 3. OfflineRequestNotificationQueue
- Queue for sending notifications
- Tracks: status, retry attempts, content
- Foreign key to OfflineChangeRequest with CASCADE delete

---

## 🔍 Verify Setup

Check if migrations applied successfully:

```bash
npm run db:studio
```

You should see three new tables in the browser interface.

---

## 🚨 Troubleshooting

### "DATABASE_URL not found"
- Verify `.env` file in project root
- Check DATABASE_URL is set and not commented out
- Ensure connection string is valid

### "Connection refused"
- Verify Neon project is active
- Check endpoint host is correct
- Test offline mode disabled in Neon console

### "SSL connection error"
- Ensure connection string includes `?sslmode=require`
- This is required for Neon over internet

### "ENOTFOUND"
- Network issue - check internet connection
- Verify endpoint hostname is correct
- Try from different network if issues persist

---

## 📚 Database Architecture

```
┌─────────────────────────────────────────────┐
│  Neon PostgreSQL (Cloud)                    │
├─────────────────────────────────────────────┤
│                                             │
│  OfflineChangeRequest (main)                │
│  ├─ id (UUID)                               │
│  ├─ bookingId (FK)                          │
│  ├─ status (enum: pending_staff, etc)       │
│  ├─ requestedChanges (JSONB)                │
│  ├─ staffPricing (JSONB)                    │
│  ├─ payment (JSONB)                         │
│  └─ createdAt, updatedAt                    │
│                                             │
│  OfflineRequestAuditLog                     │
│  ├─ id (UUID)                               │
│  ├─ offlineRequestId (FK with CASCADE)      │
│  ├─ action (enum)                           │
│  ├─ actorId, actorType                      │
│  └─ oldValues, newValues (JSONB)            │
│                                             │
│  OfflineRequestNotificationQueue            │
│  ├─ id (UUID)                               │
│  ├─ offlineRequestId (FK with CASCADE)      │
│  ├─ notificationType (enum)                 │
│  ├─ status (pending, sent, failed)          │
│  └─ attemptCount, maxAttempts               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔗 Integration Points

After setup, you can:

1. **Create Offline Requests**
   ```bash
   POST /api/offline-requests
   ```

2. **View Staff Queue**
   ```bash
   GET /api/offline-requests/queue
   ```

3. **Submit Pricing**
   ```bash
   PUT /api/offline-requests/:id/pricing
   ```

See [docs/OFFLINE_REQUEST_API.md](./docs/OFFLINE_REQUEST_API.md) for full API reference.

---

## 📞 Support

- **Neon Docs:** https://neon.tech/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Connection Issues:** Check Neon Dashboard for service status

---

**Ready?** Update `.env` with your Neon connection string and run:

```bash
npm run db:migrate
```
