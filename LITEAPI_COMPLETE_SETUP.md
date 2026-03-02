# 🏨 LiteAPI Hotel Testing - Complete Setup

Complete guide to configure and run LiteAPI hotel booking tests with automatic API key detection.

---

## 📖 Overview

This repository now includes **automatic API key detection** from 3 sources:

1. **`.env.test` file** (Recommended) ← Easiest for local development
2. **Environment variables** ← Best for CI/CD
3. **Secrets files** ← Secure option for shared environments

The test script automatically tries all sources in order and uses the first valid key found.

---

## 🚀 Option C: Automatic .env.test Setup (Recommended)

### Why This Option?

✅ **Simplest** - Set it up once, then just run tests  
✅ **Secure** - Already in .gitignore (can't accidentally commit)  
✅ **Persistent** - Key stays configured between test runs  
✅ **Team-friendly** - Each dev has their own key

### Setup Instructions

**Step 1: Use the Setup Wizard (Recommended)**

```bash
./setup-liteapi-tests.sh
```

This interactive script will:

- Ask for your API key
- Ask for test preferences (city, adults, etc.)
- Create `.env.test` with your configuration
- Show you how to run tests

**Step 2: Or Create Manually**

```bash
# Copy the template
cp .env.test.example .env.test

# Edit the file and add your API key
nano .env.test
```

Update the `LITEAPI_API_KEY` line:

```env
LITEAPI_API_KEY=sand_your_api_key_here
```

### Step 3: Verify It Works

```bash
npm run test:api:liteapi
```

Expected output: ✓ All 7 E2E tests passing

---

## 📋 Configuration Files

### `.env.test` (For Local Development)

```env
# Your sandbox API key
LITEAPI_API_KEY=sand_e79a7012-2820-4644-874f-ea71a9295a0e

# Test preferences (optional)
LITEAPI_TEST_CITY=Paris
LITEAPI_TEST_COUNTRY=FR
LITEAPI_TEST_ADULTS=2

# API endpoints (use defaults)
LITEAPI_API_BASE_URL=https://api.liteapi.travel/v3.0
LITEAPI_BOOK_BASE_URL=https://book.liteapi.travel/v3.0

# Debug output
VERBOSE=false
```

### `.env.test.example` (Template)

Use as a reference:

- Shows all available options
- Has helpful comments
- Safe to commit to git

---

## 🎯 How It Works

### Automatic Key Resolution

The test script automatically loads environment variables in this order:

1. **`.env.test`** - Your local configuration (highest priority)

   ```bash
   # Loads from here first
   LITEAPI_API_KEY=sand_...
   ```

2. **`.env.local`** - Alternative configuration file

   ```bash
   # Falls back to here if .env.test not found
   LITEAPI_API_KEY=sand_...
   ```

3. **Process Environment** - Command line variables

   ```bash
   # Falls back to env variables
   export LITEAPI_API_KEY=sand_...
   ```

4. **Secrets Files** - Secure file storage

   ```bash
   # Falls back to secrets directory
   cat secrets/liteapi_api_key.txt  # Must contain: sand_...
   ```

### Loading Process (in test script)

```typescript
// Load from .env.test → .env.local → .env
loadEnvFile();

// Check environment variables
const envKey = process.env.LITEAPI_API_KEY;

// Check secrets files
if (!envKey) {
  const keyFile = read('secrets/liteapi_api_key.txt');
  return keyFile;
}
```

This means you only need to set it **once** and it works forever!

---

## ✅ Verification Checklist

Before running tests, verify:

```bash
# 1. Check if .env.test exists
ls -la .env.test

# 2. Verify it has the API key
grep LITEAPI_API_KEY .env.test

# 3. Check the key format (should start with "sand_")
grep LITEAPI_API_KEY .env.test | cut -d= -f2

# 4. Verify it's in .gitignore (shouldn't be committed)
grep ".env.test" .gitignore
```

All should show ✓ results.

---

## 📊 Test Commands

### Run E2E Tests

```bash
# Basic run (uses .env.test configuration)
npm run test:api:liteapi

# With verbose output
VERBOSE=true npm run test:api:liteapi

# Override test city
LITEAPI_TEST_CITY=Berlin LITEAPI_TEST_COUNTRY=DE npm run test:api:liteapi
```

### Run Workflow Tests

```bash
# Test the orchestrator (document generation, notifications)
npm run test:api:liteapi:orchestrator
```

### Run Complete Suite

```bash
# E2E + Orchestrator + Additional workflows
npm run test:api:liteapi:comprehensive
```

---

## 🔧 Troubleshooting

### Issue: "401 Unauthorized" or "API key not found"

**Check these in order:**

```bash
# 1. Verify .env.test exists and has content
cat .env.test | grep LITEAPI_API_KEY

# 2. Check if API key is valid (should start with "sand_")
echo $LITEAPI_API_KEY

# 3. Try direct environment variable
export LITEAPI_API_KEY=sand_your_key
npm run test:api:liteapi

# 4. Check if there's something in secrets/
ls -la secrets/
```

### Issue: Wrong City/Date for Test

```bash
# Override in command
LITEAPI_TEST_CITY=London LITEAPI_TEST_COUNTRY=GB npm run test:api:liteapi

# Or update .env.test
nano .env.test  # Change LITEAPI_TEST_CITY
npm run test:api:liteapi
```

### Issue: Timeout Errors

```bash
# Increase timeout to 2 minutes
LITEAPI_TIMEOUT_MS=120000 npm run test:api:liteapi

# Or update .env.test
echo "LITEAPI_TIMEOUT_MS=120000" >> .env.test
```

---

## 📚 File Structure

```
/
├── .env.test                              ← Your configuration (created)
├── .env.test.example                      ← Template (reference)
├── setup-liteapi-tests.sh                 ← Interactive setup wizard (new)
├── LITEAPI_COMPLETE_SETUP.md              ← Canonical setup guide
├── scripts/
│   ├── test-liteapi-direct.ts             ← Updated with .env loading
│   └── ...
├── .gitignore
│   └── .env.test                          ← Already ignored
└── docs/
    ├── integrations/
    │   └── HOTEL_BOOKING_WORKFLOW_ORCHESTRATOR_GUIDE.md
    └── ...
```

---

## 🔐 Security Best Practices

### ✅ DO

- Keep `.env.test` with only your API key
- Use separate keys for dev/staging/prod
- Rotate keys regularly
- Use `.gitignore` (already configured)
- Check `.env.test` is NOT in git history

```bash
# Verify it's not in git
git log --all --full-history -- .env.test  # Should be empty
git check-ignore .env.test  # Should show it's ignored
```

### ❌ DON'T

- Share `.env.test` with others
- Commit `.env.test` to git
- Paste API keys in chat/tickets
- Use production keys in `.env.test`
- Leave expired keys in the file

---

## 👥 Team Setup

### For Each Team Member

1. Clone the repo (`.env.test` not included)
2. Run setup wizard:

   ```bash
   ./setup-liteapi-tests.sh
   ```

3. Enter their own sandbox API key
4. Tests run with their credentials

### For CI/CD (GitHub Actions, etc.)

1. Add `LITEAPI_API_KEY` as a repository secret
2. Tests automatically use it from environment
3. No `.env.test` file needed

---

## 📖 Quick Reference

| Task | Command |
|------|---------|
| **Quick Setup** | `./setup-liteapi-tests.sh` |
| **Manual Setup** | `cp .env.test.example .env.test && nano .env.test` |
| **Run Tests** | `npm run test:api:liteapi` |
| **Verbose Output** | `VERBOSE=true npm run test:api:liteapi` |
| **Different City** | `LITEAPI_TEST_CITY=London npm run test:api:liteapi` |
| **Check Config** | `cat .env.test` |
| **Verify Key Set** | `echo $LITEAPI_API_KEY` |
| **See All Options** | `cat .env.test.example` |

---

## 🎯 Next Steps

After setup is complete:

1. **Run tests**: `npm run test:api:liteapi`
2. **Review results**: Check all 7 E2E steps pass
3. **Run orchestrator**: `npm run test:api:liteapi:orchestrator`
4. **Review docs**: See integration guides in `docs/integrations/`

---

## 💡 Examples

### Example 1: Standard Local Setup

```bash
# Run once
./setup-liteapi-tests.sh
# → Enter API key when prompted
# → Answer test preferences

# Then just run tests
npm run test:api:liteapi
npm run test:api:liteapi  # <-- Works indefinitely!
```

### Example 2: Manual Setup with Nano

```bash
cp .env.test.example .env.test
nano .env.test  # Edit LITEAPI_API_KEY line
npm run test:api:liteapi
```

### Example 3: Using Environment Variable

```bash
# One-time test with direct key
LITEAPI_API_KEY=sand_... npm run test:api:liteapi

# Or set it temporarily
export LITEAPI_API_KEY=sand_...
npm run test:api:liteapi
npm run test:api:liteapi  # Still works
```

### Example 4: Secrets File Approach

```bash
mkdir -p secrets
echo "sand_your_key_here" > secrets/liteapi_api_key.txt
npm run test:api:liteapi  # Automatically uses secrets file
```

---

## 📞 Support

Need help? Check these resources:

- **Setup Issues**: See [LITEAPI_COMPLETE_SETUP.md](./LITEAPI_COMPLETE_SETUP.md)
- **Test Failures**: See [API_INTEGRATION_TESTING_GUIDE.md](./docs/API_INTEGRATION_TESTING_GUIDE.md)
- **Orchestrator**: See [HOTEL_BOOKING_WORKFLOW_ORCHESTRATOR_GUIDE.md](./docs/integrations/HOTEL_BOOKING_WORKFLOW_ORCHESTRATOR_GUIDE.md)
- **LiteAPI Docs**: <https://docs.liteapi.travel>

---

## ✨ Summary

**Option C (`.env.test` Setup)** provides:

✅ **Zero ongoing management** - Set once, use forever  
✅ **Automatic detection** - No need to set env vars  
✅ **Secure by default** - Already in .gitignore  
✅ **Team-friendly** - Each person uses their own key  
✅ **Production-ready** - Used the same way as real `.env` files  

**Time to setup**: ~2 minutes  
**Time to run tests**: ~8 seconds  
**Time to configure next time**: 0 seconds  

---

**Ready to get started?**

```bash
./setup-liteapi-tests.sh
```

Then:

```bash
npm run test:api:liteapi
```

That's it! 🎉
