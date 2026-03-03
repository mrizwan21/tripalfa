# Neon API Token Rotation Guide

**CRITICAL SECURITY ACTION**  
**Status:** REQUIRED BEFORE PRODUCTION DEPLOYMENT  
**Timeline:** Complete within 24 hours of PR merge

---

## Why This Matters

Two Neon API tokens were exposed in the git repository history during previous configuration phases:

- `npg_gGC0J7vfiNzD`
- `REDACTED`

**Risk Level:** 🔴 **HIGH**

These tokens:
- ✗ Can access your cloud PostgreSQL database
- ✗ Are visible in git history (even if removed from current files)
- ✗ Should be considered **compromised**
- ✓ Have been removed from all committed files in this PR
- ✓ Need to be rotated immediately

---

## What We Did

✅ **In This PR:**
- Removed all instances of exposed tokens from committed files
- Added `.env.docker.local` and `.env.local` to `.gitignore`
- Created `.env.example` and `.env.docker` templates (NO secrets)
- Updated documentation to clarify secure workflow

⚠️ **What YOU Must Do:**
- Rotate the exposed tokens
- Verify git history is clean
- Update all environment files with new tokens

---

## Step-by-Step Token Rotation

### Step 1: Delete Old Tokens

1. **Visit Neon Console:**
   - Go to https://console.neon.tech
   - Log in with your account

2. **Navigate to API Keys:**
   - Click your profile icon (top right)
   - Select "API Keys"
   - Or go directly: https://console.neon.tech/app/settings/api-keys

3. **Find and Delete Exposed Tokens:**
   ```
   Look for tokens matching:
   - npg_gGC0J7vfiNzD (DELETE THIS)
   - REDACTED (DELETE THIS)
   ```

4. **Delete Each Token:**
   - Click the token
   - Select "Delete" or "Revoke"
   - Confirm deletion
   - ✅ Token is now invalid

### Step 2: Create New API Token

1. **In Neon Console → Settings → API Keys**
   - Click "Create API key" button
   - Enter name: `TripAlfa-Dev` (or similar)
   - Set expiration: 90 days (recommended for security)
   - Click "Create"

2. **Copy Your New Token:**
   ```
   You'll see something like:
   neon_[very_long_string_of_characters]
   
   COPY THIS - you'll need it next
   ```

### Step 3: Get Your Database Connection String

Your Neon connection string should look like:
```
postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require
```

You can find this in Neon Console:
1. Click your project
2. Select "Pooling" or "Databases" tab
3. Copy the "Connection string" with pooling enabled

---

## Step 4: Update Local Environment Files

### For Docker Setup

**File:** `.env.docker.local` (git-ignored, local only)

```bash
# Replace with YOUR values
NEON_DATABASE_URL=postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require
DIRECT_NEON_DATABASE_URL=postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require

# These can stay the same unless you changed them
JWT_SECRET=dev-secret-change-in-production
```

### For Local Development

**File:** `.env.local` (git-ignored, local only)

```bash
# Same database URL as above
NEON_DATABASE_URL=postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require
DIRECT_NEON_DATABASE_URL=postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require

# Other local development variables
JWT_SECRET=dev-secret-change-in-production
```

### For Staging/Production (If Applicable)

**Contact your DevOps team to update:**
- CI/CD pipeline secrets
- Docker deployment variables
- Cloud hosting environment variables

Never commit these files!

---

## Step 5: Verify Token Works

### Test with Docker Compose

```bash
# Navigate to project
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node

# Try starting services
docker-compose -f docker-compose.local.yml up

# You should see:
# ✓ env-validator: NEON_DATABASE_URL is set and valid
# ✓ Services connecting to database successfully
# ✓ No connection refused errors
```

### Test with Local Services

```bash
# If running services locally
npm run dev

# You should see:
# ✓ Database connection successful
# ✓ No ECONNREFUSED errors
# ✓ Services starting normally
```

### Test Database Connection

```bash
# Optional: Direct test with psql
psql "postgresql://[user]:[password]@[ep-xxxxx].us-east-2.aws.neon.tech/[dbname]?sslmode=require"

# Should connect successfully
# Type: \q to exit
```

---

## Step 6: Secure Your GitHub Repository

### (Optional but Recommended)

If you're concerned about old tokens in git history:

1. **Check if tokens appear in logs:**
   ```bash
   git log -S "npg_" --source --all  # Search history for old tokens
   ```

2. **If found, consider:**
   - Using BFG Repo-Cleaner to remove from history (advanced)
   - Or accept that old tokens are now invalid and monitored
   - Neon will only allow one token to work at a time per integration

3. **Enable branch protection** (GitHub):
   - Settings → Branches → Add rule
   - Require PR reviews before merge
   - Require status checks to pass
   - Dismiss stale PR approvals

---

## Verification Checklist

- [ ] Old tokens deleted from Neon Console
- [ ] New API token created and noted
- [ ] Database connection string retrieved
- [ ] `.env.docker.local` updated with new connection string
- [ ] `.env.local` updated with new connection string
- [ ] Docker services start successfully
- [ ] Database connections work (no ECONNREFUSED)
- [ ] Local services can access database

---

## Security Best Practices Going Forward

### ✅ DO

- ✅ Keep all secrets in `.env.local` and `.env.docker.local` (git-ignored)
- ✅ Use `.env.example` as template (committed, no secrets)
- ✅ Rotate tokens every 90 days
- ✅ Use different tokens for dev/staging/prod
- ✅ Enable API key expiration in Neon Console
- ✅ Monitor token usage in Neon logs
- ✅ Add git pre-commit hooks to prevent accidental commits

### ✗ DON'T

- ✗ Never commit `.env.local` or `.env.docker.local`
- ✗ Never paste tokens in Slack, GitHub issues, or comments
- ✗ Never reuse old tokens after rotation
- ✗ Never share API keys via email or unencrypted channels
- ✗ Never use same token for multiple environments

---

## Troubleshooting

### Error: `ECONNREFUSED` when starting services

**Likely causes:**
- Old token still being used
- New token not saved correctly
- Database URL copied incorrectly
- Neon project paused

**Fix:**
```bash
# Verify your .env files
cat .env.docker.local | grep NEON
cat .env.local | grep NEON

# Confirm new token in Neon Console
# Paste connection string exactly as shown (no typos)

# Restart services
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d
```

### Error: `Unauthorized` or `Invalid token`

**Cause:** Old token still configured somewhere

**Fix:**
```bash
# Find all references to old token
grep -r "npg_" .env* --include="*.local"
# Should show: nothing

# If found, update those files with new token
```

### Services start but can't reach database

**Verify in Neon Console:**
1. Project is not paused
2. Database branch is active
3. User has appropriate permissions
4. Connection string includes `sslmode=require`

---

## Questions?

**Documentation References:**
- See [SETUP.md](SETUP.md) for complete environment setup
- See [QUICK_START_ENV.md](QUICK_START_ENV.md) for quick reference
- See `.env.example` for all possible configuration options

**Need Help?**
- Check Neon documentation: https://neon.tech/docs
- Contact your DevOps/Infrastructure team
- Review [PR_MERGE_SUMMARY.md](PR_MERGE_SUMMARY.md) for context

---

## Completion Status

Once you complete all 6 steps and verification:

- ✅ Mark as complete in team documentation
- ✅ Notify DevOps if production tokens need rotation
- ✅ Update any CI/CD secrets
- ✅ Approve PR for merge to main

**Your project is then secure and ready for deployment.**

---

## Timeline

```
Immediately on PR merge:
  ├─ Day 1 (24h): Rotate all tokens ← YOU ARE HERE
  ├─ Day 1: Verify Docker services work
  ├─ Day 1: Update CI/CD secrets (if applicable)
  └─ Day 2: Merge to production if all tests pass
```

**DO NOT deploy to production until tokens are rotated.**

---

## Quick Reference

| Item | Location | Action |
|------|----------|--------|
| Neon Console | https://console.neon.tech | Delete old tokens |
| Create New Token | https://console.neon.tech/app/settings/api-keys | Generate new |
| Connection String | Neon Console → Pooling tab | Copy to .env files |
| `.env.docker.local` | Project root (git-ignored) | Update with new URL |
| `.env.local` | Project root (git-ignored) | Update with new URL |
| Docker Startup | Terminal | `docker-compose -f docker-compose.local.yml up` |
| Verification | Services running | Load http://localhost:3000 |

---

**Document Version:** 1.0  
**Last Updated:** March 3, 2026  
**Next Review:** When token rotation is complete  

**SECURITY CHECKPOINT:** ✅ Do not proceed to production until this document is 100% complete.
