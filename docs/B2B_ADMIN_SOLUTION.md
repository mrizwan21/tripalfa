# B2B Admin API Gateway Integration - Solutions

## 🔍 The Problem

Your **b2b-admin** calls `/admin/*` endpoints, but Kong is configured for microservice routes.

**B2B Admin API calls:**
- `/admin/search`
- `/admin/bookings`
- `/admin/customers`
- `/admin/suppliers`
- `/admin/permissions`

**Kong configured routes:**
- `/inventory/*`
- `/booking/*`
- `/users/*`
- `/payments/*`

## ✅ Recommended Solution

**Bypass Kong for B2B Admin** - Use direct backend connection

### Steps:
1. Create `.env` file in `apps/b2b-admin/`:
```bash
VITE_USE_API_GATEWAY=false
```

2. This will make b2b-admin use `baseURL: '/api'` which proxies through its own Express server at port 5000

3. B2B Admin architecture:
```
Browser → b2b-admin server (port 5000) → Backend microservices
```

4. Restart b2b-admin:
```bash
cd apps/b2b-admin
npm run dev
```

## 🔧 Alternative: Add Admin Route to Kong

If you have a dedicated admin-api service, add it to Kong:

```bash
# Create admin service (replace PORT with your admin API port)
curl -X POST http://localhost:8001/services \
  --data "name=admin-service" \
  --data "url=http://host.docker.internal:PORT"

# Create admin route  
curl -X POST http://localhost:8001/services/admin-service/routes \
  --data "name=admin-route" \
  --data "paths[]=/admin" \
  --data "strip_path=false"
```

## 📊 Summary

- **Booking Engine** → Use Kong ✅ (calls `/booking`, `/inventory` directly)
- **B2B Admin** → Bypass Kong ✅ (has its own admin API pattern)

This is actually a better architecture - booking-engine uses the public API gateway, while b2b-admin uses its own admin-specific backend.
