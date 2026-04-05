# TripAlfa Development - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Step 1: Verify Everything is Ready

```bash
# Check local environment file
ls -la .env.local

# Optional: verify API gateway if already up
curl http://localhost:3000/health
```

### Step 2: Start All Services

```bash
# From project root
./start-all-services.sh

# Wait for the success message:
# ✅ All services started successfully!
```

### Step 3: Open Your Applications

Open these in your browser:

1. **Admin Dashboard**: <http://localhost:5173>
2. **Booking Engine**: <http://localhost:5174>
3. **API Gateway**: <http://localhost:3000>

### Step 4: Make Code Changes

Edit any file in:

- `services/` - Backend services
- `apps/` - Frontend applications

Changes appear instantly with hot reload! ⚡

### Step 5: View Logs (If Needed)

```bash
# See all service logs
tail -f logs/*.log

# See specific service
tail -f logs/booking-service.log
```

### Step 6: Stop Services

When you're done:

```bash
./stop-all-services.sh
```

Local environment settings remain available for next session.

---

## 📋 All Services & Ports

### Backend Services (Running Locally)

- booking-service: <http://localhost:3001>
- user-service: <http://localhost:3003>
- payment-service: <http://localhost:3007>
- organization-service: <http://localhost:3006>
- wallet-service: <http://localhost:3008>
- notification-service: <http://localhost:3009>
- rule-engine-service: <http://localhost:3010>
- kyc-service: <http://localhost:3011>
- marketing-service: <http://localhost:3012>
- b2b-admin-service: <http://localhost:3020>
- booking-engine-service: <http://localhost:3021>

### Frontend Applications (Running Locally)

- b2b-admin: <http://localhost:5173>
- booking-engine: <http://localhost:5174>

### Core Infrastructure (Running Locally)

- API Gateway: <http://localhost:3000>
- Static Database: localhost:5433

---

## 🆘 Common Issues

### "Port already in use"

```bash
# Find what's using the port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in .env.local
USER_SERVICE_PORT=3033
```

### "Services won't start"

```bash
# Check logs
tail -f logs/*.log

# Check if .env.local exists
ls -la .env.local
```

### "Can't connect to service"

```bash
# Test health endpoint
curl http://localhost:3001/health

# Check if service is running
ps aux | grep pnpm
```

---

## 💡 Pro Tips

1. **Start only what you need** - Don't start all services if developing just one:

   ```bash
   cd services/user-service
   pnpm dev
   ```

2. **Monitor in real-time** - Use multiple terminals:

   ```bash
   # Terminal 1: Watch logs
   tail -f logs/*.log

   # Terminal 2: Keep this running
   ./start-all-services.sh

   # Terminal 3: Edit code in editor
   ```

3. **Debug in VS Code** - Services run with debug enabled
   - Set breakpoints in VS Code
   - Services will pause when hit
   - Inspect variables in real-time

4. **Check service health** - Quick health check script:

   ```bash
   for port in 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
     curl -s http://localhost:$port/health | jq '.' 2>/dev/null && echo "Port $port: OK" || echo "Port $port: FAILED"
   done
   ```

---

## 📚 Need More Details?

- **Full Development Guide**: See `LOCAL_DEVELOPMENT.md`
- **Port Reference**: See `services-port-reference.md`
- **Architecture Overview**: See `docs/architecture/BACKEND_SERVICES.md`

---

## ⚡ Development Workflow

```text
Edit Code → Hot Reload → Browser Updates → See Changes → Debug if Needed → Commit
(instant)   (instant)      (instant)       (instant)    (integrated)      (local)
```

That's it! You're ready to develop faster than ever. 🚀

---

**Last Updated**: March 5, 2026
**Status**: ✅ Complete and Ready
**All Services**: 14 Active
**Development Mode**: Process-first local runtime
